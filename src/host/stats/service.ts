/**
 * Host half of the statistics card: one projection unit, one aggregate, one
 * authenticated route.
 *
 * Reading strategy (the host's own read ladder, in order of cost):
 *
 * 1. A **live** session is read through `ctx.sessionProjections.snapshot`,
 *    which folds the in-memory log lazily and is otherwise free.
 * 2. A **cold** session is read through `ctx.sessionProjectionCache`, the
 *    durable checkpoint the host already writes for every session. This is
 *    the zero-I/O face, so a warm install answers the card without touching a
 *    single session log.
 * 3. A session with no usable checkpoint is folded once in the background
 *    through a persistence read handle; the fold writes its checkpoint back,
 *    so the next request is case 2 again. Failures are contained per session
 *    and retried after a cooldown.
 *
 * Delivery is the host's authenticated fetch registry, not a bare web-server
 * route: `ctx.connection.fetch` applies the browser trust fence and the
 * session cookie before the handler runs, so this plugin never hand-rolls an
 * access check. Both services are optional at runtime — without them the card
 * simply stays hidden.
 */
import type { Context } from '@deepseek-ai/cordis';
import type { Session, SessionHeader } from '@deepseek-ai/dsh-session';
import type { SessionPersistence, SessionHandle } from '@deepseek-ai/dsh-session-persistence';
import type { SessionProjectionRegistry, ProjectionSnapshot } from '@deepseek-ai/dsh-session-projection';
import type { SessionQueryEngine, SessionRecord } from '@deepseek-ai/dsh-session-query';
import { STATS_PATH, type StatsSessionUsage, type StatsSnapshot } from '../../shared/stats.ts';
import { PLUGIN_ID } from '../../shared/identity.ts';
import { aggregateUsage } from './aggregate.ts';
import { USAGE_KEY, usageProjection } from './unit.ts';

/** Sessions folded at once; cold logs decompress on the host's thread pool. */
const FOLD_CONCURRENCY = 4;

/** How long a failed fold stays out of the queue, ms. */
const RETRY_COOLDOWN_MS = 60_000;

/** The durable checkpoint face of `@deepseek-ai/dsh-session-projection-cache` (not in our type baseline). */
interface ProjectionCache {
  /** Whole values viewed from the stored rows, or undefined without a usable record. */
  cachedSnapshot(meta: SessionHeader, keys?: readonly string[]): ProjectionSnapshot | undefined;
  /** Fold a complete log, refreshing the stored checkpoint. */
  coldSnapshot(meta: SessionHeader, inheritedEventCount: number, events: readonly unknown[]): ProjectionSnapshot;
}

/** The authenticated exact-route registry of `@deepseek-ai/dsh-client-connection` (not in our type baseline). */
interface AuthRouteRegistry {
  register(route: {
    readonly path: string;
    readonly methods: readonly string[];
    readonly requestBody: 'buffered' | 'streaming';
    readonly fetch: (request: Request) => Promise<Response>;
  }): () => Promise<void>;
}

/** Sink for contained failures; the card never fails loudly. */
type Warn = (message: string, error?: unknown) => void;

/** One stored session the aggregate wants a value for. */
interface Candidate {
  readonly header: SessionHeader;
  readonly live: boolean;
}

/**
 * Cross-session state: the current per-session values plus the progress
 * counters the card uses to decide how fast to poll.
 */
class UsageAggregator {
  private readonly ctx: Context;
  private readonly warn: Warn;
  private readonly values = new Map<string, StatsSessionUsage>();
  private readonly queued: Candidate[] = [];
  private readonly folding = new Set<string>();
  private readonly failures = new Map<string, number>();
  private running = 0;
  private refreshRun: Promise<StatsSnapshot> | null = null;
  private snapshot: StatsSnapshot | null = null;
  private disposed = false;

  constructor(ctx: Context, warn: Warn) {
    this.ctx = ctx;
    this.warn = warn;
  }

