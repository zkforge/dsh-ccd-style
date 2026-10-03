import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  HOST_BUILDS, PINNED_BUILD, WINDOWS_BUILD, aliasHostClasses, detectHostBuild,
} from '../src/client/compat/host-builds.ts';
import { hostAnchors, hostSelectors } from '../src/client/compat/host-dom.ts';

/*
 * The macOS and Windows installers of DSH `0.2.0-rc.2` are separate builds —
 * commits `5e9e301d` and `04f392c9` — and every CSS-module class of the pinned
 * UI packages hashes differently between them. The stylesheets and `HOST`
 * selectors are authored against the macOS build, so these tests keep the
 * Windows table honest: complete (every class the plugin names is in it),
 * distinct (no entry is the identity) and correct for the classes read from
 * that build's `app.asar`.
 */

/** Classes the static web frontend owns; both builds ship them unchanged. */
const SHARED_CLASSES = ['_markdown_1ypvv_5', '_fileMention_1ypvv_85', '_markdown_1wejo_28'];

const root = fileURLToPath(new URL('../', import.meta.url));

/** Drop the shared classes, so only build-specific ones are collected. */
function withoutShared(text: string): string {
  let out = text;
  for (const name of SHARED_CLASSES) out = out.split(name).join('');
  return out;
}

function sources(extension: string): string[] {
  return readdirSync(`${root}src`, { recursive: true, encoding: 'utf8' })
    .filter(name => name.endsWith(extension))
    .map(name => readFileSync(`${root}src/${name}`, 'utf8'));
}

/** Host prefixes named by the stylesheets' selectors. */
function cssPrefixes(): Set<string> {
  const found = new Set<string>();
  for (const sheet of sources('.css')) {
    for (const match of withoutShared(sheet).matchAll(/\.([A-Za-z0-9_-]{4,14})_[a-zA-Z]/gu)) {
      found.add(`${match[1]}_`);
    }
  }
  return found;
}

/** Host prefixes named by the pinned selector tables. */
function tablePrefixes(): Set<string> {
  const found = new Set<string>();
  for (const match of withoutShared(readFileSync(`${root}src/client/compat/host-dom.ts`, 'utf8'))
    .matchAll(/'\.([A-Za-z0-9_-]{4,14})_[^']*'/gu)) {
    found.add(`${match[1]}_`);
  }
  return found;
}

/** A document double carrying only what detection reads. */
function documentDouble(platform: string | undefined, frameClass?: string) {
  const frame = frameClass === undefined ? null : { className: frameClass };
  return {
    documentElement: { dataset: platform === undefined ? {} : { platform } },
    querySelector: (selector: string) => (selector === '[data-slot="root"] > div' ? frame : null),
  } as unknown as Document;
}

test('every host class the plugin names is aliased for the Windows build', () => {
  const known = new Set(Object.keys(WINDOWS_BUILD.prefixes));
  const named = [...cssPrefixes(), ...tablePrefixes()];
  assert.ok(named.length > 20, 'the scan found too few host classes to be meaningful');
  for (const prefix of named) assert.ok(known.has(prefix), `${prefix} has no Windows counterpart`);
});

test('no Windows entry is the identity rewrite', () => {
  for (const [authored, actual] of Object.entries(WINDOWS_BUILD.prefixes)) {
    assert.notEqual(authored, actual);
    assert.match(authored, /^[A-Za-z0-9_-]+_$/u);
    assert.match(actual, /^[A-Za-z0-9_-]+_$/u);
  }
});

test('aliasing carries the Windows build the classes read from its app.asar', () => {
  const css = aliasHostClasses(
    'html[data-dsh-ccd-style="true"] ._3WPZCG_root ._3WPZCG_newSession, ._6Qf49G_frame:before, .yhfFVG_card {}',
    WINDOWS_BUILD,
  );
  assert.ok(css.includes('._2H3hWW_root'));
  assert.ok(css.includes('._2H3hWW_newSession'));
  assert.ok(css.includes('.BynINW_frame:before'));
  assert.ok(css.includes('.RlGAzG_card'));
  assert.ok(!css.includes('_3WPZCG_'));
  /* Stable hooks and shared classes are never rewritten. */
  const stable = '[data-slot="root"] > div, [role="menu"], ._markdown_1ypvv_5';
  assert.equal(aliasHostClasses(stable, WINDOWS_BUILD), stable);
});

test('the authored build is the identity rewrite', () => {
  const css = 'html[data-dsh-ccd-style="true"] ._3WPZCG_root ._6Qf49G_frame {}';
  assert.equal(aliasHostClasses(css, PINNED_BUILD), css);
});

test('detection reads the frame first, then the preload platform', () => {
  assert.equal(detectHostBuild(documentDouble('win32')), WINDOWS_BUILD);
  assert.equal(detectHostBuild(documentDouble('darwin')), PINNED_BUILD);
  assert.equal(detectHostBuild(documentDouble(undefined)), PINNED_BUILD);
  assert.equal(detectHostBuild(documentDouble('darwin', 'BynINW_frame _6Qf49G_quietBars')), WINDOWS_BUILD);
  assert.equal(detectHostBuild(documentDouble('win32', '_6Qf49G_frame')), PINNED_BUILD);
});

test('resolved tables speak the document build and keep the authored table intact', () => {
  const windows = hostSelectors(documentDouble('win32'));
  assert.equal(windows.frame, '.BynINW_frame');
  assert.equal(windows.sidebarNewSession, '._2H3hWW_newSession');
  assert.equal(hostAnchors(documentDouble('win32')).composerCardHero, '.Dc7zOa_root[data-phase="hero"] [data-composer-card]');

  const pinned = hostSelectors(documentDouble('darwin'));
  assert.equal(pinned.frame, '._6Qf49G_frame');
  assert.equal(hostAnchors(documentDouble('darwin')).composerCardHero, '.ST7X_W_root[data-phase="hero"] [data-composer-card]');

  /* A resolved table is a copy: the authored one keeps the authored names. */
  assert.equal(hostSelectors(documentDouble(undefined)).frame, '._6Qf49G_frame');
});

test('both builds are declared once, with the pinned one first', () => {
  assert.equal(HOST_BUILDS[0], PINNED_BUILD);
  assert.equal(HOST_BUILDS.length, 2);
  assert.equal(PINNED_BUILD.frameClass, '_6Qf49G_frame');
  assert.equal(WINDOWS_BUILD.frameClass, 'BynINW_frame');
});
