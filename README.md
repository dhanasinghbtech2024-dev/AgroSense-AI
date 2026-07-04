# AgroSense AI 🌱

RAG-styled crop advisory chat UI for Indian smallholder farmers, built with React + Vite.

## Setup

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## ⚠️ Important: the API call needs a backend proxy

`src/App.jsx` currently calls `https://api.anthropic.com/v1/messages` **directly from the browser** with no API key attached. As shipped this will not work, because:

- The Anthropic API requires an `x-api-key` header — none is set here.
- Anthropic's API does not allow direct browser calls (CORS), and you should never put a secret API key in frontend code anyway, since anyone could open dev tools and steal it.

To make this functional, add a tiny backend (Node/Express, a Vercel/Netlify function, Cloudflare Worker, etc.) that:
1. Receives the chat messages from the frontend.
2. Adds your `ANTHROPIC_API_KEY` (kept server-side only, e.g. in a `.env` file) and forwards the request to `https://api.anthropic.com/v1/messages`.
3. Returns the response back to the frontend.

Then change the `fetch` URL in `sendMessage()` inside `src/App.jsx` to point at your own backend endpoint instead of Anthropic's API directly.

## Project structure

```
agrosense-ai/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx      # React entry point
│   └── App.jsx        # Main AgroSense AI component (extracted from source PDF)
└── README.md
```

## Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: AgroSense AI"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```
