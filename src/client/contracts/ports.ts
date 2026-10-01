import type { Context } from '@deepseek-ai/cordis';
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client';
import type { ThemeRuntime } from '@deepseek-ai/dsh-client-ui-theme/client';
import type { UiWorkspace } from '@deepseek-ai/dsh-client-ui-workspace/client';

export type Disposer = () => void;

/**
 * One namespace's configuration form, structurally matching
 * `@deepseek-ai/dsh-client-ui-settings`' `ConfigForm` — the service every
 * settings-backed client plugin reads its own section through. Only the
 * members this plugin uses are declared, and the real service object is passed
 * through unchanged, so no second definition of its behaviour lives here.
 * Source: packages/client/ui-settings/src/client/config-forms.ts.
 */
export interface ConfigFormPort {
  /** Current section snapshot; `value` is the effective section until it is served. */
  getSnapshot(): { readonly status: string; readonly value: unknown; readonly writable?: boolean };
  /** Observe snapshot replacements. */
  subscribe(listener: () => void): Disposer;
  /** Queue one scalar write into the section. */
  set(field: string, value: unknown): unknown;
}

/** Namespace-addressed access to the settings transport. */
export interface ConfigFormsPort {
  /** @param namespace - the loader entry id whose section is wanted. */
  get(namespace: string): ConfigFormPort;
}

/** Actual SDK types, never a second definition of DSH component props. */
export interface HostServices {
  readonly slots: Context['slots'];
  readonly theme: Pick<ThemeRuntime, 'overrideTokens'>;
  readonly workspace: Pick<UiWorkspace, 'openSession' | 'openWorkspace' | 'startSession'>;
  /** The settings transport carrying this plugin's own configuration section. */
  readonly configForms: ConfigFormsPort;
}

export interface DomPort {
  activate(): Disposer;
  mountStyles(css: string): Disposer;
}

export interface Logger {
  debug(message: string): void;
  error(message: string, error: unknown): void;
}
