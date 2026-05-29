# Feature cost guide (Dialogflow ES)

Use this when adding or enabling features in `public/company.config.js`.

| Ball | Meaning |
|------|---------|
| 🟢 **GREEN** | **Free** for Dialogflow — browser/UI only, or uses JSON already inside a bot reply (no extra `detectIntent` call). |
| 🔴 **RED** | **Billable** — each action calls `/api/chat` → Google **detectIntent** (counts as a request on your agent). |

**Rule of thumb:** If the user (or widget on open/idle/restart) sends **text** or a **Dialogflow event** to the bot, that is 🔴 RED. If you only **draw** something from the last reply, it is 🟢 GREEN.

---

## 🔴 RED — Dialogflow API (each = 1 request)

| Feature | When it charges |
|---------|-----------------|
| User types + Send | Every message sent |
| Mic → Send | Same as Send (speech is 🟢; sending transcript is 🔴) |
| Suggestion / reply chips | Each chip tap sends `message` to Dialogflow |
| Card carousel **View / Book** buttons | Each button sends `ctaValue` as a message |
| Inline select / dropdown | Each selection sends `value` to Dialogflow |
| `open_form` (contact, upload, etc.) | Each form submit sends `[form:id]` text to Dialogflow |
| `welcomeEvent` (FRESH) | Chat open and/or Restart (if enabled) |
| `endChatEvent` (ENDCHAT) | Idle timeout and/or close (if enabled) |
| Welcome **suggestionChips** | Each chip tap (display is 🟢; tap is 🔴) |
| Restart button | Fires FRESH again when `triggerOnRestart` is true |

**Not Dialogflow but may cost elsewhere:** images/files hosted on your URLs (GCS bandwidth/storage only).

---

## 🟢 GREEN — No extra Dialogflow call

| Feature | Notes |
|---------|--------|
| Theme, colors, fonts, panel size | UI only |
| Launcher, story ring, launcher strip | UI only |
| Header, personas, timestamps | UI only |
| Language dropdown | Only changes language for **next** send (dropdown itself is free) |
| Speech-to-text (mic) | Browser Web Speech API; **sending** the text is 🔴 |
| Rich content display | Parsed from fulfillment already returned |
| Info cards / accordion | From `richContent` in same reply |
| `open_gallery` strip + lightbox | Display + lightbox; images load from your URLs |
| `open_card_carousel` + lightbox | Display, arrows, auto-scroll |
| Auto-scroll / stop on interaction | Client-side only |
| Scroll arrows on gallery/carousel | Client-side only |
| In-chat forms (`open_form`) | Display is 🟢; **Submit** is 🔴 |
| Markdown links in bot text | Render only |
| File download buttons | Opens URL; no Dialogflow |
| Powered by footer | UI only |
| `autoOpenChat` | Opens panel only; 🔴 only if `welcomeEvent` runs on open |

---

## Typical session example

1. Page load, auto-open + FRESH → **1 🔴**
2. User sends “hi” → **1 🔴**
3. Bot returns carousel payload → **0 extra** (🟢 render)
4. User clicks **View** on card → **1 🔴**
5. Idle 20s → ENDCHAT → **1 🔴**

**Total: 4 Dialogflow requests** (not counting your Dialogflow plan’s free tier).

---

## Config reference

See `common.featureCostGuide` in `public/company.config.js` for the same list next to your settings.
