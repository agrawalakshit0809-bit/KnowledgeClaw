# KnowledgeClaw — Answer team knowledge questions

When someone asks a question about the codebase, call this API and return the answer.

API: POST http://localhost:5001/query
Body: {"query": "<the question>"}

Return the "answer" field from the response.
Always end with: "Source: <module> by <author>"