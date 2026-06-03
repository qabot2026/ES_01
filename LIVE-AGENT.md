# Live agent service desk

Matches **Only Refer** Agent Service Desk (`/live-agent/`).

## URLs

| Path | Purpose |
|------|---------|
| `/live-agent/` | Agent service desk (queue, chat, visitor details) |
| `/live-agent/settings` | Departments, routing, agent emails |
| `/conversations-sheet` | Conversation leads (same viewer secret) |

## Auth

1. Set **`CONVERSATIONS_SHEET_VIEW_SECRET`** (or **`LIVE_AGENT_DESK_TOKEN`**) on the server.
2. Open **`/live-agent/`**.
3. Enter the **viewer secret** and your **work email** (e.g. `you@company.com`).
4. The same secret is stored as `conversations_sheet_secret_v1` for leads + transcript pages.

## Agent workflow

1. **Chats** (left) — filter: All, Waiting, Mine, Active, Done, etc.
2. Select a chat → **Accept** → reply in the center panel.
3. **Details** (right) — name, email, mobile, documents, transcript link.
4. **End chat** returns the visitor to the bot.

## Storage

Conversations are stored in **`data/live-agent-sessions.json`** (no Firestore required).

## Widget

Dialogflow handoff → `liveAgent: true` on `/api/chat` → widget polls `/api/live-agent/status` and `/api/live-agent/messages`.

Details: `LIVE-AGENT-SETUP.md`
