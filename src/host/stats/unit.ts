/**
 * Pure `ccdUsage` fold over committed session events. The host owns watermarks
 * and checkpoints. Skip the inherited prefix of forks, attribute messages to
 * the latest request/header model, and use normalizeUsage token accounting:
 * reasoning is part of output, while cache-inclusive totals and raw in/out
 * counters are retained for the Models view.
 */
import type { TokenUsage } from '@deepseek-ai/dsh-llm';
import type { SessionEvent, SessionHeader, SessionLogOffset } from '@deepseek-ai/dsh-session';
import type { ProjectionDefinition } from '@deepseek-ai/dsh-session-projection';
import type { ZodType } from 'zod';
import type {
  StatsHour, StatsModelDay, StatsModelUsage, StatsSessionUsage,
} from '../../shared/stats.ts';
import { localDayKey } from '../../shared/stats.ts';

declare module '@deepseek-ai/dsh-session-projection/types' {
  interface SessionProjectionStateMap {
    ccdUsage: UsageState;
  }
  interface SessionProjectionMap {
    ccdUsage: StatsSessionUsage;
  }
}

/** Projection key this plugin owns; it must not collide with a host key. */
export const USAGE_KEY = 'ccdUsage';

/** Persisted-cache invalidation version for {@link UsageState}. */
export const USAGE_STATE_VERSION = 2;

/** Bucket for usage that arrived before the session logged its first header. */
export const UNKNOWN_MODEL = 'unknown';

/** Hours in a local day. */
export const HOURS_PER_DAY = 24;

/** One model's counters: cache-inclusive tokens, raw input, raw output. */
export interface ModelUsage {
  /** Tokens at the provider's scale, cache hits included. */
  readonly t: number;
  /** Raw `inputTokens` as the adapter reported them. */
  readonly i: number;
  /** Raw `outputTokens` as the adapter reported them. */
  readonly o: number;
}

/** Fold state: plain JSON, one value per session. */
export interface UsageState {
  /** Events below this seq belong to the fork-inherited prefix, never to this session. */
  readonly seedSeq: number;
  /** Human prompts (`user/message` with source kind `user`). */
  readonly prompts: number;
  /** Tokens at the provider's scale, cache hits included. */
  readonly tokens: number;
  /** Local day key → prompts. */
  readonly days: Readonly<Record<string, number>>;
  /** 24 local-hour buckets → prompts. */
  readonly hours: readonly number[];
  /** `provider/model` → counters. */
  readonly models: Readonly<Record<string, ModelUsage>>;
  /** Local day key → `provider/model` → tokens produced that day. */
  readonly modelDays: Readonly<Record<string, Readonly<Record<string, number>>>>;
  /** Model in effect for the next assembled message. */
  readonly model: string | null;
}

/** Local `YYYY-MM-DD`, the day key the reference heatmap buckets by. */
export { localDayKey as dayKey } from '../../shared/stats.ts';

/**
 * Tokens at the provider's scale for one assembled message.
 *
 * @param usage - the step's reported usage.
 * @returns the message's token total, never negative.
 */
export function rawTokens(usage: TokenUsage): number {
  const total = usage.totalTokens;
  if (typeof total === 'number' && Number.isFinite(total) && total > 0) return total;
  const sum = (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0)
    + (usage.cacheReadTokens ?? 0) + (usage.cacheWriteTokens ?? 0);
  return Number.isFinite(sum) && sum > 0 ? sum : 0;
}

/** A non-negative finite counter, defaulting to zero. */
function counter(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * Empty state for one session.
 *
 * @param _header - immutable session metadata (unused: the fold is event-driven).
 * @param inheritedEventCount - exact fork-inherited prefix length.
 * @returns the initial state.
 */
export function initUsageState(_header: SessionHeader, inheritedEventCount: SessionLogOffset): UsageState {
  return {
    seedSeq: inheritedEventCount,
    prompts: 0,
    tokens: 0,
    days: {},
    hours: new Array<number>(HOURS_PER_DAY).fill(0),
    models: {},
    modelDays: {},
    model: null,
  };
}

/** Bump one counter in a copied record. */
function bumped(record: Readonly<Record<string, number>>, key: string, amount: number): Record<string, number> {
  return { ...record, [key]: (record[key] ?? 0) + amount };
}

/**
 * Advance the fold by one committed event.
 *
 * @param state - state covering every earlier event.
 * @param event - the next committed session event.
 * @returns the next state, or the same reference when the event is not counted.
 */
export function applyUsageEvent(state: UsageState, event: SessionEvent): UsageState {
  if (event.seq < state.seedSeq) return state;
  if (event.type === 'user/message') {
    if (event.data.source.kind !== 'user') return state;
    const hour = new Date(event.time).getHours();
    const hours = state.hours.slice();
    hours[hour] = (hours[hour] ?? 0) + 1;
    return {
      ...state,
      prompts: state.prompts + 1,
      days: bumped(state.days, localDayKey(event.time), 1),
      hours,
    };
  }
  if (event.type === 'assistant/message') {
    const usage = event.data.usage;
    if (usage === undefined) return state;
    const added = rawTokens(usage);
    if (added === 0) return state;
    const model = state.model ?? UNKNOWN_MODEL;
    const day = localDayKey(event.time);
    const previous = state.models[model] ?? { t: 0, i: 0, o: 0 };
    return {
      ...state,
      tokens: state.tokens + added,
      models: {
        ...state.models,
        [model]: {
          t: previous.t + added,
          i: previous.i + counter(usage.inputTokens),
          o: previous.o + counter(usage.outputTokens),
        },
      },
      modelDays: {
        ...state.modelDays,
        [day]: bumped(state.modelDays[day] ?? {}, model, added),
      },
    };
  }
  if (event.type === 'request/header') {
    const config = event.data.header.config;
    const model = `${config.provider}/${config.model}`;
    return model === state.model ? state : { ...state, model };
  }
  return state;
}

/** Sorted `[key, count]` pairs, so the wire value is deterministic. */
function pairs(record: Readonly<Record<string, number>>): readonly (readonly [string, number])[] {
  return Object.entries(record)
    .filter(([, count]) => count > 0)
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));
}

