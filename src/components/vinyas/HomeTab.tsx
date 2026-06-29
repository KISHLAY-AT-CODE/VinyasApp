import React from 'react';
import {
  StyleSheet,
  Text,
  View
} from 'react-native';
import {
  BookOpenCheck,
  Calendar,
  Layers,
  TrendingUp,
  CheckCircle2,
  Flame,
  Activity
} from 'lucide-react-native';
import { THEME } from '../../constants/vinyas-theme';

interface Routine {
  title: string;
  done: boolean;
  streak?: number;
}

interface ActivityLog {
  message?: string;
  timestamp?: string;
}

interface HomeTabProps {
  overallProgressPercentage: number;
  completedChaptersCount: number;
  totalChaptersCount: number;
  daysLeft: number | null;
  cohort: string;
  routines: Routine[];
  activities?: ActivityLog[];
}

export default function HomeTab({
  overallProgressPercentage,
  completedChaptersCount,
  totalChaptersCount,
  daysLeft,
  cohort,
  routines,
  activities
}: HomeTabProps) {
  return (
    <View style={styles.tabContainer}>
      {/* Progress Summary Card */}
      <View style={styles.progressCard}>
        <View style={styles.progressGlow} />
        <View style={styles.progressRow}>
          <View style={styles.progressTextCol}>
            <Text style={styles.cardHeader}>Overall Progress</Text>
            <Text style={styles.progressPercent}>{overallProgressPercentage}%</Text>
            <Text style={styles.progressRatio}>
              {completedChaptersCount} of {totalChaptersCount} Chapters Complete
            </Text>
          </View>
          <View style={styles.progressVisualCol}>
            <View style={styles.progressRingPlaceholder}>
              <BookOpenCheck size={48} color={THEME.orange} />
            </View>
          </View>
        </View>
        <View style={styles.progressProgressBarBg}>
          <View style={[styles.progressProgressBarFill, { width: `${overallProgressPercentage}%` }]} />
        </View>
      </View>

      {/* Countdown Target & Cohort Widget */}
      <View style={styles.row}>
        {daysLeft !== null && (
          <View style={[styles.card, { flex: 1, marginRight: 8 }]}>
            <View style={styles.countdownTitleRow}>
              <Calendar size={14} color={THEME.red} />
              <Text style={styles.tinyCardHeader}>Countdown</Text>
            </View>
            <Text style={styles.bigStat}>{daysLeft}</Text>
            <Text style={styles.statLabel}>Days to Exam</Text>
          </View>
        )}
        <View style={[styles.card, { flex: 1, marginLeft: daysLeft !== null ? 8 : 0 }]}>
          <View style={styles.countdownTitleRow}>
            <Layers size={14} color={THEME.blue} />
            <Text style={styles.tinyCardHeader}>Cohort</Text>
          </View>
          <Text style={styles.mediumStat} numberOfLines={1}>{cohort}</Text>
          <Text style={styles.statLabel}>Syllabus Template</Text>
        </View>
      </View>

      {/* Daily Routines checklist */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <TrendingUp size={18} color={THEME.emerald} />
          <Text style={styles.cardTitle}>Daily Study Routines</Text>
          <Text style={styles.cardCount}>
            {routines.filter((r) => r.done).length}/{routines.length}
          </Text>
        </View>

        {routines.length === 0 ? (
          <Text style={styles.emptyText}>No routine tasks configured on your console.</Text>
        ) : (
          <View style={styles.routineList}>
            {routines.map((routine, index) => (
              <View key={index} style={styles.routineItem}>
                <CheckCircle2
                  size={18}
                  color={routine.done ? THEME.emerald : THEME.borderLight}
                />
                <Text
                  style={[
                    styles.routineText,
                    routine.done && styles.routineTextCompleted
                  ]}
                  numberOfLines={1}
                >
                  {routine.title}
                </Text>
                {routine.streak && routine.streak > 0 ? (
                  <View style={styles.streakBadge}>
                    <Flame size={10} color={THEME.orange} />
                    <Text style={styles.streakText}>{routine.streak}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Recent Activity Log */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Activity size={18} color={THEME.purple} />
          <Text style={styles.cardTitle}>Live Event Log</Text>
        </View>
        {activities && activities.length > 0 ? (
          <View style={styles.activityFeed}>
            {activities.slice(0, 5).map((act, index) => (
              <View key={index} style={styles.activityFeedItem}>
                <View style={styles.activityDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityLogText}>{act.message || `Activity event registered`}</Text>
                  <Text style={styles.activityLogTime}>
                    {act.timestamp ? new Date(act.timestamp).toLocaleTimeString() : 'Recently'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No recent activity events logged.</Text>
        )}
      </View>
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
  progressTextCol: {
    flex: 1,
  },
  cardHeader: {
    color: THEME.textMuted,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  progressPercent: {
    color: THEME.text,
    fontSize: 32,
    fontWeight: '900',
    marginVertical: 4,
  },
  progressRatio: {
    color: THEME.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  progressVisualCol: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#020617',
    borderWidth: 4,
    borderColor: THEME.orange + '20',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.orange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  progressProgressBarBg: {
    height: 6,
    backgroundColor: '#020617',
    borderRadius: 3,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressProgressBarFill: {
    height: '100%',
    backgroundColor: THEME.orange,
    borderRadius: 3,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 18,
    marginBottom: 16,
  },
  countdownTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  tinyCardHeader: {
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  bigStat: {
    color: THEME.text,
    fontSize: 28,
    fontWeight: '900',
  },
  mediumStat: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '800',
    marginVertical: 6,
  },
  statLabel: {
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: '600',
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
  cardCount: {
    color: THEME.text,
    fontSize: 11,
    fontWeight: 'bold',
    backgroundColor: '#020617',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  emptyText: {
    color: THEME.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  routineList: {
    marginTop: 4,
  },
  routineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 8,
  },
  routineText: {
    color: THEME.text,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
  },
  routineTextCompleted: {
    color: THEME.textMuted,
    textDecorationLine: 'line-through',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.orange + '15',
    borderColor: THEME.orange + '30',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  streakText: {
    color: THEME.orange,
    fontSize: 9,
    fontWeight: 'bold',
  },
  activityFeed: {
    marginTop: 4,
  },
  activityFeedItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.orange,
    marginTop: 6,
    marginRight: 10,
  },
  activityLogText: {
    color: THEME.text,
    fontSize: 11,
    lineHeight: 16,
  },
  activityLogTime: {
    color: THEME.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
});
