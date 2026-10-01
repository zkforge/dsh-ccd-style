import type { Disposer } from '../contracts/ports.ts';
import { HOST } from './host-dom.ts';

/** Custom property carrying the active View segment's offset inside the tablist. */
export const VIEW_OFFSET_PROPERTY = '--ccd-view-x';

/** Custom property carrying the active View segment's width. */
export const VIEW_WIDTH_PROPERTY = '--ccd-view-w';

/**
 * The one fact about the Conversation's View switcher a stylesheet cannot work
 * out: which segment is selected, and therefore where the sliding thumb goes.
 *
 * `ui-conversation` renders the switcher itself (`[data-conversation-tabs]`,
 * one `role="tab"` button per registered `conversation.view`) and owns the
 * selection, so the plugin neither reads nor duplicates that state: it restyles
 * the host's own buttons and only measures the selected one. The buttons keep
 * their roles, labels, order and click behaviour — the host still switches the
 * View; this module publishes geometry as custom properties that
 * `features/conversation/conversation.css` prints as the thumb's position.
 *
 * The measurement is kept across element swaps (the header is a session-scoped
 * entry, so switching Sessions rebuilds the tablist) and written synchronously
 * from the observer: an occluded window throttles animation frames, and the
 * thumb has to be in place before the frame is painted.
 *
 * @param document - renderer document carrying the Conversation header.
 * @param report - sink for observer failures; the native tab row stays usable.
 * @returns disposer that disconnects the observer and clears both properties.
 */
export function mountViewSwitch(document: Document, report: (error: unknown) => void): Disposer {
  let scheduled = 0;
  let tabs: HTMLElement | null = null;

  const sync = () => {
    scheduled = 0;
    const next = document.querySelector<HTMLElement>(HOST.conversationTabs);
    if (next !== null) tabs = next;
    if (tabs === null || !tabs.isConnected) return;
    const active = tabs.querySelector<HTMLElement>(HOST.conversationTabActive);
    if (active === null) return;
    /* Measured against the tablist rather than `offsetLeft`, so the value stays
       right whatever the buttons' offset parent turns out to be. */
    const track = tabs.getBoundingClientRect();
    const segment = active.getBoundingClientRect();
    tabs.style.setProperty(VIEW_OFFSET_PROPERTY, `${round(segment.left - track.left)}px`);
    tabs.style.setProperty(VIEW_WIDTH_PROPERTY, `${round(segment.width)}px`);
  };

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
    /* Selection is a class/attribute flip on the host's own buttons and the
       labels are text nodes, so both have to be watched to catch a switch and a
       locale change. */
    observer.observe(document.body, {
      childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: ['class', 'aria-selected'],
    });
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
    tabs?.style.removeProperty(VIEW_OFFSET_PROPERTY);
    tabs?.style.removeProperty(VIEW_WIDTH_PROPERTY);
    tabs = null;
  };
}

/** Half-pixel precision: sub-pixel segment edges must not smear the thumb. */
function round(value: number): number {
  return Math.round(value * 2) / 2;
}
