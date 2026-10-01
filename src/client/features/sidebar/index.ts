import type { ImplementedFeature } from '../../contracts/feature.ts';
import { mountAccountMenu } from '../../compat/account-menu.ts';
import { probeHost } from '../../compat/host-dom.ts';
import accountMenuCss from './account-menu.css';
import sidebarCss from './sidebar.css';

/**
 * Sidebar presentation: compact navigation rows, flat project groups and a
 * calmer foot. Every entry DSH registers — New Session, the global panel list,
 * the workspace browser and Settings — stays exactly where the host put it; the
 * account menu is reshaped, never re-authored.
 */
export const sidebarFeature: ImplementedFeature = {
  id: 'sidebar',
  status: 'implemented',
  task: 'docs/IMPLEMENTATION.md#sidebar',
  mount(environment, scope) {
    /* The stylesheets are inert until the host renders the column, so they are
       mounted unconditionally: a feature enabled while another panel is on
       screen must still style the sidebar when the column comes back. */
    const probe = probeHost(document);
    if (!probe.sidebar) environment.logger.debug('sidebar: column not mounted yet');
    scope.add(environment.dom.mountStyles(sidebarCss));
    scope.add(environment.dom.mountStyles(accountMenuCss));
    scope.add(mountAccountMenu(
      document,
      error => environment.logger.error('sidebar: account menu observer failed', error),
    ));
  },
};
