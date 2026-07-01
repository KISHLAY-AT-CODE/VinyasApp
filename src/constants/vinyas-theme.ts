import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const THEME = {
  bg: '#020617',         // Slate 950
  card: '#0f172a',       // Slate 900
  border: '#1e293b',     // Slate 800
  borderLight: '#334155',// Slate 700
  text: '#f8fafc',       // Slate 50
  textMuted: '#94a3b8',  // Slate 400
  orange: '#f97316',     // Orange 500
  red: '#ef4444',        // Red 500
  emerald: '#10b981',    // Emerald 500
  blue: '#3b82f6',       // Blue 500
  purple: '#a855f7',     // Purple 500
  glow: 'rgba(249, 115, 22, 0.15)',
};

// API Connection Config
// To switch to local testing mode, replace 'production' with your host machine's IP (e.g. '192.xx.xx.xx')
const DEV_ENV: 'production' | string = 'production';

export const API_URL = DEV_ENV === 'production'
  ? 'https://vinyas-one.vercel.app/api'
  : `http://${DEV_ENV}:3000/api`;

export const TRANSLATIONS = {
  en: {
    welcome: "Welcome to Vinyas",
    welcomeDesc: "Enter your Sync ID from Vinyas Web App by clicking on the Android icon or scanning the QR from the same.",
    placeholderSync: "vny_sec_...",
    syncBtn: "GO",
    instructionsTitle: "Where can I find my Sync ID?",
    instructions1: "1. Open your Vinyas console on your browser.",
    instructions2: "2. Click on the Settings Gear in the header.",
    instructions3: "3. Under System Settings, click Show next to Sync ID, or click Connect Mobile App to view it.",
    welcomeBack: "Welcome back,",
    overallProgress: "Overall Progress",
    dashboard: "Dashboard",
    syllabus: "Syllabus",
    analytics: "Analytics",
    badges: "Badges",
    settings: "Settings",
    disconnect: "Disconnect Sync ID",
    disconnectConfirm: "Are you sure you want to log out and clear all synced data from this device?",
    cancel: "Cancel",
    disconnectBtn: "Disconnect",
    readyToSync: "READY TO SYNC",
    artworkCredits: "Artwork by @Avaazoulay on Pinterest",
    offline: "Offline",
    syncingData: "Syncing Vinyas data...",
    lastUpdated: "Last updated",
    emptySyllabus: "No subjects found.",
    emptyRoutines: "No routines scheduled.",
    emptyLogs: "No test logs found.",
    emptyAchievements: "No achievements earned yet.",
  },
  hi: {
    welcome: "विन्यास में आपका स्वागत है",
    welcomeDesc: "एंड्रॉइड आइकन पर क्लिक करके या क्यूआर कोड स्कैन करके अपने विन्यास वेब कंसोल से सिंक आईडी दर्ज करें।",
    placeholderSync: "vny_sec_...",
    syncBtn: "आगे",
    instructionsTitle: "मुझे अपनी सिंक आईडी कहाँ मिलेगी?",
    instructions1: "1. अपने ब्राउज़र पर विन्यास कंसोल खोलें।",
    instructions2: "2. हेडर में सेटिंग्स गियर पर क्लिक करें।",
    instructions3: "3. सिस्टम सेटिंग्स के तहत, सिंक आईडी के बगल में शो (Show) पर क्लिक करें, या इसे देखने के लिए कनेक्ट मोबाइल ऐप पर क्लिक करें।",
    welcomeBack: "आपका स्वागत है,",
    overallProgress: "कुल प्रगति",
    dashboard: "डैशबोर्ड",
    syllabus: "पाठ्यक्रम",
    analytics: "विश्लेषण",
    badges: "बैज",
    settings: "सेटिंग्स",
    disconnect: "सिंक आईडी डिस्कनेक्ट करें",
    disconnectConfirm: "क्या आप वाकई लॉग आउट करना चाहते हैं और इस डिवाइस से सभी सिंक किए गए डेटा को हटाना चाहते हैं?",
    cancel: "रद्द करें",
    disconnectBtn: "डिस्कनेक्ट करें",
    readyToSync: "सिंक के लिए तैयार",
    artworkCredits: "आर्टवर्क Pinterest पर @Avaazoulay द्वारा",
    offline: "ऑफलाइन",
    syncingData: "डेटा सिंक किया जा रहा है...",
    lastUpdated: "अंतिम बार अपडेट किया गया",
    emptySyllabus: "कोई विषय नहीं मिला।",
    emptyRoutines: "कोई रूटीन निर्धारित नहीं है।",
    emptyLogs: "कोई टेस्ट लॉग नहीं मिला।",
    emptyAchievements: "अभी तक कोई बैज नहीं मिला।",
  }
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS.en;

export function calculateChapterProgress(ch: any): number {
  if (!ch) return 0;
  const breakdown = calculateChapterBreakdown(ch);
  return breakdown.overallComp;
}

export function calculateChapterBreakdown(chapter: any) {
  if (!chapter) return { correct: 0, incorrect: 0, notAttempted: 100, overallComp: 0, overallAcc: 0 };

  const dppComp = chapter.dpp?.comp || 0;
  const dppAcc = chapter.dpp?.acc || 0;

  const moduleComp = chapter.module?.comp || 0;
  const moduleAcc = chapter.module?.acc || 0;

  const assignments = chapter.assignments || [];
  const hasAssignments = assignments.length > 0;

  let assComp = 0;
  let assAcc = 0;
  let submittedAssCount = 0;

  if (hasAssignments) {
    let totalAssComp = 0;
    let totalAssAcc = 0;
    assignments.forEach((a: any) => {
      const questionCount = a.questionCount || 0;
      if (questionCount > 0) {
        if (a.selfAnalysis?.isSubmitted) {
          const correct = a.selfAnalysis.correctCount || 0;
          const incorrect = a.selfAnalysis.incorrectCount || 0;
          const attempted = correct + incorrect;
          totalAssComp += (attempted / questionCount) * 100;
          if (attempted > 0) {
            totalAssAcc += (correct / attempted) * 100;
            submittedAssCount++;
          }
        } else {
          const solvedCount = Object.values(a.questionStates || {}).filter(s => s === 'completed').length;
          const errorCount = Object.values(a.questionStates || {}).filter(s => s === 'difficult' || s === 'later').length;
          const attempted = solvedCount + errorCount;
          totalAssComp += (attempted / questionCount) * 100;
          if (attempted > 0) {
            totalAssAcc += (solvedCount / attempted) * 100;
            submittedAssCount++;
          }
        }
      } else {
        if (a.selfAnalysis?.isSubmitted) {
          totalAssComp += 100;
          const correct = a.selfAnalysis.correctCount || 0;
          const incorrect = a.selfAnalysis.incorrectCount || 0;
          const total = correct + incorrect;
          if (total > 0) {
            totalAssAcc += (correct / total) * 100;
            submittedAssCount++;
          }
        }
      }
    });
    assComp = totalAssComp / assignments.length;
    if (submittedAssCount > 0) {
      assAcc = totalAssAcc / submittedAssCount;
    }
  }

  let weights = { dpp: 0.3, module: 0.4, assignments: 0.3 };
  if (!hasAssignments) {
    weights.assignments = 0;
  }
  const totalWeight = weights.dpp + weights.module + weights.assignments;

  const overallComp = totalWeight > 0 ? (
    (weights.dpp * dppComp + weights.module * moduleComp + weights.assignments * assComp) / totalWeight
  ) : 0;

  let activeAccWeightSum = 0;
  let activeAccScoreSum = 0;

  if (dppComp > 0) {
    activeAccWeightSum += weights.dpp;
    activeAccScoreSum += weights.dpp * dppAcc;
  }
  if (moduleComp > 0) {
    activeAccWeightSum += weights.module;
    activeAccScoreSum += weights.module * moduleAcc;
  }
  if (hasAssignments && submittedAssCount > 0) {
    activeAccWeightSum += weights.assignments;
    activeAccScoreSum += weights.assignments * assAcc;
  }

  const overallAcc = activeAccWeightSum > 0 ? (activeAccScoreSum / activeAccWeightSum) : 0;

  const correct = overallComp * (overallAcc / 100);
  const incorrect = overallComp * (1 - overallAcc / 100);
  const notAttempted = 100 - overallComp;

  return {
    correct: Math.round(correct),
    incorrect: Math.round(incorrect),
    notAttempted: Math.round(notAttempted),
    overallComp: Math.round(overallComp),
    overallAcc: Math.round(overallAcc)
  };
}

export function getChapterMasterScore(chapter: any): number {
  if (!chapter) return 0;

  const dppComp = chapter.dpp?.comp || 0;
  const dppAcc = chapter.dpp?.acc || 0;
  const moduleComp = chapter.module?.comp || 0;
  const moduleAcc = chapter.module?.acc || 0;

  // Calculate assignment comp/acc (reuse same logic as breakdown)
  const assignments = chapter.assignments || [];
  const hasAssignments = assignments.length > 0;
  let assComp = 0;
  let assAcc = 0;

  if (hasAssignments) {
    let totalAssComp = 0;
    let totalAssAcc = 0;
    let submittedCount = 0;
    assignments.forEach((a: any) => {
      const qCount = a.questionCount || 0;
      if (qCount > 0) {
        if (a.selfAnalysis?.isSubmitted) {
          const c = a.selfAnalysis.correctCount || 0;
          const ic = a.selfAnalysis.incorrectCount || 0;
          const attempted = c + ic;
          totalAssComp += (attempted / qCount) * 100;
          if (attempted > 0) { totalAssAcc += (c / attempted) * 100; submittedCount++; }
        } else {
          const solved = Object.values(a.questionStates || {}).filter((s: any) => s === 'completed').length;
          const errors = Object.values(a.questionStates || {}).filter((s: any) => s === 'difficult' || s === 'later').length;
          const attempted = solved + errors;
          totalAssComp += (attempted / qCount) * 100;
          if (attempted > 0) { totalAssAcc += (solved / attempted) * 100; submittedCount++; }
        }
      } else if (a.selfAnalysis?.isSubmitted) {
        totalAssComp += 100;
        const c = a.selfAnalysis.correctCount || 0;
        const ic = a.selfAnalysis.incorrectCount || 0;
        const total = c + ic;
        if (total > 0) { totalAssAcc += (c / total) * 100; submittedCount++; }
      }
    });
    assComp = totalAssComp / assignments.length;
    if (submittedCount > 0) assAcc = totalAssAcc / submittedCount;
  }

  // Per-component mastery: DPP balanced (50/50), Module & Assignments accuracy-heavy (30/70)
  const dppMastery = dppComp * 0.5 + dppAcc * 0.5;
  const moduleMastery = moduleComp * 0.3 + moduleAcc * 0.7;
  const assMastery = assComp * 0.3 + assAcc * 0.7;

  // Weighted combination (DPP 30%, Module 40%, Assignments 30%)
  let componentWeights = { dpp: 0.3, module: 0.4, assignments: 0.3 };
  if (!hasAssignments) componentWeights.assignments = 0;
  const totalWeight = componentWeights.dpp + componentWeights.module + componentWeights.assignments;

  const rawScore = totalWeight > 0
    ? (componentWeights.dpp * dppMastery + componentWeights.module * moduleMastery + componentWeights.assignments * assMastery) / totalWeight
    : 0;

  // Retention factor from spaced repetition reviews (0.85 base → 1.0 at 3+ reviews)
  const reviewsDone = chapter.reviewsDone || 0;
  const retentionFactor = Math.min(1.0, 0.85 + 0.05 * reviewsDone);

  return Math.round(rawScore * retentionFactor);
}

/**
 * Auto-computes chapter difficulty from question states.
 * Counts 'difficult' states across moduleQuestionStates and assignment questionStates.
 * Returns 'hard' | 'medium' | 'easy' | null (null if no question data exists).
 */
export function getChapterDifficulty(chapter: any): 'hard' | 'medium' | 'easy' | null {
  if (!chapter) return null;

  let totalQuestions = 0;
  let difficultCount = 0;

  // Count from module question states
  const moduleStates = chapter.moduleQuestionStates || {};
  const moduleValues = Object.values(moduleStates) as string[];
  totalQuestions += moduleValues.length;
  difficultCount += moduleValues.filter(s => s === 'difficult').length;

  // Count from assignment question states
  const assignments = chapter.assignments || [];
  assignments.forEach((a: any) => {
    const qStates = a.questionStates || {};
    const vals = Object.values(qStates) as string[];
    totalQuestions += vals.length;
    difficultCount += vals.filter((s: string) => s === 'difficult' || s === 'incorrect').length;
  });

  if (totalQuestions === 0) return null;

  const ratio = difficultCount / totalQuestions;
  if (ratio > 0.50) return 'hard';
  if (ratio > 0.25) return 'medium';
  return 'easy';
}

export function getEffectiveStatusInfo(chapter: any) {
  if (!chapter) return { text: 'To Do', style: { bg: '#1e293b', border: '#334155', text: '#94a3b8' } };

  const breakdown = calculateChapterBreakdown(chapter);
  const avgAcc = breakdown.overallAcc;

  if (chapter.status === 'Under Revision') {
    return { text: 'Under Revision', style: { bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.3)', text: '#a855f7' } };
  }
  if (chapter.status === 'Current') {
    return { text: 'Current', style: { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)', text: '#3b82f6' } };
  }
  if (chapter.status === 'Done') {
    if (avgAcc >= 80) {
      return { text: 'Done', style: { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', text: '#10b981' } };
    }
    if (avgAcc >= 50) {
      return { text: 'Done', style: { bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.3)', text: '#eab308' } };
    }
    return { text: 'Done', style: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', text: '#ef4444' } };
  }

  return { text: 'To Do', style: { bg: 'rgba(71, 85, 105, 0.2)', border: 'rgba(71, 85, 105, 0.4)', text: '#94a3b8' } };
}

export function getAccuracyTheme(score: number) {
  if (score >= 80) {
    return {
      color: 'emerald',
      text: '#10b981',
      bg: 'rgba(16, 185, 129, 0.08)',
      border: 'rgba(16, 185, 129, 0.3)',
      shadow: 'rgba(16, 185, 129, 0.15)'
    };
  }
  if (score >= 60) {
    return {
      color: 'yellow',
      text: '#eab308',
      bg: 'rgba(234, 179, 8, 0.08)',
      border: 'rgba(234, 179, 8, 0.3)',
      shadow: 'rgba(234, 179, 8, 0.15)'
    };
  }
  if (score > 0) {
    return {
      color: 'red',
      text: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.08)',
      border: 'rgba(239, 68, 68, 0.3)',
      shadow: 'rgba(239, 68, 68, 0.15)'
    };
  }
  return {
    color: 'white',
    text: '#f8fafc',
    bg: 'rgba(255, 255, 255, 0.04)',
    border: 'rgba(255, 255, 255, 0.15)',
    shadow: 'transparent'
  };
}

export function getSubjectThemeColor(colorClass: string, subjectName: string): string {
  const colorLower = (colorClass || '').toLowerCase();
  const nameLower = (subjectName || '').toLowerCase();

  const isBlue = colorLower.includes('blue') || colorLower.includes('cyan') || colorLower.includes('indigo') || nameLower.includes('physic');
  const isGreen = colorLower.includes('emerald') || colorLower.includes('green') || nameLower.includes('chem');
  const isPurple = colorLower.includes('purple') || nameLower.includes('biolog') || nameLower.includes('botan') || nameLower.includes('zool');
  const isRed = colorLower.includes('rose') || colorLower.includes('red') || colorLower.includes('amber') || colorLower.includes('orange') || nameLower.includes('math') || nameLower.includes('algeb') || nameLower.includes('calculus');

  if (isBlue) return THEME.blue;
  if (isGreen) return THEME.emerald;
  if (isPurple) return THEME.purple;
  if (isRed) return THEME.orange;
  return THEME.orange; // Default fallback orange
}

export { width };

