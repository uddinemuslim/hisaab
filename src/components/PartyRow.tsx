import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Party } from '../types';
import {
  formatPaiseToRupees,
  getBalanceLabel,
  formatDate,
} from '../utils';
import { useTheme } from '../theme';

interface PartyRowProps {
  party: Party;
  onPress: () => void;
}

export const PartyRow: React.FC<PartyRowProps> = ({ party, onPress }) => {
  const { colors, isDark } = useTheme();
  const balance = party.net_balance_paise || 0;
  const balanceColor = balance > 0 ? colors.got : balance < 0 ? colors.gave : colors.settled;
  const balanceLabel = getBalanceLabel(balance);
  const formattedBalance = formatPaiseToRupees(Math.abs(balance));
  const initial = party.name ? party.name.charAt(0).toUpperCase() : '?';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.borderLight,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.65}
    >
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: getAvatarBg(party.name, isDark) }]}>
        <Text style={[styles.avatarText, { color: isDark ? '#F1F5F9' : '#1F2937' }]}>{initial}</Text>
      </View>

      {/* Info: Name, phone, last transaction */}
      <View style={styles.infoCol}>
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
          {party.name}
        </Text>
        <View style={styles.metaRow}>
          {party.phone ? (
            <Text style={[styles.phone, { color: colors.textSecondary }]} numberOfLines={1}>
              {party.phone}
            </Text>
          ) : null}
          {party.last_transaction_date ? (
            <Text style={[styles.date, { color: colors.textMuted }]}>
              {party.phone ? ' • ' : ''}
              {formatDate(party.last_transaction_date)}
            </Text>
          ) : (
            <Text style={[styles.date, { color: colors.textMuted }]}>
              {party.phone ? ' • ' : ''}No entries yet
            </Text>
          )}
        </View>
      </View>

      {/* Net Balance Badge */}
      <View style={styles.balanceCol}>
        <Text style={[styles.balanceAmount, { color: balanceColor }]} numberOfLines={1}>
          {formattedBalance}
        </Text>
        <Text style={[styles.balanceStatus, { color: balanceColor }]}>
          {balanceLabel}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Generates consistent soft pastel backgrounds for avatars
function getAvatarBg(name: string, isDark: boolean): string {
  const lightColors = [
    '#E0E7FF', // indigo
    '#FCE7F3', // pink
    '#FEF3C7', // amber
    '#DCFCE7', // emerald
    '#E0F2FE', // sky
    '#EDE9FE', // violet
  ];
  const darkColors = [
    '#312E81', // indigo
    '#831843', // pink
    '#78350F', // amber
    '#064E3B', // emerald
    '#0C4A6E', // sky
    '#4C1D95', // violet
  ];
  const palette = isDark ? darkColors : lightColors;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phone: {
    fontSize: 13,
  },
  date: {
    fontSize: 12,
  },
  balanceCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  balanceStatus: {
    fontSize: 11,
    fontWeight: '600',
  },
});
