# Google Drive — upload form files

When a visitor submits the **Upload document** form, files go to a subfolder under your parent Drive folder.

## Folder naming (Only Refer pattern)

| Case | Folder name example |
|------|---------------------|
| Mobile on file | `919960343604_02_06_2026_01` |
| Same mobile, same day, 2nd upload | `919960343604_02_06_2026_02` |
| No mobile (fallback) | `qa-sessionid__02_06_2026_01` |

- Digits = country code + mobile (no `+`), e.g. `91` + `9960343604`
- Date = `DD_MM_YYYY` in `Asia/Kolkata` (or `CONTACT_FORM_SUBMISSION_TZ`)
- Sequence = `01`, `02`, … per mobile per calendar day

## Option A — OAuth (My Drive / personal Gmail)

### 1. Client ID + Secret (Google Cloud Console)

1. [Google Cloud Console](https://console.cloud.google.com/) → your project  
2. **APIs & Services → Library** → enable **Google Drive API**  
3. **OAuth consent screen** → External → add your Gmail as **Test user**  
4. **Credentials → Create credentials → OAuth client ID**  
   - Type: **Web application**  
   - Redirect URI (exact): `http://127.0.0.1:8765/oauth2callback`  
5. Copy **Client ID** → Railway `GOOGLE_DRIVE_OAUTH_CLIENT_ID`  
6. Copy **Client secret** → Railway `GOOGLE_DRIVE_OAUTH_CLIENT_SECRET`

### 2. Refresh token (one time on your PC)

```powershell
cd ES_01
$env:GOOGLE_DRIVE_OAUTH_CLIENT_ID="....apps.googleusercontent.com"
$env:GOOGLE_DRIVE_OAUTH_CLIENT_SECRET="GOCSPX-..."
node scripts/get-google-drive-refresh-token.js
```

Sign in with the Gmail that owns the upload folder → terminal prints  
`GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN=...` → paste into Railway.

If no refresh token: revoke app at https://myaccount.google.com/permissions and run again.

### 3. Parent folder

Create folder in Drive → URL has id → `GOOGLE_DRIVE_FOLDER_ID` on Railway.

---

## Option B — Service account (Workspace Shared drive)

Use existing `GOOGLE_CREDENTIALS_JSON`. Folder must be on a **Shared drive**, shared with service account **Editor**.

---

## Railway variables (summary)

| Variable | Purpose |
|----------|---------|
| `GOOGLE_DRIVE_FOLDER_ID` | Parent folder id from Drive URL |
| OAuth trio | `GOOGLE_DRIVE_OAUTH_CLIENT_ID`, `GOOGLE_DRIVE_OAUTH_CLIENT_SECRET`, `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN` |
| Or service account | `GOOGLE_CREDENTIALS_JSON` (Shared drive only) |

## Check

- `GET /api/config` → `"driveConfigured": true`
- Submit upload form → new subfolder under parent → Sheet **Document** column = folder link

## Service account note

Service accounts cannot use personal **My Drive** quota. Use a **Shared drive** folder, or OAuth user credentials above.
