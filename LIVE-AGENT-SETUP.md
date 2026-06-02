# Live agent — simple setup (आपको क्या करना है)

## Part A — Team (आपकी टीम / client team)

### 1. Open desk page
Browser में खोलें:

**`https://es-based-chatbot-production.up.railway.app/live-agent/`**

(अपना Railway URL लगाएँ अगर अलग है)

### 2. Settings (पहली बार)
- **Your name** — visitor को दिखेगा (जैसे Priya)
- **Agent ID** — कोई भी short id (जैसे `priya`)
- **Desk API token** — खाली छोड़ें, जब तक Railway में token न सेट किया हो
- **Server URL** — खाली छोड़ें (auto ले लेगा)
- **Save & open desk**

### 3. Daily use
1. **Waiting** tab — नया visitor
2. उस पर click → **Take chat**
3. नीचे message लिखें → **Send**
4. खत्म हो तो **End chat**

---

## Part B — Dialogflow (bot से human पर भेजना)

### Option 1 — Intent name (आसान)
नया intent बनाएँ: **`Live Agent`**

User बोले: “talk to human”, “live agent”, “customer care” आदि

Response text (उदाहरण):  
`Connecting you to our team. Please wait.`

### Option 2 — Parameter
Fulfillment में parameter: **`live_agent`** = `true`

---

## Part C — Railway (optional)

| Variable | कब लगाएँ |
|----------|----------|
| `LIVE_AGENT_DESK_TOKEN` | Desk को lock करना हो — team Settings में same token डालें |
| `LIVE_AGENT_INTENTS` | अगर intent का नाम `Live Agent` नहीं है — comma से names |

Deploy के बाद hard refresh: desk page पर **Ctrl+F5**

---

## Test करें

1. Website पर chatbot खोलें  
2. Dialogflow से Live Agent trigger करें  
3. Desk पर **Waiting** में session दिखे  
4. **Take chat** → visitor को widget में reply दिखे  

---

## Files (reference)

| File | काम |
|------|-----|
| `public/live-agent/` | Team desk UI |
| `lib/live-agent.js` | Server queue + messages |
| `public/widget/live-agent-client.js` | Widget handoff |
| `data/live-agent-sessions.json` | Chats save (server पर) |
