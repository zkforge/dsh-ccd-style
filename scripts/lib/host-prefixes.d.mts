/**
 * Types for the host-prefix tooling.
 *
 * The implementation is plain ESM (`host-prefixes.mjs`) because it runs as a
 * build script; this declaration is what the test and any TypeScript caller
 * see. Keep it next to the implementation and in step with it.
 */

/** One CSS module of a build: where it lives and the local names it defines. */
export interface HostModule {
  readonly file: string;
  readonly locals: ReadonlySet<string>;
}

/** A build's CSS modules, keyed by their class-name hash. */
export type HostModules = ReadonlyMap<string, HostModule>;

/** The version and build commit one `app.asar` reports. */
export interface BuildIdentity {
  readonly version: string | undefined;
  readonly commit: string | undefined;
}

/** The pairing of authored prefixes with one target build. */
export interface PrefixPairing {
  readonly mapping: ReadonlyMap<string, string>;
  readonly problems: ReadonlyMap<string, string>;
}

/** Read an asar and return `path -> contents` for accepted entries. */
export function readAsar(path: string, accept?: (entry: string) => boolean): Map<string, Buffer>;

/** `hash -> Set<local>` for every CSS module named in one bundle text. */
export function parseClassMaps(text: string): Map<string, Set<string>>;

/** `hash -> module` for every CSS module in one asar. */
export function asarModules(asar: ReadonlyMap<string, Buffer>): Map<string, HostModule>;

/** The build identity an asar's manifests carry. */
export function asarBuildIdentity(asar: ReadonlyMap<string, Buffer>): BuildIdentity;

/** Pair authored prefixes with the modules the target build gives them. */
export function mapPrefixes(
  prefixes: Iterable<string>,
  reference: HostModules,
  target: HostModules,
): PrefixPairing;

/** Replace authored prefixes in one text, in a single pass. */
export function rewritePrefixes(text: string, mapping: ReadonlyMap<string, string>): string;

/** Render the `WINDOWS_BUILD` block for one target build. */
export function renderWindowsBuild(input: {
  readonly id: string;
  readonly frameClass: string;
  readonly prefixes: ReadonlyMap<string, string>;
}): string;

/** Whether one path under `src/` may name a host class. */
export function isSourceFile(path: string): boolean;
