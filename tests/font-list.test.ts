import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  collectFamilies, filterFamilies, loadSystemFontFamilies, resetSystemFontFamilies,
} from '../src/client/features/settings/fonts.ts';

/** Swap `globalThis.window` for one case, always restoring it afterwards. */
async function withWindow(window: unknown, run: () => Promise<void>): Promise<void> {
  const scope = globalThis as { window?: unknown };
  const previous = scope.window;
  scope.window = window;
  resetSystemFontFamilies();
  try {
    await run();
  } finally {
    if (previous === undefined) delete scope.window;
    else scope.window = previous;
    resetSystemFontFamilies();
  }
}

test('faces collapse to unique, trimmed family names sorted for a Chinese interface', () => {
  assert.deepEqual(collectFamilies([
    { family: 'Menlo' },
    { family: 'Menlo' },
    { family: 'PingFang SC' },
    { family: '  Arial  ' },
    { family: '思源黑体' },
    { family: '' },
    { family: 42 },
    {},
  /* `zh` collation orders Han before Latin; the order only has to be stable. */
  ]), ['思源黑体', 'Arial', 'Menlo', 'PingFang SC']);
});

test('the family search matches case-insensitively and keeps the list order', () => {
  const families = ['Arial', 'Maple Mono NF CN', 'Menlo', 'PingFang SC', 'SF Mono'];
  assert.deepEqual(filterFamilies(families, ''), families);
  assert.deepEqual(filterFamilies(families, '  '), families);
  assert.deepEqual(filterFamilies(families, 'mono'), ['Maple Mono NF CN', 'SF Mono']);
  assert.deepEqual(filterFamilies(families, 'PING'), ['PingFang SC']);
  assert.deepEqual(filterFamilies(families, 'nothing'), []);
});

test('an environment without the API answers with no families', async () => {
  await withWindow(undefined, async () => {
    assert.deepEqual(await loadSystemFontFamilies(), []);
  });
});

test('the query runs once per page session and caches its answer', async () => {
  let calls = 0;
  await withWindow({
    queryLocalFonts: async () => {
      calls += 1;
      return [{ family: 'Zed Mono' }, { family: 'Alpha' }, { family: 'Alpha' }];
    },
  }, async () => {
    assert.deepEqual(await loadSystemFontFamilies(), ['Alpha', 'Zed Mono']);
    assert.deepEqual(await loadSystemFontFamilies(), ['Alpha', 'Zed Mono']);
    assert.equal(calls, 1);
  });
});

test('a denied permission or an empty answer falls back to typed input', async () => {
  await withWindow({ queryLocalFonts: async () => { throw new Error('denied'); } }, async () => {
    assert.deepEqual(await loadSystemFontFamilies(), []);
  });
  await withWindow({ queryLocalFonts: async () => [] }, async () => {
    assert.deepEqual(await loadSystemFontFamilies(), []);
  });
  await withWindow({ queryLocalFonts: 'not a function' }, async () => {
    assert.deepEqual(await loadSystemFontFamilies(), []);
  });
});
