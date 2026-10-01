import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mountComposerPlaceholder } from '../src/client/compat/composer-placeholder.ts';
import { HOST } from '../src/client/compat/host-dom.ts';

const hero = '描述你想要构建的内容, / 调用指令, @ 文件或对话';
const chat = '发消息或创建任务, / 调用指令, @ 文件或对话';
function fixture() {
  const attributes = new Map([['data-placeholder', hero], ['aria-label', hero]]);
  const node = { nodeType: 3, nodeValue: hero };
  const input = {
    getAttribute: (key: string) => attributes.get(key) ?? null,
    setAttribute: (key: string, value: string) => attributes.set(key, value),
  };
  let sync = () => {};
  let disconnected = false;
  Object.defineProperty(globalThis, 'MutationObserver', { configurable: true, value: class {
    constructor(callback: () => void) { sync = callback; }
    observe() {}
    disconnect() { disconnected = true; }
  } });
  const errors: unknown[] = [];
  const dispose = mountComposerPlaceholder({ body: {}, querySelector: (selector: string) => selector.endsWith(HOST.composerInput) ? input : { firstChild: node } } as unknown as Document, error => errors.push(error));
  return { attributes, node, dispose, errors, sync: () => sync(), get disconnected() { return disconnected; } };
}

test('hero copy and accessible label match chat and return to native on disposal', () => {
  const f = fixture();
  assert.equal(f.node.nodeValue, chat);
  assert.equal(f.attributes.get('aria-label'), chat);
  f.sync();
  assert.equal(f.node.nodeValue, chat);
  f.dispose();
  assert.equal(f.node.nodeValue, hero);
  assert.equal(f.attributes.get('aria-label'), hero);
  assert.equal(f.disconnected, true);
  assert.deepEqual(f.errors, []);
});

test('host workspace or blocked hints supersede the unified default without being overwritten', () => {
  const f = fixture();
  f.attributes.set('data-placeholder', '选择工作区');
  f.attributes.set('aria-label', '选择工作区');
  f.node.nodeValue = '选择工作区';
  f.sync();
  f.dispose();
  assert.equal(f.node.nodeValue, '选择工作区');
  assert.equal(f.attributes.get('aria-label'), '选择工作区');
});

test('host locale updates use the matching native chat copy', () => {
  const f = fixture();
  const englishHero = 'Describe what you want to build, / commands, @ files or sessions';
  f.attributes.set('data-placeholder', englishHero);
  f.attributes.set('aria-label', englishHero);
  f.node.nodeValue = englishHero;
  f.sync();
  assert.equal(f.node.nodeValue, 'Message or run a task, / commands, @ files or sessions');
  f.dispose();
  assert.equal(f.node.nodeValue, englishHero);
});
