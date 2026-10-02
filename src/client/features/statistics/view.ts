/**
 * Snapshot → card data: the reference's own presentation rules.
 *
 * The card draws 182 days (26 columns × 7 rows) ending on the Saturday of the
 * current week, with the day rows running Sunday-first — the window the
 * reference computes. Levels are `ceil(count / busiest day * 4)`, and the
 * days after today are transparent rather than empty, which is why the card
 * data carries a `futureFrom` index instead of another level.
 *
 * Numbers are formatted the way the reference formats them, in `en-US`: the
 * card's copy is English, so its separators and its 12-hour clock are too.
 */
import type { StatsDay, StatsSnapshot } from '../../../shared/stats.ts';
import { bookNote } from './books.ts';
import { HEAT_COLUMNS, HEAT_ROWS, heatLevel, type StatsCardData, type StatsTile } from './card.ts';

/** Days the heatmap draws: 26 weeks. */
export const HEAT_DAYS = HEAT_COLUMNS * HEAT_ROWS;

/** The copy is English, so the numbers are formatted for it as well. */
const LOCALE = 'en-US';

const COUNT = new Intl.NumberFormat(LOCALE);
const HOUR = new Intl.DateTimeFormat(LOCALE, { hour: 'numeric' });

/** Placeholder the reference shows for a metric it has no data for. */
const EMPTY = '\u2014';

/** Local `YYYY-MM-DD`, matching the day keys the host ships. */
function dayKeyOf(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * One metric as the reference writes it: `1,556` for counts, and `493.1M` for
 * token totals (one decimal place, trailing `.0` dropped).
 *
 * @param value - the raw count.
 * @returns the display string.
 */
export function formatCount(value: number): string {
  return COUNT.format(Math.round(value));
}

/**
 * Token totals, scaled the way the reference scales them.
 *
 * @param value - raw token total.
 * @returns `493.1M`, `12k`, or a plain count below a thousand.
 */
export function formatTokens(value: number): string {
  const total = Math.max(0, value);
  const units: readonly (readonly [number, string])[] = [[1e9, 'B'], [1e6, 'M'], [1e3, 'k']];
  for (const [scale, suffix] of units) {
    if (total < scale) continue;
    const scaled = Math.round((total / scale) * 10) / 10;
    return `${String(scaled)}${suffix}`;
  }
  return formatCount(total);
}

/**
 * One hour of the day, as the reference labels it (`11 AM`).
 *
 * @param hour - local hour, 0-23.
 * @returns the label.
 */
export function formatHour(hour: number): string {
  return HOUR.format(new Date(2000, 0, 1, hour));
}

/** What the card draws for the 182-day window. */
export interface HeatWindow {
  /** One level per cell, column-major: `column * 7 + row`, Sunday first. */
  readonly heat: readonly number[];
  /** First index drawn after today; those cells stay transparent. */
  readonly futureFrom: number;
}

/**
 * Lay the host's sparse day counts out on the reference's 26-week grid.
 *
 * @param days - local day keys with their counts.
 * @param now - the current instant (injectable for tests).
 * @returns the levels and where "today" ends.
 */
export function heatWindow(days: readonly StatsDay[], now: Date = new Date()): HeatWindow {
  const counts = new Map(days);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(today);
  end.setDate(end.getDate() + (6 - end.getDay()));
  const start = new Date(end);
  start.setDate(start.getDate() - (HEAT_DAYS - 1));

  const raw: number[] = [];
  let peak = 0;
  let futureFrom = HEAT_DAYS;
  for (let index = 0; index < HEAT_DAYS; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const count = date > today ? 0 : counts.get(dayKeyOf(date)) ?? 0;
    if (date > today && futureFrom === HEAT_DAYS) futureFrom = index;
    raw.push(count);
    peak = Math.max(peak, count);
  }
  return { heat: raw.map(count => heatLevel(count, peak)), futureFrom };
}

/**
 * Build everything the card draws for one snapshot.
 *
 * @param snapshot - the host's aggregate.
 * @param random - stable draw for the footer's book choice.
 * @param now - the current instant (injectable for tests).
 * @returns the card data.
 */
export function buildCardData(
  snapshot: StatsSnapshot,
  random: () => number,
  now: Date = new Date(),
): StatsCardData {
  const window = heatWindow(snapshot.days, now);
  const tiles: StatsTile[] = [
    { label: 'Sessions', value: formatCount(snapshot.sessions) },
    { label: 'Messages', value: formatCount(snapshot.messages) },
    { label: 'Total tokens', value: formatTokens(snapshot.tokens) },
    { label: 'Active days', value: formatCount(snapshot.activeDays) },
    { label: 'Peak hour', value: snapshot.busyHour === null ? EMPTY : formatHour(snapshot.busyHour) },
    { label: 'Favorite model', value: snapshot.topModel ?? EMPTY },
  ];
  return {
    tabs: ['Overview'],
    tiles,
    heat: window.heat,
    futureFrom: window.futureFrom,
    note: bookNote(snapshot.tokens, random),
  };
}
