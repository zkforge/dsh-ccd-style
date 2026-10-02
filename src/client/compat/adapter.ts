import type { Context } from '@deepseek-ai/cordis';
import type {
  ConfigFormPort, ConfigFormsPort, HostServices, ThemePreferencePort,
} from '../contracts/ports.ts';
import { TARGET_DSH_VERSION } from '../../shared/identity.ts';

/**
 * `ctx.configForms` is provided by the DSH settings layer
 * (`@deepseek-ai/dsh-client-ui-settings`) and is declared here structurally
 * because that package is not part of this plugin's type baseline. Lookup is
 * by this plugin's loader entry id, which its bundle patch fixes.
 */
function resolveConfigForms(ctx: Context): ConfigFormsPort {
  const service = (ctx as Context & { configForms?: ConfigFormsPort }).configForms;
  if (typeof service?.get !== 'function') {
    throw new Error(`DSH ${TARGET_DSH_VERSION} settings transport (configForms) is required`);
  }
  return {
    get(namespace): ConfigFormPort {
      const form = service.get(namespace);
      if (typeof form?.getSnapshot !== 'function' || typeof form.subscribe !== 'function') {
        throw new Error(`configForms.get(${namespace}) did not return a configuration form`);
      }
      return form;
    },
  };
}

/**
 * Build the theme service's preference face.
 *
 * `getTheme`／`setTheme` are the service's only read and write entries and
 * `theme/change` is its only change signal (see `ThemeRuntime`), so the plugin's
 * Appearance control is another surface for the native preference rather than a
 * second switch of its own. A build that does not publish them yields null and
 * the page keeps its other rows; activation is not failed over an optional
 * control.
 * @param ctx - client context carrying the theme service and its event bus.
 * @returns the port, or null when this build cannot read or write the preference.
 */
export function createThemePreferencePort(ctx: Context): ThemePreferencePort | null {
  const theme = ctx.theme;
  if (typeof theme?.getTheme !== 'function' || typeof theme.setTheme !== 'function'
    || typeof ctx.on !== 'function') return null;
  return {
    preference: () => theme.getTheme().preference,
    set: preference => theme.setTheme(preference),
    subscribe(listener) {
      const off = ctx.on('theme/change', () => listener());
      return () => { off(); };
    },
  };
}

/** This compatibility boundary targets the pinned SDK, not arbitrary DSH versions. */
export function createHostServices(ctx: Context): HostServices {
  const slots = ctx.slots;
  const theme = ctx.theme;
  const workspace = ctx.uiWorkspace;
  if (typeof slots?.inject !== 'function' || typeof slots.register !== 'function'
    || typeof theme?.overrideTokens !== 'function'
    || typeof workspace?.startSession !== 'function') {
    throw new Error(`DSH ${TARGET_DSH_VERSION} UI services are required`);
  }
  return {
    slots,
    theme,
    themePreference: createThemePreferencePort(ctx),
    configForms: resolveConfigForms(ctx),
    workspace: {
      openSession: target => workspace.openSession(target),
      openWorkspace: (id, beforeOpen) => workspace.openWorkspace(id, beforeOpen),
      startSession: id => workspace.startSession(id),
    },
  };
}
