import type { Disposer } from '../contracts/ports.ts';
import { HOST } from './host-dom.ts';

/** Custom property carrying one pill's short readout. */
export const STAT_VALUE_PROPERTY = '--ccd-stat-value';

/** Custom property carrying the width of the Composer's trailing control group. */
export const TRAILING_WIDTH_PROPERTY = '--ccd-trailing-width';

/** Segment separator the pill labels are built with. */
const SEGMENT = '·';

/**
 * Two facts about the Composer's own readouts that a stylesheet cannot work out:
 *
 * 1. `ui-chat`'s pills render every fact they know as one sentence
 *    (`6 轮 498 步 · 210 tok/s`, `117M tok · 缓存命中 95%`). The reference keeps
 *    one number per icon, so the wanted segment is read from the rendered text —
 *    the rate when the label carries one, the leading count otherwise — and
 *    published as a custom property. The label node itself is never touched, so
 *    React keeps owning its text; the stylesheet only prints the property.
 * 2. The statistics cluster has to sit *before* the model selector, and the dock
 *    is a sibling of the card rather than a row child, so its offset needs the
 *    trailing group's live width. That width is measured, not assumed.
 *
 * @param document - renderer document carrying the Composer.
 * @param report - sink for observer failures; the native readouts stay.
 * @returns disposer that disconnects the observers and clears every property.
 */
export function mountComposerStats(document: Document, report: (error: unknown) => void): Disposer {
  let scheduled = 0;
  let trailing: HTMLElement | null = null;
  let root: HTMLElement | null = null;

  /** One icon, one number: the rate if the label has one, else the leading count. */
  const shorten = (text: string): string => {
    const parts = text.split(SEGMENT).map(part => part.trim()).filter(part => part !== '');
    const [first] = parts;
    if (first === undefined) return '';
    if (parts.length === 1) return first;
    return parts.find(part => part.includes('/')) ?? first;
  };

  const sync = () => {
    scheduled = 0;
    /* The last measurement is kept across element swaps: the Composer is rebuilt
       when the page changes phase, and clearing the property there would drop the
       statistics cluster back onto the model selector for a frame. */
    const nextRoot = document.querySelector<HTMLElement>(HOST.composerRoot);
    if (nextRoot !== null) root = nextRoot;
    const nextTrailing = document.querySelector<HTMLElement>(`${HOST.composerRow} ${HOST.composerTrailing}`);
    if (nextTrailing !== null) trailing = nextTrailing;
    if (root !== null && trailing !== null && trailing.isConnected) {
      root.style.setProperty(TRAILING_WIDTH_PROPERTY, `${Math.round(trailing.getBoundingClientRect().width)}px`);
    }
    for (const pill of document.querySelectorAll<HTMLElement>(HOST.statsPill)) {
      const label = pill.querySelector<HTMLElement>(HOST.statsLabel);
      const value = label === null ? '' : shorten(label.textContent ?? '');
      if (value === '') pill.style.removeProperty(STAT_VALUE_PROPERTY);
      else pill.style.setProperty(STAT_VALUE_PROPERTY, JSON.stringify(value));
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
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.addEventListener('resize', schedule);
    sync();
  } catch (error) {
    observer?.disconnect();
    report(error);
    return () => {};
  }

  return () => {
    scheduled = 0;
    observer?.disconnect();
    window.removeEventListener('resize', schedule);
    root?.style.removeProperty(TRAILING_WIDTH_PROPERTY);
    for (const pill of document.querySelectorAll<HTMLElement>(HOST.statsPill)) {
      pill.style.removeProperty(STAT_VALUE_PROPERTY);
    }
    root = null;
    trailing = null;
  };
}
