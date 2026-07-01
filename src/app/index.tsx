import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  StatusBar,
  Image,
  ImageBackground,
  Animated,
  Dimensions
} from 'react-native';
import { useFonts } from 'expo-font';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { NavigationBar } from 'expo-navigation-bar';
import { Image as ExpoImage } from 'expo-image';
import {
  Home,
  BookOpen,
  Settings,
  RefreshCw
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';

// Constants & Theme Config
import { THEME, TRANSLATIONS, API_URL, calculateChapterProgress } from '../constants/vinyas-theme';

// Subcomponents
import Onboarding from '../components/vinyas/Onboarding';
import ScannerModal from '../components/vinyas/ScannerModal';
import { VinyasLoadingScreen } from '../components/vinyas/VinyasLoadingScreen';

// Tab Views
import HomeTab from '../components/vinyas/HomeTab';
import SyllabusTab from '../components/vinyas/SyllabusTab';
import SettingsTab from '../components/vinyas/SettingsTab';

// APK Self-Update
import UpdateModal, { type OtaStatus, type BuildStatus } from '../components/vinyas/UpdateModal';
import {
  checkForApkUpdate,
  downloadApk,
  installApk,
  type ApkUpdateInfo,
  type DownloadProgress,
} from '../services/apk-updater';

const { width } = Dimensions.get('window');

export default function AppIndex() {
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': require('../../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Bold': require('../../assets/fonts/Poppins-Bold.ttf'),
  });

  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [syncId, setSyncId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loadingStorage, setLoadingStorage] = useState(true);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [updateText, setUpdateText] = useState<string | null>(null);
  const [isDownloadingUpdate, setIsDownloadingUpdate] = useState(false);

  // Unified update modal state
  const [apkUpdateInfo, setApkUpdateInfo] = useState<ApkUpdateInfo | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [apkDownloadProgress, setApkDownloadProgress] = useState<DownloadProgress | null>(null);
  const [isDownloadingApk, setIsDownloadingApk] = useState(false);
  const [isDownloadingOta, setIsDownloadingOta] = useState(false);
  const [otaStatus, setOtaStatus] = useState<OtaStatus>('checking');
  const [buildStatus, setBuildStatus] = useState<BuildStatus>('idle');

  useEffect(() => {
    if (fontsLoaded && !loadingStorage) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, loadingStorage]);

  // Network logs console
  const [networkLogs, setNetworkLogs] = useState<string[]>([]);
  const addNetworkLog = (msg: string) => {
    setNetworkLogs(prev => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev.slice(0, 49)
    ]);
  };

  // Input fields for onboarding
  const [inputSyncId, setInputSyncId] = useState(__DEV__ ? 'vny_sec_2ee797a5aa2f1e42f64c7253774380b2' : '');
  const [onboardingError, setOnboardingError] = useState('');
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  // Hindi text toggles for onboarding title
  const [isVinyasHindi, setIsVinyasHindi] = useState(false);
  const [isSathiHindi, setIsSathiHindi] = useState(false);

  // Camera scanning states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // Tab State
  const [activeTab, setActiveTab] = useState<'home' | 'syllabus' | 'settings'>('home');

  // Header Details page state sync (to hide tab bar and show clean fullscreen view)
  const [isDetailsActive, setIsDetailsActive] = useState(false);

  // Offline cache fallback state
  const [offlineCachedData, setOfflineCachedData] = useState<any | null>(null);

  // Language settings
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  // Pager Ref for swipe layout
  const mainPagerRef = useRef<ScrollView>(null);
  const isProgrammaticScrollRef = useRef(false);

  const toggleLanguage = async () => {
    const nextLang = language === 'en' ? 'hi' : 'en';
    setLanguage(nextLang);
    await AsyncStorage.setItem('vinyas_language', nextLang);
    setIsVinyasHindi(nextLang === 'hi');
    setIsSathiHindi(nextLang === 'hi');
  };

  const t = (key: keyof typeof TRANSLATIONS['en']) => {
    return TRANSLATIONS[language][key] || TRANSLATIONS['en'][key];
  };



  // Load sync config, language, and hide Android navigation on mount
  useEffect(() => {
    async function loadConfig() {
      try {


        if (Platform.OS === 'android') {
          NavigationBar.setHidden(false);
        }

        const storedSyncId = await AsyncStorage.getItem('vinyas_sync_id');
        const storedLang = await AsyncStorage.getItem('vinyas_language');
        const cached = await AsyncStorage.getItem('vinyas_cached_user_data');

        if (storedSyncId) setSyncId(storedSyncId);
        if (cached) {
          try {
            setOfflineCachedData(JSON.parse(cached));
          } catch { }
        }

        if (storedLang === 'en' || storedLang === 'hi') {
          setLanguage(storedLang);
          setIsVinyasHindi(storedLang === 'hi');
          setIsSathiHindi(storedLang === 'hi');
        }
      } catch (e) {
        console.error('Failed to load sync storage keys', e);
      } finally {
        setLoadingStorage(false);
      }
    }
    loadConfig();
  }, []);

  // Background OTA + APK updates check after initial loading is complete
  useEffect(() => {
    if (loadingStorage) return;

    async function checkAllUpdatesBackground() {
      if (__DEV__) return;

      // --- OTA Check ---
      let otaAvailable = false;
      try {
        const updateCheckPromise = Updates.checkForUpdateAsync();
        const timeoutPromise = new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 4000)
        );
        const update = await Promise.race([updateCheckPromise, timeoutPromise]);
        otaAvailable = update.isAvailable;
      } catch (err) {
        console.warn("Background OTA check failed:", err);
      }

      // --- APK Check ---
      let apkUpdate: ApkUpdateInfo | null = null;
      try {
        apkUpdate = await checkForApkUpdate(false);
      } catch (err) {
        console.warn("Background APK check failed:", err);
      }

      // Only show modal if something needs attention
      if (otaAvailable || apkUpdate) {
        setOtaStatus(otaAvailable ? 'available' : 'up-to-date');
        if (apkUpdate) {
          setBuildStatus('available');
          setApkUpdateInfo(apkUpdate);
        } else {
          setBuildStatus('up-to-date');
        }
        setShowUpdateModal(true);
      }
    }

    checkAllUpdatesBackground();
  }, [loadingStorage]);

  // Full update check (used by both manual button and auto check)
  const runFullUpdateCheck = async () => {
    setOtaStatus('checking');
    setBuildStatus('checking');
    setShowUpdateModal(true);

    // --- OTA Check ---
    let otaAvailable = false;
    try {
      if (__DEV__) {
        // OTA disabled in dev
        setOtaStatus('up-to-date');
      } else {
        const updateCheckPromise = Updates.checkForUpdateAsync();
        const timeoutPromise = new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 4000)
        );
        const update = await Promise.race([updateCheckPromise, timeoutPromise]);
        otaAvailable = update.isAvailable;
        setOtaStatus(otaAvailable ? 'available' : 'up-to-date');
      }
    } catch (err) {
      console.warn("OTA check failed:", err);
      setOtaStatus('error');
    }

    // --- APK Check ---
    try {
      const apkUpdate = await checkForApkUpdate(true);
      if (apkUpdate) {
        setBuildStatus('available');
        setApkUpdateInfo(apkUpdate);
      } else {
        setBuildStatus('up-to-date');
      }
    } catch (err) {
      console.warn("APK check failed:", err);
      setBuildStatus('error');
    }
  };

  // OTA update handler (called from modal's Update button)
  const handleOtaUpdate = async () => {
    try {
      setIsDownloadingOta(true);
      setIsDownloadingUpdate(true);
      setUpdateText("Downloading update...");

      const updateFetchPromise = Updates.fetchUpdateAsync();
      const fetchTimeoutPromise = new Promise<any>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 15000)
      );
      await Promise.race([updateFetchPromise, fetchTimeoutPromise]);

      setUpdateText("Applying update...");
      await Updates.reloadAsync();
    } catch (fetchErr) {
      console.error("Failed to download OTA update", fetchErr);
      Alert.alert("Update Failed", "Could not download the update. Please check your internet connection.");
    } finally {
      setIsDownloadingOta(false);
      setIsDownloadingUpdate(false);
      setUpdateText(null);
    }
  };

  // APK download and install handler
  const handleApkDownloadAndInstall = async () => {
    if (!apkUpdateInfo) return;

    try {
      setIsDownloadingApk(true);
      setApkDownloadProgress({ totalBytes: 0, downloadedBytes: 0, percentage: 0 });

      addNetworkLog(`APK download started: v${apkUpdateInfo.version}`);

      const filePath = await downloadApk(
        apkUpdateInfo.downloadUrl,
        apkUpdateInfo.version,
        (progress) => {
          setApkDownloadProgress(progress);
        }
      );

      addNetworkLog(`APK download complete: ${filePath}`);
      setApkDownloadProgress({ totalBytes: 1, downloadedBytes: 1, percentage: 100 });

      // Brief pause so user sees 100%
      await new Promise(resolve => setTimeout(resolve, 500));

      addNetworkLog('Launching APK installer...');
      await installApk(filePath);

      // Dismiss modal after install intent is launched
      setShowUpdateModal(false);
      setIsDownloadingApk(false);
      setApkDownloadProgress(null);
    } catch (err: any) {
      console.error('APK update failed:', err);
      addNetworkLog(`APK update error: ${err.message}`);
      Alert.alert(
        'Update Failed',
        `Could not download or install the update. ${err.message}`
      );
      setIsDownloadingApk(false);
      setApkDownloadProgress(null);
    }
  };

  const handleManualUpdateCheck = () => {
    runFullUpdateCheck();
  };

  // Synchronize ScrollView offset when activeTab changes programmatically
  useEffect(() => {
    if (syncId && mainPagerRef.current) {
      if (isProgrammaticScrollRef.current) {
        const tabs = ['home', 'syllabus', 'settings'] as const;
        const idx = tabs.indexOf(activeTab);
        mainPagerRef.current?.scrollTo({ x: idx * width, animated: true });
        isProgrammaticScrollRef.current = false;
      }
    }
  }, [activeTab]);

  // Handle snap scroll when syncId updates initially
  useEffect(() => {
    if (syncId && mainPagerRef.current) {
      const tabs = ['home', 'syllabus', 'settings'] as const;
      const idx = tabs.indexOf(activeTab);
      mainPagerRef.current?.scrollTo({ x: idx * width, animated: false });
    }
  }, [syncId]);

  const queryToken = syncId;

  // React Query endpoint fetch
  const { data: userData, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['vinyasUserData', queryToken],
    queryFn: async () => {
      if (!queryToken) return null;
      const url = `${API_URL}/data?syncId=${encodeURIComponent(queryToken)}`;
      console.log('[VinyasApp Fetch] Requesting URL:', url);
      addNetworkLog(`GET ${url}`);

      try {
        const response = await fetch(url);
        console.log('[VinyasApp Fetch] Response Status:', response.status);
        addNetworkLog(`GET RESP -> Status ${response.status}`);

        if (!response.ok) {
          throw new Error(`API server returned error: ${response.status}`);
        }

        const data = await response.json();
        console.log('[VinyasApp Fetch] Response Keys:', Object.keys(data));
        console.log('[VinyasApp Fetch] userName:', data.userName);
        console.log('[VinyasApp Fetch] exists:', data.exists);
        console.log('[VinyasApp Fetch] data chapters count:', data.data?.[0]?.chapters?.length);

        if (data.exists === false) {
          addNetworkLog(`WARN: Sync ID not found on server`);
        } else {
          addNetworkLog(`SUCCESS: loaded userName="${data.userName || 'N/A'}"`);
        }

        // If we got a fresh sessionToken back, save it
        if (data.sessionToken) {
          await AsyncStorage.setItem('vinyas_session_token', data.sessionToken);
          setSessionToken(data.sessionToken);
        }

        // Save user doc locally for offline access
        await AsyncStorage.setItem('vinyas_cached_user_data', JSON.stringify(data));
        return data;
      } catch (err: any) {
        console.error('[VinyasApp Fetch] Error:', err.message || err);
        addNetworkLog(`ERROR: ${err.message || err}`);
        throw err;
      }
    },
    enabled: !!queryToken,
  });

  // Action to submit plain text Sync ID on onboarding
  const handleSyncSubmit = async () => {
    const trimmedId = inputSyncId.trim();
    if (!trimmedId) {
      setOnboardingError('Please enter a Sync ID');
      return;
    }

    setOnboardingLoading(true);
    setOnboardingError('');
    const url = `${API_URL}/data?syncId=${encodeURIComponent(trimmedId)}`;
    console.log('[Onboarding Submit] Connecting to Vercel API:', url);
    addNetworkLog(`ONBOARD GET ${url}`);

    try {
      const response = await fetch(url);
      addNetworkLog(`ONBOARD RESP -> Status ${response.status}`);
      if (!response.ok) {
        throw new Error(`API server returned error: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        addNetworkLog(`ONBOARD ERR: ${data.error}`);
        setOnboardingError(data.error);
        return;
      }

      if (data.exists === false) {
        addNetworkLog(`ONBOARD WARN: Sync ID not found`);
        setOnboardingError('Sync ID not found in database. Check your connection or sync settings.');
        return;
      }

      addNetworkLog(`ONBOARD SUCCESS: userName="${data.userName || 'N/A'}"`);

      await AsyncStorage.setItem('vinyas_sync_id', trimmedId);
      setSyncId(trimmedId);

      if (data.sessionToken) {
        await AsyncStorage.setItem('vinyas_session_token', data.sessionToken);
        setSessionToken(data.sessionToken);
      }

      await AsyncStorage.setItem('vinyas_cached_user_data', JSON.stringify(data));
      queryClient.setQueryData(['vinyasUserData', data.sessionToken || trimmedId], data);
    } catch (e: any) {
      console.error('[Onboarding Submit] Error:', e.message || e);
      addNetworkLog(`ONBOARD ERROR: ${e.message || e}`);
      setOnboardingError(e.message || 'Sync connection failed. Verify internet connection.');
    } finally {
      setOnboardingLoading(false);
    }
  };

  // Trigger camera scanning permission check
  const startScanner = async () => {
    if (!cameraPermission) {
      return;
    }
    if (!cameraPermission.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert('Permission Denied', 'Camera permission is required to scan QR codes.');
        return;
      }
    }
    setIsScannerOpen(true);
  };

  // Callback on QR scanned
  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    setIsScannerOpen(false);
    const trimmedId = data.trim();
    if (!trimmedId) {
      setOnboardingError('Scanned empty QR Code');
      return;
    }
    if (!trimmedId.startsWith('vny_sec_') && !trimmedId.startsWith('vny_sess_')) {
      setOnboardingError('Invalid QR Code. Please scan a Vinyas Sync QR Code.');
      return;
    }

    setInputSyncId(trimmedId);
    setOnboardingLoading(true);
    setOnboardingError('');
    try {
      const response = await fetch(`${API_URL}/data?syncId=${encodeURIComponent(trimmedId)}`);
      if (!response.ok) {
        throw new Error('Could not verify Sync ID on server');
      }
      const resData = await response.json();

      if (resData.error) {
        setOnboardingError(resData.error);
        return;
      }

      if (resData.exists === false) {
        setOnboardingError('Sync ID not found in database. Check your connection or sync settings.');
        return;
      }

      await AsyncStorage.setItem('vinyas_sync_id', trimmedId);
      setSyncId(trimmedId);

      if (resData.sessionToken) {
        await AsyncStorage.setItem('vinyas_session_token', resData.sessionToken);
        setSessionToken(resData.sessionToken);
      }

      await AsyncStorage.setItem('vinyas_cached_user_data', JSON.stringify(resData));
      queryClient.setQueryData(['vinyasUserData', resData.sessionToken || trimmedId], resData);
    } catch (e: any) {
      setOnboardingError(e.message || 'Sync connection failed. Verify internet connection.');
    } finally {
      setOnboardingLoading(false);
    }
  };

  // Handle Disconnect
  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Sync ID',
      'Are you sure you want to log out and clear all synced data from this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('vinyas_sync_id');
            await AsyncStorage.removeItem('vinyas_session_token');
            await AsyncStorage.removeItem('vinyas_cached_user_data');
            setSyncId(null);
            setSessionToken(null);
            setOfflineCachedData(null);
            queryClient.removeQueries({ queryKey: ['vinyasUserData'] });
            setActiveTab('home');
            setInputSyncId('');
          }
        }
      ]
    );
  };

  // Handle Tab Click scroll
  const handleTabPress = (tabName: 'home' | 'syllabus' | 'settings') => {
    isProgrammaticScrollRef.current = true;
    setActiveTab(tabName);
  };

  // Handle Swipe scroll page update
  const handleMainScroll = (event: any) => {
    const xOffset = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(xOffset / width);
    const tabs = ['home', 'syllabus', 'settings'] as const;
    if (pageIndex >= 0 && pageIndex < 3) {
      setActiveTab(tabs[pageIndex]);
    }
  };

  if (loadingStorage) {
    return <VinyasLoadingScreen message="Initializing Vinyas..." />;
  }

  // Onboarding View if no sync ID configured
  if (!syncId) {
    return (
      <>
        <Onboarding
          fontsLoaded={fontsLoaded}
          language={language}
          toggleLanguage={toggleLanguage}
          inputSyncId={inputSyncId}
          setInputSyncId={setInputSyncId}
          onboardingError={onboardingError}
          onboardingLoading={onboardingLoading}
          onSubmit={handleSyncSubmit}
          onStartScanner={startScanner}
          isVinyasHindi={isVinyasHindi}
          setIsVinyasHindi={setIsVinyasHindi}
          isSathiHindi={isSathiHindi}
          setIsSathiHindi={setIsSathiHindi}
          updateText={updateText}
          onCheckForUpdates={runFullUpdateCheck}
        />
        <ScannerModal
          visible={isScannerOpen && !!cameraPermission?.granted}
          onClose={() => setIsScannerOpen(false)}
          onBarCodeScanned={handleBarcodeScanned}
          hasPermission={!!cameraPermission?.granted}
        />
        <UpdateModal
          visible={showUpdateModal}
          otaStatus={otaStatus}
          buildStatus={buildStatus}
          apkUpdateInfo={apkUpdateInfo}
          downloadProgress={apkDownloadProgress}
          isDownloadingApk={isDownloadingApk}
          isDownloadingOta={isDownloadingOta}
          onOtaUpdate={handleOtaUpdate}
          onApkDownload={handleApkDownloadAndInstall}
          onDismiss={() => {
            if (!isDownloadingApk && !isDownloadingOta && !apkUpdateInfo?.isForced) {
              setShowUpdateModal(false);
            }
          }}
        />
      </>
    );
  }

  // Resolve current state data (prefer live userData, fallback to offlineCache)
  const activeData = userData || offlineCachedData;

  // View state helpers
  const userSyllabus = activeData?.data || [];
  const routines = activeData?.routines || [];
  const testLogs = activeData?.testLogs || [];
  const achievements = activeData?.achievements || [];
  const lastUpdated = activeData?.lastUpdated || '';
  const cohort = activeData?.cohort || 'JEE Mains';
  const userName = activeData?.userName || 'Vinyas Scholar';

  // Calculations
  const totalChaptersCount = userSyllabus.reduce((acc: number, sub: any) => {
    return acc + (sub?.chapters?.length || 0);
  }, 0);

  const completedChaptersCount = userSyllabus.reduce((acc: number, sub: any) => {
    if (!sub || !Array.isArray(sub.chapters)) return acc;
    const completedInSubject = sub.chapters.filter((ch: any) => {
      const totalProgress = calculateChapterProgress(ch);
      return totalProgress === 100;
    }).length;
    return acc + completedInSubject;
  }, 0);

  const overallProgressPercentage = totalChaptersCount > 0
    ? Math.round((completedChaptersCount / totalChaptersCount) * 100)
    : 0;

  // Calculate target date countdown
  const getDaysRemaining = () => {
    if (!activeData?.targetDate) return null;
    const target = new Date(activeData.targetDate);
    const today = new Date();
    target.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diff = target.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const daysLeft = getDaysRemaining();
  const canScrollMain = !isDetailsActive;

  return (
    <View style={styles.appContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <ImageBackground
        source={require('../../assets/images/background.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        imageStyle={{ transform: [{ scale: 1.1 }] }}
      >
        <View style={styles.dashboardDarkOverlay} />

        {/* Header */}
        {!isDetailsActive && (
          <View style={styles.header}>
            <View style={styles.headerUserSection}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={styles.dashboardSmallLogo}
                resizeMode="contain"
              />
              <View style={{ marginLeft: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.headerWelcome}>{t('welcomeBack')}</Text>
                  {updateText && (
                    <Text style={styles.headerUpdateText}> • {updateText}</Text>
                  )}
                </View>
                <Text style={styles.headerName}>{userName}</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              {isRefetching || isLoading ? (
                <ActivityIndicator size="small" color={THEME.orange} style={{ marginRight: 10 }} />
              ) : (
                <TouchableOpacity
                  onPress={() => refetch()}
                  style={styles.refreshBtn}
                >
                  <RefreshCw size={18} color={THEME.textMuted} />
                </TouchableOpacity>
              )}
              {isError && (
                <View style={styles.offlineBadge}>
                  <Text style={styles.offlineText}>Offline</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Main Paging Viewport */}
        <ScrollView
          ref={mainPagerRef}
          horizontal={true}
          pagingEnabled={true}
          scrollEnabled={canScrollMain}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMainScroll}
          style={styles.mainViewPager}
        >
          {/* Page 0: Home/Dashboard */}
          <ScrollView
            style={{ width: width }}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.tabContainer}>
              <HomeTab
                overallProgressPercentage={overallProgressPercentage}
                completedChaptersCount={completedChaptersCount}
                totalChaptersCount={totalChaptersCount}
                daysLeft={daysLeft}
                cohort={cohort}
                routines={routines}
                activities={activeData?.activities}
              />
            </View>
          </ScrollView>

          {/* Page 1: Syllabus */}
          <View style={{ width: width, flex: 1 }}>
            <View style={{ flex: 1, paddingHorizontal: isDetailsActive ? 0 : 16 }}>
              <SyllabusTab
                userSyllabus={userSyllabus}
                onDetailsViewActiveChange={setIsDetailsActive}
              />
            </View>
          </View>



          {/* Page 4: Settings */}
          <ScrollView
            style={{ width: width }}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.tabContainer}>
              <SettingsTab
                syncId={syncId}
                sessionToken={sessionToken}
                lastUpdated={lastUpdated}
                networkLogs={networkLogs}
                onDisconnect={handleDisconnect}
                onTriggerTestLoading={() => {
                  setIsTestLoading(true);
                  setTimeout(() => setIsTestLoading(false), 3000);
                }}
                onClearLogs={() => setNetworkLogs([])}
                onManualUpdateCheck={handleManualUpdateCheck}
              />
            </View>
          </ScrollView>
        </ScrollView>

        {/* Tab Navigation (Hidden when full-screen chapter details are active) */}
        {!isDetailsActive && (
          <View style={[styles.tabBar, { paddingBottom: insets.bottom + 14 }]}>
            <TouchableOpacity
              onPress={() => handleTabPress('home')}
              style={styles.tabBarItem}
            >
              <Home size={24} color={activeTab === 'home' ? THEME.orange : THEME.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleTabPress('syllabus')}
              style={styles.tabBarItem}
            >
              <BookOpen size={24} color={activeTab === 'syllabus' ? THEME.orange : THEME.textMuted} />
            </TouchableOpacity>



            <TouchableOpacity
              onPress={() => handleTabPress('settings')}
              style={styles.tabBarItem}
            >
              <Settings size={24} color={activeTab === 'settings' ? THEME.orange : THEME.textMuted} />
            </TouchableOpacity>
          </View>
        )}
      </ImageBackground>

      {/* Full Screen Loading Overlay (Covers top welcome bar and bottom activity switcher) */}
      {(isTestLoading || isLoading || isRefetching || isDownloadingUpdate) && (
        <VinyasLoadingScreen
          message={
            isDownloadingUpdate
              ? "Downloading update..."
              : isTestLoading
              ? "Testing Loading Screen..."
              : "Syncing Vinyas data..."
          }
        />
      )}

      {/* Unified Update Status Modal */}
      <UpdateModal
        visible={showUpdateModal}
        otaStatus={otaStatus}
        buildStatus={buildStatus}
        apkUpdateInfo={apkUpdateInfo}
        downloadProgress={apkDownloadProgress}
        isDownloadingApk={isDownloadingApk}
        isDownloadingOta={isDownloadingOta}
        onOtaUpdate={handleOtaUpdate}
        onApkDownload={handleApkDownloadAndInstall}
        onDismiss={() => {
          if (!isDownloadingApk && !isDownloadingOta && !apkUpdateInfo?.isForced) {
            setShowUpdateModal(false);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#020617',
  },
  dashboardDarkOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerUserSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dashboardSmallLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  headerWelcome: {
    color: THEME.textMuted,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  headerUpdateText: {
    color: THEME.orange,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  headerName: {
    color: THEME.text,
    fontSize: 18,
    fontWeight: '900',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineBadge: {
    backgroundColor: THEME.red + '20',
    borderColor: THEME.red + '50',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  offlineText: {
    color: THEME.red,
    fontSize: 10,
    fontWeight: 'bold',
  },
  contentLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: THEME.textMuted,
    fontSize: 12,
    marginTop: 12,
  },
  scrollContent: {
    flex: 1,
  },
  tabContainer: {
    padding: 16,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: THEME.bg,
    borderTopWidth: 1,
    borderColor: THEME.border,
    paddingTop: 16,
    paddingHorizontal: 40,
  },
  tabBarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainViewPager: {
    flex: 1,
  },
});
