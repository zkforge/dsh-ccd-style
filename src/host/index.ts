import z from '@deepseek-ai/schemastery';
import { DEFAULT_FEATURES } from '../shared/config.ts';

/**
 * Fields are marked `.volatile()` so the DSH settings layer projects them into
 * a configuration form: only volatile paths are served to the client
 * (`dsh-settings` `volatileForm`/`projectForm`), and the generated form is what
 * the browser half reads through `ctx.configForms.get(entryId)`. Marking them
 * also gives the plugin a real settings surface with no bespoke UI.
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
});

/** Browser-only presentation: no Host business logic and no profile writes. */
export function apply(): void {}
