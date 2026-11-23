/**
 * Diagnostics parser for Google Drive API responses.
 * Detects project enablement status (403 accessNotConfigured), scope issues (403), and expired tokens (401).
 */
export async function parseDriveError(response: Response, actionContext: string): Promise<string> {
  const status = response.status;
  let rawBody = '';
  let parsed: any = null;

  try {
    rawBody = await response.text();
    parsed = JSON.parse(rawBody);
  } catch {
    // rawBody is text or empty
  }

  const googleMessage: string = parsed?.error?.message || rawBody || response.statusText;
  const reason: string = parsed?.error?.errors?.[0]?.reason || '';

  // 1. Check for 403 accessNotConfigured or Drive API disabled
  const isDriveApiDisabled =
    status === 403 &&
    (reason === 'accessNotConfigured' ||
      googleMessage.includes('accessNotConfigured') ||
      googleMessage.toLowerCase().includes('drive api has not been used') ||
      googleMessage.toLowerCase().includes('is disabled') ||
      googleMessage.includes('149728239855') ||
      googleMessage.toLowerCase().includes('enable it by visiting'));

  if (isDriveApiDisabled) {
    return (
      'Google Drive API is not enabled for project hisaab-792d0 (149728239855).\n\n' +
      'Please enable the Google Drive API in Google Cloud Console:\n' +
      'https://console.cloud.google.com/apis/library/drive.googleapis.com?project=hisaab-792d0\n\n' +
      `Details: ${googleMessage}`
    );
  }

  // 2. Check for missing drive.appdata scope or insufficient permissions
  const isScopeMissing =
    status === 403 &&
    (reason === 'insufficientPermissions' ||
      reason === 'forbidden' ||
      googleMessage.toLowerCase().includes('insufficient permissions') ||
      googleMessage.toLowerCase().includes('drive.appdata') ||
      googleMessage.toLowerCase().includes('read/write access'));

  if (isScopeMissing) {
    return (
      'Missing Google Drive AppData permissions (drive.appdata scope).\n\n' +
      'Please re-authenticate your Google account to grant full Drive sync permissions.\n\n' +
      `Details: ${googleMessage}`
    );
  }

  // 3. Check for 401 token expired
  if (status === 401) {
    return `Google session expired (401). Please re-authenticate your Google account. (${googleMessage})`;
  }

  return `${actionContext} failed (${status}): ${googleMessage}`;
}
