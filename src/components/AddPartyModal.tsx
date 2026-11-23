import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../theme';

interface AddPartyModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string, phone: string | null) => Promise<void>;
}

export const AddPartyModal: React.FC<AddPartyModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const { colors, isDark } = useTheme();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Please enter party name');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await onSubmit(trimmedName, phone.trim() || null);
      setName('');
      setPhone('');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save party');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setName('');
    setPhone('');
    setErrorMessage('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={[styles.dialog, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Add New Party</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Create a customer or vendor ledger
          </Text>

          {errorMessage ? (
            <Text style={[styles.errorText, { color: colors.gave }]}>{errorMessage}</Text>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Party Name *</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="e.g. Ramesh Kumar, Store, etc."
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errorMessage) setErrorMessage('');
              }}
              autoFocus
              maxLength={60}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Phone Number (Optional)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="e.g. 9876543210"
              placeholderTextColor={colors.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.btn,
                styles.cancelBtn,
                { backgroundColor: isDark ? colors.background : '#F3F4F6' },
              ]}
              onPress={handleCancel}
              disabled={isSubmitting}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btn,
                styles.saveBtn,
                { backgroundColor: colors.primary },
                isSubmitting && styles.btnDisabled,
              ]}
              onPress={handleSave}
              disabled={isSubmitting}
            >
              <Text style={styles.saveBtnText}>
                {isSubmitting ? 'Saving...' : 'Add Party'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
    padding: 20,
    elevation: 8,
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    marginBottom: 10,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 10,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  cancelBtn: {},
  cancelBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
  saveBtn: {},
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
