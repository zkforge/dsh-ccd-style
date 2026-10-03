import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  BLANK_ROW_ATTRIBUTE, blankSessionIds, mountBlankSessionRows, rowSessionId,
} from '../src/client/compat/blank-session-rows.ts';
import type { BlankSessionsPort } from '../src/client/contracts/ports.ts';
import { ANCHOR } from '../src/client/compat/host-dom.ts';

test('a row key names a session only when it is the session prefix', () => {
  assert.equal(rowSessionId('session:abc'), 'abc');
  assert.equal(rowSessionId('session:9f2e-1'), '9f2e-1');
  /* The browser's other keyed rows share the attribute, not the identity. */
  assert.equal(rowSessionId('workspace:dsh-ccd-style'), null);
  assert.equal(rowSessionId('empty'), null);
  assert.equal(rowSessionId('overflow:dsh-ccd-style'), null);
  assert.equal(rowSessionId('session:'), null);
  assert.equal(rowSessionId(null), null);
  assert.equal(rowSessionId(undefined), null);
});

test('only blank root sessions are provisional', () => {
  const blank = blankSessionIds({
    ids: ['fresh', 'chatting', 'forked', 'subagent-child', 'unknown'],
    byId: {
      fresh: { blank: true },
      chatting: { blank: false },
      /* A fork is provisionally blank in the client until the host summary
         lands; that row is real history, not a New Session placeholder. */
      forked: { blank: true, parentId: 'chatting' },
      'subagent-child': { blank: true, parentId: 'chatting' },
    },
  });
  assert.deepEqual([...blank], ['fresh']);
});

test('a list that has not arrived hides nothing', () => {
  assert.equal(blankSessionIds({ ids: [], byId: {} }).size, 0);
  /* A row the snapshot carries without the flag is treated as real history. */
  assert.equal(blankSessionIds({ ids: ['a'], byId: { a: {} } }).size, 0);
});

function fixture(rows: readonly string[]) {
  class FakeElement {
    readonly attributes = new Map<string, string>();
    isConnected = true;
    children: FakeElement[] = [];
    constructor(key?: string) {
      if (key !== undefined) this.attributes.set('data-row-key', key);
    }
    getAttribute(name: string): string | null { return this.attributes.get(name) ?? null; }
    setAttribute(name: string, value: string): void { this.attributes.set(name, value); }
    hasAttribute(name: string): boolean { return this.attributes.has(name); }
    removeAttribute(name: string): void { this.attributes.delete(name); }
    matches(selector: string): boolean {
      return selector === ANCHOR.sessionRows && (this.getAttribute('data-row-key')?.startsWith('session:') ?? false);
    }
    querySelector(): FakeElement | null { return null; }
    contains(node: unknown): boolean { return node === this || this.children.includes(node as FakeElement); }
  }

  const region = new FakeElement();
  const elements = rows.map(key => new FakeElement(key));
  region.children = elements;

  let blank = new Set<string>();
  let reads = 0;
  const listeners = new Set<() => void>();
  const source: BlankSessionsPort = {
    ids: () => { reads++; return blank; },
    subscribe: listener => { listeners.add(listener); return () => { listeners.delete(listener); }; },
  };

  let callback: (records: readonly MutationRecord[]) => void = () => {};
  let options: MutationObserverInit | undefined;
  let observed: unknown;
  let disconnected = false;
  class Observer {
    constructor(fn: (records: readonly MutationRecord[]) => void) { callback = fn; }
    observe(node: unknown, init: MutationObserverInit) { observed = node; options = init; }
    disconnect() { disconnected = true; }
  }
  Object.defineProperty(globalThis, 'MutationObserver', { value: Observer, configurable: true });
  Object.defineProperty(globalThis, 'Element', { value: FakeElement, configurable: true });

  const body = new FakeElement();
  const document = {
    body,
    querySelector: (selector: string) => (selector === ANCHOR.workspaces ? region : null),
    querySelectorAll: (selector: string) => (selector === ANCHOR.sessionRows ? elements.filter(row => row.isConnected) : []),
  } as unknown as Document;

  const errors: unknown[] = [];
  const dispose = mountBlankSessionRows(document, source, error => errors.push(error));
  return {
    elements, region, body, errors, dispose,
    get reads() { return reads; },
    get listeners() { return listeners.size; },
    get options() { return options; },
    get observed() { return observed; },
    get disconnected() { return disconnected; },
    setBlank: (ids: readonly string[]) => { blank = new Set(ids); for (const listener of [...listeners]) listener(); },
    /** One observer delivery; the records name the mutated target. */
    mutate: (records: readonly { target: unknown; addedNodes?: unknown[]; removedNodes?: unknown[] }[]) => {
      callback(records.map(record => ({
        target: record.target,
        addedNodes: record.addedNodes ?? [],
        removedNodes: record.removedNodes ?? [],
      }) as unknown as MutationRecord));
    },
    drop: (element: FakeElement) => { element.isConnected = false; },
    /** One row arriving later, as React mounts it. */
    append: (key: string) => {
      const element = new FakeElement(key);
      elements.push(element);
      region.children.push(element);
      return element;
    },
  };
}

