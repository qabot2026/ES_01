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

## Railway variables

| Variable | Purpose |
|----------|---------|
| `GOOGLE_DRIVE_FOLDER_ID` | Parent folder id from Drive URL |
| `GOOGLE_CREDENTIALS_JSON` | Service account (Workspace **Shared drive** folder) |
| **Or** OAuth trio | `GOOGLE_DRIVE_OAUTH_CLIENT_ID`, `GOOGLE_DRIVE_OAUTH_CLIENT_SECRET`, `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN` (My Drive / personal Gmail) |

Enable **Google Drive API** in the same GCP project.

Share the parent folder with the service account email (**Editor**) if using service account.

## Check

- `GET /api/config` → `"driveConfigured": true`
- Submit upload form → new subfolder under parent → Sheet **Document** column = folder link

## Service account note

Service accounts cannot use personal **My Drive** quota. Use a **Shared drive** folder, or OAuth user credentials above.
