import { Linking, Alert } from 'react-native';
import { buildWhatsAppMessage, formatPhoneNumberForWhatsApp } from './whatsappUtils';

export * from './whatsappUtils';

/**
 * Open WhatsApp with pre-filled message.
 */
export async function shareViaWhatsApp(partyName: string, netBalancePaise: number, phone?: string | null): Promise<void> {
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
