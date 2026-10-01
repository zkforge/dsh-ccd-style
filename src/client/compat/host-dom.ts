/**
 * Version-pinned host DOM facts.
 *
 * Every selector here was read from the running DSH `0.2.0-rc.2` renderer and
 * cross-checked against the shipped CSS-module class names of the pinned UI
 * packages. DSH hashes CSS-module class names per build, so these are the one
 * place that may need updating for another DSH release; nothing outside this
 * module may hard-code a host class name.
 *
 * Sources (app.asar, `0.2.0-rc.2`):
 * - `packages/client/ui-layout/src/client/AppFrame.module.css` (`_6Qf49G_`)
 * - `packages/client/ui-sidebar/src/client/SidebarRoot.module.css` (`_3WPZCG_`)
 * - `packages/client/ui-conversation/src/client/ConversationRoot.module.css` (`ST7X_W_`)
 * - `packages/client/ui-conversation/src/client/InputBar.module.css` (`yhfFVG_`)
 * - `packages/client/ui-conversation/src/client/ConversationHero.module.css` (`bocITq_`)
 * - `packages/client/ui-conversation/src/client/skeleton/ContextMeter.module.css` (`y0jqnG_`)
 * - `packages/client/ui-chat/src/client/chat/StatsPills.module.css` (`OpZ85W_`)
 * - `packages/client/ui-workspace/src/client/WorkspaceBrowser.module.css` (`_7514NG_`)
 * - `packages/client/ui-settings/src/client/SettingsRoot.module.css` (`Dws9Sa_`)
 * - `packages/client/ui-settings-account/src/client/AccountMenu.module.css` (`ZogL4G_`)
 * - `packages/client/ui-primitives/lib/Menu.module.css` (`_4ub78_`, `_ri079_`)
 */
export const HOST = Object.freeze({
  frame: '._6Qf49G_frame',
  sidebarColumn: '._6Qf49G_sidebarCol',
  centerColumn: '._6Qf49G_centerCol',
  rightbarColumn: '._6Qf49G_rightbarCol',
  resizeHandle: '._6Qf49G_handle',
  sidebarRoot: '._3WPZCG_root',
  sidebarLogoRow: '._3WPZCG_logoRow',
  sidebarBrand: '._3WPZCG_brand',
  sidebarBrandName: '._3WPZCG_brandName',
  sidebarTopStrip: '._3WPZCG_topStrip',
  sidebarNewSession: '._3WPZCG_newSession',
  sidebarNewSessionLabel: '._3WPZCG_newSessionLabel',
  sidebarNewSessionShortcut: '._3WPZCG_newSessionShortcut',
  sidebarPanelList: '._3WPZCG_panelList',
  sidebarPanelRow: '._3WPZCG_panelRow',
  sidebarPanelTitle: '._3WPZCG_panelTitle',
  sidebarPanelGlyph: '._3WPZCG_panelGlyph',
  sidebarRegionArea: '._3WPZCG_regionArea',
  sidebarFootArea: '._3WPZCG_footArea',
  sidebarSettingsArea: '._3WPZCG_settingsArea',
  sidebarIconButton: '._3WPZCG_iconButton',
  browserRoot: '._7514NG_root',
  browserSectionHeader: '._7514NG_sectionHeader',
  browserSectionLabel: '._7514NG_sectionLabel',
  browserListArea: '._7514NG_listArea',
  settingsTrigger: '.Dws9Sa_trigger',
  settingsTriggerRow: '.Dws9Sa_triggerRow',
  accountTrigger: '.ZogL4G_trigger',
  accountLabel: '.ZogL4G_label',
  conversationRoot: '.ST7X_W_root',
  conversationHeader: '.ST7X_W_header',
  conversationBody: '.ST7X_W_body',
  conversationScroll: '.ST7X_W_scrollBody',
  conversationTabs: '.ST7X_W_tabs',
  conversationTab: '.ST7X_W_tab',
  conversationTabActive: '.ST7X_W_tabActive',
  composerSeat: '.ST7X_W_composerSeat',
  composerStack: '.ST7X_W_composerStack',
  composerRoot: '.yhfFVG_root',
  composerCard: '[data-composer-card]',
  composerCardClass: '.yhfFVG_card',
  composerScroll: '.yhfFVG_scroll',
  composerInput: '.yhfFVG_input',
  composerAdd: '.yhfFVG_add',
  composerPrimary: '.yhfFVG_primary',
  composerRow: '.yhfFVG_row',
  composerTools: '.yhfFVG_tools',
  composerDock: '.yhfFVG_dock',
  composerTrailing: '.yhfFVG_trailing',
  statsRoot: '.OpZ85W_root',
  statsLabel: '.OpZ85W_label',
  statsSeparator: '.OpZ85W_sep',
  statsPill: '.OpZ85W_pill',
  contextMeterTrigger: '.y0jqnG_trigger',
  heroRoot: '.bocITq_root',
  heroHeadline: '.bocITq_headline',
  heroWorkspaceChip: '.bocITq_workspace',
  heroWorkspaceRow: '.ST7X_W_heroWorkspaceRow',
  /** Every menu surface the `Menu` primitive renders, portal or in place. */
  menu: '[role="menu"]',
  menuItem: '[role="menuitem"]',
} as const);

/**
 * Anchors that must exist before a feature may touch the host DOM. They are
 * stable data attributes rather than hashed class names, so a failed probe
 * means the frame is not the pinned one and the feature must stay off.
 */
export const ANCHOR = Object.freeze({
  frame: '[data-slot="root"] > div',
  sidebar: '[data-slot="sidebar"]',
  workspaces: '[data-slot="sidebar.workspaces"]',
  settings: '[data-slot="sidebar.settings"]',
  conversation: '[data-conversation-content]',
  composerSeat: '[data-composer-seat]',
  composerCard: '[data-composer-card]',
} as const);

export interface HostProbe {
  readonly frame: boolean;
  readonly sidebar: boolean;
  readonly workspaces: boolean;
  readonly conversation: boolean;
  readonly composer: boolean;
}

/** @param document - the renderer document to probe. */
export function probeHost(document: Document): HostProbe {
  const has = (selector: string) => document.querySelector(selector) !== null;
  return {
    frame: has(ANCHOR.frame),
    sidebar: has(ANCHOR.sidebar),
    workspaces: has(ANCHOR.workspaces),
    conversation: has(ANCHOR.conversation),
    composer: has(ANCHOR.composerSeat) && has(ANCHOR.composerCard),
  };
}
