import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { FEATURE_IDS } from '../src/shared/config.ts';
import { PLUGIN_ID, TARGET_DSH_VERSION } from '../src/shared/identity.ts';
import { BASELINE_MODULES } from './lib/platform.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
assert.equal(pkg.name, PLUGIN_ID);
assert.equal(pkg.dsh.engines.dsh, `=${TARGET_DSH_VERSION}`);
for (const [name, version] of Object.entries(pkg.devDependencies)) {
  if (name.startsWith('@deepseek-ai/dsh-')) assert.equal(version, TARGET_DSH_VERSION);
}
const browser = await readFile(join(root, 'lib/client.js'), 'utf8');
let registration;
/* Resource bookkeeping: every compat observer and window listener a module
   opens must be closed again by teardown. */
let observersOpened = 0;
let observersClosed = 0;
let listenersOpened = 0;
let listenersClosed = 0;
const sandbox = {
  window: {
    __ModuleLoader__: { load(row) { assert.equal(registration, undefined); registration = row; } },
    addEventListener() { listenersOpened += 1; },
    removeEventListener() { listenersClosed += 1; },
  },
  console,
};
runInNewContext(browser, sandbox);
assert.equal(registration.id, pkg.name);
const require = createRequire(import.meta.url);
const client = registration.factory(id => {
  assert.ok(BASELINE_MODULES.includes(id), `Unexpected module-table request: ${id}`);
  return require(id);
});
assert.deepEqual(Object.keys(client).sort(), ['apply', 'inject']);
assert.equal(typeof client.apply, 'function');
client.apply(new Proxy({}, { get() { throw new Error('Disabled plugin accessed a Host service'); } }));
// Exercise the actual bundled entry against a narrow DOM/service fixture.
// This proves activation ownership and the settings-transport contract, not the
// Desktop renderer or its settings UI.
const attributes = new Map();
const styles = new Set();
class FakeObserver {
  constructor() { observersOpened += 1; }
  observe() {}
  disconnect() { observersClosed += 1; }
}
sandbox.MutationObserver = FakeObserver;
sandbox.ResizeObserver = FakeObserver;
sandbox.requestAnimationFrame = callback => setTimeout(callback, 0);
sandbox.cancelAnimationFrame = handle => clearTimeout(handle);
sandbox.getComputedStyle = () => ({ position: 'static', gridTemplateColumns: '' });
sandbox.document = {
  documentElement: {
    getAttribute: key => attributes.get(key) ?? null,
    setAttribute: (key, value) => attributes.set(key, value),
    removeAttribute: key => attributes.delete(key),
  },
  body: {},
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => {
    const style = { dataset: {}, textContent: '', remove: () => styles.delete(style) };
    return style;
  },
  head: { appendChild: style => styles.add(style) },
};
/** Minimal settings transport: one section, one subscriber list. */
function createConfigForms(initial) {
  let value = initial;
  const listeners = new Set();
  return {
    published: next => { value = next; for (const listener of [...listeners]) listener(); },
    get(namespace) {
      assert.equal(namespace, 'ui-skin-ccd-style');
      return {
        getSnapshot: () => ({ status: 'ready', value, writable: true }),
        subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
        set(field, next) { value = { ...value, [field]: next }; return true; },
      };
    },
  };
}
let teardown;
let paletteLayers = 0;
const modelSeats = new Set();
const headerViews = new Set();
/** The row configuration page and its dictionary outlive the activation scope. */
const rowConfigPages = new Set();
const dictionaries = [];
let modelScopes = 0;
let headerScopes = 0;
let settingsScopes = 0;
const openedKinds = [];
const focusedTabs = [];
const sidebarTabs = [];
/** Right-Sidebar faces the client half injects; the header views live on them. */
const sidebarRight = {
  openTab(kind) { openedKinds.push(kind); },
  focus(tabId) { focusedTabs.push(tabId); },
  openTabs: { getSnapshot: () => sidebarTabs },
};
const sidebarRightTabs = {
  kinds: new Set(['terminal', 'browser']),
  listeners: new Set(),
  get(kind) { return this.kinds.has(kind) ? { kind } : undefined; },
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); },
  refresh() { for (const listener of [...this.listeners]) listener(); },
};
const slots = {
  inject(name, register) {
    assert.ok([
      'conversation.input.model',
      'conversation.session.header.utilities',
      'plugins.row.config',
    ].includes(name), `unexpected slot: ${name}`);
    return register();
  },
  register(options) {
    if (options.name === 'plugins.row.config') {
      assert.equal(options.key, `${PLUGIN_ID}#ui-skin-ccd-style`);
      assert.equal(options.locale, 'ccdSettings');
      rowConfigPages.add(options);
      return () => rowConfigPages.delete(options);
    }
    if (options.name === 'conversation.input.model') {
      assert.equal(options.priority, -10);
      modelSeats.add(options);
      return () => modelSeats.delete(options);
    }
    assert.equal(options.name, 'conversation.session.header.utilities');
    // The added views sit ahead of the native session menu (order 0) and behind
    // the native open control (-10) and scheduled tasks (-5).
    assert.ok(options.order > -5 && options.order < 0, `header view order: ${options.order}`);
    assert.equal(typeof options.inject, 'function');
    headerViews.add(options);
    return () => headerViews.delete(options);
  },
};
const disabled = { enabled: false, features: Object.fromEntries(FEATURE_IDS.map(id => [id, false])) };
/** Locale face the configuration page's copy registers into. */
const locale = {
  register(namespace, dicts) {
    assert.equal(namespace, 'ccdSettings');
    assert.deepEqual(Object.keys(dicts).sort(), ['en', 'zh']);
    dictionaries.push(namespace);
    return () => { dictionaries.splice(dictionaries.indexOf(namespace), 1); };
  },
};
/* The injected child scope owns the page's effects, exactly as the Cordis fiber
   does: disposing the injection releases the dictionary it registered. */
