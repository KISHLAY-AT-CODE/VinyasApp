import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Download, X, ArrowUpCircle, AlertTriangle, CheckCircle2, RefreshCw, Loader } from 'lucide-react-native';
import { THEME } from '../../constants/vinyas-theme';
import { APP_VERSION } from '../../constants/version';
import { type ApkUpdateInfo, type DownloadProgress, formatBytes } from '../../services/apk-updater';

export type OtaStatus = 'checking' | 'up-to-date' | 'available' | 'error';
export type BuildStatus = 'checking' | 'up-to-date' | 'available' | 'error' | 'idle';

export interface UpdateModalProps {
  visible: boolean;
  // Status of each channel
  otaStatus: OtaStatus;
  buildStatus: BuildStatus;
  // APK update info (when buildStatus === 'available')
  apkUpdateInfo: ApkUpdateInfo | null;
  // Download progress (when downloading APK)
  downloadProgress: DownloadProgress | null;
  isDownloadingApk: boolean;
  // OTA downloading state
  isDownloadingOta: boolean;
  // Callbacks
  onOtaUpdate: () => void;
  onApkDownload: () => void;
  onDismiss: () => void;
}

export default function UpdateModal({
  visible,
  otaStatus,
  buildStatus,
  apkUpdateInfo,
  downloadProgress,
  isDownloadingApk,
  isDownloadingOta,
  onOtaUpdate,
  onApkDownload,
  onDismiss,
}: UpdateModalProps) {
  const isChecking = otaStatus === 'checking' || buildStatus === 'checking';
  const hasAnyUpdate = otaStatus === 'available' || buildStatus === 'available';
  const isAllUpToDate = otaStatus === 'up-to-date' && (buildStatus === 'up-to-date' || buildStatus === 'idle');
  const isForcedUpdate = apkUpdateInfo?.isForced ?? false;
  const canDismiss = !isForcedUpdate && !isDownloadingApk && !isDownloadingOta;

  const progressWidth = downloadProgress
    ? `${Math.min(downloadProgress.percentage, 100)}%`
    : '0%';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={canDismiss ? onDismiss : undefined}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[
              styles.iconContainer,
              hasAnyUpdate && { backgroundColor: 'rgba(249, 115, 22, 0.1)', borderColor: 'rgba(249, 115, 22, 0.2)' },
              isForcedUpdate && { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' },
            ]}>
              {isChecking ? (
                <ActivityIndicator size="small" color={THEME.orange} />
              ) : isForcedUpdate ? (
                <AlertTriangle size={26} color={THEME.red} />
              ) : hasAnyUpdate ? (
                <ArrowUpCircle size={26} color={THEME.orange} />
              ) : (
                <CheckCircle2 size={26} color={THEME.emerald} />
              )}
            </View>
            {canDismiss && (
              <TouchableOpacity style={styles.closeBtn} onPress={onDismiss}>
                <X size={18} color={THEME.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {isChecking
              ? 'Checking for Updates...'
              : isForcedUpdate
              ? 'Critical Update Required'
              : hasAnyUpdate
              ? 'Update Available'
              : 'System Status'}
          </Text>

          {/* Status Rows */}
          <View style={styles.statusSection}>
            {/* OTA Status Row */}
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>OTA</Text>
              <View style={styles.statusRight}>
                {otaStatus === 'checking' ? (
                  <>
                    <ActivityIndicator size={12} color={THEME.orange} style={{ marginRight: 6 }} />
                    <Text style={styles.statusChecking}>Checking...</Text>
                  </>
                ) : otaStatus === 'up-to-date' ? (
                  <>
                    <CheckCircle2 size={14} color={THEME.emerald} style={{ marginRight: 6 }} />
                    <Text style={styles.statusUpToDate}>Up to date</Text>
                  </>
                ) : otaStatus === 'available' ? (
                  <>
                    <ArrowUpCircle size={14} color={THEME.orange} style={{ marginRight: 6 }} />
                    <Text style={styles.statusAvailable}>Update available</Text>
                    {!isDownloadingOta && (
                      <TouchableOpacity style={styles.inlineUpdateBtn} onPress={onOtaUpdate} activeOpacity={0.7}>
                        <Text style={styles.inlineUpdateBtnText}>Update</Text>
                      </TouchableOpacity>
                    )}
                    {isDownloadingOta && (
                      <ActivityIndicator size={12} color={THEME.orange} style={{ marginLeft: 8 }} />
                    )}
                  </>
                ) : (
                  <>
                    <X size={14} color={THEME.textMuted} style={{ marginRight: 6 }} />
                    <Text style={styles.statusError}>Check failed</Text>
                  </>
                )}
              </View>
            </View>

            {/* Build Status Row */}
            <View style={[styles.statusRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.statusLabel}>Build</Text>
              <View style={styles.statusRight}>
                {buildStatus === 'checking' ? (
                  <>
                    <ActivityIndicator size={12} color={THEME.orange} style={{ marginRight: 6 }} />
                    <Text style={styles.statusChecking}>Checking...</Text>
                  </>
                ) : buildStatus === 'up-to-date' || buildStatus === 'idle' ? (
                  <>
                    <CheckCircle2 size={14} color={THEME.emerald} style={{ marginRight: 6 }} />
                    <Text style={styles.statusUpToDate}>Up to date</Text>
                  </>
                ) : buildStatus === 'available' && apkUpdateInfo ? (
                  <>
                    <ArrowUpCircle size={14} color={THEME.orange} style={{ marginRight: 6 }} />
                    <Text style={styles.statusAvailable} numberOfLines={1}>
                      v{apkUpdateInfo.version} available
                    </Text>
                    {!isDownloadingApk && (
                      <TouchableOpacity style={styles.inlineUpdateBtn} onPress={onApkDownload} activeOpacity={0.7}>
                        <Text style={styles.inlineUpdateBtnText}>Update</Text>
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <>
                    <X size={14} color={THEME.textMuted} style={{ marginRight: 6 }} />
                    <Text style={styles.statusError}>Check failed</Text>
                  </>
                )}
              </View>
            </View>

            {/* Version Row */}
            <View style={[styles.statusRow, { borderBottomWidth: 0, borderTopWidth: 1, borderTopColor: THEME.border }]}>
              <Text style={styles.statusLabel}>Version</Text>
              <Text style={styles.versionValue}>{APP_VERSION}</Text>
            </View>
          </View>

          {/* Release Notes (only when APK update available) */}
          {buildStatus === 'available' && apkUpdateInfo && (
            <ScrollView style={styles.notesContainer} nestedScrollEnabled>
              <Text style={styles.notesTitle}>What's New in v{apkUpdateInfo.version}</Text>
              <Text style={styles.notesBody}>{apkUpdateInfo.releaseNotes}</Text>
            </ScrollView>
          )}

          {/* Download Progress */}
          {isDownloadingApk && downloadProgress && (
            <View style={styles.progressSection}>
              <View style={styles.progressBarBg}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    { width: progressWidth as any },
                  ]}
                />
              </View>
              <View style={styles.progressStats}>
                <Text style={styles.progressPercent}>
                  {downloadProgress.percentage}%
                </Text>
                <Text style={styles.progressBytes}>
                  {formatBytes(downloadProgress.downloadedBytes)} / {formatBytes(downloadProgress.totalBytes)}
                </Text>
              </View>
              <Text style={styles.downloadingSubtext}>Downloading update — keep the app open</Text>
            </View>
          )}

          {/* OTA Downloading State */}
          {isDownloadingOta && (
            <View style={styles.progressSection}>
              <ActivityIndicator size="small" color={THEME.orange} />
              <Text style={styles.downloadingSubtext}>Downloading OTA update...</Text>
            </View>
          )}

          {/* Dismiss Button */}
          {!isChecking && canDismiss && (
            <TouchableOpacity
              style={styles.dismissBtn}
              onPress={onDismiss}
              activeOpacity={0.7}
            >
              <Text style={styles.dismissBtnText}>
                {isAllUpToDate ? 'Done' : 'Maybe Later'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: THEME.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: THEME.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 16,
  },
  statusSection: {
    backgroundColor: 'rgba(2, 6, 23, 0.6)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  statusLabel: {
    color: THEME.textMuted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    minWidth: 50,
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  statusChecking: {
    color: THEME.orange,
    fontSize: 11,
    fontWeight: '700',
  },
  statusUpToDate: {
    color: THEME.emerald,
    fontSize: 11,
    fontWeight: '700',
  },
  statusAvailable: {
    color: THEME.orange,
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
  },
  statusError: {
    color: THEME.textMuted,
    fontSize: 11,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  versionValue: {
    color: THEME.text,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  inlineUpdateBtn: {
    backgroundColor: THEME.orange,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginLeft: 10,
  },
  inlineUpdateBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  notesContainer: {
    maxHeight: 120,
    backgroundColor: 'rgba(2, 6, 23, 0.6)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 14,
    marginBottom: 16,
  },
  notesTitle: {
    color: THEME.orange,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  notesBody: {
    color: THEME.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  progressSection: {
    marginBottom: 16,
    alignItems: 'center',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: THEME.emerald,
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    width: '100%',
  },
  progressPercent: {
    color: THEME.emerald,
    fontSize: 11,
    fontWeight: '900',
  },
  progressBytes: {
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  downloadingSubtext: {
    color: THEME.textMuted,
    fontSize: 10,
    marginTop: 8,
    fontWeight: '600',
  },
  dismissBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  dismissBtnText: {
    color: THEME.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
});
