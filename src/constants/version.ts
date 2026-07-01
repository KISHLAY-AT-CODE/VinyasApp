import Constants from 'expo-constants';

/**
 * Centralized app version — reads from expo config (app.json → version).
 * Used by the APK self-updater and SettingsTab.
 */
export const APP_VERSION: string = Constants.expoConfig?.version ?? '1.0.2';

/**
 * GitHub repository info for the self-update system.
 */
export const GITHUB_REPO_OWNER = 'KISHLAY-AT-CODE';
export const GITHUB_REPO_NAME = 'VinyasApp';
