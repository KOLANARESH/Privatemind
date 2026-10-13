import { db } from "../src/lib/db";
import { generateEmbedding, cosineSimilarity, bm25KeywordScore } from "../src/lib/embeddings";

async function main() {
  const query = "What were the key points in my last project report?";
  const qEmb = await generateEmbedding(query);
  const chunks = await db.documentChunk.findMany({ include: { document: true } });
  
  for (const c of chunks) {
    const vScore = c.embeddingJson ? cosineSimilarity(qEmb, JSON.parse(c.embeddingJson)) : 0;
    const kScore = bm25KeywordScore(query, c.content);
    const hybrid = Math.max(vScore, kScore);
    console.log(c.document.title, "Chunk", c.chunkIndex, "Hybrid Score:", hybrid.toFixed(3));
  }

  // Also test unrelated query
  const unrelated = "What is the secret recipe for Martian rocket propulsion fuel from 1824?";
  const uEmb = await generateEmbedding(unrelated);
  let maxUnrelated = 0;
  for (const c of chunks) {
    const vScore = c.embeddingJson ? cosineSimilarity(uEmb, JSON.parse(c.embeddingJson)) : 0;
    const kScore = bm25KeywordScore(unrelated, c.content);
    maxUnrelated = Math.max(maxUnrelated, vScore, kScore);
  }
  console.log("Max unrelated score:", maxUnrelated.toFixed(3));
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
