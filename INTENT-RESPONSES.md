# Intent responses — one file (en / hi / mr)

All Hindi and Marathi text lives in **`data/intent-responses.json`**.

- No Google Translate API cost for those lines
- Same number of Dialogflow calls as before (one per user message)
- Dialogflow still matches intents in **English**

---

## How to add a new intent

### Step 1 — Get the intent name

1. Open [Dialogflow ES Console](https://dialogflow.cloud.google.com/)
2. Go to **Intents**
3. Copy the **Display name** exactly (example: `Product Inquiry`)

### Step 2 — Edit the file

Open **`data/intent-responses.json`** and add:

```json
"Product Inquiry": {
  "reply": {
    "en": "Which product are you looking for?",
    "hi": "आप कौन सा उत्पाद खोज रहे हैं?",
    "mr": "तुम्ही कोणते उत्पादन शोधत आहात?"
  },
  "chipHeading": {
    "en": "Choose:",
    "hi": "चुनें:",
    "mr": "निवडा:"
  },
  "chips": {
    "en": ["Type A", "Type B"],
    "hi": ["प्रकार अ", "प्रकार ब"],
    "mr": ["प्रकार अ", "प्रकार ब"]
  }
}
```

### Step 3 — Deploy

Push to GitHub → Railway redeploys → test in widget with **Hindi** or **Marathi** selected.

---

## Welcome / FRESH event

If welcome uses event **FRESH** (not an intent name), use:

```json
"@event:FRESH": {
  "reply": {
    "en": "...",
    "hi": "...",
    "mr": "..."
  }
}
```

---

## Config (`public/company.config.js`)

| Setting | Production value |
|---------|------------------|
| `useIntentResponseFile` | `true` |
| `autoTranslateBotReplies` | `false` |
| `alwaysUseDialogflowLanguage` | `'en'` |

---

## Text + chips together (Location example)

**One Dialogflow response** = text + custom payload chips (not two steps).

1. User types `location` → **1** `/api/chat` call.
2. Dialogflow **Location** intent → returns **text + richContent chips** in same fulfillment.
3. Server replaces `reply` / `chipHeading` / chip **labels** from this file (hi/mr/en).
4. Widget shows **message + chips** together.

**Chips structure** (what happens on click) must be in **Dialogflow custom payload**.  
File only changes **visible labels** (same order as Dialogflow `options`).

### Dialogflow → Location intent → Custom payload (example)

```json
{
  "richContent": [
    [
      {
        "type": "list",
        "title": "What would you like next?"
      },
      {
        "type": "chips",
        "options": [
          { "text": "View on map", "message": "show map" },
          { "text": "Contact us", "message": "contact" },
          { "text": "Back to menu", "message": "menu" }
        ]
      }
    ]
  ]
}
```

`message` = what is sent when user taps chip (train intents for these).  
`text` = English label (file can override for hi/mr).

## What is translated from the file?

| Yes | Not yet (stays English from Dialogflow) |
|-----|----------------------------------------|
| Main `reply` text | Card carousel titles (add later if needed) |
| `chipHeading` | Gallery images |
| Chip **labels** (same order as Dialogflow chips) | Dropdown options |

---

## Turn off file mode

Railway variable: `INTENT_RESPONSES_ENABLED=false`  
Or delete / rename `data/intent-responses.json`.

---

## Check it works

1. `GET /health` → `intentResponsesFile: true`
2. Chat in **Marathi** → reply should show Marathi from JSON
3. Remove an intent from JSON → user sees English from Dialogflow

## No reply for Location?

1. Dialogflow Console → Intents → open **Location** → copy **Display name** → use as JSON key (or add to `aliases`).
2. Location intent must have **training phrases** (e.g. `location`, `where is the project`, `Hyderabad`).
3. Add a **Text response** in Dialogflow (English) — can be same line as JSON `en`.
4. Browser **F12 → Network → `/api/chat`** → check JSON field `"intent"`. JSON key must match that name.
5. If `"intentResponseMiss": true` → wrong key name in `intent-responses.json`.
