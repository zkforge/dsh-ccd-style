import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { SessionEvent, SessionHeader, SessionLogOffset } from '@deepseek-ai/dsh-session';
import type { TokenUsage } from '@deepseek-ai/dsh-llm';
import {
  UNKNOWN_MODEL, applyUsageEvent, dayKey, initUsageState, rawTokens, readUsageState, readUsageView, viewUsage,
} from '../src/host/stats/unit.ts';

const HEADER = { id: 'session-1' } as unknown as SessionHeader;

/** One local instant, so the assertions hold in any time zone. */
function at(hour: number, minute = 0, day = 30): number {
  return new Date(2026, 8, day, hour, minute).getTime();
}

function event(type: string, seq: number, time: number, data: unknown): SessionEvent {
  return { type, seq, time, data } as unknown as SessionEvent;
}

function usage(counts: Partial<TokenUsage>): TokenUsage {
  return { inputTokens: 0, outputTokens: 0, ...counts };
}

function prompt(seq: number, time: number, source: unknown = { kind: 'user' }): SessionEvent {
  return event('user/message', seq, time, { source, content: [] });
}

function header(seq: number, time: number, provider = 'opencode-go', model = 'deepseek-v4.1-flash'): SessionEvent {
  return event('request/header', seq, time, { header: { config: { provider, model } }, reason: 'initial' });
}

function message(seq: number, time: number, counts: Partial<TokenUsage>): SessionEvent {
  return event('assistant/message', seq, time, { message: {}, stream: [], usage: usage(counts) });
}

/** Fold a list of events from an empty state. */
function fold(events: readonly SessionEvent[], inherited = 0) {
  let state = initUsageState(HEADER, inherited as SessionLogOffset);
  for (const next of events) state = applyUsageEvent(state, next);
  return state;
}

test('a fresh fold is empty and remembers its inherited prefix', () => {
  const state = initUsageState(HEADER, 7 as SessionLogOffset);
  assert.equal(state.seedSeq, 7);
  assert.equal(state.prompts, 0);
  assert.equal(state.tokens, 0);
  assert.deepEqual(state.days, {});
  assert.deepEqual(state.models, {});
  assert.deepEqual(state.modelDays, {});
  assert.equal(state.hours.length, 24);
  assert.equal(state.model, null);
});

test('only human prompts count, bucketed by local day and hour', () => {
  const state = fold([
    prompt(0, at(11, 30)),
    prompt(1, at(11, 45), { kind: 'agent' }),
    prompt(2, at(23, 5), { kind: 'model' }),
    prompt(3, at(23, 55), { kind: 'user' }),
    prompt(4, at(9, 0, 29)),
  ]);
  assert.equal(state.prompts, 3);
  assert.deepEqual(state.days, { '2026-09-30': 2, '2026-09-29': 1 });
  assert.equal(state.hours[11], 1);
  assert.equal(state.hours[23], 1);
  assert.equal(state.hours[9], 1);
  assert.equal(state.hours[12], 0);
});

test('the fork-inherited prefix never counts as this session', () => {
  const events = [
    prompt(0, at(10)),
    message(1, at(10, 1), { inputTokens: 100, outputTokens: 10 }),
    prompt(2, at(11)),
    message(3, at(11, 1), { inputTokens: 5, outputTokens: 1 }),
  ];
  const state = fold(events, 2);
  assert.equal(state.prompts, 1);
  assert.equal(state.tokens, 6);
  assert.deepEqual(state.modelDays, { '2026-09-30': { [UNKNOWN_MODEL]: 6 } });
});

test('rawTokens prefers the adapter total and never adds reasoning twice', () => {
  assert.equal(rawTokens(usage({ inputTokens: 10, outputTokens: 5, cacheReadTokens: 100, cacheWriteTokens: 2 })), 117);
  assert.equal(rawTokens(usage({ inputTokens: 10, outputTokens: 5, totalTokens: 120 })), 120);
  assert.equal(rawTokens(usage({ inputTokens: 1, outputTokens: 10, reasoningTokens: 7 })), 11);
  assert.equal(rawTokens(usage({})), 0);
});

test('messages are attributed to the latest request header, with in/out kept apart', () => {
  const state = fold([
    header(0, at(10)),
    message(1, at(10, 1), { inputTokens: 100, outputTokens: 10 }),
    header(2, at(11), 'anthropic', 'sonnet-5.5'),
    message(3, at(11, 1), { inputTokens: 50, outputTokens: 5 }),
  ]);
  assert.equal(state.tokens, 165);
  assert.deepEqual(state.models, {
    'opencode-go/deepseek-v4.1-flash': { t: 110, i: 100, o: 10 },
    'anthropic/sonnet-5.5': { t: 55, i: 50, o: 5 },
  });
  /* Both messages landed on the same local day, under their own models. */
  assert.deepEqual(state.modelDays, {
    '2026-09-30': { 'opencode-go/deepseek-v4.1-flash': 110, 'anthropic/sonnet-5.5': 55 },
  });
});

