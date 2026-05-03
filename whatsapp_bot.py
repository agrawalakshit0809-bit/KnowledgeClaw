from flask import Flask, request
from flask_cors import CORS
import requests
import chromadb
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

chroma_client = chromadb.PersistentClient(path="./data/chromadb")
collection = chroma_client.get_or_create_collection(name="knowledge")
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def answer_question(query):
    count = collection.count()
    if count == 0:
        return "No knowledge entries found."
    
    results = collection.query(query_texts=[query], n_results=min(3, count))
    
    context = "\n".join([
        f"- {m.get('decision', '')}: {m.get('rationale', '')}"
        for m in results["metadatas"][0]
    ])
    
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": f"Answer in 2 sentences max using this knowledge:\n{context}\n\nQuestion: {query}"}],
        max_tokens=150
    )
    return response.choices[0].message.content.strip()

@app.route('/webhook', methods=['POST'])
def webhook():
    data = request.json
    message = data.get('message', '')
    answer = answer_question(message)
    return {"reply": answer}

@app.route('/ask', methods=['GET'])
def ask():
    query = request.args.get('q', '')
    if not query:
        return {"error": "No query"}
    answer = answer_question(query)
    return {"answer": answer}

if __name__ == '__main__':
    print("WhatsApp bot API running on port 5002")
    app.run(port=5002)