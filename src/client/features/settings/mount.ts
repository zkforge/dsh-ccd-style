import type { Context } from '@deepseek-ai/cordis';
import { createElement } from 'react';
import type { ConfigFormPort, DomPort } from '../../contracts/ports.ts';
import type { CleanupScope } from '../../core/cleanup.ts';
import { ENTRY_ID, PLUGIN_ID } from '../../../shared/identity.ts';
import { ConfigPage } from './ConfigPage.tsx';
import { registerSettingsPage } from './register.ts';
import css from './settings.css';

/**
 * Register the configuration page for this plugin's own loader row.
 *
 * The page lives outside the activation scope on purpose: switching the
 * interface off releases every style resource, and the page has to survive that
 * to switch it back on.
 * @param ctx - client context, injected for slots and the locale service.
 * @param dom - style port owning the page's stylesheet.
 * @param form - this plugin's configuration form.
 * @param scope - scope owning the stylesheet, the dictionary and the registration.
 */
export function mountSettingsPage(
  ctx: Context,
  dom: DomPort,
  form: ConfigFormPort,
  scope: CleanupScope,
): void {
  scope.add(dom.mountStyles(css));
  const registration = registerSettingsPage(
    ctx,
    `${PLUGIN_ID}#${ENTRY_ID}`,
    props => createElement(ConfigPage, { ...props, form }),
  );
  scope.add(() => { void registration.dispose(); });
}
