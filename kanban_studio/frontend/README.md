# Kanban Project Management MVP

A minimalistic and elegant client-rendered Kanban board built with Next.js, React, and dnd-kit.

## Features

- Single board view with 5 predefined columns
- Interactive Drag and Drop functionality
- Add, delete, and manage cards (title and details)
- Rename columns via inline editing
- Purely client-side state management (no persistence)
- Comprehensive Unit Tests (Jest + React Testing Library)
- End-to-End Testing (Playwright)

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open `http://localhost:3000` with your browser to see the result.

## Testing

Run unit tests:
```bash
npm test
```

Run end-to-end tests:
```bash
npx playwright test
```
