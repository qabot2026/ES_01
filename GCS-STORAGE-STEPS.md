# GCP Storage Bucket — upload form (production)

Google Drive integration **removed**. Files go to **your GCS bucket** — no client Gmail / OAuth.

---

## 1) Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) → same project as Dialogflow  
2. **APIs & Services → Library** → enable **Cloud Storage API**  
3. **Cloud Storage → Buckets → Create**
   - Name: e.g. `qualityassistant-uploads` (globally unique)
   - Region: e.g. `asia-south1` (Mumbai)  
   - **Uniform bucket-level access**: On  
   - Block public access: **On** (files open via signed links only)

---

## 2) Service account permission

Use the same service account as `GOOGLE_CREDENTIALS_JSON` (`client_email`).

**IAM → Grant access** on the bucket (or project):

- Role: **Storage Object Admin** (or `Storage Object Creator` + signed URL needs signing permission)

Bucket → **Permissions** → Add principal → paste `client_email` → **Storage Object Admin** → Save.

---

## 3) Railway variables

| Variable | Example |
|----------|---------|
| `GOOGLE_CREDENTIALS_JSON` | Same JSON as Dialogflow (already set) |
| `GCS_BUCKET_NAME` | `qualityassistant-uploads` |
| `GCS_UPLOAD_PREFIX` | `uploads` (optional, default) |
| `GCS_SIGNED_URL_DAYS` | `7` (optional — link valid days) |

Remove old Drive variables if present:

- `GOOGLE_DRIVE_FOLDER_ID`
- `GOOGLE_DRIVE_OAUTH_*`

**Redeploy.**

---

## 4) Check

Open: `https://your-app.up.railway.app/api/config`

```json
"gcsConfigured": true,
"gcsBucket": "qualityassistant-uploads"
```

Upload form test → files in bucket under:

`uploads/919960343604_02_06_2026_01/...`

Sheet **Document** column = download link (signed URL).

---

## Folder naming (same as before)

| Upload | Folder prefix |
|--------|----------------|
| 1st today, mobile | `919960343604_02_06_2026_01` |
| 2nd same day | `919960343604_02_06_2026_02` |
| No mobile | `sessionId__02_06_2026_01` |

---

## Cost

~₹2–5 per GB / month storage. 1 GB ≈ negligible.

---

## Client ko kya chahiye?

**Kuch nahi** — no Google login, no Drive setup. Only your Railway env + bucket.
