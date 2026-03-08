# Middle Class Commander App

Middle Class Commander is a browser-based React app that audits MTG cards/decks against the project’s “middle class” legality rule.

## Prerequisites

- Node.js 18+ (Node 20+ recommended)
- npm 9+

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open the app in your browser (Vite prints the exact URL, usually):

```text
http://localhost:5173
```

## Build for production

```bash
npm run build
```

## Preview production build locally

```bash
npm run preview
```

## Notes

- Archidekt requests are routed through a Vite server-side proxy at `/api/archidekt` to avoid browser CORS issues.
- It uses:
  - Scryfall API for card/printing data
  - Archidekt API for deck/folder/user data
  - IndexedDB via Dexie for caching
