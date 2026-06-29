import React from 'react';
import {
  StyleSheet,
  Text,
  View
} from 'react-native';
import { THEME } from '../../constants/vinyas-theme';

interface TestLog {
  testName?: string;
  score?: number;
  date?: string;
  rank?: string | number;
  notes?: string;
}

interface AnalyticsTabProps {
  testLogs: TestLog[];
}

export default function AnalyticsTab({ testLogs }: AnalyticsTabProps) {
  const totalTests = testLogs.length;
  const totalScore = testLogs.reduce((acc, log) => acc + (log.score || 0), 0);
  const averageScore = totalTests > 0 ? Math.round(totalScore / totalTests) : 0;
  const maxScore = testLogs.reduce((max, log) => ((log.score ?? 0) > max ? (log.score ?? 0) : max), 0);

  return (
    <View style={styles.tabContainer}>
      <View style={styles.progressCard}>
        <View style={[styles.progressGlow, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]} />
        <Text style={styles.cardHeader}>Test Performance Analytics</Text>
        <View style={[styles.progressRow, { marginTop: 10 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bigStat}>{totalTests}</Text>
            <Text style={styles.statLabel}>Tests Logged</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bigStat}>{averageScore}</Text>
            <Text style={styles.statLabel}>Average Score</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bigStat}>{maxScore}</Text>
            <Text style={styles.statLabel}>High Score</Text>
          </View>
        </View>
      </View>

      {/* Test Logs List */}
      <Text style={styles.subSectionTitle}>Mock Test Reports</Text>
      {testLogs.length === 0 ? (
        <Text style={styles.emptyText}>No mock tests logged in your console.</Text>
      ) : (
        testLogs.map((log, idx) => (
          <View key={idx} style={styles.testLogItem}>
            <View style={styles.testHeaderRow}>
              <Text style={styles.testTitle}>{log.testName || `Mock Test ${idx + 1}`}</Text>
              <Text style={styles.testScoreText}>
                Score: <Text style={{ fontWeight: 'bold', color: THEME.orange }}>{log.score}</Text>
              </Text>
            </View>
            <View style={styles.testMetaRow}>
              <Text style={styles.testMetaText}>
                Date: {log.date ? new Date(log.date).toLocaleDateString() : 'N/A'}
              </Text>
              {log.rank ? <Text style={styles.testMetaText}>Rank: {log.rank}</Text> : null}
            </View>
            {log.notes ? (
              <View style={styles.testNotesContainer}>
                <Text style={styles.testNotesLabel}>Diagnostic Review:</Text>
                <Text style={styles.testNotesText}>{log.notes}</Text>
              </View>
            ) : null}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    padding: 0,
  },
  progressCard: {
    backgroundColor: THEME.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  progressGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: THEME.glow,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeader: {
    color: THEME.textMuted,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  bigStat: {
    color: THEME.text,
    fontSize: 28,
    fontWeight: '900',
  },
  statLabel: {
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  subSectionTitle: {
    color: THEME.text,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 10,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyText: {
    color: THEME.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  testLogItem: {
    backgroundColor: THEME.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    marginBottom: 12,
  },
  testHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  testTitle: {
    color: THEME.text,
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  testScoreText: {
    color: THEME.textMuted,
    fontSize: 11,
  },
  testMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  testMetaText: {
    color: THEME.textMuted,
    fontSize: 9,
    fontWeight: 'bold',
  },
  testNotesContainer: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 10,
    padding: 10,
  },
  testNotesLabel: {
    color: THEME.orange,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  testNotesText: {
    color: THEME.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
});
