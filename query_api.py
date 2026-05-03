from flask import Flask, request, jsonify
from flask_cors import CORS
import chromadb
import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

app = Flask(__name__)
CORS(app)

chroma_client = chromadb.PersistentClient(path="./data/chromadb")
collection = chroma_client.get_or_create_collection(name="knowledge")
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def search_knowledge(query, n=3):
    count = collection.count()
    if count == 0:
        return []
    results = collection.query(
        query_texts=[query],
        n_results=min(n, count)
    )
    entries = []
    for i, doc in enumerate(results["documents"][0]):
        meta = results["metadatas"][0][i]
        entries.append({
            "decision": meta.get("decision", ""),
            "rationale": meta.get("rationale", ""),
            "module": meta.get("module", ""),
            "author": meta.get("author", ""),
            "source": meta.get("source", ""),
            "date": meta.get("date", "")
        })
    return entries

def generate_answer(query, entries):
    if not entries:
        return "No knowledge found for this query. Try asking about JWT, payments, database, or API decisions."
    
    context = "\n".join([
        f"- Decision: {e['decision']}\n  Rationale: {e['rationale']}\n  Module: {e['module']} | Author: {e['author']}"
        for e in entries
    ])
    
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{
            "role": "user",
            "content": f"""You are KnowledgeClaw, a team knowledge assistant. Answer this question using only the knowledge below.
Be concise — max 3 sentences. Always mention who made the decision and why.

Question: {query}

Knowledge base:
{context}

Answer:"""
        }],
        max_tokens=200
    )
    return response.choices[0].message.content.strip()

@app.route('/query', methods=['POST'])
def query():
    data = request.json
    q = data.get('query', '')
    if not q:
        return jsonify({"error": "No query provided"}), 400
    
    entries = search_knowledge(q)
    answer = generate_answer(q, entries)
    
    return jsonify({
        "answer": answer,
        "sources": entries[:2],
        "total_found": len(entries)
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "knowledge_entries": collection.count()
    })

if __name__ == '__main__':
    print(f"KnowledgeClaw API starting...")
    print(f"Knowledge entries loaded: {collection.count()}")
    print(f"Running on http://localhost:5001")
    app.run(port=5001, debug=False)