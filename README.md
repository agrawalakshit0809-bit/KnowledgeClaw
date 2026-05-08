# KnowledgeClaw 🧠⚡

> **Engineering memory that warns before context gets lost.**

KnowledgeClaw converts your GitHub history into durable, source-backed team memory — then proactively warns developers before they touch risky code.

---

## The Problem

Teams don't lose code first. They lose the **reasons behind the code**.

Before editing `auth/middleware.js`, a developer typically has to dig through old PRs, commit messages, and issue threads to understand *why* it was built a certain way. That context is scattered, invisible, and expensive to rediscover.

---

## What KnowledgeClaw Does

| Capability | How |
|---|---|
| **Ask** — "Why did we choose JWT?" | Retrieves source-backed answer with author, rationale, module, and PR link |
| **Inspect** — Knowledge Map | Graph of modules, decisions, and authors |
| **Risk** — Bus Factor | Single-owner modules ranked by criticality |
| **Warn** — WhatsApp Alert | OpenClaw sends a proactive message before a risky change |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Data ingestion | GitHub API → `ingester.ts` |
| AI extraction | Groq API (`llama-3.3-70b-versatile`) + `extractor.py` |
| Memory storage | ChromaDB (persistent vector DB) |
| API layer | Flask (`query_api.py`) |
| Frontend | React + TypeScript + Tailwind CSS |
| Alerts | OpenClaw WhatsApp via `whatsapp_bot.py` |

---

## Architecture

```
GitHub API
    ↓ ingester.ts
  raw JSON
    ↓ extractor.py + Groq
  structured decisions (decision, rationale, module, author, source, date, impact)
    ↓ ChromaDB
  vector memory
    ↓ Flask API (query_api.py)
  /query · /knowledge-map · /bus-factor · /simulate-change
    ↓ React Dashboard + OpenClaw
  Search · Map · Risk · WhatsApp Alert
```

---

## Project Structure

```
KnowledgeClaw/
├── ingester.ts          # GitHub API ingestion
├── extractor.py         # Groq-based decision extraction
├── seed_knowledge.py    # Seeds 14 demo memories into ChromaDB
├── query_api.py         # Flask API (4 routes)
├── whatsapp_bot.py      # OpenClaw WhatsApp alert sender
├── whatsapp_skill.md    # OpenClaw skill definition
├── App.tsx              # React root with routing
├── Search.tsx           # Query interface (ask why)
├── KnowledgeMap.tsx     # Decision/author graph
├── BusFactor.tsx        # Ownership risk dashboard
├── types.ts             # TypeScript interfaces
├── package.json         # Frontend dependencies
├── tailwind.config.js   # Tailwind config
└── AI_DISCLOSURE.md     # AI tool usage disclosure
```

---

## API Routes

| Route | Method | Description |
|---|---|---|
| `/query` | POST | Source-backed answer from ChromaDB + Groq |
| `/knowledge-map` | GET | Returns module-author relationship graph |
| `/bus-factor` | GET | Returns single-owner risk analysis |
| `/simulate-change` | POST | Triggers OpenClaw WhatsApp alert |

---

## Running Locally

### Backend

```bash
# Install Python dependencies
pip install flask flask-cors chromadb groq

# Seed demo data
python seed_knowledge.py

# Start API server
python query_api.py
# Runs on http://localhost:5001
```

### Frontend

```bash
npm install
npm run dev
# Runs on http://localhost:5173
```

### WhatsApp Alerts

Requires OpenClaw CLI installed and WhatsApp linked. See `whatsapp_skill.md` for setup.

---

## Demo Walkthrough

1. **Search** — Ask "Why JWT?" → get source-backed answer with author + PR source
2. **Map** — Open Knowledge Map → see module/author relationships
3. **Risk** — Open Bus Factor → 4 critical risk modules surface immediately
4. **Alert** — Simulate auth change → WhatsApp message received live

---

## OpenClaw Integration

KnowledgeClaw is designed as an OpenClaw teammate:

- **`whatsapp_skill.md`** — skill definition describing assistant behavior
- **Heartbeat** — proactive alerts before risky edits (not just reactive Q&A)
- **Channel** — WhatsApp delivery reaches the developer outside the dashboard

Gateway status: linked · running · connected

---

## Phase 2 Submission Checklist

- [x] Source Code (all files in this repo)
- [x] Presentation (`KnowledgeClaw_Phase2_Submission.pptx`) (Click View Raw)
- [x] Video (`Knowledgeclaw_demo.mp4` — see repo)
- [x] AI Disclosure (`AI_DISCLOSURE.md`)
- [x] README (this file)

---

## Team

**Akshit Agrawal** — Backend, AI integration, Flask API, ChromaDB, GitHub ingestion

**Ishita Singhvi** — Frontend, React dashboard, TypeScript components

---

*Samsung PRISM · Productivity Platforms · Phase 2 Submission*
