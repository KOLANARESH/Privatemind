# PrivateMind AI — Privacy-First Personal Knowledge Vault

> **"Your Knowledge. Your Control."**
> A personal knowledge vault with a conversational AI interface, semantic vector retrieval, strict multi-tenant isolation, verifiable persistent memory controls, and Lyzr Studio Agent integration.

---

## 1. Architectural Overview

PrivateMind AI is engineered from the ground up around verifiable data ownership and privacy boundaries rather than cosmetic badges.

```mermaid
graph TD
    User([User Request / Upload]) --> Auth[Server-Side Auth & Session Boundary]
    Auth --> AppRouter[Next.js App Router API & Views]
    
    subgraph "Private Local Vault & Database"
        AppRouter --> VaultStorage[Private Host File Vault: uploads/vault/]
        AppRouter --> SQLite[(SQLite / PostgreSQL via Prisma)]
        SQLite --> Chunks[Document Chunks + 256-dim L2 Vector Index]
        SQLite --> Notes[Personal Offline Notes]
        SQLite --> Memories[Persistent Memories + Provenance Sources]
        SQLite --> Audit[Privacy-Safe Audit Log]
    end

    subgraph "Retrieval-Augmented Generation (RAG)"
        AppRouter --> RAG[Grounded RAG Pipeline]
        RAG --> ScopeFilter[User-Scoped Filter: Hard Tenant Isolation]
        ScopeFilter --> Hybrid[Cosine Vector Sim + BM25 Lexical Matching]
        Hybrid --> Guardrails[Prompt-Injection Sanitization & Delimiters]
        Guardrails --> LyzrAdapter[Lyzr Studio Adapter]
        Guardrails --> LocalFallback[Local Grounded Fallback Engine]
    end

    LyzrAdapter --> LyzrAPI[(Lyzr Studio Agent: HTTPS TLS)]
```

### Core Privacy & Architectural Guarantees:
1. **User-Scoped Hard Isolation**: Every query in the database (`Document`, `DocumentChunk`, `Note`, `Memory`, `Conversation`) enforces strict `where: { userId }` predicates. User A cannot read, search, retrieve, edit, or delete User B's vault records.
2. **Persistent Memory vs. Ephemeral Context**: Unlike traditional LLMs that covertly log facts, PrivateMind cleanly distinguishes ephemeral chat sessions from persistent personal memories. Users can view, edit, toggle, or bulk-clear persistent memories with a confirmation dialog.
3. **Local Embedding & Vector Similarity**: Chunks are projected into 256-dimensional unit-normalized semantic vector space, enabling sub-millisecond cosine distance retrieval without mandatory external cloud vector databases.
4. **Keyword Fallback (BM25)**: Automatic lexical fallback when vector similarity is disabled or offline, with explicit disclosure badges displayed to the user.
5. **Prompt-Injection Defenses**: Untrusted documents and inputs are scrubbed of adversarial instruction override attempts before synthesis.
6. **Coordinated Deletion Service**: Deleting a document executes a database transaction that atomically cascades through disk files, document records, semantic chunks, embeddings, and memory provenance links.
7. **Lyzr Studio Integration**: Secure server-side adapter forwarding only the minimal authorized evidence excerpts to Lyzr Studio (`https://agent-prod.studio.lyzr.ai/v3/inference/chat/`). Raw full documents and credentials are never exposed to clients.
8. **Local Offline Fallback**: If external AI processing is toggled off in Privacy Settings or the network is unavailable, the local grounded synthesizer answers strictly from retrieved evidence with zero outbound requests.

---

## 2. Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide React icons.
- **Backend**: Next.js App Router API Routes (`/api/documents`, `/api/notes`, `/api/chat`, `/api/memories`, `/api/privacy`, `/api/dashboard`, `/api/audit`).
- **Database & ORM**: SQLite (`dev.db`) managed via Prisma ORM (`@prisma/client` 6.4.1), easily migratable to PostgreSQL / pgvector.
- **Document Processing**: `pdf-parse` (PDF extraction with page tracking), `mammoth` (DOCX extraction), native UTF-8 streaming (Markdown and TXT).
- **Embeddings & Search**: 256-dimensional L2-normalized vector embedding engine with cosine similarity and BM25 lexical ranking fallback.
- **AI Agent Integration**: Lyzr Studio inference API with automatic local fallback.
- **Testing**: Native Node.js test runner (`node:test`, `node:assert`, `tsx`).

---

## 3. Environment Variables & Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Default / Example |
|---|---|---|
| `DATABASE_URL` | SQLite database file location | `file:./dev.db` |
| `LYZR_API_KEY` | Lyzr Studio API Key | `sk-default-YDlHiH6Vgeot4J1bEQgeTfD2QEKtYaS3` |
| `LYZR_AGENT_ID` | Lyzr Agent ID | `6ace474e031adebb0bc93b2a` |
| `LYZR_USER_ID` | Lyzr Studio registered user ID | `lokeshreddyerelly@gmail.com` |
| `LYZR_SESSION_ID` | Lyzr session identifier | `6ace474e031adebb0bc93b2a-38s7jhn7` |
| `LYZR_ENDPOINT` | Lyzr Studio chat inference URL | `https://agent-prod.studio.lyzr.ai/v3/inference/chat/` |
| `EMBEDDING_PROVIDER` | Search provider (`local-vector` or `keyword-fallback`) | `local-vector` |
| `SIMILARITY_THRESHOLD` | Minimum relevance cutoff score | `0.30` |
| `STORAGE_DIR` | Private file vault directory on local disk | `./uploads/vault` |
| `MAX_FILE_SIZE_MB` | Maximum file upload size in MB | `15` |

