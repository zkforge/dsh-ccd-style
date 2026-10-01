import type { FeatureDefinition, FeatureEnvironment } from '../contracts/feature.ts';
import { CleanupScope } from './cleanup.ts';

export function mountFeatures(
  features: readonly FeatureDefinition[],
  environment: FeatureEnvironment,
  parent: CleanupScope,
): void {
  for (const feature of features) {
    if (!environment.config.features[feature.id]) continue;
    if (feature.status === 'planned') {
      environment.logger.debug(`${feature.id}: planned (${feature.task})`);
      continue;
    }
    const scope = new CleanupScope(error => environment.logger.error(`${feature.id}: cleanup failed`, error));
    parent.add(() => scope.dispose());
    try {
      feature.mount(environment, scope);
    } catch (error) {
      scope.dispose();
      environment.logger.error(`${feature.id}: mount failed; native UI retained`, error);
    }
  }
}
