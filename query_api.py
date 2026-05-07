from collections import Counter, defaultdict
import os
import subprocess
import time

import chromadb
import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from groq import Groq


load_dotenv()

APP_NAME = "KnowledgeClaw"
MODEL_NAME = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
CHROMA_PATH = os.getenv("CHROMA_PATH", "./data/chromadb")

app = Flask(__name__)
CORS(app)

chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
collection = chroma_client.get_or_create_collection(name="knowledge")

groq_api_key = os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=groq_api_key) if groq_api_key else None


def _clean(value, fallback="unknown"):
    if value is None:
        return fallback
    value = str(value).strip()
    return value if value else fallback


def _all_entries():
    count = collection.count()
    if count == 0:
        return []

    data = collection.get(limit=count, include=["documents", "metadatas"])
    docs = data.get("documents") or []
    metadatas = data.get("metadatas") or []
    ids = data.get("ids") or []

    entries = []
    for index, meta in enumerate(metadatas):
        meta = meta or {}
        entries.append(
            {
                "id": ids[index] if index < len(ids) else f"entry_{index}",
                "document": docs[index] if index < len(docs) else "",
                "decision": _clean(meta.get("decision"), ""),
                "rationale": _clean(meta.get("rationale"), ""),
                "module": _clean(meta.get("module"), "General"),
                "author": _clean(meta.get("author"), "Unknown"),
                "source": _clean(meta.get("source"), "memory"),
                "date": _clean(meta.get("date"), ""),
                "impact": _clean(meta.get("impact"), "medium"),
            }
        )
    return entries


def _public_entry(entry, score=None):
    result = {
        "decision": entry.get("decision", ""),
        "rationale": entry.get("rationale", ""),
        "module": entry.get("module", "General"),
        "author": entry.get("author", "Unknown"),
        "source": entry.get("source", "memory"),
        "date": entry.get("date", ""),
        "impact": entry.get("impact", "medium"),
    }
    if score is not None:
        result["score"] = round(float(score), 4)
    return result


def search_knowledge(query, n=4):
    count = collection.count()
    if count == 0:
        return []

    results = collection.query(
        query_texts=[query],
        n_results=min(n, count),
        include=["documents", "metadatas", "distances"],
    )

    docs = results.get("documents", [[]])[0] or []
    metadatas = results.get("metadatas", [[]])[0] or []
    distances = results.get("distances", [[]])[0] or []

    entries = []
    for index, meta in enumerate(metadatas):
        meta = meta or {}
        distance = distances[index] if index < len(distances) else None
        score = None if distance is None else max(0, 1 - float(distance))
        entries.append(
            _public_entry(
                {
                    "decision": meta.get("decision", ""),
                    "rationale": meta.get("rationale", ""),
                    "module": meta.get("module", "General"),
                    "author": meta.get("author", "Unknown"),
                    "source": meta.get("source", "memory"),
                    "date": meta.get("date", ""),
                    "impact": meta.get("impact", "medium"),
                    "document": docs[index] if index < len(docs) else "",
                },
                score,
            )
        )
    return entries


def _fallback_answer(query, entries):
    if not entries:
        return (
            "No matching memory was found yet. Try asking about authentication, "
            "payments, database choices, Groq, API gateway, or frontend decisions."
        )

    top = entries[0]
    author = top.get("author", "the team")
    decision = top.get("decision", "a previous technical decision")
    rationale = top.get("rationale", "the rationale stored in team memory")
    module = top.get("module", "the codebase")
    return (
        f"{author} decided: {decision}. The reason was: {rationale}. "
        f"This is most relevant to the {module} module."
    )


def generate_answer(query, entries):
    if not entries:
        return _fallback_answer(query, entries), "fallback"

    if not groq_client:
        return _fallback_answer(query, entries), "fallback_no_api_key"

    context = "\n".join(
        [
            (
                f"- Decision: {entry['decision']}\n"
                f"  Rationale: {entry['rationale']}\n"
                f"  Module: {entry['module']}\n"
                f"  Author: {entry['author']}\n"
                f"  Source: {entry['source']} | Date: {entry['date']}"
            )
            for entry in entries
        ]
    )

    prompt = f"""You are KnowledgeClaw, a developer productivity assistant.
Answer using only the team memory below.
Keep the answer to 3 sentences.
Always mention who made the decision, why, and which module it affects.
If the evidence is weak, say what extra source is needed.

Question: {query}

Team memory:
{context}

Answer:"""

    try:
        response = groq_client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=220,
            temperature=0.2,
        )
        return response.choices[0].message.content.strip(), MODEL_NAME
    except Exception as exc:
        print(f"Groq error: {exc}")
        return _fallback_answer(query, entries), "fallback_groq_error"


