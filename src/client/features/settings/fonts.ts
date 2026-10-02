/**
 * System font families for the typeface rows.
 *
 * Chromium exposes installed fonts through the Local Font Access API
 * (`window.queryLocalFonts()`, Chromium 103+). In the DSH desktop window the
 * permission is granted without a prompt — the application's own permission
 * handlers allow every non-media permission — while a plain browser either
 * prompts or answers with an empty list; browsers without the API answer with
 * nothing at all. All three outcomes collapse to "no list", and the rows keep
 * accepting a typed family name.
 *
 * The query runs on first focus (a user gesture, which the permission needs)
 * and the result is cached for the page session, so moving between rows or
 * pages never asks twice.
 */

/** The slice of `FontData` this module reads. */
export interface LocalFontLike {
  readonly family?: unknown;
}

/** Shape of the optional browser API; absent outside Chromium. */
interface FontAccessWindow {
  queryLocalFonts?: () => Promise<readonly LocalFontLike[]>;
}

function fontApi(): (() => Promise<readonly LocalFontLike[]>) | undefined {
  const scope = globalThis as { window?: FontAccessWindow };
  const api = scope.window?.queryLocalFonts;
  return typeof api === 'function' ? api.bind(scope.window) : undefined;
}

/**
 * Collapse font faces into the family names a `font-family` value accepts.
 * @param fonts - faces as the browser reported them.
 * @returns unique, non-empty family names sorted for a Chinese interface.
 */
export function collectFamilies(fonts: readonly LocalFontLike[]): string[] {
  const families = new Set<string>();
  for (const font of fonts) {
    const family = font?.family;
    if (typeof family !== 'string') continue;
    const trimmed = family.trim();
    if (trimmed !== '') families.add(trimmed);
  }
  return [...families].sort((left, right) => left.localeCompare(right, 'zh'));
}

/**
 * Filter families for one query, case-insensitively.
 * @param families - family names in their display order.
 * @param query - what the user typed.
 * @returns the matching families, order preserved.
 */
export function filterFamilies(families: readonly string[], query: string): string[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') return [...families];
  return families.filter(family => family.toLowerCase().includes(needle));
}

let cached: Promise<string[]> | undefined;

/**
 * Read the installed font families once per page session.
 * @returns the sorted families, or an empty array when the environment cannot
 * provide them (no API, denied permission, or an empty answer).
 */
export function loadSystemFontFamilies(): Promise<string[]> {
  if (cached !== undefined) return cached;
  cached = (async () => {
    const query = fontApi();
    if (query === undefined) return [];
    try {
      return collectFamilies(await query());
    } catch {
      /* A denied permission rejects; the rows fall back to typed input. */
      return [];
    }
  })();
  return cached;
}

/** Test seam: forget the cached answer. */
export function resetSystemFontFamilies(): void {
  cached = undefined;
}
