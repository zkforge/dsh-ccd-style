import type { FeatureEnvironment } from '../contracts/feature.ts';
import type { CleanupScope } from '../core/cleanup.ts';
import { PLUGIN_ID } from '../../shared/identity.ts';
import { themeOverrides } from './overrides.ts';
import composerCss from './composer.css';
import tokenCss from './tokens.css';

/**
 * Plugin-scoped presentation base: the root activation marker, the design
 * variables, the shared Composer geometry two features depend on (siblings must
 * not import each other) and the semantic palette overrides.
 * @param environment - activation services and configuration.
 * @param scope - activation scope owning every resource mounted here.
 */
export function mountTheme(environment: FeatureEnvironment, scope: CleanupScope): void {
  scope.add(environment.dom.activate());
  scope.add(environment.dom.mountStyles(tokenCss));
  scope.add(environment.dom.mountStyles(composerCss));
  if (Object.keys(themeOverrides).length > 0) {
    scope.add(environment.host.theme.overrideTokens(PLUGIN_ID, themeOverrides));
  }
}
