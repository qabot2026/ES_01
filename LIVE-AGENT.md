# Live agent service desk

Your team can chat with website users in real time while the bot hands off the conversation.

## Agent desk (team)

Open: **`https://your-app.up.railway.app/live-agent/`**

1. Go to **Settings** — enter your name, agent ID, and optional API token.
2. **Waiting** — users who asked for a human; click a row, then **Take chat**.
3. Reply in the box; user sees messages in the chat widget.
4. **End chat** — user returns to the bot.

## User (chat widget)

When Dialogflow triggers handoff, the widget connects to live agent mode (banner + polling).

### Dialogflow setup

Use **one** of these:

| Method | How |
|--------|-----|
| Intent name | Create intent `Live Agent` (or add name to `LIVE_AGENT_INTENTS` env, comma-separated) |
| Parameter | Set session parameter `live_agent` = `true` in fulfillment |

Optional: fulfillment text e.g. “Connecting you to our team…”

## Railway env (optional)

| Variable | Purpose |
|----------|---------|
| `LIVE_AGENT_DESK_TOKEN` | If set, desk API requires `X-Agent-Token` header (save in Settings) |
| `LIVE_AGENT_INTENTS` | Comma intent names that trigger handoff (default: `Live Agent,Handoff to Agent`) |
| `LIVE_AGENT_DATA_PATH` | Override path to `live-agent-sessions.json` |

## Config (`company.config.js`)

```javascript
liveAgent: {
  enabled: true,
  pollIntervalMs: 2000,
  deskUrl: '/live-agent/',
}
```

Data file: `data/live-agent-sessions.json` (session queue + messages).
