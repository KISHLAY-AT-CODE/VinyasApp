import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Image as ExpoImage } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';

function getConsoleMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('sync')) {
    return 'Commanding the Waves...';
  }
  return 'Surfing through data...';
}

export function VinyasLoadingScreen({ message = 'Loading Vinyas...' }: { message?: string }) {
  const bobAnimValue = useMemo(() => new Animated.Value(0), []);
  const progressValue = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    // Hide native splash screen once the animated loading screen mounts
    SplashScreen.hideAsync().catch(() => {});

    // Slow smooth bobbing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bobAnimValue, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: false,
        }),
        Animated.timing(bobAnimValue, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: false,
        })
      ])
    ).start();

    // Progress fill animation (from 0 to 1 over 2.7s)
    Animated.timing(progressValue, {
      toValue: 1,
      duration: 2700,
      useNativeDriver: false,
    }).start();
  }, [bobAnimValue, progressValue]);

  // Logo bobbing translation
  const logoTranslateY = bobAnimValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-6, 6],
  });

  // Surfboard local bobbing (slow bobbing like the logo)
  const surfboardBobY = bobAnimValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-5, 5],
  });

  // Surfboard horizontal progress-glide (tracks the edge of orange progress)
  const surfboardTranslateX = progressValue.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 192],
  });

  // Orange wave width reveal animation
  const orangeWaveWidth = progressValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  return (
    <View style={styles.webLoadingContainer}>
      {/* Surf & Wave Animation Area (Now contains layered logo in background) */}
      <View style={styles.animationViewport}>
        {/* Layer 1 (Background): Extracted V Logo */}
        <Animated.View
          style={{
            position: 'absolute',
            top: -63, // Shifted further up so only the bottom tip sits behind the stick-man's head
            transform: [
              { translateY: logoTranslateY }
            ],
            marginBottom: 0,
          } as any}
        >
          <ExpoImage
            source={require('../../../assets/images/extracted_v.svg')}
            style={styles.loadingLogoV}
            contentFit="contain"
          />
        </Animated.View>

        {/* 1. Static grey background wave (Slate/grey track) */}
        <View style={StyleSheet.absoluteFill}>
          <Svg width={200} height={100} viewBox="0 0 200 100">
            <Path
              d="M 0,65 L 2,65 C 10.9,65 10.9,60 19.8,60 C 28.7,60 28.7,70 37.6,70 C 46.5,70 46.5,60 55.4,60 C 64.3,60 64.3,70 73.2,70 C 82.1,70 82.1,60 91,60 C 99.9,60 99.9,70 108.8,70 C 117.7,70 117.7,60 126.6,60 C 135.5,60 135.5,70 144.4,70 C 153.3,70 153.3,60 162.2,60 C 171.1,60 171.1,70 180,70 C 189,70 189,65 198,65 L 200,65"
              stroke="#475569"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              opacity="0.8"
            />
          </Svg>
        </View>

        {/* 2. Static orange wave filled dynamically via width reveal */}
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: orangeWaveWidth,
            height: 100,
            overflow: 'hidden',
          }}
        >
          <Svg width={200} height={100} viewBox="0 0 200 100">
            <Path
              d="M 0,65 L 2,65 C 10.9,65 10.9,60 19.8,60 C 28.7,60 28.7,70 37.6,70 C 46.5,70 46.5,60 55.4,60 C 64.3,60 64.3,70 73.2,70 C 82.1,70 82.1,60 91,60 C 99.9,60 99.9,70 108.8,70 C 117.7,70 117.7,60 126.6,60 C 135.5,60 135.5,70 144.4,70 C 153.3,70 153.3,60 162.2,60 C 171.1,60 171.1,70 180,70 C 189,70 189,65 198,65 L 200,65"
              stroke="#f97316"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>

        {/* 3. Animating Surfboard (Static horizontally, bobbing slowly, rotated -10deg with shadow and glow) */}
        <Animated.View
          style={{
            position: 'absolute',
            left: 100, // Centered horizontally like the Vinyas logo
            top: 15, // Raised and adjusted for the larger height (bottom sits right above wave)
            width: 150, // Enlarged board
            height: 85, // Height increased for larger layout
            marginLeft: -75,
            marginTop: -42.5,
            transform: [
              { translateY: surfboardBobY },      // Slow vertical bobbing
              { rotate: '-10deg' }                // Static anticlockwise 10 degree rotation
            ],
            shadowColor: '#f97316',               // Glowing orange drop shadow
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.5,                   // Accentuated shadow opacity
            shadowRadius: 15,                     // Accentuated shadow radius
            elevation: 8,                         // Android elevation glow
          }}
        >
          <ExpoImage
            source={require('../../../assets/images/surfboard.png')}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        </Animated.View>
      </View>

      <Text style={styles.webLoadingText}>{getConsoleMessage(message)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  webLoadingContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#070a13',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  loadingLogoV: {
    width: 90,
    height: 90,
  },
  animationViewport: {
    width: 200,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  webLoadingText: {
    color: '#94a3b8', // Premium terminal slate grey
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 16,
  },
});
