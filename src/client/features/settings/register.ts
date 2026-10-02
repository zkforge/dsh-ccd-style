import type { Context } from '@deepseek-ai/cordis';
import type { ReactElement } from 'react';
import type {} from '@deepseek-ai/dsh-client-locale/client';
import { mountRowConfigPage } from '../../compat/plugin-manager.ts';
import type { RowConfigPageProps } from '../../compat/plugin-manager.ts';
import { en, SETTINGS_NAMESPACE, zh } from './locales.ts';

/**
 * Register the configuration page for one plugin row.
 *
 * The page owns its copy through the locale service and its form through the
 * plugin's own `configForms` handle, so it needs only the slots and locale
 * services. Both are injected as a pair: without an installed locale face a
 * registration that declares a namespace fails loud at render time, so a
 * deployment that lacks the service keeps the page unmounted instead.
 * @param ctx - client context.
 * @param key - `<package>#<row id>` of the row whose configuration page this is.
 * @param component - the bound page component.
 * @returns the injected scope, released with `dispose()`.
 */
export function registerSettingsPage(
  ctx: Context,
  key: string,
  component: (props: RowConfigPageProps) => ReactElement | null,
): Pick<ReturnType<Context['inject']>, 'dispose'> {
  return ctx.inject(['slots', 'locale'], child => {
    child.effect(
      () => child.locale.register(SETTINGS_NAMESPACE, { zh, en }),
      'ccd-style: configuration page copy',
    );
    return mountRowConfigPage(child, key, SETTINGS_NAMESPACE, component);
  });
}
