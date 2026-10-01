import type { FeatureEnvironment } from '../contracts/feature.ts';
import type { CleanupScope } from '../core/cleanup.ts';
import { PLUGIN_ID } from '../../shared/identity.ts';
import { themeOverrides } from './overrides.ts';
import tokenCss from './tokens.css';

export function mountTheme(environment: FeatureEnvironment, scope: CleanupScope): void {
  scope.add(environment.dom.activate());
  scope.add(environment.dom.mountStyles(tokenCss));
  if (Object.keys(themeOverrides).length > 0) {
    scope.add(environment.host.theme.overrideTokens(PLUGIN_ID, themeOverrides));
  }
}
