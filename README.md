# Kanban Task Manager

A full-featured Kanban board application built with React, TypeScript, Zustand, and Vite.

## Getting Started

```bash
npm install
npm run dev
```

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

---

## Testing

### Stack

- **Vitest** — Fast, Vite-native test runner
- **React Testing Library** — Component testing via user-centric queries
- **@testing-library/user-event** — Realistic user interaction simulation
- **@testing-library/jest-dom** — Custom DOM matchers (`toBeInTheDocument`, etc.)
- **jsdom** — Browser environment for tests

### Test Structure

```
src/__tests__/
├── setup.ts                              # Global test setup (jest-dom, localStorage mock)
├── helpers.tsx                           # Shared render utilities & mock data fixtures
├── api/
│   └── mockApi.test.ts                   # Mock API endpoint tests
├── components/
│   ├── TaskCard.test.tsx                 # TaskCard rendering & click tests
│   ├── Column.test.tsx                   # Column rendering, task clicks, inline editing
│   └── LoadingErrorStates.test.tsx       # Skeleton, spinner, error screen tests
├── pages/
│   ├── Dashboard.test.tsx                # Dashboard loading/error/success states, retry
│   └── BoardView.test.tsx                # Board view loading/error, routing, task clicks
└── store/
    └── boardStore.test.ts                # Zustand store: CRUD, fetch, loading/error
```

### What's Tested

| Category | Tests | What's Covered |
|---|---|---|
| **Components** | 21 | TaskCard rendering, subtask counts, Column headers, inline edit, task click callbacks, Loading/Error UI |
| **Store** | 15 | `fetchBoards` (loading, success, error), board/task/column CRUD, `moveTask`, `toggleSubtask` |
| **Pages** | 16 | Dashboard & BoardView: skeleton loading, error with retry, success rendering, routing redirects |
| **API** | 5 | `fetchBoards`, `fetchBoardById`, `createBoard`, `deleteBoard`, timer-controlled delays |

### Key Testing Patterns

- **Mock API**: The Zustand store's API dependency is mocked with `vi.mock()` so tests control loading/success/error flows
- **Direct store state**: Error/loading UI tests set Zustand state directly via `useBoardStore.setState()` for deterministic rendering
- **Provider wrapper**: `renderWithProviders()` wraps components with Router, Theme, and Auth providers
- **User interactions**: `userEvent.setup()` simulates clicks, double-clicks, typing, and keyboard events
