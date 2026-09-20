# Fact Check Retrieval v4

Adds Bing News RSS as a direct-source discovery fallback and retrieval diagnostics.

The live Worker health stage should report `fact-check-retrieval-v4-bing-browser-diagnostics`.

When a fact check runs, the result now includes `candidateCount`, `browserAvailable`, and `retrievalDiagnostics` so failed retrieval can be diagnosed without guessing.
