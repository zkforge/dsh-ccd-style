/**
 * Cross-session aggregation: many per-session fold results → one card snapshot.
 *
 * Pure and synchronous, so the numbers the card shows are testable without a
 * host: the service layer owns the session listing, the cold reads and the
 * transport, this file owns only the arithmetic.
 *
 * Totals are all-time, which is what the reference's `All` range means (its
 * heatmap is a fixed 182-day window drawn from the same totals). The one
 * bounded output is the shipped day list: `activeDays` counts every active
 * day, while `days` carries only the most recent {@link STATS_DAY_LIMIT} so a
 * long-lived install cannot grow the response without limit.
 */
import {
  STATS_DAY_LIMIT, STATS_VERSION,
  type StatsDay, type StatsSessionUsage, type StatsSnapshot,
} from '../../shared/stats.ts';
import { HOURS_PER_DAY, UNKNOWN_MODEL } from './unit.ts';

/** Counters the aggregate needs from outside the fold. */
export interface AggregateOptions {
  /** Computation time, epoch ms. */
  readonly now: number;
  /** Sessions still being folded. */
  readonly pending: number;
  /** Sessions whose logs could not be read. */
  readonly missed: number;
}

/** Bump one counter in a map. */
function bump(counts: Map<string, number>, key: string, amount: number): void {
  counts.set(key, (counts.get(key) ?? 0) + amount);
}

/**
 * Sum one session's view into the running totals.
 *
 * @param value - one session's contribution.
 * @param totals - mutable accumulator.
 */
function addSession(value: StatsSessionUsage, totals: {
  sessions: number;
  messages: number;
  tokens: number;
  days: Map<string, number>;
  hours: Map<number, number>;
  models: Map<string, number>;
}): void {
  const working = value.prompts > 0 || value.tokens > 0;
  if (!working) return;
  totals.sessions += 1;
  totals.messages += value.prompts;
  totals.tokens += value.tokens;
  for (const [day, count] of value.days) bump(totals.days, day, count);
  for (const [hour, count] of value.hours) totals.hours.set(hour, (totals.hours.get(hour) ?? 0) + count);
  for (const [model, count] of value.models) bump(totals.models, model, count);
}

/** Highest-scoring key, ties broken by the smallest key so the answer is stable. */
function peak(counts: Map<string, number>, skip?: string): string | null {
  let best: string | null = null;
  let bestCount = 0;
  for (const [key, count] of counts) {
    if (key === skip || count <= 0) continue;
    if (count > bestCount || (count === bestCount && best !== null && key < best)) {
      best = key;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Aggregate every session's fold result into the card's snapshot.
 *
 * @param values - one view per visible stored session.
 * @param options - computation time and the service's progress counters.
 * @returns the snapshot the route serves.
 */
export function aggregateUsage(
  values: Iterable<StatsSessionUsage>,
  options: AggregateOptions,
): StatsSnapshot {
  const totals = {
    sessions: 0,
    messages: 0,
    tokens: 0,
    days: new Map<string, number>(),
    hours: new Map<number, number>(),
    models: new Map<string, number>(),
  };
  for (const value of values) addSession(value, totals);

  const allDays = [...totals.days.entries()]
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));
  const shipped: StatsDay[] = allDays.slice(-STATS_DAY_LIMIT);
  const topModel = peak(totals.models, UNKNOWN_MODEL);

  /* Hours compare numerically, so the earliest hour wins a tie. */
  let busyHour: number | null = null;
  let busyCount = 0;
  for (let hour = 0; hour < HOURS_PER_DAY; hour += 1) {
    const count = totals.hours.get(hour) ?? 0;
    if (count > busyCount) {
      busyHour = hour;
      busyCount = count;
    }
  }

  return {
    version: STATS_VERSION,
    sessions: totals.sessions,
    messages: totals.messages,
    tokens: totals.tokens,
    activeDays: allDays.length,
    busyHour,
    topModel,
    days: shipped,
    pending: options.pending,
    missed: options.missed,
    computedAt: options.now,
  };
}
