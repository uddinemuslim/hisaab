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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signInWithGoogle, signInAsGuest } from '../services';
import { AuthState } from '../types';

interface LoginScreenProps {
  onAuthSuccess: (state: AuthState) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onAuthSuccess }) => {
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
      {/* Brand Header */}
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="book-open-page-variant" size={48} color="#2563EB" />
        </View>
        <Text style={styles.brandTitle}>HISAAB</Text>
        <Text style={styles.tagline}>Simple, Private Personal Ledger</Text>
      </View>

      {/* Action Buttons (Strictly ONLY two buttons) */}
      <View style={styles.actions}>
        {/* Continue with Google */}
        <TouchableOpacity
          style={[styles.btn, styles.googleBtn]}
          onPress={handleGoogleSignIn}
          disabled={loadingGoogle || loadingGuest}
          activeOpacity={0.8}
        >
          {loadingGoogle ? (
            <ActivityIndicator size="small" color="#1F2937" />
          ) : (
            <View style={styles.btnContent}>
              <MaterialCommunityIcons name="google" size={20} color="#EA4335" style={styles.btnIcon} />
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Continue as Guest */}
        <TouchableOpacity
          style={[styles.btn, styles.guestBtn]}
          onPress={handleGuestSignIn}
          disabled={loadingGoogle || loadingGuest}
          activeOpacity={0.8}
        >
          {loadingGuest ? (
            <ActivityIndicator size="small" color="#4B5563" />
          ) : (
            <View style={styles.btnContent}>
              <MaterialCommunityIcons name="account-outline" size={20} color="#4B5563" style={styles.btnIcon} />
              <Text style={styles.guestBtnText}>Continue as Guest</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.footerNote}>
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
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  header: {
    alignItems: 'center',
    marginTop: 64,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 2,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 15,
    color: '#6B7280',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  guestBtn: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  guestBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  footerNote: {
    marginTop: 16,
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
});
