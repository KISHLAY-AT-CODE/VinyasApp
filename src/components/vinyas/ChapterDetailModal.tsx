import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Linking
} from 'react-native';
import {
  ExternalLink,
  Clock,
  RefreshCw,
  TrendingUp,
  Target
} from 'lucide-react-native';
import {
  THEME,
  calculateChapterBreakdown,
  getChapterMasterScore,
  getAccuracyTheme
} from '../../constants/vinyas-theme';

interface Book {
  name?: string;
  url?: string;
}

interface Assignment {
  name?: string;
  title?: string;
  type?: string;
  url?: string;
  isSolved?: boolean;
  questionCount?: number;
  questionStates?: any;
  selfAnalysis?: {
    isSubmitted?: boolean;
    correctCount?: number;
    incorrectCount?: number;
    timestamp?: string;
  };
}

interface Chapter {
  name: string;
  altNames?: string[];
  status?: string;
  lectures?: number;
  dpp?: { comp: number; acc: number };
  module?: { comp: number; acc: number };
  focusTime?: number;
  reviewsDone?: number;
  nextReview?: string;
  lastReviewRating?: string;
  log?: string;
  books?: Book[];
  assignments?: Assignment[];
}

interface ChapterDetailModalProps {
  visible: boolean;
  chapter: Chapter | null;
  onClose: () => void;
}

