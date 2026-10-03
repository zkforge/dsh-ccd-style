import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  STATS_DAY_LIMIT, STATS_RANGES, STATS_VERSION, rangeStart, type StatsSessionUsage,
} from '../src/shared/stats.ts';
import { aggregateUsage } from '../src/host/stats/aggregate.ts';
import { UNKNOWN_MODEL } from '../src/host/stats/unit.ts';

function usage(overrides: Partial<StatsSessionUsage> = {}): StatsSessionUsage {
  return { prompts: 0, tokens: 0, days: [], hours: [], models: [], modelDays: [], ...overrides };
}

/** Noon on a known local day: 2026-09-30, so `30d` starts 2026-09-01. */
const NOW = new Date(2026, 8, 30, 12, 0, 0).getTime();
const OPTIONS = { now: NOW, pending: 0, missed: 0 };

/** A `[model, tokens, input, output]` row. */
function model(name: string, tokens: number, input = 0, output = 0) {
  return [name, tokens, input, output] as const;
}

test('an empty corpus aggregates to an empty snapshot', () => {
  const snapshot = aggregateUsage([], OPTIONS);
  for (const range of STATS_RANGES) {
    assert.deepEqual(snapshot.ranges[range], {
      sessions: 0, messages: 0, tokens: 0, activeDays: 0, topModel: null, models: [],
    });
  }
  assert.equal(snapshot.busyHour, null);
  assert.deepEqual(snapshot.days, []);
  assert.deepEqual(snapshot.modelDays, []);
  assert.deepEqual(snapshot.modelIO, []);
  assert.equal(snapshot.computedAt, OPTIONS.now);
});

test('sessions without work of their own do not count', () => {
  const snapshot = aggregateUsage([
    usage({ prompts: 2, tokens: 10, days: [['2026-09-30', 2]], models: [model('a/one', 10)], modelDays: [['2026-09-30', 0, 10]] }),
    usage(),
    usage({ tokens: 5, models: [model('b/two', 5)], modelDays: [['2026-09-30', 0, 5]] }),
  ], OPTIONS);
  assert.equal(snapshot.ranges.all.sessions, 2);
  assert.equal(snapshot.ranges.all.messages, 2);
  assert.equal(snapshot.ranges.all.tokens, 15);
});

test('range bounds count back from today inclusive', () => {
  assert.equal(rangeStart('all', NOW), null);
  assert.equal(rangeStart('30d', NOW), '2026-09-01');
  assert.equal(rangeStart('7d', NOW), '2026-09-24');
});

test('each range totals only the days inside it', () => {
  const snapshot = aggregateUsage([
    usage({
      prompts: 3,
      tokens: 100,
      days: [['2026-09-30', 2], ['2026-09-10', 1], ['2026-08-01', 1]],
      models: [model('a/old', 60), model('b/new', 40)],
      modelDays: [['2026-09-30', 1, 40], ['2026-09-10', 0, 30], ['2026-08-01', 0, 30]],
    }),
  ], OPTIONS);
  assert.deepEqual(snapshot.ranges.all, {
    sessions: 1,
    messages: 4,
    tokens: 100,
    activeDays: 3,
    topModel: 'a/old',
    models: [['a/old', 60], ['b/new', 40]],
  });
  assert.deepEqual(snapshot.ranges['30d'], {
    sessions: 1,
    messages: 3,
    tokens: 70,
    activeDays: 2,
    topModel: 'b/new',
    models: [['b/new', 40], ['a/old', 30]],
  });
  assert.deepEqual(snapshot.ranges['7d'], {
    sessions: 1,
    messages: 2,
    tokens: 40,
    activeDays: 1,
    topModel: 'b/new',
    models: [['b/new', 40]],
  });
});

test('a session counts once per range even when it was active on several days', () => {
  /* The reference sums its per-day session counts, which double-counts a
     session that spans days; this card counts distinct sessions instead. */
  const snapshot = aggregateUsage([
    usage({ prompts: 1, tokens: 1, days: [['2026-09-30', 1], ['2026-09-29', 1]], modelDays: [['2026-09-30', 0, 1]] }),
    usage({ prompts: 1, tokens: 1, days: [['2026-09-29', 1]], modelDays: [['2026-09-29', 0, 1]] }),
  ], OPTIONS);
  assert.equal(snapshot.ranges.all.sessions, 2);
  assert.equal(snapshot.ranges['7d'].sessions, 2);
});

test('a token-only day still counts as an active day', () => {
  const snapshot = aggregateUsage([
    usage({ tokens: 5, models: [model('a/one', 5)], modelDays: [['2026-09-28', 0, 5]] }),
  ], OPTIONS);
  assert.equal(snapshot.ranges.all.activeDays, 1);
  assert.equal(snapshot.ranges.all.messages, 0);
  assert.equal(snapshot.ranges.all.sessions, 1);
});