test('the provisional row is tagged and the real rows are left alone', () => {
  const f = fixture(['session:fresh', 'session:chatting', 'workspace:proj', 'empty']);
  f.setBlank(['fresh']);
  assert.equal(f.elements[0]?.getAttribute(BLANK_ROW_ATTRIBUTE), '');
  assert.equal(f.elements[1]?.hasAttribute(BLANK_ROW_ATTRIBUTE), false);
  assert.equal(f.elements[2]?.hasAttribute(BLANK_ROW_ATTRIBUTE), false);
  assert.equal(f.elements[3]?.hasAttribute(BLANK_ROW_ATTRIBUTE), false);
  assert.deepEqual(f.errors, []);
});

test('the tag follows the host fact in both directions', () => {
  const f = fixture(['session:fresh']);
  assert.equal(f.elements[0]?.hasAttribute(BLANK_ROW_ATTRIBUTE), false);
  f.setBlank(['fresh']);
  assert.equal(f.elements[0]?.getAttribute(BLANK_ROW_ATTRIBUTE), '');
  /* The first sent message clears the host flag; the row comes back. */
  f.setBlank([]);
  assert.equal(f.elements[0]?.hasAttribute(BLANK_ROW_ATTRIBUTE), false);
});

test('the observer watches the document tree for arriving rows', () => {
  const f = fixture([]);
  assert.equal(f.observed, f.body);
  assert.deepEqual(f.options, { childList: true, subtree: true });
  /* A mutation outside the Workspace browser costs no list read: a streaming
     Conversation must not pay for this observer. */
  const before = f.reads;
  f.mutate([{ target: f.body }]);
  assert.equal(f.reads, before);
  /* A row arriving anywhere under the browser region is reconciled. */
  f.setBlank(['fresh']);
  const fresh = f.append('session:fresh');
  f.mutate([{ target: f.body, addedNodes: [fresh] }]);
  assert.equal(fresh.getAttribute(BLANK_ROW_ATTRIBUTE), '');
  /* A mutation inside the browser reconciles without any added row. */
  const other = f.append('session:chatting');
  f.setBlank(['fresh', 'chatting']);
  f.mutate([{ target: f.region }]);
  assert.equal(other.getAttribute(BLANK_ROW_ATTRIBUTE), '');
});

test('a row React dropped stops being tracked', () => {
  const f = fixture(['session:fresh', 'session:other']);
  f.setBlank(['fresh', 'other']);
  const fresh = f.elements[0];
  const other = f.elements[1];
  assert.ok(fresh);
  assert.ok(other);
  f.drop(fresh);
  f.setBlank([]);
  /* The live row follows the host fact; the dead reference is forgotten
     instead of being written to. */
  assert.equal(other.hasAttribute(BLANK_ROW_ATTRIBUTE), false);
  assert.equal(fresh.hasAttribute(BLANK_ROW_ATTRIBUTE), true);
  /* A row that comes back into the tree is reconciled again. */
  fresh.isConnected = true;
  f.setBlank(['fresh']);
  f.mutate([{ target: f.region }]);
  assert.equal(fresh.getAttribute(BLANK_ROW_ATTRIBUTE), '');
});

test('release clears every tag and both signals', () => {
  const f = fixture(['session:fresh', 'session:other']);
  f.setBlank(['fresh', 'other']);
  assert.equal(f.elements[0]?.getAttribute(BLANK_ROW_ATTRIBUTE), '');
  assert.equal(f.elements[1]?.getAttribute(BLANK_ROW_ATTRIBUTE), '');
  f.dispose();
  assert.equal(f.elements[0]?.hasAttribute(BLANK_ROW_ATTRIBUTE), false);
  assert.equal(f.elements[1]?.hasAttribute(BLANK_ROW_ATTRIBUTE), false);
  assert.equal(f.disconnected, true);
  assert.equal(f.listeners, 0);
  /* A late list change after release cannot re-tag a row. */
  const before = f.reads;
  f.setBlank(['fresh']);
  assert.equal(f.reads, before);
  f.dispose();
});

test('a failing source is reported without touching the rows', () => {
  const f = fixture(['session:fresh']);
  const failing: BlankSessionsPort = {
    ids: () => { throw new Error('no list'); },
    subscribe: () => () => {},
  };
  const errors: unknown[] = [];
  const dispose = mountBlankSessionRows(
    { body: f.body, querySelector: () => null, querySelectorAll: () => [] } as unknown as Document,
    failing,
    error => errors.push(error),
  );
  assert.equal(errors.length, 1);
  dispose();
});

test('a subscription that never lands releases the observer it opened', () => {
  const f = fixture(['session:fresh']);
  const failing: BlankSessionsPort = {
    ids: () => new Set<string>(),
    subscribe: () => { throw new Error('no subscription'); },
  };
  const errors: unknown[] = [];
  const dispose = mountBlankSessionRows(
    { body: f.body, querySelector: () => null, querySelectorAll: () => [] } as unknown as Document,
    failing,
    error => errors.push(error),
  );
  assert.equal(errors.length, 1);
  assert.equal(f.disconnected, true, 'the observer must not outlive the failed mount');
  dispose();
});
