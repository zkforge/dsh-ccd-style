/**
 * Copy for the controls this plugin adds to DSH's own header cluster.
 *
 * DSH localises its own strings through `ctx.locale`; a third-party plugin may
 * not borrow another package's namespace, so these two labels follow the
 * document language instead. The glyphs and the actions stay native either way.
 */
export interface HeaderLabels {
  /** Names the stretched hit area that opens the application menu. */
  readonly open: string;
  /** Names the right panel's terminal view. */
  readonly terminal: string;
  /** Names the right panel's browser view. */
  readonly browser: string;
}

/**
 * @param document - renderer document whose language DSH sets from the locale.
 * @returns Chinese copy for a Chinese document, English otherwise.
 */
export function headerLabels(document: Document): HeaderLabels {
  const language = (document.documentElement.lang || globalThis.navigator?.language || '').toLowerCase();
  if (language.startsWith('zh')) {
    return { open: '选择打开方式', terminal: '打开终端', browser: '打开浏览器' };
  }
  return { open: 'Choose how to open', terminal: 'Open terminal', browser: 'Open browser' };
}
