# AI Disclosure — KnowledgeClaw

**Samsung PRISM · Phase 2 Submission**

Team: Akshit Agrawal + Ishita Singhvi

---

## How AI Was Used in This Project

This document discloses all AI tools used during the development of KnowledgeClaw, in accordance with the Samsung PRISM submission guidelines.

---

### 1. Groq API (LLaMA 3.3 70B Versatile)

**Role: Core product functionality**

The AI is a first-class component of KnowledgeClaw, not a development shortcut. Groq's LLaMA 3.3 70B model is used in production to:

- Extract structured decisions, rationale, module names, author attribution, and impact from raw GitHub commit messages, PR descriptions, and issue comments (`extractor.py`)
- Generate source-backed answers to developer queries by summarizing retrieved ChromaDB memory chunks (`query_api.py` — `/query` route)
- Fall back gracefully when retrieved memory is insufficient, avoiding hallucination

The model is instructed to reason only from retrieved context, never from parametric memory alone.

---

### 2. Claude (Anthropic)

**Role: Development assistance**

Claude was used as a development assistant during the building of this project for:

- Debugging Flask CORS configuration and ChromaDB persistence settings
- Writing and refining prompt templates for the Groq extraction pipeline
- Reviewing and improving TypeScript component structure in the React frontend
- Drafting this README and AI Disclosure document

All code was reviewed, understood, and modified by the team before use. No code was submitted without comprehension.

---

### 3. ChromaDB

**Role: AI-native memory storage**

ChromaDB is used as the vector database for storing and retrieving AI-generated memory objects. Each memory has an embedding computed at insert time, enabling semantic similarity search at query time.

---

## What Was Not AI-Generated

- Project architecture decisions (retrieval pipeline design, Bus Factor algorithm, route structure)
- The OpenClaw integration design (skill file, heartbeat framing, WhatsApp delivery)
- Demo data design (the 14 seed memories were designed to tell a coherent story about a fictional `auth-service` project)
- All UI/UX decisions in the React dashboard

---

## Summary

| AI Tool | Purpose | Category |
|---|---|---|
| Groq / LLaMA 3.3 70B | Decision extraction + query answering | **Product feature** |
| Claude (Anthropic) | Code assistance + documentation | **Development tool** |
| ChromaDB | Vector memory storage | **Infrastructure** |

---

*This disclosure was prepared honestly. AI accelerated our development but the system design, integration choices, and product decisions were made by the team.*