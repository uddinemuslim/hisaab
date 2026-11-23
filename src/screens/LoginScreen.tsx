import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signInWithGoogle, signInAsGuest } from '../services';
import { AuthState } from '../types';
import { useTheme } from '../theme';

interface LoginScreenProps {
  onAuthSuccess: (state: AuthState) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onAuthSuccess }) => {
  const { colors, isDark } = useTheme();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingGuest, setLoadingGuest] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoadingGoogle(true);
      const res = await signInWithGoogle();
      if (res.success && res.authState) {
        onAuthSuccess(res.authState);
      } else if (res.error) {
        Alert.alert('Sign-In Issue', res.error);
      }
    } catch (err: any) {
      Alert.alert('Google Sign-In Error', err?.message || 'Failed to sign in with Google');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setLoadingGuest(true);
      const guestState = await signInAsGuest();
      onAuthSuccess(guestState);
    } catch (err: any) {
      Alert.alert('Guest Mode Error', err?.message || 'Failed to proceed as Guest');
    } finally {
      setLoadingGuest(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        {/* Brand Header */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>HISAAB</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Simple, Private Personal Ledger
          </Text>
        </View>

        {/* Action Buttons (Strictly ONLY two buttons) */}
        <View style={styles.actions}>
          {/* Continue with Google */}
          <TouchableOpacity
            style={[
              styles.btn,
              styles.googleBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={handleGoogleSignIn}
            disabled={loadingGoogle || loadingGuest}
            activeOpacity={0.8}
          >
            {loadingGoogle ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <View style={styles.btnContent}>
                <MaterialCommunityIcons
                  name="google"
                  size={20}
                  color="#EA4335"
                  style={styles.btnIcon}
                />
                <Text style={[styles.googleBtnText, { color: colors.textPrimary }]}>
                  Continue with Google
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Continue as Guest */}
          <TouchableOpacity
            style={[
              styles.btn,
              styles.guestBtn,
              {
                backgroundColor: isDark ? colors.background : '#F3F4F6',
                borderColor: colors.border,
              },
            ]}
            onPress={handleGuestSignIn}
            disabled={loadingGoogle || loadingGuest}
            activeOpacity={0.8}
          >
            {loadingGuest ? (
              <ActivityIndicator size="small" color={colors.textSecondary} />
            ) : (
              <View style={styles.btnContent}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.btnIcon}
                />
                <Text style={[styles.guestBtnText, { color: colors.textPrimary }]}>
                  Continue as Guest
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={[styles.footerNote, { color: colors.textMuted }]}>
            Guest mode keeps your data 100% offline. You can link your Google account anytime for Drive backup.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  header: {
    alignItems: 'center',
    marginTop: 64,
  },
  logoImage: {
    width: 96,
    height: 96,
    borderRadius: 22,
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 15,
    marginBottom: 16,
  },
  actions: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  btn: {
    width: '100%',
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIcon: {
    marginRight: 10,
  },
  googleBtn: {
    borderWidth: 1.5,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  guestBtn: {
    borderWidth: 1,
  },
  guestBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  footerNote: {
    marginTop: 16,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
});
