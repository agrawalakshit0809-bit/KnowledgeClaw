# KnowledgeClaw

KnowledgeClaw is an OpenClaw-style engineering memory assistant for software teams. It turns GitHub history into searchable durable memory, then helps developers answer "why was this built this way?", identify module ownership risk, and receive proactive warnings before risky code changes.

## Hackathon Fit

- Theme: Productivity Platforms
- Problem: Engineering teams lose decision context across commits, pull requests, issues, meetings, and handoffs.
- Solution: GitHub ingestion + LLM extraction + ChromaDB memory + Groq answers + React dashboard + proactive alerts.
- Business value: Faster onboarding, fewer repeated mistakes, lower bus-factor risk, better code review context.

## Core Features

- Source-backed question answering over team decisions
- ChromaDB vector memory with module, author, impact, and source metadata
- Knowledge Map API for module and contributor relationships
- Bus Factor API for single-owner risk detection
- Simulated proactive warning before editing sensitive files
- OpenClaw-style `KnowledgeClaw.skill.md`, `MEMORY.md`, and `HEARTBEAT.md`

## Architecture

```txt
GitHub Repo
   |
   |  ingester.ts
   v
data/raw/*.json
   |
   |  extractor.py + Groq
   v
ChromaDB durable memory
   |
   |  query_api.py
   v
React dashboard / ngrok / OpenClaw skill
```

## Backend Setup

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
npm install
```

Create `.env`:

```env
GROQ_API_KEY=your_groq_key
GITHUB_TOKEN=your_github_token
GITHUB_OWNER=your_github_username
GITHUB_REPO=your_repo_name
```

Do not commit `.env`.

## Run

Seed demo memory:

```bash
npm run seed
```

Start the API:

```bash
npm run api
```

Backend runs at:

```txt
http://localhost:5001
```

For partner frontend access, expose it with ngrok:

```bash
ngrok http 5001
```

Use the active ngrok URL in the frontend and append `/query` for search requests.

## API Routes

### Health

```http
GET /health
```

### Ask KnowledgeClaw

```http
POST /query
Content-Type: application/json

{"query": "Why JWT?"}
```

Returns:

- `answer`
- `sources`
- `total_found`
- `confidence`
- `trace`

### Knowledge Map

```http
GET /knowledge-map
```

Returns module, author, and relationship data for visualization.

### Bus Factor

```http
GET /bus-factor
```

Returns module-level ownership risk and recommendations.

### Proactive Change Warning

```http
POST /simulate-change
Content-Type: application/json

{"file": "auth/middleware.js"}
```

Returns a source-backed warning before a risky edit.

### Demo Guide

```http
GET /demo
```

Returns the recommended demo scenarios and judging fit.

## Frontend Integration

For the Search page:

```ts
const res = await fetch(`${API_BASE_URL}/query`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
  body: JSON.stringify({ query }),
});
```

For local development:

```env
VITE_API_BASE_URL=http://localhost:5001
```

For partner demo through ngrok:

```env
VITE_API_BASE_URL=https://your-active-ngrok-url.ngrok-free.dev
```

Restart the React dev server after changing `.env`.

## Live Demo Startup Order

Use this order for the final demo:

1. Start OpenClaw WhatsApp gateway:

```powershell
openclaw gateway restart --force
Start-Sleep -Seconds 50
openclaw channels status
```

Continue only when status says WhatsApp is `enabled, configured, linked, running, connected`.

2. Start the KnowledgeClaw backend:

```powershell
cd C:\Users\AKSHIT\Desktop\KnowledgeClaw\knowledge-engine
python src/query_api.py
```

3. If the frontend or teammate needs a public backend URL, start ngrok:

```powershell
ngrok http 5001
```

Copy the active forwarding URL into the frontend `VITE_API_BASE_URL`, then restart the frontend dev server.

4. Start the React frontend from the frontend project folder:

```powershell
npm run dev
```

If the frontend was created with Create React App instead of Vite, use `npm start`.

## Winning Demo Flow

1. Show the problem: "Teams forget why decisions were made."
2. Ask `Why JWT?` and show an answer with sources.
3. Open Knowledge Map and show module-author memory relationships.
4. Open Bus Factor and show high-risk modules.
5. Run simulate change for `auth/middleware.js` and show proactive warning.
6. Explain OpenClaw fit: skill file, durable memory, heartbeat behavior, multi-channel potential.

More submission material is in `docs/`:

- `docs/DEMO_SCRIPT.md`
- `docs/PPT_OUTLINE.md`
- `docs/SUBMISSION_CHECKLIST.md`
- `docs/AI_DISCLOSURE.md`

## Evaluation Alignment

- Working prototype / functionality: API, frontend, ChromaDB, Groq, ngrok
- Technical depth: GitHub ingestion, extraction, vector search, metadata, risk scoring
- UX / novelty: searchable memory, map, bus factor, proactive warning
- Theme relevance: Productivity Platforms for engineering teams
- Documentation: setup, routes, demo flow, memory and skill files

## Team Roles

- Akshit: backend, GitHub ingestion, ChromaDB memory, Groq API, ngrok deployment, proactive alert logic
- Ishita: React dashboard, Search UI, Knowledge Map page, Bus Factor page, demo UX polish
