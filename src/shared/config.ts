export const FEATURE_IDS = [
  'shell', 'sidebar', 'new-session', 'conversation', 'tool-calls', 'statistics',
] as const;

export type FeatureId = typeof FEATURE_IDS[number];
export type FeatureFlags = Readonly<Record<FeatureId, boolean>>;

export interface StyleConfig {
  readonly enabled: boolean;
  readonly debug: boolean;
  readonly features: FeatureFlags;
}

export interface StyleOptions {
  readonly enabled?: boolean;
  readonly debug?: boolean;
  readonly features?: Partial<FeatureFlags>;
}

export const DEFAULT_FEATURES: FeatureFlags = Object.freeze({
  shell: true,
  sidebar: true,
  'new-session': true,
  conversation: true,
  'tool-calls': false,
  statistics: false,
});

export function resolveConfig(input: StyleOptions = {}): StyleConfig {
  const features = { ...DEFAULT_FEATURES };
  for (const id of FEATURE_IDS) {
    const value = input.features?.[id];
    if (value !== undefined) {
      if (typeof value !== 'boolean') throw new TypeError(`features.${id} must be boolean`);
      features[id] = value;
    }
  }
  for (const key of ['enabled', 'debug'] as const) {
    if (input[key] !== undefined && typeof input[key] !== 'boolean') {
      throw new TypeError(`${key} must be boolean`);
    }
  }
  return Object.freeze({
    enabled: input.enabled ?? false,
    debug: input.debug ?? false,
    features: Object.freeze(features),
  });
}