test('days merge across sessions, count every active day, and ship the newest only', () => {
  const old = Array.from({ length: STATS_DAY_LIMIT + 34 }, (_, index) => {
    const date = new Date(2024, 0, 1);
    date.setDate(date.getDate() + index);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return [`${date.getFullYear()}-${month}-${day}`, 1] as const;
  });
  const snapshot = aggregateUsage([
    usage({ prompts: 1, tokens: 1, days: old, models: [model('a/one', 1)], modelDays: old.map(([date]) => [date, 0, 1] as const) }),
    usage({ prompts: 3, tokens: 1, days: [['2026-09-30', 3], ['2026-09-29', 1]] }),
  ], OPTIONS);
  assert.equal(snapshot.ranges.all.activeDays, old.length + 2);
  assert.equal(snapshot.days.length, STATS_DAY_LIMIT);
  assert.deepEqual(snapshot.days.at(-1), ['2026-09-30', 3]);
  assert.equal(snapshot.days[0]?.[0], '2024-02-06');
  /* The chart ships only days the heatmap's own window still carries: the
     oldest 36 of the 400 day rows fall outside the 366-day cutoff. */
  assert.ok(snapshot.modelDays.every(([date]) => date >= '2024-02-06'));
  assert.equal(snapshot.modelDays.at(-1)?.[0], '2025-02-03');
  assert.equal(snapshot.modelDays.length, 364);
});

test('the busiest hour wins, ties go to the earliest hour, and the range never moves it', () => {
  assert.equal(aggregateUsage([
    usage({ prompts: 3, hours: [[11, 1], [3, 4]] }),
  ], OPTIONS).busyHour, 3);
  assert.equal(aggregateUsage([
    usage({ prompts: 2, hours: [[11, 1]] }),
    usage({ prompts: 2, hours: [[9, 1]] }),
  ], OPTIONS).busyHour, 9);
  assert.equal(aggregateUsage([usage({ tokens: 5 })], OPTIONS).busyHour, null);
  const old = aggregateUsage([
    usage({ prompts: 4, tokens: 1, hours: [[3, 9]], days: [['2020-01-01', 4]] }),
    usage({ prompts: 1, tokens: 1, hours: [[22, 1]], days: [['2026-09-30', 1]] }),
  ], OPTIONS);
  assert.equal(old.busyHour, 3);
  assert.equal(old.ranges['7d'].messages, 1);
});

test('the favourite model ignores the unknown bucket and breaks ties by name', () => {
  assert.equal(aggregateUsage([
    usage({ tokens: 103, models: [model(UNKNOWN_MODEL, 100), model('a/one', 3)], modelDays: [['2026-09-30', 1, 3]] }),
  ], OPTIONS).ranges.all.topModel, 'a/one');
  assert.equal(aggregateUsage([
    usage({ tokens: 5, models: [model('b/two', 7)], modelDays: [['2026-09-30', 0, 7]] }),
    usage({ tokens: 5, models: [model('a/one', 7)], modelDays: [['2026-09-30', 0, 7]] }),
  ], OPTIONS).ranges.all.topModel, 'a/one');
  assert.equal(aggregateUsage([
    usage({ tokens: 9, models: [model(UNKNOWN_MODEL, 9)], modelDays: [['2026-09-30', 0, 9]] }),
  ], OPTIONS).ranges.all.topModel, null);
});

test('unknown-model tokens stay in the totals but out of the model list', () => {
  const snapshot = aggregateUsage([
    usage({
      tokens: 100,
      models: [model(UNKNOWN_MODEL, 30), model('a/one', 70)],
      modelDays: [['2026-09-30', 0, 30], ['2026-09-30', 1, 70]],
    }),
  ], OPTIONS);
  assert.equal(snapshot.ranges.all.tokens, 100);
  assert.deepEqual(snapshot.ranges.all.models, [['a/one', 70]]);
  assert.deepEqual(snapshot.modelIO, [['a/one', 0, 0]]);
  assert.deepEqual(snapshot.modelDays, [['2026-09-30', 'a/one', 70], ['2026-09-30', UNKNOWN_MODEL, 30]]);
});

test('the legend counters are lifetime sums, per model', () => {
  const snapshot = aggregateUsage([
    usage({
      tokens: 10,
      models: [model('a/one', 10, 4, 6)],
      modelDays: [['2026-09-30', 0, 10]],
    }),
    usage({
      tokens: 5,
      models: [model('a/one', 5, 2, 3), model('b/two', 0)],
      modelDays: [['2026-09-29', 0, 5]],
    }),
  ], OPTIONS);
  assert.deepEqual(snapshot.modelIO, [['a/one', 6, 9]]);
  assert.deepEqual(snapshot.ranges['7d'].models, [['a/one', 15]]);
});

test('a day row whose model index cannot be resolved is dropped', () => {
  const snapshot = aggregateUsage([
    usage({
      tokens: 10,
      models: [model('a/one', 10)],
      modelDays: [['2026-09-30', 0, 10], ['2026-09-29', 3, 5]],
    }),
  ], OPTIONS);
  assert.deepEqual(snapshot.modelDays, [['2026-09-30', 'a/one', 10]]);
  assert.equal(snapshot.ranges.all.tokens, 10);
});

test('progress counters pass through untouched', () => {
  const snapshot = aggregateUsage([usage({ tokens: 1 })], { now: 5, pending: 7, missed: 2 });
  assert.equal(snapshot.pending, 7);
  assert.equal(snapshot.missed, 2);
  assert.equal(snapshot.version, STATS_VERSION);
  assert.equal(STATS_VERSION, 2);
});
