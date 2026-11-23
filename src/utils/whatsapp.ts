import { formatPaiseToRupees } from './currency';
import { formatDate } from './date';

/**
 * Builds a clean, professional reminder text for WhatsApp / SMS.
 * Appends developer attribution: "App developed by moslem: https://github.com/uddinemuslim".
 */
export function buildWhatsAppMessage(
  partyName: string,
  netBalancePaise: number,
  date?: number | string | Date
): string {
  const amountStr = formatPaiseToRupees(Math.abs(netBalancePaise), { alwaysDecimals: false });
  const dateStr = date
    ? ` as of ${formatDate(typeof date === 'number' ? date : new Date(date).getTime())}`
    : '';

  let body = '';
  if (netBalancePaise > 0) {
    body = `Hello ${partyName},\n\nThis is a friendly reminder regarding our account balance${dateStr}. Your pending balance is ${amountStr}.\n\nPlease arrange for the payment at your convenience.`;
  } else if (netBalancePaise < 0) {
    body = `Hello ${partyName},\n\nRegarding our account balance${dateStr}, I have a pending balance of ${amountStr} to pay you.\n\nPlease share your payment details so I can settle it.`;
  } else {
    body = `Hello ${partyName},\n\nOur account${dateStr} is completely settled with a balance of ₹0.`;
  }

  return `${body}\n\nThank you,\nShared via HISAAB\nApp developed by moslem: https://github.com/uddinemuslim`;
}

/**
 * Clean phone number for WhatsApp deep link.
 */
export function formatPhoneNumberForWhatsApp(phone?: string | null): string {
  if (!phone) return '';
  const digitsOnly = phone.replace(/\D/g, '');
  // If 10 digits (common Indian mobile), prefix with 91
  if (digitsOnly.length === 10) {
    return `91${digitsOnly}`;
  }
  return digitsOnly;
}

/**
 * Open WhatsApp with pre-filled message.
 */
export async function shareViaWhatsApp(
  partyName: string,
  netBalancePaise: number,
  phone?: string | null,
  date?: number | string | Date
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Linking, Alert } = require('react-native');
  const text = buildWhatsAppMessage(partyName, netBalancePaise, date);
  const encodedText = encodeURIComponent(text);
  const cleanedPhone = formatPhoneNumberForWhatsApp(phone);

  const nativeUrl = cleanedPhone
    ? `whatsapp://send?phone=${cleanedPhone}&text=${encodedText}`
    : `whatsapp://send?text=${encodedText}`;

  const webUrl = cleanedPhone
    ? `https://wa.me/${cleanedPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  try {
    const supported = await Linking.canOpenURL(nativeUrl);
    if (supported) {
      await Linking.openURL(nativeUrl);
    } else {
      await Linking.openURL(webUrl);
    }
  } catch (error) {
    Alert.alert('Cannot Open WhatsApp', 'Please ensure WhatsApp is installed on your device.');
  }
}

/**
 * Open default SMS messenger with pre-filled message.
 * Format: Linking.openURL('sms:${phone}?body=${encodedText}')
 */
export async function shareViaSMS(
  partyName: string,
  netBalancePaise: number,
  phone?: string | null,
  date?: number | string | Date
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Linking, Alert, Platform } = require('react-native');
  const text = buildWhatsAppMessage(partyName, netBalancePaise, date);
  const encodedText = encodeURIComponent(text);
  const rawDigits = phone ? phone.replace(/[^\d+]/g, '') : '';

  // Linking.openURL('sms:${phone}?body=${encodedText}')
  const url = rawDigits
    ? (Platform.OS === 'ios' ? `sms:${rawDigits}&body=${encodedText}` : `sms:${rawDigits}?body=${encodedText}`)
    : (Platform.OS === 'ios' ? `sms:&body=${encodedText}` : `sms:?body=${encodedText}`);

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      await Linking.openURL(`sms:${rawDigits}`);
    }
  } catch (error) {
    Alert.alert('Cannot Open SMS', 'Could not open messaging app on this device.');
  }
}
