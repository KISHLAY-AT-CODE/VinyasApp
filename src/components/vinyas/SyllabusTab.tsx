import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  Dimensions,
  TextInput,
  StatusBar,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkle,
  ArrowLeft,
  Clock,
  RefreshCw,
  Target,
  TrendingUp,
  ExternalLink,
  BookOpen
} from 'lucide-react-native';
import {
  THEME,
  calculateChapterProgress,
  calculateChapterBreakdown,
  getChapterMasterScore,
  getChapterDifficulty,
  getEffectiveStatusInfo,
  getAccuracyTheme,
  getSubjectThemeColor
} from '../../constants/vinyas-theme';

const { width } = Dimensions.get('window');

// Default exercise templates based on the subject (from ModuleQuestionTrackerModal.jsx)
const SUBJECT_TEMPLATES: Record<string, Record<string, number>> = {
  Maths: {
    "Exercise 1": 38,
    "Exercise 2": 16,
    "Exercise 3": 30,
    "Exercise 4": 30,
    "Exercise 5": 45,
    "Exercise 6": 15
  },
  Physics: {
    "Exercise 1": 60,
    "Exercise 2": 50,
    "Exercise 3": 44,
    "Exercise 4": 46,
    "Exercise 5": 95,
    "Exercise 6": 10
  },
  Chem: {
    "Exercise 1": 45,
    "Exercise 2": 55,
    "Exercise 3": 36,
    "Exercise 4": 60,
    "Exercise 5": 55,
    "Exercise 6": 14
  }
};

const FALLBACK_TEMPLATE: Record<string, number> = {
  "Exercise 1": 30,
  "Exercise 2": 30,
  "Exercise 3": 30,
  "Exercise 4": 30,
  "Exercise 5": 30,
  "Exercise 6": 30
};

interface Book {
  name?: string;
  url?: string;
  chapters?: Record<string, string>;
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
  moduleQuestionStates?: Record<string, string>;
}

interface SyllabusTabProps {
  userSyllabus: {
    name: string;
    color: string;
    chapters: Chapter[];
    books?: Book[];
    bookUrl?: string;
  }[];
  onDetailsViewActiveChange?: (isActive: boolean) => void;
  selectedSubject?: string;
  selectedChapter?: string;
  onClearSelectedChapter?: () => void;
}

interface ChapterCardProps {
  chapter: Chapter;
  onOpenDetails: (chapter: Chapter, initialTab: 'overview' | 'dpp' | 'module' | 'assignments') => void;
  chapterBookUrl?: string | null;
  chapterBookName?: string | null;
}

