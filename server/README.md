# Retrieval server — README (skeleton)

This folder will contain the retrieval/indexing service that your Android app calls. It is intentionally left as a skeleton in this commit. Follow the plan below to implement it.

Architecture (recommended)
- FastAPI service (Python)
- Indexing script: chunk -> embed -> upsert to vector DB (Pinecone recommended)
- Endpoints:
  - POST /reindex (no-auth or basic-auth for now) — reindex the local files (docs/ANTHROPIC/*)
  - POST /query { q: string, top_k: int } — return Claude answer (server calls Anthropic)

Env vars (.env)
- PINECONE_API_KEY, PINECONE_ENV, PINECONE_INDEX_NAME
- OPENAI_API_KEY or ANTHROPIC_API_KEY (for embeddings & completion)
- ANTHROPIC_API_KEY (for Claude completion if using Anthropic)

Local run (high level)
1. pip install -r requirements.txt
2. Fill .env with API keys
3. python scripts/index_opus8.py  # indexes docs/ANTHROPIC/CLAUDE-OPUS-8.claude
4. uvicorn server.app:app --host 0.0.0.0 --port 8080

Security notes
- Do not commit your .env file. Use a secrets manager in production.
- Protect /reindex endpoint (basic auth or token) if exposing publicly.

I can add a complete implementation (FastAPI + Pinecone + Anthropic/OpenAI embedding calls) when you confirm which provider(s) to use.
