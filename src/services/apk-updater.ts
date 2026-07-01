import { Platform, NativeModules } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_VERSION, GITHUB_REPO_OWNER, GITHUB_REPO_NAME } from '../constants/version';

const GITHUB_API_BASE = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}`;
const LAST_CHECK_KEY = 'vinyas_apk_update_last_check';
const APK_CACHE_DIR = `${FileSystem.cacheDirectory}apk_updates/`;

/** Minimum interval between background checks (in ms) — 6 hours */
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

export interface ApkUpdateInfo {
  version: string;
  downloadUrl: string;
  releaseNotes: string;
  publishedAt: string;
  isForced: boolean;
  htmlUrl: string;
}

export interface DownloadProgress {
  totalBytes: number;
  downloadedBytes: number;
  percentage: number;
}

/**
 * Compare two semver strings. Returns:
 *  1 if a > b
 *  0 if a == b
 * -1 if a < b
 */
function compareSemver(a: string, b: string): number {
  const pa = a.replace(/^v/, '').split('.').map(Number);
  const pb = b.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const va = pa[i] ?? 0;
    const vb = pb[i] ?? 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}

/**
 * Check if enough time has elapsed since the last background check.
 * Manual checks bypass this throttle.
 */
async function shouldCheckInBackground(): Promise<boolean> {
  try {
    const lastCheck = await AsyncStorage.getItem(LAST_CHECK_KEY);
    if (!lastCheck) return true;
    const elapsed = Date.now() - parseInt(lastCheck, 10);
    return elapsed >= CHECK_INTERVAL_MS;
  } catch {
    return true;
  }
}

async function recordCheckTimestamp(): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_CHECK_KEY, Date.now().toString());
  } catch {
    // non-critical, ignore
  }
}

/**
 * Fetches the latest release from GitHub and determines if an APK update is available.
 * Returns null if no update is available or if the check should be skipped.
 * 
 * @param isManual If true, bypasses the background throttle
 */
export async function checkForApkUpdate(isManual: boolean = false): Promise<ApkUpdateInfo | null> {
  // Only run on Android
  if (Platform.OS !== 'android') return null;

  // Background throttle
  if (!isManual) {
    const shouldCheck = await shouldCheckInBackground();
    if (!shouldCheck) return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${GITHUB_API_BASE}/releases/latest`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'VinyasApp-Updater',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        // No releases exist yet
        return null;
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const release = await response.json();
    const tagName: string = release.tag_name ?? '';
    const remoteVersion = tagName.replace(/^v/, '').replace(/-force$/, '');
    const isForced = tagName.toLowerCase().includes('-force');

    // Compare versions
    if (compareSemver(remoteVersion, APP_VERSION) <= 0) {
      // Already up to date
      await recordCheckTimestamp();
      return null;
    }

    // Find the APK asset
    const assets: Array<{ name: string; browser_download_url: string }> = release.assets ?? [];
    const apkAsset = assets.find(
      (a) => a.name.toLowerCase().endsWith('.apk')
    );

    if (!apkAsset) {
      // Release exists but no APK attached
      console.warn('[APK Updater] New release found but no APK asset attached');
      return null;
    }

    await recordCheckTimestamp();

    return {
      version: remoteVersion,
      downloadUrl: apkAsset.browser_download_url,
      releaseNotes: release.body ?? 'No release notes available.',
      publishedAt: release.published_at ?? '',
      isForced,
      htmlUrl: release.html_url ?? '',
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.warn('[APK Updater] Check timed out');
    } else {
      console.warn('[APK Updater] Check failed:', err.message);
    }
    return null;
  }
}

/**
 * Downloads the APK to the app's cache directory.
 * Reports download progress via the onProgress callback.
 * Returns the local file path of the downloaded APK.
 */
export async function downloadApk(
  downloadUrl: string,
  version: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<string> {
  // Ensure the cache directory exists
  const dirInfo = await FileSystem.getInfoAsync(APK_CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(APK_CACHE_DIR, { intermediates: true });
  }

  // Clean up old APKs
  try {
    const existing = await FileSystem.readDirectoryAsync(APK_CACHE_DIR);
    for (const file of existing) {
      await FileSystem.deleteAsync(`${APK_CACHE_DIR}${file}`, { idempotent: true });
    }
  } catch {
    // non-critical
  }

  const fileName = `VinyasSathi-v${version}.apk`;
  const filePath = `${APK_CACHE_DIR}${fileName}`;

  const downloadResumable = FileSystem.createDownloadResumable(
    downloadUrl,
    filePath,
    {
      headers: {
        'User-Agent': 'VinyasApp-Updater',
      },
    },
    (downloadProgress) => {
      const { totalBytesWritten, totalBytesExpectedToWrite } = downloadProgress;
      const percentage = totalBytesExpectedToWrite > 0
        ? Math.round((totalBytesWritten / totalBytesExpectedToWrite) * 100)
        : 0;
      onProgress?.({
        totalBytes: totalBytesExpectedToWrite,
        downloadedBytes: totalBytesWritten,
        percentage,
      });
    }
  );

  const result = await downloadResumable.downloadAsync();

  if (!result || !result.uri) {
    throw new Error('Download failed — no result URI');
  }

  // Verify file exists
  const fileInfo = await FileSystem.getInfoAsync(result.uri);
  if (!fileInfo.exists || fileInfo.size === 0) {
    throw new Error('Downloaded APK file is empty or missing');
  }

  return result.uri;
}

/**
 * Triggers the Android system installer for the downloaded APK.
 * Uses the native ApkInstallerModule.
 */
export async function installApk(filePath: string): Promise<void> {
  if (Platform.OS !== 'android') {
    throw new Error('APK installation is only supported on Android');
  }

  const ApkInstaller = NativeModules.ApkInstaller;
  if (!ApkInstaller) {
    throw new Error(
      'ApkInstaller native module not found. ' +
      'Make sure you ran npx expo prebuild and the plugin is registered in app.json.'
    );
  }

  // Convert expo file URI to absolute path for the native module
  let absolutePath = filePath;
  if (filePath.startsWith('file://')) {
    absolutePath = filePath.replace('file://', '');
  }

  await ApkInstaller.installApk(absolutePath);
}

/**
 * Formats bytes into a human-readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
