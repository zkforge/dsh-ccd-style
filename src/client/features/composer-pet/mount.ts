import { useSyncExternalStore } from 'react';
import type { Context } from '@deepseek-ai/cordis';
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client';
import type {} from '@deepseek-ai/dsh-client-ui-layout/client';
import type { FeatureEnvironment } from '../../contracts/feature.ts';
import type { CleanupScope } from '../../core/cleanup.ts';
import type { Disposer } from '../../contracts/ports.ts';
import { createPetAnchor } from '../../compat/pet-anchor.ts';
import { DSH_SLOTS } from '../../compat/slots.ts';
import { BlankPet } from './BlankPet.tsx';
import css from './pet.css';

/** List order inside the frame-wide overlay; the plugin owns no other occupant. */
const PET_ORDER = 20;

/**
 * Mount the Composer whale — one small presentation pet, on the new-session
 * page only.
 *
 * DSH marks that page on the conversation root. The pinned
 * `@deepseek-ai/dsh-client-ui-conversation` computes
 * `phase = settling ? "settling" : hero ? "hero" : "active"` with
 * `hero = sessionId === void 0 || (shellPhase === "blank" && (openState ===
 * "open" || summaryBlank === true))`, so `data-phase="hero"` means "no session
 * yet, or one that has never carried a message"; the moment the first message
 * lands the root turns `active`. The pet's seat is measured from exactly that
 * state (`compat/pet-anchor.ts` queries the card under `[data-phase="hero"]`),
 * which is how the whale appears on a new session and disappears from every
 * normal conversation.
 *
 * There is no in-card seat: `conversation.input.overlay` only renders while a
 * Session exists (the pinned InputBar guards it with `sessionId !== void 0`),
 * which is the opposite page. The frame-wide `shell.overlay` is the one seat,
 * placed at the corner the anchor measures from the real card.
 *
 * The whale reads nothing and mirrors nothing: it is a decoration with no
 * business state at all.
 *
 * @param ctx - client context carrying the injected services.
 * @param environment - feature environment for configuration, logging and styles.
 * @param cleanup - scope owning the stylesheet, the registration and the anchor.
 */
export function mountComposerPet(ctx: Context, environment: FeatureEnvironment, cleanup: CleanupScope): void {
  cleanup.add(environment.dom.mountStyles(css));
  const registration = ctx.inject(['slots'], scope => {
    const disposers: Disposer[] = [];
    /* The frame-wide seat belongs to the blank-session page's own layout, so it
       follows that feature rather than the pet's switch. */
    if (environment.config.features['new-session']) {
      const anchor = createPetAnchor(
        document,
        error => environment.logger.error('composer-pet: frame-wide seat unavailable; native UI retained', error),
      );
      disposers.push(anchor.dispose);
      disposers.push(scope.slots.inject(DSH_SLOTS.shellOverlay, () => scope.slots.register({
        name: DSH_SLOTS.shellOverlay, id: 'ccd-blank-pet', order: PET_ORDER,
        inject: () => ({
          useAnchor: () => useSyncExternalStore(anchor.subscribe, anchor.getSnapshot),
        }),
      }, BlankPet)));
    }
    return () => {
      /* Reverse acquisition order, without mutating the list: the seat that
         needs the anchor (and its React tree) goes before the anchor itself. */
      for (const dispose of [...disposers].reverse()) dispose();
    };
  });
  cleanup.add(() => { void registration.dispose(); });
}
