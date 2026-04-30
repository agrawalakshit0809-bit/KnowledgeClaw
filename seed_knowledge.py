import chromadb
import os
from dotenv import load_dotenv
load_dotenv()

chroma_client = chromadb.PersistentClient(path="./data/chromadb")
collection = chroma_client.get_or_create_collection(
    name="knowledge",
    metadata={"hnsw:space": "cosine"}
)

entries = [
    {
        "id": "manual_1",
        "text": "Decision: Use JWT for authentication over sessions. Rationale: Mobile team needed stateless auth across multiple services. Sessions rejected due to sticky session complexity on load balancer.",
        "metadata": {"source": "pull_request", "author": "Akshit", "date": "2025-10-14", "module": "Authentication", "impact": "high", "decision": "Use JWT for authentication over sessions", "rationale": "Mobile team needed stateless auth across multiple services. Sessions rejected due to sticky session complexity.", "pr_number": "31"}
    },
    {
        "id": "manual_2", 
        "text": "Decision: Use Groq API over OpenAI for AI inference. Rationale: Free tier sufficient for MVP. 10x faster inference speed. Can switch to OpenAI when scaling to production.",
        "metadata": {"source": "commit", "author": "Akshit", "date": "2025-11-20", "module": "API Gateway", "impact": "high", "decision": "Use Groq API over OpenAI", "rationale": "Free tier sufficient for MVP. 10x faster inference. Can switch to OpenAI when scaling.", "sha": "a3f2c1"}
    },
    {
        "id": "manual_3",
        "text": "Decision: Webhook deduplication using idempotency keys. Rationale: Payment webhooks were firing twice causing duplicate charges. Fixed with Redis-based idempotency key check on every incoming webhook.",
        "metadata": {"source": "pull_request", "author": "Akshit", "date": "2025-12-01", "module": "Payment Module", "impact": "high", "decision": "Webhook deduplication using idempotency keys", "rationale": "Payment webhooks were firing twice causing duplicate charges. Fixed with Redis-based idempotency key check.", "pr_number": "58"}
    },
    {
        "id": "manual_4",
        "text": "Decision: ChromaDB for vector storage over Pinecone. Rationale: Runs locally with zero cost. Sufficient for current scale. Pinecone adds $70/month with no benefit at this stage.",
        "metadata": {"source": "pull_request", "author": "Ishita", "date": "2026-01-15", "module": "Infrastructure", "impact": "medium", "decision": "ChromaDB for vector storage over Pinecone", "rationale": "Runs locally with zero cost. Sufficient for current scale. Pinecone adds $70/month with no benefit.", "pr_number": "71"}
    },
    {
        "id": "manual_5",
        "text": "Decision: React frontend over Angular. Rationale: Smaller bundle size, faster initial load. Team has more React experience. Angular rejected due to complexity overhead for this project size.",
        "metadata": {"source": "pull_request", "author": "Ishita", "date": "2025-09-10", "module": "Frontend", "impact": "high", "decision": "React frontend over Angular", "rationale": "Smaller bundle size, faster initial load. Team has more React experience.", "pr_number": "5"}
    },
    {
        "id": "manual_6",
        "text": "Decision: Node.js Express over FastAPI for backend. Rationale: Team familiar with JavaScript ecosystem. Shared types with React frontend. FastAPI rejected as it would require Python context switching.",
        "metadata": {"source": "commit", "author": "Akshit", "date": "2025-08-20", "module": "Backend", "impact": "high", "decision": "Node.js Express over FastAPI", "rationale": "Team familiar with JavaScript ecosystem. Shared types with React frontend.", "sha": "b2e4f8"}
    },
    {
        "id": "manual_7",
        "text": "Decision: Store session tokens in httpOnly cookies not localStorage. Rationale: localStorage is vulnerable to XSS attacks. httpOnly cookies are inaccessible to JavaScript. Security audit recommendation.",
        "metadata": {"source": "pull_request", "author": "Akshit", "date": "2025-10-28", "module": "Authentication", "impact": "high", "decision": "Store session tokens in httpOnly cookies not localStorage", "rationale": "localStorage vulnerable to XSS. httpOnly cookies inaccessible to JavaScript per security audit.", "pr_number": "38"}
    },
    {
        "id": "manual_8",
        "text": "Decision: Use database connection pooling with max 10 connections. Rationale: Without pooling, each request opened a new DB connection causing memory exhaustion under load. Pool of 10 handles current traffic.",
        "metadata": {"source": "commit", "author": "Ishita", "date": "2025-11-05", "module": "Database Layer", "impact": "high", "decision": "Database connection pooling with max 10 connections", "rationale": "Without pooling each request opened new DB connection causing memory exhaustion. Pool of 10 handles current traffic.", "sha": "c9d3a2"}
    }
]

# Clear existing and add fresh
existing = collection.count()
print(f"Existing entries: {existing}")

for entry in entries:
    try:
        collection.add(
            ids=[entry["id"]],
            documents=[entry["text"]],
            metadatas=[entry["metadata"]]
        )
        print(f"Added: {entry['metadata']['decision'][:60]}")
    except Exception as e:
        print(f"Skipped (already exists): {entry['id']}")

print(f"\nTotal entries now: {collection.count()}")

# Test queries
print("\nTest: 'why JWT?'")
results = collection.query(query_texts=["why JWT authentication"], n_results=2)
for i, doc in enumerate(results["documents"][0]):
    meta = results["metadatas"][0][i]
    print(f"  → {meta.get('decision', '')[:70]}")

print("\nTest: 'payment webhook'")
results = collection.query(query_texts=["payment webhook duplicate"], n_results=2)
for i, doc in enumerate(results["documents"][0]):
    meta = results["metadatas"][0][i]
    print(f"  → {meta.get('decision', '')[:70]}")

print("\nKnowledge base ready!")