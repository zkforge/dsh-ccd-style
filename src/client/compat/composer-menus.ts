import type { Disposer } from '../contracts/ports.ts';
import { HOST } from './host-dom.ts';

/** Marks a menu this module has already placed above its anchor. */
export const FLIPPED_MENU_ATTRIBUTE = 'data-ccd-menu-flipped';

/** Gap between the flipped menu and the anchor's top edge, in logical px. */
const GAP = 4;

/** Smallest distance a flipped menu keeps from the viewport's top edge. */
const TOP_MARGIN = 8;

/** Viewport fit the `Menu` primitive keeps below the anchor, from its own MARGIN. */
const MARGIN = 12;

/**
 * The Composer sits on the window's bottom edge in the CCD layout, so a menu
 * that DSH opens *below* its anchor has no room left: the `Menu` primitive's
 * viewport fit (`y = min(max(y, 12), vh - height - 12)`) then lifts the card
 * back up until it covers the control that opened it. The reference opens these
 * menus upwards instead.
 *
 * This re-places only the menus that would overlap their own anchor, using the
 * same geometry the primitive uses for its `side: "top"` case. The host rewrites
 * the inline `top` every frame, so the correction is re-applied from the
 * observer rather than once; a menu that already fits below is left alone.
 *
 * @param document - renderer document carrying the portal.
 * @param report - sink for observer failures; the native placement stays.
 * @returns disposer that disconnects the observer and clears every mark.
 */
export function mountComposerMenuPlacement(document: Document, report: (error: unknown) => void): Disposer {
  const flipped = new Set<HTMLElement>();
  let scheduled = 0;

  /**
   * The control that owns the open menu: the hero workspace chip, a Composer
   * control, or the sidebar's account row — the three anchors that sit on the
   * window's bottom edge.
   */
  const anchorOf = (): HTMLElement | null => {
    const expanded = '[aria-expanded="true"]';
    return document.querySelector<HTMLElement>(`${HOST.heroWorkspaceChip}${expanded}`)
      ?? document.querySelector<HTMLElement>(`${HOST.composerCard} ${expanded}`)
      ?? document.querySelector<HTMLElement>(`${HOST.accountTrigger}${expanded}`);
  };

  /**
   * Decide from the anchor and the viewport, never from where the menu currently
   * is: the host rewrites `top` on every frame, so a decision that depends on the
   * menu's own rect would flip-flop between the two placements.
   */
  const place = (menu: HTMLElement, anchor: DOMRect, viewport: number): void => {
    const height = menu.getBoundingClientRect().height;
    if (height === 0) return;
    /* Below the anchor is the primitive's own placement; leave it when it fits. */
    if (anchor.bottom + GAP + height <= viewport - MARGIN) {
      if (flipped.delete(menu)) menu.removeAttribute(FLIPPED_MENU_ATTRIBUTE);
      return;
    }
    const top = Math.round(anchor.top - height - GAP);
    if (top < TOP_MARGIN) return;
    const next = `${top}px`;
    flipped.add(menu);
    menu.setAttribute(FLIPPED_MENU_ATTRIBUTE, '');
    if (menu.style.top !== next) menu.style.top = next;
  };

  const sync = () => {
    scheduled = 0;
    const anchor = anchorOf();
    if (anchor === null) {
      for (const menu of flipped) menu.removeAttribute(FLIPPED_MENU_ATTRIBUTE);
      flipped.clear();
      return;
    }
    for (const menu of [...flipped]) if (!menu.isConnected) flipped.delete(menu);
    const anchorRect = anchor.getBoundingClientRect();
    for (const menu of document.querySelectorAll<HTMLElement>(HOST.menu)) {
      if (getComputedStyle(menu).position !== 'fixed') continue;
      place(menu, anchorRect, window.innerHeight);
    }
  };

  /**
   * The correction runs straight from the observer instead of on the next
   * animation frame: Chromium throttles `requestAnimationFrame` in an occluded
   * window, and a menu placed while the window is in the background must still
   * land correctly. Observer callbacks are already batched into one microtask, so
   * this stays a single pass per batch, and the pass stops writing as soon as the
   * value matches.
   */
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
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'aria-expanded'],
    });
    sync();
  } catch (error) {
    observer?.disconnect();
    report(error);
    return () => {};
  }

  return () => {
    scheduled = 0;
    observer?.disconnect();
    for (const menu of flipped) menu.removeAttribute(FLIPPED_MENU_ATTRIBUTE);
    flipped.clear();
  };
}
