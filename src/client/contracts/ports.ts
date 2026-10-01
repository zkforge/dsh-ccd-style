import type { Context } from '@deepseek-ai/cordis';
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client';
import type { ThemeRuntime } from '@deepseek-ai/dsh-client-ui-theme/client';
import type { UiWorkspace } from '@deepseek-ai/dsh-client-ui-workspace/client';

export type Disposer = () => void;

/** Actual SDK types, never a second definition of DSH component props. */
export interface HostServices {
  readonly slots: Context['slots'];
  readonly theme: Pick<ThemeRuntime, 'overrideTokens'>;
  readonly workspace: Pick<UiWorkspace, 'openSession' | 'openWorkspace' | 'startSession'>;
}

export interface DomPort {
  activate(): Disposer;
  mountStyles(css: string): Disposer;
}

export interface Logger {
  debug(message: string): void;
  error(message: string, error: unknown): void;
}
