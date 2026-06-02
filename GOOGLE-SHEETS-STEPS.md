# Google Sheet par saari conversation — steps

Har user/bot/agent message ki **ek row** Sheet mein jayegi (jab setup sahi ho).

---

## Step 1 — Google Sheet banayein

1. [Google Sheets](https://sheets.google.com) → **Blank spreadsheet**
2. Pehli row (header) likhein:

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| Date | Time | Session | Role | Message | Event | Agent | Chat link |

3. Sheet ka naam note karein (neeche left) — default `Sheet1` hota hai.

---

## Step 2 — Service account email se share

1. Railway par jo **`GOOGLE_CREDENTIALS_JSON`** hai, usme **`client_email`** dhundhein  
   Example: `something@your-project.iam.gserviceaccount.com`
2. Google Sheet → **Share** → ye email paste → role **Editor** → Send

---

## Step 3 — Google Sheets API on

1. [Google Cloud Console](https://console.cloud.google.com/) → wahi project jisme Dialogflow / Firebase hai  
2. **APIs & Services** → **Library**  
3. Search: **Google Sheets API** → **Enable**

---

## Step 4 — Railway variables

Apni Railway service → **Variables** → add / check:

| Variable | Value |
|----------|--------|
| `GOOGLE_CREDENTIALS_JSON` | Poora service account JSON (Dialogflow wala hi) |
| `SHEETS_SPREADSHEET_ID` | Sheet URL se ID: `https://docs.google.com/spreadsheets/d/ **YAHAN_ID** /edit` |
| `SHEETS_RANGE` | `Sheet1!A:H` (agar tab ka naam alag ho to `Leads!A:H` jaisa) |
| `PUBLIC_BASE_URL` | `https://aapka-app.up.railway.app` (transcript link ke liye) |

**Redeploy** karein (Deploy / Restart).

---

## Step 5 — Test

1. Website par chatbot kholo → 2–3 message bhejo  
2. Google Sheet refresh karo → nayi rows aani chahiye  
3. Dashboard `/dashboard/` par **Google Sheet: On** dikhe  

Agar row nahi aati:

- Sheet **Editor** par service account email hai?  
- `SHEETS_SPREADSHEET_ID` sahi hai?  
- Railway **Deploy logs** mein `[sheets] append failed` dekho  

---

## Sheet mein kya aata hai

| Role | Matlab |
|------|--------|
| user | Visitor ne likha |
| bot | Dialogflow jawab |
| agent | Live agent desk se reply |

| Event | Matlab |
|-------|--------|
| chat_message | Normal chat line |
| live_agent_request | User ne agent maanga |

**Chat link** column se poori script browser mein khul sakti hai.
