import assert from 'node:assert';
import { formatDatePill, formatDate } from '../src/utils/date';
import { buildWhatsAppMessage } from '../src/utils/whatsapp';
import { parseDriveError } from '../src/services/driveDiagnostics';
import { lightColors, darkColors } from '../src/theme/colors';

console.log('--- RUNNING HISAAB v1.0.0 FEATURE & DIAGNOSTIC TESTS ---');

// 1. Theme Color Tokens
assert.strictEqual(lightColors.primary, '#2563EB');
assert.strictEqual(darkColors.primary, '#3B82F6');
assert.strictEqual(lightColors.gave, '#DC2626');
assert.strictEqual(darkColors.gave, '#EF4444');
assert.strictEqual(lightColors.got, '#16A34A');
assert.strictEqual(darkColors.got, '#10B981');
console.log('✔ Theme color tokens validated.');

// 2. Date Picker Pill Formatter
const fixedTimestamp = new Date(2026, 10, 23, 12, 0, 0).getTime(); // 23 Nov 2026
const pillString = formatDatePill(fixedTimestamp);
assert.strictEqual(pillString, '23 Nov 26');
console.log('✔ Date picker pill format validated.');

// 3. Reminder message builder with date and GitHub attribution
const pastTimestamp = new Date(2025, 10, 23, 12, 0, 0).getTime();
const pastReminderMsg = buildWhatsAppMessage('Aakash', 150000, pastTimestamp);
assert(pastReminderMsg.includes('Hello Aakash'));
assert(pastReminderMsg.includes('Your pending balance is ₹1,500'));
assert(pastReminderMsg.includes('as of 23 Nov 2025'));
assert(pastReminderMsg.includes('App developed by moslem: https://github.com/uddinemuslim'));

const todayReminderMsg = buildWhatsAppMessage('Vikas', -75050, fixedTimestamp);
assert(todayReminderMsg.includes('Hello Vikas'));
assert(todayReminderMsg.includes('pending balance of ₹750.50 to pay you'));
assert(todayReminderMsg.includes('as of Today'));
assert(todayReminderMsg.includes('App developed by moslem: https://github.com/uddinemuslim'));
console.log('✔ Reminder message formatting & developer attribution validated.');

// 4. Drive Sync 403 Diagnostics (accessNotConfigured)
async function testDriveDiagnostics() {
  const mock403DisabledResponse = {
    status: 403,
    statusText: 'Forbidden',
    text: async () =>
      JSON.stringify({
        error: {
          code: 403,
          message:
            'Google Drive API has not been used in project 149728239855 before or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=149728239855 then retry.',
          errors: [
            {
              message: 'Google Drive API has not been used in project 149728239855 before or it is disabled.',
              domain: 'usageLimits',
              reason: 'accessNotConfigured',
            },
          ],
        },
      }),
  } as any;

  const err403 = await parseDriveError(mock403DisabledResponse, 'Drive search');
  assert(err403.includes('Google Drive API is not enabled for project hisaab-792d0 (149728239855)'));
  assert(err403.includes('https://console.cloud.google.com/apis/library/drive.googleapis.com?project=hisaab-792d0'));
  console.log('✔ 403 accessNotConfigured error diagnostic validated.');

  const mock403ScopeResponse = {
    status: 403,
    statusText: 'Forbidden',
    text: async () =>
      JSON.stringify({
        error: {
          code: 403,
          message: 'The user has not granted read/write access to drive.appdata.',
          errors: [
            {
              reason: 'insufficientPermissions',
              message: 'Insufficient Permission',
            },
          ],
        },
      }),
  } as any;

  const errScope = await parseDriveError(mock403ScopeResponse, 'Drive upload');
  assert(errScope.includes('Missing Google Drive AppData permissions (drive.appdata scope)'));
  assert(errScope.includes('Please re-authenticate'));
  console.log('✔ 403 insufficientPermissions scope diagnostic validated.');

  const mock401Response = {
    status: 401,
    statusText: 'Unauthorized',
    text: async () => 'Invalid Credentials',
  } as any;

  const err401 = await parseDriveError(mock401Response, 'Drive search');
  assert(err401.includes('Google session expired (401)'));
  console.log('✔ 401 unauthorized diagnostic validated.');
}

testDriveDiagnostics().then(() => {
  console.log('--- ALL HISAAB v1.0.0 FEATURE TESTS COMPLETED SUCCESSFULLY ---');
});
