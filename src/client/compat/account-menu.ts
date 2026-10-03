import type { Disposer } from '../contracts/ports.ts';
import { hostSelectors } from './host-dom.ts';

/** Marks the portalled account menu for the stylesheet. */
export const ACCOUNT_MENU_ATTRIBUTE = 'data-ccd-account-menu';

/** Custom property carrying the signed-in name shown as the menu header. */
export const ACCOUNT_NAME_PROPERTY = '--ccd-account-name';

/**
 * The reference draws the signed-in account menu as a card whose first block is
 * the account itself (the account name over a workspace line). DSH's account
 * menu is a portalled `Menu` of plain rows and the signed-in name only exists on
 * the sidebar trigger, so this mirrors that real value onto the open menu and
 * tags it: no row is added, renamed or reordered — the stylesheet only reshapes
 * the card and prints the name it was given.
 *
 * The menu is recognised structurally (a fixed-position `[role="menu"]` that is
 * open while the trigger reports `aria-expanded`), so no menu class hash is
 * needed here.
 *
 * @param document - renderer document carrying the sidebar and the portal.
 * @param report - sink for observer failures; the native menu stays untouched.
 * @returns disposer that disconnects the observers and clears every mark.
 */
export function mountAccountMenu(document: Document, report: (error: unknown) => void): Disposer {
  const host = hostSelectors(document);
  const marked = new Set<HTMLElement>();
  let trigger: HTMLElement | null = null;
  let scheduled = 0;

  const clear = () => {
    for (const menu of marked) {
      menu.removeAttribute(ACCOUNT_MENU_ATTRIBUTE);
      menu.style.removeProperty(ACCOUNT_NAME_PROPERTY);
    }
    marked.clear();
  };

  const sync = () => {
    scheduled = 0;
    const open = trigger?.getAttribute('aria-expanded') === 'true';
    if (!open) {
      clear();
      return;
    }
    let target: HTMLElement | null = null;
    for (const candidate of document.querySelectorAll<HTMLElement>(host.menu)) {
      if (getComputedStyle(candidate).position === 'fixed') target = candidate;
    }
    if (target === null) return;
    const name = trigger?.querySelector(host.accountLabel)?.textContent?.trim() ?? '';
    target.setAttribute(ACCOUNT_MENU_ATTRIBUTE, '');
    /* A quoted CSS string, so a name with spaces or quotes stays one token. */
    target.style.setProperty(ACCOUNT_NAME_PROPERTY, JSON.stringify(name));
    marked.add(target);
  };

  /* Observer callbacks are batched into one microtask, and the tag has to land
     even while the window is occluded and animation frames are throttled. */
  const schedule = () => {
    if (scheduled !== 0) return;
    scheduled = 1;
    try {
      sync();
    } finally {
      scheduled = 0;
    }
  };

  let tree: MutationObserver | undefined;
  let attributes: MutationObserver | undefined;
  let attached: HTMLElement | null = null;
  try {
    tree = new MutationObserver(() => {
      const found = document.querySelector<HTMLElement>(host.accountTrigger);
      if (found !== attached) {
        attributes?.disconnect();
        attached = found;
        trigger = found;
        if (found !== null) {
          attributes = new MutationObserver(schedule);
          attributes.observe(found, { attributes: true, attributeFilter: ['aria-expanded'] });
        }
      }
      schedule();
    });
    tree.observe(document.body, { childList: true, subtree: true });
    const initial = document.querySelector<HTMLElement>(host.accountTrigger);
    if (initial !== null) {
      attached = initial;
      trigger = initial;
      attributes = new MutationObserver(schedule);
      attributes.observe(initial, { attributes: true, attributeFilter: ['aria-expanded'] });
    }
    sync();
  } catch (error) {
    tree?.disconnect();
    attributes?.disconnect();
    clear();
    report(error);
    return () => {};
  }

  return () => {
    scheduled = 0;
    tree?.disconnect();
    attributes?.disconnect();
    clear();
  };
}
