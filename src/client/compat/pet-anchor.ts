import { hostAnchors } from './host-dom.ts';
import type { Disposer } from '../contracts/ports.ts';

/** Where the frame-wide seat is drawn, in viewport coordinates. */
export interface PetAnchor { readonly left: number; readonly top: number }

/** One observed, disposable source of the seat's position. */
export interface PetAnchorSource {
  /** Current position, or null while the seat has no card to sit on. */
  getSnapshot(): PetAnchor | null;
  /** Observe position changes; returns the releaser. */
  subscribe(listener: () => void): Disposer;
  /** Release every observer and listener this source installed. */
  dispose(): void;
}

/** The artwork's box: a 32 × 24 pixel grid drawn at 1:1, as `Whale.tsx` renders it. */
export const PET_BOX = Object.freeze({ width: 32, height: 24 });

/** Inset from the Composer card's trailing edge; `pet.css` draws the seat with
    the measured numbers, and the test asserts the two agree. */
export const PET_INSET = 12;

/**
 * Publish the top trailing corner of the hero Composer card in viewport
 * coordinates for shell.overlay. The DSH conversation root's data-phase=hero
 * selects new sessions; hidden, missing or unlaid-out cards publish null.
 * @returns position source whose dispose releases all listeners and observers.
 */
export function createPetAnchor(document: Document, report: (error: unknown) => void): PetAnchorSource {
  const anchors = hostAnchors(document);
  const listeners = new Set<() => void>();
  let value: PetAnchor | null = null;
  let card: HTMLElement | null = null;
  let size: ResizeObserver | undefined;
  let released = false;

  const publish = (next: PetAnchor | null) => {
    if (value?.left === next?.left && value?.top === next?.top) return;
    value = next;
    for (const listener of [...listeners]) listener();
  };

  const sync = () => {
    if (released) return;
    const next = document.querySelector<HTMLElement>(anchors.composerCardHero);
    if (next !== card) {
      if (card !== null) size?.disconnect();
      card = next;
      if (card !== null) size?.observe(card);
    }
    const rect = card?.getBoundingClientRect();
    if (card === null || rect === undefined || rect.width === 0 || rect.height === 0 || document.hidden) {
      publish(null);
      return;
    }
    publish({
      left: Math.round(rect.right - PET_BOX.width - PET_INSET),
      top: Math.round(rect.top - PET_BOX.height),
    });
  };

  let observer: MutationObserver | undefined;
  try {
    observer = new MutationObserver(sync);
    observer.observe(document.body, {
      childList: true, subtree: true,
      attributes: true, attributeFilter: ['style', 'class', 'data-phase'],
    });
    /* A layout-only change (column drag, card growth, a font swap) moves the
       corner without a mutation, and this seat is placed in JavaScript, so it
       cannot follow the card through CSS the way the in-card seat does. The
       ResizeObserver is that missing signal — the one deliberate exception to
       the "observers only" rule in ARCHITECTURE.md, which excludes it as a
       *liveness* signal; here it only refines an already-published position,
       and a throttled delivery while the window is hidden is harmless because
       a hidden document publishes null anyway. */
    if (typeof ResizeObserver === 'function') size = new ResizeObserver(sync);
    window.addEventListener('resize', sync);
    document.addEventListener('scroll', sync, true);
    document.addEventListener('visibilitychange', sync);
    sync();
  } catch (error) {
    observer?.disconnect();
    size?.disconnect();
    size = undefined;
    window.removeEventListener('resize', sync);
    document.removeEventListener('scroll', sync, true);
    document.removeEventListener('visibilitychange', sync);
    listeners.clear();
    report(error);
    return inertAnchor();
  }

  return {
    getSnapshot: () => value,
    subscribe(listener) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    dispose() {
      if (released) return;
      released = true;
      observer?.disconnect();
      size?.disconnect();
      size = undefined;
      window.removeEventListener('resize', sync);
      document.removeEventListener('scroll', sync, true);
      document.removeEventListener('visibilitychange', sync);
      listeners.clear();
      card = null;
      value = null;
    },
  };
}

/** A source with nothing to publish; the seat stays off and the native UI stays. */
function inertAnchor(): PetAnchorSource {
  return {
    getSnapshot: () => null,
    subscribe: () => () => {},
    dispose: () => {},
  };
}
