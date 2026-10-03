import type { ImplementedFeature } from '../../contracts/feature.ts';
import { probeHost } from '../../compat/host-dom.ts';
import shellCss from './shell.css';

/**
 * Window frame and column geometry: flat surfaces, the sidebar column and its
 * divider. The three tracks stay entirely `ui-layout`'s solve, so resizing the
 * sidebar with the handle moves the divider the pointer is on; the plugin only
 * paints the columns.
 */
export const shellFeature: ImplementedFeature = {
  id: 'shell',
  status: 'implemented',
  task: 'ARCHITECTURE.md#界面模块',
  mount(environment, scope) {
    if (!probeHost(document).frame) {
      environment.logger.debug('shell: frame anchor missing; native frame retained');
      return;
    }
    scope.add(environment.dom.mountStyles(shellCss));
  },
};
