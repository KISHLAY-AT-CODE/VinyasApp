import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  StatusBar,
  Image,
  ImageBackground
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOutUp,
  LinearTransition
} from 'react-native-reanimated';
import { QrCode, Settings, ArrowRight } from 'lucide-react-native';
import { THEME, TRANSLATIONS } from '../../constants/vinyas-theme';
import { VinyasLoadingScreen } from './VinyasLoadingScreen';

interface OnboardingProps {
  fontsLoaded: boolean;
  language: 'en' | 'hi';
  toggleLanguage: () => void;
  inputSyncId: string;
  setInputSyncId: (val: string) => void;
  onboardingError: string;
  onboardingLoading: boolean;
  onSubmit: () => void;
  onStartScanner: () => void;
  isVinyasHindi: boolean;
  setIsVinyasHindi: (val: boolean) => void;
  isSathiHindi: boolean;
  setIsSathiHindi: (val: boolean) => void;
}

export default function Onboarding({
  fontsLoaded,
  language,
  toggleLanguage,
  inputSyncId,
  setInputSyncId,
  onboardingError,
  onboardingLoading,
  onSubmit,
  onStartScanner,
  isVinyasHindi,
  setIsVinyasHindi,
  isSathiHindi,
  setIsSathiHindi
}: OnboardingProps) {
  const [isInputFocused, setIsInputFocused] = useState(false);

  const t = (key: keyof typeof TRANSLATIONS.en) => {
    return TRANSLATIONS[language][key] || TRANSLATIONS.en[key];
  };

  return (
    <View style={styles.onboardingContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <ImageBackground
        source={require('../../../assets/images/background.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        imageStyle={{ transform: [{ scale: 1.1 }] }}
      >
        <View style={styles.darkOverlay} />

        {/* Immersive Fullscreen Floating Header Row */}
        <View style={styles.floatingHeaderRow}>
          <TouchableOpacity
            style={styles.floatingRoundBtn}
            onPress={() => {
              setInputSyncId('');
            }}
          >
            <Image
              source={require('../../../assets/images/logo.png')}
              style={{ width: 38, height: 38, borderRadius: 19 }}
              resizeMode="cover"
            />
          </TouchableOpacity>

          <View style={styles.floatingHeaderRightRow}>
            <TouchableOpacity
              style={[styles.floatingRoundBtn, { marginRight: 10 }]}
              onPress={toggleLanguage}
            >
              <Text style={styles.langBtnText}>
                {language === 'en' ? 'हिं' : 'EN'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.floatingRoundBtn} onPress={onStartScanner}>
              <QrCode size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.onboardingScroll}>
          <Animated.View entering={FadeInUp.duration(800).delay(100)} style={styles.brandingHeader}>
            <Animated.View
              layout={LinearTransition.springify().mass(0.8)}
              style={styles.brandingTitleRow}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsVinyasHindi(!isVinyasHindi)}
              >
                {isVinyasHindi ? (
                  <Animated.Text
                    entering={FadeInDown.duration(200)}
                    exiting={FadeOutUp.duration(150)}
                    style={[
                      styles.brandingTitleText,
                      styles.brandingTitleVinyasRegular,
                      { fontFamily: fontsLoaded ? "Poppins-Regular" : "System" }
                    ]}
                  >
                    विन्यास
                  </Animated.Text>
                ) : (
                  <Animated.Text
                    entering={FadeInDown.duration(200)}
                    exiting={FadeOutUp.duration(150)}
                    style={[
                      styles.brandingTitleText,
                      styles.brandingTitleVinyasRegular,
                      { fontFamily: fontsLoaded ? "Poppins-Regular" : "System" }
                    ]}
                  >
                    Vinyas
                  </Animated.Text>
                )}
              </TouchableOpacity>

              <View style={{ width: 10 }} />

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsSathiHindi(!isSathiHindi)}
              >
                {isSathiHindi ? (
                  <Animated.Text
                    entering={FadeInDown.duration(200)}
                    exiting={FadeOutUp.duration(150)}
                    style={[
                      styles.brandingTitleText,
                      styles.brandingTitleSathiRegular,
                      { fontFamily: fontsLoaded ? "Poppins-Regular" : "System" }
                    ]}
                  >
                    साथी
                  </Animated.Text>
                ) : (
                  <Animated.Text
                    entering={FadeInDown.duration(200)}
                    exiting={FadeOutUp.duration(150)}
                    style={[
                      styles.brandingTitleText,
                      styles.brandingTitleSathiRegular,
                      { fontFamily: fontsLoaded ? "Poppins-Regular" : "System" }
                    ]}
                  >
                    Sāthī
                  </Animated.Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(800).delay(300)} style={styles.onboardingCard}>
            <Text style={styles.onboardingCardTitle}>{t('welcome')}</Text>
            <Text style={styles.onboardingCardDesc}>
              {t('welcomeDesc')}
            </Text>

            <TextInput
              style={[
                styles.onboardingInput,
                isInputFocused && styles.onboardingInputFocused
              ]}
              placeholder={t('placeholderSync')}
              placeholderTextColor="#475569"
              value={inputSyncId}
              onChangeText={setInputSyncId}
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
            />

            {onboardingError ? (
              <Text style={styles.onboardingError}>{onboardingError}</Text>
            ) : null}

            <View style={styles.onboardingActionsRow}>
              <TouchableOpacity
                style={[styles.onboardingBtn, styles.onboardingSubmitBtn]}
                onPress={onSubmit}
                disabled={onboardingLoading}
              >
                {onboardingLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <View style={styles.syncBtnContentRow}>
                    <Text style={styles.onboardingBtnText}>{t('syncBtn')}</Text>
                    <ArrowRight size={16} color="#ffffff" style={{ marginLeft: 6 }} />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.onboardingSquareScannerBtn}
                onPress={onStartScanner}
              >
                <QrCode size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(800).delay(500)} style={styles.onboardingInstructions}>
            <View style={styles.instructionsHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.instructionsTitle}>{t('instructionsTitle')}</Text>
                <Text style={styles.instructionsText}>
                  {t('instructions1')}{"\n"}
                  {t('instructions2')}{"\n"}
                  {t('instructions3')}
                </Text>
              </View>
              <View style={styles.instructionsIconWrapper}>
                <Settings size={24} color="rgba(255, 255, 255, 0.75)" />
              </View>
            </View>
          </Animated.View>

          <Text style={styles.artworkCredits}>
            {t('artworkCredits')}
          </Text>
        </ScrollView>
      </ImageBackground>
      {onboardingLoading && (
        <VinyasLoadingScreen message="Initializing Vinyas..." />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  onboardingContainer: {
    flex: 1,
    backgroundColor: THEME.bg,
    minHeight: '100%',
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(2, 6, 23, 0.65)',
  },
  onboardingScroll: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 140 : (StatusBar.currentHeight ? StatusBar.currentHeight + 90 : 120),
    alignItems: 'center',
  },
  brandingHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  brandingTitleText: {
    fontSize: 36,
    color: '#ffffff',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    textAlign: 'center',
  },
  brandingTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    flexWrap: 'nowrap',
  },
  brandingTitleVinyasRegular: {
    fontWeight: '400',
    color: '#cbd5e1',
  },
  brandingTitleSathiRegular: {
    fontWeight: '400',
    color: '#64748b',
  },
  onboardingCard: {
    width: '100%',
    backgroundColor: '#000000',
    borderRadius: 36,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  onboardingCardTitle: {
    color: THEME.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10,
    fontFamily: 'Poppins-Bold',
  },
  onboardingCardDesc: {
    color: THEME.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
    fontFamily: 'Poppins-Regular',
  },
  onboardingInput: {
    backgroundColor: '#020617',
    borderWidth: 1.5,
    borderColor: THEME.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: THEME.text,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 16,
  },
  onboardingInputFocused: {
    borderColor: THEME.orange,
    backgroundColor: '#03081a',
    shadowColor: THEME.orange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  onboardingError: {
    color: THEME.red,
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  onboardingBtn: {
    backgroundColor: THEME.orange,
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  onboardingBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    fontFamily: 'Poppins-Bold',
  },
  onboardingActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  onboardingSubmitBtn: {
    flex: 1,
    height: 48,
    paddingVertical: 0,
    marginRight: 10,
  },
  syncBtnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardingSquareScannerBtn: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'transparent',
    elevation: 0,
  },
  onboardingInstructions: {
    width: '100%',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginTop: 8,
  },
  instructionsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  instructionsIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  instructionsTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
    marginBottom: 8,
  },
  instructionsText: {
    color: THEME.textMuted,
    fontSize: 11,
    lineHeight: 18,
    fontFamily: 'Poppins-Regular',
  },
  artworkCredits: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  floatingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40),
    zIndex: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  floatingHeaderRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  langBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  floatingRoundBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
