# EdTech DocSync — Local-First Collaborative Workspace

EdTech DocSync is a high-performance, **Local-First, Collaborative Document Editor** designed with real-time offline-first synchronization, deterministic conflict-free data merging (via Yjs CRDTs), role-based access control, PostgreSQL backup persistence, and a Gemini AI Writing Assistant.

The application works seamlessly without a network connection, buffering updates locally in the browser's IndexedDB, and automatically reconciles all changes once network connectivity is restored.

---

## 🚀 Key Features

*   **Local-First Architecture:** Instant text edits and editor boots. Client-side storage (IndexedDB) acts as the primary source of truth, completely decoupling editing performance from network latency.
*   **Conflict-Free Collaboration:** Implemented using **Yjs CRDTs** over WebSockets. Concurrent edits merge deterministically without data loss or race conditions.
*   **Postgres Backup Persistence:** The collaboration backend automatically backups document binary states (debounced 5 seconds after typing stops) and recovers them seamlessly on server restarts.
*   **Granular Version Control (Time Travel):** Captures checkpoints of document states. Restoring a version is implemented safely using deep XML element cloning on Yjs fragments, preventing timeline collisions or synchronization breaks for other active editors.
*   **Protocol-Level Security (Viewer Blocker):** NextAuth handles credentials login. Roles (`owner`, `editor`, `viewer`) are enforced:
    *   **Frontend:** Viewers have editing disabled.
    *   **Backend:** The WebSocket collaboration server intercepts raw frames and discards sync updates from viewers at the protocol level.
*   **Gemini AI Writing Assistant:** In-editor AI assistant for Autocomplete, Summarization, Tone Rewriting, and Grammar Correction, leveraging Vercel AI SDK and Google Gemini (`gemini-1.5-flash`).

---

## 🛠️ Technology Stack

*   **Framework:** Next.js 16 (TypeScript)
*   **State Sharing (CRDT):** Yjs
*   **Local Storage:** `y-indexeddb`
*   **Sync Protocol:** `y-websocket` (custom Node/Express wrapper)
*   **Database:** PostgreSQL + Drizzle ORM
*   **Authentication:** Auth.js (NextAuth v5)
*   **Styling:** Tailwind CSS
*   **AI Integration:** Vercel AI SDK + `@google/generative-ai`
*   **Verification:** Playwright E2E test suite

---

## 💻 Getting Started

### 1. Prerequisites
Ensure you have a local PostgreSQL instance running.

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory (based on `.env.example` presets):
```env
AUTH_SECRET="your_nextauth_jwt_secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_WS_URL="ws://localhost:1234"
DATABASE_URL="postgres://username:password@localhost:5432/hotech"
GEMINI_API_KEY="your_google_gemini_api_key"
```

### 3. Setup Database Schema
Push the tables and schemas directly to your local Postgres instance:
```bash
npx drizzle-kit push
```

### 4. Run the Development Workspace
Start the concurrently run script. This will launch the Next.js development server (port `3000`) and the WebSocket collaboration server (port `1234`) in parallel:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to login and write documents.

---

## 🧪 Running Automated E2E Tests

The codebase includes a fully configured Playwright test suite to verify credentials login, document creation, offline editing status badges, and background online reconciliation:

```bash
# Run the E2E tests
npx playwright test
```

---

## 👨‍💻 Developer Profile

*   **Developer Name:** Ayam Heniber Meitei
*   **GitHub Profile:** [https://github.com/AyamHeniber](https://github.com/AyamHeniber)
# doc-collab-local
