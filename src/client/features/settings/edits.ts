import { normalizeColour, normalizeFontName } from '../../../shared/config.ts';
import type { SettingsPathOp } from '../../contracts/ports.ts';
import type { SettingsKey } from './locales.ts';

/**
 * Field edits for a page that writes as you go.
 *
 * There is no draft: every control commits the moment its value is settled, so
 * each helper below turns one settled input into the single operation the
 * settings transport should carry — or into the reason it must not be sent.
 */

/** Per-field validation failures, keyed by dictionary label. */
export type FieldErrors = Partial<Record<string, SettingsKey>>;

/** One field write. */
export function setOperation(path: readonly string[], value: unknown): SettingsPathOp {
  return { op: 'set', path, value };
}

/** One field clear, restoring the schema default. */
export function unsetOperation(path: readonly string[]): SettingsPathOp {
  return { op: 'unset', path };
}

export interface TextCommit {
  /** The write to send, absent when nothing changed or the value is unusable. */
  readonly op?: SettingsPathOp;
  /** Why an unusable value was refused. */
  readonly error?: SettingsKey;
  /** The text the field should keep showing. */
  readonly text: string;
}

function commit(
  path: readonly string[],
  raw: string,
  current: string,
  normalize: (value: unknown) => string,
  error: SettingsKey,
): TextCommit {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return current === '' ? { text: '' } : { op: unsetOperation(path), text: '' };
  }
  const value = normalize(trimmed);
  if (value === '') return { error, text: raw };
  return value === current ? { text: value } : { op: setOperation(path, value), text: value };
}

/**
 * Settle one colour field.
 * @param path - the field's path inside the configuration section.
 * @param raw - what the field currently shows.
 * @param current - the served value it started from.
 * @returns the write, the refusal, or nothing when the value already matches.
 */
export function commitColour(path: readonly string[], raw: string, current: string): TextCommit {
  return commit(path, raw, current, normalizeColour, 'error.colour');
}

/**
 * Settle one typeface field.
 * @param path - the field's path inside the configuration section.
 * @param raw - what the field currently shows.
 * @param current - the served value it started from.
 * @returns the write, the refusal, or nothing when the value already matches.
 */
export function commitFont(path: readonly string[], raw: string, current: string): TextCommit {
  return commit(path, raw, current, normalizeFontName, 'error.font');
}
