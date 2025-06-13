
// Feature flags for controlling application behavior
export const FEATURE_FLAGS = {
  // Controls whether to use database storage for calendar events
  // Default: false (use localStorage - current behavior)
  // Set to true to enable team collaboration via database
  USE_DATABASE_CALENDAR_EVENTS: false,
  
  // Debug flag for logging feature flag usage
  DEBUG_FEATURE_FLAGS: false
} as const;

export const isFeatureEnabled = (flag: keyof typeof FEATURE_FLAGS): boolean => {
  const enabled = FEATURE_FLAGS[flag];
  
  if (FEATURE_FLAGS.DEBUG_FEATURE_FLAGS) {
    console.log(`🚩 Feature flag ${flag}: ${enabled}`);
  }
  
  return enabled;
};
