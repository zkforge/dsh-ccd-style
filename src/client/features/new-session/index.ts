import type { ImplementedFeature } from '../../contracts/feature.ts';
import { probeHost } from '../../compat/host-dom.ts';
import newSessionCss from './new-session.css';

/**
 * Blank-session page. DSH renders the Conversation shell in its `hero` phase
 * here, so this module only moves what the reference moves — the greeting to
 * the top of the column and the Composer block to the bottom — and leaves the
 * phase transition itself to the host.
 */
export const newSessionFeature: ImplementedFeature = {
  id: 'new-session',
  status: 'implemented',
  task: 'docs/IMPLEMENTATION.md#new-session',
  mount(environment, scope) {
    const probe = probeHost(document);
    if (!probe.conversation) environment.logger.debug('new-session: conversation not mounted yet');
    scope.add(environment.dom.mountStyles(newSessionCss));
  },
};
