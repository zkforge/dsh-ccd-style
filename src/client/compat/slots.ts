/** Verified names; ownership and props must be read from the SDK before registration. */
export const DSH_SLOTS = Object.freeze({
  sidebar: 'sidebar',
  workspaces: 'sidebar.workspaces',
  settings: 'sidebar.settings',
  main: 'main',
  conversation: 'main.conversation',
  header: 'conversation.header',
  sessionHeader: 'conversation.session.header',
  /** Trailing header seats: `utilities` is a list the native actions occupy too. */
  sessionHeaderUtilities: 'conversation.session.header.utilities',
  sessionHeaderCorner: 'conversation.session.header.corner',
  composerBar: 'conversation.composer.bar',
  inputDock: 'conversation.input.dock',
  composerDock: 'conversation.composer.dock',
  toolView: 'tool.call.toolview',
  leading: 'shell.leading',
} as const);

export const OVERRIDE_PRIORITY = -10;
