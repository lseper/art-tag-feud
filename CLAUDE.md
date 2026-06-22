# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Art Tag Feud is a multiplayer game built with a React frontend and Node.js backend. Players guess tags associated with artwork fetched from the e621 API. The application uses WebSockets for real-time gameplay and Supabase for data persistence.

## Development Commands

### Backend (Node.js + TypeScript + Express + WebSockets)
- **Install dependencies**: `cd backend && npm i`
- **Run development server**: `cd backend && npm run dev` (uses ts-node, runs on port from config)
- **Build**: `cd backend && npm run build` (compiles TypeScript to dist/)
- **Run production**: `cd backend && npm start`
- **Run tests**: `cd backend && npm test` (Vitest)
- **Watch tests**: `cd backend && npm run test:watch`

**Important**: Changes to backend code require server restart in development mode.

### Frontend (React + Vite + TypeScript)
- **Install dependencies**: `cd frontend && npm i`
- **Run development server**: `cd frontend && npm run dev --host`
- **Build**: `cd frontend && npm run build`
- **Build for GitHub Pages**: `cd frontend && npm run build:gh-pages`
- **Lint**: `cd frontend && npm run lint`
- **Preview production build**: `cd frontend && npm preview`
- **Storybook**: `cd frontend && npm run storybook`
- **Build Storybook**: `cd frontend && npm run build-storybook`

## Architecture

### Backend Layered Architecture

The backend follows a strict layered architecture to separate concerns and enable testability. See `backend/architecture.md` for detailed diagrams.

**Transport Layer** (`backend/src/transport/`)
- WebSocket gateway handles real-time events (wsServer.ts, wsRouter.ts)
- HTTP REST API handles CRUD operations (http/app.ts, http/routes/)
- Neither layer contains business logic

**Service Layer** (`backend/src/services/`)
- Business logic orchestration
- Services: userService, roomService, gameService, postService, guessService, sessionService, botService
- Services are transport-agnostic and testable in isolation

**Data Access Layer** (`backend/src/data/`)
- Supabase repositories (`data/repos/`) encapsulate database operations
- e621 API client (`data/e621Client.ts`) fetches artwork and tags
- External API calls isolated here

**Domain Layer** (`backend/src/domain/`)
- Zod schemas and type definitions (contracts.ts)
- Pure helper functions (roomUtils.ts, tagUtils.ts)
- No side effects - fully unit testable

**State Management** (`backend/src/state/`)
- In-memory state store (store.ts)
- Holds active rooms, users, games, WebSocket connections

### Frontend Architecture

**State Management**
- React Context API (UserContext) manages global user, room, and game state
- ConnectionManager singleton handles WebSocket connection and event dispatching

**Routing** (React Router)
- `/` - Lobby (room browsing and creation)
- `/play` - GameSetup (join room via code)
- `/create` - GameSetup (create new room)
- `/finish` - Finish (post-game results)

**Key Directories**
- `src/pages/` - Top-level page components
- `src/components/` - Reusable UI components
- `src/actors/` - Actor pattern for player behavior (HumanActor, BotActor)
- `src/util/` - ConnectionManager, EventManager, utilities
- `src/hooks/` - Custom React hooks (usePostFetcher, useTagListGuesser)
- `src/contexts/` - React contexts

**WebSocket Communication**
- ConnectionManager.getInstance() provides singleton WebSocket connection
- Event-driven architecture with EventManager for message routing
- Queue mechanism handles messages sent before connection is open

### WebSocket Event Types

The application uses these event types (defined in types.ts):
- CREATE_ROOM, JOIN_ROOM, LEAVE_ROOM
- REQUEST_POST, GUESS_TAG, READY_UP
- START_GAME, END_GAME, SHOW_LEADERBOARD
- SET_USERNAME, SET_ICON, GET_SELECTED_ICONS
- UPDATE_BLACKLIST, UPDATE_PREFERLIST
- ALL_ROOMS

### Shared Types

Types are defined using Zod schemas in:
- `backend/types.ts` - Shared types and schemas (EventType, User, Post, PostTag, etc.)
- `frontend/src/types.ts` - Frontend type definitions (mirrors backend types)

TypeScript types are inferred from Zod schemas using `z.infer<typeof Schema>`.

## Testing Strategy

**Backend**
- Tests located in `backend/tests/`
- Unit test pure functions in `domain/` (tagUtils.test.ts, roomUtils.test.ts)
- Unit test services with mocked repositories (roomService.test.ts, gameService.test.ts, etc.)
- Vitest configuration: `backend/vitest.config.ts`

**Frontend**
- Storybook integration for component testing
- Vitest + agent-browser browser testing configured
- Test configuration in `frontend/vite.config.ts`

## Data Files

Static tag data in `backend/data/`:
- `tag-data-general.json` - General category tags
- `tag-data-species.json` - Species category tags
- `tag-aliases.json` - Tag alias mappings
- `*_tag-meta-data.json` - Tag metadata files

## Environment Setup

Backend requires `.env` file in `backend/` directory (see `backend/.env` for structure).

Frontend configuration in `frontend/src/components/config/constants.ts` defines WebSocket URL.

## Contributing Workflow

1. Create branch from `main` using pattern: `{IssueName}{IssueNumber}`
2. Make changes on feature branch
3. Create PR to `main` for review

## Key Implementation Details

**User Persistence**
- User IDs stored in localStorage (`artFeudUserId`) for session continuity

**Connection Management**
- Frontend maintains singleton WebSocket connection via ConnectionManager
- Message queuing ensures no lost messages during connection setup
- Event-driven architecture for decoupled message handling

**Game Flow**
- Room creation/joining handled via WebSocket events
- Posts fetched from e621 API based on room settings (blacklist, preferlist)
- Tag guessing scored server-side, results broadcast to all room participants
- Leaderboard updates in real-time via WebSocket events
