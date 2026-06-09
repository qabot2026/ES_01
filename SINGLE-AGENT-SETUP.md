# Single agent setup (1 ES agent, 1 GCP project)

**Agent:** `recebot-ptav` — Receptionist + Green Valley + Lake View sab isi mein.

`agentOrchestration.enabled: false` — multi-agent band.

---

## Dialogflow intents (recebot-ptav)

### Receptionist

| Intent | Event / Phrases | Input context | Output context |
|--------|-----------------|---------------|----------------|
| Fresh Start | `FRESH` | — | `receptionist` (5) |
| Open Green Valley | Green Valley | `receptionist` | `receptionist`(0), `green_valley`(10) |
| Open Lake View | Lake View | `receptionist` | `receptionist`(0), `lake_view`(10) |
| Back to Main Menu | Main menu, back | `green_valley` OR `lake_view` | dono(0), `receptionist`(5) |

### Green Valley (context: `green_valley`)

| Intent | Phrases | Input |
|--------|---------|-------|
| Start Green Valley | event `START_GREEN_VALLEY` | — (landing page) |
| GV Pricing | pricing, price | `green_valley` |
| GV Floor Plans | floor plan | `green_valley` |
| GV Site Visit | site visit | `green_valley` |

Har GV response ke end: chip **Main menu**

### Lake View (context: `lake_view`)

Same pattern — event `START_LAKE_VIEW` for landing page.

---

## Deploy scripts

### Home (Receptionist)

```html
<script src="https://es-based-chatbot-production.up.railway.app/embed.js" async></script>
```

Chat open → `FRESH` → receptionist.

### Green Valley landing page

```html
<script>
  window.QA_CONFIG = { welcomeEventName: 'START_GREEN_VALLEY' };
</script>
<script src="https://es-based-chatbot-production.up.railway.app/embed.js" async></script>
```

### Lake View landing page

```html
<script>
  window.QA_CONFIG = { welcomeEventName: 'START_LAKE_VIEW' };
</script>
<script src="https://es-based-chatbot-production.up.railway.app/embed.js" async></script>
```

Same embed URL — sirf `welcomeEventName` alag.

---

## Railway

Sirf **ek** project ID:

```
DIALOGFLOW_PROJECT_ID=recebot-ptav
```

`DIALOGFLOW_ALLOWED_PROJECTS` — optional; sirf `recebot-ptav` kaafi.

---

## Test

```
Home:     FRESH → Green Valley → pricing → Main menu
GV page:  START_GREEN_VALLEY → pricing (Lake View NAHI aana chahiye)
LV page:  START_LAKE_VIEW → pricing
```

---

## Purane 3 agents (greenvalley-aryq, lakeview-pgsd)

Intents **export** karke `recebot-ptav` mein import karo, phir contexts lagao.  
Ya naye se intents banao upar wali table se.
