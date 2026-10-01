import type { ThemeTokenOverrides } from '@deepseek-ai/dsh-client-ui-theme/client';

/**
 * Semantic surfaces the CCD canvas replaces. Token names were confirmed against
 * the pinned `@deepseek-ai/dsh-client-ui-theme` 0.2.0-rc.2 token table; a
 * missing token makes `overrideTokens` a no-op rather than an error, so the
 * dark pair is declared for the same value to keep the light-first scope honest
 * instead of silently inheriting a half-applied palette.
 */
export const themeOverrides: ThemeTokenOverrides = {
  '--dsw-alias-bg-base': { light: '#fcfcfb', dark: '#fcfcfb' },
  '--dsw-specific-sidebar-fill': { light: '#fbfbfa', dark: '#fbfbfa' },
  '--dsw-alias-border-l3': { light: '#e3e3e1', dark: '#e3e3e1' },
};