// Localized Chapter Card to prevent full-list re-renders when toggling accordions
const ChapterCard = React.memo(({ chapter, onOpenDetails, chapterBookUrl, chapterBookName }: ChapterCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const progress = calculateChapterProgress(chapter);
  const statusInfo = getEffectiveStatusInfo(chapter);
  const masterScore = getChapterMasterScore(chapter);
  const difficulty = getChapterDifficulty(chapter);
  const breakdown = calculateChapterBreakdown(chapter);

  const accuracyTheme = getAccuracyTheme(breakdown.overallAcc);

  // Computations for DPP & Module correctness segment bars
  const dppComp = chapter.dpp?.comp || 0;
  const dppAcc = chapter.dpp?.acc || 0;
  const dppCorrect = dppComp * (dppAcc / 100);
  const dppIncorrect = dppComp * (1 - dppAcc / 100);
  const dppNotAttempted = 100 - dppComp;

  const moduleComp = chapter.module?.comp || 0;
  const moduleAcc = chapter.module?.acc || 0;
  const moduleCorrect = moduleComp * (moduleAcc / 100);
  const moduleIncorrect = moduleComp * (1 - moduleAcc / 100);
  const moduleNotAttempted = 100 - moduleComp;

  const hasAssignments = chapter.assignments && chapter.assignments.length > 0;
  const assComp = breakdown.overallComp;
  const assAcc = breakdown.overallAcc;
  const assCorrect = assComp * (assAcc / 100);
  const assIncorrect = assComp * (1 - assAcc / 100);
  const assNotAttempted = 100 - assComp;

  return (
    <View style={[styles.chapterCard, { borderColor: accuracyTheme.border }]}>
      <TouchableOpacity
        style={styles.chapterHeader}
        activeOpacity={0.5}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={{ flex: 1, paddingRight: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
            <Text style={[styles.chapterName, { flexShrink: 1 }]} numberOfLines={1}>{chapter.name}</Text>
            {breakdown.overallAcc >= 80 && (
              <Sparkle size={12} color={THEME.orange} fill={THEME.orange} />
            )}
            {chapterBookUrl ? (
              <TouchableOpacity
                onPress={() => Linking.openURL(chapterBookUrl)}
                style={{ padding: 4 }}
                activeOpacity={0.6}
              >
                <BookOpen size={14} color={THEME.blue} />
              </TouchableOpacity>
            ) : null}
          </View>
          
          <View style={styles.chapterMetaRow}>
            <Text style={styles.chapterProgressPercent}>
              Progress: {progress}%
            </Text>
            
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.style.bg, borderColor: statusInfo.style.border }]}>
              <Text style={[styles.statusBadgeText, { color: statusInfo.style.text }]}>
                {statusInfo.text}
              </Text>
            </View>
            
            {masterScore > 0 ? (
              <Text style={styles.masterScoreText}>
                MS: {masterScore}
              </Text>
            ) : null}
            
            {difficulty && (
              <View style={[
                styles.difficultyBadge,
                {
                  backgroundColor: difficulty === 'hard' ? 'rgba(239, 68, 68, 0.15)'
                    : difficulty === 'medium' ? 'rgba(234, 179, 8, 0.15)'
                    : 'rgba(16, 185, 129, 0.15)',
                  borderColor: difficulty === 'hard' ? 'rgba(239, 68, 68, 0.3)'
                    : difficulty === 'medium' ? 'rgba(234, 179, 8, 0.3)'
                    : 'rgba(16, 185, 129, 0.3)'
                }
              ]}>
                <Text style={[
                  styles.difficultyBadgeText,
                  {
                    color: difficulty === 'hard' ? THEME.red
                      : difficulty === 'medium' ? '#eab308'
                      : THEME.emerald
                  }
                ]}>
                  {difficulty.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.chapterHeaderRight}>
          {isExpanded ? <ChevronUp size={18} color={THEME.textMuted} /> : <ChevronDown size={18} color={THEME.textMuted} />}
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.chapterDetails}>
          
          {/* DPP & Module Progress Row (Clickable blocks) */}
          <View style={styles.sectionsProgressRow}>
            <TouchableOpacity
              style={styles.sectionProgressBlock}
              activeOpacity={0.7}
              onPress={() => onOpenDetails(chapter, 'dpp')}
            >
              <Text style={styles.sectionProgressTitle}>DPP Metrics</Text>
              <Text style={styles.sectionProgressText}>
                Comp: {dppComp}%  |  Acc: {dppAcc}%
              </Text>
              {/* Stacked Correctness progress representation */}
              <View style={styles.stackedBarMini}>
                {dppCorrect > 0 && <View style={[styles.stackedSegment, { flex: dppCorrect, backgroundColor: THEME.emerald }]} />}
                {dppIncorrect > 0 && <View style={[styles.stackedSegment, { flex: dppIncorrect, backgroundColor: THEME.red }]} />}
                {dppNotAttempted > 0 && <View style={[styles.stackedSegment, { flex: dppNotAttempted, backgroundColor: '#334155' }]} />}
              </View>
              <Text style={styles.viewDetailsText}>Tap for details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sectionProgressBlock}
              activeOpacity={0.7}
              onPress={() => onOpenDetails(chapter, 'module')}
            >
              <Text style={styles.sectionProgressTitle}>Module Metrics</Text>
              <Text style={styles.sectionProgressText}>
                Comp: {moduleComp}%  |  Acc: {moduleAcc}%
              </Text>
              {/* Stacked Correctness progress representation */}
              <View style={styles.stackedBarMini}>
                {moduleCorrect > 0 && <View style={[styles.stackedSegment, { flex: moduleCorrect, backgroundColor: THEME.emerald }]} />}
                {moduleIncorrect > 0 && <View style={[styles.stackedSegment, { flex: moduleIncorrect, backgroundColor: THEME.red }]} />}
                {moduleNotAttempted > 0 && <View style={[styles.stackedSegment, { flex: moduleNotAttempted, backgroundColor: '#334155' }]} />}
              </View>
              <Text style={styles.viewDetailsText}>Tap for details</Text>
            </TouchableOpacity>
          </View>

          {/* Assignments Metrics Block (Clickable) */}
          {hasAssignments && (
            <TouchableOpacity
              style={styles.assignmentsBlockLink}
              activeOpacity={0.7}
              onPress={() => onOpenDetails(chapter, 'assignments')}
            >
              <View style={styles.breakdownHeader}>
                <Text style={styles.sectionProgressTitle}>Assignment Metrics</Text>
                <Text style={styles.sectionProgressText}>
                  Comp: {Math.round(breakdown.overallComp)}% | Acc: {Math.round(breakdown.overallAcc)}%
                </Text>
              </View>
              {/* Stacked Correctness progress representation */}
              <View style={[styles.stackedBarMini, { marginTop: 6 }]}>
                {assCorrect > 0 && <View style={[styles.stackedSegment, { flex: assCorrect, backgroundColor: THEME.emerald }]} />}
                {assIncorrect > 0 && <View style={[styles.stackedSegment, { flex: assIncorrect, backgroundColor: THEME.red }]} />}
                {assNotAttempted > 0 && <View style={[styles.stackedSegment, { flex: assNotAttempted, backgroundColor: '#334155' }]} />}
              </View>
              <Text style={styles.viewDetailsTextCenter}>Tap for assignments list</Text>
            </TouchableOpacity>
          )}

          {/* Master Score & Progress Breakdown Bar (Clickable) */}
          <TouchableOpacity
            style={styles.breakdownContainer}
            activeOpacity={0.7}
            onPress={() => onOpenDetails(chapter, 'overview')}
          >
            <View style={styles.breakdownHeader}>
              <Text style={styles.breakdownTitle}>Master Score & Overall Progress</Text>
              <Text style={styles.breakdownMetrics}>
                MS: {masterScore} | Comp: {breakdown.overallComp}%
              </Text>
            </View>
            
            {/* Stacked Progress Bar representation for Master Score */}
            <View style={styles.stackedBar}>
              {breakdown.correct > 0 ? (
                <View style={[styles.stackedSegment, { flex: breakdown.correct, backgroundColor: THEME.emerald }]} />
              ) : null}
              {breakdown.incorrect > 0 ? (
                <View style={[styles.stackedSegment, { flex: breakdown.incorrect, backgroundColor: THEME.red }]} />
              ) : null}
              {breakdown.notAttempted > 0 ? (
                <View style={[styles.stackedSegment, { flex: breakdown.notAttempted, backgroundColor: '#334155' }]} />
              ) : null}
            </View>
            
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: THEME.emerald }]} />
                <Text style={styles.legendLabel}>Correct ({breakdown.correct}%)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: THEME.red }]} />
                <Text style={styles.legendLabel}>Incorrect ({breakdown.incorrect}%)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#334155' }]} />
                <Text style={styles.legendLabel}>Unattempted ({breakdown.notAttempted}%)</Text>
              </View>
            </View>
            <Text style={styles.viewDetailsTextCenter}>Tap to open overview & study logs</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Segment accent bar at the very bottom edge */}
      <View style={styles.chapterBottomBar}>
        {breakdown.correct > 0 ? (
          <View style={[styles.bottomSegment, { flex: breakdown.correct, backgroundColor: THEME.emerald }]} />
        ) : null}
        {breakdown.incorrect > 0 ? (
          <View style={[styles.bottomSegment, { flex: breakdown.incorrect, backgroundColor: THEME.red }]} />
        ) : null}
        {breakdown.notAttempted > 0 ? (
          <View style={[styles.bottomSegment, { flex: breakdown.notAttempted, backgroundColor: '#334155' }]} />
        ) : null}
      </View>
    </View>
  );
});
ChapterCard.displayName = 'ChapterCard';

