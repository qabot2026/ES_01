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

## Chip click (`message`)

Keep chip `message` in Dialogflow in **English** (for intent matching).  
Only the **visible label** is translated from this file.

## Config

`company.config.js`:

- `usePhraseTranslationFile: true`  
- `useIntentResponseFile: false` (optional per-intent file)  
- `autoTranslateBotReplies: false`

## Turn off

`PHRASE_TRANSLATIONS_ENABLED=false` on Railway.
