import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDomPort } from '../src/client/compat/dom.ts';
import { ROOT_ATTRIBUTE } from '../src/shared/identity.ts';

test('overlapping activations retain the gate until the final owner leaves and restore prior state', () => {
  const attributes = new Map([[ROOT_ATTRIBUTE, 'previous']]);
  const root = {
    getAttribute: (name: string) => attributes.get(name) ?? null,
    setAttribute: (name: string, value: string) => { attributes.set(name, value); },
    removeAttribute: (name: string) => { attributes.delete(name); },
  };
  // Narrow test double: no claim of browser or DSH integration coverage.
  const document = { documentElement: root } as unknown as Document;
  const first = createDomPort(document).activate();
  const second = createDomPort(document).activate();
  first();
  assert.equal(attributes.get(ROOT_ATTRIBUTE), 'true');
  second();
  second();
  assert.equal(attributes.get(ROOT_ATTRIBUTE), 'previous');
});

test('teardown does not overwrite a gate subsequently changed by another owner', () => {
  const attributes = new Map<string, string>();
  const root = {
    getAttribute: (name: string) => attributes.get(name) ?? null,
    setAttribute: (name: string, value: string) => { attributes.set(name, value); },
    removeAttribute: (name: string) => { attributes.delete(name); },
  };
  const dispose = createDomPort({ documentElement: root } as unknown as Document).activate();
  attributes.set(ROOT_ATTRIBUTE, 'external');
  dispose();
  assert.equal(attributes.get(ROOT_ATTRIBUTE), 'external');
});
