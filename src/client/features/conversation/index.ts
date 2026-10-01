import type { ImplementedFeature } from '../../contracts/feature.ts';
import { probeHost } from '../../compat/host-dom.ts';
import { mountViewSwitch } from '../../compat/view-switch.ts';
import conversationCss from './conversation.css';

/**
 * Conversation page presentation. The transcript, its scroll behaviour, tool
 * rows, approvals and the resident Composer are all DSH's; this module only
 * adapts the header chrome, the transcript column and the message surfaces.
 *
 * The header keeps DSH's own View switcher: the host still owns which View is
 * selected and how it is rendered, and this module only moves the tablist onto
 * the title line and publishes the selected segment's geometry so the
 * stylesheet can slide the thumb onto it.
 */
export const conversationFeature: ImplementedFeature = {
  id: 'conversation',
  status: 'implemented',
  task: 'docs/IMPLEMENTATION.md#conversation',
  mount(environment, scope) {
    const probe = probeHost(document);
    if (!probe.conversation) environment.logger.debug('conversation: body not mounted yet');
    scope.add(environment.dom.mountStyles(conversationCss));
    scope.add(mountViewSwitch(
      document,
      error => environment.logger.error('conversation: view switcher observer failed', error),
    ));
  },
};
