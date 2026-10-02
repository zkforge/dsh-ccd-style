import z from '@deepseek-ai/schemastery';
import {
  DEFAULT_APPEARANCE, DEFAULT_FEATURES, DEFAULT_FONTS, FONT_NAME_MAX_LENGTH,
} from '../shared/config.ts';

/** Same shapes the client normalizer accepts, so both boundaries agree. */
const HEX_COLOUR = /^(#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6})?$/;
const FONT_NAME = new RegExp(`^[\\p{L}\\p{N} ._-]{0,${FONT_NAME_MAX_LENGTH}}$`, 'u');

/**
 * Fields are marked `.volatile()` so the DSH settings layer projects them into
 * a configuration form: only volatile paths are served to the client
 * (`dsh-settings` `volatileForm`/`projectForm`), and the generated form is what
 * the browser half reads through `ctx.configForms.get(entryId)`. Marking them
 * also gives the plugin a real settings surface: the row configuration page
 * registered by the browser half writes these paths back through the same
 * transport, and the Host validates the whole candidate before touching disk.
 *
 * The `pattern` guards are the first of three: the settings boundary rejects an
 * unusable candidate, the configuration page validates before it submits, and
 * `adoptConfig` falls back to the defaults for a hand-edited patch file.
 */
export const Config = z.object({
  enabled: z.boolean().default(false).description('启用 CCD 风格界面').volatile(),
  debug: z.boolean().default(false).description('在控制台输出调试日志').volatile(),
  features: z.object({
    shell: z.boolean().default(DEFAULT_FEATURES.shell),
    sidebar: z.boolean().default(DEFAULT_FEATURES.sidebar),
    'new-session': z.boolean().default(DEFAULT_FEATURES['new-session']),
    conversation: z.boolean().default(DEFAULT_FEATURES.conversation),
    'tool-calls': z.boolean().default(DEFAULT_FEATURES['tool-calls']),
    statistics: z.boolean().default(DEFAULT_FEATURES.statistics),
  }).default({ ...DEFAULT_FEATURES }).description('按模块启用').volatile(),
  /* One volatile node per section, exactly like `features`: Cordis rejects a
     volatile field nested inside another volatile field ("volatile fields
     require a fixed object path without an enclosing volatile field"), and a
     volatile object already makes its whole subtree editable. */
  appearance: z.object({
    canvas: z.string().default(DEFAULT_APPEARANCE.canvas)
      .description('会话与画布背景色（#rrggbb，留空用内置值）')
      .pattern(HEX_COLOUR),
    sidebar: z.string().default(DEFAULT_APPEARANCE.sidebar)
      .description('侧栏背景色（#rrggbb，留空用内置值）')
      .pattern(HEX_COLOUR),
  }).default({ ...DEFAULT_APPEARANCE }).description('背景色').volatile(),
  fonts: z.object({
    uiLatin: z.string().default(DEFAULT_FONTS.uiLatin)
      .description('界面西文字体名（留空用系统栈）')
      .pattern(FONT_NAME),
    uiCjk: z.string().default(DEFAULT_FONTS.uiCjk)
      .description('界面中文字体名（留空用系统栈）')
      .pattern(FONT_NAME),
    code: z.string().default(DEFAULT_FONTS.code)
      .description('代码与等宽字体名（留空用系统栈）')
      .pattern(FONT_NAME),
  }).default({ ...DEFAULT_FONTS }).description('字体').volatile(),
});

/** Browser-only presentation: no Host business logic and no profile writes. */
export function apply(): void {}
