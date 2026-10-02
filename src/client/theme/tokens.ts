import type { ThemeTokenOverrides } from '@deepseek-ai/dsh-client-ui-theme/client';
import type { StyleConfig } from '../../shared/config.ts';
import { BUILT_IN_SURFACES, derivePalette } from './palette.ts';

/**
 * The token layer this plugin stacks over the active theme.
 *
 * `ctx.theme.overrideTokens` accepts any custom-property name — validation only
 * checks that each value is a `{ light, dark }` pair — and the presenter writes
 * every entry onto `document.body` as an inline variable, which is what makes
 * an app-wide colour and typeface reachable from a plugin. The plugin keeps a
 * light-only promise, so both sides of each pair carry the same value.
 *
 * Two groups travel together:
 * - the host's own semantic tokens (`--dsw-alias-bg-base`,
 *   `--dsw-specific-sidebar-fill`, `--dsw-alias-border-l3`, `--dsw-font-family`,
 *   `--ds-font-family-code`), so the native interface follows the same colours;
 * - the plugin's `--ccd-*` tokens, which every feature stylesheet consumes.
 *
 * The `--ccd-*` group is only emitted for what the user actually configured:
 * unconfigured tokens keep the declarations in `theme/tokens.css` authoritative,
 * so the built-in look is untouched by this layer.
 */
export const THEME_OVERRIDE_SOURCE = 'dsh-ccd-style';

/** Host semantic surfaces the CCD canvas replaces. */
export const HOST_SURFACE_TOKENS = Object.freeze({
  base: '--dsw-alias-bg-base',
  sidebar: '--dsw-specific-sidebar-fill',
  border: '--dsw-alias-border-l3',
});

/** Host typography tokens; both drive app-wide stacks. */
export const HOST_FONT_TOKENS = Object.freeze({
  ui: '--dsw-font-family',
  code: '--ds-font-family-code',
});

/**
 * Fallback tails live in `theme/tokens.css` next to the built-in stacks, so the
 * composed value references them instead of copying a font list into TypeScript.
 */
const UI_FALLBACK = 'var(--ccd-font-fallback)';
const CODE_FALLBACK = 'var(--ccd-code-fallback)';

interface TokenModes { readonly light: string; readonly dark: string }

function pair(value: string): TokenModes {
  return { light: value, dark: value };
}

/** One family name per entry, in fallback order, closed by the built-in tail. */
function composeStack(names: readonly string[], fallback: string): string {
  return [...names.map(name => `"${name}"`), fallback].join(', ');
}

function surfaceTokens(config: StyleConfig): Record<string, TokenModes> {
  const { canvas, sidebar } = config.appearance;
  const palette = derivePalette(canvas, sidebar);
  const tokens: Record<string, TokenModes> = {
    [HOST_SURFACE_TOKENS.base]: pair(palette.canvas),
    [HOST_SURFACE_TOKENS.sidebar]: pair(palette.sidebar),
    /* The built-in border is measured against the built-in canvas; only a
       configured canvas brings its own line steps, so configuring the sidebar
       alone leaves every other built-in value byte for byte. */
    [HOST_SURFACE_TOKENS.border]: pair(canvas === '' ? BUILT_IN_SURFACES.border : palette.border),
  };
  if (canvas !== '') {
    tokens['--ccd-canvas'] = pair(palette.canvas);
    tokens['--ccd-card'] = pair(palette.card);
    tokens['--ccd-track'] = pair(palette.track);
    tokens['--ccd-raised'] = pair(palette.raised);
    tokens['--ccd-hover'] = pair(palette.hover);
    tokens['--ccd-selected'] = pair(palette.selected);
    tokens['--ccd-border'] = pair(palette.border);
    tokens['--ccd-border-strong'] = pair(palette.borderStrong);
    tokens['--ccd-border-soft'] = pair(palette.borderSoft);
    tokens['--ccd-table-head-line'] = pair(palette.tableHeadLine);
  }
  if (sidebar !== '') tokens['--ccd-sidebar'] = pair(palette.sidebar);
  return tokens;
}

function fontTokens(config: StyleConfig): Record<string, TokenModes> {
  const { uiLatin, uiCjk, code } = config.fonts;
  const tokens: Record<string, TokenModes> = {};
  if (uiLatin !== '' || uiCjk !== '') {
    const stack = composeStack([uiLatin, uiCjk].filter(name => name !== ''), UI_FALLBACK);
    tokens[HOST_FONT_TOKENS.ui] = pair(stack);
    tokens['--ccd-font-ui'] = pair(stack);
  }
  if (code !== '') {
    const stack = composeStack([code], CODE_FALLBACK);
    tokens[HOST_FONT_TOKENS.code] = pair(stack);
    tokens['--ccd-font-code'] = pair(stack);
  }
  return tokens;
}

/**
 * Resolve the whole override layer for one configuration.
 * @param config - the adopted configuration section.
 * @returns token overrides keyed by custom-property name; never empty, because
 * the host surface tokens always travel with the plugin's own canvas.
 */
export function resolveThemeTokens(config: StyleConfig): ThemeTokenOverrides {
  return { ...surfaceTokens(config), ...fontTokens(config) };
}
