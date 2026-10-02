import type { Context } from '@deepseek-ai/cordis';
import type { ReactElement } from 'react';
import type { Disposer } from '../contracts/ports.ts';

/**
 * The Plugins panel's row configuration slot.
 *
 * `@deepseek-ai/dsh-client-ui-plugin-manager` declares it in the child table of
 * its `main` panel registration as `{ kind: 'keyed', scope: 'root' }` and keys
 * it by `<package>#<row id>`; the row then grows a configuration page. The
 * package is not part of this plugin's type baseline, so the two members used
 * here are declared structurally and the real service object is passed through
 * unchanged — the same treatment `contracts/ports.ts` gives the other
 * out-of-baseline providers. Registration waits for the declaration, so a
 * deployment without that panel simply keeps the page unmounted.
 */
export const ROW_CONFIG_SLOT = 'plugins.row.config';

/** Props the panel renders a row configuration page with. */
export interface RowConfigPageProps {
  /** `summary` beside a row title without a description, `page` for the form. */
  readonly view?: string;
  /** Locale seat synthesized from the registration's namespace. */
  readonly t?: (key: string, params?: Record<string, unknown>) => string;
}

interface RowConfigRegistration {
  readonly name: string;
  readonly key: string;
  readonly locale?: string;
}

interface RowConfigSlots {
  inject(name: string, register: () => Disposer): Disposer;
  register(
    options: RowConfigRegistration,
    component: (props: RowConfigPageProps) => ReactElement | null,
  ): Disposer;
}

/**
 * Register one row configuration page and wait for the slot to exist.
 * @param ctx - context carrying the slots service.
 * @param key - `<package>#<row id>` of the row whose page this is.
 * @param locale - dictionary namespace for the page's `t` seat, when available.
 * @param component - the page component.
 * @returns the injection's disposer.
 */
export function mountRowConfigPage(
  ctx: Context,
  key: string,
  locale: string | undefined,
  component: (props: RowConfigPageProps) => ReactElement | null,
): Disposer {
  const slots = ctx.slots as unknown as RowConfigSlots;
  return slots.inject(ROW_CONFIG_SLOT, () => slots.register({
    name: ROW_CONFIG_SLOT,
    key,
    ...(locale === undefined ? {} : { locale }),
  }, component));
}
