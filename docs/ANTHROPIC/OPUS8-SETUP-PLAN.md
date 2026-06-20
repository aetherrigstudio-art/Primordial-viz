# Claude Opus 8 RAG Setup Plan

This document describes what I committed so far and the remaining steps to finish the end-to-end setup so Claude Opus 8 can consult the Opus doc via your RAG pipeline.

Files added in this commit
- docs/ANTHROPIC/CLAUDE-OPUS-8.claude — the imported system prompt ("fable-5" → "opus-8").
- docs/ANTHROPIC/OPUS8-SETUP-PLAN.md (this file) — this plan and next steps.
- server/README.md — skeleton plan for the retrieval server and endpoints.
- android/README.md — client notes + Kotlin snippet to call the server.
- .env.example — environment variables required for server and indexing.

Goals
1. Make the CLAUDE-OPUS-8 doc available to your indexer and vector DB with consistent metadata.
2. Implement a small retrieval service that returns top-K relevant chunks for a user query.
3. Assemble the Anthropic prompt with those chunks and call Claude (claude-opus-8). Return result to Android client.
4. Provide minimal Android client example that calls the retrieval endpoint.

Decisions / defaults used
- Repo: aetherrigstudio-art/Primordial-viz (committed to the repo's default branch).
- Vector DB: not implemented yet — you can use Pinecone, FAISS, Weaviate, Milvus, etc. I left a plan for Pinecone as the recommended default.
- Embeddings: not implemented in code here — use OpenAI, Anthropic, or local sentence-transformers. Instructions below show how to plug your provider.
- Server: not yet implemented; I added a README with the intended structure and endpoints. I did NOT commit runnable server code so nothing will run until you implement the indexer.

Next steps (what I will implement if you confirm):
1. Choose vector DB and embedding provider.
   - Recommended: Pinecone + Anthropic or OpenAI embeddings.
2. I will add a FastAPI service with endpoints:
   - POST /reindex — read docs/ANTHROPIC/CLAUDE-OPUS-8.claude, chunk it, embed chunks, upsert to vector DB.
   - POST /query — given {q, top_k}, embed query, fetch nearest chunks, assemble prompt, call Anthropic API (claude-opus-8), and return model output.
   - Optional: GET /status and /health.
3. Add a Dockerfile and requirements; add .env.example with variables and README run instructions.
4. Add unit tests and a small test-suite of queries that should trigger Opus-8 doc retrieval.

How to finish quickly (manual steps you can run now)
1. Choose and provision a vector DB (Pinecone easy to start). Create API key and env info.
2. Pick embedding provider and set API key (OPENAI_API_KEY or ANTHROPIC_EMBEDDING_KEY). If you prefer local, install sentence-transformers.
3. Implement a small indexer script: chunk -> embed -> upsert.
4. Implement the /query endpoint that: embeds query -> similarity search -> assemble system + refs -> call Anthropic.
5. Test by running a few queries about system behavior, child safety, and product info; verify responses include [REF n] citations when relevant.

Security & safety notes
- Do NOT store API keys in the repo. Use environment variables or a secrets manager. I added .env.example as a template.
- Anthropic/Claude enforces safety/copyright server-side; you cannot bypass those checks by adding files.
- Do not index secrets or credentials. Remove any confidential text from the document before indexing.

If you want me to finish the server and Android client now, reply with one of the following:
- "Implement server (Pinecone + Anthropic embeddings)" — I will add a FastAPI app, indexer, Dockerfile, and Android sample and push to a new branch named claude-opus8-setup.
- "Implement server (FAISS local + sentence-transformers)" — I will implement a local FAISS-based service.
- "Just push what you have" — I will stop here (already pushed). If you choose this, nothing else will be changed.

If I do the server work I will not commit any secrets. You will need to provide API keys as environment variables when running the service.

---

Timestamp: 2026-06-20 (commit prepared by assistant)
