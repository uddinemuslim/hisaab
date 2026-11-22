import assert from 'node:assert';
import {
  parseRupeesToPaise,
  formatPaiseToRupees,
  formatIndianNumber,
  COLOR_GET,
  COLOR_GIVE,
  COLOR_SETTLED,
  getBalanceColor,
  getBalanceLabel,
  getBalanceStatus,
} from '../src/utils/currency';
import {
  formatDate,
  formatDateTime,
  formatTime,
  formatRelativeSyncTime,
} from '../src/utils/date';
import {
  buildWhatsAppMessage,
  formatPhoneNumberForWhatsApp,
} from '../src/utils/whatsappUtils';
import { BackupPayload, Party, Transaction } from '../src/types';

console.log('--- RUNNING EXTENSIVE EDGE CASE SUITE ---');

// 1. Currency Parsing Edge Cases
assert.strictEqual(parseRupeesToPaise('0.1'), 10);
assert.strictEqual(parseRupeesToPaise('0.01'), 1);
assert.strictEqual(parseRupeesToPaise('0.001'), 0);
assert.strictEqual(parseRupeesToPaise('.99'), 99);
assert.strictEqual(parseRupeesToPaise('1.'), 100);
assert.strictEqual(parseRupeesToPaise('.'), 0);
assert.strictEqual(parseRupeesToPaise(''), 0);
assert.strictEqual(parseRupeesToPaise('   '), 0);
assert.strictEqual(parseRupeesToPaise('abc'), 0);
assert.strictEqual(parseRupeesToPaise('₹ 50,000.75'), 5000075);
assert.strictEqual(parseRupeesToPaise('99999999.99'), 9999999999);
console.log('✔ All parseRupeesToPaise edge cases passed.');

// 2. Currency Formatting Edge Cases
assert.strictEqual(formatPaiseToRupees(1), '₹0.01');
assert.strictEqual(formatPaiseToRupees(10), '₹0.10');
assert.strictEqual(formatPaiseToRupees(99), '₹0.99');
assert.strictEqual(formatPaiseToRupees(100), '₹1');
assert.strictEqual(formatPaiseToRupees(100, { alwaysDecimals: true }), '₹1.00');
assert.strictEqual(formatPaiseToRupees(100000000), '₹10,00,000');
assert.strictEqual(formatPaiseToRupees(-100000000, { showSign: true }), '-₹10,00,000');
assert.strictEqual(formatPaiseToRupees(-100000000, { absolute: true }), '₹10,00,000');
console.log('✔ All formatPaiseToRupees edge cases passed.');

// 3. Indian Numbering System
assert.strictEqual(formatIndianNumber(0), '0');
assert.strictEqual(formatIndianNumber(99), '99');
assert.strictEqual(formatIndianNumber(999), '999');
assert.strictEqual(formatIndianNumber(1000), '1,000');
assert.strictEqual(formatIndianNumber(10000), '10,000');
assert.strictEqual(formatIndianNumber(100000), '1,00,000');
assert.strictEqual(formatIndianNumber(1000000), '10,00,000');
assert.strictEqual(formatIndianNumber(10000000), '1,00,00,000');
console.log('✔ Indian numbering formatting passed.');

// 4. Balance Status & Colors
assert.strictEqual(getBalanceStatus(100), 'GET');
assert.strictEqual(getBalanceStatus(-100), 'GIVE');
assert.strictEqual(getBalanceStatus(0), 'SETTLED');
assert.strictEqual(getBalanceColor(100), '#16A34A');
assert.strictEqual(getBalanceColor(-100), '#DC2626');
assert.strictEqual(getBalanceColor(0), '#6B7280');
assert.strictEqual(getBalanceLabel(100), 'You will get');
assert.strictEqual(getBalanceLabel(-100), 'You will give');
assert.strictEqual(getBalanceLabel(0), 'Settled');
console.log('✔ Balance status & colors passed.');

// 5. Phone Number & WhatsApp
assert.strictEqual(formatPhoneNumberForWhatsApp(''), '');
assert.strictEqual(formatPhoneNumberForWhatsApp(null), '');
assert.strictEqual(formatPhoneNumberForWhatsApp('9876543210'), '919876543210');
assert.strictEqual(formatPhoneNumberForWhatsApp('+91 98765 43210'), '919876543210');
assert.strictEqual(formatPhoneNumberForWhatsApp('09876543210'), '09876543210');
console.log('✔ Phone number formatting passed.');

// 6. Date formatting
const now = Date.now();
assert.strictEqual(formatDate(now), 'Today');
const yesterday = now - 24 * 60 * 60 * 1000;
assert.strictEqual(formatDate(yesterday), 'Yesterday');
assert.strictEqual(formatRelativeSyncTime(null), 'Never');
assert.strictEqual(formatRelativeSyncTime(now - 5000), 'Just now');
assert.strictEqual(formatRelativeSyncTime(now - 30000), '30s ago');
assert.strictEqual(formatRelativeSyncTime(now - 120000), '2m ago');
assert.strictEqual(formatRelativeSyncTime(now - 7200000), '2h ago');
console.log('✔ Date formatting passed.');

// 7. Backup Payload Integrity Roundtrip
const sampleBackup: BackupPayload = {
  version: 1,
  exported_at: Date.now(),
  parties: [
    {
      id: 'p1',
      name: 'Ramesh Store',
      phone: '9876543210',
      created_at: 1000,
      updated_at: 2000,
    },
  ],
  transactions: [
    {
      id: 't1',
      party_id: 'p1',
      type: 'GAVE',
      amount_paise: 50050,
      note: 'Grocery supply',
      date: 1500,
      created_at: 1500,
    },
  ],
};

const jsonStr = JSON.stringify(sampleBackup);
const parsedBackup: BackupPayload = JSON.parse(jsonStr);
assert.strictEqual(parsedBackup.version, 1);
assert.strictEqual(parsedBackup.parties.length, 1);
assert.strictEqual(parsedBackup.parties[0].id, 'p1');
assert.strictEqual(parsedBackup.transactions.length, 1);
assert.strictEqual(parsedBackup.transactions[0].amount_paise, 50050);
console.log('✔ Backup serialization & deserialization roundtrip passed.');

console.log('--- ALL EDGE CASE TESTS COMPLETED SUCCESSFULLY ---');
