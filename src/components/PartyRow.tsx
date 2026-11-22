import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Party } from '../types';
import {
  formatPaiseToRupees,
  getBalanceColor,
  getBalanceLabel,
  formatDate,
} from '../utils';

interface PartyRowProps {
  party: Party;
  onPress: () => void;
}

export const PartyRow: React.FC<PartyRowProps> = ({ party, onPress }) => {
  const balance = party.net_balance_paise || 0;
  const balanceColor = getBalanceColor(balance);
  const balanceLabel = getBalanceLabel(balance);
  const formattedBalance = formatPaiseToRupees(Math.abs(balance));
  const initial = party.name ? party.name.charAt(0).toUpperCase() : '?';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.65}
    >
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: getAvatarBg(party.name) }]}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>

      {/* Info: Name, phone, last transaction */}
      <View style={styles.infoCol}>
        <Text style={styles.name} numberOfLines={1}>
          {party.name}
        </Text>
        <View style={styles.metaRow}>
          {party.phone ? (
            <Text style={styles.phone} numberOfLines={1}>
              {party.phone}
            </Text>
          ) : null}
          {party.last_transaction_date ? (
            <Text style={styles.date}>
              {party.phone ? ' • ' : ''}
              {formatDate(party.last_transaction_date)}
            </Text>
          ) : (
            <Text style={styles.date}>
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
function getAvatarBg(name: string): string {
  const colors = [
    '#E0E7FF', // indigo
    '#FCE7F3', // pink
    '#FEF3C7', // amber
    '#DCFCE7', // emerald
    '#E0F2FE', // sky
    '#EDE9FE', // violet
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
    color: '#1F2937',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phone: {
    fontSize: 13,
    color: '#6B7280',
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
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
