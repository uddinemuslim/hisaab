import { formatPaiseToRupees } from './currency';

/**
 * Builds a clean, professional WhatsApp text summary for a party.
 */
export function buildWhatsAppMessage(partyName: string, netBalancePaise: number): string {
  const amountStr = formatPaiseToRupees(Math.abs(netBalancePaise), { alwaysDecimals: false });

  if (netBalancePaise > 0) {
    return `Hello ${partyName},\n\nThis is a friendly reminder regarding our account balance. Your pending balance is ${amountStr}.\n\nPlease arrange for the payment at your convenience.\n\nThank you,\nShared via HISAAB`;
  } else if (netBalancePaise < 0) {
    return `Hello ${partyName},\n\nRegarding our account balance, I have a pending balance of ${amountStr} to pay you.\n\nPlease share your payment details so I can settle it.\n\nThank you,\nShared via HISAAB`;
  } else {
    return `Hello ${partyName},\n\nOur account is completely settled with a balance of ₹0.\n\nThank you,\nShared via HISAAB`;
  }
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
  phone?: string | null
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Linking, Alert } = require('react-native');
  const text = buildWhatsAppMessage(partyName, netBalancePaise);
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
