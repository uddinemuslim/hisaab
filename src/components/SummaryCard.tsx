import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DashboardSummary } from '../types';
import { formatPaiseToRupees, COLOR_GET, COLOR_GIVE } from '../utils';

interface SummaryCardProps {
  summary: DashboardSummary;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary }) => {
  return (
    <View style={styles.cardContainer}>
      {/* Total You Will Get (Left) */}
      <View style={[styles.column, styles.borderRight]}>
        <Text style={styles.label}>YOU WILL GET</Text>
        <Text style={[styles.amount, { color: COLOR_GET }]} numberOfLines={1} adjustsFontSizeToFit>
          {formatPaiseToRupees(summary.totalWillGetPaise, { absolute: true })}
        </Text>
        <Text style={styles.subtext}>Receivable</Text>
      </View>

      {/* Total You Will Give (Right) */}
      <View style={styles.column}>
        <Text style={styles.label}>YOU WILL GIVE</Text>
        <Text style={[styles.amount, { color: COLOR_GIVE }]} numberOfLines={1} adjustsFontSizeToFit>
          {formatPaiseToRupees(summary.totalWillGivePaise, { absolute: true })}
        </Text>
        <Text style={styles.subtext}>Payable</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  borderRight: {
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  amount: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  subtext: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});
