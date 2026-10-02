import type { Context } from '@deepseek-ai/cordis';
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client';
import type { FeatureEnvironment } from '../../../contracts/feature.ts';
import type { CleanupScope } from '../../../core/cleanup.ts';
import type { Disposer } from '../../../contracts/ports.ts';
import { headerLabels } from '../../../compat/header-labels.ts';
import { DSH_SLOTS } from '../../../compat/slots.ts';
import { HeaderActionButton } from './HeaderActionButton.tsx';
import { openView, resolveSidebarRight, resolveSidebarTabs } from './sidebar-view.ts';
import css from './header-actions.css';

/**
 * List orders inside `conversation.session.header.utilities`. The native open
 * control sits at -10 and the session menu at 0, so these two land directly
 * before that menu and keep it as the cluster's closing entry; any natively
 * scheduled-tasks entry (-5) stays ahead of them.
 */
const TERMINAL_ORDER = -2;
const BROWSER_ORDER = -1;

/** The views this plugin exposes, in cluster order. */
const VIEWS = [
  { id: 'ccd-terminal', kind: 'terminal', order: TERMINAL_ORDER },
  { id: 'ccd-browser', kind: 'browser', order: BROWSER_ORDER },
] as const;

/**
 * Add the right panel's terminal and browser views to the conversation header.
 *
 * The header's trailing seats are native list slots — `ui-open-in-app`,
 * `ui-schedule` and `session-log-export` all register into `utilities` — so the
 * plugin takes two more entries rather than replacing or reordering anything.
 * Each entry appears only while its tab kind is registered in the panel's own
 * registry, so a build without that view keeps the native cluster intact and
 * never shows a button that cannot open anything.
 *
 * @param ctx - client context carrying the injected services.
 * @param environment - feature environment for logging and style mounting.
 * @param cleanup - scope owning the stylesheet, the registrations and their Fiber.
 */
export function mountHeaderActions(ctx: Context, environment: FeatureEnvironment, cleanup: CleanupScope): void {
  cleanup.add(environment.dom.mountStyles(css));
  const registration = ctx.inject(['slots', 'sidebarRight', 'sidebarRightTabs'], scope => {
    const sidebar = resolveSidebarRight(scope);
    const tabs = resolveSidebarTabs(scope);
    if (sidebar === undefined || tabs === undefined) {
      environment.logger.debug('header-actions: right-Sidebar services are unavailable; native header retained');
      return () => {};
    }
    const copy = headerLabels(document);
    const labels: Record<(typeof VIEWS)[number]['kind'], string> = {
      terminal: copy.terminal,
      browser: copy.browser,
    };
    const live = new Map<string, Disposer>();
    const sync = () => {
      for (const view of VIEWS) {
        const registered = live.has(view.kind);
        const available = tabs.get(view.kind) !== undefined;
        if (available && !registered) {
          live.set(view.kind, scope.slots.inject(DSH_SLOTS.sessionHeaderUtilities, () => scope.slots.register({
            name: DSH_SLOTS.sessionHeaderUtilities,
            id: view.id,
            order: view.order,
            /* Slot scopes are strings; the panel's own face takes them as they come. */
            inject: slotSessionId => ({
              label: labels[view.kind],
              kind: view.kind,
              open: () => {
                try {
                  openView(sidebar, view.kind, String(slotSessionId));
                } catch (error) {
                  environment.logger.error(`header-actions: the ${view.kind} view rejected the request`, error);
                }
              },
            }),
          }, HeaderActionButton)));
        } else if (!available && registered) {
          live.get(view.kind)?.();
          live.delete(view.kind);
        }
      }
    };
    const unsubscribe = typeof tabs.subscribe === 'function' ? tabs.subscribe(sync) : () => {};
    try {
      sync();
    } catch (error) {
      unsubscribe();
      for (const dispose of live.values()) dispose();
      live.clear();
      environment.logger.error('header-actions: the header views could not be registered', error);
      return () => {};
    }
    return () => {
      unsubscribe();
      for (const dispose of live.values()) dispose();
      live.clear();
    };
  });
  cleanup.add(() => { void registration.dispose(); });
}
