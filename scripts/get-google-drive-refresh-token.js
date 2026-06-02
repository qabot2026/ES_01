/**
 * One-time: get GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN for Railway.
 *
 * 1. Google Cloud Console → OAuth consent screen + test user (your Gmail)
 * 2. Credentials → OAuth client ID → Web application
 * 3. Redirect URI: http://127.0.0.1:8765/oauth2callback
 * 4. Enable Google Drive API
 *
 * Run:
 *   set GOOGLE_DRIVE_OAUTH_CLIENT_ID=...
 *   set GOOGLE_DRIVE_OAUTH_CLIENT_SECRET=...
 *   node scripts/get-google-drive-refresh-token.js
 */

const http = require('http');
const { URL } = require('url');
const { google } = require('googleapis');

const PORT = 8765;
const REDIRECT_PATH = '/oauth2callback';
const REDIRECT_URI = `http://127.0.0.1:${PORT}${REDIRECT_PATH}`;

const clientId = String(process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID || '').trim();
const clientSecret = String(
  process.env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET || ''
).trim();

if (!clientId || !clientSecret) {
  console.error(
    'Set GOOGLE_DRIVE_OAUTH_CLIENT_ID and GOOGLE_DRIVE_OAUTH_CLIENT_SECRET first.'
  );
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);
const authUrl = oauth2.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/drive'],
});

const server = http.createServer(async (req, res) => {
  if (!req.url || !req.url.startsWith(REDIRECT_PATH)) {
    res.writeHead(404);
    res.end();
    return;
  }
  const params = new URL(req.url, `http://127.0.0.1:${PORT}`).searchParams;
  const code = params.get('code');
  const err = params.get('error');
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  if (err) {
    res.end(`<p>OAuth error: ${err}</p>`);
    console.error('OAuth error:', err);
    server.close();
    process.exit(1);
    return;
  }
  if (!code) {
    res.end('<p>No code in callback.</p>');
    server.close();
    process.exit(1);
    return;
  }
  try {
    const { tokens } = await oauth2.getToken(code);
    const rt = tokens.refresh_token;
    res.end(
      '<p>Success. Check the terminal for GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN.</p>'
    );
    console.log('\n--- Add to Railway ---\n');
    if (rt) {
      console.log(`GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN=${rt}`);
    } else {
      console.log(
        'No refresh_token returned. Revoke app at https://myaccount.google.com/permissions and run again.'
      );
    }
    console.log('');
  } catch (e) {
    res.end(`<p>Token exchange failed: ${e.message}</p>`);
    console.error(e.message);
    process.exit(1);
  }
  server.close();
  process.exit(0);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('Open in browser (use the Gmail that owns the Drive folder):\n');
  console.log(authUrl);
  console.log(`\nWaiting for ${REDIRECT_URI} …\n`);
});
