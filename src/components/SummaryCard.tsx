import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DashboardSummary } from '../types';
import { formatPaiseToRupees } from '../utils';
import { useTheme } from '../theme';

interface SummaryCardProps {
  summary: DashboardSummary;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Total You Will Get (Left) */}
      <View style={[styles.column, styles.borderRight, { borderRightColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>YOU WILL GET</Text>
        <Text style={[styles.amount, { color: colors.got }]} numberOfLines={1} adjustsFontSizeToFit>
          {formatPaiseToRupees(summary.totalWillGetPaise, { absolute: true })}
        </Text>
        <Text style={[styles.subtext, { color: colors.textMuted }]}>Receivable</Text>
      </View>

      {/* Total You Will Give (Right) */}
      <View style={styles.column}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>YOU WILL GIVE</Text>
        <Text style={[styles.amount, { color: colors.gave }]} numberOfLines={1} adjustsFontSizeToFit>
          {formatPaiseToRupees(summary.totalWillGivePaise, { absolute: true })}
        </Text>
        <Text style={[styles.subtext, { color: colors.textMuted }]}>Payable</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  borderRight: {
    borderRightWidth: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
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
  },
});
