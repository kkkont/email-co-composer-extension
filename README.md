# Email Co-Composer Browser Extension

> **Work in progress** — built as a course project for **Human-Centered AI (HCAI)**.

A Chrome extension that helps you draft emails directly within Gmail. Describe your intent — goal, message, tone, recipient — and the assistant will generate a polished email you can insert into a compose window with one click.

**Current status:** The extension UI and Gmail integration are functional, but the **LLM backend (Azure OpenAI) has not been integrated yet**. Email generation currently echoes the user's input as a placeholder. Full AI-powered generation is planned as a next step.

## Architecture

The project is an **npm workspaces** monorepo with two apps:

```
apps/
  backend/    → Next.js API server (Azure OpenAI)
  extension/  → Chrome Extension (Manifest V3, React + Vite)
```

### Backend (`apps/backend`)

A Next.js app that exposes a single **POST `/api/generate`** endpoint. It is set up to forward the user's email intent to **Azure OpenAI** and stream the generated email back to the client. **The Azure OpenAI client is not yet wired up** — the route and prompt structure are in place, pending API credentials and final integration.

**Key tech:** Next.js 16, Azure OpenAI SDK (planned), streaming responses.

### Extension (`apps/extension`)

A Chrome Manifest V3 extension with:

| Component | Purpose |
|---|---|
| **Popup** (React) | Form UI where the user specifies goal, message, recipient, and tone |
| **Content script** | Injects the generated email into the Gmail compose box |
| **Background worker** | Lifecycle & install logging |

**Key tech:** React 18, Vite, Tailwind CSS, i18next (English locale, ready for additional languages).

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9 (workspaces support)
- An **Azure OpenAI** deployment (endpoint URL, API key, deployment name)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment (optional — Azure OpenAI integration is a WIP)

Create `apps/backend/.env.local`:

```env
AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com
AZURE_OPENAI_API_KEY=<your-key>
AZURE_OPENAI_DEPLOYMENT=<deployment-name>
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

> **Note:** Since the LLM is not yet integrated, "Generate Email" currently returns the main message as-is. Full AI generation is coming soon.

1. Open Gmail and start composing an email.
2. Click the **Email Co-Composer** extension icon.
3. Fill in **Goal**, **Main Message**, and **Recipient**.
4. Click **Generate Email**.
5. Click **Insert to Gmail** to paste the result into the compose box.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start both backend and extension in dev mode |
| `npm run dev:backend` | Start the Next.js dev server |
| `npm run dev:extension` | Start the Vite dev server for the extension |
| `npm run build` | Build both backend and extension |
| `npm run build:backend` | Production build for the backend |
| `npm run build:extension` | Production build for the extension |

## Project Structure

```
├── package.json              # Root workspace config
├── apps/
│   ├── backend/
│   │   ├── app/
│   │   │   └── api/generate/ # POST endpoint for email generation
│   │   └── lib/azure-api.ts  # Azure OpenAI client setup
│   └── extension/
│       ├── manifest.json     # Chrome MV3 manifest
│       └── src/
│           ├── popup/        # React popup UI
│           ├── content/      # Gmail DOM injection
│           ├── background/   # Service worker
│           ├── i18n/         # Internationalization (en locale)
│           └── types.ts      # Shared TypeScript types
```

## Internationalization

UI strings are managed with **i18next**. Currently, only English is supported, but the i18n structure is in place for future language additions.

## Roadmap

- [ ] Integrate Azure OpenAI for actual email generation
- [ ] Add more tone/goal options
- [ ] Support additional languages beyond English
- [ ] Implement user feedback loop for generated emails