  /** The most recent snapshot; an empty one before the first refresh. */
  get current(): StatsSnapshot {
    return this.snapshot ?? aggregateUsage([], { now: Date.now(), pending: 0, missed: 0 });
  }

  /**
   * Bring the snapshot up to date.
   *
   * The listing pass is cheap (projection reads only) and serialized, so
   * several polling browsers share one pass; cold folds continue in the
   * background and land in later snapshots.
   *
   * @returns the snapshot as of this pass.
   */
  refresh(): Promise<StatsSnapshot> {
    const running = this.refreshRun;
    if (running !== null) return running;
    const run = this.pass().finally(() => {
      if (this.refreshRun === run) this.refreshRun = null;
    });
    this.refreshRun = run;
    return run;
  }

  /** Stop folding; in-flight reads settle but no longer publish. */
  dispose(): void {
    this.disposed = true;
    this.queued.length = 0;
  }

  private async pass(): Promise<StatsSnapshot> {
    try {
      const candidates = await this.list();
      /* A session that left the listing left the library: drop its numbers (and
         its failure mark) so the totals describe what is actually stored. A
         session that merely failed this pass keeps its last value. */
      const listed = new Set<string>(candidates.map(candidate => candidate.header.id));
      for (const id of [...this.values.keys()]) if (!listed.has(id)) this.values.delete(id);
      for (const id of [...this.failures.keys()]) if (!listed.has(id)) this.failures.delete(id);
      for (const candidate of candidates) {
        if (this.disposed) break;
        const value = this.readSafely(candidate);
        if (value === undefined) this.enqueue(candidate);
        else this.values.set(candidate.header.id, value);
      }
    } catch (error) {
      this.warn('session listing failed; the card keeps the last snapshot', error);
    }
    this.publish();
    return this.current;
  }

  /** Every stored session the card counts, newest first. */
  private async list(): Promise<readonly Candidate[]> {
    const query = this.ctx.get('sessionQuery') as SessionQueryEngine | undefined;
    if (query !== undefined) {
      const records: readonly SessionRecord[] = await query.listSessions();
      return records
        .filter(record => record.header.cwd !== undefined)
        .map(record => ({ header: record.header, live: record.live }));
    }
    const persistence = this.ctx.get('sessionPersistence') as SessionPersistence | undefined;
    if (persistence === undefined) return [];
    const snapshots = await persistence.list();
    return snapshots
      .filter(snapshot => snapshot.header.cwd !== undefined)
      .map(snapshot => ({ header: snapshot.header, live: false }));
  }

  /**
   * Read one session's value without letting a single failure drop the pass.
   *
   * A live session's projection read can throw (a host-side projection bug, a
   * log the registry cannot advance across); that must cost this session's
   * numbers, not every session's.
   */
  private readSafely(candidate: Candidate): StatsSessionUsage | undefined {
    try {
      return this.read(candidate);
    } catch (error) {
      this.warn(`projection read failed for session ${candidate.header.id}`, error);
      return undefined;
    }
  }

  /** Zero-I/O read: the live registry for a live session, the durable cache for a cold one. */
  private read(candidate: Candidate): StatsSessionUsage | undefined {
    const projections = this.ctx.get('sessionProjections') as SessionProjectionRegistry | undefined;
    if (projections === undefined) return undefined;
    if (candidate.live) {
      const session = (this.ctx.get('sessions') as { get(id: string): Session | undefined } | undefined)
        ?.get(candidate.header.id);
      if (session !== undefined) {
        return projections.snapshot(session, [USAGE_KEY]).values[USAGE_KEY];
      }
    }
    const cache = this.ctx.get('sessionProjectionCache') as ProjectionCache | undefined;
    return cache?.cachedSnapshot(candidate.header, [USAGE_KEY])?.values[USAGE_KEY];
  }

