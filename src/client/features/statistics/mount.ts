/**
 * Mount the new-session statistics card.
 *
 * DSH's conversation page renders its greeting, the workspace row and the
 * Composer as one stack in the `hero` phase, and that stack holds the only
 * seats a card could borrow (`conversation.hero.brand.mark` / `.workspace` /
 * `.agent`) — all small chips inside the greeting, none of them a body slot.
 * The card therefore owns its container: it is appended to the hero Composer
 * stack, right after the greeting, and positioned absolutely against it.
 *
 * Measured behaviour of that container (isolated instance, 1382×875, plugin
 * enabled): the stack sits at the bottom of the column, so an in-flow child
 * would land in the Composer area — the greeting itself is absolutely
 * positioned too, which is why the card must share its coordinate system. An
 * appended node survives React re-renders of the page (typing in the editor
 * does not remove it); leaving the hero phase unmounts the stack and the card
 * with it, which is why the observer re-creates it on the way back.
 *
 * The card appears only once {@link StatsSource} has a snapshot: a host
 * without the aggregation (or with the statistics feature off) shows the
 * native page untouched rather than an empty box.
 */
import type { StatsSnapshot } from '../../../shared/stats.ts';
import type { CleanupScope } from '../../core/cleanup.ts';
import type { Logger } from '../../contracts/ports.ts';
import { HOST } from '../../compat/host-dom.ts';
import type { StatsCardData } from './card.ts';
import { createStatsCard } from './card.ts';
import type { StatsSource } from './source.ts';
import { buildCardData } from './view.ts';

/**
 * The hero-phase conversation root. `data-phase` sits on the conversation root
 * itself (`[data-conversation-content]` is its inner body), so the anchor is
 * read on its own rather than combined with the content attribute.
 */
const HERO = '[data-phase="hero"]';

/** Distance kept between the greeting's lower edge and the card. */
const GAP_PX = 20;

/** Custom property carrying that measured offset; CSS falls back to the default. */
const GAP_PROPERTY = '--ccd-stats-gap';

/** One draw for the footer's book choice, fixed for the lifetime of a mount. */
function stableRandom(): () => number {
  const pick = Math.random();
  return () => pick;
}

/**
 * Keep one card mounted inside the hero stack.
 *
 * @param document - renderer document carrying the conversation page.
 * @param scope - cleanup scope owning the observer, the subscription and the card node.
 * @param logger - sink for observer failures; the native page stays without a card.
 * @param source - snapshot reader the card redraws from.
 */
export function mountStatisticsCard(
  document: Document,
  scope: CleanupScope,
  logger: Logger,
  source: StatsSource,
): void {
  const random = stableRandom();
  let snapshot: StatsSnapshot | null = source.current;
  let rendered: StatsSnapshot | null = null;
  let data: StatsCardData | null = null;
  let card: HTMLElement | null = null;
  let host: HTMLElement | null = null;

  const remove = () => {
    card?.remove();
    card = null;
    host = null;
  };

  /* The greeting's height follows its type (and its language), so the offset is
     measured rather than frozen into the stylesheet: the card's `top` is the
     greeting's own top plus its height plus the gap. */
  const measure = () => {
    if (card === null) return;
    const greeting = document.querySelector<HTMLElement>(`${HERO} ${HOST.heroRoot}`);
    if (greeting === null) return;
    card.style.setProperty(GAP_PROPERTY, `${greeting.offsetHeight + GAP_PX}px`);
  };

  const sync = () => {
    const hero = document.querySelector<HTMLElement>(HERO);
    const stack = hero?.querySelector<HTMLElement>(HOST.heroComposerStack) ?? null;
    if (stack === null || snapshot === null) {
      remove();
      return;
    }
    if (data === null || rendered !== snapshot) {
      data = buildCardData(snapshot, random);
      rendered = snapshot;
      remove();
    }
    if (card !== null && card.isConnected && host === stack) {
      measure();
      return;
    }
    remove();
    card = createStatsCard(document, data);
    stack.append(card);
    host = stack;
    measure();
  };

  let observer: MutationObserver | undefined;
  try {
    observer = new MutationObserver(() => sync());
    /* The phase swap replaces the whole conversation body, so the card has to
       follow it; a guarded insert keeps our own write from feeding the loop. */
    observer.observe(document.body, { childList: true, subtree: true });
    sync();
  } catch (error) {
    observer?.disconnect();
    remove();
    logger.error('statistics: card mount failed', error);
    return;
  }

  const unsubscribe = source.subscribe(next => {
    snapshot = next;
    sync();
  });

  scope.add(() => {
    observer?.disconnect();
    unsubscribe();
    remove();
  });
}
