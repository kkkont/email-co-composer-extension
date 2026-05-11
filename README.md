# Email Co-Composer Browser Extension

A course project for **Human-Centered AI (HCAI)**.

A Chrome extension that helps you draft emails directly within Gmail and Outlook. Describe your intent — goal, message, tone, length, recipient — and the AI assistant generates a polished email that is automatically inserted into the compose window.

## Architecture

The project is an **npm workspaces** monorepo with two apps:

```
apps/
  backend/    → Next.js API server (OpenAI)
  extension/  → Chrome Extension (Manifest V3, React + Vite)
```

### Backend (`apps/backend`)

A Next.js app exposing a single **POST `/api/generate`** endpoint. It takes the user's email intent (goal, message, recipient, tone, length, urgency, language) and returns a generated email via the OpenAI API.

**Key tech:** Next.js 16, OpenAI SDK.

### Extension (`apps/extension`)

A Chrome Manifest V3 extension with:

| Component | Purpose |
|---|---|
| **Side Panel** (React) | Main UI — composer form and drafts management |
| **Content script** | Detects Gmail/Outlook compose windows, inserts generated emails |
| **Background worker** | Opens the side panel on icon click or compose detection |

**Key tech:** React 18, Vite, Tailwind CSS, i18next (16 languages).

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9 (workspaces support)
- An **OpenAI API key**

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `.env.local` in the project root:

```env
OPENAI_API_KEY=<your-key>
```

### 3. Run the backend

```bash
npm run dev:backend
# → http://localhost:3000
```

### 4. Build the extension

```bash
npm run build:extension
```

### 5. Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select `apps/extension/dist`

## Usage

1. Open Gmail or Outlook and start composing an email.
2. The side panel opens automatically (or click the extension icon).
3. Fill in **Goal**, **Main Message**, and **Recipient**.
4. Optionally adjust tone, length, urgency, and language.
5. Click **Generate Draft** — the email is generated and inserted into the compose box.
6. Use the **Drafts** tab to view history, refine, or regenerate.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start both backend and extension in dev mode |
| `npm run dev:backend` | Start the Next.js dev server |
| `npm run dev:extension` | Start the Vite dev server for the extension |
| `npm run build` | Build both backend and extension |
| `npm run build:backend` | Production build for the backend |
| `npm run build:extension` | Production build for the extension |
| `npm run translate` | Re-translate locale files from English using OpenAI |

## Project Structure

```
├── package.json                # Root workspace config
├── languages.json              # Supported languages list
├── scripts/
│   └── translate.ts            # Auto-translate locales via OpenAI
├── apps/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── api/generate/   # POST endpoint for email generation
│   │   │   └── page.tsx        # Health-check landing page
│   │   └── lib/openai.ts       # OpenAI client & prompt logic
│   └── extension/
│       ├── manifest.json       # Chrome MV3 manifest
│       ├── sidepanel.html      # Side panel entry point
│       └── src/
│           ├── popup/          # React UI (composer + drafts)
│           ├── content/        # Gmail/Outlook compose detection & injection
│           ├── background/     # Service worker (side panel management)
│           ├── i18n/           # Internationalization (16 languages)
│           └── types.ts        # Shared TypeScript types
```

## Internationalization

UI strings are managed with **i18next**. The extension supports 16 languages:

English, Estonian, German, French, Spanish, Norwegian, Finnish, Swedish, Danish, Dutch, Italian, Portuguese, Russian, Chinese, Japanese, Korean.

The browser language is auto-detected on first load. Users can switch languages from the composer UI. Running `npm run translate` regenerates all locale files from the English source using OpenAI. To add a new language, simply add an entry to `languages.json` and run the translate script.