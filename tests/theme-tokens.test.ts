import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { adoptConfig, resolveConfig } from '../src/shared/config.ts';
import { BUILT_IN_SURFACES, derivePalette, formatColour, mixColour, parseColour } from '../src/client/theme/palette.ts';
import { resolveThemeTokens } from '../src/client/theme/tokens.ts';

const tokensSheet = readFileSync(
  fileURLToPath(new URL('../src/client/theme/tokens.css', import.meta.url)),
  'utf8',
);

function declaredColour(name: string): string | undefined {
  return new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i').exec(tokensSheet)?.[1];
}

function brightness(colour: string): number {
  const rgb = parseColour(colour);
  assert.ok(rgb !== undefined, `${colour} should parse`);
  return rgb.r + rgb.g + rgb.b;
}

test('the built-in surfaces agree with the stylesheet they fall back to', () => {
  assert.equal(declaredColour('ccd-canvas'), BUILT_IN_SURFACES.canvas);
  assert.equal(declaredColour('ccd-sidebar'), BUILT_IN_SURFACES.sidebar);
  assert.equal(declaredColour('ccd-border'), BUILT_IN_SURFACES.border);
});

test('the rule under a table head reads darker than the card outline', () => {
  const outline = declaredColour('ccd-border');
  const headLine = declaredColour('ccd-table-head-line');
  assert.ok(outline !== undefined && headLine !== undefined, 'both lines should be declared');
  assert.ok(brightness(headLine) < brightness(outline), 'the head rule is the stronger of the two');
  assert.ok(brightness(headLine) > brightness(declaredColour('ccd-text') ?? '#000000'), 'and stays a line, not text');
});

test('colour arithmetic is deterministic and stays in range', () => {
  assert.deepEqual(parseColour('#000000'), { r: 0, g: 0, b: 0 });
  assert.deepEqual(parseColour('#ffffff'), { r: 255, g: 255, b: 255 });
  assert.equal(parseColour('#fff'), undefined);
  assert.equal(formatColour({ r: 300, g: -20, b: 127.6 }), '#ff0080');
  assert.deepEqual(mixColour({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }, 0.5), { r: 127.5, g: 127.5, b: 127.5 });
  assert.deepEqual(parseColour(derivePalette('', '').canvas), parseColour(BUILT_IN_SURFACES.canvas));
  assert.deepEqual(parseColour(derivePalette('not-a-colour', '').canvas), parseColour(BUILT_IN_SURFACES.canvas));
});

test('an unconfigured plugin keeps the built-in surfaces byte for byte', () => {
  const tokens = resolveThemeTokens(resolveConfig());
  assert.deepEqual(tokens['--dsw-alias-bg-base'], { light: '#fcfcfb', dark: '#fcfcfb' });
  assert.deepEqual(tokens['--dsw-specific-sidebar-fill'], { light: '#fbfbfa', dark: '#fbfbfa' });
  assert.deepEqual(tokens['--dsw-alias-border-l3'], { light: '#e3e3e1', dark: '#e3e3e1' });
  assert.equal('--ccd-canvas' in tokens, false);
  assert.equal('--ccd-sidebar' in tokens, false);
  assert.equal('--dsw-font-family' in tokens, false);
  assert.equal('--ds-font-family-code' in tokens, false);
});

test('a configured canvas brings its own derived steps and leaves the sidebar alone', () => {
  const tokens = resolveThemeTokens(adoptConfig({ appearance: { canvas: '#303030' } }));
  const base = '#303030';
  assert.deepEqual(tokens['--ccd-canvas'], { light: base, dark: base });
  assert.deepEqual(tokens['--dsw-alias-bg-base'], { light: base, dark: base });
  for (const name of ['--ccd-hover', '--ccd-selected', '--ccd-track', '--ccd-raised', '--ccd-border', '--ccd-border-strong', '--ccd-border-soft', '--ccd-table-head-line']) {
    const value = tokens[name]?.light;
    assert.ok(typeof value === 'string' && value.startsWith('#'), `${name} should be a colour`);
    assert.ok(brightness(value) < brightness(base), `${name} should step away from the base`);
    assert.equal(tokens[name]?.dark, value);
  }
  assert.ok(brightness(tokens['--ccd-card']?.light ?? base) > brightness(base), 'the card sits above the canvas');
  assert.equal('--ccd-sidebar' in tokens, false);
  assert.deepEqual(tokens['--dsw-specific-sidebar-fill'], { light: '#fbfbfa', dark: '#fbfbfa' });
});

test('a configured sidebar stays independent of the canvas', () => {
  const tokens = resolveThemeTokens(adoptConfig({ appearance: { sidebar: '#f0eee9' } }));
  assert.deepEqual(tokens['--ccd-sidebar'], { light: '#f0eee9', dark: '#f0eee9' });
  assert.deepEqual(tokens['--dsw-specific-sidebar-fill'], { light: '#f0eee9', dark: '#f0eee9' });
  assert.equal('--ccd-canvas' in tokens, false);
  assert.deepEqual(tokens['--dsw-alias-border-l3'], { light: BUILT_IN_SURFACES.border, dark: BUILT_IN_SURFACES.border });
});

test('typefaces compose in fallback order and reach both host tokens', () => {
  const tokens = resolveThemeTokens(adoptConfig({
    fonts: { uiLatin: 'Newsreader', uiCjk: 'PingFang SC', code: 'JetBrains Mono' },
  }));
  const ui = '"Newsreader", "PingFang SC", var(--ccd-font-fallback)';
  const code = '"JetBrains Mono", var(--ccd-code-fallback)';
  assert.deepEqual(tokens['--dsw-font-family'], { light: ui, dark: ui });
  assert.deepEqual(tokens['--ccd-font-ui'], { light: ui, dark: ui });
  assert.deepEqual(tokens['--ds-font-family-code'], { light: code, dark: code });
  assert.deepEqual(tokens['--ccd-font-code'], { light: code, dark: code });
});

test('one configured family still composes a complete stack', () => {
  const tokens = resolveThemeTokens(adoptConfig({ fonts: { uiCjk: '思源黑体' } }));
  assert.deepEqual(tokens['--dsw-font-family'], {
    light: '"思源黑体", var(--ccd-font-fallback)',
    dark: '"思源黑体", var(--ccd-font-fallback)',
  });
  assert.equal('--ds-font-family-code' in tokens, false);
});

test('both configuration sections travel in one override layer', () => {
  const tokens = resolveThemeTokens(adoptConfig({
    appearance: { canvas: '#101418', sidebar: '#0c1014' },
    fonts: { code: 'Fira Code' },
  }));
  assert.deepEqual(tokens['--ccd-sidebar'], { light: '#0c1014', dark: '#0c1014' });
  assert.deepEqual(tokens['--dsw-alias-bg-base'], { light: '#101418', dark: '#101418' });
  assert.equal(typeof tokens['--dsw-font-family'], 'undefined');
  assert.equal(typeof tokens['--ds-font-family-code'], 'object');
});
