# Aapko kya karna hai (simple)

Reference folder: **`Only Refer/`** — sirf design idea ke liye. Aapka live code **`ES_01`** mein hai.

---

## 1. Railway variables

| Variable | Zaroori? | Kya daalein |
|----------|----------|-------------|
| `GOOGLE_CREDENTIALS_JSON` | Haan | Dialogflow service account JSON |
| `LIVE_AGENT_DESK_TOKEN` | Haan | Koi bhi secret password (team ko bhi yahi dena) |
| `SHEETS_SPREADSHEET_ID` | Optional | Google Sheet ka ID (URL se) |
| `SHEETS_RANGE` | Optional | Default: `Sheet1!A:G` |

**Google Sheet (optional):**  
Sheet ko service account email se **Editor** share karein. GCP mein **Google Sheets API** on karein.

---

## 2. Dialogflow — human agent

Last step par custom payload:

```json
{
  "action": "request_live_agent",
  "message": "Connecting you to our team. Please wait…"
}
```

Ya intent name: **`Live Agent`**

---

## 3. Team links

| Page | URL |
|------|-----|
| Service desk | `/live-agent/` |
| Analytics | `/dashboard/` |
| Chat script | `/transcript.html?session=...` |

Pehli baar desk/settings → **Your Name** + **Desk token** (Railway wala)

---

## 4. Deploy

Git push → Railway redeploy → website par **hard refresh** (Ctrl+F5)

---

## Kya nahi karna abhi

- Firebase / Firestore (reference mein hai — abhi file-based storage)
- Poora `Only Refer` server copy — zaroorat nahi

Baad mein: proper login, departments, Firebase — alag phase.