const settingsEffects = [];
const settingsScope = {
  slots,
  locale,
  effect(callback) {
    const released = callback();
    const release = typeof released === 'function' ? released : () => {};
    settingsEffects.push(release);
    return () => {
      const index = settingsEffects.indexOf(release);
      if (index >= 0) settingsEffects.splice(index, 1);
      release();
    };
  },
};
const configForms = createConfigForms(disabled);
client.apply({
  slots,
  inject(dependencies, mount) {
    const names = Array.from(dependencies).join(',');
    let release;
    let scope;
    if (names === 'slots,sidebarRight,sidebarRightTabs') {
      scope = 'header';
      release = mount({ slots, sidebarRight, sidebarRightTabs });
      headerScopes += 1;
    } else if (names === 'modelDirectories,sessions,slots,remote,remote.session') {
      scope = 'model';
      release = mount({ slots });
      modelScopes += 1;
    } else {
      assert.equal(names, 'slots,locale', 'unexpected injection');
      scope = 'settings';
      release = mount(settingsScope);
      settingsScopes += 1;
    }
    let disposed = false;
    return {
      dispose() {
        if (disposed) return;
        disposed = true;
        release();
        if (scope === 'header') headerScopes -= 1;
        else if (scope === 'model') modelScopes -= 1;
        else {
          settingsScopes -= 1;
          for (const effect of settingsEffects.splice(0).reverse()) effect();
        }
      },
    };
  },
  theme: { overrideTokens() { paletteLayers++; return () => { paletteLayers--; }; } },
  uiWorkspace: { startSession() {} },
  configForms,
  effect: execute => { teardown = execute(); },
});
assert.equal(attributes.has('data-dsh-ccd-style'), false, 'a disabled section must not restyle the interface');
/* Only the configuration page is mounted while the interface is off: it is how
   the interface gets switched back on from inside the app. */
