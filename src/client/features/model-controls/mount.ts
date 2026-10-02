import { useSyncExternalStore } from 'react';
import type { Context } from '@deepseek-ai/cordis';
import type {} from '@deepseek-ai/dsh-client-ui-model-selection/client';
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client';
import type { FeatureEnvironment } from '../../contracts/feature.ts';
import type { CleanupScope } from '../../core/cleanup.ts';
import { ModelControls } from './ModelControls.tsx';
import { effortSelection } from './selection.ts';
import css from './controls.css';
import effortCss from './effort.css';

/** Register a presentation occupant over the native seat, sharing its official directory. */
export function mountModelControls(ctx: Context, environment: FeatureEnvironment, cleanup: CleanupScope): void {
  cleanup.add(environment.dom.mountStyles(css));
  cleanup.add(environment.dom.mountStyles(effortCss));
  const registration = ctx.inject(['modelDirectories', 'sessions', 'slots', 'remote', 'remote.session'], scope => {
    return scope.slots.inject('conversation.input.model', () => scope.slots.register({
      name: 'conversation.input.model', priority: -10, locale: 'model',
      inject: slotSessionId => {
        // Slot scopes are strings; the resolver requires the SDK-branded session id.
        const sessionId = slotSessionId as Parameters<typeof scope.modelDirectories.directoryFor>[0];
        const directory = scope.modelDirectories.directoryFor(sessionId);
        const available = scope.sessions.subagentAddress(sessionId) === undefined;
        return {
          available,
          useDirectory: () => useSyncExternalStore(directory.store.subscribe, directory.store.getSnapshot),
          load: () => { if (available) void directory.load().catch(() => {}); },
          select: (selection: Parameters<typeof directory.select>[0]) => available ? directory.select(selection) : Promise.resolve(undefined),
          selectEffort: (route: Parameters<typeof directory.select>[0], effort: string | undefined) => {
            if (!available) return;
            const selection = effortSelection(directory.store.getSnapshot(), route, effort);
            if (selection) void directory.select(selection).catch(() => {});
          },
        };
      },
    }, ModelControls));
  });
  cleanup.add(() => { void registration.dispose(); });
}
