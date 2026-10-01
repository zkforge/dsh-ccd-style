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
  window: { __ModuleLoader__: { load(row) { assert.equal(registration, undefined); registration = row; } } },
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
// This proves activation ownership, not the Desktop renderer or settings UI.
const attributes = new Map();
const styles = new Set();
sandbox.document = {
  documentElement: {
    getAttribute: key => attributes.get(key) ?? null,
    setAttribute: (key, value) => attributes.set(key, value),
    removeAttribute: key => attributes.delete(key),
  },
  createElement: () => {
    const style = { dataset: {}, textContent: '', remove: () => styles.delete(style) };
    return style;
  },
  head: { appendChild: style => styles.add(style) },
};
let teardown;
let paletteLayers = 0;
client.apply({
  slots: { inject() {}, register() { throw new Error('Planned feature replaced a slot'); } },
  theme: { overrideTokens() { paletteLayers++; return () => { paletteLayers--; }; } },
  uiWorkspace: { startSession() {} },
  effect: execute => { teardown = execute(); },
}, { enabled: true, features: Object.fromEntries(FEATURE_IDS.map(id => [id, false])) });
assert.equal(attributes.get('data-dsh-ccd-style'), 'true');
assert.equal(styles.size, 1);
assert.equal(typeof teardown, 'function');
teardown();
teardown();
assert.equal(attributes.has('data-dsh-ccd-style'), false);
assert.equal(styles.size, 0);
assert.equal(paletteLayers, 0);
const host = await import(pathToFileURL(join(root, 'lib/index.js')).href);
assert.equal(typeof host.apply, 'function');
assert.ok(host.Config);

const result = spawnSync('npm', ['pack', '--dry-run', '--ignore-scripts', '--json'], {
  cwd: root, encoding: 'utf8', env: { ...process.env, npm_config_cache: join(root, '.cache/npm') },
});
if (result.error) throw result.error;
assert.equal(result.status, 0, result.stderr);
const packed = JSON.parse(result.stdout)[0].files.map(file => file.path);
for (const file of ['lib/index.js', 'lib/client.js', 'lib/types/host/index.d.ts', 'cordis.patch.yml', 'README.md']) {
  assert.ok(packed.includes(file), `Missing package file: ${file}`);
}
assert.ok(packed.every(file => /^(lib\/|cordis\.patch\.yml$|README\.md$|package\.json$)/.test(file)),
  'Unexpected source, screenshot, cache, or development asset in package');
console.log(`DSH loader envelope, activation cleanup fixture, Host entry, and ${packed.length} package files passed.`);
