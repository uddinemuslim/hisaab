import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';

interface DatePickerModalProps {
  visible: boolean;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
  accentColor?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  selectedDate,
  onSelectDate,
  onClose,
  accentColor,
}) => {
  const { colors, isDark } = useTheme();
  const effectiveAccent = accentColor || colors.primary;

  const [viewYear, setViewYear] = useState<number>(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(selectedDate.getMonth());
  const [tempDate, setTempDate] = useState<Date>(selectedDate);

  useEffect(() => {
    if (visible) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
      setTempDate(new Date(selectedDate));
    }
  }, [visible, selectedDate]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const applyPreset = (daysOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysOffset);
    d.setHours(12, 0, 0, 0);
    setTempDate(d);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const handleDayPress = (day: number) => {
    const newDate = new Date(viewYear, viewMonth, day, 12, 0, 0, 0);
    setTempDate(newDate);
  };

  const handleConfirm = () => {
    onSelectDate(tempDate);
    onClose();
  };

  // Generate calendar days for viewMonth and viewYear
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday
  const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let day = 1; day <= totalDaysInMonth; day++) {
    calendarCells.push(day);
  }

  const today = new Date();
  const isToday = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === viewMonth &&
    today.getFullYear() === viewYear;

  const isSelected = (day: number) =>
    tempDate.getDate() === day &&
    tempDate.getMonth() === viewMonth &&
    tempDate.getFullYear() === viewYear;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.dialogContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Dialog Title */}
          <View style={[styles.dialogHeader, { borderBottomColor: colors.borderLight }]}>
            <View>
              <Text style={[styles.dialogTitle, { color: colors.textPrimary }]}>Select Date</Text>
              <Text style={[styles.dialogSubtitle, { color: colors.textSecondary }]}>
                {tempDate.toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Quick Presets Bar */}
          <View style={styles.presetsRow}>
            <TouchableOpacity
              style={[styles.presetChip, { backgroundColor: isDark ? colors.background : '#F3F4F6', borderColor: colors.border }]}
              onPress={() => applyPreset(0)}
            >
              <Text style={[styles.presetText, { color: colors.textPrimary }]}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.presetChip, { backgroundColor: isDark ? colors.background : '#F3F4F6', borderColor: colors.border }]}
              onPress={() => applyPreset(1)}
            >
              <Text style={[styles.presetText, { color: colors.textPrimary }]}>Yesterday</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.presetChip, { backgroundColor: isDark ? colors.background : '#F3F4F6', borderColor: colors.border }]}
              onPress={() => applyPreset(2)}
            >
              <Text style={[styles.presetText, { color: colors.textPrimary }]}>2 Days Ago</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.presetChip, { backgroundColor: isDark ? colors.background : '#F3F4F6', borderColor: colors.border }]}
              onPress={() => applyPreset(7)}
            >
              <Text style={[styles.presetText, { color: colors.textPrimary }]}>1 Week Ago</Text>
            </TouchableOpacity>
          </View>

          {/* Month / Year Navigator */}
          <View style={styles.monthNavRow}>
            <TouchableOpacity
              style={[styles.navArrowBtn, { backgroundColor: isDark ? colors.background : '#F9FAFB' }]}
              onPress={handlePrevMonth}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="chevron-left" size={24} color={colors.textPrimary} />
            </TouchableOpacity>

            <Text style={[styles.monthNavTitle, { color: colors.textPrimary }]}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>

            <TouchableOpacity
              style={[styles.navArrowBtn, { backgroundColor: isDark ? colors.background : '#F9FAFB' }]}
              onPress={handleNextMonth}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Day of Week Labels */}
          <View style={styles.dayLabelsRow}>
            {DAY_LABELS.map((label, index) => (
              <Text
                key={label}
                style={[
                  styles.dayLabelText,
                  { color: colors.textSecondary },
                  (index === 0 || index === 6) && { color: colors.textMuted },
                ]}
              >
                {label}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {calendarCells.map((day, index) => {
              if (day === null) {
                return <View key={`empty-${index}`} style={styles.dayCellEmpty} />;
              }

              const selected = isSelected(day);
              const currentToday = isToday(day);

              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  style={[
                    styles.dayCell,
                    selected && { backgroundColor: effectiveAccent },
                    currentToday && !selected && [styles.todayCell, { borderColor: effectiveAccent }],
                  ]}
                  onPress={() => handleDayPress(day)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayCellText,
                      { color: colors.textPrimary },
                      selected && styles.dayCellTextSelected,
                      currentToday && !selected && { color: effectiveAccent, fontWeight: '700' },
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Dialog Action Buttons */}
          <View style={styles.dialogActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: effectiveAccent }]}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmBtnText}>Set Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    padding: 20,
    elevation: 8,
    borderWidth: 1,
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  dialogSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 6,
  },
  presetChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 11,
    fontWeight: '600',
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navArrowBtn: {
    padding: 6,
    borderRadius: 6,
  },
  monthNavTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  dayLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  dayLabelText: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 19,
    marginVertical: 2,
  },
  dayCellEmpty: {
    width: `${100 / 7}%`,
    height: 38,
    marginVertical: 2,
  },
  todayCell: {
    borderWidth: 1.5,
  },
  dayCellText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dayCellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 18,
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
