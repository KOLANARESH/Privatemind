/**
 * Database Seeder for PrivateMind AI
 * Seeds initial users, realistic documents, personal notes, and memories.
 */

import fs from "fs";
import path from "path";
import { db } from "./db";
import { ensureUsersExist, PRIMARY_USER } from "./auth";
import { generateEmbedding } from "./embeddings";
import { chunkText } from "./ingestion";

export async function seedDatabase() {
  await ensureUsersExist();

  // Check if primary user already has documents
  const existingDocs = await db.document.count({
    where: { userId: PRIMARY_USER.id },
  });

  if (existingDocs > 0) {
    console.log("Database already seeded with documents.");
    return;
  }

  console.log("Seeding initial documents, notes, and memories...");

  const storageDir = path.resolve(process.cwd(), "uploads", "vault");
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  // 1. Seed Document: University Application Requirements
  const doc1Content = `# Graduate School University Application Requirements (2026-2027)

## 1. Admission Prerequisites
Applicants must hold a Bachelor of Science or equivalent degree from an accredited institution. A minimum cumulative GPA of 3.5 on a 4.0 scale is strongly recommended.

## 2. Standardized Testing & Language Proficiency
- GRE General Test: Optional for the current admission cycle.
- TOEFL / IELTS: Required for international applicants who did not graduate from an English-medium undergraduate institution (Minimum TOEFL: 100 iBT, IELTS: 7.5).

## 3. Required Application Materials
1. Statement of Purpose (SOP): Maximum 2 pages double-spaced outlining research interests, relevant experience, and intended faculty advisors.
2. Three (3) Letters of Recommendation: At least two letters must be from academic faculty members familiar with your research capabilities.
3. Official Transcripts from all post-secondary institutions attended.
4. Up-to-date Curriculum Vitae (CV) emphasizing publications, projects, and open-source contributions.

## 4. Key Deadlines & Submission Portal
- Priority Review & Departmental Fellowship Deadline: December 15, 2026.
- Final Regular Decision Deadline: January 15, 2027.
- Financial Guarantee & Affidavit Submission: Required upon notification of acceptance.
`;

  const doc1Path = path.join(storageDir, "University_Application_Requirements.md");
  fs.writeFileSync(doc1Path, doc1Content, "utf-8");

  const doc1 = await db.document.create({
    data: {
      userId: PRIMARY_USER.id,
      title: "University Application Requirements",
      fileName: "University_Application_Requirements.md",
      fileType: "md",
      fileSize: Buffer.byteLength(doc1Content),
      filePath: doc1Path,
      mimeType: "text/markdown",
      status: "COMPLETED",
      rawText: doc1Content,
      pageCount: 1,
    },
  });

  const doc1Chunks = chunkText([{ pageNumber: 1, text: doc1Content }]);
  for (const c of doc1Chunks) {
    const emb = await generateEmbedding(c.content);
    await db.documentChunk.create({
      data: {
        documentId: doc1.id,
        userId: PRIMARY_USER.id,
        chunkIndex: c.chunkIndex,
        pageNumber: c.pageNumber,
        content: c.content,
        embeddingJson: JSON.stringify(emb),
        tokenCount: c.content.split(/\s+/).length,
      },
    });
  }

  // 2. Seed Document: Q3 Project Report
  const doc2Content = `# Q3 Engineering & Research Report: PrivateMind AI Architecture

## Executive Summary
During the third quarter, the engineering team focused on optimizing semantic retrieval latency, implementing multi-tenant memory controls, and establishing verifiable privacy boundaries.

## Key Performance Improvements
- Query Retrieval Latency: Reduced average response latency by 42% across vector indices.
- Cache Hit Rate: Memory-level retrieval achieved an 89% cache hit rate for recurring analytical workflows.
- Vector Space Calibration: Implemented normalized cosine projection, eliminating cross-domain semantic drift.

## Security & Privacy Sandbox Milestones
1. Document Isolation: Every database query enforces hard user-level isolation predicates.
2. Zero Data Leaks: External inference requests strip all user identification and retain no private payloads on public servers.
3. Prompt-Injection Guardrails: Document ingestion sanitizes adversarial system overrides before synthesis.

## Next Milestones & Upcoming Deliverables
- Milestone 4 Review: Scheduled for October 25, 2026.
- Cross-platform synchronization testing commences November 10, 2026.
`;

  const doc2Path = path.join(storageDir, "Q3_Project_Report.md");
  fs.writeFileSync(doc2Path, doc2Content, "utf-8");

  const doc2 = await db.document.create({
    data: {
      userId: PRIMARY_USER.id,
      title: "Q3 Project Report: Architecture & Security",
      fileName: "Q3_Project_Report.md",
      fileType: "md",
      fileSize: Buffer.byteLength(doc2Content),
      filePath: doc2Path,
      mimeType: "text/markdown",
      status: "COMPLETED",
      rawText: doc2Content,
      pageCount: 1,
    },
  });

  const doc2Chunks = chunkText([{ pageNumber: 1, text: doc2Content }]);
  for (const c of doc2Chunks) {
    const emb = await generateEmbedding(c.content);
    await db.documentChunk.create({
      data: {
        documentId: doc2.id,
        userId: PRIMARY_USER.id,
        chunkIndex: c.chunkIndex,
        pageNumber: c.pageNumber,
        content: c.content,
        embeddingJson: JSON.stringify(emb),
        tokenCount: c.content.split(/\s+/).length,
      },
    });
  }

  // 3. Seed Notes
  const note1Content = `Comparative study on vector retrieval efficiency:\n- pgvector with HNSW indexing provides robust multi-dimensional similarity for large clusters (>1M vectors).\n- In-memory normalized vector projection with cosine distance provides sub-millisecond lookups for personal vaults (<10k records) with zero cold-start overhead.\n- Recommendation: Keep SQLite with normalized local embeddings for local-first vaults, provide pgvector migration for enterprise clouds.`;
  const note1Emb = await generateEmbedding(note1Content);

  await db.note.create({
    data: {
      userId: PRIMARY_USER.id,
      title: "Comparative Notes: Vector Search Architectures",
      content: note1Content,
      category: "Research",
      tagsJson: JSON.stringify(["vector", "architecture", "sqlite"]),
      isIndexed: true,
      embeddingJson: JSON.stringify(note1Emb),
    },
  });

  const note2Content = `Upcoming Academic Assignments & Deadlines:\n1. Distributed Systems Lab 3 (Raft Consensus) - Due Friday Oct 17\n2. Advanced Machine Learning Paper Review - Due Monday Oct 20\n3. Final Thesis Proposal Draft - Due November 2nd\nPrepare presentation slides 48 hours before the review committee meeting.`;
  const note2Emb = await generateEmbedding(note2Content);

  await db.note.create({
    data: {
      userId: PRIMARY_USER.id,
      title: "Upcoming Assignments & Academic Deadlines",
      content: note2Content,
      category: "Study",
      tagsJson: JSON.stringify(["assignments", "deadlines", "fall2026"]),
      isIndexed: true,
      embeddingJson: JSON.stringify(note2Emb),
    },
  });

  // 4. Seed Persistent Memories
  await db.memory.create({
    data: {
      userId: PRIMARY_USER.id,
      content: "Alex prefers direct answers accompanied by bullet points, citation sources, and confidence indicators.",
      category: "preference",
      isPersistent: true,
      confidence: 1.0,
      sourceSummary: "User preferences configuration",
    },
  });

  await db.memory.create({
    data: {
      userId: PRIMARY_USER.id,
      content: "Primary research focus is privacy-preserving AI architecture and personal knowledge vaults.",
      category: "fact",
      isPersistent: true,
      confidence: 1.0,
      sourceSummary: "Q3 Engineering Report",
    },
  });

  await db.memory.create({
    data: {
      userId: PRIMARY_USER.id,
      content: "University graduate application priority review deadline is December 15, 2026.",
      category: "fact",
      isPersistent: true,
      confidence: 1.0,
      sourceSummary: "University_Application_Requirements.md",
    },
  });

  console.log("Database seeded successfully!");
}
