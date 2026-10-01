import type { Disposer } from '../contracts/ports.ts';
import { HOST } from './host-dom.ts';

/** Short readout mirrored from native text for wide columns only. */
export const STAT_VALUE_PROPERTY = '--ccd-stat-value';

/** Custom property carrying the width of the Composer's trailing control group. */
export const TRAILING_WIDTH_PROPERTY = '--ccd-trailing-width';

/** Remaining model-button space after leading controls, statistics and gaps. */
export const MODEL_MAX_WIDTH_PROPERTY = '--ccd-model-max-width';

/**
 * The responsive statistics cluster sits before the model selector. Its dock is
 * a sibling of the card rather than a row child, so its wide-layout offset needs
 * the trailing group's live width. Readouts and their detail dialogs stay owned
 * by the host; wide columns mirror one short segment without changing the host label.
 *
 * @param document - renderer document carrying the Composer.
 * @param report - sink for observer failures; the native readouts stay.
 * @returns disposer that disconnects the observers and clears every property.
 */
export function mountComposerStats(document: Document, report: (error: unknown) => void): Disposer {
  let scheduled = 0;
  let trailing: HTMLElement | null = null;
  let root: HTMLElement | null = null;

  const sync = () => {
    scheduled = 0;
    for (const pill of document.querySelectorAll<HTMLElement>(HOST.statsPill)) {
      const parts = (pill.querySelector(HOST.statsLabel)?.textContent ?? '')
        .split('·').map(part => part.trim()).filter(Boolean);
      const value = parts.find(part => part.includes('/')) ?? parts[0] ?? '';
      const quoted = value === '' ? '' : JSON.stringify(value);
      if (pill.style.getPropertyValue(STAT_VALUE_PROPERTY) !== quoted) {
        if (quoted === '') pill.style.removeProperty(STAT_VALUE_PROPERTY);
        else pill.style.setProperty(STAT_VALUE_PROPERTY, quoted);
      }
    }
    /* The last measurement is kept across element swaps: the Composer is rebuilt
       when the page changes phase, and clearing the property there would drop the
       statistics cluster back onto the model selector for a frame. */
    const nextRoot = document.querySelector<HTMLElement>(HOST.composerRoot);
    if (nextRoot !== null) root = nextRoot;
    const nextTrailing = document.querySelector<HTMLElement>(`${HOST.composerRow} ${HOST.composerTrailing}`);
    if (nextTrailing !== null) trailing = nextTrailing;
    if (root !== null && trailing !== null && trailing.isConnected) {
      const width = `${Math.round(trailing.getBoundingClientRect().width)}px`;
      if (root.style.getPropertyValue(TRAILING_WIDTH_PROPERTY) !== width) {
        root.style.setProperty(TRAILING_WIDTH_PROPERTY, width);
      }
      const row = document.querySelector<HTMLElement>(HOST.composerRow);
      const dock = root.querySelector<HTMLElement>(HOST.composerDock);
      const model = trailing.querySelector<HTMLElement>(HOST.modelSelectTrigger);
      if (row !== null && dock !== null && model !== null) {
        const style = getComputedStyle(row);
        const available = row.getBoundingClientRect().width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        const leading = Array.from(row.children).filter(child => child !== trailing)
          .map(child => child.getBoundingClientRect().width).filter(width => width > 0);
        const extras = Math.max(0, trailing.getBoundingClientRect().width - model.getBoundingClientRect().width);
        const dockWidth = dock.getBoundingClientRect().width;
        const dockGap = dockWidth > 0 ? parseFloat(getComputedStyle(root).getPropertyValue('--ccd-dock-gap')) : 0;
        const room = Math.max(0, Math.floor(available - leading.reduce((sum, width) => sum + width, 0)
          - leading.length * parseFloat(style.columnGap) - extras - dockWidth - dockGap));
        const maxWidth = `${room}px`;
        if (root.style.getPropertyValue(MODEL_MAX_WIDTH_PROPERTY) !== maxWidth) {
          root.style.setProperty(MODEL_MAX_WIDTH_PROPERTY, maxWidth);
        }
      }
    }
  };

  /* Straight from the observer: an occluded window throttles animation frames,
     and these values have to be right when the frame is finally painted. */
  const schedule = () => {
    if (scheduled !== 0) return;
    scheduled = 1;
    try {
      sync();
    } finally {
      scheduled = 0;
    }
  };

  let observer: MutationObserver | undefined;
  try {
    observer = new MutationObserver(schedule);
    /* Dragging a panel changes the frame's inline grid tracks, not the window
       size. Native model collapse can also change after a layout pass. Watch
       both; guarded property writes prevent our own styles feeding a loop. */
    observer.observe(document.body, {
      childList: true, subtree: true, characterData: true, attributes: true,
      attributeFilter: ['style', 'class', 'data-model-compact'],
    });
    window.addEventListener('resize', schedule);
    sync();
  } catch (error) {
    observer?.disconnect();
    window.removeEventListener('resize', schedule);
    report(error);
    return () => {};
  }

  return () => {
    scheduled = 0;
    observer?.disconnect();
    window.removeEventListener('resize', schedule);
    root?.style.removeProperty(TRAILING_WIDTH_PROPERTY);
    root?.style.removeProperty(MODEL_MAX_WIDTH_PROPERTY);
    for (const pill of document.querySelectorAll<HTMLElement>(HOST.statsPill)) {
      pill.style.removeProperty(STAT_VALUE_PROPERTY);
    }
    root = null;
    trailing = null;
  };
}
