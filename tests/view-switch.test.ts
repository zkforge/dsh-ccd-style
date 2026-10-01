import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mountViewSwitch, VIEW_OFFSET_PROPERTY, VIEW_WIDTH_PROPERTY, VIEW_DURATION_PROPERTY } from '../src/client/compat/view-switch.ts';

function fixture() {
  let width = 54;
  let trackLeft = 100;
  let activeIndex = 1;
  let writes = 0;
  const properties = new Map<string, string>();
  const segments = [0, 1].map(index => ({ getBoundingClientRect: () => ({ left: trackLeft + index * width, width }) }));
  const tabs = {
    isConnected: true,
    querySelector: () => segments[activeIndex],
    getBoundingClientRect: () => ({ left: trackLeft }),
    style: {
      getPropertyValue: (key: string) => properties.get(key) ?? '',
      setProperty: (key: string, value: string) => { properties.set(key, value); writes++; },
      removeProperty: (key: string) => properties.delete(key),
    },
  };
  let callback = () => {};
  let disconnected = false;
  let options: MutationObserverInit | undefined;
  const listeners = new Map<string, () => void>();
  Object.defineProperty(globalThis, 'MutationObserver', {
    configurable: true, value: class {
      constructor(fn: () => void) { callback = fn; }
      observe(_node: unknown, init: MutationObserverInit) { options = init; }
      disconnect() { disconnected = true; }
    },
  });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    addEventListener: (key: string, fn: () => void) => listeners.set(key, fn),
    removeEventListener: (key: string) => listeners.delete(key),
  } });
  const errors: unknown[] = [];
  const dispose = mountViewSwitch({ body: {}, querySelector: () => tabs } as unknown as Document, error => errors.push(error));
  return {
    properties, dispose, errors, listeners,
    drag: () => { width = 38; trackLeft = 300; callback(); },
    select: () => { activeIndex = 0; callback(); },
    ownStyle: () => callback(),
    get writes() { return writes; },
    get options() { return options; },
    get disconnected() { return disconnected; },
  };
}

test('a frame style change refreshes the selected thumb immediately while the window stays fixed', () => {
  const f = fixture();
  assert.ok(f.options?.attributeFilter?.includes('style'));
  assert.equal(f.properties.get(VIEW_OFFSET_PROPERTY), '54px');
  f.drag();
  assert.equal(f.properties.get(VIEW_OFFSET_PROPERTY), '38px');
  assert.equal(f.properties.get(VIEW_WIDTH_PROPERTY), '38px');
  assert.equal(f.properties.get(VIEW_DURATION_PROPERTY), '0ms');
  assert.deepEqual(f.errors, []);
  f.dispose();
});

test('selection animates, its own style notification settles, and teardown clears geometry and listeners', () => {
  const f = fixture();
  f.select();
  assert.equal(f.properties.get(VIEW_OFFSET_PROPERTY), '0px');
  assert.equal(f.properties.get(VIEW_DURATION_PROPERTY), '180ms');
  const writes = f.writes;
  f.ownStyle();
  assert.equal(f.writes, writes);
  assert.equal(f.properties.get(VIEW_DURATION_PROPERTY), '180ms');
  f.dispose();
  assert.equal(f.properties.size, 0);
  assert.equal(f.listeners.size, 0);
  assert.equal(f.disconnected, true);
});
