import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { getDatabase } from './src/db';
import { getStoredAuthState, configureGoogleSignIn, restoreFromDrive } from './src/services';
import { AuthState } from './src/types';
import {
  LoginScreen,
  HomeScreen,
  PartyDetailScreen,
  SettingsScreen,
} from './src/screens';
import { ThemeProvider, useTheme } from './src/theme';

type ScreenType = 'login' | 'home' | 'party_detail' | 'settings';

function MainApp() {
  const { colors, isDark } = useTheme();
  const [isInitializing, setIsInitializing] = useState(true);
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('login');
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);
  const [dataRefreshKey, setDataRefreshKey] = useState(0);

  useEffect(() => {
    async function initApp() {
      try {
        // 1. Initialize SQLite Database & Tables
        await getDatabase();

        // 2. Configure Google Sign-In SDK
        configureGoogleSignIn();

        // 3. Load Auth State
        const savedAuth = await getStoredAuthState();
        setAuthState(savedAuth);

        if (savedAuth.mode) {
          setCurrentScreen('home');
          // If signed in with Google, check for restore on launch
          if (savedAuth.mode === 'google') {
            restoreFromDrive().catch((err) =>
              console.warn('Initial cloud restore check failed:', err)
            );
          }
        } else {
          setCurrentScreen('login');
        }
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setIsInitializing(false);
      }
    }

    initApp();
  }, []);

  const handleAuthSuccess = (state: AuthState) => {
    setAuthState(state);
    setCurrentScreen('home');
  };

  const handleSelectParty = (partyId: string) => {
    setSelectedPartyId(partyId);
    setCurrentScreen('party_detail');
  };

  const handleBackToHome = () => {
    setSelectedPartyId(null);
    setCurrentScreen('home');
    // Bump refresh key so HomeScreen reloads updated balances
    setDataRefreshKey((k) => k + 1);
  };

  const handleOpenSettings = () => {
    setCurrentScreen('settings');
  };

  const handleAuthStateChange = (newState: AuthState | null) => {
    setAuthState(newState);
    if (!newState || !newState.mode) {
      setCurrentScreen('login');
    }
  };

  const handleDataRestored = () => {
    setDataRefreshKey((k) => k + 1);
  };

  if (isInitializing) {
    return (
      <View style={[styles.splashContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.splashTitle, { color: colors.textPrimary }]}>HISAAB</Text>
        <Text style={[styles.splashSubtitle, { color: colors.textSecondary }]}>Loading your ledger...</Text>
        <ActivityIndicator size="large" color={colors.primary} style={styles.splashSpinner} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {currentScreen === 'login' && (
        <LoginScreen onAuthSuccess={handleAuthSuccess} />
      )}

      {currentScreen === 'home' && authState && (
        <HomeScreen
          key={`home-${dataRefreshKey}`}
          authState={authState}
          onSelectParty={handleSelectParty}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {currentScreen === 'party_detail' && selectedPartyId && (
        <PartyDetailScreen
          partyId={selectedPartyId}
          onBack={handleBackToHome}
        />
      )}

      {currentScreen === 'settings' && authState && (
        <SettingsScreen
          authState={authState}
          onBack={handleBackToHome}
          onAuthStateChange={handleAuthStateChange}
          onDataRestored={handleDataRestored}
        />
      )}
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  splashSubtitle: {
    fontSize: 14,
  },
  splashSpinner: {
    marginTop: 24,
  },
});
