import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Transaction, TransactionType } from '../types';
import { DatePickerModal } from '../components';
import {
  parseRupeesToPaise,
  formatDatePill,
} from '../utils';
import { useTheme } from '../theme';

interface EntryModalProps {
  visible: boolean;
  partyName: string;
  initialType: TransactionType;
  existingTransaction?: Transaction | null;
  onClose: () => void;
  onSave: (
    type: TransactionType,
    amountPaise: number,
    note: string | null,
    date: number,
    transactionId?: string
  ) => Promise<void>;
  onDelete?: (transactionId: string) => Promise<void>;
}

export const EntryModal: React.FC<EntryModalProps> = ({
  visible,
  partyName,
  initialType,
  existingTransaction,
  onClose,
  onSave,
  onDelete,
}) => {
  const { colors, isDark } = useTheme();
  const isEditing = !!existingTransaction;
  const [type, setType] = useState<TransactionType>(initialType);
  const [amountInput, setAmountInput] = useState('');
  const [note, setNote] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync state when opened or existingTransaction changes
  useEffect(() => {
    if (visible) {
      if (existingTransaction) {
        setType(existingTransaction.type);
        const paise = existingTransaction.amount_paise;
        const whole = Math.floor(paise / 100);
        const frac = paise % 100;
        setAmountInput(frac > 0 ? `${whole}.${frac.toString().padStart(2, '0')}` : `${whole}`);
        setNote(existingTransaction.note || '');
        setSelectedDate(new Date(existingTransaction.date));
      } else {
        setType(initialType);
        setAmountInput('');
        setNote('');
        setSelectedDate(new Date());
      }
      setErrorMessage('');
      setIsSubmitting(false);
    }
  }, [visible, existingTransaction, initialType]);

  const handleSave = async () => {
    const amountPaise = parseRupeesToPaise(amountInput);
    if (amountPaise <= 0) {
      setErrorMessage('Please enter an amount greater than ₹0');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await onSave(
        type,
        amountPaise,
        note.trim() || null,
        selectedDate.getTime(),
        existingTransaction?.id
      );
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!existingTransaction || !onDelete) return;

    Alert.alert(
      'Delete Entry',
      'Are you sure you want to permanently delete this transaction entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              await onDelete(existingTransaction.id);
              onClose();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete transaction');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const activeColor = type === 'GAVE' ? colors.gave : colors.got;
  const headerAmount = amountInput ? `₹ ${amountInput}` : '₹ 0';
  const headerTitle =
    type === 'GOT'
      ? `You got ${headerAmount} from ${partyName}`
      : `You gave ${headerAmount} to ${partyName}`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={[styles.headerTitle, { color: activeColor }]} numberOfLines={1}>
                {headerTitle}
              </Text>
            </View>

            {isEditing && onDelete ? (
              <TouchableOpacity
                style={styles.headerRightBtn}
                onPress={handleDelete}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                disabled={isSubmitting}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.gave} />
              </TouchableOpacity>
            ) : (
              <View style={styles.headerRightPlaceholder} />
            )}
          </View>

          {/* Khatabook Form Body with Keyboard Avoidance */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardContainer}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Type Switcher Pills */}
              <View style={styles.typeSelectorRow}>
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    {
                      borderColor: type === 'GAVE' ? colors.gave : colors.border,
                      backgroundColor: type === 'GAVE' ? colors.gave : colors.card,
                    },
                  ]}
                  onPress={() => setType('GAVE')}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="arrow-up-circle-outline"
                    size={16}
                    color={type === 'GAVE' ? '#FFFFFF' : colors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.typeBtnText,
                      { color: type === 'GAVE' ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    YOU GAVE
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    {
                      borderColor: type === 'GOT' ? colors.got : colors.border,
                      backgroundColor: type === 'GOT' ? colors.got : colors.card,
                    },
                  ]}
                  onPress={() => setType('GOT')}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="arrow-down-circle-outline"
                    size={16}
                    color={type === 'GOT' ? '#FFFFFF' : colors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.typeBtnText,
                      { color: type === 'GOT' ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    YOU GOT
                  </Text>
                </TouchableOpacity>
              </View>

              {errorMessage ? (
                <View style={[styles.errorBanner, { backgroundColor: colors.gaveBg }]}>
                  <Text style={[styles.errorText, { color: colors.gaveText }]}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Large Amount Input Card */}
              <View style={[styles.amountCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.amountCardLabel, { color: colors.textSecondary }]}>
                  ENTER AMOUNT
                </Text>
                <View style={styles.amountInputRow}>
                  <Text style={[styles.currencySymbol, { color: activeColor }]}>₹</Text>
                  <TextInput
                    style={[styles.amountInput, { color: activeColor }]}
                    placeholder="0"
                    placeholderTextColor={colors.border}
                    keyboardType="decimal-pad"
                    autoFocus
                    value={amountInput}
                    onChangeText={(text) => {
                      setAmountInput(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                    maxLength={10}
                  />
                </View>
              </View>

              {/* Date Picker Pill: [📅 23 Nov 26 ▼] */}
              <View style={styles.datePillContainer}>
                <TouchableOpacity
                  style={[
                    styles.datePill,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setIsDatePickerOpen(true)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="calendar-month-outline"
                    size={18}
                    color={activeColor}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[styles.datePillText, { color: colors.textPrimary }]}>
                    {formatDatePill(selectedDate.getTime())}
                  </Text>
                  <MaterialCommunityIcons
                    name="menu-down"
                    size={20}
                    color={colors.textSecondary}
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              </View>

              {/* Details / Note Input */}
              <View style={[styles.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.noteLabel, { color: colors.textSecondary }]}>DETAILS / NOTE</Text>
                <TextInput
                  style={[
                    styles.noteInput,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="Enter details (Items, bill no., quantity, etc.)"
                  placeholderTextColor={colors.textMuted}
                  value={note}
                  onChangeText={setNote}
                  multiline
                  numberOfLines={3}
                  maxLength={150}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            {/* Save Button sits prominently above keyboard */}
            <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: activeColor },
                  isSubmitting && styles.saveBtnDisabled,
                ]}
                onPress={handleSave}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                <Text style={styles.saveBtnText}>
                  {isSubmitting ? 'SAVING...' : 'SAVE'}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>

        {/* Date Picker Modal */}
        <DatePickerModal
          visible={isDatePickerOpen}
          selectedDate={selectedDate}
          onSelectDate={(newDate) => setSelectedDate(newDate)}
          onClose={() => setIsDatePickerOpen(false)}
          accentColor={activeColor}
        />
      </SafeAreaView>
    </Modal>
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
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    paddingRight: 10,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerRightBtn: {
    padding: 6,
  },
  headerRightPlaceholder: {
    width: 24,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 24,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  errorBanner: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  amountCard: {
    borderRadius: 14,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  amountCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbol: {
    fontSize: 38,
    fontWeight: '700',
    marginRight: 6,
  },
  amountInput: {
    fontSize: 44,
    fontWeight: '800',
    minWidth: 140,
    textAlign: 'center',
    paddingVertical: 0,
  },
  datePillContainer: {
    alignItems: 'center',
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 22,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  datePillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  noteCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 74,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    elevation: 8,
  },
  saveBtn: {
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
});
