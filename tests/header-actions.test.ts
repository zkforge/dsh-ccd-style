import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Context } from '@deepseek-ai/cordis';
import type { SidebarRightPort, SidebarTabRecord } from '../src/client/contracts/ports.ts';
import { headerLabels } from '../src/client/compat/header-labels.ts';
import { HOST } from '../src/client/compat/host-dom.ts';
import { mountOpenTargetMode } from '../src/client/compat/open-target.ts';
import { openView, resolveSidebarRight, resolveSidebarTabs } from '../src/client/features/conversation/header-actions/sidebar-view.ts';

/** Narrow element double: attributes only, like the renderer's own nodes. */
function element(initial: Record<string, string> = {}) {
  const attributes = new Map(Object.entries(initial));
  return {
    attributes,
    isConnected: true,
    getAttribute: (name: string) => attributes.get(name) ?? null,
    setAttribute: (name: string, value: string) => { attributes.set(name, value); },
    removeAttribute: (name: string) => { attributes.delete(name); },
  };
}

/** Observer double recording the last instance so a test can force a pass. */
class FakeObserver {
  static instances: FakeObserver[] = [];
  readonly callback: () => void;
  disconnected = false;
  constructor(callback: () => void) {
    this.callback = callback;
    FakeObserver.instances.push(this);
  }
  observe() {}
  disconnect() { this.disconnected = true; }
}

test('header labels follow the document language, not a borrowed namespace', () => {
  const document = (lang: string) => ({ documentElement: { lang } }) as unknown as Document;
  assert.equal(headerLabels(document('zh-CN')).terminal, '打开终端');
  assert.equal(headerLabels(document('zh-CN')).open, '选择打开方式');
  assert.equal(headerLabels(document('en-US')).terminal, 'Open terminal');
  assert.equal(headerLabels(document('en-US')).browser, 'Open browser');
});

test('a header view focuses the Session\u2019s own tab and opens one otherwise', () => {
  const calls: string[] = [];
  const sidebar = (tabs: readonly SidebarTabRecord[] = []) => ({
    openTab: (kind: string) => { calls.push(`open:${kind}`); },
    focus: (tabId: string) => { calls.push(`focus:${tabId}`); },
    openTabs: { getSnapshot: () => tabs },
  }) as SidebarRightPort;

  openView(sidebar(), 'terminal', 'session-1');
  assert.deepEqual(calls, ['open:terminal']);

  calls.length = 0;
  openView(sidebar([{ sessionId: 'session-1', tabId: 'tab7', kind: 'terminal' }]), 'terminal', 'session-1');
  assert.deepEqual(calls, ['focus:tab7']);

  /* Another Session's tab is not this header's view of the kind. */
  calls.length = 0;
  openView(sidebar([{ sessionId: 'session-2', tabId: 'tab9', kind: 'terminal' }]), 'terminal', 'session-1');
  assert.deepEqual(calls, ['open:terminal']);

  /* A face without the inventory still opens the view. */
  calls.length = 0;
  const bare = { openTab: (kind: string) => { calls.push(`open:${kind}`); }, focus: () => {} } as unknown as SidebarRightPort;
  openView(bare, 'browser', 'session-1');
  assert.deepEqual(calls, ['open:browser']);
});

test('a partial right-Sidebar face yields no header views instead of a dead button', () => {
  const complete = {
    sidebarRight: { openTab: () => {}, focus: () => {} },
    sidebarRightTabs: { get: () => undefined },
  } as unknown as Context;
  assert.notEqual(resolveSidebarRight(complete), undefined);
  assert.notEqual(resolveSidebarTabs(complete), undefined);
  assert.equal(resolveSidebarRight({ sidebarRight: { openTab: () => {} } } as unknown as Context), undefined);
  assert.equal(resolveSidebarTabs({} as unknown as Context), undefined);
});

test('the open control is marked menu/direct and every written attribute is restored', () => {
  const originalObserver = globalThis.MutationObserver;
  FakeObserver.instances = [];
  globalThis.MutationObserver = FakeObserver as unknown as typeof MutationObserver;
  try {
    const anchor = element();
    const main = element({ 'aria-label': '用 VS Code 打开' });
    let chevron: ReturnType<typeof element> | null = element({ 'aria-label': '更多打开方式', title: '更多打开方式' });
    const document = {
      documentElement: { lang: 'zh-CN' },
      querySelectorAll: () => [anchor],
    };
    (anchor as Record<string, unknown>).querySelector = (selector: string) => {
      if (selector === HOST.openTargetChevron) return chevron;
      if (selector === HOST.openTargetMain) return main;
      return null;
    };

    const dispose = mountOpenTargetMode(document as unknown as Document, error => { throw error; });
    assert.equal(anchor.attributes.get('data-ccd-open-mode'), 'menu');
    assert.equal(chevron?.attributes.get('aria-label'), '选择打开方式');
    assert.equal(chevron?.attributes.get('title'), '选择打开方式');
    assert.equal(main.attributes.get('aria-hidden'), 'true');
    assert.equal(main.attributes.get('tabindex'), '-1');

    /* The host re-renders the chevron's own name; the next pass puts ours back. */
    chevron?.setAttribute('aria-label', '更多打开方式');
    FakeObserver.instances.at(-1)?.callback();
    assert.equal(chevron?.attributes.get('aria-label'), '选择打开方式');

    /* No menu: the glyph would promise a chooser, so the control hides. */
    chevron = null;
    (document.documentElement as { lang: string }).lang = 'en-US';
    FakeObserver.instances.at(-1)?.callback();
    assert.equal(anchor.attributes.get('data-ccd-open-mode'), 'direct');
    assert.equal(main.attributes.has('aria-hidden'), false);
    assert.equal(main.attributes.has('tabindex'), false);

    dispose();
    assert.equal(anchor.attributes.has('data-ccd-open-mode'), false);
    assert.equal(FakeObserver.instances.at(-1)?.disconnected, true);
  } finally {
    globalThis.MutationObserver = originalObserver;
  }
});
