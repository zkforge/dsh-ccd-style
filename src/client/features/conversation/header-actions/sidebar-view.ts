import type { Context } from '@deepseek-ai/cordis';
import type { SidebarRightPort, SidebarRightTabsPort } from '../../../contracts/ports.ts';

/** Read the cross-plugin right-Sidebar face, or nothing when this build lacks it. */
export function resolveSidebarRight(scope: Context): SidebarRightPort | undefined {
  const service = (scope as Context & { sidebarRight?: SidebarRightPort }).sidebarRight;
  if (typeof service?.openTab !== 'function' || typeof service.focus !== 'function') return undefined;
  return service;
}

/** Read the tab-type registry that decides which views exist in this build. */
export function resolveSidebarTabs(scope: Context): SidebarRightTabsPort | undefined {
  const registry = (scope as Context & { sidebarRightTabs?: SidebarRightTabsPort }).sidebarRightTabs;
  return typeof registry?.get === 'function' ? registry : undefined;
}

/**
 * Focus the Session's existing view of this kind, or open a new one.
 *
 * `openTab` places a page at the address the panel records pages under, which
 * would front an already-open view for kinds that allow one instance; the
 * inventory snapshot lets the header focus that tab instead of stacking a
 * second one. Terminal views may legitimately be multiple, so the first match
 * wins — the panel's own guide still offers a new one. A build whose face does
 * not carry the inventory falls back to plain `openTab`.
 *
 * @param sidebar - the right-Sidebar face.
 * @param kind - page type to reveal.
 * @param sessionId - Session whose header was clicked.
 */
export function openView(sidebar: SidebarRightPort, kind: string, sessionId: string): void {
  const tabs = typeof sidebar.openTabs?.getSnapshot === 'function' ? sidebar.openTabs.getSnapshot() : [];
  const existing = tabs.find(tab => tab.sessionId === sessionId && tab.kind === kind);
  if (existing === undefined) sidebar.openTab(kind);
  else sidebar.focus(existing.tabId);
}
