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

/**
 * Fold the Host-served configuration section into a validated StyleConfig.
 * The client half reads its configuration through the settings transport, so
 * the value arrives as untyped JSON from a user-editable patch file: unknown
 * keys, wrong types and an absent section all fall back to the declared
 * defaults instead of failing the whole activation.
 * @param value - the section value from the Host, or undefined before it loads.
 * @returns the validated configuration; never throws.
 */
export function adoptConfig(value: unknown): StyleConfig {
  if (typeof value !== 'object' || value === null) return resolveConfig();
  const input = value as { enabled?: unknown; debug?: unknown; features?: unknown };
  const features: Record<FeatureId, boolean> = { ...DEFAULT_FEATURES };
  if (typeof input.features === 'object' && input.features !== null) {
    const raw = input.features as Partial<Record<FeatureId, unknown>>;
    for (const id of FEATURE_IDS) {
      if (typeof raw[id] === 'boolean') features[id] = raw[id];
    }
  }
  return resolveConfig({
    ...(typeof input.enabled === 'boolean' ? { enabled: input.enabled } : {}),
    ...(typeof input.debug === 'boolean' ? { debug: input.debug } : {}),
    features,
  });
}
