import type { Context } from '@deepseek-ai/cordis';
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client';
import type { ThemeRuntime } from '@deepseek-ai/dsh-client-ui-theme/client';
import type { UiWorkspace } from '@deepseek-ai/dsh-client-ui-workspace/client';

export type Disposer = () => void;

/**
 * One settings-path operation, the shape `remote.settings.mutate` accepts on
 * the wire. A nested field is addressed by its path segments — `set()` only
 * ever sends a one-segment path — and `unset` removes the profile override so
 * the schema default takes over again.
 * Source: packages/client/ui-settings/src/client/config-forms.ts and
 * packages/api/settings-controller (`SettingsPathOp`).
 */
export type SettingsPathOp =
  | { readonly op: 'set'; readonly path: readonly string[]; readonly value: unknown }
  | { readonly op: 'unset'; readonly path: readonly string[] };

/** Read side of one namespace's form; only the members this plugin uses. */
export interface ConfigFormSnapshot {
  /** `loading` until the describe view arrives, `ready` once a valid value is served, `unavailable` without one. */
  readonly status: string;
  /** The effective section, projected to the volatile fields; undefined until `ready`. */
  readonly value: unknown;
  /** Host revision of this namespace, the fence every write carries. */
  readonly revision?: number;
  /** Whether the Host will persist a write from this page. */
  readonly writable?: boolean;
}

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
  getSnapshot(): ConfigFormSnapshot;
  /** Observe snapshot replacements. */
  subscribe(listener: () => void): Disposer;
  /** Queue one scalar write into the section; resolves with the Host's verdict. */
  set(field: string, value: unknown): Promise<boolean>;
  /** Queue one field clear, restoring the inherited or default value. */
  unset(field: string): Promise<boolean>;
  /** Queue one atomic namespace mutation, fenced by the revision it was read at. */
  mutate(ops: readonly SettingsPathOp[], expectedRevision?: number): Promise<boolean>;
}

/** Namespace-addressed access to the settings transport. */
export interface ConfigFormsPort {
  /** @param namespace - the loader entry id whose section is wanted. */
  get(namespace: string): ConfigFormPort;
}

/**
 * One right-Sidebar tab as the cross-plugin face reports it: membership only,
 * independent of visible panes.
 * Source: packages/client/ui-sidebar-right/src/client/persistence.ts.
 */
export interface SidebarTabRecord {
  readonly sessionId: string;
  readonly tabId: string;
  readonly kind: string;
  readonly contentId?: string;
}

/**
 * The cross-plugin right-Sidebar face the official panel plugins publish as
 * `ctx.sidebarRight`, a reflect-provided service
 * (`dsh-client-ui-sidebar-right`, "Cross-plugin right-Sidebar face"). That
 * package is not part of this plugin's type baseline, so only the members the
 * header uses are declared here and the real object is passed through
 * unchanged; a partial service means no header views rather than a dead button.
 */
export interface SidebarRightPort {
  /** Open one page kind for the on-screen Session; an unregistered kind throws. */
  openTab(kind: string, options?: { readonly params?: Record<string, string> }): void;
  /** Focus a tab and the pane holding it; a missing tab is left alone. */
  focus(tabId: string): void;
  /** Open tab metadata across adopted Sessions. */
  readonly openTabs: { getSnapshot(): readonly SidebarTabRecord[] };
}

/**
 * The tab-type registry that face publishes as `ctx.sidebarRightTabs`. A header
 * view is only offered while its kind is registered, so a build without the
 * terminal or browser plugin keeps no dead button. Membership is read by
 * presence and observed through the registry's own low-frequency signal.
 * Source: packages/client/ui-sidebar-right/src/client/tab-registry.ts.
 */
export interface SidebarRightTabsPort {
  /** @param kind - page type the panel can place; undefined when unregistered. */
  get(kind: string): unknown;
  /** @param listener - synchronous invalidation callback. */
  subscribe(listener: () => void): Disposer;
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