  /** Queue one cold fold unless it is already queued, running, or cooling down. */
  private enqueue(candidate: Candidate): void {
    const id = candidate.header.id;
    if (this.folding.has(id) || this.queued.some(entry => entry.header.id === id)) return;
    const failedAt = this.failures.get(id);
    if (failedAt !== undefined && Date.now() - failedAt < RETRY_COOLDOWN_MS) return;
    this.queued.push(candidate);
    this.pump();
  }

  /** Keep at most {@link FOLD_CONCURRENCY} folds in flight. */
  private pump(): void {
    while (!this.disposed && this.running < FOLD_CONCURRENCY) {
      const candidate = this.queued.shift();
      if (candidate === undefined) return;
      const id = candidate.header.id;
      this.folding.add(id);
      this.running += 1;
      void this.fold(candidate).finally(() => {
        this.folding.delete(id);
        this.running -= 1;
        this.publish();
        this.pump();
      });
    }
  }

  /** Fold one cold session once, refreshing its durable checkpoint. */
  private async fold(candidate: Candidate): Promise<void> {
    const persistence = this.ctx.get('sessionPersistence') as SessionPersistence | undefined;
    const cache = this.ctx.get('sessionProjectionCache') as ProjectionCache | undefined;
    if (persistence === undefined || cache === undefined) return;
    let handle: SessionHandle | undefined;
    try {
      handle = await persistence.open(candidate.header.id, 'read');
      const { events } = await handle.read(0);
      const block = cache.coldSnapshot(handle.header, handle.inheritedEventCount, events);
      const value = block.values[USAGE_KEY];
      if (this.disposed) return;
      if (value === undefined) {
        this.failures.set(candidate.header.id, Date.now());
        return;
      }
      this.values.set(candidate.header.id, value);
      this.failures.delete(candidate.header.id);
    } catch (error) {
      this.failures.set(candidate.header.id, Date.now());
      this.warn(`fold failed for session ${candidate.header.id}`, error);
    } finally {
      if (handle !== undefined) {
        try {
          await handle.close();
        } catch {
          /* a read handle that fails to close frees itself with the backend */
        }
      }
    }
  }

  /** Recompute the snapshot from the values read so far. */
  private publish(): void {
    if (this.disposed) return;
    this.snapshot = aggregateUsage(this.values.values(), {
      now: Date.now(),
      pending: this.queued.length + this.running,
      missed: this.failures.size,
    });
  }
}

/**
 * Mount the aggregation and its route, once the host services it needs exist.
 *
 * A plugin's `apply` runs as soon as its own fiber starts, which can be before
 * the session projection registry and the connection carrier: the optional
 * injection below waits for both, and a deployment that mounts neither simply
 * never gets the card.
 *
 * @param ctx - host plugin context.
 * @param isEnabled - current plugin switch, read at mount time.
 */
export function mountStatistics(ctx: Context, isEnabled: () => boolean): void {
  ctx.inject(['sessionProjections', 'connection'], injected => {
    if (!isEnabled()) return;
    const projections = injected.get('sessionProjections') as SessionProjectionRegistry | undefined;
    const routes = injected.get('connection') as { fetch: AuthRouteRegistry } | undefined;
    if (projections === undefined || routes === undefined) return;

    const warn: Warn = (message, error) => {
      try {
        console.warn(`[${PLUGIN_ID}] statistics: ${message}`, error);
      } catch {
        /* logging must never throw */
      }
    };

    /* The registration is an effect on this fiber: unloading the plugin
       removes the key and its cells again. */
    projections.register(usageProjection);
    const aggregator = new UsageAggregator(injected, warn);

    ctx.effect(() => routes.fetch.register({
      path: STATS_PATH,
      methods: ['GET'],
      requestBody: 'buffered',
      fetch: async () => {
        const snapshot = await aggregator.refresh();
        return new Response(JSON.stringify(snapshot), {
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store',
          },
        });
      },
    }), 'statistics: snapshot route');

    ctx.effect(() => () => aggregator.dispose(), 'statistics: aggregation');
  });
}
