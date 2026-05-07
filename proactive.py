import os

import chromadb
import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from groq import Groq


load_dotenv()

app = Flask(__name__)
CORS(app)

chroma_client = chromadb.PersistentClient(path=os.getenv("CHROMA_PATH", "./data/chromadb"))
collection = chroma_client.get_or_create_collection(name="knowledge")

groq_api_key = os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=groq_api_key) if groq_api_key else None


def search_for_file(filepath):
    count = collection.count()
    if count == 0:
        return []

    results = collection.query(
        query_texts=[f"knowledge about {filepath}"],
        n_results=min(3, count),
        include=["metadatas"],
    )
    entries = results.get("metadatas", [[]])[0] or []
    if not entries:
        return []

    filepath_lower = filepath.lower()
    relevant = [
        entry
        for entry in entries
        if any(
            keyword in filepath_lower
            for keyword in [str(entry.get("module", "")).lower(), "auth", "payment", "api", "db"]
        )
    ]
    return relevant if relevant else entries[:2]


def generate_warning(filepath, entries):
    context = "\n".join(
        [f"- {entry.get('decision', '')}: {entry.get('rationale', '')}" for entry in entries[:2]]
    )

    if not groq_client:
        return (
            "KnowledgeClaw Alert: This file matches stored team memory. "
            "Review the linked decision before changing it."
        )

    response = groq_client.chat.completions.create(
        model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        messages=[
            {
                "role": "user",
                "content": f"""You just modified {filepath}.
Based on this team knowledge, give one specific warning in 2 sentences max:
{context}
Start with: "KnowledgeClaw Alert:"
""",
            }
        ],
        max_tokens=100,
        temperature=0.2,
    )
    return response.choices[0].message.content.strip()


def send_whatsapp_alert(message):
    token = os.getenv("OPENCLAW_AUTH_TOKEN")
    recipient = os.getenv("WHATSAPP_TO")
    if not token or not recipient:
        print("WhatsApp alert skipped: OPENCLAW_AUTH_TOKEN or WHATSAPP_TO missing")
        return False

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

    for endpoint in endpoints:
        try:
            response = requests.post(endpoint, headers=headers, json=payload, timeout=5)
            print(f"Tried {endpoint}: {response.status_code} {response.text[:100]}")
            if response.status_code < 400:
                return True
        except Exception as exc:
            print(f"Failed {endpoint}: {exc}")
    return False


@app.route("/webhook/github", methods=["POST"])
def github_webhook():
    data = request.get_json(silent=True) or {}
    commits = data.get("commits", [])
    if not commits:
        return jsonify({"status": "no commits"}), 200

    modified_files = []
    for commit in commits:
        modified_files.extend(commit.get("modified", []))
        modified_files.extend(commit.get("added", []))

    alerts_sent = 0
    alerts = []
    for filepath in modified_files[:3]:
        entries = search_for_file(filepath)
        if entries:
            warning = generate_warning(filepath, entries)
            full_message = f"{warning}\n\nFile: {filepath}\nFrom KnowledgeClaw"
            sent = send_whatsapp_alert(full_message)
            alerts.append({"file": filepath, "warning": warning, "sent": sent})
            if sent:
                alerts_sent += 1

    return jsonify({"status": "ok", "alerts_sent": alerts_sent, "alerts": alerts})


@app.route("/simulate", methods=["POST"])
def simulate():
    data = request.get_json(silent=True) or {}
    filepath = data.get("file", "auth/middleware.js")
    entries = search_for_file(filepath)
    if not entries:
        return jsonify({"message": "No knowledge found for this file", "file": filepath})

    warning = generate_warning(filepath, entries)
    full_message = f"{warning}\n\nFile: {filepath}\nFrom KnowledgeClaw"
    sent = send_whatsapp_alert(full_message)
    return jsonify(
        {
            "warning": warning,
            "file": filepath,
            "whatsapp_sent": sent,
            "message": full_message,
            "sources": entries[:2],
        }
    )


@app.route("/health", methods=["GET"])
def health():
    return jsonify(
        {
            "status": "ok",
            "knowledge_entries": collection.count(),
            "whatsapp_configured": bool(os.getenv("OPENCLAW_AUTH_TOKEN") and os.getenv("WHATSAPP_TO")),
        }
    )


if __name__ == "__main__":
    print("Proactive KnowledgeClaw server running on port 5003")
    print(f"Knowledge entries: {collection.count()}")
    app.run(host="0.0.0.0", port=5003)
