import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Context } from '@deepseek-ai/cordis';
import { createThemePreferencePort } from '../src/client/compat/adapter.ts';

/*
 * The Appearance control has no state of its own: it reads the theme service's
 * snapshot, writes through the service's only preference entry, and re-renders
 * on `theme/change`. These cases pin that face, including the build that does
 * not publish one.
 */

interface FakeTheme {
  preference: string;
  reads: number;
  writes: string[];
  listeners: Set<() => void>;
}

function fakeContext(theme: FakeTheme | null, withOn = true) {
  const ctx = {
    ...(withOn ? {
      on(name: string, listener: () => void) {
        assert.equal(name, 'theme/change');
        theme?.listeners.add(listener);
        return () => { theme?.listeners.delete(listener); };
      },
    } : {}),
    ...(theme === null ? {} : {
      theme: {
        getTheme() {
          theme.reads += 1;
          return { preference: theme.preference };
        },
        setTheme(preference: string) {
          theme.writes.push(preference);
          theme.preference = preference;
          for (const listener of [...theme.listeners]) listener();
        },
      },
    }),
  } as unknown as Context;
  return ctx;
}

function fakeTheme(): FakeTheme {
  return { preference: 'system', reads: 0, writes: [], listeners: new Set() };
}

test('the port reads and writes the service preference', () => {
  const theme = fakeTheme();
  const port = createThemePreferencePort(fakeContext(theme));
  assert.ok(port !== null);
  assert.equal(port.preference(), 'system');
  port.set('dark');
  assert.deepEqual(theme.writes, ['dark']);
  assert.equal(port.preference(), 'dark');
});

test('subscribers hear the service change signal and stop on release', () => {
  const theme = fakeTheme();
  const port = createThemePreferencePort(fakeContext(theme));
  assert.ok(port !== null);
  let changes = 0;
  const release = port.subscribe(() => { changes += 1; });
  assert.equal(theme.listeners.size, 1);
  port.set('light');
  assert.equal(changes, 1);
  release();
  assert.equal(theme.listeners.size, 0);
  port.set('system');
  assert.equal(changes, 1);
});

test('a service without the preference entries keeps the page working', () => {
  assert.equal(createThemePreferencePort(fakeContext(null)), null);
  /* Without the event bus the control could not follow an external switch, so
     the row is left out rather than showing a stale value. */
  assert.equal(createThemePreferencePort(fakeContext(fakeTheme(), false)), null);
});
