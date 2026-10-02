/**
 * Statistics-card contract shared by the plugin's two halves.
 *
 * The host half folds every stored session log into one sparse summary per
 * session (a project unit of the host's own projection seam, so incremental
 * folding and durable checkpoints stay the host's business) and aggregates
 * those summaries into a {@link StatsSnapshot}. The browser half reads that
 * snapshot from the host's authenticated route and paints the card. Both
 * halves import this file, so the wire vocabulary lives here rather than in
 * either half.
 */

/** Authenticated host route serving {@link StatsSnapshot}. */
export const STATS_PATH = '/api/ccd-stats';

/** Snapshot revision; a client that does not know the version ignores the body. */
export const STATS_VERSION = 1;

/** Days of history one snapshot ships; the card itself draws 26 weeks. */
export const STATS_DAY_LIMIT = 366;

/** One local calendar day (`YYYY-MM-DD`) and its prompt count. */
export type StatsDay = readonly [string, number];

/** One local hour and its prompt count. */
export type StatsHour = readonly [number, number];

/** One `provider/model` and the tokens attributed to it. */
export type StatsModel = readonly [string, number];

/** One session's contribution to the aggregate. */
export interface StatsSessionUsage {
  /** Human prompts: `user/message` events whose source kind is `user`. */
  readonly prompts: number;
  /** Tokens at the provider's scale, cache hits included. */
  readonly tokens: number;
  /** Per local day, sparse; only days with prompts appear. */
  readonly days: readonly StatsDay[];
  /** Per local hour, sparse; only hours with prompts appear. */
  readonly hours: readonly StatsHour[];
  /** Per model, sparse; a message before the first header lands in `unknown`. */
  readonly models: readonly StatsModel[];
}

/** Everything the card needs, aggregated over every visible stored session. */
export interface StatsSnapshot {
  readonly version: number;
  /** Sessions that produced work of their own; fork-inherited prefixes do not count. */
  readonly sessions: number;
  readonly messages: number;
  readonly tokens: number;
  readonly activeDays: number;
  readonly busyHour: number | null;
  readonly topModel: string | null;
  /** Local days and prompt counts, oldest first, capped at {@link STATS_DAY_LIMIT}. */
  readonly days: readonly StatsDay[];
  /** Sessions still being folded; the card polls faster while this is non-zero. */
  readonly pending: number;
  /** Sessions whose logs could not be read and are therefore missing from the totals. */
  readonly missed: number;
  /** When the host computed this snapshot (epoch ms). */
  readonly computedAt: number;
}

/** Whether a value is a finite, non-negative count. */
function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/** Read one `[key, count]` pair list, dropping anything that is not a count. */
function readPairs<K>(value: unknown, key: (raw: string) => K | null): readonly (readonly [K, number])[] {
  if (!Array.isArray(value)) return [];
  const pairs: (readonly [K, number])[] = [];
  for (const entry of value) {
    if (!Array.isArray(entry) || entry.length !== 2) continue;
    const [rawKey, count] = entry as [unknown, unknown];
    if (typeof rawKey !== 'string' || !isCount(count)) continue;
    const parsed = key(rawKey);
    if (parsed === null) continue;
    pairs.push([parsed, count] as const);
  }
  return pairs;
}

/**
 * Narrow one `YYYY-MM-DD` key. The host writes local days; the browser only
 * ever echoes them back, so the shape is checked and the value is not.
 *
 * @param raw - candidate day key.
 * @returns the key, or null when it is not a calendar day.
 */
function readDayKey(raw: string): string | null {
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

/**
 * Read one snapshot from untrusted JSON.
 *
 * The browser half treats the host route as the one data source it does not
 * compile against, so the response is validated structurally before it can
 * reach the card: a body that is not a snapshot at this version is refused and
 * the card simply stays hidden.
 *
 * @param value - parsed response body.
 * @returns the snapshot, or null when the body is not one.
 */
export function readStatsSnapshot(value: unknown): StatsSnapshot | null {
  if (typeof value !== 'object' || value === null) return null;
  const raw = value as Record<string, unknown>;
  if (raw['version'] !== STATS_VERSION) return null;
  const sessions = raw['sessions'];
  const messages = raw['messages'];
  const tokens = raw['tokens'];
  const activeDays = raw['activeDays'];
  const pending = raw['pending'];
  const missed = raw['missed'];
  const computedAt = raw['computedAt'];
  const busyHour = raw['busyHour'];
  const topModel = raw['topModel'];
  if (!isCount(sessions) || !isCount(messages) || !isCount(tokens) || !isCount(activeDays)) return null;
  if (!isCount(pending) || !isCount(missed)) return null;
  if (!isCount(computedAt)) return null;
  if (busyHour !== null && (!isCount(busyHour) || busyHour > 23)) return null;
  if (topModel !== null && typeof topModel !== 'string') return null;
  return {
    version: STATS_VERSION,
    sessions,
    messages,
    tokens,
    activeDays,
    busyHour,
    topModel,
    days: readPairs(raw['days'], readDayKey),
    pending,
    missed,
    computedAt,
  };
}
