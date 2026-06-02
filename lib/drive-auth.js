/**
 * Google Drive API auth — OAuth user account or service account JSON.
 */

const { google } = require('googleapis');
const googleCredentials = require('./google-credentials');

const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive'];

function oauthEnv() {
  const clientId = String(process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID || '').trim();
  const clientSecret = String(
    process.env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET || ''
  ).trim();
  const refreshToken = String(
    process.env.GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN || ''
  ).trim();
  return {
    useOAuth: !!(clientId && clientSecret && refreshToken),
    clientId,
    clientSecret,
    refreshToken,
  };
}

function hasDriveUploadCredentials() {
  if (oauthEnv().useOAuth) return true;
  return !!googleCredentials.getServiceAccountCredentials();
}

function isDriveAuthOAuthUser() {
  return oauthEnv().useOAuth;
}

async function getDriveClient() {
  const { useOAuth, clientId, clientSecret, refreshToken } = oauthEnv();
  if (useOAuth) {
    const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
    oauth2.setCredentials({ refresh_token: refreshToken });
    return google.drive({ version: 'v3', auth: oauth2 });
  }
  const cred = googleCredentials.getServiceAccountCredentials();
  if (!cred) {
    throw new Error(
      'Drive auth missing. Set GOOGLE_DRIVE_OAUTH_* or GOOGLE_CREDENTIALS_JSON.'
    );
  }
  const auth = new google.auth.GoogleAuth({
    credentials: cred,
    scopes: DRIVE_SCOPES,
  });
  return google.drive({ version: 'v3', auth: await auth.getClient() });
}

module.exports = {
  hasDriveUploadCredentials,
  isDriveAuthOAuthUser,
  getDriveClient,
};
