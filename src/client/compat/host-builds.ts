/**
 * CSS-module prefix tables for the shipped DSH builds.
 *
 * DSH hashes CSS-module class names per build, and the installers are separate
 * builds even at one version: `0.2.0-rc.2` ships commit `5e9e301d` for macOS and
 * `04f392c9` for Windows, and every class of the pinned UI packages hashes
 * differently between them. This plugin's stylesheets and `HOST` selectors are
 * authored against the macOS build; a build listed below is rewritten through
 * {@link aliasHostClasses} before it reaches the document, so one source styles
 * both installers instead of duplicating every selector.
 *
 * Only the prefix differs. The local name after it (`_frame`, `_newSession`)
 * and the static web frontend's markdown classes (`_markdown_1ypvv_5`) are
 * identical in both builds, so neither needs an entry here.
 *
 * The tables are pinned to the DSH version the plugin declares
 * (`dsh.engines.dsh = "=0.2.0-rc.2"`): a later release may rehash every prefix
 * again, and both tables then have to be refreshed from that build's
 * `app.asar` — the same single-place update `host-dom.ts` documents.
 */

/** One shipped DSH build and the prefixes it uses for the pinned classes. */
export interface HostBuild {
  /** Stable identity of the build, used for diagnostics and memoized tables. */
  readonly id: string;
  /** The layout frame's own class name, which identifies the build in a document. */
  readonly frameClass: string;
  /** Authored prefix → this build's prefix; empty for the authored build. */
  readonly prefixes: Readonly<Record<string, string>>;
}

/**
 * The build the stylesheets are authored against: DSH `0.2.0-rc.2`, macOS
 * commit `5e9e301d`. An empty table is the identity rewrite.
 */
export const PINNED_BUILD: HostBuild = Object.freeze({
  id: 'dsh-0.2.0-rc.2-5e9e301d',
  frameClass: '_6Qf49G_frame',
  prefixes: Object.freeze({}),
});

/**
 * DSH `0.2.0-rc.2`, Windows commit `04f392c9`. Read from that build's
 * `app.asar`: each entry is the same CSS module's class-name map, keyed by the
 * prefix this plugin authored.
 */
export const WINDOWS_BUILD: HostBuild = Object.freeze({
  id: 'dsh-0.2.0-rc.2-04f392c9',
  frameClass: 'BynINW_frame',
  prefixes: Object.freeze({
    '-gRAhq_': 'ws8cKG_',
    'Da3aKq_': '_4Nnt6q_',
    'Dws9Sa_': 'wCInkW_',
    'HiSsxa_': '_3GBCTG_',
    'IzP3Va_': 'cJsG2q_',
    'OpZ85W_': 'iq1doa_',
    'Q2dzhW_': 'pFy1Ka_',
    'ST7X_W_': 'Dc7zOa_',
    'ZogL4G_': 'ET65mq_',
    '_2tNPVa_': 'EBLgjq_',
    '_3WPZCG_': '_2H3hWW_',
    '_3li69W_': 'b06baG_',
    '_6Qf49G_': 'BynINW_',
    '_7514NG_': '_9lTDKa_',
    'bocITq_': 'Hqq-bq_',
    'cl2Rlq_': 'wq12jW_',
    'dVdiKa_': 'srf2qa_',
    'gKv1-q_': 'v5IAXa_',
    'icaHSq_': 'xz4KEq_',
    'iq4beG_': 'WgQWqa_',
    'jJkEga_': 'hIlkoa_',
    'wXeviG_': 'dlU_AG_',
    'y0jqnG_': '_2WTFBq_',
    'yhfFVG_': 'RlGAzG_',
  }),
});

/** Every build whose class names this plugin knows how to speak. */
export const HOST_BUILDS: readonly HostBuild[] = Object.freeze([PINNED_BUILD, WINDOWS_BUILD]);

/** Detection results that came from the document itself, so they never change. */
const identified = new WeakMap<Document, HostBuild>();

/**
 * Identify the build behind one document.
 *
 * The frame's own class name is the evidence: it is present from the first
 * paint of the shell and names the build exactly. Before the shell renders,
 * the Electron preload's `data-platform` attribute decides — it is written
 * before any page script runs — so a stylesheet mounted during client boot is
 * already rewritten for the right build.
 *
 * @param document - the renderer document to identify.
 * @returns the matching build, or the authored one when nothing is recognised.
 */
export function detectHostBuild(document: Document): HostBuild {
  const known = identified.get(document);
  if (known !== undefined) return known;
  /* A document that is not a full renderer document — a test double, or one
     whose root has not been created yet — identifies nothing. Both reads are
     guarded so detection degrades to the authored build instead of throwing
     out of a mount. */
  const frame = typeof document.querySelector === 'function'
    ? document.querySelector('[data-slot="root"] > div')
    : null;
  const names = typeof frame?.className === 'string' ? frame.className.split(/\s+/u) : [];
  const match = HOST_BUILDS.find(build => names.includes(build.frameClass));
  if (match !== undefined) {
    identified.set(document, match);
    return match;
  }
  return document.documentElement?.dataset?.platform === 'win32' ? WINDOWS_BUILD : PINNED_BUILD;
}

/**
 * Rewrite authored host prefixes in one stylesheet or selector.
 *
 * The authored build is returned untouched, and a build without a table for a
 * prefix keeps it, so an unknown class degrades to "the selector does not
 * match" instead of corrupting the rule.
 * @param text - stylesheet text or a selector list using authored prefixes.
 * @param build - build whose prefixes the text should carry.
 * @returns the text as that build names its classes.
 */
export function aliasHostClasses(text: string, build: HostBuild): string {
  let out = text;
  for (const [authored, actual] of Object.entries(build.prefixes)) {
    if (out.includes(authored)) out = out.split(authored).join(actual);
  }
  return out;
}
