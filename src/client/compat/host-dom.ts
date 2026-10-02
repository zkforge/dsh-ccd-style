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
 * - `packages/client/ui-model-selection/src/client/ModelSelect.module.css` (`cl2Rlq_`)
 * - `packages/client/ui-permission-presets/src/client/PermissionSelect.module.css` (`wXeviG_`)
 * - `packages/experimental/client-ui-agent-team/src/client/TeamAction.module.css` (`_2tNPVa_`)
 * - `packages/client/ui-agent-preset/src/client/AgentPresetLabel.module.css` (`_3li69W_`)
 * - `packages/client/ui-open-in-app/src/client/OpenTargetButton.module.css` (`iq4beG_`)
 * - `packages/session-query/session-log-export/src/client/HeaderAction.module.css` (`Da3aKq_`)
 * - `packages/client/ui-conversation/src/client/ConversationHero.module.css` (`bocITq_`)
 * - `packages/client/ui-conversation/src/client/skeleton/ContextMeter.module.css` (`y0jqnG_`)
 * - `packages/client/ui-attachment/src/client/ComposerAttachments.module.css` (`dVdiKa_`)
 * - `packages/client/ui-chat/src/client/chat/StatsPills.module.css` (`OpZ85W_`)
 * - `packages/client/ui-workspace/src/client/WorkspaceBrowser.module.css` (`_7514NG_`)
 * - `packages/client/ui-settings/src/client/SettingsRoot.module.css` (`Dws9Sa_`)
 * - `packages/client/ui-settings-account/src/client/AccountMenu.module.css` (`ZogL4G_`)
 * - `packages/client/ui-primitives/lib/Menu.module.css` (`_4ub78_`, `_ri079_`)
 * - `packages/client/ui-primitives/lib/Menu.js` (`MenuItemButton`: the icon seat
 *   `account-menu.css` scales; its `[role="menuitem"] > span` structure)
 * - `packages/client/ui-chat/src/client/chat/AssistantMarkdown.module.css` (`gKv1-q_`)
 * - `packages/client/ui-primitives/lib/markdown/MarkdownText.module.css`
 *   (static web-frontend bundle: `_1ypvv_`; shared by Web and Desktop)
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
  /** SidebarRoot.module.css: expanded macOS window-chrome toggle. */
  sidebarToggle: '._3WPZCG_toggle',
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
  conversationCrumb: '.ST7X_W_crumb',
  /** ConversationRoot.tsx: the header's trailing corner seat. */
  headerCorner: '[data-conversation-header-corner]',
  /** OpenTargetButton.module.css: the anchor the native application menu hangs from. */
  openTargetAnchor: '.iq4beG_menuAnchor',
  /** OpenTargetButton.module.css: the bordered split box that becomes one hit box here. */
  openTargetSplit: '.iq4beG_split',
  /** OpenTargetButton.module.css: leading icon half of the native split button. */
  openTargetMain: '.iq4beG_main',
  /** OpenTargetButton.module.css: the only control that opens the application menu. */
  openTargetChevron: '.iq4beG_chevron',
  /** OpenTargetButton.module.css: the chosen application's own image. */
  openTargetAppIcon: '.iq4beG_appIcon',
  /** session-log-export/HeaderAction.module.css: native session action menu. */
  sessionMoreButton: '.Da3aKq_moreButton',
  /** sidebar-right/ExpandButton.tsx: the collapsed rightbar's only re-entry control. */
  sidebarRightExpand: '[data-sidebar-right-expand]',
  conversationBody: '.ST7X_W_body',
  assistantMarkdown: '.gKv1-q_root',
  markdownBody: '._markdown_1ypvv_5:not([data-markdown-variant="compact"])',
  markdownFileMention: '._fileMention_1ypvv_85',
  conversationScroll: '.ST7X_W_scrollBody',
  conversationTabs: '.ST7X_W_tabs',
  conversationTab: '.ST7X_W_tab',
  conversationTabActive: '.ST7X_W_tabActive',
  composerSeat: '.ST7X_W_composerSeat',
  composerStack: '.ST7X_W_composerStack',
  composerRoot: '.yhfFVG_root',
  composerCard: '[data-composer-card]',
  composerCardClass: '.yhfFVG_card',
  /** InputBar.module.css: workspace-less card's dashed ::after picker outline. */
  composerCardWorkspaceTrigger: '.yhfFVG_cardWorkspaceTrigger',
  composerScroll: '.yhfFVG_scroll',
  composerInput: '.yhfFVG_input',
  /** InputBar.module.css: overlay hint, distinct from the editable text. */
  composerPlaceholder: '.yhfFVG_placeholder',
  composerAdd: '.yhfFVG_add',
  composerPrimary: '.yhfFVG_primary',
  composerRow: '.yhfFVG_row',
  composerTools: '.yhfFVG_tools',
  composerDock: '.yhfFVG_dock',
  composerTrailing: '.yhfFVG_trailing',
  /** The draft-image rail the `ui-attachment` plugin renders into the card,
      above the input panel (composer.css merges it into the input surface). */
  composerAttachmentRail: '.dVdiKa_rail',
  /** ComposerAttachments.module.css: the draft image button clips its image. */
  composerAttachmentThumbnail: '.dVdiKa_thumbnail',
  /** The Composer's model selector: one trigger carrying both texts. */
  modelSelectTrigger: '.cl2Rlq_trigger, [data-ccd-model-controls]',
  modelSelectLabel: '.cl2Rlq_triggerLabel',
  modelSelectEffort: '.cl2Rlq_triggerEffort',
  /** PermissionSelect.module.css: compact permission text, keeping its button. */
  permissionSelectLabel: '.wXeviG_triggerLabel',
  /** TeamAction.module.css: native team dialog entry, retaining its label at every width. */
  teamActionTrigger: '._2tNPVa_trigger',
  teamActionLabel: '._2tNPVa_triggerLabel',
  /** AgentPresetLabel.module.css: passive mode description, omitted from the conversation header. */
  presetModeLabel: '._3li69W_label',
  /** AgentPresetLabel.module.css: redundant icon may yield space to its text. */
  presetModeIcon: '._3li69W_icon',
  statsAnchor: '.OpZ85W_anchor',
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
  /** The element that actually scrolls the Conversation page. In the pinned
      layout the transcript column inside it is `overflow: visible`, so this is
      the scroll viewport the edge fade has to describe. */
  conversationScroll: '[data-conversation-scroll]',
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
