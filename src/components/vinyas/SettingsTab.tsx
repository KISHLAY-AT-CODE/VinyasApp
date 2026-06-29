import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
  Alert
} from 'react-native';
import { User, LogOut, Settings as SettingsIcon, Terminal, RefreshCw, Flame } from 'lucide-react-native';
import { THEME } from '../../constants/vinyas-theme';

interface SettingsTabProps {
  syncId: string | null;
  sessionToken: string | null;
  lastUpdated: string;
  onDisconnect: () => void;
  networkLogs?: string[];
  onClearLogs?: () => void;
  onTriggerTestLoading?: () => void;
  onManualUpdateCheck?: () => void;
}

export default function SettingsTab({
  syncId,
  sessionToken,
  lastUpdated,
  onDisconnect,
  networkLogs = [],
  onClearLogs = () => {},
  onTriggerTestLoading = () => {},
  onManualUpdateCheck = () => {}
}: SettingsTabProps) {
  const [isConsoleFullScreen, setIsConsoleFullScreen] = useState(false);
  const [versionClicks, setVersionClicks] = useState(0);
  const [cacheClicks, setCacheClicks] = useState(0);
  const [maintainerClicks, setMaintainerClicks] = useState(0);
  const [showPlayground, setShowPlayground] = useState(false);

  return (
    <View style={styles.tabContainer}>
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <User size={18} color={THEME.orange} />
          <Text style={styles.cardTitle}>Console Account Sync</Text>
        </View>

        <View style={styles.settingsMeta}>
          <Text style={styles.settingsMetaLabel}>Device Sync ID:</Text>
          <Text style={styles.settingsMetaValue} numberOfLines={1}>{syncId || 'Not connected'}</Text>
        </View>

        {sessionToken ? (
          <View style={styles.settingsMeta}>
            <Text style={styles.settingsMetaLabel}>Active Session Token:</Text>
            <Text style={styles.settingsMetaValue} numberOfLines={1}>
              {sessionToken.slice(0, 15)}...
            </Text>
          </View>
        ) : null}

        <View style={styles.settingsMeta}>
          <Text style={styles.settingsMetaLabel}>Last Data Sync:</Text>
          <Text style={styles.settingsMetaValue}>
            {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Never'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.disconnectBtn}
          onPress={onDisconnect}
        >
          <LogOut size={16} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.disconnectBtnText}>Disconnect Account</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <SettingsIcon size={18} color={THEME.textMuted} />
          <Text style={styles.cardTitle}>Vinyas Mobile Client Info</Text>
        </View>
        
        <TouchableOpacity
          style={styles.infoRow}
          activeOpacity={0.8}
          onPress={() => {
            if (showPlayground) return;
            // Version must be the very first tap. Any other active taps or double clicks reset the sequence.
            if (versionClicks >= 1 || cacheClicks > 0 || maintainerClicks > 0) {
              setVersionClicks(0);
              setCacheClicks(0);
              setMaintainerClicks(0);
            } else {
              setVersionClicks(1);
            }
          }}
        >
          <Text style={styles.infoLabel}>Client Version</Text>
          <Text style={styles.infoValue}>1.0.1</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.infoRow}
          activeOpacity={0.8}
          onPress={() => {
            if (showPlayground) return;
            // Cache clicks must follow exactly 1 version click, no maintainer clicks, and max 2 cache clicks.
            if (versionClicks !== 1 || maintainerClicks > 0 || cacheClicks >= 2) {
              setVersionClicks(0);
              setCacheClicks(0);
              setMaintainerClicks(0);
            } else {
              setCacheClicks(prev => prev + 1);
            }
          }}
        >
          <Text style={styles.infoLabel}>Local Cache</Text>
          <Text style={styles.infoValue}>Active (AsyncStorage)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.infoRow}
          activeOpacity={0.8}
          onPress={() => {
            if (showPlayground) return;
            // Maintainer clicks must follow exactly 1 version click, exactly 2 cache clicks, and max 3 maintainer clicks.
            if (versionClicks !== 1 || cacheClicks !== 2 || maintainerClicks >= 3) {
              setVersionClicks(0);
              setCacheClicks(0);
              setMaintainerClicks(0);
            } else {
              const nextClicks = maintainerClicks + 1;
              setMaintainerClicks(nextClicks);
              if (nextClicks === 3) {
                setShowPlayground(true);
                Alert.alert("Developer Mode", "Developer Playground unlocked!");
              }
            }
          }}
        >
          <Text style={styles.infoLabel}>Developer Maintainer</Text>
          <Text style={styles.infoValue}>Vinyas Team</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.updateCheckBtn}
          onPress={onManualUpdateCheck}
          activeOpacity={0.7}
        >
          <RefreshCw size={14} color={THEME.orange} style={{ marginRight: 6 }} />
          <Text style={styles.updateCheckBtnText}>Check for Updates</Text>
        </TouchableOpacity>
      </View>

      {/* Developer Playground (Unlocked via secret tap code) */}
      {showPlayground && (
        <>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>Developer Playground</Text>
            <TouchableOpacity
              style={styles.hidePlaygroundBtn}
              onPress={() => {
                setShowPlayground(false);
                setVersionClicks(0);
                setCacheClicks(0);
                setMaintainerClicks(0);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.hidePlaygroundBtnText}>Hide</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Flame size={18} color={THEME.orange} />
              <Text style={styles.cardTitle}>Playground Actions</Text>
            </View>
            <Text style={styles.playgroundSubtitle}>
              Developer test environment and companion instrumentation options:
            </Text>
            <View style={styles.playgroundActionsRow}>
              <TouchableOpacity
                style={styles.playgroundBtn}
                onPress={onTriggerTestLoading}
                activeOpacity={0.7}
              >
                <RefreshCw size={14} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.playgroundBtnText}>Test Loading Screen (3s)</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Network Logs Debug Console */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Terminal size={16} color={THEME.emerald} />
              <Text style={styles.cardTitle}>Network Logs Console</Text>
              <TouchableOpacity style={styles.clearBtn} onPress={onClearLogs}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsConsoleFullScreen(true)}
            >
              <ScrollView
                style={styles.consoleBox}
                nestedScrollEnabled={true}
                pointerEvents="none"
              >
                {networkLogs && networkLogs.length > 0 ? (
                  networkLogs.map((log, index) => {
                    const isErrorLog = log.toLowerCase().includes('error') || log.toLowerCase().includes('fail');
                    return (
                      <Text
                        key={index}
                        style={[styles.consoleText, isErrorLog && styles.consoleTextError]}
                      >
                        {log}
                      </Text>
                    );
                  })
                ) : (
                  <Text style={styles.consoleTextEmpty}>No network events recorded yet. Tap to view details.</Text>
                )}
              </ScrollView>
              <Text style={styles.consoleTapHint}>Tap to expand full screen</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Full Screen Console Modal */}
      <Modal
        visible={isConsoleFullScreen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsConsoleFullScreen(false)}
      >
        <View style={styles.fullScreenConsoleContainer}>
          <View style={styles.fullScreenConsoleHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Terminal size={18} color={THEME.emerald} />
              <Text style={styles.fullScreenConsoleTitle}>Network Logs Terminal</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={styles.clearBtn} onPress={onClearLogs}>
                <Text style={styles.clearBtnText}>Clear Logs</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setIsConsoleFullScreen(false)}
              >
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.fullScreenConsoleBody}>
            {networkLogs && networkLogs.length > 0 ? (
              networkLogs.map((log, index) => {
                const isErrorLog = log.toLowerCase().includes('error') || log.toLowerCase().includes('fail');
                return (
                  <Text
                    key={index}
                    style={[styles.fullScreenConsoleText, isErrorLog && styles.fullScreenConsoleTextError]}
                  >
                    {log}
                  </Text>
                );
              })
            ) : (
              <Text style={styles.consoleTextEmpty}>No network events recorded yet.</Text>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles: any = StyleSheet.create({
  tabContainer: {
    padding: 0,
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 18,
    marginBottom: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    color: THEME.text,
    fontSize: 13,
    fontWeight: '900',
    marginLeft: 8,
    flex: 1,
  },
  settingsMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: THEME.border,
  },
  settingsMetaLabel: {
    color: THEME.textMuted,
    fontSize: 11,
    fontWeight: 'bold',
  },
  settingsMetaValue: {
    color: THEME.text,
    fontSize: 11,
    fontWeight: 'bold',
    maxWidth: 160,
  },
  disconnectBtn: {
    flexDirection: 'row',
    backgroundColor: THEME.red,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  disconnectBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  updateCheckBtn: {
    flexDirection: 'row',
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  updateCheckBtnText: {
    color: THEME.orange,
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'Poppins-Bold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: THEME.border,
  },
  infoLabel: {
    color: THEME.textMuted,
    fontSize: 11,
    fontWeight: 'bold',
  },
  infoValue: {
    color: THEME.text,
    fontSize: 11,
    fontWeight: '600',
  },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: '#020617',
  },
  clearBtnText: {
    color: THEME.orange,
    fontSize: 9,
    fontWeight: 'bold',
  },
  consoleBox: {
    maxHeight: 180,
    backgroundColor: '#020617',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 10,
    marginTop: 8,
  },
  consoleText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#10b981',
    fontSize: 9,
    marginBottom: 4,
    lineHeight: 12,
  },
  consoleTextError: {
    color: '#ef4444',
  },
  consoleTextEmpty: {
    color: THEME.textMuted,
    fontSize: 10,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  consoleTapHint: {
    color: THEME.orange,
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  fullScreenConsoleContainer: {
    flex: 1,
    backgroundColor: '#020617',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 16,
  },
  fullScreenConsoleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: THEME.border,
  },
  fullScreenConsoleTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: THEME.red,
  },
  closeBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  fullScreenConsoleBody: {
    flex: 1,
    paddingVertical: 12,
  },
  fullScreenConsoleText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#10b981',
    fontSize: 10,
    marginBottom: 8,
    lineHeight: 14,
  },
  fullScreenConsoleTextError: {
    color: '#ef4444',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionHeader: {
    color: THEME.orange,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingLeft: 4,
  },
  hidePlaygroundBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  hidePlaygroundBtnText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: 'bold',
  },
  playgroundSubtitle: {
    color: THEME.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 14,
  },
  playgroundActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  playgroundBtn: {
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    borderColor: 'rgba(249, 115, 22, 0.35)',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playgroundBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