test('cache-inclusive totals do not inflate the legend\u2019s input/output counters', () => {
  const state = fold([
    header(0, at(10)),
    message(1, at(10, 1), { inputTokens: 4, outputTokens: 6, cacheReadTokens: 90, cacheWriteTokens: 0 }),
  ]);
  assert.equal(state.tokens, 100);
  assert.deepEqual(state.models['opencode-go/deepseek-v4.1-flash'], { t: 100, i: 4, o: 6 });
});

test('usage before the first header lands in the unknown bucket', () => {
  const state = fold([message(0, at(10), { inputTokens: 3, outputTokens: 4 })]);
  assert.deepEqual(state.models, { [UNKNOWN_MODEL]: { t: 7, i: 3, o: 4 } });
});

test('events the fold does not count keep the same state reference', () => {
  const state = fold([prompt(0, at(10))]);
  const routed = applyUsageEvent(state, header(1, at(10, 1)));
  assert.notEqual(routed, state);
  assert.equal(applyUsageEvent(routed, header(2, at(10, 2))), routed);
  assert.equal(applyUsageEvent(routed, event('turn/start', 3, at(10, 3), { turn: 0 })), routed);
  assert.equal(applyUsageEvent(routed, message(4, at(10, 4), {})), routed);
});

test('the wire view is sparse, sorted and stable for one state', () => {
  const state = fold([
    prompt(0, at(11)),
    prompt(1, at(9)),
    header(2, at(9)),
    message(3, at(9, 1), { inputTokens: 1, outputTokens: 2 }),
  ]);
  const view = viewUsage(state);
  assert.equal(view.prompts, 2);
  assert.equal(view.tokens, 3);
  assert.deepEqual(view.days, [['2026-09-30', 2]]);
  assert.deepEqual(view.hours, [[9, 1], [11, 1]]);
  assert.deepEqual(view.models, [['opencode-go/deepseek-v4.1-flash', 3, 1, 2]]);
  /* The day rows point at the model table instead of repeating its name. */
  assert.deepEqual(view.modelDays, [['2026-09-30', 0, 3]]);
  assert.equal(viewUsage(state), view);
});

test('the day rows follow the sorted model table', () => {
  const state = fold([
    header(0, at(10), 'z', 'last'),
    message(1, at(10), { inputTokens: 1, outputTokens: 0 }),
    header(2, at(10), 'a', 'first'),
    message(3, at(10), { inputTokens: 2, outputTokens: 0 }),
    message(4, at(9, 0, 29), { inputTokens: 4, outputTokens: 0 }),
  ]);
  const view = viewUsage(state);
  assert.deepEqual(view.models, [['a/first', 6, 6, 0], ['z/last', 1, 1, 0]]);
  assert.deepEqual(view.modelDays, [['2026-09-29', 0, 4], ['2026-09-30', 0, 2], ['2026-09-30', 1, 1]]);
});

test('dayKey is the local calendar day', () => {
  assert.equal(dayKey(at(0, 1)), '2026-09-30');
  assert.equal(dayKey(at(23, 59, 1)), '2026-09-01');
});

test('a persisted state row is read leniently', () => {
  const state = readUsageState({
    seedSeq: 3,
    prompts: 4,
    tokens: 90,
    days: { '2026-09-30': 2, bad: 'x' },
    hours: [0, 5],
    models: { 'p/m': 90, 'q/n': { t: 10, i: 4, o: 6 }, 'r/o': { t: 0, i: 9, o: 9 } },
    modelDays: { '2026-09-30': { 'p/m': 90, 'q/n': 'x' }, empty: {} },
    model: 'p/m',
  });
  assert.equal(state.seedSeq, 3);
  assert.equal(state.prompts, 4);
  assert.equal(state.tokens, 90);
  assert.deepEqual(state.days, { '2026-09-30': 2 });
  assert.equal(state.hours.length, 24);
  assert.equal(state.hours[1], 5);
  assert.deepEqual(state.models, {
    'p/m': { t: 90, i: 0, o: 0 },
    'q/n': { t: 10, i: 4, o: 6 },
  });
  assert.deepEqual(state.modelDays, { '2026-09-30': { 'p/m': 90 } });
  assert.equal(state.model, 'p/m');

  const junk = readUsageState('nonsense');
  assert.equal(junk.seedSeq, 0);
  assert.equal(junk.prompts, 0);
  assert.equal(junk.model, null);
  assert.deepEqual(readUsageView(null), {
    prompts: 0, tokens: 0, days: [], hours: [], models: [], modelDays: [],
  });
});

test('a wire view row drops malformed entries', () => {
  const view = readUsageView({
    prompts: 2,
    tokens: 10,
    days: [['2026-09-30', 2], ['yesterday', 3], ['2026-09-29', 0]],
    hours: [[11, 2], [24, 1], ['x', 1]],
    models: [['p/m', 10, 4, 6], ['', 4, 0, 0], ['q/n', 0, 1, 1]],
    modelDays: [['2026-09-30', 0, 7], ['2026-09-30', 9, 7], ['nope', 0, 7], ['2026-09-29', 0, 0]],
  });
  assert.deepEqual(view.days, [['2026-09-30', 2]]);
  assert.deepEqual(view.hours, [[11, 2]]);
  assert.deepEqual(view.models, [['p/m', 10, 4, 6]]);
  assert.deepEqual(view.modelDays, [['2026-09-30', 0, 7]]);
});
