import assert from 'node:assert/strict';
import test from 'node:test';
import type { ModelDirectoryState } from '@deepseek-ai/dsh-client-ui-model-selection/client';
import { effortChoices, effortSelection, modelSelection } from '../src/client/features/model-controls/selection.ts';
const model = { id: 'reasoner', name: 'Reasoner', reasoning: { defaultEffort: 'high', efforts: [{ id: 'low', name: 'Low' }, { id: 'high', name: 'High' }] } };
const current = { provider: 'provider', model: model.id, reasoningEffort: 'low' };
const state: ModelDirectoryState = { current, groups: [{ id: 'provider', name: 'Provider', models: [model] }], failures: [], status: 'ready', routable: true, pending: null, error: null };
test('model changes use the new model default; same-model selection preserves effort', () => {
  assert.deepEqual(modelSelection('provider', model, current), current);
  assert.deepEqual(modelSelection('other', model, current), { provider: 'other', model: 'reasoner', reasoningEffort: 'high' });
  assert.deepEqual(modelSelection('provider', { id: 'plain', name: 'Plain' }, current), { provider: 'provider', model: 'plain' });
});
test('effort options are exactly advertised, including an omitted provider default', () => {
  assert.deepEqual(effortChoices(model, 'Default'), model.reasoning.efforts);
  const noDefault = { ...model, reasoning: { efforts: model.reasoning.efforts } };
  assert.deepEqual(effortChoices(noDefault, 'Default'), [{ id: undefined, name: 'Default' }, ...model.reasoning.efforts]);
  assert.deepEqual(effortChoices({ id: 'plain', name: 'Plain' }, 'Default'), []);
});
test('stale drags, concurrent selections and unsupported effort never submit', () => {
  assert.equal(effortSelection({ ...state, current: { ...current, model: 'other' } }, current, 'high'), null);
  assert.equal(effortSelection({ ...state, pending: current }, current, 'high'), null);
  assert.equal(effortSelection(state, current, 'ultracode'), null);
  assert.equal(effortSelection(state, current, undefined), null);
  assert.deepEqual(effortSelection(state, current, 'high'), { ...current, reasoningEffort: 'high' });
});
test('provider-default clears explicit effort and unavailable routes remain untouched', () => {
  const withoutDefault = { ...state, groups: [{ ...state.groups[0]!, models: [{ ...model, reasoning: { efforts: model.reasoning.efforts } }] }] };
  assert.deepEqual(effortSelection(withoutDefault, current, undefined), { provider: current.provider, model: current.model });
  assert.equal(effortSelection({ ...state, groups: [] }, current, 'low'), null);
});
