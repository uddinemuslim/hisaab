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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Transaction, TransactionType } from '../types';
import { DatePickerModal } from '../components';
import {
  parseRupeesToPaise,
  formatPaiseToRupees,
  COLOR_GET,
  COLOR_GIVE,
  formatDate,
} from '../utils';

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
        // Format paise to rupees string for editing (e.g. 50000 -> 500, 50050 -> 500.50)
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
      setErrorMessage('Please enter a valid amount greater than ₹0');
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

  const setDateToday = () => setSelectedDate(new Date());
  const setDateYesterday = () => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    setSelectedDate(y);
  };

  const activeColor = type === 'GAVE' ? COLOR_GIVE : COLOR_GET;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>
                {isEditing ? 'Edit Entry' : `Add Entry with ${partyName}`}
              </Text>
              <Text style={styles.headerSubtitle}>
                {type === 'GAVE' ? 'You gave money (Debit)' : 'You received money (Credit)'}
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            {/* Type Selector (GAVE / GOT) */}
            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  type === 'GAVE' && { backgroundColor: COLOR_GIVE, borderColor: COLOR_GIVE },
                ]}
                onPress={() => setType('GAVE')}
                activeOpacity={0.8}
              >
                <Text style={[styles.typeBtnText, type === 'GAVE' && styles.typeBtnTextActive]}>
                  YOU GAVE (OUT)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  type === 'GOT' && { backgroundColor: COLOR_GET, borderColor: COLOR_GET },
                ]}
                onPress={() => setType('GOT')}
                activeOpacity={0.8}
              >
                <Text style={[styles.typeBtnText, type === 'GOT' && styles.typeBtnTextActive]}>
                  YOU GOT (IN)
                </Text>
              </TouchableOpacity>
            </View>

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            {/* Amount Input with Numeric keypad focus */}
            <View style={styles.amountContainer}>
              <Text style={[styles.currencyPrefix, { color: activeColor }]}>₹</Text>
              <TextInput
                style={[styles.amountInput, { color: activeColor }]}
                placeholder="0"
                placeholderTextColor="#D1D5DB"
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

            {/* Date Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Date</Text>
              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={styles.currentDateBadge}
                  onPress={() => setIsDatePickerOpen(true)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="calendar-month-outline" size={18} color="#2563EB" />
                  <Text style={styles.currentDateText}>
                    {formatDate(selectedDate.getTime())}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={16} color="#6B7280" />
                </TouchableOpacity>

                <View style={styles.quickDateButtons}>
                  <TouchableOpacity
                    style={[
                      styles.quickDateBtn,
                      formatDate(selectedDate.getTime()) === 'Today' && styles.quickDateBtnActive,
                    ]}
                    onPress={setDateToday}
                  >
                    <Text
                      style={[
                        styles.quickDateText,
                        formatDate(selectedDate.getTime()) === 'Today' && styles.quickDateTextActive,
                      ]}
                    >
                      Today
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.quickDateBtn,
                      formatDate(selectedDate.getTime()) === 'Yesterday' && styles.quickDateBtnActive,
                    ]}
                    onPress={setDateYesterday}
                  >
                    <Text
                      style={[
                        styles.quickDateText,
                        formatDate(selectedDate.getTime()) === 'Yesterday' && styles.quickDateTextActive,
                      ]}
                    >
                      Yesterday
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Optional Note */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Note / Reason (Optional)</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="e.g. Grocery bill, Rent, Cash advance, etc."
                placeholderTextColor="#9CA3AF"
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={2}
                maxLength={120}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              {isEditing && onDelete ? (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={handleDelete}
                  disabled={isSubmitting}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color="#DC2626" />
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: activeColor },
                  isSubmitting && styles.btnDisabled,
                ]}
                onPress={handleSave}
                disabled={isSubmitting}
              >
                <Text style={styles.saveBtnText}>
                  {isSubmitting ? 'Saving...' : 'Save Entry'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={isDatePickerOpen}
        selectedDate={selectedDate}
        onSelectDate={(newDate) => setSelectedDate(newDate)}
        onClose={() => setIsDatePickerOpen(false)}
        accentColor={activeColor}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 16,
  },
  currencyPrefix: {
    fontSize: 36,
    fontWeight: '700',
    marginRight: 6,
  },
  amountInput: {
    fontSize: 40,
    fontWeight: '800',
    minWidth: 120,
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  currentDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  quickDateButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickDateBtn: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  quickDateBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  quickDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  quickDateTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  noteInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    textAlignVertical: 'top',
    minHeight: 52,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  deleteBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
