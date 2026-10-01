import type { FeatureId, StyleConfig } from '../../shared/config.ts';
import type { CleanupScope } from '../core/cleanup.ts';
import type { DomPort, HostServices, Logger } from './ports.ts';

export interface FeatureEnvironment {
  readonly config: StyleConfig;
  readonly host: HostServices;
  readonly dom: DomPort;
  readonly logger: Logger;
}

interface FeatureMetadata {
  readonly id: FeatureId;
  readonly task: string;
}

export interface PlannedFeature extends FeatureMetadata {
  readonly status: 'planned';
}

export interface ImplementedFeature extends FeatureMetadata {
  readonly status: 'implemented';
  mount(environment: FeatureEnvironment, scope: CleanupScope): void;
}

export type FeatureDefinition = PlannedFeature | ImplementedFeature;
