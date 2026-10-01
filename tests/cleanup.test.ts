import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CleanupScope } from '../src/client/core/cleanup.ts';

test('teardown releases in reverse order, exactly once, despite cleanup and reporter failures', () => {
  const released: string[] = [];
  const scope = new CleanupScope(() => { throw new Error('reporter unavailable'); });
  scope.add(() => { released.push('first'); });
  scope.add(() => { released.push('broken'); throw new Error('cleanup failed'); });
  scope.add(() => { released.push('last'); });
  scope.dispose();
  scope.dispose();
  assert.deepEqual(released, ['last', 'broken', 'first']);
});

test('resources arriving after disposal release immediately', () => {
  const scope = new CleanupScope();
  scope.dispose();
  let released = 0;
  const dispose = scope.add(() => { released++; });
  dispose();
  assert.equal(released, 1);
});
