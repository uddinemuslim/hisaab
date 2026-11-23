import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthState } from '../types';
import {
  signOut,
  linkGoogleAccount,
  performBackup,
  restoreFromDrive,
  subscribeSyncStatus,
  SyncStatus,
} from '../services';
import { formatRelativeSyncTime } from '../utils';
import { useTheme } from '../theme';

interface SettingsScreenProps {
  authState: AuthState;
  onBack: () => void;
  onAuthStateChange: (newState: AuthState | null) => void;
  onDataRestored?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  authState,
  onBack,
  onAuthStateChange,
  onDataRestored,
}) => {
  const { mode, setMode, colors, isDark } = useTheme();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSyncedAt: authState.lastSyncedAt,
    error: null,
  });
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeSyncStatus(setSyncStatus);
    return () => unsubscribe();
  }, []);

  const handleBackupNow = async () => {
    try {
      setActionInProgress('backup');
      const res = await performBackup();
      if (res.success) {
        Alert.alert('Backup Successful', 'Your ledger has been saved to your Google Drive appDataFolder.');
      } else {
        Alert.alert('Backup Failed', res.error || 'Could not complete backup');
      }
    } catch (err: any) {
      Alert.alert('Backup Error', err?.message || 'Failed to complete backup');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRestoreNow = () => {
    Alert.alert(
      'Restore From Google Drive',
      'This will replace your current local data with the latest backup stored in Google Drive. Are you sure you want to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore Now',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionInProgress('restore');
              const res = await restoreFromDrive();
              if (res.success) {
                if (res.restored) {
                  Alert.alert(
                    'Restore Complete',
                    `Successfully restored ${res.recordCount?.parties || 0} parties and ${res.recordCount?.transactions || 0} transactions.`
                  );
                  if (onDataRestored) onDataRestored();
                } else {
                  Alert.alert('No Backup Found', 'No backup file was found in your Google Drive appDataFolder.');
                }
              } else {
                Alert.alert('Restore Failed', res.error || 'Could not restore backup');
              }
            } catch (err: any) {
              Alert.alert('Restore Error', err?.message || 'Failed to restore backup');
            } finally {
              setActionInProgress(null);
            }
          },
        },
      ]
    );
  };

  const handleLinkGoogle = async () => {
    try {
      setActionInProgress('link');
      const res = await linkGoogleAccount();
      if (res.success && res.authState) {
        onAuthStateChange(res.authState);
        Alert.alert('Google Account Linked', 'Your account is now linked. Cloud auto-backup is active.');
      } else if (res.error) {
        Alert.alert('Sign-In Error', res.error);
      }
    } catch (err: any) {
      Alert.alert('Link Error', err?.message || 'Failed to link Google account');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your local data will be preserved on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            onAuthStateChange(null);
          },
        },
      ]
    );
  };

  const handleOpenGitHub = () => {
    Linking.openURL('https://github.com/uddinemuslim').catch((err) =>
      console.warn('Could not open GitHub link:', err)
    );
  };

  const isGoogle = authState.mode === 'google';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Account Profile Card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>ACCOUNT</Text>
            {isGoogle ? (
              <View style={styles.profileRow}>
                <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#374151' : '#FEE2E2' }]}>
                  <MaterialCommunityIcons name="google" size={24} color="#EA4335" />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                    {authState.user?.name || 'Google User'}
                  </Text>
                  <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                    {authState.user?.email}
                  </Text>
                  <View style={[styles.activeBadge, { backgroundColor: colors.gotBg }]}>
                    <Text style={[styles.activeBadgeText, { color: colors.gotText }]}>
                      Google Drive Sync Active
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.guestBox}>
                <View style={styles.guestRow}>
                  <MaterialCommunityIcons name="account-outline" size={28} color={colors.textSecondary} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                      Guest Mode (Offline)
                    </Text>
                    <Text style={[styles.guestNote, { color: colors.textSecondary }]}>
                      Data stored locally on this phone. Link Google to enable auto-backup.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.btn, styles.linkGoogleBtn, { backgroundColor: colors.primary }]}
                  onPress={handleLinkGoogle}
                  disabled={actionInProgress === 'link'}
                >
                  {actionInProgress === 'link' ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="google" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.linkGoogleBtnText}>Link Google Account</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Theme / Appearance Selector */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>APPEARANCE</Text>
            <View style={styles.themeSelectorRow}>
              <TouchableOpacity
                style={[
                  styles.themeOptionBtn,
                  { borderColor: colors.border, backgroundColor: !isDark ? colors.primaryLight : colors.inputBg },
                  !isDark && { borderColor: colors.primary, borderWidth: 2 },
                ]}
                onPress={() => setMode('light')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="weather-sunny"
                  size={22}
                  color={!isDark ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    { color: !isDark ? colors.primary : colors.textSecondary, fontWeight: !isDark ? '700' : '500' },
                  ]}
                >
                  Light Mode
                </Text>
                {!isDark && (
                  <MaterialCommunityIcons name="check-circle" size={16} color={colors.primary} style={styles.checkIcon} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeOptionBtn,
                  { borderColor: colors.border, backgroundColor: isDark ? colors.primaryLight : colors.inputBg },
                  isDark && { borderColor: colors.primary, borderWidth: 2 },
                ]}
                onPress={() => setMode('dark')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="weather-night"
                  size={22}
                  color={isDark ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    { color: isDark ? colors.primary : colors.textSecondary, fontWeight: isDark ? '700' : '500' },
                  ]}
                >
                  Dark Mode
                </Text>
                {isDark && (
                  <MaterialCommunityIcons name="check-circle" size={16} color={colors.primary} style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Cloud Backup & Sync Section (for Google users) */}
          {isGoogle && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>GOOGLE DRIVE BACKUP</Text>
              <Text style={[styles.backupDescription, { color: colors.textSecondary }]}>
                Backups are automatically saved to your private Google Drive appDataFolder with 3-second debouncing on every entry.
              </Text>

              <View style={[styles.syncStatusRow, { borderColor: colors.borderLight }]}>
                <Text style={[styles.syncLabel, { color: colors.textSecondary }]}>Last Synced:</Text>
                <Text style={[styles.syncValue, { color: colors.textPrimary }]}>
                  {syncStatus.isSyncing
                    ? 'Syncing now...'
                    : formatRelativeSyncTime(syncStatus.lastSyncedAt)}
                </Text>
              </View>

              {syncStatus.error ? (
                <Text style={[styles.errorText, { color: colors.gave }]}>Error: {syncStatus.error}</Text>
              ) : null}

              <View style={styles.syncBtnRow}>
                <TouchableOpacity
                  style={[
                    styles.btn,
                    styles.backupBtn,
                    { backgroundColor: colors.primaryLight, borderColor: colors.primaryBorder },
                  ]}
                  onPress={handleBackupNow}
                  disabled={!!actionInProgress || syncStatus.isSyncing}
                >
                  {actionInProgress === 'backup' ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="cloud-upload-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
                      <Text style={[styles.backupBtnText, { color: colors.primary }]}>Backup Now</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.btn,
                    styles.restoreBtn,
                    { backgroundColor: isDark ? colors.background : '#F3F4F6', borderColor: colors.border },
                  ]}
                  onPress={handleRestoreNow}
                  disabled={!!actionInProgress || syncStatus.isSyncing}
                >
                  {actionInProgress === 'restore' ? (
                    <ActivityIndicator size="small" color={colors.textPrimary} />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="cloud-download-outline" size={18} color={colors.textPrimary} style={{ marginRight: 6 }} />
                      <Text style={[styles.restoreBtnText, { color: colors.textPrimary }]}>Restore Now</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* About Hisaab Card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>ABOUT HISAAB</Text>

            <View style={styles.aboutHeader}>
              <Image
                source={require('../../assets/icon.png')}
                style={styles.aboutLogo}
                resizeMode="contain"
              />
              <Text style={[styles.aboutAppName, { color: colors.textPrimary }]}>HISAAB</Text>
              <Text style={[styles.aboutAppTagline, { color: colors.textSecondary }]}>
                Simple, Private Personal Ledger
              </Text>
            </View>

            <View style={[styles.dividerLine, { backgroundColor: colors.borderLight }]} />

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>App Version</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>1.0.0</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Developer</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>moslem</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>GitHub Profile</Text>
              <TouchableOpacity
                style={styles.githubLink}
                onPress={handleOpenGitHub}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="github" size={18} color={colors.primary} style={{ marginRight: 5 }} />
                <Text style={[styles.githubLinkText, { color: colors.primary }]}>
                  uddinemuslim
                </Text>
                <MaterialCommunityIcons name="open-in-new" size={14} color={colors.primary} style={{ marginLeft: 3 }} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity
            style={[
              styles.signOutBtn,
              { backgroundColor: colors.gaveBg },
            ]}
            onPress={handleSignOut}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="logout" size={20} color={colors.gaveText} style={{ marginRight: 8 }} />
            <Text style={[styles.signOutBtnText, { color: colors.gaveText }]}>
              {isGoogle ? 'Sign Out of Google' : 'Exit Guest Mode'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  guestBox: {},
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  guestNote: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  linkGoogleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  linkGoogleBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  themeSelectorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  themeOptionText: {
    fontSize: 14,
  },
  checkIcon: {
    marginLeft: 2,
  },
  backupDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  syncStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 14,
  },
  syncLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  syncValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    marginBottom: 10,
  },
  syncBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backupBtn: {
    borderWidth: 1,
    flexDirection: 'row',
  },
  backupBtnText: {
    fontWeight: '600',
    fontSize: 13,
  },
  restoreBtn: {
    borderWidth: 1,
    flexDirection: 'row',
  },
  restoreBtnText: {
    fontWeight: '600',
    fontSize: 13,
  },
  aboutHeader: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  aboutLogo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginBottom: 10,
  },
  aboutAppName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  aboutAppTagline: {
    fontSize: 12,
    marginTop: 2,
  },
  dividerLine: {
    height: 1,
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  githubLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  githubLinkText: {
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 10,
    marginTop: 8,
  },
  signOutBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
});
