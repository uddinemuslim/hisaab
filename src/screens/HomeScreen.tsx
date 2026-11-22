import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Party, DashboardSummary, AuthState } from '../types';
import {
  getPartiesWithBalances,
  getDashboardSummary,
  createParty,
} from '../db';
import { triggerDebouncedAutoBackup, subscribeSyncStatus, SyncStatus } from '../services';
import { SummaryCard, PartyRow, AddPartyModal } from '../components';

interface HomeScreenProps {
  authState: AuthState;
  onSelectParty: (partyId: string) => void;
  onOpenSettings: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  authState,
  onSelectParty,
  onOpenSettings,
}) => {
  const [parties, setParties] = useState<Party[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>({
    totalWillGetPaise: 0,
    totalWillGivePaise: 0,
    netBalancePaise: 0,
    totalParties: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSyncedAt: authState.lastSyncedAt,
    error: null,
  });

  // Subscribe to drive sync status
  useEffect(() => {
    const unsubscribe = subscribeSyncStatus(setSyncStatus);
    return () => unsubscribe();
  }, []);

  const loadData = useCallback(async (query: string = searchQuery) => {
    try {
      const [partiesData, summaryData] = await Promise.all([
        getPartiesWithBalances(query),
        getDashboardSummary(),
      ]);
      setParties(partiesData);
      setSummary(summaryData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadData(searchQuery);
  }, [searchQuery, loadData]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleAddParty = async (name: string, phone: string | null) => {
    await createParty(name, phone);
    await loadData();
    triggerDebouncedAutoBackup();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>HISAAB</Text>
            <Text style={styles.headerSubtitle}>
              {authState.mode === 'google'
                ? `Signed in as ${authState.user?.name || 'Google'}`
                : 'Guest Mode (Offline)'}
            </Text>
          </View>

          <View style={styles.headerActions}>
            {syncStatus.isSyncing && (
              <View style={styles.syncingPill}>
                <Text style={styles.syncingText}>Syncing...</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={onOpenSettings}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="cog-outline" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dashboard Summary Card */}
        <SummaryCard summary={summary} />

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search party by name or phone..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Party Count Bar */}
        <View style={styles.partyBar}>
          <Text style={styles.partyBarTitle}>PARTIES ({parties.length})</Text>
        </View>

        {/* Parties List */}
        <FlatList
          data={parties}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PartyRow
              party={item}
              onPress={() => onSelectParty(item.id)}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#2563EB']} />
          }
          contentContainerStyle={parties.length === 0 ? styles.emptyContainer : styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <MaterialCommunityIcons name="account-group-outline" size={54} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No matching parties found' : 'No parties yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Try searching with a different name or phone number'
                  : 'Tap "+ Add Party" below to record your first credit or debit.'}
              </Text>
            </View>
          }
        />

        {/* Floating Add Party FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setIsAddModalOpen(true)}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
          <Text style={styles.fabText}>Add Party</Text>
        </TouchableOpacity>

        {/* Add Party Modal */}
        <AddPartyModal
          visible={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddParty}
        />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 1.2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncingPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  syncingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  settingsBtn: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  partyBar: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
  },
  partyBarTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.8,
  },
  listContent: {
    paddingBottom: 90,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 90,
  },
  emptyView: {
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 28,
    elevation: 4,
    gap: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
