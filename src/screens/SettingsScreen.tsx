import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  ScrollView,
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

  const isGoogle = authState.mode === 'google';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings & Backup</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Account Profile Card */}
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>ACCOUNT</Text>
            {isGoogle ? (
              <View style={styles.profileRow}>
                <View style={styles.avatarCircle}>
                  <MaterialCommunityIcons name="google" size={24} color="#EA4335" />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{authState.user?.name || 'Google User'}</Text>
                  <Text style={styles.profileEmail}>{authState.user?.email}</Text>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Google Drive Sync Active</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.guestBox}>
                <View style={styles.guestRow}>
                  <MaterialCommunityIcons name="account-outline" size={28} color="#6B7280" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.profileName}>Guest Mode (Offline)</Text>
                    <Text style={styles.guestNote}>
                      Data stored locally on this phone. Link Google to enable auto-backup.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.btn, styles.linkGoogleBtn]}
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

          {/* Cloud Backup & Sync Section (for Google users) */}
          {isGoogle && (
            <View style={styles.card}>
              <Text style={styles.sectionHeader}>GOOGLE DRIVE BACKUP</Text>
              <Text style={styles.backupDescription}>
                Backups are automatically saved to your private Google Drive appDataFolder with 3-second debouncing on every entry.
              </Text>

              <View style={styles.syncStatusRow}>
                <Text style={styles.syncLabel}>Last Synced:</Text>
                <Text style={styles.syncValue}>
                  {syncStatus.isSyncing
                    ? 'Syncing now...'
                    : formatRelativeSyncTime(syncStatus.lastSyncedAt)}
                </Text>
              </View>

              {syncStatus.error ? (
                <Text style={styles.errorText}>Error: {syncStatus.error}</Text>
              ) : null}

              <View style={styles.syncBtnRow}>
                <TouchableOpacity
                  style={[styles.btn, styles.backupBtn]}
                  onPress={handleBackupNow}
                  disabled={!!actionInProgress || syncStatus.isSyncing}
                >
                  {actionInProgress === 'backup' ? (
                    <ActivityIndicator size="small" color="#2563EB" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="cloud-upload-outline" size={18} color="#2563EB" style={{ marginRight: 6 }} />
                      <Text style={styles.backupBtnText}>Backup Now</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.restoreBtn]}
                  onPress={handleRestoreNow}
                  disabled={!!actionInProgress || syncStatus.isSyncing}
                >
                  {actionInProgress === 'restore' ? (
                    <ActivityIndicator size="small" color="#374151" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="cloud-download-outline" size={18} color="#374151" style={{ marginRight: 6 }} />
                      <Text style={styles.restoreBtnText}>Restore Now</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Privacy & App Info Card */}
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>ABOUT HISAAB</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Architecture</Text>
              <Text style={styles.infoValue}>Zero Backend (100% Client-Side)</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Local Database</Text>
              <Text style={styles.infoValue}>SQLite (WAL mode)</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cloud Storage</Text>
              <Text style={styles.infoValue}>Hidden Google Drive appData</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={handleSignOut}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="logout" size={20} color="#DC2626" style={{ marginRight: 8 }} />
            <Text style={styles.signOutBtnText}>
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
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    padding: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
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
    backgroundColor: '#FEE2E2',
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
    color: '#111827',
  },
  profileEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
  },
  guestBox: {},
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  guestNote: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 16,
  },
  linkGoogleBtn: {
    backgroundColor: '#2563EB',
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
  backupDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 12,
  },
  syncStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 14,
  },
  syncLabel: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  syncValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
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
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
  },
  backupBtnText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 13,
  },
  restoreBtn: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
  },
  restoreBtnText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 13,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    height: 48,
    borderRadius: 10,
    marginTop: 8,
  },
  signOutBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },
});