---

## 4. Getting Started & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Prisma Client & Database
```bash
npx prisma db push
```

### 3. Seed Realistic Initial Knowledge Base
```bash
npm run seed
```
This populates sample documents (*University Application Requirements*, *Q3 Engineering Report*), personal research notes, and persistent memory records.

### 4. Run the Automated Test Suite
```bash
npm test
```
Runs 10 security, retrieval, isolation, and lifecycle tests:
- Note creation & editing without AI credentials
- PDF/DOCX/MD chunking & text extraction
- Cosine vector similarity & 256-dim normalization
- Source-grounded RAG with citations and page numbers
- Honest insufficient-evidence response for unsupported questions
- Prompt-injection override defense
- Multi-tenant cross-user database isolation
- Memory lifecycle & persistence toggle controls
- Atomic document deletion cascade
- Lyzr Studio integration adapter & local fallback

### 5. Start the Development Server
```bash
npm run dev -- --port 3008
```
Open [http://localhost:3008](http://localhost:3008) in your browser.

---

## 5. Main Application Features & Pages

### A. Overview & Vision (`/` - Tab: Overview & Vision)
- Headline: *"Your Knowledge. Your Control."*
- Architectural transparency explaining verifiable memory and hybrid RAG.
- Honest privacy disclosure avoiding unrealistic marketing claims.

### B. Dashboard (`/` - Tab: Dashboard)
- Real database statistics: total stored documents, personal notes, persistent memories, and storage volume.
- Live processing status metrics (completed, indexing, failed).
- Quick action shortcuts (Upload Document, Create Note, Ask Assistant).
- Recent searches and documents widgets.

### C. Document Library (`/` - Tab: Document Library)
- File upload for PDF, DOCX, TXT, and Markdown up to 15MB.
- MIME type and file extension validation.
- Lifecycle processing badges (`UPLOADED` -> `EXTRACTING` -> `CHUNKING` -> `INDEXING` -> `COMPLETED` / `FAILED`).
- Document Text Inspector modal displaying extracted raw text and semantic chunks.
- Retry button for failed ingestion jobs.
- Delete button triggering transactional cascade cleanup.

### D. Personal Notes (`/` - Tab: Personal Notes)
- Offline-ready note editor with Markdown support.
- Category filters (Research, Study, Work, Personal, General) and `#tags`.
- Semantic search indexing toggle per note.
- Retention settings (indefinite, 30 days, 90 days, session only).

### E. Ask PrivateMind (`/` - Tab: Ask PrivateMind)
- Conversational knowledge assistant with multi-turn chat persistence.
- Scope selector: query entire vault, restrict to selected documents, or filter by category.
- Evidence Quality indicator (`HIGH Evidence`, `MODERATE Evidence`, `INSUFFICIENT Evidence`).
- Supporting Source Cards with page numbers, document titles, relevance scores, and clickable passage inspector modal.
- Honest insufficient-evidence handling when query cannot be answered from stored knowledge.

### F. Memory Center (`/` - Tab: Memory Center)
- Distinguishes ephemeral session context from persistent memories.
- Categories: `preference`, `fact`, `personal`, `goal`, `instruction`.
- Provenance linking to source documents or conversations.
- Global Persistent Memory toggle (disables long-term persistence when turned off).
- Bulk clear memories action protected by an explicit confirmation dialog.

### G. Privacy Settings (`/` - Tab: Privacy Settings)
- External AI Processing disclosure with live Lyzr Studio provider status.
- Global Persistent Memory toggle.
- Default data retention policies.
- Full Data Export: One-click download of entire vault as structured JSON (`/api/privacy/export`).
- Security Audit Log: Tamper-evident table recording operational actions without private bodies.
- Multi-Tenant User Switcher (Alex Vance vs. Taylor Smith) in the header to demonstrate real cross-user data isolation.

---

## 6. Security & Privacy Architecture

- **Private Storage**: Files are stored in user-isolated directories on the host filesystem (`uploads/vault/[userId]/`).
- **Secret Isolation**: `LYZR_API_KEY` and database credentials remain exclusively on the server. The frontend receives only masked/boolean configuration status.
- **Multi-Tenant Protection**: Queries always filter by the session `userId`. User A cannot view User B's documents, chunks, notes, memories, or audit events.
- **Untrusted Input Sanitization**: Retrieved chunk texts are wrapped in delimiter blocks and checked for adversarial prompt injection phrases (`ignore previous instructions`, `reveal passwords`).
- **Coordinated Atomic Deletion**: Uses Prisma transactions to guarantee that deleting a document cleans all child chunks, embeddings, and provenance links simultaneously.

---

## 7. Deployment Instructions

### Production Build
```bash
npm run build
npm run start -- --port 3008
```

### Database Migration for PostgreSQL
To switch from SQLite to PostgreSQL in production:
1. Update `datasource db` in `prisma/schema.prisma` to `provider = "postgresql"`.
2. Set `DATABASE_URL="postgresql://user:password@host:5432/privatemind?schema=public"` in `.env`.
3. Run `npx prisma db push` or `npx prisma migrate deploy`.
