import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  Modal,
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
  updateParty,
} from '../db';
import { triggerDebouncedAutoBackup } from '../services';
import {
  formatPaiseToRupees,
  getBalanceLabel,
  formatDate,
  formatTime,
  shareViaWhatsApp,
  shareViaSMS,
} from '../utils';
import { EntryModal } from './EntryModal';
import { EditPartyModal } from '../components';
import { useTheme } from '../theme';

interface PartyDetailScreenProps {
  partyId: string;
  onBack: () => void;
}

export const PartyDetailScreen: React.FC<PartyDetailScreenProps> = ({
  partyId,
  onBack,
}) => {
  const { colors, isDark } = useTheme();
  const [party, setParty] = useState<Party | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Menu states
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryModalType, setEntryModalType] = useState<TransactionType>('GAVE');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [isEditPartyOpen, setIsEditPartyOpen] = useState(false);
  const [isReminderMenuOpen, setIsReminderMenuOpen] = useState(false);

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

  const handleUpdateParty = async (name: string, phone: string | null) => {
    await updateParty(partyId, name, phone);
    await loadData();
    triggerDebouncedAutoBackup();
  };

  const handleDeleteParty = () => {
    setIsActionsMenuOpen(false);
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

  const handleOpenWhatsAppReminder = () => {
    setIsReminderMenuOpen(false);
    shareViaWhatsApp(
      party?.name || '',
      netBalance,
      party?.phone,
      party?.last_transaction_date || Date.now()
    );
  };

  const handleOpenSmsReminder = () => {
    setIsReminderMenuOpen(false);
    shareViaSMS(
      party?.name || '',
      netBalance,
      party?.phone,
      party?.last_transaction_date || Date.now()
    );
  };

  const netBalance = party?.net_balance_paise || 0;
  const balanceColor = netBalance > 0 ? colors.got : netBalance < 0 ? colors.gave : colors.settled;
  const balanceLabel = getBalanceLabel(netBalance);
  const formattedBalance = formatPaiseToRupees(Math.abs(netBalance));

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Top Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={[styles.partyName, { color: colors.textPrimary }]} numberOfLines={1}>
              {party?.name || 'Loading...'}
            </Text>
            {party?.phone ? (
              <Text style={[styles.partyPhone, { color: colors.textSecondary }]} numberOfLines={1}>
                {party.phone}
              </Text>
            ) : null}
          </View>

          <View style={styles.headerActions}>
            {/* Reminder Button (WhatsApp / SMS selector) */}
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => setIsReminderMenuOpen(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="bell-ring-outline" size={24} color={colors.primary} />
            </TouchableOpacity>

            {/* 3-Dot Menu Button (Edit Party / Delete Party) */}
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => setIsActionsMenuOpen(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="dots-vertical" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Net Balance Banner */}
        <View style={[styles.balanceBanner, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.balanceBannerLabel, { color: colors.textSecondary }]}>NET BALANCE</Text>
            <Text style={[styles.balanceBannerStatus, { color: balanceColor }]}>
              {balanceLabel}
            </Text>
          </View>
          <Text style={[styles.balanceBannerAmount, { color: balanceColor }]}>
            {formattedBalance}
          </Text>
        </View>

        {/* Transactions Table Column Headers */}
        <View style={[styles.tableHeader, { backgroundColor: isDark ? colors.background : '#F3F4F6', borderBottomColor: colors.border }]}>
          <Text style={[styles.tableHeaderCol, { flex: 1.4, color: colors.textSecondary }]}>ENTRIES ({transactions.length})</Text>
          <Text style={[styles.tableHeaderCol, styles.colGive, { color: colors.gave }]}>YOU GAVE</Text>
          <Text style={[styles.tableHeaderCol, styles.colGet, { color: colors.got }]}>YOU GOT</Text>
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
                style={[styles.entryRow, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}
                onPress={() => handleOpenEditEntry(item)}
                activeOpacity={0.65}
              >
                {/* Date & Note Info */}
                <View style={styles.entryMeta}>
                  <Text style={[styles.entryDate, { color: colors.textPrimary }]}>{formatDate(item.date)}</Text>
                  <Text style={[styles.entryTime, { color: colors.textMuted }]}>{formatTime(item.date)}</Text>
                  {item.note ? (
                    <Text
                      style={[
                        styles.entryNote,
                        {
                          backgroundColor: isDark ? colors.background : '#F9FAFB',
                          color: colors.textSecondary,
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {item.note}
                    </Text>
                  ) : null}
                </View>

                {/* GAVE Column (Red) */}
                <View style={styles.colAmount}>
                  {isGave ? (
                    <View style={[styles.amountPillGive, { backgroundColor: colors.gaveBg }]}>
                      <Text style={[styles.amountTextGive, { color: colors.gaveText }]}>{formattedAmount}</Text>
                    </View>
                  ) : null}
                </View>

                {/* GOT Column (Green) */}
                <View style={styles.colAmount}>
                  {!isGave ? (
                    <View style={[styles.amountPillGet, { backgroundColor: colors.gotBg }]}>
                      <Text style={[styles.amountTextGet, { color: colors.gotText }]}>{formattedAmount}</Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No transactions recorded</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Use the buttons below to record when you gave or received money from {party?.name}.
              </Text>
            </View>
          }
        />

        {/* Sticky Bottom Bar with 'YOU GAVE ₹' (Red) and 'YOU GOT ₹' (Green) */}
        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.bottomBtn, { backgroundColor: colors.gave }]}
            onPress={() => handleOpenNewEntry('GAVE')}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="arrow-up-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.bottomBtnText}>YOU GAVE ₹</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bottomBtn, { backgroundColor: colors.got }]}
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

        {/* Edit Party Modal */}
        {party && (
          <EditPartyModal
            visible={isEditPartyOpen}
            initialName={party.name}
            initialPhone={party.phone}
            onClose={() => setIsEditPartyOpen(false)}
            onSubmit={handleUpdateParty}
          />
        )}

        {/* 3-Dot Actions Menu Modal */}
        <Modal
          visible={isActionsMenuOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsActionsMenuOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsActionsMenuOpen(false)}
          >
            <View style={[styles.menuSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.menuTitle, { color: colors.textSecondary }]}>
                {party?.name || 'Party Actions'}
              </Text>

              <TouchableOpacity
                style={[styles.menuOption, { borderBottomColor: colors.borderLight }]}
                onPress={() => {
                  setIsActionsMenuOpen(false);
                  setIsEditPartyOpen(true);
                }}
              >
                <MaterialCommunityIcons name="pencil-outline" size={22} color={colors.primary} style={styles.menuOptionIcon} />
                <Text style={[styles.menuOptionText, { color: colors.textPrimary }]}>Edit Party</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuOption}
                onPress={handleDeleteParty}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.gave} style={styles.menuOptionIcon} />
                <Text style={[styles.menuOptionText, { color: colors.gave }]}>Delete Party</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuCancelBtn, { backgroundColor: isDark ? colors.background : '#F3F4F6' }]}
                onPress={() => setIsActionsMenuOpen(false)}
              >
                <Text style={[styles.menuCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Reminder Options Modal */}
        <Modal
          visible={isReminderMenuOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsReminderMenuOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsReminderMenuOpen(false)}
          >
            <View style={[styles.menuSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.menuTitle, { color: colors.textSecondary }]}>
                Send Payment Reminder to {party?.name}
              </Text>

              <TouchableOpacity
                style={[styles.menuOption, { borderBottomColor: colors.borderLight }]}
                onPress={handleOpenWhatsAppReminder}
              >
                <MaterialCommunityIcons name="whatsapp" size={24} color="#25D366" style={styles.menuOptionIcon} />
                <View style={styles.menuOptionTextBox}>
                  <Text style={[styles.menuOptionText, { color: colors.textPrimary }]}>WhatsApp</Text>
                  <Text style={[styles.menuOptionSubtext, { color: colors.textSecondary }]}>
                    Send detailed balance reminder via WhatsApp
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuOption}
                onPress={handleOpenSmsReminder}
              >
                <MaterialCommunityIcons name="message-text-outline" size={24} color={colors.primary} style={styles.menuOptionIcon} />
                <View style={styles.menuOptionTextBox}>
                  <Text style={[styles.menuOptionText, { color: colors.textPrimary }]}>SMS (Text Message)</Text>
                  <Text style={[styles.menuOptionSubtext, { color: colors.textSecondary }]}>
                    Send balance text message via SMS
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuCancelBtn, { backgroundColor: isDark ? colors.background : '#F3F4F6' }]}
                onPress={() => setIsReminderMenuOpen(false)}
              >
                <Text style={[styles.menuCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
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
  },
  partyPhone: {
    fontSize: 13,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIconBtn: {
    padding: 6,
  },
  balanceBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  balanceBannerLabel: {
    fontSize: 11,
    fontWeight: '700',
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
    borderBottomWidth: 1,
  },
  tableHeaderCol: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  colGive: {
    flex: 1,
    textAlign: 'right',
  },
  colGet: {
    flex: 1,
    textAlign: 'right',
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
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  entryMeta: {
    flex: 1.4,
    justifyContent: 'center',
  },
  entryDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  entryTime: {
    fontSize: 11,
    marginTop: 1,
  },
  entryNote: {
    fontSize: 12,
    marginTop: 4,
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
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  amountTextGive: {
    fontSize: 14,
    fontWeight: '700',
  },
  amountPillGet: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  amountTextGet: {
    fontSize: 14,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
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
  bottomBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    borderWidth: 1,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 14,
    textAlign: 'center',
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  menuOptionIcon: {
    marginRight: 14,
  },
  menuOptionTextBox: {
    flex: 1,
  },
  menuOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuOptionSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  menuCancelBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  menuCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
