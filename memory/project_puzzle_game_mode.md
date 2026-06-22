---
name: Puzzle Game Mode Implementation
description: Summary of the Puzzle game mode feature implemented on feature/puzzle-game-mode branch
type: project
---

Puzzle mode is a cooperative WebGL-based image assembly game mode.

**Why:** Feature spec at /specs/puzzle-game-mode.md — replaces tag guessing with Voronoi-cut piece dragging.

**How to apply:** When working with puzzle mode code, refer to this file for key design decisions.

## Key Architecture Decisions

- **Voronoi generation**: `backend/src/services/puzzleService.ts` uses `d3-delaunay` with 3 iterations of Lloyd relaxation for uniform piece sizes. Seeded RNG ensures reproducibility.
- **Piece count formula**: `roundNumber * playerCount` (minimum 1)
- **No drag streaming**: Only final `PUZZLE_PLACE_PIECE` is sent, not continuous position updates
- **Client-side timer**: Server sends `timerDurationMs` once; client counts down locally
- **CORS proxy**: `GET /api/proxy-image?url=...` in backend HTTP app proxies e621 images for WebGL texture loading
- **Image-only filter**: `getImageOnlyPosts()` in e621Client.ts filters to png/jpg/jpeg/webp extensions for puzzle mode

## New Files
- `backend/src/services/puzzleService.ts`
- `frontend/src/components/puzzle/PuzzleCanvas.tsx`
- `frontend/src/components/puzzle/PuzzlePiece.tsx`
- `frontend/src/components/puzzle/AssemblyZone.tsx`
- `frontend/src/components/puzzle/FragmentTray.tsx`
- `frontend/src/components/puzzle/puzzleGeometry.ts`
- `frontend/src/components/puzzle/puzzleShaders.ts`
- `frontend/src/hooks/usePuzzleState.ts`
- `backend/tests/puzzleService.test.ts`
- `frontend/src/storybook/PuzzleCanvas.stories.tsx`

## New Dependencies
- Backend: `d3-delaunay`, `@types/d3-delaunay`
- Frontend: `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`

## New Room Setting
- `puzzleTimerSeconds` (optional, default 120) — options: 60, 90, 120, 180
