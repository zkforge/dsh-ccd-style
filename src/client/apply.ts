import type { Context } from '@deepseek-ai/cordis';
import type { StyleOptions } from '../shared/config.ts';
import type { Logger } from './contracts/ports.ts';
import { resolveConfig } from '../shared/config.ts';
import { PLUGIN_ID } from '../shared/identity.ts';
import { createHostServices } from './compat/adapter.ts';
import { createDomPort } from './compat/dom.ts';
import { CleanupScope } from './core/cleanup.ts';
import { mountFeatures } from './core/mount-features.ts';
import { mountTheme } from './theme/mount.ts';
import { shellFeature } from './features/shell/index.ts';
import { sidebarFeature } from './features/sidebar/index.ts';
import { newSessionFeature } from './features/new-session/index.ts';
import { conversationFeature } from './features/conversation/index.ts';
import { toolCallsFeature } from './features/tool-calls/index.ts';
import { statisticsFeature } from './features/statistics/index.ts';

/** Cordis services, not manifest package-name edges, control activation. */
export const inject = ['slots', 'theme', 'uiWorkspace'];

/** The only assembly point allowed to import multiple feature domains. */
export function apply(ctx: Context, options: StyleOptions = {}): void {
  const config = resolveConfig(options);
  if (!config.enabled || typeof document === 'undefined') return;
  const logger: Logger = {
    debug: message => { if (config.debug) console.debug(`[${PLUGIN_ID}] ${message}`); },
    error: (message, error) => console.error(`[${PLUGIN_ID}] ${message}`, error),
  };
  const environment = {
    config, logger, host: createHostServices(ctx), dom: createDomPort(document),
  };
  ctx.effect(() => {
    const scope = new CleanupScope(error => logger.error('cleanup failed', error));
    try {
      mountTheme(environment, scope);
      mountFeatures([
        shellFeature, sidebarFeature, newSessionFeature,
        conversationFeature, toolCallsFeature, statisticsFeature,
      ], environment, scope);
    } catch (error) {
      scope.dispose();
      throw error;
    }
    return () => scope.dispose();
  }, PLUGIN_ID);
}
