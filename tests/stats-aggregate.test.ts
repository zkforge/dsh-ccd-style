import assert from 'node:assert/strict';
import { test } from 'node:test';
import { STATS_DAY_LIMIT } from '../src/shared/stats.ts';
import type { StatsSessionUsage } from '../src/shared/stats.ts';
import { aggregateUsage } from '../src/host/stats/aggregate.ts';
import { UNKNOWN_MODEL } from '../src/host/stats/unit.ts';

function usage(overrides: Partial<StatsSessionUsage> = {}): StatsSessionUsage {
  return { prompts: 0, tokens: 0, days: [], hours: [], models: [], ...overrides };
}

const OPTIONS = { now: 1_790_000_000_000, pending: 0, missed: 0 };

test('an empty corpus aggregates to an empty snapshot', () => {
  const snapshot = aggregateUsage([], OPTIONS);
  assert.equal(snapshot.sessions, 0);
  assert.equal(snapshot.messages, 0);
  assert.equal(snapshot.tokens, 0);
  assert.equal(snapshot.activeDays, 0);
  assert.equal(snapshot.busyHour, null);
  assert.equal(snapshot.topModel, null);
  assert.deepEqual(snapshot.days, []);
  assert.equal(snapshot.computedAt, OPTIONS.now);
});

test('sessions without work of their own do not count', () => {
  const snapshot = aggregateUsage([
    usage({ prompts: 2, tokens: 10 }),
    usage(),
    usage({ tokens: 5 }),
  ], OPTIONS);
  assert.equal(snapshot.sessions, 2);
  assert.equal(snapshot.messages, 2);
  assert.equal(snapshot.tokens, 15);
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
    usage({ prompts: 1, tokens: 1, days: old }),
    usage({ prompts: 3, tokens: 1, days: [['2026-09-30', 3], ['2026-09-29', 1]] }),
  ], OPTIONS);
  assert.equal(snapshot.activeDays, old.length + 2);
  assert.equal(snapshot.days.length, STATS_DAY_LIMIT);
  assert.deepEqual(snapshot.days.at(-1), ['2026-09-30', 3]);
  assert.equal(snapshot.days[0]?.[0], '2024-02-06');
});

test('the busiest hour wins, ties go to the earliest hour', () => {
  assert.equal(aggregateUsage([
    usage({ prompts: 3, hours: [[11, 1], [3, 4]] }),
  ], OPTIONS).busyHour, 3);
  assert.equal(aggregateUsage([
    usage({ prompts: 2, hours: [[11, 1]] }),
    usage({ prompts: 2, hours: [[9, 1]] }),
  ], OPTIONS).busyHour, 9);
  assert.equal(aggregateUsage([usage({ tokens: 5 })], OPTIONS).busyHour, null);
});

test('the favourite model ignores the unknown bucket and breaks ties by name', () => {
  assert.equal(aggregateUsage([
    usage({ tokens: 5, models: [[UNKNOWN_MODEL, 100], ['a/one', 3]] }),
  ], OPTIONS).topModel, 'a/one');
  assert.equal(aggregateUsage([
    usage({ tokens: 5, models: [['b/two', 7]] }),
    usage({ tokens: 5, models: [['a/one', 7]] }),
  ], OPTIONS).topModel, 'a/one');
  assert.equal(aggregateUsage([usage({ tokens: 5, models: [[UNKNOWN_MODEL, 9]] })], OPTIONS).topModel, null);
});

test('progress counters pass through untouched', () => {
  const snapshot = aggregateUsage([usage({ tokens: 1 })], { now: 5, pending: 7, missed: 2 });
  assert.equal(snapshot.pending, 7);
  assert.equal(snapshot.missed, 2);
  assert.equal(snapshot.version, 1);
});
