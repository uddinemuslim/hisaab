import assert from 'node:assert';
import {
  parseRupeesToPaise,
  formatPaiseToRupees,
  formatIndianNumber,
  getBalanceColor,
  getBalanceLabel,
  COLOR_GET,
  COLOR_GIVE,
  COLOR_SETTLED,
} from '../src/utils/currency';
import { buildWhatsAppMessage, formatPhoneNumberForWhatsApp } from '../src/utils/whatsapp';

console.log('--- RUNNING HISAAB LOGIC & CURRENCY TESTS ---');

// Test 1: parseRupeesToPaise (Zero Floats)
assert.strictEqual(parseRupeesToPaise('100'), 10000);
assert.strictEqual(parseRupeesToPaise('100.5'), 10050);
assert.strictEqual(parseRupeesToPaise('100.50'), 10050);
assert.strictEqual(parseRupeesToPaise('0.05'), 5);
assert.strictEqual(parseRupeesToPaise('0.5'), 50);
assert.strictEqual(parseRupeesToPaise('₹ 1,234.56'), 123456);
assert.strictEqual(parseRupeesToPaise('0'), 0);
assert.strictEqual(parseRupeesToPaise(''), 0);
assert.strictEqual(parseRupeesToPaise('  500.00  '), 50000);
console.log('✔ parseRupeesToPaise tests passed.');

// Test 2: formatPaiseToRupees
assert.strictEqual(formatPaiseToRupees(10050), '₹100.50');
assert.strictEqual(formatPaiseToRupees(10000), '₹100');
assert.strictEqual(formatPaiseToRupees(10000, { alwaysDecimals: true }), '₹100.00');
assert.strictEqual(formatPaiseToRupees(5), '₹0.05');
assert.strictEqual(formatPaiseToRupees(0), '₹0');
assert.strictEqual(formatPaiseToRupees(-50000), '₹500');
assert.strictEqual(formatPaiseToRupees(-50000, { showSign: true }), '-₹500');
assert.strictEqual(formatPaiseToRupees(50000, { showSign: true }), '+₹500');
console.log('✔ formatPaiseToRupees tests passed.');

// Test 3: formatIndianNumber
assert.strictEqual(formatIndianNumber(1000), '1,000');
assert.strictEqual(formatIndianNumber(100000), '1,00,000');
assert.strictEqual(formatIndianNumber(10000000), '1,00,00,000');
console.log('✔ formatIndianNumber tests passed.');

// Test 4: Colors and Statuses
assert.strictEqual(getBalanceColor(5000), COLOR_GET);
assert.strictEqual(getBalanceColor(-5000), COLOR_GIVE);
assert.strictEqual(getBalanceColor(0), COLOR_SETTLED);
assert.strictEqual(getBalanceLabel(5000), 'You will get');
assert.strictEqual(getBalanceLabel(-5000), 'You will give');
assert.strictEqual(getBalanceLabel(0), 'Settled');
console.log('✔ getBalanceColor & getBalanceLabel tests passed.');

// Test 5: WhatsApp message builder
const getMsg = buildWhatsAppMessage('Ramesh', 50050);
assert(getMsg.includes('Hello Ramesh'));
assert(getMsg.includes('Your pending balance is ₹500.50'));
assert(getMsg.includes('HISAAB'));

const giveMsg = buildWhatsAppMessage('Suresh', -20000);
assert(giveMsg.includes('Hello Suresh'));
assert(giveMsg.includes('I have a pending balance of ₹200 to pay you'));

const settledMsg = buildWhatsAppMessage('Pooja', 0);
assert(settledMsg.includes('completely settled with a balance of ₹0'));

assert.strictEqual(formatPhoneNumberForWhatsApp('9876543210'), '919876543210');
assert.strictEqual(formatPhoneNumberForWhatsApp('+91 98765 43210'), '919876543210');
console.log('✔ WhatsApp message builder tests passed.');

// Test 6: Ledger Math Simulation
interface SimulatedParty {
  id: string;
  name: string;
  transactions: { type: 'GAVE' | 'GOT'; amount_paise: number }[];
}

const simulatedParties: SimulatedParty[] = [
  {
    id: '1',
    name: 'Party A', // Gave 500, Got 200 -> net +300 (You will get ₹300)
    transactions: [
      { type: 'GAVE', amount_paise: 50000 },
      { type: 'GOT', amount_paise: 20000 },
    ],
  },
  {
    id: '2',
    name: 'Party B', // Got 1000, Gave 300 -> net -700 (You will give ₹700)
    transactions: [
      { type: 'GOT', amount_paise: 100000 },
      { type: 'GAVE', amount_paise: 30000 },
    ],
  },
  {
    id: '3',
    name: 'Party C', // Gave 400, Got 400 -> net 0 (Settled)
    transactions: [
      { type: 'GAVE', amount_paise: 40000 },
      { type: 'GOT', amount_paise: 40000 },
    ],
  },
];

let totalWillGetPaise = 0;
let totalWillGivePaise = 0;

for (const p of simulatedParties) {
  const net = p.transactions.reduce((acc, tx) => {
    return tx.type === 'GAVE' ? acc + tx.amount_paise : acc - tx.amount_paise;
  }, 0);

  if (p.id === '1') assert.strictEqual(net, 30000);
  if (p.id === '2') assert.strictEqual(net, -70000);
  if (p.id === '3') assert.strictEqual(net, 0);

  if (net > 0) totalWillGetPaise += net;
  if (net < 0) totalWillGivePaise += Math.abs(net);
}

assert.strictEqual(totalWillGetPaise, 30000); // ₹300
assert.strictEqual(totalWillGivePaise, 70000); // ₹700
console.log('✔ Ledger math simulation tests passed.');

console.log('--- ALL HISAAB CORE TESTS COMPLETED SUCCESSFULLY ---');
