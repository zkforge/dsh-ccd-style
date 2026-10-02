import type { ImplementedFeature } from '../../contracts/feature.ts';
import statisticsCss from './statistics.css';
import { mountStatisticsCard } from './mount.ts';

/**
 * New-session statistics card. DSH sells no cross-session aggregate, so the
 * host half will fold the session logs and serve one snapshot; this step is the
 * card itself, drawn at the reference geometry with stand-in numbers. See
 * docs/STATS_RESEARCH.md.
 */
export const statisticsFeature: ImplementedFeature = {
  id: 'statistics',
  status: 'implemented',
  task: 'docs/STATS_RESEARCH.md',
  mount(environment, scope) {
    scope.add(environment.dom.mountStyles(statisticsCss));
    mountStatisticsCard(document, scope, environment.logger);
  },
};
