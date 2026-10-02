import type { ImplementedFeature } from '../../contracts/feature.ts';
import statisticsCss from './statistics.css';
import { mountStatisticsCard } from './mount.ts';
import { createStatsSource } from './source.ts';

/**
 * New-session statistics card. DSH sells no cross-session aggregate, so the
 * host half folds the session logs through a projection unit of its own and
 * serves one snapshot on `/api/ccd-stats`; the card renders that snapshot with
 * the reference's own presentation rules. See docs/STATS_RESEARCH.md.
 */
export const statisticsFeature: ImplementedFeature = {
  id: 'statistics',
  status: 'implemented',
  task: 'docs/STATS_RESEARCH.md',
  mount(environment, scope) {
    scope.add(environment.dom.mountStyles(statisticsCss));
    const source = createStatsSource({ logger: environment.logger });
    scope.add(() => source.dispose());
    mountStatisticsCard(document, scope, environment.logger, source);
  },
};
