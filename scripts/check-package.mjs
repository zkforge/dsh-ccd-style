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
const sandbox = {
  window: {
    __ModuleLoader__: { load(row) { assert.equal(registration, undefined); registration = row; } },
    addEventListener() {},
    removeEventListener() {},
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
/* Observer bookkeeping: every observer a compat module opens must be closed. */
let observersOpened = 0;
let observersClosed = 0;
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
const disabled = { enabled: false, features: Object.fromEntries(FEATURE_IDS.map(id => [id, false])) };
const configForms = createConfigForms(disabled);
client.apply({
  slots: { inject() {}, register() { throw new Error('Slot registration was not expected here'); } },
  theme: { overrideTokens() { paletteLayers++; return () => { paletteLayers--; }; } },
  uiWorkspace: { startSession() {} },
  configForms,
  effect: execute => { teardown = execute(); },
});
assert.equal(attributes.has('data-dsh-ccd-style'), false, 'a disabled section must not touch the document');
assert.equal(styles.size, 0);
// Re-enabling through the settings transport activates without a reload.
configForms.published({ ...disabled, enabled: true });
assert.equal(attributes.get('data-dsh-ccd-style'), 'true');
// Design variables and the shared composer geometry every feature reuses.
assert.equal(styles.size, 2);
assert.equal(paletteLayers, 1);
// Disabling again releases every owned resource.
configForms.published(disabled);
assert.equal(attributes.has('data-dsh-ccd-style'), false);
assert.equal(styles.size, 0);
assert.equal(paletteLayers, 0);
configForms.published({ ...disabled, enabled: true });
assert.equal(typeof teardown, 'function');
teardown();
teardown();
assert.equal(attributes.has('data-dsh-ccd-style'), false);
assert.equal(styles.size, 0);
assert.equal(paletteLayers, 0);
/* The compat observers are resources like any other: none may outlive teardown. */
assert.ok(observersOpened > 0, 'the compat layer must observe the host DOM');
assert.equal(observersClosed, observersOpened);
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