def send_whatsapp_alert(message):
    recipient = os.getenv("WHATSAPP_TO")
    if not recipient:
        return False, "WHATSAPP_TO missing"

    node_path = os.getenv("OPENCLAW_NODE", r"C:\nvm4w\nodejs\node.exe")
    openclaw_cli = os.getenv(
        "OPENCLAW_CLI",
        r"C:\Users\AKSHIT\AppData\Local\nvm\v22.22.2\node_modules\openclaw\dist\index.js",
    )
    timeout = int(os.getenv("OPENCLAW_CLI_TIMEOUT_SECONDS", "75"))
    attempts = int(os.getenv("OPENCLAW_CLI_ATTEMPTS", "3"))

    errors = []

    if os.path.exists(node_path) and os.path.exists(openclaw_cli):
        for attempt in range(1, max(1, attempts) + 1):
            try:
                result = subprocess.run(
                    [
                        node_path,
                        openclaw_cli,
                        "message",
                        "send",
                        "--channel",
                        "whatsapp",
                        "--target",
                        recipient,
                        "--message",
                        message,
                        "--json",
                    ],
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                )
                if result.returncode == 0:
                    return True, f"OpenClaw CLI message send (attempt {attempt})"
                cli_error = (result.stderr or result.stdout or "").strip()
                if cli_error:
                    errors.append(f"OpenClaw CLI attempt {attempt} failed: {cli_error[:240]}")
            except Exception as exc:
                errors.append(f"OpenClaw CLI attempt {attempt} error: {str(exc)[:240]}")
            if attempt < attempts:
                time.sleep(3)

    direct_sender = os.path.join(os.path.dirname(__file__), "send_whatsapp_direct.mjs")
    direct_fallback_enabled = os.getenv("WHATSAPP_DIRECT_FALLBACK") == "1"
    if direct_fallback_enabled and os.path.exists(node_path) and os.path.exists(direct_sender):
        try:
            result = subprocess.run(
                [node_path, direct_sender, recipient, message],
                capture_output=True,
                text=True,
                timeout=60,
            )
            if result.returncode == 0:
                return True, "Direct WhatsApp fallback"
            direct_error = (result.stderr or result.stdout or "").strip()
            if direct_error:
                errors.append(f"Direct WhatsApp failed: {direct_error[:240]}")
        except Exception as exc:
            errors.append(f"Direct WhatsApp error: {str(exc)[:240]}")

    token = os.getenv("OPENCLAW_AUTH_TOKEN")
    if not token:
        detail = "; ".join(errors) if errors else "OpenClaw CLI unavailable"
        return False, f"{detail}; OPENCLAW_AUTH_TOKEN missing"

    endpoints = [
        "http://127.0.0.1:18789/api/v1/message",
        "http://127.0.0.1:18789/api/v1/send",
        "http://127.0.0.1:18789/api/v1/whatsapp/send",
    ]
    payload = {
        "channel": "whatsapp",
        "to": recipient,
        "text": message,
        "message": message,
    }
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    last_error = "No OpenClaw WhatsApp endpoint accepted the message"
    for endpoint in endpoints:
        try:
            response = requests.post(endpoint, headers=headers, json=payload, timeout=2)
            if response.status_code < 400:
                return True, endpoint
            last_error = f"{endpoint} returned HTTP {response.status_code}"
        except Exception as exc:
            last_error = str(exc)
    if errors:
        return False, "; ".join(errors + [last_error])[:600]
    return False, last_error


def _stats():
    entries = _all_entries()
    modules = Counter(entry["module"] for entry in entries)
    authors = Counter(entry["author"] for entry in entries)
    sources = Counter(entry["source"] for entry in entries)
    impact = Counter(entry["impact"] for entry in entries)
    return {
        "knowledge_entries": len(entries),
        "modules": dict(modules.most_common()),
        "authors": dict(authors.most_common()),
        "sources": dict(sources.most_common()),
        "impact": dict(impact.most_common()),
    }


def _module_owner_risk(entries):
    critical_modules = {
        "authentication",
        "payment module",
        "api gateway",
        "database layer",
    }
    grouped = defaultdict(list)
    for entry in entries:
        grouped[entry["module"]].append(entry)

    risks = []
    for module, module_entries in grouped.items():
        author_counts = Counter(entry["author"] for entry in module_entries)
        owner, owner_count = author_counts.most_common(1)[0]
        total = len(module_entries)
        owner_share = owner_count / total if total else 0
        contributors = len(author_counts)
        high_impact_count = sum(1 for entry in module_entries if entry.get("impact") == "high")
        module_key = module.lower()

        if contributors == 1 and module_key in critical_modules and (total >= 2 or high_impact_count >= 1):
            risk = "high"
        elif contributors == 1 or owner_share >= 0.7:
            risk = "medium"
        else:
            risk = "low"

        risks.append(
            {
                "module": module,
                "risk": risk,
                "primary_owner": owner,
                "owner_share": round(owner_share, 2),
                "contributors": contributors,
                "memory_entries": total,
                "recommendation": (
                    "Create handoff notes and add a second reviewer before the next risky change."
                    if risk == "high"
                    else "Add one reviewer or short module note to reduce single-owner dependency."
                    if risk == "medium"
                    else "Ownership is reasonably distributed."
                ),
            }
        )

    return sorted(risks, key=lambda row: {"high": 0, "medium": 1, "low": 2}[row["risk"]])


