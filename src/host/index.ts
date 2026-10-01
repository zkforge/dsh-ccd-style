import z from '@deepseek-ai/schemastery';
import { DEFAULT_FEATURES } from '../shared/config.ts';

export const Config = z.object({
  enabled: z.boolean().default(false),
  debug: z.boolean().default(false),
  features: z.object({
    shell: z.boolean().default(DEFAULT_FEATURES.shell),
    sidebar: z.boolean().default(DEFAULT_FEATURES.sidebar),
    'new-session': z.boolean().default(DEFAULT_FEATURES['new-session']),
    conversation: z.boolean().default(DEFAULT_FEATURES.conversation),
    'tool-calls': z.boolean().default(DEFAULT_FEATURES['tool-calls']),
    statistics: z.boolean().default(DEFAULT_FEATURES.statistics),
  }).default({ ...DEFAULT_FEATURES }),
});

/** Browser-only presentation: no Host business logic or profile writes. */
export function apply(): void {}
