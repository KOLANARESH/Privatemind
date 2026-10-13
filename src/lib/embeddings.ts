/**
 * PrivateMind AI - Semantic Embedding & Retrieval Engine
 * Privacy-first local vector representations with keyword fallback.
 */

const VECTOR_DIMENSIONS = 256;

// Common stop words to reduce noise in semantic vector projection
const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
  "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
  "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't",
  "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have",
  "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself",
  "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into",
  "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my",
  "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our",
  "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's",
  "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs",
  "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're",
  "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't",
  "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's",
  "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't",
  "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself",
  "yourselves"
]);

/**
 * Hash a token string into a pseudo-random integer
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Tokenize string into clean alphanumeric words and character n-grams
 */
export function tokenize(text: string): string[] {
  const clean = text.toLowerCase().replace(/[^a-z0-9_\s-]/g, " ");
  const rawTokens = clean.split(/\s+/).filter((t) => t.length > 2);
  const tokens: string[] = [];

  for (const t of rawTokens) {
    if (!STOP_WORDS.has(t)) {
      tokens.push(t);
    }
  }

  return tokens;
}

/**
 * Generate a dense normalized vector for text
 * Employs feature hashing (the hashing trick) with term frequencies
 * and L2 unit-normalization for cosine distance computations.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const vector = new Float64Array(VECTOR_DIMENSIONS);
  const tokens = tokenize(text);

  if (tokens.length === 0) {
    return Array.from(vector);
  }

  for (const token of tokens) {
    const h1 = hashString(token);
    const index = h1 % VECTOR_DIMENSIONS;
    // Sign hashing to reduce hash collision bias
    const sign = (hashString(token + "_sign") % 2 === 0) ? 1 : -1;
    // Length weighting
    const weight = token.length > 3 ? 1.5 : 1.0;
    vector[index] += sign * weight;
  }

  // Calculate L2 norm
  let norm = 0;
  for (let i = 0; i < VECTOR_DIMENSIONS; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < VECTOR_DIMENSIONS; i++) {
      vector[i] /= norm;
    }
  }

  return Array.from(vector);
}

/**
 * Compute cosine similarity between two unit-normalized embedding vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  const len = Math.min(vecA.length, vecB.length);
  let dot = 0;
  for (let i = 0; i < len; i++) {
    dot += vecA[i] * vecB[i];
  }
  return Math.max(0, Math.min(1, dot));
}

/**
 * BM25 / Keyword relevance score between query and document text
 */
export function bm25KeywordScore(query: string, content: string): number {
  const queryTokens = tokenize(query);
  const contentTokens = tokenize(content);
  if (queryTokens.length === 0 || contentTokens.length === 0) return 0;

  const contentFreq: Record<string, number> = {};
  for (const token of contentTokens) {
    contentFreq[token] = (contentFreq[token] || 0) + 1;
  }

  let matches = 0;
  let totalScore = 0;
  const docLen = contentTokens.length;
  const avgDocLen = 150;
  const k1 = 1.2;
  const b = 0.75;

  for (const q of queryTokens) {
    const f = contentFreq[q] || 0;
    if (f > 0) {
      matches++;
      const idf = Math.log(1 + 10 / (1 + 1));
      const tf = (f * (k1 + 1)) / (f + k1 * (1 - b + b * (docLen / avgDocLen)));
      totalScore += idf * tf;
    }
  }

  // Normalize between 0 and 1
  const normalized = matches > 0 ? Math.min(1, totalScore / (queryTokens.length * 2.5)) : 0;
  return normalized;
}