export default function SyllabusTab({
  userSyllabus,
  onDetailsViewActiveChange,
  selectedSubject: selectedSubjectProp,
  selectedChapter: selectedChapterProp,
  onClearSelectedChapter
}: SyllabusTabProps) {
  const subjects = userSyllabus.length > 0 ? userSyllabus.map(s => s.name) : ['Physics', 'Chemistry', 'Mathematics'];
  const [selectedSubject, setSelectedSubject] = useState<string>(() => {
    return selectedSubjectProp || (userSyllabus.length > 0 ? userSyllabus[0].name : 'Physics');
  });

  useEffect(() => {
    if (selectedSubjectProp) {
      setSelectedSubject(selectedSubjectProp);
    }
  }, [selectedSubjectProp]);
  const [syllabusSearch, setSyllabusSearch] = useState('');
  const [sortBy, setSortBy] = useState<'alphabetical' | 'ms_asc' | 'ms_desc'>('ms_desc');

  // Swipeable Activity Page state
  const [detailsChapter, setDetailsChapter] = useState<Chapter | null>(null);
  const [detailsActiveTab, setDetailsActiveTab] = useState<'overview' | 'dpp' | 'module' | 'assignments'>('overview');

  // Read-only tracker sub-states
  const [selectedModuleExercise, setSelectedModuleExercise] = useState<string | null>(null);
  const [expandedAssignmentIdx, setExpandedAssignmentIdx] = useState<number | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  const [activeBookUrls, setActiveBookUrls] = useState<Record<string, string>>({});
  const [showBookSelector, setShowBookSelector] = useState(false);

  useEffect(() => {
    async function loadActiveBooks() {
      try {
        const stored = await AsyncStorage.getItem('vinyas_active_books');
        if (stored) {
          setActiveBookUrls(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to load active books', e);
      }
    }
    loadActiveBooks();
  }, []);

  const updateActiveBook = async (subjectName: string, bookUrl: string) => {
    const newUrls = { ...activeBookUrls, [subjectName]: bookUrl };
    setActiveBookUrls(newUrls);
    try {
      await AsyncStorage.setItem('vinyas_active_books', JSON.stringify(newUrls));
    } catch (e) {
      console.error('Failed to save active book', e);
    }
  };

  useEffect(() => {
    onDetailsViewActiveChange?.(!!detailsChapter);
  }, [detailsChapter, onDetailsViewActiveChange]);

  const subjectDoc = userSyllabus.find((s) => s.name === selectedSubject);
  const activeSubjectIdx = subjects.indexOf(selectedSubject);
  const activeSubjectColor = subjectDoc ? getSubjectThemeColor(subjectDoc.color, selectedSubject) : THEME.orange;

  const subjectBooks = subjectDoc?.books || [];
  const currentActiveBookUrl = activeBookUrls[selectedSubject] || (subjectBooks.length > 0 ? subjectBooks[0].url : subjectDoc?.bookUrl || '');

  const getChapterBookUrl = (chName: string) => {
    if (currentActiveBookUrl && subjectBooks.length > 0) {
      const activeBook = subjectBooks.find(b => b.url === currentActiveBookUrl);
      if (activeBook && activeBook.chapters && activeBook.chapters[chName]) {
        return { url: activeBook.chapters[chName], bookName: activeBook.name };
      }
    }
    if (subjectBooks.length > 0) {
      for (const book of subjectBooks) {
        if (book.chapters && book.chapters[chName]) {
          return { url: book.chapters[chName], bookName: book.name };
        }
      }
    }
    return null;
  };

  const doneCount = (subjectDoc?.chapters || []).filter(ch => {
    const eff = getEffectiveStatusInfo(ch);
    return eff.text === 'Done';
  }).length;

  const totalChapters = subjectDoc?.chapters?.length || 0;

  // Filter
  let filteredChapters = (subjectDoc?.chapters || []).filter((ch) =>
    ch.name.toLowerCase().includes(syllabusSearch.toLowerCase())
  );

  // Sort
  if (sortBy === 'alphabetical') {
    filteredChapters = [...filteredChapters].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else if (sortBy === 'ms_asc') {
    filteredChapters = [...filteredChapters].sort((a, b) => getChapterMasterScore(a) - getChapterMasterScore(b));
  } else if (sortBy === 'ms_desc') {
    filteredChapters = [...filteredChapters].sort((a, b) => getChapterMasterScore(b) - getChapterMasterScore(a));
  }

  const sortOptions = [
    { value: 'ms_desc', label: 'MS Desc' },
    { value: 'ms_asc', label: 'MS Asc' },
    { value: 'alphabetical', label: 'A-Z' }
  ] as const;

  const cycleSort = () => {
    const nextIdx = (sortOptions.findIndex(o => o.value === sortBy) + 1) % sortOptions.length;
    setSortBy(sortOptions[nextIdx].value);
  };

  const handleOpenDetails = (chapter: Chapter, initialTab: 'overview' | 'dpp' | 'module' | 'assignments') => {
    setDetailsChapter(chapter);
    setDetailsActiveTab(initialTab);
    setSelectedModuleExercise(null);
    setExpandedAssignmentIdx(null);
    setTimeout(() => {
      const tabs = ['overview', 'dpp', 'module', 'assignments'] as const;
      const index = tabs.indexOf(initialTab);
      scrollViewRef.current?.scrollTo({ x: index * width, animated: false });
    }, 50);
  };

  useEffect(() => {
    if (selectedChapterProp && subjectDoc?.chapters) {
      const match = subjectDoc.chapters.find(
        (c: any) => c.name.toLowerCase().trim() === selectedChapterProp.toLowerCase().trim()
      );
      if (match) {
        handleOpenDetails(match, 'overview');
      }
      onClearSelectedChapter?.();
    }
  }, [selectedChapterProp, selectedSubject, subjectDoc]);

  const handleScroll = (event: any) => {
    const xOffset = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(xOffset / width);
    const tabs = ['overview', 'dpp', 'module', 'assignments'] as const;
    if (pageIndex >= 0 && pageIndex < 4) {
      setDetailsActiveTab(tabs[pageIndex]);
    }
  };

  const scrollToTab = (tab: 'overview' | 'dpp' | 'module' | 'assignments') => {
    const tabs = ['overview', 'dpp', 'module', 'assignments'] as const;
    const index = tabs.indexOf(tab);
    setDetailsActiveTab(tab);
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
  };

  const normalizeSub = (sub: string) => {
    const s = (sub || '').toLowerCase().trim();
    if (s.includes('math')) return 'Maths';
    if (s.includes('phys')) return 'Physics';
    if (s.includes('chem')) return 'Chem';
    return sub || '';
  };

  // If in horizontal swipe details view, hijack rendering and show full details
  if (detailsChapter) {
    const chapter = detailsChapter;
    const breakdown = calculateChapterBreakdown(chapter);
    const masterScore = getChapterMasterScore(chapter);
    const accuracyTheme = getAccuracyTheme(masterScore);
    const hasAssignments = chapter.assignments && chapter.assignments.length > 0;
    const bookInfo = getChapterBookUrl(chapter.name);
    const chapterBookUrl = bookInfo ? bookInfo.url : null;

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

    const dppComp = chapter.dpp?.comp || 0;
    const dppAcc = chapter.dpp?.acc || 0;
    const dppCorrect = dppComp * (dppAcc / 100);
    const dppIncorrect = dppComp * (1 - dppAcc / 100);
    const dppNotAttempted = 100 - dppComp;

    const moduleComp = chapter.module?.comp || 0;
    const moduleAcc = chapter.module?.acc || 0;
    const moduleCorrect = moduleComp * (moduleAcc / 100);
    const moduleIncorrect = moduleComp * (1 - moduleAcc / 100);
    const moduleNotAttempted = 100 - moduleComp;

    const assComp = breakdown.overallComp;
    const assAcc = breakdown.overallAcc;
    const assCorrect = assComp * (assAcc / 100);
    const assIncorrect = assComp * (1 - assAcc / 100);
    const assNotAttempted = 100 - assComp;

    // Inside Module Tab page, render the select exercise tracker grid
    const renderModuleGridTracker = () => {
      const normSub = normalizeSub(selectedSubject);
      const exercises = SUBJECT_TEMPLATES[normSub] || FALLBACK_TEMPLATE;
      const moduleStates = chapter.moduleQuestionStates || {};
      const subjectDoc = userSyllabus.find(s => s.name === selectedSubject);
      const chapterIndex = subjectDoc?.chapters?.findIndex(c => c.name === chapter.name) ?? -1;
      const cName = chapter.name.toLowerCase();
      const isChapter1 = chapterIndex === 0 ||
        (normSub === 'Maths' && cName.includes('sets')) ||
        (normSub === 'Physics' && cName.includes('units')) ||
        (normSub === 'Chem' && (cName.includes('mole') || cName.includes('basic concepts')));

      if (selectedModuleExercise) {
        const qCount = exercises[selectedModuleExercise] || 30;
        const questionNumbers = Array.from({ length: qCount }, (_, i) => i + 1);

        return (
          <View style={styles.trackerContainer}>
            <View style={styles.trackerHeaderRow}>
              <TouchableOpacity
                style={styles.trackerBackBtn}
                onPress={() => setSelectedModuleExercise(null)}
                activeOpacity={0.7}
              >
                <ArrowLeft size={12} color="#ffffff" />
                <Text style={styles.trackerBackBtnText}>Exercises</Text>
              </TouchableOpacity>
              <Text style={styles.trackerExerciseTitle}>{selectedModuleExercise} ({qCount} Qs)</Text>
            </View>

            <View style={styles.gridQuestions}>
              {questionNumbers.map((q) => {
                const key = isChapter1 ? `${normSub}-${selectedModuleExercise}-${q}` : `${normSub}-${chapter.name}-${selectedModuleExercise}-${q}`;
                const state = moduleStates[key];
                let circleBg = '#334155'; // default grey
                if (state === 'completed') circleBg = THEME.emerald;
                else if (state === 'difficult') circleBg = THEME.red;
                else if (state === 'later') circleBg = THEME.orange;

                return (
                  <View
                    key={q}
                    style={[styles.questionCircle, { backgroundColor: circleBg }]}
                  >
                    <Text style={styles.questionCircleText}>{q}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        );
      }

      return (
        <View style={styles.trackerContainer}>
          <Text style={styles.trackerSubTitle}>Select Exercise to view Question status:</Text>
          {Object.entries(exercises).map(([exName, qCount]) => {
            // Count completed
            let completed = 0;
            for (let q = 1; q <= qCount; q++) {
              const key = isChapter1 ? `${normSub}-${exName}-${q}` : `${normSub}-${chapter.name}-${exName}-${q}`;
              if (moduleStates[key] === 'completed') completed++;
            }

            return (
              <TouchableOpacity
                key={exName}
                style={styles.exerciseListItem}
                activeOpacity={0.7}
                onPress={() => setSelectedModuleExercise(exName)}
              >
                <View>
                  <Text style={styles.exerciseNameText}>{exName}</Text>
                  <Text style={styles.exerciseDetailsText}>{qCount} Questions</Text>
                </View>
                <View style={styles.exerciseProgressBadge}>
                  <Text style={styles.exerciseProgressBadgeText}>
                    {completed} / {qCount} Solved
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    };

    return (
      <View style={styles.fullScreenOverlay}>
        {/* Header with Back button */}
        <View style={styles.detailsHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                setDetailsChapter(null);
                setSelectedModuleExercise(null);
                setExpandedAssignmentIdx(null);
              }}
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color="#ffffff" />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.detailsHeaderTitle} numberOfLines={1}>{chapter.name}</Text>
          </View>
          {chapterBookUrl ? (
            <TouchableOpacity
              onPress={() => Linking.openURL(chapterBookUrl)}
              style={styles.detailsBookBtn as any}
              activeOpacity={0.7}
            >
              <BookOpen size={18} color={THEME.orange} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Tab row */}
        <View style={styles.detailsTabsContainer}>
          {(['overview', 'dpp', 'module', 'assignments'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.7}
              style={[
                styles.detailsTabItem,
                detailsActiveTab === tab && styles.detailsTabItemActive
              ]}
              onPress={() => scrollToTab(tab)}
            >
              <Text
                style={[
                  styles.detailsTabLabel,
                  detailsActiveTab === tab && styles.detailsTabLabelActive
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Paged Horizontal Swipe container */}
        <ScrollView
          ref={scrollViewRef}
          horizontal={true}
          pagingEnabled={true}
          onMomentumScrollEnd={handleScroll}
          showsHorizontalScrollIndicator={false}
          style={styles.detailsPager}
        >
          {/* Page 1: Overview */}
          <ScrollView style={{ width: width, paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
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
              <Text style={styles.detailsBreakdownTitle}>Component Breakdown</Text>
              
              {/* DPP Progress */}
              <View style={styles.breakdownItem}>
                <View style={styles.breakdownItemHeader}>
                  <Text style={styles.breakdownItemLabel}>Daily Practice Problems (DPP)</Text>
                  <Text style={styles.weightLabel}>Weight: 30%</Text>
                </View>
                <View style={styles.progressRow}>
                  <View style={styles.miniTrack}>
                    {dppCorrect > 0 && <View style={[styles.miniFill, { flex: dppCorrect, backgroundColor: THEME.emerald }]} />}
                    {dppIncorrect > 0 && <View style={[styles.miniFill, { flex: dppIncorrect, backgroundColor: THEME.red }]} />}
                    {dppNotAttempted > 0 && <View style={[styles.miniFill, { flex: dppNotAttempted, backgroundColor: '#334155' }]} />}
                  </View>
                  <View style={styles.statsTextCol}>
                    <Text style={styles.statsCompText}>Comp: {chapter.dpp?.comp || 0}%</Text>
                    <Text style={styles.statsAccText}>Acc: {chapter.dpp?.acc || 0}%</Text>
                  </View>
                </View>
              </View>

              {/* Module Progress */}
              <View style={styles.breakdownItemBordered}>
                <View style={styles.breakdownItemHeader}>
                  <Text style={styles.breakdownItemLabel}>Interactive Module</Text>
                  <Text style={styles.weightLabel}>Weight: 40%</Text>
                </View>
                <View style={styles.progressRow}>
                  <View style={styles.miniTrack}>
                    {moduleCorrect > 0 && <View style={[styles.miniFill, { flex: moduleCorrect, backgroundColor: THEME.emerald }]} />}
                    {moduleIncorrect > 0 && <View style={[styles.miniFill, { flex: moduleIncorrect, backgroundColor: THEME.red }]} />}
                    {moduleNotAttempted > 0 && <View style={[styles.miniFill, { flex: moduleNotAttempted, backgroundColor: '#334155' }]} />}
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
                  <View style={styles.breakdownItemHeader}>
                    <Text style={styles.breakdownItemLabel}>Assignments</Text>
                    <Text style={styles.weightLabel}>Weight: 30%</Text>
                  </View>
                  <View style={styles.progressRow}>
                    <View style={styles.miniTrack}>
                      {assCorrect > 0 && <View style={[styles.miniFill, { flex: assCorrect, backgroundColor: THEME.emerald }]} />}
                      {assIncorrect > 0 && <View style={[styles.miniFill, { flex: assIncorrect, backgroundColor: THEME.red }]} />}
                      {assNotAttempted > 0 && <View style={[styles.miniFill, { flex: assNotAttempted, backgroundColor: '#334155' }]} />}
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
                  <Text style={styles.statsBlockTitle}>Revision Cycles</Text>
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
          </ScrollView>

          {/* Page 2: DPP stats */}
          <ScrollView style={{ width: width, paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalSectionTitle}>Daily Practice Problems Coverage</Text>
            <View style={styles.statsRow}>
              <View style={styles.statsBlock}>
                <View style={styles.statsBlockHeader}>
                  <TrendingUp size={12} color={THEME.orange} />
                  <Text style={styles.statsBlockTitle}>Completion</Text>
                </View>
                <Text style={styles.statsBlockValue}>{dppComp}%</Text>
                <View style={styles.statProgressBarBg}>
                  <View style={[styles.statProgressBarFill, { width: `${dppComp}%`, backgroundColor: THEME.orange }]} />
                </View>
              </View>

              <View style={styles.statsBlock}>
                <View style={styles.statsBlockHeader}>
                  <Target size={12} color={THEME.blue} />
                  <Text style={styles.statsBlockTitle}>Accuracy</Text>
                </View>
                <Text style={styles.statsBlockValue}>{dppAcc}%</Text>
                <View style={styles.statProgressBarBg}>
                  <View style={[styles.statProgressBarFill, { width: `${dppAcc}%`, backgroundColor: THEME.blue }]} />
                </View>
              </View>
            </View>

            {/* Custom DPP Segment correctness display bar */}
            <View style={styles.breakdownCard}>
              <Text style={styles.detailsBreakdownTitle}>DPP Question Accuracy Breakdown</Text>
              <View style={styles.progressRow}>
                <View style={styles.miniTrack}>
                  {dppCorrect > 0 && <View style={[styles.miniFill, { flex: dppCorrect, backgroundColor: THEME.emerald }]} />}
                  {dppIncorrect > 0 && <View style={[styles.miniFill, { flex: dppIncorrect, backgroundColor: THEME.red }]} />}
                  {dppNotAttempted > 0 && <View style={[styles.miniFill, { flex: dppNotAttempted, backgroundColor: '#334155' }]} />}
                </View>
                <View style={styles.statsTextCol}>
                  <Text style={styles.statsCompText}>Correct: {Math.round(dppCorrect)}%</Text>
                  <Text style={styles.statsAccText}>Incorrect: {Math.round(dppIncorrect)}%</Text>
                </View>
              </View>
            </View>

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
          </ScrollView>

          {/* Page 3: Module stats */}
          <ScrollView style={{ width: width, paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalSectionTitle}>Interactive Module Coverage</Text>
            <View style={styles.statsRow}>
              <View style={styles.statsBlock}>
                <View style={styles.statsBlockHeader}>
                  <TrendingUp size={12} color={THEME.orange} />
                  <Text style={styles.statsBlockTitle}>Completion</Text>
                </View>
                <Text style={styles.statsBlockValue}>{moduleComp}%</Text>
                <View style={styles.statProgressBarBg}>
                  <View style={[styles.statProgressBarFill, { width: `${moduleComp}%`, backgroundColor: THEME.orange }]} />
                </View>
              </View>

              <View style={styles.statsBlock}>
                <View style={styles.statsBlockHeader}>
                  <Target size={12} color={THEME.blue} />
                  <Text style={styles.statsBlockTitle}>Accuracy</Text>
                </View>
                <Text style={styles.statsBlockValue}>{moduleAcc}%</Text>
                <View style={styles.statProgressBarBg}>
                  <View style={[styles.statProgressBarFill, { width: `${moduleAcc}%`, backgroundColor: THEME.blue }]} />
                </View>
              </View>
            </View>

            {/* Interactive Module Question Grid Tracker */}
            <Text style={styles.modalSectionTitle}>Interactive Module Tracker</Text>
            {renderModuleGridTracker()}

            {(chapter.nextReview || chapter.lastReviewRating) && (
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
          </ScrollView>

          {/* Page 4: Assignments List */}
          <ScrollView style={{ width: width, paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
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

                    {/* Interactive Assignment Question Grid Tracker */}
                    {ass.questionCount && ass.questionCount > 0 ? (
                      <View style={styles.assTrackerWrapper}>
                        <TouchableOpacity
                          style={styles.assTrackerToggleHeader}
                          activeOpacity={0.7}
                          onPress={() => setExpandedAssignmentIdx(expandedAssignmentIdx === aIdx ? null : aIdx)}
                        >
                          <Text style={styles.assTrackerToggleTitle}>
                            {expandedAssignmentIdx === aIdx ? 'Hide Question Grid' : 'Show Question Grid'}
                          </Text>
                          {expandedAssignmentIdx === aIdx ? <ChevronUp size={12} color={THEME.blue} /> : <ChevronDown size={12} color={THEME.blue} />}
                        </TouchableOpacity>

                        {expandedAssignmentIdx === aIdx && (
                          <View style={styles.assGridQuestions}>
                            {Array.from({ length: ass.questionCount }).map((_, idx) => {
                              const q = idx + 1;
                              const state = ass.questionStates?.[String(q)] || ass.questionStates?.[q];
                              let circleBg = '#334155'; // default grey
                              if (state === 'completed' || state === 'correct' || state === 'correct_blunder') circleBg = THEME.emerald;
                              else if (state === 'difficult' || state === 'incorrect') circleBg = THEME.red;
                              else if (state === 'later') circleBg = THEME.orange;

                              return (
                                <View
                                  key={q}
                                  style={[styles.assQuestionCircle, { backgroundColor: circleBg }]}
                                >
                                  <Text style={styles.questionCircleText}>{q}</Text>
                                </View>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    ) : null}
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>No manual or synced sheets mapped to this chapter.</Text>
            )}
          </ScrollView>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.tabContainer}>
      {/* Subject Carousel Header */}
      <View style={styles.subjectCarouselContainer}>
        <TouchableOpacity
          disabled={activeSubjectIdx === 0}
          onPress={() => setSelectedSubject(subjects[activeSubjectIdx - 1])}
          style={[styles.carouselCaret, activeSubjectIdx === 0 && styles.carouselCaretDisabled]}
        >
          <ChevronLeft size={20} color={activeSubjectIdx === 0 ? '#475569' : activeSubjectColor} />
        </TouchableOpacity>

        <View style={styles.carouselSubjectNameContainer}>
          <Text style={[styles.carouselSubjectName, { color: activeSubjectColor }]}>{selectedSubject}</Text>
        </View>

        <TouchableOpacity
          disabled={activeSubjectIdx === subjects.length - 1}
          onPress={() => setSelectedSubject(subjects[activeSubjectIdx + 1])}
          style={[styles.carouselCaret, activeSubjectIdx === subjects.length - 1 && styles.carouselCaretDisabled]}
        >
          <ChevronRight size={20} color={activeSubjectIdx === subjects.length - 1 ? '#475569' : activeSubjectColor} />
        </TouchableOpacity>
      </View>

      {/* Done Count Badge & Sorting Button action row */}
      <View style={styles.actionRow}>
        <View style={styles.doneBadge}>
          <Text style={styles.doneBadgeText}>
            {doneCount} / {totalChapters} DONE
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
          {subjectBooks.length > 1 && (
            <TouchableOpacity
              style={styles.bookPill}
              activeOpacity={0.7}
              onPress={() => setShowBookSelector(true)}
            >
              <BookOpen size={12} color={THEME.orange} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.sortPill}
            activeOpacity={0.7}
            onPress={cycleSort}
          >
            <Text style={styles.actionLabel} numberOfLines={1}>
              Sort: {sortOptions.find(o => o.value === sortBy)?.label}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Search size={16} color={THEME.textMuted} style={styles.searchIcon} />
        <TextInput
          placeholder="Search chapters..."
          placeholderTextColor={THEME.textMuted}
          style={styles.searchInput}
          value={syllabusSearch}
          onChangeText={setSyllabusSearch}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      {/* Chapters list */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredChapters.length > 0 ? (
          filteredChapters.map((ch, idx) => {
            const bookInfo = getChapterBookUrl(ch.name);
            return (
              <ChapterCard
                key={idx}
                chapter={ch}
                onOpenDetails={handleOpenDetails}
                chapterBookUrl={bookInfo?.url}
                chapterBookName={bookInfo?.bookName}
              />
            );
          })
        ) : (
          <Text style={styles.emptyText}>No chapters match search filters.</Text>
        )}
      </ScrollView>

      {/* Book Selector Modal */}
      {subjectBooks.length > 1 && (
        <Modal
          visible={showBookSelector}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowBookSelector(false)}
        >
          <View style={styles.modalBackdrop as any}>
            <TouchableOpacity 
              style={StyleSheet.absoluteFill} 
              activeOpacity={1} 
              onPress={() => setShowBookSelector(false)} 
            />
            <View style={styles.bottomSheetContainer as any}>
              <View style={styles.bottomSheetHeader as any}>
                <Text style={styles.bottomSheetTitle as any}>Select Book Module</Text>
                <TouchableOpacity 
                  onPress={() => setShowBookSelector(false)}
                  style={styles.bottomSheetCloseBtn as any}
                >
                  <Text style={styles.bottomSheetCloseText as any}>Close</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.bottomSheetList as any}>
                {subjectBooks.map((book) => {
                  const isActive = book.url === currentActiveBookUrl;
                  return (
                    <TouchableOpacity
                      key={book.url}
                      style={[
                        styles.bookOptionItem as any,
                        isActive && styles.bookOptionItemActive as any
                      ]}
                      onPress={() => {
                        if (book.url) {
                          updateActiveBook(selectedSubject, book.url);
                        }
                        setShowBookSelector(false);
                      }}
                    >
                      <BookOpen 
                        size={16} 
                        color={isActive ? THEME.orange : THEME.textMuted} 
                        style={{ marginRight: 10 }}
                      />
                      <Text 
                        style={[
                          styles.bookOptionText as any,
                          isActive && styles.bookOptionTextActive as any
                        ]}
                        numberOfLines={1}
                      >
                        {book.name || 'Unnamed Book'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles: any = StyleSheet.create({
  tabContainer: {
    flex: 1,
    paddingTop: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    height: '100%',
    padding: 0,
  },
  chapterCard: {
    backgroundColor: THEME.card,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  chapterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  chapterName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  chapterMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  chapterProgressPercent: {
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  masterScoreText: {
    color: THEME.emerald,
    fontSize: 10,
    fontWeight: 'bold',
  },
  difficultyBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  difficultyBadgeText: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  chapterHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chapterDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderColor: THEME.border,
    paddingTop: 12,
  },
  sectionsProgressRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  sectionProgressBlock: {
    flex: 1,
    backgroundColor: '#020617',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 10,
  },
  sectionProgressTitle: {
    color: THEME.textMuted,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionProgressText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  stackedBarMini: {
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    flexDirection: 'row',
    overflow: 'hidden',
    marginTop: 6,
  },
  viewDetailsText: {
    color: THEME.blue,
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 6,
    textAlign: 'right',
  },
  viewDetailsTextCenter: {
    color: THEME.blue,
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 6,
    textAlign: 'center',
  },
  assignmentsBlockLink: {
    backgroundColor: '#020617',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 10,
    marginBottom: 10,
  },
  breakdownContainer: {
    backgroundColor: '#020617',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 12,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  breakdownMetrics: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  stackedBar: {
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  stackedSegment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColor: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendLabel: {
    color: THEME.textMuted,
    fontSize: 8,
    fontWeight: '600',
  },
  subjectCarouselContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 6,
    marginBottom: 12,
  },
  carouselCaret: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: THEME.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselCaretDisabled: {
    opacity: 0.3,
  },
  carouselSubjectNameContainer: {
    flex: 1,
    alignItems: 'center',
  },
  carouselSubjectName: {
    color: THEME.orange,
    fontSize: 15,
    fontWeight: '900',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  sortPill: {
    backgroundColor: THEME.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  doneBadge: {
    backgroundColor: THEME.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  doneBadgeText: {
    color: THEME.emerald,
    fontSize: 11,
    fontWeight: '900',
  },
  chapterBottomBar: {
    height: 3.5,
    flexDirection: 'row',
    overflow: 'hidden',
    borderTopWidth: 1,
    borderColor: 'rgba(2, 6, 23, 0.5)',
    width: '100%',
  },
  bottomSegment: {
    height: '100%',
  },
  emptyText: {
    color: THEME.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },

  // Swipeable Details overlay styles
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: THEME.bg,
    paddingTop: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 36),
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: THEME.border,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 16,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailsHeaderTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    flex: 1,
  },
  detailsTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    padding: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  detailsTabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  detailsTabItemActive: {
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  detailsTabLabel: {
    color: THEME.textMuted,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsTabLabelActive: {
    color: '#ffffff',
  },
  detailsPager: {
    flex: 1,
  },
  modalSectionTitle: {
    color: THEME.orange,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginVertical: 12,
  },
  gaugeCard: {
    backgroundColor: THEME.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 4,
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
    color: THEME.textMuted,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  detailsBreakdownTitle: {
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
  breakdownItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  breakdownItemLabel: {
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
    minWidth: 80,
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

  // Interactive Trackers custom styling
  trackerContainer: {
    marginTop: 10,
    marginBottom: 16,
  },
  trackerSubTitle: {
    color: THEME.textMuted,
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  exerciseListItem: {
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseNameText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  exerciseDetailsText: {
    color: THEME.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  exerciseProgressBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  exerciseProgressBadgeText: {
    color: THEME.emerald,
    fontSize: 9,
    fontWeight: 'bold',
  },
  trackerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  trackerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trackerBackBtnText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  trackerExerciseTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
  },
  gridQuestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
  },
  questionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionCircleText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  assTrackerWrapper: {
    marginTop: 8,
    borderTopWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.15)',
    paddingTop: 8,
  },
  assTrackerToggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  assTrackerToggleTitle: {
    color: THEME.blue,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  assGridQuestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    paddingVertical: 4,
  },
  assQuestionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookPill: {
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsBookBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    backgroundColor: THEME.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: THEME.border,
    maxHeight: '50%',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bottomSheetTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  bottomSheetCloseBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  bottomSheetCloseText: {
    color: THEME.textMuted,
    fontSize: 11,
    fontWeight: 'bold',
  },
  bottomSheetList: {
    marginBottom: 10,
  },
  bookOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  bookOptionItemActive: {
    borderColor: THEME.orange,
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
  },
  bookOptionText: {
    color: THEME.textMuted,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  bookOptionTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