/** Sparse hour buckets, ascending. */
function hourPairs(hours: readonly number[]): readonly StatsHour[] {
  const sparse: StatsHour[] = [];
  for (let hour = 0; hour < hours.length; hour += 1) {
    const count = hours[hour] ?? 0;
    if (count > 0) sparse.push([hour, count]);
  }
  return sparse;
}

/** The model table, sorted by name; day rows index into this list. */
function modelPairs(models: Readonly<Record<string, ModelUsage>>): readonly StatsModelUsage[] {
  return Object.entries(models)
    .filter(([, usage]) => usage.t > 0)
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([model, usage]) => [model, usage.t, usage.i, usage.o] as const);
}

/**
 * The per-day model rows, sorted by day and then model index.
 *
 * @param modelDays - state's day → model → tokens record.
 * @param table - the model table the rows index into.
 * @returns the sparse rows.
 */
function modelDayRows(
  modelDays: Readonly<Record<string, Readonly<Record<string, number>>>>,
  table: readonly StatsModelUsage[],
): readonly StatsModelDay[] {
  const index = new Map(table.map(([model], at) => [model, at]));
  const rows: StatsModelDay[] = [];
  for (const day of Object.keys(modelDays).sort()) {
    const perModel = modelDays[day] ?? {};
    for (const model of Object.keys(perModel).sort()) {
      const at = index.get(model);
      const tokens = perModel[model] ?? 0;
      if (at === undefined || tokens <= 0) continue;
      rows.push([day, at, tokens] as const);
    }
  }
  return rows;
}

/* The registry compares view references with `Object.is` to decide whether a
   changed state is worth publishing to the change feed; one view object per
   state keeps that decision exact and the fan-out small. */
const views = new WeakMap<UsageState, StatsSessionUsage>();

/**
 * Project one state onto the client-visible value.
 *
 * @param state - current fold state.
 * @returns the whole current value, identity-stable for a given state.
 */
export function viewUsage(state: UsageState): StatsSessionUsage {
  const cached = views.get(state);
  if (cached !== undefined) return cached;
  const models = modelPairs(state.models);
  const view: StatsSessionUsage = {
    prompts: state.prompts,
    tokens: state.tokens,
    days: pairs(state.days),
    hours: hourPairs(state.hours),
    models,
    modelDays: modelDayRows(state.modelDays, models),
  };
  views.set(state, view);
  return view;
}

/** The registry declares schema slots as zod schemas but only ever calls `parse`. */
function schemaOf<T>(parse: (value: unknown) => T): ZodType<T> {
  return { parse } as unknown as ZodType<T>;
}

/** Read a finite non-negative number, defaulting to zero. */
function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

/** Read a plain `{ key: count }` object, dropping everything else. */
function readCounts(value: unknown): Record<string, number> {
  const counts: Record<string, number> = {};
  if (typeof value !== 'object' || value === null) return counts;
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    const parsed = count(entry);
    if (parsed > 0) counts[key] = parsed;
  }
  return counts;
}

/** Read the model table, accepting both the current shape and a bare token count. */
function readModels(value: unknown): Record<string, ModelUsage> {
  const models: Record<string, ModelUsage> = {};
  if (typeof value !== 'object' || value === null) return models;
  for (const [model, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry === 'number') {
      const total = count(entry);
      if (total > 0) models[model] = { t: total, i: 0, o: 0 };
      continue;
    }
    if (typeof entry !== 'object' || entry === null) continue;
    const raw = entry as Record<string, unknown>;
    const total = count(raw['t']);
    if (total > 0) models[model] = { t: total, i: count(raw['i']), o: count(raw['o']) };
  }
  return models;
}

