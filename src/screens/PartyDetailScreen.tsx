import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Party, Transaction, TransactionType } from '../types';
import {
  getPartyById,
  getTransactionsForParty,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  deleteParty,
} from '../db';
import { triggerDebouncedAutoBackup } from '../services';
import {
  formatPaiseToRupees,
  getBalanceColor,
  getBalanceLabel,
  formatDate,
  formatTime,
  shareViaWhatsApp,
  COLOR_GET,
  COLOR_GIVE,
} from '../utils';
import { EntryModal } from './EntryModal';

interface PartyDetailScreenProps {
  partyId: string;
  onBack: () => void;
}

export const PartyDetailScreen: React.FC<PartyDetailScreenProps> = ({
  partyId,
  onBack,
}) => {
  const [party, setParty] = useState<Party | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryModalType, setEntryModalType] = useState<TransactionType>('GAVE');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [partyData, txData] = await Promise.all([
        getPartyById(partyId),
        getTransactionsForParty(partyId),
      ]);
      setParty(partyData);
      setTransactions(txData);
    } catch (err) {
      console.error('Failed to load party details:', err);
    } finally {
      setIsLoading(false);
    }
  }, [partyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenNewEntry = (type: TransactionType) => {
    setSelectedTx(null);
    setEntryModalType(type);
    setIsEntryModalOpen(true);
  };

  const handleOpenEditEntry = (tx: Transaction) => {
    setSelectedTx(tx);
    setEntryModalType(tx.type);
    setIsEntryModalOpen(true);
  };

  const handleSaveEntry = async (
    type: TransactionType,
    amountPaise: number,
    note: string | null,
    date: number,
    transactionId?: string
  ) => {
    if (transactionId) {
      await updateTransaction(transactionId, type, amountPaise, note, date);
    } else {
      await createTransaction(partyId, type, amountPaise, note, date);
    }
    await loadData();
    triggerDebouncedAutoBackup();
  };

  const handleDeleteEntry = async (transactionId: string) => {
    await deleteTransaction(transactionId);
    await loadData();
    triggerDebouncedAutoBackup();
  };

  const handleDeleteParty = () => {
    Alert.alert(
      'Delete Party',
      `Are you sure you want to delete ${party?.name || 'this party'} and all associated ledger records? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            await deleteParty(partyId);
            triggerDebouncedAutoBackup();
            onBack();
          },
        },
      ]
    );
  };

  const netBalance = party?.net_balance_paise || 0;
  const balanceColor = getBalanceColor(netBalance);
  const balanceLabel = getBalanceLabel(netBalance);
  const formattedBalance = formatPaiseToRupees(Math.abs(netBalance));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.partyName} numberOfLines={1}>
              {party?.name || 'Loading...'}
            </Text>
            {party?.phone ? (
              <Text style={styles.partyPhone} numberOfLines={1}>
                {party.phone}
              </Text>
            ) : null}
          </View>

          <View style={styles.headerActions}>
            {/* WhatsApp Share Button */}
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => shareViaWhatsApp(party?.name || '', netBalance, party?.phone)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="whatsapp" size={24} color="#25D366" />
            </TouchableOpacity>

            {/* Delete Party Option */}
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={handleDeleteParty}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="dots-vertical" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Net Balance Banner */}
        <View style={styles.balanceBanner}>
          <View>
            <Text style={styles.balanceBannerLabel}>NET BALANCE</Text>
            <Text style={[styles.balanceBannerStatus, { color: balanceColor }]}>
              {balanceLabel}
            </Text>
          </View>
          <Text style={[styles.balanceBannerAmount, { color: balanceColor }]}>
            {formattedBalance}
          </Text>
        </View>

        {/* Transactions Table Column Headers */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCol, { flex: 1.4 }]}>ENTRIES ({transactions.length})</Text>
          <Text style={[styles.tableHeaderCol, styles.colGive]}>YOU GAVE</Text>
          <Text style={[styles.tableHeaderCol, styles.colGet]}>YOU GOT</Text>
        </View>

        {/* Chronological List of Entries */}
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={transactions.length === 0 ? styles.emptyContainer : styles.listContent}
          renderItem={({ item }) => {
            const isGave = item.type === 'GAVE';
            const formattedAmount = formatPaiseToRupees(item.amount_paise, { absolute: true });

            return (
              <TouchableOpacity
                style={styles.entryRow}
                onPress={() => handleOpenEditEntry(item)}
                activeOpacity={0.65}
              >
                {/* Date & Note Info */}
                <View style={styles.entryMeta}>
                  <Text style={styles.entryDate}>{formatDate(item.date)}</Text>
                  <Text style={styles.entryTime}>{formatTime(item.date)}</Text>
                  {item.note ? (
                    <Text style={styles.entryNote} numberOfLines={2}>
                      {item.note}
                    </Text>
                  ) : null}
                </View>

                {/* GAVE Column (Red) */}
                <View style={styles.colAmount}>
                  {isGave ? (
                    <View style={styles.amountPillGive}>
                      <Text style={styles.amountTextGive}>{formattedAmount}</Text>
                    </View>
                  ) : null}
                </View>

                {/* GOT Column (Green) */}
                <View style={styles.colAmount}>
                  {!isGave ? (
                    <View style={styles.amountPillGet}>
                      <Text style={styles.amountTextGet}>{formattedAmount}</Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No transactions recorded</Text>
              <Text style={styles.emptySubtitle}>
                Use the buttons below to record when you gave or received money from {party?.name}.
              </Text>
            </View>
          }
        />

        {/* Sticky Bottom Bar with 'YOU GAVE ₹' (Red) and 'YOU GOT ₹' (Green) */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.bottomBtn, styles.btnGave]}
            onPress={() => handleOpenNewEntry('GAVE')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="arrow-up-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.bottomBtnText}>YOU GAVE ₹</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bottomBtn, styles.btnGot]}
            onPress={() => handleOpenNewEntry('GOT')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="arrow-down-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.bottomBtnText}>YOU GOT ₹</Text>
          </TouchableOpacity>
        </View>

        {/* Add/Edit Entry Modal */}
        <EntryModal
          visible={isEntryModalOpen}
          partyName={party?.name || ''}
          initialType={entryModalType}
          existingTransaction={selectedTx}
          onClose={() => setIsEntryModalOpen(false)}
          onSave={handleSaveEntry}
          onDelete={handleDeleteEntry}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    paddingRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  partyName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  partyPhone: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    padding: 6,
  },
  balanceBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  balanceBannerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.8,
  },
  balanceBannerStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  balanceBannerAmount: {
    fontSize: 24,
    fontWeight: '800',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableHeaderCol: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.6,
  },
  colGive: {
    flex: 1,
    textAlign: 'right',
    color: COLOR_GIVE,
  },
  colGet: {
    flex: 1,
    textAlign: 'right',
    color: COLOR_GET,
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
    marginTop: 40,
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
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  entryMeta: {
    flex: 1.4,
    justifyContent: 'center',
  },
  entryDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  entryTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  entryNote: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 4,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  colAmount: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountPillGive: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  amountTextGive: {
    fontSize: 14,
    fontWeight: '700',
    color: COLOR_GIVE,
  },
  amountPillGet: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  amountTextGet: {
    fontSize: 14,
    fontWeight: '700',
    color: COLOR_GET,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
    elevation: 8,
  },
  bottomBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 8,
    gap: 6,
  },
  btnGave: {
    backgroundColor: COLOR_GIVE,
  },
  btnGot: {
    backgroundColor: COLOR_GET,
  },
  bottomBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