@app.route("/query", methods=["POST"])
def query():
    data = request.get_json(silent=True) or {}
    q = _clean(data.get("query"), "")
    if not q:
        return jsonify({"error": "No query provided"}), 400

    requested_limit = data.get("limit", 4)
    try:
        requested_limit = int(requested_limit)
    except (TypeError, ValueError):
        requested_limit = 4

    entries = search_knowledge(q, n=max(1, min(requested_limit, 8)))
    answer, model = generate_answer(q, entries)

    return jsonify(
        {
            "answer": answer,
            "sources": entries[:3],
            "total_found": len(entries),
            "confidence": "high" if len(entries) >= 3 else "medium" if entries else "low",
            "trace": {
                "query": q,
                "model": model,
                "memory_entries_used": len(entries),
                "retrieval": "ChromaDB cosine similarity",
            },
        }
    )


@app.route("/knowledge-map", methods=["GET"])
def knowledge_map():
    entries = _all_entries()
    module_counts = Counter(entry["module"] for entry in entries)
    author_counts = Counter(entry["author"] for entry in entries)
    links = Counter((entry["module"], entry["author"]) for entry in entries)

    return jsonify(
        {
            "nodes": [
                {"id": module, "type": "module", "count": count}
                for module, count in module_counts.most_common()
            ]
            + [
                {"id": author, "type": "author", "count": count}
                for author, count in author_counts.most_common()
            ],
            "links": [
                {"source": module, "target": author, "weight": count}
                for (module, author), count in links.most_common()
            ],
            "summary": _stats(),
        }
    )


@app.route("/bus-factor", methods=["GET"])
def bus_factor():
    entries = _all_entries()
    risks = _module_owner_risk(entries)
    high_risk_count = sum(1 for row in risks if row["risk"] == "high")
    return jsonify(
        {
            "overall_risk": "high" if high_risk_count else "medium" if risks else "unknown",
            "high_risk_modules": high_risk_count,
            "modules": risks,
        }
    )


@app.route("/simulate-change", methods=["POST"])
def simulate_change():
    data = request.get_json(silent=True) or {}
    filepath = _clean(data.get("file"), "auth/middleware.js")
    query_text = f"What should I know before changing {filepath}?"
    entries = search_knowledge(query_text, n=3)
    answer, model = generate_answer(query_text, entries)
    alert_message = f"KnowledgeClaw Alert\n\nFile: {filepath}\n\n{answer}"
    whatsapp_sent, whatsapp_status = send_whatsapp_alert(alert_message)
    return jsonify(
        {
            "file": filepath,
            "warning": answer,
            "sources": entries,
            "model": model,
            "whatsapp_sent": whatsapp_sent,
            "whatsapp_status": whatsapp_status,
            "message": alert_message,
            "demo_value": "Proactive codebase memory before a risky edit",
        }
    )


@app.route("/demo", methods=["GET"])
def demo():
    return jsonify(
        {
            "pitch": "KnowledgeClaw turns GitHub history into durable OpenClaw memory for engineering teams.",
            "scenarios": [
                {
                    "title": "Ask why a decision was made",
                    "method": "POST",
                    "path": "/query",
                    "body": {"query": "Why JWT?"},
                },
                {
                    "title": "Show institutional memory graph",
                    "method": "GET",
                    "path": "/knowledge-map",
                },
                {
                    "title": "Find risky single-owner modules",
                    "method": "GET",
                    "path": "/bus-factor",
                },
                {
                    "title": "Warn before changing a sensitive file",
                    "method": "POST",
                    "path": "/simulate-change",
                    "body": {"file": "auth/middleware.js"},
                },
            ],
            "judging_fit": {
                "theme": "Productivity Platforms",
                "prototype": "working Flask + ChromaDB + Groq + React UI",
                "technical_depth": "GitHub ingestion, LLM extraction, vector memory, source-backed answers, risk analysis",
            },
        }
    )


@app.route("/stats", methods=["GET"])
def stats():
    return jsonify(_stats())


@app.route("/health", methods=["GET"])
def health():
    stats_payload = _stats()
    return jsonify(
        {
            "status": "ok",
            "service": APP_NAME,
            "model_configured": bool(groq_client),
            "knowledge_entries": stats_payload["knowledge_entries"],
            "routes": ["/query", "/knowledge-map", "/bus-factor", "/simulate-change", "/stats", "/demo"],
        }
    )


if __name__ == "__main__":
    print(f"{APP_NAME} API starting...")
    print(f"Knowledge entries loaded: {collection.count()}")
    print("Running on http://localhost:5001")
    app.run(host="0.0.0.0", port=5001, debug=False)