/** Read `{ day: { model: tokens } }`, dropping everything else. */
function readModelDays(value: unknown): Record<string, Record<string, number>> {
  const days: Record<string, Record<string, number>> = {};
  if (typeof value !== 'object' || value === null) return days;
  for (const [day, entry] of Object.entries(value as Record<string, unknown>)) {
    const perModel = readCounts(entry);
    if (Object.keys(perModel).length > 0) days[day] = perModel;
  }
  return days;
}

/**
 * Read one persisted state row.
 *
 * Deliberately lenient: the registry's own `ver` check already discards rows
 * from another state version, and a read must never throw into the host's
 * session list or a cold-start fold.
 *
 * @param value - row value from the projection cache.
 * @returns a usable state.
 */
export function readUsageState(value: unknown): UsageState {
  const raw = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>;
  const hours = new Array<number>(HOURS_PER_DAY).fill(0);
  const rawHours = Array.isArray(raw['hours']) ? raw['hours'] : [];
  for (let hour = 0; hour < HOURS_PER_DAY; hour += 1) hours[hour] = count(rawHours[hour]);
  const model = raw['model'];
  return {
    seedSeq: count(raw['seedSeq']),
    prompts: count(raw['prompts']),
    tokens: count(raw['tokens']),
    days: readCounts(raw['days']),
    hours,
    models: readModels(raw['models']),
    modelDays: readModelDays(raw['modelDays']),
    model: typeof model === 'string' && model !== '' ? model : null,
  };
}

/** Read one `[key, count]` pair list into typed pairs. */
function readPairList<K>(value: unknown, key: (raw: unknown) => K | null): readonly (readonly [K, number])[] {
  if (!Array.isArray(value)) return [];
  const list: (readonly [K, number])[] = [];
  for (const entry of value) {
    if (!Array.isArray(entry) || entry.length !== 2) continue;
    const [rawKey, rawCount] = entry as [unknown, unknown];
    const parsedKey = key(rawKey);
    const parsedCount = count(rawCount);
    if (parsedKey === null || parsedCount === 0) continue;
    list.push([parsedKey, parsedCount] as const);
  }
  return list;
}

/**
 * Read one persisted or wire view row.
 *
 * @param value - view value from the projection cache or the change feed.
 * @returns a usable view.
 */
export function readUsageView(value: unknown): StatsSessionUsage {
  const raw = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>;
  const models: StatsModelUsage[] = [];
  if (Array.isArray(raw['models'])) {
    for (const entry of raw['models']) {
      if (!Array.isArray(entry) || entry.length < 4) continue;
      const [model, total, input, output] = entry as [unknown, unknown, unknown, unknown];
      if (typeof model !== 'string' || model === '') continue;
      const tokens = count(total);
      if (tokens === 0) continue;
      models.push([model, tokens, count(input), count(output)] as const);
    }
  }
  const modelDays: StatsModelDay[] = [];
  if (Array.isArray(raw['modelDays'])) {
    for (const entry of raw['modelDays']) {
      if (!Array.isArray(entry) || entry.length !== 3) continue;
      const [day, at, tokens] = entry as [unknown, unknown, unknown];
      if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
      if (typeof at !== 'number' || !Number.isInteger(at) || at < 0 || at >= models.length) continue;
      const counted = count(tokens);
      if (counted === 0) continue;
      modelDays.push([day, at, counted] as const);
    }
  }
  return {
    prompts: count(raw['prompts']),
    tokens: count(raw['tokens']),
    days: readPairList(raw['days'], rawKey =>
      (typeof rawKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawKey) ? rawKey : null)),
    /* Hour keys travel as numbers; a string is accepted for a hand-written row. */
    hours: readPairList(raw['hours'], rawKey => {
      const hour = typeof rawKey === 'number' ? rawKey : Number(rawKey);
      return Number.isInteger(hour) && hour >= 0 && hour < HOURS_PER_DAY ? hour : null;
    }),
    models,
    modelDays,
  };
}

/**
 * The registry's wire-unit shape: the definition with its optional `wire`
 * field made required, which is the overload a client-visible key registers
 * through. Declaring it here keeps `register` callable without a cast.
 */
type WireUnit = Omit<ProjectionDefinition<typeof USAGE_KEY>, 'wire'> & {
  wire: NonNullable<ProjectionDefinition<typeof USAGE_KEY>['wire']>;
};

/** The unit this plugin registers on `ctx.sessionProjections`. */
export const usageProjection: WireUnit = {
  key: USAGE_KEY,
  stateSchema: schemaOf(readUsageState),
  init: initUsageState,
  apply: applyUsageEvent,
  wire: {
    viewSchema: schemaOf(readUsageView),
    view: viewUsage,
  },
  stateVersion: USAGE_STATE_VERSION,
};
