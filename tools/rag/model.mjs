// tools/rag/model.mjs
// Dep-free model constants. Kept separate from embed.mjs so model-free callers
// (e.g. build-index --check) can read these without loading the transformers lib.
export const MODEL = 'Xenova/all-MiniLM-L6-v2';
export const DIM = 384;
