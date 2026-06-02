# Google Sheet — one row per conversation

Har chat session ki **ek row** Sheet mein jati hai (headers ke saath). Naye messages par wahi row **update** hoti hai.

---

## Step 1 — Google Sheet banayein

1. [Google Sheets](https://sheets.google.com) → **Blank spreadsheet**
2. **Row 1** par ye headers likhein (order same rakhein):

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V | W | X | Y | Z | AA | AB | AC | AD | AE | AF | AG |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Conv. Link | Conv. Date | Conv. Time | Name | Mobile | Email | Channel | User Queries | Repeated User | Source URL | Session ID | Device | Browser | OS | City | IP Address | App. Booked | App. Date | App. Time | Document | Sentiment | Rating | Feedback | Duration | CRM Push Status | Message Count | Average Response Time | UtmCampaign | UtmContent | UtmMedium | UtmSource | UtmTerm | Fall back |

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
| `SHEETS_RANGE` | `Sheet1!A:AG` (33 columns) |
| `PUBLIC_BASE_URL` | `https://aapka-app.up.railway.app` (Conv. Link / transcript) |

**Redeploy** karein.

---

## Step 5 — Test

1. Website par chatbot kholo → 2–3 message bhejo  
2. Sheet refresh — **ek row** session ke liye; dubara message par wahi row update  
3. Dashboard `/dashboard/` par **Google Sheet: On**

Agar row nahi aati:

- Railway mein **`SHEETS_SPREADSHEET_ID`** set hai? (`/api/config` → `sheetsConfigured: true`, `sheetsSpreadsheetIdSet: true`)
- Service account ko Sheet par **Editor**
- Deploy logs: `[sheets] enabled` ya `[sheets] append:` error
- Chat **server** par log hoti hai (`/api/chat`) — sirf browser UI se likhne se pehle row nahi banti thi; ab har message ke baad sync hota hai

---

## Columns ka source

| Column | Source |
|--------|--------|
| Conv. Link | Transcript URL (`PUBLIC_BASE_URL` + session) |
| Conv. Date / Time | Pehla message (default TZ `Asia/Kolkata`) |
| Name, Mobile, Email | Forms / `clientContext` → `/api/session-context` |
| User Queries | Saare user messages joined |
| Source URL, UTM*, Device, Browser, OS | Widget on load |
| IP Address | Server `X-Forwarded-For` |
| App. Booked / Date / Time | Appointment form submit |
| Rating, Feedback | Feedback form |
| Duration, Message Count, Avg Response Time | Transcript turns se calculate |
| Fall back | Dialogflow fallback (jab set ho) |
