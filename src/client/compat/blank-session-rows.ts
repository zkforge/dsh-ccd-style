import type { BlankSessionsPort, Disposer } from '../contracts/ports.ts';
import { ANCHOR } from './host-dom.ts';

/**
 * Provisional New Session rows.
 *
 * DSH creates the Session the moment its New Session entry is used and keeps
 * the row in the list until the first message gives it durable history:
 * `SessionSummary.blank` is the host's own fact for that state, and the client
 * contract states the policy — "New Session reuses a blank one targeting the
 * same workspace. Filtering stays with the consumer"
 * (`@deepseek-ai/dsh-api-session-controller`). The Workspace browser shows the
 * selected blank entry; the CCD column keeps the whole provisional row out, so
 * the entry arrives with the first sent message instead of with the click that
 * opened the page.
 *
 * The row is recognised through the host's own stable `data-row-key` anchor
 * (`ui-workspace`'s `SessionNodeItem`, `session:<id>`) and tagged with a plugin
 * attribute the stylesheet hides. Nothing in the host's state or markup is
 * rewritten: the tag is removed as soon as the Session stops being blank, and
 * every remaining tag is removed when the scope is released.
 *
 * Fork children are exempt: a fork is provisionally blank in the client for the
 * moment before the Host summary lands, and that row is real history, not a
 * New Session placeholder.
 */

/** Marks one host row the stylesheet keeps out of the column. */
export const BLANK_ROW_ATTRIBUTE = 'data-ccd-blank-session';

/** `data-row-key` value prefix of one Session row, from `ui-workspace` Rows.tsx. */
const SESSION_KEY_PREFIX = 'session:';

/** The slice of one host list row this filter reads. */
export interface SessionRowFacts {
  /** Host presentation fact: created and not yet given durable history. */
  readonly blank?: boolean;
  /** Direct parent, present on fork and subagent children. */
  readonly parentId?: string;
}

/** The slice of the host session list this filter reads (`SessionListState`). */
export interface SessionListFacts {
  readonly ids: readonly string[];
  readonly byId: Readonly<Record<string, SessionRowFacts | undefined>>;
}

/**
 * Ids whose provisional row must stay out of the column.
 *
 * A row qualifies when the host still calls it blank and it is a root Session:
 * a blank child is a fork that has not received its authoritative summary yet,
 * not a New Session placeholder.
 *
 * @param state - host session-list snapshot.
 * @returns the ids to hide, in no particular order.
 */
export function blankSessionIds(state: SessionListFacts): ReadonlySet<string> {
  const blank = new Set<string>();
  for (const id of state.ids) {
    const row = state.byId[id];
    if (row === undefined || row.blank !== true || row.parentId !== undefined) continue;
    blank.add(id);
  }
  return blank;
}

/**
 * Session id carried by one `data-row-key`, or null for any other row.
 *
 * @param key - the attribute value, as read from the DOM.
 * @returns the id, or null when the row is not a Session row.
 */
export function rowSessionId(key: string | null | undefined): string | null {
  if (typeof key !== 'string' || !key.startsWith(SESSION_KEY_PREFIX)) return null;
  const id = key.slice(SESSION_KEY_PREFIX.length);
  return id === '' ? null : id;
}

/** Whether one mutated node is, or contains, a keyed row. */
function carriesRow(node: Node): boolean {
  if (!(node instanceof Element)) return false;
  return node.matches(ANCHOR.sessionRows) || node.querySelector(ANCHOR.sessionRows) !== null;
}

/**
 * Keep the host's provisional New Session rows out of the sidebar column.
 *
 * Reconciliation runs synchronously (never on an animation frame, which a
 * hidden or occluded window throttles) and is driven by two signals: the host
 * session list, which is what makes a row stop being provisional, and the
 * document's own childList changes, which is how a row arrives at all. A
 * mutation outside the Workspace browser is ignored before any query runs, so
 * a streaming Conversation never pays for this observer.
 *
 * @param document - renderer document carrying the sidebar.
 * @param source - provisional-id source built over the host session list.
 * @param report - sink for source failures; the native rows stay untouched.
 * @returns disposer that stops both signals and clears every tag it wrote.
 */
export function mountBlankSessionRows(
  document: Document,
  source: BlankSessionsPort,
  report: (error: unknown) => void,
): Disposer {
  const marked = new Set<Element>();
  let reconciling = false;
  let disposed = false;

  const sync = () => {
    if (disposed) return;
    let blank: ReadonlySet<string>;
    try {
      blank = source.ids();
    } catch (error) {
      report(error);
      return;
    }
    for (const row of document.querySelectorAll(ANCHOR.sessionRows)) {
      const id = rowSessionId(row.getAttribute('data-row-key'));
      if (id !== null && blank.has(id)) {
        /* Re-tagging an already tagged row would be a no-op write on every
           reconciliation, so the attribute is only written on the edge. */
        if (!row.hasAttribute(BLANK_ROW_ATTRIBUTE)) row.setAttribute(BLANK_ROW_ATTRIBUTE, '');
        marked.add(row);
        continue;
      }
      if (!row.hasAttribute(BLANK_ROW_ATTRIBUTE)) continue;
      row.removeAttribute(BLANK_ROW_ATTRIBUTE);
      marked.delete(row);
    }
    /* React drops rows without telling anyone; forget the dead references. */
    for (const row of marked) if (!row.isConnected) marked.delete(row);
  };

  const reconcile = () => {
    if (reconciling || disposed) return;
    reconciling = true;
    try {
      sync();
    } finally {
      reconciling = false;
    }
  };

  const touchesRows = (records: readonly MutationRecord[]): boolean => {
    const browser = document.querySelector(ANCHOR.workspaces);
    for (const record of records) {
      if (browser !== null && browser.contains(record.target)) return true;
      for (const node of record.addedNodes) if (carriesRow(node)) return true;
      for (const node of record.removedNodes) if (carriesRow(node)) return true;
    }
    return false;
  };

  const observer = new MutationObserver(records => {
    if (touchesRows(records)) reconcile();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  let unsubscribe: Disposer;
  try {
    unsubscribe = source.subscribe(reconcile);
  } catch (error) {
    /* A subscription that never landed owns nothing to release, but the
       observer opened above does. */
    observer.disconnect();
    report(error);
    return () => {};
  }
  reconcile();

  return () => {
    if (disposed) return;
    disposed = true;
    unsubscribe();
    observer.disconnect();
    for (const row of marked) row.removeAttribute(BLANK_ROW_ATTRIBUTE);
    marked.clear();
  };
}
