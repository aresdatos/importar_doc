// Feature flags configuration
export interface FeatureFlags {
  enableDeepSeek: boolean;
  enableManualZoneSelection: boolean;
  enableDataEditing: boolean;
  enableApiLogs: boolean;
  enableRetry: boolean;
}

// Production feature flags configuration
const DEFAULT_FLAGS: FeatureFlags = {
  enableDeepSeek: true,         // Enable DeepSeek API integration
  enableManualZoneSelection: true, // Keep manual zone selection enabled
  enableDataEditing: true,      // Enable data editing
  enableApiLogs: true,          // Show API logs in development
  enableRetry: true,           // Keep retry functionality enabled
};

// Singleton to manage feature flags
class FeatureFlagManager {
  private static instance: FeatureFlagManager;
  private flags: FeatureFlags = DEFAULT_FLAGS;

  private constructor() {}

  static getInstance(): FeatureFlagManager {
    if (!FeatureFlagManager.instance) {
      FeatureFlagManager.instance = new FeatureFlagManager();
    }
    return FeatureFlagManager.instance;
  }

  getFlags(): FeatureFlags {
    return { ...this.flags };
  }

  setFlags(flags: Partial<FeatureFlags>) {
    this.flags = {
      ...this.flags,
      ...flags,
    };
  }

  isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag];
  }
}

// Export a singleton instance
export const featureFlags = FeatureFlagManager.getInstance();