assert.equal(styles.size, 1);
assert.equal(rowConfigPages.size, 1, 'the configuration page must survive being disabled');
assert.deepEqual(dictionaries, ['ccdSettings']);
assert.equal(settingsScopes, 1);
// Re-enabling through the settings transport activates without a reload.
configForms.published({ ...disabled, enabled: true });
assert.equal(attributes.get('data-dsh-ccd-style'), 'true');
// Design variables, the shared composer geometry, and the page stylesheet.
assert.equal(styles.size, 3);
assert.equal(paletteLayers, 1);
// Exercise the actual bundled model-seat registration and its cleanup scope.
configForms.published({ ...disabled, enabled: true, features: { ...disabled.features, conversation: true } });
assert.equal(modelSeats.size, 1);
assert.equal(modelScopes, 1);
assert.equal(headerViews.size, 2);
assert.equal(headerScopes, 1);
assert.equal(styles.size, 7); // page + theme + Composer + model controls + effort + conversation + header actions
/* The added header views open their right-panel kind, and focus the Session's
   existing tab of that kind instead of stacking a second one. */
const terminalView = [...headerViews].find(view => view.id === 'ccd-terminal');
assert.equal(terminalView.inject('session-1').kind, 'terminal');
terminalView.inject('session-1').open();
assert.deepEqual(openedKinds, ['terminal']);
sidebarTabs.push({ sessionId: 'session-1', tabId: 'tab7', kind: 'terminal' });
terminalView.inject('session-1').open();
assert.deepEqual(focusedTabs, ['tab7']);
/* A build without a panel kind keeps no button for it, and recovers when the
   kind registers again — the registry's own signal drives both. */
sidebarRightTabs.kinds.delete('browser');
sidebarRightTabs.refresh();
assert.deepEqual([...headerViews].map(view => view.id), ['ccd-terminal']);
sidebarRightTabs.kinds.add('browser');
sidebarRightTabs.refresh();
assert.equal(headerViews.size, 2);
// Repeated unchanged configuration must not register a duplicate seat.
configForms.published({ ...disabled, enabled: true, features: { ...disabled.features, conversation: true } });
assert.equal(modelSeats.size, 1);
assert.equal(headerViews.size, 2);
// Disabling again releases every owned resource.
configForms.published(disabled);
assert.equal(attributes.has('data-dsh-ccd-style'), false);
assert.equal(styles.size, 1, 'the page stylesheet stays while the interface is off');
assert.equal(paletteLayers, 0);
assert.equal(modelSeats.size, 0);
assert.equal(modelScopes, 0);
assert.equal(headerViews.size, 0);
assert.equal(headerScopes, 0);
assert.equal(rowConfigPages.size, 1);
assert.equal(settingsScopes, 1);
configForms.published({ ...disabled, enabled: true });
assert.equal(typeof teardown, 'function');
teardown();
teardown();
assert.equal(attributes.has('data-dsh-ccd-style'), false);
assert.equal(styles.size, 0);
assert.equal(paletteLayers, 0);
assert.equal(rowConfigPages.size, 0, 'teardown releases the configuration page');
assert.equal(settingsScopes, 0);
assert.deepEqual(dictionaries, []);
/* The compat observers and listeners are resources like any other: none may
   outlive teardown. */
assert.ok(observersOpened > 0, 'the compat layer must observe the host DOM');
assert.equal(observersClosed, observersOpened);
assert.ok(listenersOpened > 0, 'the compat layer must own its window listeners');
assert.equal(listenersClosed, listenersOpened);
const host = await import(pathToFileURL(join(root, 'lib/index.js')).href);
assert.equal(typeof host.apply, 'function');
assert.ok(host.Config);

const result = spawnSync('npm', ['pack', '--dry-run', '--ignore-scripts', '--json'], {
  cwd: root, encoding: 'utf8', env: { ...process.env, npm_config_cache: join(root, '.cache/npm') },
});
if (result.error) throw result.error;
assert.equal(result.status, 0, result.stderr);
const packed = JSON.parse(result.stdout)[0].files.map(file => file.path);
for (const file of ['lib/index.js', 'lib/client.js', 'lib/types/host/index.d.ts', 'cordis.patch.yml', 'README.md', 'LICENSE']) {
  assert.ok(packed.includes(file), `Missing package file: ${file}`);
}
assert.ok(packed.every(file => /^(lib\/|cordis\.patch\.yml$|README\.md$|LICENSE$|package\.json$)/.test(file)),
  'Unexpected source, screenshot, cache, or development asset in package');
console.log(`DSH loader envelope, activation cleanup fixture, Host entry, and ${packed.length} package files passed.`);
