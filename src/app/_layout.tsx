import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState, useRef } from 'react';
import { TouchableOpacity, StatusBar, View, Animated, Text, StyleSheet, Image, Easing } from 'react-native';
import Feather from '@expo/vector-icons/Feather';

SplashScreen.preventAutoHideAsync();

function AnimatedAppSplash({ onComplete }: { onComplete: () => void }) {
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const contentScale = useRef(new Animated.Value(0.85)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const iconBlink = useRef(new Animated.Value(0.2)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Hide native static splash screen immediately
    SplashScreen.hideAsync().catch(() => {});

    // 1. Entrance animation: smooth scale up and fade in
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(contentScale, {
        toValue: 1,
        friction: 6,
        tension: 45,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Neon blinking / flickering effect (powers up then pulses)
    Animated.sequence([
      Animated.timing(iconBlink, { toValue: 1, duration: 130, useNativeDriver: true }),
      Animated.timing(iconBlink, { toValue: 0.15, duration: 80, useNativeDriver: true }),
      Animated.timing(iconBlink, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.timing(iconBlink, { toValue: 0.35, duration: 90, useNativeDriver: true }),
      Animated.timing(iconBlink, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(iconBlink, { toValue: 0.7, duration: 550, useNativeDriver: true }),
          Animated.timing(iconBlink, { toValue: 1, duration: 550, useNativeDriver: true }),
        ])
      ),
    ]).start();

    // 3. Loading bar filling from 0% to 100%
    Animated.timing(progress, {
      toValue: 1,
      duration: 2200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start(() => {
      // Hold briefly at 100%, then smoothly fade out to main screen
      setTimeout(() => {
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }).start(() => {
          onComplete();
        });
      }, 250);
    });
  }, []);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.splashContainer, { opacity: containerOpacity }]}>
      <Animated.View style={[styles.splashCenter, { opacity: contentOpacity, transform: [{ scale: contentScale }] }]}>
        <Animated.View style={[styles.iconWrapper, { opacity: iconBlink }]}>
          <Image
            source={require('../../assets/images/splash-icon.png')}
            style={styles.splashIcon}
          />
        </Animated.View>

        <Text style={styles.splashTitle}>RENT RECEIPT</Text>
        <Text style={styles.splashSubtitle}>Utility & Rent Manager</Text>

        <View style={styles.loadingTrack}>
          <Animated.View style={[styles.loadingFill, { width: progressWidth }]} />
        </View>
      </Animated.View>

      <View style={styles.splashFooter}>
        <Text style={styles.splashFooterText}>
          Developed by <Text style={styles.splashFooterHighlight}>The variation web solution</Text>
        </Text>
        <Text style={styles.splashFooterAuthor}>Shoeb Ahmad Khan</Text>
      </View>
    </Animated.View>
  );
}

import { ThemeProvider, useTheme } from '../context/ThemeContext';

function NavigationRoot() {
  const router = useRouter();
  const { theme } = useTheme();
  const [isSplashComplete, setSplashComplete] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar 
        barStyle={theme.isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.background} 
      />
      <Stack screenOptions={{
        headerStyle: { backgroundColor: theme.headerBg },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.background }
      }}>
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'Receipt Gen',
            headerTitleStyle: { fontWeight: '700', color: theme.text },
            headerRight: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => router.push('/history')} style={{ padding: 8, marginRight: 8 }}>
                  <Feather name="clock" color={theme.primary} size={22} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/settings')} style={{ padding: 8 }}>
                  <Feather name="settings" color={theme.primary} size={22} />
                </TouchableOpacity>
              </View>
            )
          }} 
        />
        <Stack.Screen 
          name="settings" 
          options={{ 
            title: 'Settings', 
            presentation: 'modal',
            headerTitleStyle: { fontWeight: '700', color: theme.text },
          }} 
        />
        <Stack.Screen 
          name="history" 
          options={{ 
            title: 'History', 
            presentation: 'modal',
            headerTitleStyle: { fontWeight: '700', color: theme.text },
          }} 
        />
      </Stack>
      {!isSplashComplete && <AnimatedAppSplash onComplete={() => setSplashComplete(true)} />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <NavigationRoot />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  splashCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    shadowColor: '#00d873',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
    elevation: 15,
    marginBottom: 20,
  },
  splashIcon: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
  },
  splashTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  splashSubtitle: {
    fontSize: 14,
    color: '#8e8e93',
    letterSpacing: 1,
    marginTop: 6,
    fontWeight: '500',
  },
  loadingTrack: {
    width: 170,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 36,
  },
  loadingFill: {
    height: '100%',
    backgroundColor: '#00d873',
    borderRadius: 3,
    shadowColor: '#00d873',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 5,
  },
  splashFooter: {
    position: 'absolute',
    bottom: 48,
    alignItems: 'center',
  },
  splashFooterText: {
    color: '#8e8e93',
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  splashFooterHighlight: {
    color: '#00d873',
    fontWeight: '700',
  },
  splashFooterAuthor: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
