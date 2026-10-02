import type { ModelDirectoryState } from '@deepseek-ai/dsh-client-ui-model-selection/client';
import type { ModelCatalogModel, ModelSelection } from '@deepseek-ai/dsh-api-session-controller/types';

export interface EffortChoice { readonly id: string | undefined; readonly name: string; }

/** Derive only advertised options; provider-default remains reachable when advertised. */
export function effortChoices(model: ModelCatalogModel | undefined, defaultName: string): EffortChoice[] {
  const reasoning = model?.reasoning;
  if (!reasoning) return [];
  return [
    ...(reasoning.defaultEffort === undefined ? [{ id: undefined, name: defaultName }] : []),
    ...reasoning.efforts,
  ];
}

/** Same-model picks retain effort; a different model starts at its own default. */
export function modelSelection(provider: string, model: ModelCatalogModel, current: ModelSelection | null): ModelSelection {
  const effort = current?.provider === provider && current.model === model.id
    ? current.reasoningEffort ?? model.reasoning?.defaultEffort : model.reasoning?.defaultEffort;
  return { provider, model: model.id, ...(effort === undefined ? {} : { reasoningEffort: effort }) };
}

/** Read the latest directory at commit time so a stale drag cannot change another model. */
export function effortSelection(state: ModelDirectoryState, route: ModelSelection, effort: string | undefined): ModelSelection | null {
  if (!state.current || state.current.provider !== route.provider || state.current.model !== route.model || state.pending) return null;
  const model = state.groups.find(group => group.id === route.provider)?.models.find(model => model.id === route.model);
  if (!model?.reasoning || !effortChoices(model, '').some(choice => choice.id === effort)) return null;
  return { provider: route.provider, model: route.model, ...(effort === undefined ? {} : { reasoningEffort: effort }) };
}
