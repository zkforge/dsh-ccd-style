import type { Disposer } from '../contracts/ports.ts';
import { HOST } from './host-dom.ts';

/** Custom property carrying the active View segment's offset inside the tablist. */
export const VIEW_OFFSET_PROPERTY = '--ccd-view-x';

/** Custom property carrying the active View segment's width. */
export const VIEW_WIDTH_PROPERTY = '--ccd-view-w';

/** Animate selection changes; layout corrections must be immediate. */
export const VIEW_DURATION_PROPERTY = '--ccd-view-duration';

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
 * @returns disposer that disconnects the observer and clears every property.
 */
export function mountViewSwitch(document: Document, report: (error: unknown) => void): Disposer {
  let scheduled = 0;
  let tabs: HTMLElement | null = null;
  let selected: HTMLElement | null = null;

  const sync = () => {
    scheduled = 0;
    const next = document.querySelector<HTMLElement>(HOST.conversationTabs);
    if (next !== null && next !== tabs) {
      tabs = next;
      selected = null;
    }
    if (tabs === null || !tabs.isConnected) return;
    const active = tabs.querySelector<HTMLElement>(HOST.conversationTabActive);
    if (active === null) return;
    /* Measured against the tablist rather than `offsetLeft`, so the value stays
       right whatever the buttons' offset parent turns out to be. */
    const track = tabs.getBoundingClientRect();
    const segment = active.getBoundingClientRect();
    const offset = `${round(segment.left - track.left)}px`;
    const width = `${round(segment.width)}px`;
    const moved = tabs.style.getPropertyValue(VIEW_OFFSET_PROPERTY) !== offset
      || tabs.style.getPropertyValue(VIEW_WIDTH_PROPERTY) !== width;
    if (moved) {
      /* A column resize changes the same button's geometry. Animating that
         correction would make the thumb lag behind the pointer. Own style
         notifications must not cancel a selection animation already running. */
      tabs.style.setProperty(VIEW_DURATION_PROPERTY, selected !== null && selected !== active ? '180ms' : '0ms');
      tabs.style.setProperty(VIEW_OFFSET_PROPERTY, offset);
      tabs.style.setProperty(VIEW_WIDTH_PROPERTY, width);
    }
    selected = active;
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
    /* Selection changes classes/attributes; frame drag changes inline grid
       tracks; labels are text nodes. Observe all three geometry signals. */
    observer.observe(document.body, {
      childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: ['class', 'aria-selected', 'style'],
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
    tabs?.style.removeProperty(VIEW_OFFSET_PROPERTY);
    tabs?.style.removeProperty(VIEW_WIDTH_PROPERTY);
    tabs?.style.removeProperty(VIEW_DURATION_PROPERTY);
    tabs = null;
    selected = null;
  };
}

/** Half-pixel precision: sub-pixel segment edges must not smear the thumb. */
function round(value: number): number {
  return Math.round(value * 2) / 2;
}
