import assert from 'node:assert/strict';
import { test } from 'node:test';
import { STATS_VERSION, readStatsSnapshot, type StatsSnapshot } from '../src/shared/stats.ts';
import { bookNote } from '../src/client/features/statistics/books.ts';
import { HEAT_DAYS, buildCardData, formatCount, formatHour, formatTokens, heatWindow } from '../src/client/features/statistics/view.ts';

/** One instant, so the window assertions hold in any time zone. */
const NOW = new Date(2026, 8, 30, 12, 0, 0);

function snapshot(overrides: Partial<StatsSnapshot> = {}): StatsSnapshot {
  return {
    version: STATS_VERSION,
    sessions: 10,
    messages: 1556,
    tokens: 493_100_000,
    activeDays: 3,
    busyHour: 11,
    topModel: 'opencode-go/deepseek-v4.1-flash',
    days: [],
    pending: 0,
    missed: 0,
    computedAt: 1,
    ...overrides,
  };
}

/** Local day key, the way the host writes them. */
function key(day: number, month = 8, year = 2026): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

test('the window is 26 weeks ending on this week, Sunday first', () => {
  const window = heatWindow([], NOW);
  assert.equal(window.heat.length, HEAT_DAYS);
  assert.equal(window.heat.length, 182);
  const todayIndex = 25 * 7 + NOW.getDay();
  assert.equal(window.futureFrom, todayIndex + 1);
  for (let index = window.futureFrom; index < HEAT_DAYS; index += 1) {
    assert.equal(window.heat[index], 0);
  }
});

test('day counts land on their own weekday row and scale against the busiest day', () => {
  /* The window's own arithmetic, derived independently of the implementation. */
  const end = new Date(NOW);
  end.setDate(end.getDate() + (6 - end.getDay()));
  const start = new Date(end);
  start.setDate(start.getDate() - (HEAT_DAYS - 1));
  const indexOf = (date: Date) =>
    Math.floor(Math.round((date.getTime() - start.getTime()) / 86_400_000) / 7) * 7 + date.getDay();
  const daysAgo = (count: number) => {
    const date = new Date(NOW);
    date.setDate(date.getDate() - count);
    return date;
  };

  const busy = daysAgo(1);
  const quiet = daysAgo(10);
  const window = heatWindow([
    [key(busy.getDate(), busy.getMonth(), busy.getFullYear()), 8],
    [key(quiet.getDate(), quiet.getMonth(), quiet.getFullYear()), 2],
    ['2020-01-01', 99],
  ], NOW);

  assert.equal(window.heat[indexOf(busy)], 4);
  assert.equal(window.heat[indexOf(quiet)], 1);
  assert.equal(window.heat[indexOf(NOW)], 0);
});

test('a window with no activity is entirely empty', () => {
  const window = heatWindow([], NOW);
  assert.deepEqual([...new Set(window.heat)], [0]);
});

test('counts, tokens and hours are written the way the reference writes them', () => {
  assert.equal(formatCount(1556), '1,556');
  assert.equal(formatCount(0), '0');
  assert.equal(formatTokens(493_100_000), '493.1M');
  assert.equal(formatTokens(1_000_000), '1M');
  assert.equal(formatTokens(12_000), '12k');
  assert.equal(formatTokens(1_500), '1.5k');
  assert.equal(formatTokens(999), '999');
  assert.equal(formatTokens(2_500_000_000), '2.5B');
  assert.equal(formatHour(11), '11 AM');
  assert.equal(formatHour(0), '12 AM');
  assert.equal(formatHour(23), '11 PM');
});

test('the card data keeps the reference tile order and hides metrics without data', () => {
  const data = buildCardData(snapshot({ busyHour: null, topModel: null }), () => 0, NOW);
  assert.deepEqual(data.tabs, ['Overview']);
  assert.deepEqual(data.tiles.map(tile => tile.label), [
    'Sessions', 'Messages', 'Total tokens', 'Active days', 'Peak hour', 'Favorite model',
  ]);
  assert.deepEqual(data.tiles.map(tile => tile.value), [
    '10', '1,556', '493.1M', '3', '\u2014', '\u2014',
  ]);
  assert.equal(data.futureFrom, 25 * 7 + NOW.getDay() + 1);
  assert.equal(data.note, 'You\u2019ve used ~22413\u00D7 more tokens than The Little Prince.');
});

test('a total too small for any book hides the footer line', () => {
  const data = buildCardData(snapshot({ tokens: 1000 }), () => 0, NOW);
  assert.equal(data.note, null);
});

test('the book sentence follows the reference rule', () => {
  assert.equal(bookNote(0, () => 0), null);
  assert.equal(bookNote(21_999, () => 0), null);
  assert.equal(bookNote(22_000, () => 0), 'You\u2019ve used about as many tokens as The Little Prince.');
  assert.equal(bookNote(43_999, () => 0), 'You\u2019ve used about as many tokens as The Little Prince.');
  assert.equal(bookNote(493_100_000, () => 0), 'You\u2019ve used ~22413\u00D7 more tokens than The Little Prince.');
  assert.equal(bookNote(493_100_000, () => 0.999), 'You\u2019ve used ~675\u00D7 more tokens than War and Peace.');
  assert.equal(bookNote(500_000, () => 0.999), 'You\u2019ve used about as many tokens as Moby-Dick.');
});

test('the host snapshot is validated before the card trusts it', () => {
  const body = {
    version: STATS_VERSION,
    sessions: 2,
    messages: 5,
    tokens: 9,
    activeDays: 2,
    busyHour: 3,
    topModel: 'p/m',
    days: [['2026-09-30', 4], ['nope', 1]],
    pending: 1,
    missed: 0,
    computedAt: 42,
  };
  const parsed = readStatsSnapshot(body);
  assert.equal(parsed?.tokens, 9);
  assert.deepEqual(parsed?.days, [['2026-09-30', 4]]);
  assert.equal(readStatsSnapshot({ ...body, version: STATS_VERSION + 1 }), null);
  assert.equal(readStatsSnapshot({ ...body, busyHour: 24 }), null);
  assert.equal(readStatsSnapshot({ ...body, tokens: -1 }), null);
  assert.deepEqual(readStatsSnapshot({ ...body, days: 'today' })?.days, []);
  assert.equal(readStatsSnapshot(null), null);
});
