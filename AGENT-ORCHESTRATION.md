# Receptionist + alag project bots (home page)

Home par **Receptionist** chalega. User project choose kare → **us project ka poora bot** (child). **Main menu** → wapas Receptionist.

Project ki **alag page** par sirf us project ka bot — bina switch ke.

---

## Kitne Dialogflow agent?

| Page | Agent | GCP `projectId` |
|------|-------|-----------------|
| Home | Receptionist | `dialogflow.projectId` |
| Project A page | Project A only | child `projectId` |
| Project B page | Project B only | child `projectId` |

**3 alag Dialogflow agents** (3 alag GCP projects).

---

## Step 1 — Dialogflow mein 3 bots banao

Har bot apne GCP project mein. Har bot mein:

- **FRESH** event → welcome
- Project bots mein chip/intent: **Main menu** (home se wapas aane ke liye)

---

## Step 2 — Service account

Ek hi service account sab projects par:

1. GCP → har project → **IAM**
2. Service account email add karo
3. Role: **Dialogflow API Client**

Railway / server par env:

```
DIALOGFLOW_PROJECT_ID=receptionist-gcp-project-id
DIALOGFLOW_ALLOWED_PROJECTS=receptionist-gcp-project-id,project-a-gcp-id,project-b-gcp-id
```

---

## Step 3 — Home page config (`company.config.js`)

```js
dialogflow: {
  projectId: 'receptionist-gcp-project-id',  // Receptionist
  agentOrchestration: {
    enabled: true,
    role: 'receptionist',
    children: [
      {
        id: 'green-valley',
        label: 'Green Valley',
        projectId: 'project-a-gcp-id',
        openTriggers: ['Green Valley', 'green valley', 'Project A'],
      },
      {
        id: 'lake-view',
        label: 'Lake View',
        projectId: 'project-b-gcp-id',
        openTriggers: ['Lake View', 'lake view', 'Project B'],
      },
    ],
    returnTriggers: ['Main menu', 'back', 'menu', 'receptionist'],
  },
},
```

**Receptionist bot** mein chips ka text `openTriggers` se **exact match** hona chahiye (case ignore).

---

## Step 4 — Project A alag page

Us page par embed se pehle:

```html
<script>
  window.QA_CONFIG = {
    apiBase: 'https://your-server.com',
    dialogflowProjectId: 'project-a-gcp-id',
    agentOrchestration: { enabled: true, role: 'standalone' },
  };
</script>
<script src="https://your-server.com/embed.js"></script>
```

Sirf Project A bot — koi switch nahi.

Project B page = same, `dialogflowProjectId: 'project-b-gcp-id'`.

---

## Kaise chalta hai (home)

```
Chat open → Receptionist (FRESH)
User: "Green Valley" → Project A agent + FRESH
User: pricing, visit, … → Project A agent
User: "Main menu" → Receptionist + FRESH
```

Chip / typed text dono `openTriggers` / `returnTriggers` se match hote hain.

---

## Dialogflow tips

| Bot | Kya rakho |
|-----|-----------|
| Receptionist | Overview chips: `Green Valley`, `Lake View` |
| Project A / B | Poora flow + **Main menu** chip |
| Sab | `FRESH` event intent |

---

## Test

1. Home: `enabled: true`, `role: 'receptionist'`
2. Console chips se project click
3. Project flow chale
4. `Main menu` → receptionist wapas
5. Project page alag URL par sirf ek bot

---

## Band karna ho to

`agentOrchestration.enabled: false` — purana single-bot behaviour.
