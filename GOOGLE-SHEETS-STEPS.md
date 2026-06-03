# Google Sheet — one row per conversation

Har chat session ki **ek row** Sheet mein jati hai (headers ke saath). Naye messages par wahi row **update** hoti hai.

---

## Step 1 — Google Sheet banayein

1. [Google Sheets](https://sheets.google.com) → **Blank spreadsheet**
2. **Row 1** par ye headers likhein (order same rakhein):

| A | B | C | … |
|---|---|---|
| **Chatscript** | Conv. Link | Conv. Date | … (see app `SHEET_HEADERS` — 35 columns through **Fall back**; **Tag** is after **Document**) |

Row 1 must start with **Chatscript** (clickable link in each row), then Conv. Link, Conv. Date, …

3. Sheet tab naam note karein (default `Sheet1`).

App pehli baar sync par khali row 1 par headers **auto** bhi likh sakta hai — phir bhi aap manually set kar sakte ho.

---

## Step 2 — Service account email se share

1. Railway par jo **`GOOGLE_CREDENTIALS_JSON`** hai, usme **`client_email`** dhundhein  
   Example: `something@your-project.iam.gserviceaccount.com`
2. Google Sheet → **Share** → ye email paste → role **Editor** → Send

---

## Step 3 — Google Sheets API on

1. [Google Cloud Console](https://console.cloud.google.com/) → wahi project jisme Dialogflow hai  
2. **APIs & Services** → **Library**  
3. Search: **Google Sheets API** → **Enable**

---

## Step 4 — Railway variables

| Variable | Value |
|----------|--------|
| `GOOGLE_CREDENTIALS_JSON` | Poora service account JSON (Dialogflow wala hi) |
| `SHEETS_SPREADSHEET_ID` | Sheet URL se ID |
| `SHEETS_RANGE` | `Sheet1!A:AI` (35 columns) |
| `PUBLIC_BASE_URL` | `https://aapka-app.up.railway.app` (Chatscript + Conv. Link URLs) |

**Redeploy** karein.

---

## Step 5 — Test

1. Website par chatbot kholo → 2–3 message bhejo  
2. Sheet refresh — **ek row** session ke liye; dubara message par wahi row update  
3. Dashboard `/dashboard/` par **Google Sheet: On**

Agar row nahi aati:

- Railway mein **`SHEETS_SPREADSHEET_ID`** set hai? (`/api/config` → `sheetsConfigured: true`, `sheetsSpreadsheetIdSet: true`)
- Service account ko Sheet par **Editor**
- Browser: `https://aapka-app.up.railway.app/api/sheets/status` — `probe.ok`, `tabExists`, `lastError`
- Deploy logs: `[sheets] probe OK` ya `probe failed` / `Tab "Sheet1" not in sheet`
- Chat **server** par log hoti hai (`/api/chat`) — sirf browser UI se likhne se pehle row nahi banti thi; ab har message ke baad sync hota hai

---

## Columns ka source

| Column | Source |
|--------|--------|
| Chatscript | Clickable **Chatscript** → opens `/conversation-transcript?session=…` in browser |
| Conv. Link | Same transcript URL (plain link) |
| Conv. Date / Time | Pehla message (default TZ `Asia/Kolkata`) |
| Name, Mobile, Email | Forms / `clientContext` → `/api/session-context` |
| User Queries | Saare user messages joined |
| Source URL, UTM*, Device, Browser, OS | Widget on load |
| IP Address | Server `X-Forwarded-For` |
| App. Booked / Date / Time | Appointment form submit |
| Rating, Feedback | Feedback form |
| Duration, Message Count, Avg Response Time | Transcript turns se calculate |
| Fall back | Dialogflow fallback (jab set ho) |
