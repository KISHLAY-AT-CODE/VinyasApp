import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  TouchableWithoutFeedback
} from 'react-native';
import {
  BookOpenCheck,
  Calendar,
  Layers,
  Award,
  BookOpen,
  FlaskConical,
  Calculator,
  Atom,
  X,
  ChevronRight,
  TrendingUp
} from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { THEME, getChapterMasterScore, getSubjectThemeColor, calculateChapterBreakdown } from '../../constants/vinyas-theme';

interface HomeTabProps {
  overallProgressPercentage: number;
  completedChaptersCount: number;
  totalChaptersCount: number;
  daysLeft: number | null;
  cohort: string;
  userSyllabus?: any[];
  onSelectSubject: (subjectName: string) => void;
  activities?: any[];
  onSelectChapter: (subjectName: string, chapterName: string) => void;
}

function getSubjectIcon(subjectName: string) {
  const name = (subjectName || '').toLowerCase();
  if (name.includes('physic')) return Atom;
  if (name.includes('chem') || name.includes('biolog') || name.includes('botan') || name.includes('zool')) return FlaskConical;
  if (name.includes('math') || name.includes('algeb') || name.includes('calculus') || name.includes('arith') || name.includes('mathe')) return Calculator;
  return BookOpen;
}

export default function HomeTab({
  overallProgressPercentage,
  completedChaptersCount,
  totalChaptersCount,
  daysLeft,
  cohort,
  userSyllabus = [],
  onSelectSubject,
  activities = [],
  onSelectChapter
}: HomeTabProps) {
  const [activeOverviewSubject, setActiveOverviewSubject] = useState<any | null>(null);

  // Get most recent unique chapters
  const getRecentChapters = () => {
    if (!activities || !userSyllabus) return [];
    
    const list: { chapterName: string; subjectName: string; subjectColor: string; IconComponent: any }[] = [];
    const seenChapters = new Set<string>();

    for (const act of activities) {
      const chName = act.details?.chapterName;
      if (!chName || typeof chName !== 'string') continue;
      const normalizedCh = chName.trim().toLowerCase();
      if (seenChapters.has(normalizedCh)) continue;

      // Find which subject contains this chapter
      let matchedSubject: any = null;
      for (const sub of userSyllabus) {
        const hasCh = sub.chapters?.some(
          (c: any) => c.name.trim().toLowerCase() === normalizedCh
        );
        if (hasCh) {
          matchedSubject = sub;
          break;
        }
      }

      if (matchedSubject) {
        seenChapters.add(normalizedCh);
        const subjectColor = getSubjectThemeColor(matchedSubject.color, matchedSubject.name);
        const IconComponent = getSubjectIcon(matchedSubject.name);
        list.push({
          chapterName: chName.trim(),
          subjectName: matchedSubject.name,
          subjectColor,
          IconComponent
        });
      }

      if (list.length >= 3) break;
    }

    return list;
  };

  const recentChapters = getRecentChapters();

  // SVG Circular Progress Calculations
  const size = 90;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (circumference * overallProgressPercentage) / 100;

  return (
    <View style={styles.tabContainer}>
      {/* Progress Summary Card */}
      <View style={styles.progressCard}>
        <View style={styles.progressGlow} />
        <View style={styles.progressRow}>
          <View style={styles.progressTextCol}>
            <View style={styles.badgeRow}>
              <Award size={12} color={THEME.orange} style={{ marginRight: 4 }} />
              <Text style={styles.cardHeader}>Overall Progress</Text>
            </View>
            <Text style={styles.progressPercent}>{overallProgressPercentage}%</Text>
            <Text style={styles.progressRatio}>
              {completedChaptersCount} of {totalChaptersCount} Chapters Complete
            </Text>
          </View>
          <View style={styles.progressVisualCol}>
            <Svg width={size} height={size} style={styles.progressSvg}>
              {/* Background Circle */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={THEME.border}
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Foreground Animated Progress Circle */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={THEME.orange}
                strokeWidth={strokeWidth}
                strokeDasharray={[circumference, circumference]}
                strokeDashoffset={progressOffset}
                strokeLinecap="round"
                fill="none"
                rotation={-90}
                originX={size / 2}
                originY={size / 2}
              />
            </Svg>
            <View style={styles.progressCenterContent}>
              <BookOpenCheck size={20} color={THEME.orange} />
            </View>
          </View>
        </View>
      </View>

      {/* Countdown Target & Cohort Widget */}
      <View style={styles.row}>
        {daysLeft !== null && (
          <View style={[styles.card, styles.countdownCard, { flex: 1, marginRight: 8 }]}>
            <View style={styles.countdownTitleRow}>
              <Calendar size={14} color={THEME.red} />
              <Text style={[styles.tinyCardHeader, { color: THEME.red }]}>Countdown</Text>
            </View>
            <Text style={styles.bigStat}>{daysLeft}</Text>
            <Text style={styles.statLabel}>Days to Exam</Text>
          </View>
        )}
        <View style={[styles.card, styles.cohortCard, { flex: 1, marginLeft: daysLeft !== null ? 8 : 0 }]}>
          <View style={styles.countdownTitleRow}>
            <Layers size={14} color={THEME.blue} />
            <Text style={[styles.tinyCardHeader, { color: THEME.blue }]}>Cohort</Text>
          </View>
          <Text style={styles.mediumStat} numberOfLines={1}>{cohort}</Text>
        </View>
      </View>

      {/* Recent Activity List */}
      {recentChapters.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <View style={styles.sectionHeaderRow}>
            <Layers size={12} color={THEME.orange} style={{ marginRight: 4 }} />
            <Text style={styles.sectionHeaderTitle}>Recent Activity</Text>
          </View>
          <View style={styles.recentList}>
            {recentChapters.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.recentRow, { borderColor: item.subjectColor + '20' }]}
                activeOpacity={0.75}
                onPress={() => onSelectChapter(item.subjectName, item.chapterName)}
              >
                <View style={styles.recentLeft}>
                  <View style={[styles.recentIconWrapper, { backgroundColor: item.subjectColor + '12' }]}>
                    <item.IconComponent size={14} color={item.subjectColor} />
                  </View>
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={[styles.recentSubjectName, { color: item.subjectColor }]}>{item.subjectName}</Text>
                    <Text style={styles.recentChapterName} numberOfLines={1}>{item.chapterName}</Text>
                  </View>
                </View>
                <View style={[styles.recentNavBadge, { backgroundColor: item.subjectColor + '12' }]}>
                  <ChevronRight size={13} color={item.subjectColor} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Subject Mastery List (No enclosing container) */}
      {userSyllabus && userSyllabus.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <View style={styles.sectionHeaderRow}>
            <TrendingUp size={12} color={THEME.orange} style={{ marginRight: 4 }} />
            <Text style={styles.sectionHeaderTitle}>Current Progress</Text>
          </View>
          <View style={styles.subjectList}>
            {userSyllabus.map((subject, index) => {
              const chapters = subject.chapters || [];
              const subjectColor = getSubjectThemeColor(subject.color, subject.name);
              const IconComponent = getSubjectIcon(subject.name);

              // Calculate subject-level average — only across attempted chapters
              let totalCorrect = 0;
              let totalIncorrect = 0;
              let totalNotAttempted = 0;

              const attemptedChapters = chapters.filter((ch: any) => {
                const bd = calculateChapterBreakdown(ch);
                return bd.overallComp > 0;
              });

              if (attemptedChapters.length > 0) {
                attemptedChapters.forEach((ch: any) => {
                  const breakdown = calculateChapterBreakdown(ch);
                  totalCorrect += breakdown.correct || 0;
                  totalIncorrect += breakdown.incorrect || 0;
                  totalNotAttempted += breakdown.notAttempted || 0;
                });

                totalCorrect = Math.round(totalCorrect / attemptedChapters.length);
                totalIncorrect = Math.round(totalIncorrect / attemptedChapters.length);
                totalNotAttempted = 100 - totalCorrect - totalIncorrect;
              } else {
                totalNotAttempted = 100;
              }

              // Set soft background tint and themed border colors
              const isBlue = subjectColor === THEME.blue;
              const isGreen = subjectColor === THEME.emerald;
              const isPurple = subjectColor === THEME.purple;
              
              let rowBg = 'rgba(255, 255, 255, 0.02)';
              let rowBorder = 'rgba(255, 255, 255, 0.08)';
              if (isBlue) {
                rowBg = 'rgba(59, 130, 246, 0.04)';
                rowBorder = 'rgba(59, 130, 246, 0.15)';
              } else if (isGreen) {
                rowBg = 'rgba(16, 185, 129, 0.04)';
                rowBorder = 'rgba(16, 185, 129, 0.15)';
              } else if (subjectColor === THEME.orange) {
                rowBg = 'rgba(249, 115, 22, 0.04)';
                rowBorder = 'rgba(249, 115, 22, 0.15)';
              } else if (isPurple) {
                rowBg = 'rgba(168, 85, 247, 0.04)';
                rowBorder = 'rgba(168, 85, 247, 0.15)';
              }

              return (
                <View key={index} style={[styles.subjectRow, { backgroundColor: rowBg, borderColor: rowBorder }]}>
                  {/* Header Row containing Clickable Icon + Title and actions */}
                  <View style={styles.subjectHeaderRow}>
                    <TouchableOpacity
                      style={styles.subjectIconTitleRow}
                      activeOpacity={0.7}
                      onPress={() => setActiveOverviewSubject(subject)}
                    >
                      <IconComponent size={20} color={subjectColor} style={{ marginRight: 10 }} />
                      <Text style={[styles.subjectName, { color: subjectColor }]} numberOfLines={1}>
                        {subject.name}
                      </Text>
                    </TouchableOpacity>
                    
                    <View style={styles.subjectActionsRow}>
                      <Text style={styles.subjectChapterCount}>
                        {chapters.length} Chapters
                      </Text>
                      <TouchableOpacity
                        style={[styles.overviewIconBtn, { backgroundColor: subjectColor + '12' }]}
                        activeOpacity={0.7}
                        onPress={() => onSelectSubject(subject.name)}
                      >
                        <ChevronRight size={15} color={subjectColor} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {/* Progress Bar at the very bottom */}
                  <View style={styles.subjectProgressBarBg}>
                    {totalCorrect > 0 && (
                      <View style={[styles.subjectProgressBarFill, { width: `${totalCorrect}%`, backgroundColor: THEME.emerald }]} />
                    )}
                    {totalIncorrect > 0 && (
                      <View style={[styles.subjectProgressBarFill, { width: `${totalIncorrect}%`, backgroundColor: THEME.red }]} />
                    )}
                    {totalNotAttempted > 0 && (
                      <View style={[styles.subjectProgressBarFill, { width: `${totalNotAttempted}%`, backgroundColor: '#334155' }]} />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Subject Diagnostic Overview Modal Sheet */}
      {activeOverviewSubject && (() => {
        const subject = activeOverviewSubject;
        const chapters = subject.chapters || [];
        const subjectColor = getSubjectThemeColor(subject.color, subject.name);

        // Compute Subject Master Score — only across attempted chapters
        const attemptedChapters = chapters.filter((ch: any) => {
          const bd = calculateChapterBreakdown(ch);
          return bd.overallComp > 0;
        });
        const masterScore = attemptedChapters.length > 0
          ? Math.round(attemptedChapters.reduce((sum: number, ch: any) => sum + getChapterMasterScore(ch), 0) / attemptedChapters.length)
          : 0;

        // Categorize chapters based on master score thresholds
        const strongChapters = chapters.filter((ch: any) => getChapterMasterScore(ch) >= 80);
        const alrightChapters = chapters.filter((ch: any) => {
          const ms = getChapterMasterScore(ch);
          return ms >= 50 && ms < 80;
        });
        const needReviewChapters = chapters.filter((ch: any) => {
          const ms = getChapterMasterScore(ch);
          return ms < 50 && ms > 0;
        });

        // Circular Gauge parameters
        const mSize = 130;
        const mStroke = 8;
        const mRadius = (mSize - mStroke) / 2;
        const mCircumference = 2 * Math.PI * mRadius;
        const mOffset = mCircumference - (mCircumference * masterScore) / 100;

        return (
          <Modal
            visible={true}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setActiveOverviewSubject(null)}
          >
            <TouchableWithoutFeedback onPress={() => setActiveOverviewSubject(null)}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback>
                  <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                      <View style={styles.modalHeaderTitleRow}>
                        <Award size={18} color={subjectColor} style={{ marginRight: 6 }} />
                        <Text style={styles.modalTitle}>{subject.name} Diagnostic</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setActiveOverviewSubject(null)}
                      >
                        <X size={18} color={THEME.text} />
                      </TouchableOpacity>
                    </View>

                    {/* Content Scroll Feed */}
                    <ScrollView
                      style={styles.modalScroll}
                      contentContainerStyle={styles.modalScrollContent}
                      showsVerticalScrollIndicator={false}
                    >
                      {/* Central Circular Master Score Ring */}
                      <View style={styles.centerProgressContainer}>
                        <View style={styles.modalProgressVisualCol}>
                          <Svg width={mSize} height={mSize} style={styles.progressSvg}>
                            <Circle
                              cx={mSize / 2}
                              cy={mSize / 2}
                              r={mRadius}
                              stroke={THEME.border}
                              strokeWidth={mStroke}
                              fill="none"
                            />
                            <Circle
                              cx={mSize / 2}
                              cy={mSize / 2}
                              r={mRadius}
                              stroke={subjectColor}
                              strokeWidth={mStroke}
                              strokeDasharray={[mCircumference, mCircumference]}
                              strokeDashoffset={mOffset}
                              strokeLinecap="round"
                              fill="none"
                              rotation={-90}
                              originX={mSize / 2}
                              originY={mSize / 2}
                            />
                          </Svg>
                          <View style={styles.progressCenterContent}>
                            <Text style={[styles.modalProgressPercent, { color: subjectColor }]}>
                              {masterScore}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* 1. Strong Chapters Section (>= 80) */}
                      <View style={styles.overviewSection}>
                        <View style={styles.sectionTitleRow}>
                          <View style={[styles.indicatorDot, { backgroundColor: THEME.emerald }]} />
                          <Text style={styles.overviewSectionTitle}>Strong Chapters ({strongChapters.length})</Text>
                        </View>
                        {strongChapters.length === 0 ? (
                          <Text style={styles.emptySectionText}>No chapters in this category yet.</Text>
                        ) : (
                          strongChapters.map((ch: any, idx: number) => (
                            <View key={idx} style={styles.chapterOverviewItem}>
                              <Text style={styles.chapterItemName} numberOfLines={1}>{ch.name}</Text>
                              <Text style={[styles.chapterItemScore, { color: THEME.emerald }]}>{getChapterMasterScore(ch)}</Text>
                            </View>
                          ))
                        )}
                      </View>

                      {/* 2. Alright Chapters Section (60 to 79) */}
                      <View style={styles.overviewSection}>
                        <View style={styles.sectionTitleRow}>
                          <View style={[styles.indicatorDot, { backgroundColor: '#eab308' }]} />
                          <Text style={styles.overviewSectionTitle}>Alright Chapters ({alrightChapters.length})</Text>
                        </View>
                        {alrightChapters.length === 0 ? (
                          <Text style={styles.emptySectionText}>No chapters in this category yet.</Text>
                        ) : (
                          alrightChapters.map((ch: any, idx: number) => (
                            <View key={idx} style={styles.chapterOverviewItem}>
                              <Text style={styles.chapterItemName} numberOfLines={1}>{ch.name}</Text>
                              <Text style={[styles.chapterItemScore, { color: '#eab308' }]}>{getChapterMasterScore(ch)}</Text>
                            </View>
                          ))
                        )}
                      </View>

                      {/* 3. Need Review Section (< 60) */}
                      <View style={styles.overviewSection}>
                        <View style={styles.sectionTitleRow}>
                          <View style={[styles.indicatorDot, { backgroundColor: THEME.red }]} />
                          <Text style={styles.overviewSectionTitle}>Need Review ({needReviewChapters.length})</Text>
                        </View>
                        {needReviewChapters.length === 0 ? (
                          <Text style={styles.emptySectionText}>No chapters in this category yet.</Text>
                        ) : (
                          needReviewChapters.map((ch: any, idx: number) => (
                            <View key={idx} style={styles.chapterOverviewItem}>
                              <Text style={styles.chapterItemName} numberOfLines={1}>{ch.name}</Text>
                              <Text style={[styles.chapterItemScore, { color: THEME.red }]}>{getChapterMasterScore(ch)}</Text>
                            </View>
                          ))
                        )}
                      </View>
                    </ScrollView>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        );
      })()}
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
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 22,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  progressGlow: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardHeader: {
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  progressPercent: {
    color: THEME.text,
    fontSize: 36,
    fontWeight: '900',
    marginVertical: 2,
    fontFamily: 'Poppins-Bold',
  },
  progressRatio: {
    color: THEME.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  progressVisualCol: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressSvg: {
    transform: [{ scaleX: -1 }],
  },
  progressCenterContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 18,
  },
  countdownCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.03)',
    borderColor: 'rgba(239, 68, 68, 0.18)',
  },
  cohortCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.03)',
    borderColor: 'rgba(59, 130, 246, 0.18)',
  },
  countdownTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  tinyCardHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bigStat: {
    color: THEME.text,
    fontSize: 32,
    fontWeight: '900',
    fontFamily: 'Poppins-Bold',
  },
  mediumStat: {
    color: THEME.text,
    fontSize: 15,
    fontWeight: '800',
    marginVertical: 6,
    fontFamily: 'Poppins-Bold',
  },
  statLabel: {
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionHeaderTitle: {
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  subjectList: {
    gap: 10,
  },
  subjectRow: {
    flexDirection: 'column',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    paddingTop: 12,
  },
  subjectHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  subjectIconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.1,
  },
  subjectActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Poppins-Bold',
    flex: 1,
  },
  subjectChapterCount: {
    color: THEME.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  overviewIconBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectProgressBarBg: {
    height: 4,
    backgroundColor: '#0f172a',
    borderRadius: 2,
    overflow: 'hidden',
    flexDirection: 'row',
    width: '100%',
  },
  subjectProgressBarFill: {
    height: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    maxHeight: '80%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: THEME.border,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    color: THEME.text,
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: THEME.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  centerProgressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  modalProgressVisualCol: {
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  modalProgressPercent: {
    fontSize: 38,
    fontWeight: '900',
    fontFamily: 'Poppins-Bold',
  },
  modalProgressSubText: {
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: -2,
  },
  overviewSection: {
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  overviewSectionTitle: {
    color: THEME.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptySectionText: {
    color: THEME.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    paddingLeft: 16,
    marginTop: 2,
  },
  chapterOverviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 6,
    marginLeft: 16,
  },
  chapterItemName: {
    color: THEME.text,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    paddingRight: 10,
  },
  chapterItemScore: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'Poppins-Bold',
  },
  recentList: {
    gap: 8,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  recentIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentSubjectName: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recentChapterName: {
    color: THEME.text,
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'Poppins-Bold',
    marginTop: 1,
  },
  recentNavBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
