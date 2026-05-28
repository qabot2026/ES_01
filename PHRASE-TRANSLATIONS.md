# Phrase translations — whole bot (one file)

Edit **`data/phrase-translations.json`**.

## Rule

| Key | Value |
|-----|--------|
| **Exact English** from Dialogflow | `{ "hi": "...", "mr": "..." }` |

Works **everywhere** that English appears:

- Any intent reply  
- Chips, dropdowns, cards  
- FRESH event, Location, Welcome, Fallback — **same list**

## Example

Dialogflow shows (English):

`Welcome back! What would you like to do?`

File:

```json
"Welcome back! What would you like to do?": {
  "hi": "वापसी पर स्वागत है! आप क्या करना चाहेंगे?",
  "mr": "पुन्हा स्वागत आहे! तुम्हाला काय करायचे आहे?"
}
```

User selects **Marathi** → that sentence becomes Marathi **on every intent** that uses those exact words.

## Add a new phrase

1. Run bot in **English** UI once — copy the **exact** line from chat.  
2. Paste as **key** in JSON.  
3. Add `hi` and `mr`.  
4. Deploy.

**Spelling / punctuation must match** Dialogflow exactly.

## What gets translated (whole bot)

| Part | Translated? |
|------|-------------|
| Reply text | Yes |
| Chip **label** (visible) | Yes |
| Chip **click** (`message` / value) | **No** — stays English for Dialogflow |
| Dropdown label | Yes |
| Dropdown value (on click) | **No** — stays English |
| Gallery / image **title** (`name`) | Yes — add exact English to file |
| Card title, subtitle, buttons | Yes |
| Download link text | Yes |

## Chip click (`message`)

Dialogflow payload: `"text": "View on map"` (show user), `"message": "show map"` (send on click).  
Add **both** to the file if labels differ:

```json
"View on map": { "hi": "...", "mr": "..." },
"show map": { "hi": "...", "mr": "..." }
```

Only **label** must match what user sees; click text can stay English only.

## Exact match tips

- Copy text from chat with **English** UI selected.
- Same spelling: `Image 1` ≠ `Chitr 1` — add **both** keys if Dialogflow uses both.
- Extra spaces / `:` / `.` must match (small differences = no translate).

## Config

`company.config.js`:

- `usePhraseTranslationFile: true`  
- `useIntentResponseFile: false` (optional per-intent file)  
- `autoTranslateBotReplies: false`

## Turn off

`PHRASE_TRANSLATIONS_ENABLED=false` on Railway.
