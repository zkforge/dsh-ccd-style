import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveConfig } from '../src/shared/config.ts';
import type { FeatureDefinition, FeatureEnvironment } from '../src/client/contracts/feature.ts';
import type { HostServices } from '../src/client/contracts/ports.ts';
import { CleanupScope } from '../src/client/core/cleanup.ts';
import { mountFeatures } from '../src/client/core/mount-features.ts';

test('failed feature rolls back partially acquired resources and other features still work', () => {
  const events: string[] = [];
  const errors: string[] = [];
  const features: FeatureDefinition[] = [
    {
      id: 'sidebar', status: 'implemented', task: 'test',
      mount(_environment, scope) {
        scope.add(() => { events.push('sidebar restored'); });
        throw new Error('slot unavailable');
      },
    },
    {
      id: 'conversation', status: 'implemented', task: 'test',
      mount(_environment, scope) {
        events.push('conversation mounted');
        scope.add(() => { events.push('conversation restored'); });
      },
    },
    { id: 'statistics', status: 'planned', task: 'later' },
  ];
  const environment: FeatureEnvironment = {
    config: resolveConfig({ enabled: true, features: { statistics: true } }),
    host: Object.create(null) as HostServices,
    dom: { activate: () => () => {}, mountStyles: () => () => {} },
    logger: { debug: () => {}, error: message => { errors.push(message); } },
  };
  const parent = new CleanupScope();
  mountFeatures(features, environment, parent);
  assert.deepEqual(events, ['sidebar restored', 'conversation mounted']);
  assert.equal(errors.length, 1);
  parent.dispose();
  assert.deepEqual(events, ['sidebar restored', 'conversation mounted', 'conversation restored']);
});