export default function ChapterDetailModal({ visible, chapter, onClose }: ChapterDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'dpp' | 'module' | 'assignments'>('overview');

  if (!visible || !chapter) return null;

  const breakdown = calculateChapterBreakdown(chapter);
  const masterScore = getChapterMasterScore(chapter);
  const accuracyTheme = getAccuracyTheme(masterScore);

  const formatFocusTime = (seconds?: number) => {
    if (!seconds || seconds <= 0) return '0m';
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hrs}h ${remainingMins}m` : `${hrs}h`;
  };

  const formatReviewDate = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return isoString;
    }
  };

  // Compute standings and recommendations identical to ProgressModal.jsx
  let standing = 'Unattempted 📭';
  let recommendation = 'No exercises started for this chapter yet. Sync your extension progress or solve DPPs to begin!';
  
  if (masterScore >= 80) {
    standing = 'Expert 🎓';
    recommendation = 'Great progress and high accuracy! Clear remaining assignments or module exercises to push for full mastery.';
  } else if (masterScore >= 55) {
    standing = 'Proficient 🏆';
    recommendation = 'Solid performance. Dedicate time to solve complex module questions or clear pending assignments to build confidence.';
  } else if (masterScore >= 30) {
    standing = 'Developing 📈';
    recommendation = 'Chapter coverage is growing. Review conceptual details and double-check wrong answers on completed exercises.';
  } else if (breakdown.overallComp > 0 && breakdown.overallAcc < 40) {
    standing = 'Developing 📈';
    recommendation = 'Your progress is logged, but accuracy is low. Focus on reviewing theory before attempting more questions.';
  }

  const hasAssignments = chapter.assignments && chapter.assignments.length > 0;

  // Overview Tab Renderer
  const renderOverview = () => {
    return (
      <View style={styles.tabContent}>
        {/* Radial Standing Gauge Card */}
        <View style={[styles.gaugeCard, { borderColor: accuracyTheme.border }]}>
          <View style={styles.gaugeWrapper}>
            <View style={[styles.gaugeCircle, { borderColor: accuracyTheme.text }]}>
              <Text style={styles.gaugeValue}>{masterScore}%</Text>
              <Text style={styles.gaugeSubText}>Master Score</Text>
            </View>
          </View>
          <Text style={styles.standingLabel}>Overall Standing</Text>
          <View style={[styles.standingBadge, { backgroundColor: accuracyTheme.bg, borderColor: accuracyTheme.border }]}>
            <Text style={[styles.standingBadgeText, { color: accuracyTheme.text }]}>
              {standing}
            </Text>
          </View>
          <Text style={styles.recommendationText}>{recommendation}</Text>
        </View>

        {/* Component Breakdown Card */}
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Component Breakdown</Text>
          
          {/* DPP Progress */}
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownHeader}>
              <Text style={styles.breakdownLabel}>Daily Practice Problems (DPP)</Text>
              <Text style={styles.weightLabel}>Weight: 30%</Text>
            </View>
            <View style={styles.progressRow}>
              <View style={styles.miniTrack}>
                {breakdown.correct > 0 && <View style={[styles.miniFill, { flex: breakdown.correct, backgroundColor: THEME.emerald }]} />}
                {breakdown.incorrect > 0 && <View style={[styles.miniFill, { flex: breakdown.incorrect, backgroundColor: THEME.red }]} />}
                {breakdown.notAttempted > 0 && <View style={[styles.miniFill, { flex: breakdown.notAttempted, backgroundColor: '#334155' }]} />}
              </View>
              <View style={styles.statsTextCol}>
                <Text style={styles.statsCompText}>Comp: {chapter.dpp?.comp || 0}%</Text>
                <Text style={styles.statsAccText}>Acc: {chapter.dpp?.acc || 0}%</Text>
              </View>
            </View>
          </View>

          {/* Module Progress */}
          <View style={styles.breakdownItemBordered}>
            <View style={styles.breakdownHeader}>
              <Text style={styles.breakdownLabel}>Interactive Module</Text>
              <Text style={styles.weightLabel}>Weight: 40%</Text>
            </View>
            <View style={styles.progressRow}>
              <View style={styles.miniTrack}>
                {breakdown.correct > 0 && <View style={[styles.miniFill, { flex: breakdown.correct, backgroundColor: THEME.emerald }]} />}
                {breakdown.incorrect > 0 && <View style={[styles.miniFill, { flex: breakdown.incorrect, backgroundColor: THEME.red }]} />}
                {breakdown.notAttempted > 0 && <View style={[styles.miniFill, { flex: breakdown.notAttempted, backgroundColor: '#334155' }]} />}
              </View>
              <View style={styles.statsTextCol}>
                <Text style={styles.statsCompText}>Comp: {chapter.module?.comp || 0}%</Text>
                <Text style={styles.statsAccText}>Acc: {chapter.module?.acc || 0}%</Text>
              </View>
            </View>
          </View>

          {/* Assignments Progress */}
          {hasAssignments && (
            <View style={styles.breakdownItemBordered}>
              <View style={styles.breakdownHeader}>
                <Text style={styles.breakdownLabel}>Assignments</Text>
                <Text style={styles.weightLabel}>Weight: 30%</Text>
              </View>
              <View style={styles.progressRow}>
                <View style={styles.miniTrack}>
                  {breakdown.correct > 0 && <View style={[styles.miniFill, { flex: breakdown.correct, backgroundColor: THEME.emerald }]} />}
                  {breakdown.incorrect > 0 && <View style={[styles.miniFill, { flex: breakdown.incorrect, backgroundColor: THEME.red }]} />}
                  {breakdown.notAttempted > 0 && <View style={[styles.miniFill, { flex: breakdown.notAttempted, backgroundColor: '#334155' }]} />}
                </View>
                <View style={styles.statsTextCol}>
                  <Text style={styles.statsCompText}>Comp: {Math.round(breakdown.overallComp)}%</Text>
                  <Text style={styles.statsAccText}>Acc: {Math.round(breakdown.overallAcc)}%</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Global Study Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statsBlock}>
            <View style={styles.statsBlockHeader}>
              <Clock size={12} color={THEME.orange} />
              <Text style={styles.statsBlockTitle}>Study Time</Text>
            </View>
            <Text style={styles.statsBlockValue}>{formatFocusTime(chapter.focusTime)}</Text>
          </View>
          <View style={styles.statsBlock}>
            <View style={styles.statsBlockHeader}>
              <RefreshCw size={12} color={THEME.blue} />
              <Text style={styles.statsBlockTitle}>Revision cycles</Text>
            </View>
            <Text style={styles.statsBlockValue}>{chapter.reviewsDone || 0} times</Text>
          </View>
        </View>

        {/* Notes & logs box */}
        <Text style={styles.modalSectionTitle}>Console Study Logs</Text>
        {chapter.log && chapter.log.trim() ? (
          <View style={styles.logBox}>
            <Text style={styles.logText}>{chapter.log.trim()}</Text>
          </View>
        ) : (
          <Text style={styles.emptyText}>No activity log registered for this chapter.</Text>
        )}
      </View>
    );
  };

  // DPP / Module Tab Renderer
  const renderStatTab = (type: 'dpp' | 'module') => {
    const comp = type === 'dpp' ? (chapter.dpp?.comp || 0) : (chapter.module?.comp || 0);
    const acc = type === 'dpp' ? (chapter.dpp?.acc || 0) : (chapter.module?.acc || 0);
    const label = type === 'dpp' ? 'Daily Practice Problems' : 'Interactive Module';

    return (
      <View style={styles.tabContent}>
        <Text style={styles.modalSectionTitle}>{label} Coverage</Text>
        <View style={styles.statsRow}>
          <View style={styles.statsBlock}>
            <View style={styles.statsBlockHeader}>
              <TrendingUp size={12} color={THEME.orange} />
              <Text style={styles.statsBlockTitle}>Completion</Text>
            </View>
            <Text style={styles.statsBlockValue}>{comp}%</Text>
            <View style={styles.statProgressBarBg}>
              <View style={[styles.statProgressBarFill, { width: `${comp}%`, backgroundColor: THEME.orange }]} />
            </View>
          </View>

          <View style={styles.statsBlock}>
            <View style={styles.statsBlockHeader}>
              <Target size={12} color={THEME.blue} />
              <Text style={styles.statsBlockTitle}>Accuracy</Text>
            </View>
            <Text style={styles.statsBlockValue}>{acc}%</Text>
            <View style={styles.statProgressBarBg}>
              <View style={[styles.statProgressBarFill, { width: `${acc}%`, backgroundColor: THEME.blue }]} />
            </View>
          </View>
        </View>

        {/* Alternate Curriculum Aliases */}
        {type === 'dpp' && (
          <>
            <Text style={styles.modalSectionTitle}>Syllabus Aliases</Text>
            {chapter.altNames && chapter.altNames.length > 0 ? (
              <View style={styles.aliasGrid}>
                {chapter.altNames.map((alias, idx) => (
                  <Text key={idx} style={styles.aliasBadge}>{alias}</Text>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No alternative name maps registered.</Text>
            )}
          </>
        )}

        {/* Spaced repetition schedule if present in Module Tab */}
        {type === 'module' && (chapter.nextReview || chapter.lastReviewRating) && (
          <>
            <Text style={styles.modalSectionTitle}>Spaced Repetition Schedule</Text>
            <View style={styles.srCard}>
              {chapter.nextReview && (
                <View style={styles.srRow}>
                  <Text style={styles.srLabel}>Next Scheduled Review:</Text>
                  <Text style={styles.srValue}>{formatReviewDate(chapter.nextReview)}</Text>
                </View>
              )}
              {chapter.lastReviewRating && (
                <View style={[styles.srRow, { marginTop: 8 }]}>
                  <Text style={styles.srLabel}>Last Rated Difficulty:</Text>
                  <Text style={[styles.srRatingText, { color: accuracyTheme.text }]}>
                    {chapter.lastReviewRating}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </View>
    );
  };

  // Assignments Tab Renderer
  const renderAssignments = () => {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.modalSectionTitle}>Mapped Worksheets & PDFs</Text>
        {chapter.assignments && chapter.assignments.length > 0 ? (
          chapter.assignments.map((ass: Assignment, aIdx: number) => {
            const isSolved = ass.isSolved || ass.selfAnalysis?.isSubmitted;
            return (
              <View key={aIdx} style={styles.assCard}>
                <View style={styles.assCardHeader}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.assCardTitle} numberOfLines={1}>
                      {ass.name || ass.title || 'Assignment Log'}
                    </Text>
                    <Text style={styles.assCardSubtitle}>{ass.type || 'DPP'}</Text>
                  </View>
                  <View style={[styles.solvedBadge, { backgroundColor: isSolved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(71, 85, 105, 0.15)', borderColor: isSolved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(71, 85, 105, 0.3)' }]}>
                    <Text style={[styles.solvedBadgeText, { color: isSolved ? THEME.emerald : THEME.textMuted }]}>
                      {isSolved ? 'Solved' : 'Unsolved'}
                    </Text>
                  </View>
                </View>

                {/* Self Analysis stats correct / incorrect values */}
                {ass.selfAnalysis?.isSubmitted && (
                  <View style={styles.selfAnalysisContainer}>
                    <View style={styles.selfAnalysisDotRow}>
                      <View style={[styles.selfAnalysisDot, { backgroundColor: THEME.emerald }]} />
                      <Text style={styles.selfAnalysisDotLabel}>Correct: {ass.selfAnalysis.correctCount || 0}</Text>
                    </View>
                    <View style={styles.selfAnalysisDotRow}>
                      <View style={[styles.selfAnalysisDot, { backgroundColor: THEME.red }]} />
                      <Text style={styles.selfAnalysisDotLabel}>Incorrect: {ass.selfAnalysis.incorrectCount || 0}</Text>
                    </View>
                  </View>
                )}

                {ass.url ? (
                  <TouchableOpacity
                    style={styles.assLinkBtn}
                    onPress={() => Linking.openURL(ass.url!)}
                  >
                    <Text style={styles.assLinkBtnText} numberOfLines={1}>{ass.url}</Text>
                    <ExternalLink size={11} color={THEME.blue} />
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>No manual or synced sheets mapped to this chapter.</Text>
        )}
      </View>
    );
  };

  return (
    <View 
      style={styles.modalOverlay} 
      onStartShouldSetResponder={() => true} 
      onResponderRelease={onClose}
    >
      <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
        
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.modalCategoryTitle}>Chapter Detail Profile</Text>
            <Text style={styles.modalTitle} numberOfLines={1}>{chapter.name}</Text>
          </View>
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={onClose}
          >
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>

        {/* Modal Tabs Row */}
        <View style={styles.modalTabsContainer}>
          {(['overview', 'dpp', 'module', 'assignments'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.7}
              style={[
                styles.modalTabItem,
                activeTab === tab && styles.modalTabItemActive
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.modalTabLabel,
                  activeTab === tab && styles.modalTabLabelActive
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Body ScrollView */}
        <ScrollView 
          style={styles.modalScroll} 
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'dpp' && renderStatTab('dpp')}
          {activeTab === 'module' && renderStatTab('module')}
          {activeTab === 'assignments' && renderAssignments()}
        </ScrollView>
      </View>
    </View>
  );
}

const styles: any = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalCard: {
    backgroundColor: THEME.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: THEME.border,
  },
  modalCategoryTitle: {
    color: THEME.orange,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  modalTitle: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '900',
  },
  modalCloseBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  modalCloseText: {
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    padding: 3,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    marginVertical: 14,
  },
  modalTabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  modalTabItemActive: {
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  modalTabLabel: {
    color: THEME.textMuted,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalTabLabelActive: {
    color: '#ffffff',
  },
  modalScroll: {
    flexGrow: 0,
  },
  tabContent: {
    paddingTop: 4,
  },
  gaugeCard: {
    backgroundColor: THEME.card,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  gaugeWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 6,
    borderColor: THEME.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(2, 6, 23, 0.4)',
  },
  gaugeCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  gaugeValue: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 26,
  },
  gaugeSubText: {
    color: THEME.textMuted,
    fontSize: 7,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  standingLabel: {
    color: THEME.textMuted,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  standingBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 10,
  },
  standingBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  recommendationText: {
    color: THEME.textMuted,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 8,
  },
  breakdownCard: {
    backgroundColor: THEME.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    marginBottom: 16,
  },
  breakdownTitle: {
    color: THEME.text,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.2)',
    paddingBottom: 8,
    marginBottom: 12,
  },
  breakdownItem: {
    marginBottom: 12,
  },
  breakdownItemBordered: {
    borderTopWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.15)',
    paddingTop: 12,
    marginTop: 12,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  breakdownLabel: {
    color: THEME.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
  weightLabel: {
    color: THEME.textMuted,
    fontSize: 8,
    backgroundColor: '#020617',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  miniTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#020617',
    borderRadius: 3,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
  },
  statsTextCol: {
    minWidth: 70,
    alignItems: 'flex-end',
  },
  statsCompText: {
    color: THEME.text,
    fontSize: 9,
    fontWeight: 'bold',
  },
  statsAccText: {
    color: THEME.textMuted,
    fontSize: 9,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statsBlock: {
    flex: 1,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 20,
    padding: 14,
  },
  statsBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statsBlockTitle: {
    color: THEME.textMuted,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  statsBlockValue: {
    color: THEME.text,
    fontSize: 14,
    fontWeight: '900',
  },
  statProgressBarBg: {
    height: 3,
    backgroundColor: '#020617',
    borderRadius: 1.5,
    marginTop: 8,
    overflow: 'hidden',
  },
  statProgressBarFill: {
    height: '100%',
  },
  modalSectionTitle: {
    color: THEME.orange,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  logBox: {
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
  },
  logText: {
    color: THEME.text,
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  emptyText: {
    color: THEME.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  aliasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  aliasBadge: {
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: THEME.text,
    fontSize: 10,
    fontWeight: '600',
  },
  srCard: {
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
  },
  srRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  srLabel: {
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
  },
  srValue: {
    color: THEME.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
  srRatingText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  assCard: {
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 20,
    padding: 14,
    marginBottom: 8,
  },
  assCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assCardTitle: {
    color: THEME.text,
    fontSize: 11,
    fontWeight: 'bold',
  },
  assCardSubtitle: {
    color: THEME.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
  solvedBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  solvedBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  selfAnalysisContainer: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.15)',
    paddingTop: 8,
    marginBottom: 4,
  },
  selfAnalysisDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  selfAnalysisDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  selfAnalysisDotLabel: {
    color: THEME.textMuted,
    fontSize: 9,
    fontWeight: 'bold',
  },
  assLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  assLinkBtnText: {
    color: THEME.blue,
    fontSize: 10,
    flex: 1,
  },
});
