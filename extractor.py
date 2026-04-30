import json
import os
import chromadb
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
chroma_client = chromadb.PersistentClient(path="./data/chromadb")
collection = chroma_client.get_or_create_collection(
    name="knowledge",
    metadata={"hnsw:space": "cosine"}
)

def extract_knowledge(text, source_type, metadata):
    if not text or len(text.strip()) < 20:
        return None
    
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{
                "role": "user",
                "content": f"""Extract technical knowledge from this {source_type}.
Return a JSON object with these exact fields:
- decision: the technical decision made (string, max 100 chars)
- rationale: why this decision was made (string, max 200 chars)  
- module: which part of codebase this relates to (string, max 50 chars)
- impact: high/medium/low (string)

If no clear technical decision exists, return {{"skip": true}}

Text to analyze:
{text[:1000]}

Return ONLY valid JSON, nothing else."""
            }],
            max_tokens=300
        )
        
        content = response.choices[0].message.content.strip()
        # Clean markdown if present
        content = content.replace("```json", "").replace("```", "").strip()
        result = json.loads(content)
        
        if result.get("skip"):
            return None
            
        return result
    except Exception as e:
        print(f"  Skipping — {str(e)[:50]}")
        return None

def store_knowledge(entry_id, text, metadata, knowledge):
    try:
        collection.add(
            ids=[entry_id],
            documents=[text],
            metadatas=[metadata]
        )
    except Exception as e:
        print(f"  Storage error: {str(e)[:50]}")

def process_commits():
    print("\nProcessing commits...")
    try:
        with open("data/raw/commits.json") as f:
            commits = json.load(f)
    except:
        print("  No commits file found")
        return
    
    count = 0
    for commit in commits:
        msg = commit.get("message", "")
        if len(msg.strip()) < 10:
            continue
            
        knowledge = extract_knowledge(msg, "commit message", {})
        if knowledge:
            metadata = {
                "source": "commit",
                "author": commit.get("author", "unknown"),
                "date": commit.get("date", ""),
                "sha": commit.get("sha", ""),
                "module": knowledge.get("module", "general"),
                "impact": knowledge.get("impact", "low"),
                "decision": knowledge.get("decision", "")[:100],
                "rationale": knowledge.get("rationale", "")[:200]
            }
            store_knowledge(
                f"commit_{commit.get('sha', count)}",
                f"Decision: {knowledge.get('decision')}. Rationale: {knowledge.get('rationale')}",
                metadata,
                knowledge
            )
            count += 1
            print(f"  Stored: {knowledge.get('decision', '')[:60]}")
    
    print(f"  Processed {count} commits")

def process_pull_requests():
    print("\nProcessing pull requests...")
    try:
        with open("data/raw/pull_requests.json") as f:
            prs = json.load(f)
    except:
        print("  No PRs file found")
        return
    
    count = 0
    for pr in prs:
        text = f"PR: {pr.get('title', '')}. {pr.get('body', '')}"
        
        knowledge = extract_knowledge(text, "pull request", {})
        if knowledge:
            metadata = {
                "source": "pull_request",
                "author": pr.get("author", "unknown"),
                "date": pr.get("created_at", ""),
                "pr_number": str(pr.get("number", "")),
                "module": knowledge.get("module", "general"),
                "impact": knowledge.get("impact", "low"),
                "decision": knowledge.get("decision", "")[:100],
                "rationale": knowledge.get("rationale", "")[:200]
            }
            store_knowledge(
                f"pr_{pr.get('number', count)}",
                f"Decision: {knowledge.get('decision')}. Rationale: {knowledge.get('rationale')}",
                metadata,
                knowledge
            )
            count += 1
            print(f"  Stored: {knowledge.get('decision', '')[:60]}")
    
    print(f"  Processed {count} PRs")

def process_issues():
    print("\nProcessing issues...")
    try:
        with open("data/raw/issues.json") as f:
            issues = json.load(f)
    except:
        print("  No issues file found")
        return
    
    count = 0
    for issue in issues:
        text = f"Issue: {issue.get('title', '')}. {issue.get('body', '')}"
        
        knowledge = extract_knowledge(text, "GitHub issue", {})
        if knowledge:
            metadata = {
                "source": "issue",
                "author": issue.get("author", "unknown"),
                "date": issue.get("created_at", ""),
                "issue_number": str(issue.get("number", "")),
                "module": knowledge.get("module", "general"),
                "impact": knowledge.get("impact", "low"),
                "decision": knowledge.get("decision", "")[:100],
                "rationale": knowledge.get("rationale", "")[:200]
            }
            store_knowledge(
                f"issue_{issue.get('number', count)}",
                f"Decision: {knowledge.get('decision')}. Rationale: {knowledge.get('rationale')}",
                metadata,
                knowledge
            )
            count += 1
            print(f"  Stored: {knowledge.get('decision', '')[:60]}")
    
    print(f"  Processed {count} issues")

def test_query(query):
    print(f"\nTest query: '{query}'")
    results = collection.query(
        query_texts=[query],
        n_results=min(3, collection.count())
    )
    
    if not results["ids"][0]:
        print("  No results found")
        return
        
    for i, doc in enumerate(results["documents"][0]):
        meta = results["metadatas"][0][i]
        print(f"\n  Result {i+1}:")
        print(f"  Source: {meta.get('source')} | Author: {meta.get('author')}")
        print(f"  Decision: {meta.get('decision', '')[:80]}")
        print(f"  Rationale: {meta.get('rationale', '')[:100]}")

if __name__ == "__main__":
    print("Starting knowledge extraction...")
    print(f"Existing entries in ChromaDB: {collection.count()}")
    
    process_commits()
    process_pull_requests()
    process_issues()
    
    print(f"\nTotal knowledge entries: {collection.count()}")
    
    # Test it works
    test_query("authentication")
    test_query("why was this decision made")
    
    print("\nDay 3 complete! ChromaDB is loaded with knowledge.")