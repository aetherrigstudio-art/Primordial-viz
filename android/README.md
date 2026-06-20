# Android client notes

This file shows the minimal approach for your Android (Kotlin) client to call the retrieval server.

1) Endpoint: POST /query
   - Body: { "q": "user question", "top_k": 4 }
   - Response: { "answer": "...", "refs": ["REF 1","REF 2"], "raw": { ... } }

2) Kotlin (Retrofit) sketch

```kotlin
interface ApiService {
  @POST("/query")
  suspend fun query(@Body body: QueryRequest): Response<QueryResponse>
}

// QueryRequest/QueryResponse are simple data classes matching server JSON
```

3) UI
- Send user text to /query, show a loading spinner, then display `answer`.
- If `refs` is non-empty, show a small disclosure "Sourced from docs" and allow the user to view the raw REF text (optional).

4) Notes
- Keep the Anthropic key on the server — do not call Anthropic from the device.
- Use HTTPS for server endpoint in production.
