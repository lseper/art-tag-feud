import { Delaunay } from 'd3-delaunay';
import type { PuzzlePieceDefinitionType, PuzzlePieceAssignmentType, PuzzleRoundStartEventDataToClientType, PuzzlePlacePieceEventDataToClientType, PuzzleRoundEndEventDataToClientType } from '../domain/contracts';
import { EventType } from '../domain/contracts';
import { activeGames, rooms, users } from '../state/store';
import type { PuzzleState } from '../state/store';
import { broadcastToRoom } from '../transport/ws/wsBroadcast';

const DEFAULT_PUZZLE_TIMER_SECONDS = 120;
const MIN_PIECE_AREA = 0.01; // minimum 1% of total area per piece
const LLOYD_RELAXATION_ITERATIONS = 3;

/**
 * Seeded pseudo-random number generator (mulberry32).
 */
function makeRng(seed: number) {
    let s = seed >>> 0;
    return () => {
        s += 0x6d2b79f5;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) >>> 0;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Compute Voronoi cell polygon vertices for a set of seed points
 * clipped to the [0,1]x[0,1] bounding box.
 */
function computeVoronoiCells(points: number[][]): { vertices: [number, number][]; centroid: [number, number] }[] {
    const flatPoints = points.flatMap(([x, y]) => [x, y]);
    const delaunay = Delaunay.from(points as [number, number][]);
    const voronoi = delaunay.voronoi([0, 0, 1, 1]);
    const cells: { vertices: [number, number][]; centroid: [number, number] }[] = [];

    for (let i = 0; i < points.length; i++) {
        const polygon = voronoi.cellPolygon(i);
        if (!polygon || polygon.length < 3) {
            cells.push({ vertices: [[0, 0], [1, 0], [1, 1], [0, 1]], centroid: [0.5, 0.5] });
            continue;
        }
        const vertices = polygon.slice(0, -1) as [number, number][];
        const centroid = computePolygonCentroid(vertices);
        cells.push({ vertices, centroid });
    }
    return cells;
}

/**
 * Compute the centroid of a polygon given its vertices.
 */
function computePolygonCentroid(vertices: [number, number][]): [number, number] {
    let cx = 0, cy = 0, area = 0;
    const n = vertices.length;
    for (let i = 0; i < n; i++) {
        const [x0, y0] = vertices[i];
        const [x1, y1] = vertices[(i + 1) % n];
        const cross = x0 * y1 - x1 * y0;
        area += cross;
        cx += (x0 + x1) * cross;
        cy += (y0 + y1) * cross;
    }
    area /= 2;
    if (Math.abs(area) < 1e-10) {
        const sumX = vertices.reduce((s, v) => s + v[0], 0);
        const sumY = vertices.reduce((s, v) => s + v[1], 0);
        return [sumX / n, sumY / n];
    }
    return [cx / (6 * area), cy / (6 * area)];
}

/**
 * Compute the area of a polygon given its vertices.
 */
function computePolygonArea(vertices: [number, number][]): number {
    let area = 0;
    const n = vertices.length;
    for (let i = 0; i < n; i++) {
        const [x0, y0] = vertices[i];
        const [x1, y1] = vertices[(i + 1) % n];
        area += x0 * y1 - x1 * y0;
    }
    return Math.abs(area / 2);
}

/**
 * Apply Lloyd relaxation: move seed points to their Voronoi cell centroids.
 */
function lloydRelaxation(points: number[][], iterations: number): number[][] {
    let current = points;
    for (let iter = 0; iter < iterations; iter++) {
        const cells = computeVoronoiCells(current);
        current = cells.map(cell => [cell.centroid[0], cell.centroid[1]]);
    }
    return current;
}

/**
 * Generate Voronoi puzzle pieces in normalized [0,1]x[0,1] space.
 * Applies Lloyd relaxation for more uniform cell sizes.
 * Returns PuzzlePieceDefinition[].
 */
export function generatePuzzlePieces(numPieces: number, seed: number): PuzzlePieceDefinitionType[] {
    const rng = makeRng(seed);

    // Generate initial random seed points, ensuring minimum area
    let points: number[][];
    let attempt = 0;
    do {
        points = Array.from({ length: numPieces }, () => [rng(), rng()]);
        attempt++;
        // Prevent infinite loop
        if (attempt > 10) break;
    } while (false);

    // Apply Lloyd relaxation for uniform piece sizes
    points = lloydRelaxation(points, LLOYD_RELAXATION_ITERATIONS);

    const cells = computeVoronoiCells(points);

    // Filter out pieces that are too small; replace with fallback if needed
    const pieces: PuzzlePieceDefinitionType[] = cells.map((cell, index) => {
        const area = computePolygonArea(cell.vertices);
        // If piece is too small, expand to a small square around its centroid
        if (area < MIN_PIECE_AREA && cell.vertices.length > 0) {
            const [cx, cy] = cell.centroid;
            const half = Math.sqrt(MIN_PIECE_AREA) / 2;
            const clamp = (v: number) => Math.max(0, Math.min(1, v));
            return {
                index,
                vertices: [
                    [clamp(cx - half), clamp(cy - half)],
                    [clamp(cx + half), clamp(cy - half)],
                    [clamp(cx + half), clamp(cy + half)],
                    [clamp(cx - half), clamp(cy + half)],
                ] as [number, number][],
                centroid: [cx, cy] as [number, number],
            };
        }
        return {
            index,
            vertices: cell.vertices,
            centroid: cell.centroid,
        };
    });

    return pieces;
}

/**
 * Assign pieces to players in round-robin order.
 */
export function assignPiecesToPlayers(pieces: PuzzlePieceDefinitionType[], playerIds: string[]): PuzzlePieceAssignmentType[] {
    if (playerIds.length === 0) return [];
    const assignments = new Map<string, number[]>(playerIds.map(id => [id, []]));
    pieces.forEach((piece, i) => {
        const playerId = playerIds[i % playerIds.length];
        assignments.get(playerId)!.push(piece.index);
    });
    return Array.from(assignments.entries()).map(([userId, pieceIndices]) => ({ userId, pieceIndices }));
}

/**
 * Orchestrates starting a puzzle round: generates pieces, assigns them,
 * stores puzzle state, broadcasts PUZZLE_ROUND_START, and starts timer.
 */
export async function handlePuzzleRoundStart(roomID: string, postUrl: string, postId: number): Promise<void> {
    const room = rooms.get(roomID);
    if (!room) return;

    const activeGame = activeGames.get(roomID);
    if (!activeGame) return;

    const playerIds = room.members.filter(m => !m.isBot).map(m => m.id);
    const roundNumber = room.curRound + 1;
    const totalRounds = room.roundsPerGame;

    // Piece count: roundNumber * playerCount (minimum 1)
    const numPieces = Math.max(1, roundNumber * Math.max(1, playerIds.length));
    const seed = Date.now();

    const pieces = generatePuzzlePieces(numPieces, seed);
    const allPlayerIds = room.members.map(m => m.id);
    const assignments = assignPiecesToPlayers(pieces, allPlayerIds.length > 0 ? allPlayerIds : ['solo']);

    const timerSeconds = room.puzzleTimerSeconds ?? DEFAULT_PUZZLE_TIMER_SECONDS;
    const timerDurationMs = timerSeconds * 1000;

    const timerHandle = setTimeout(() => {
        handlePuzzleTimerExpiry(roomID);
    }, timerDurationMs);

    const puzzleState: PuzzleState = {
        pieces,
        assignments,
        placedPieces: new Map(),
        timerHandle,
        timerDurationMs,
        timerStartedAt: Date.now(),
        totalPieces: pieces.length,
    };

    activeGame.puzzleState = puzzleState;
    activeGames.set(roomID, activeGame);

    const eventData: PuzzleRoundStartEventDataToClientType = {
        type: EventType.enum.PUZZLE_ROUND_START,
        postUrl,
        postId,
        pieces,
        assignments,
        timerDurationMs,
        roundNumber,
        totalRounds,
    };

    broadcastToRoom(room, eventData);
}

/**
 * Validates and handles a piece placement.
 * Returns null if the placement is invalid.
 */
export function handlePuzzlePlacePiece(
    roomID: string,
    userID: string,
    pieceIndex: number,
): { success: boolean; completed: boolean } | null {
    const activeGame = activeGames.get(roomID);
    if (!activeGame?.puzzleState) return null;

    const { puzzleState } = activeGame;

    // Check piece is not already placed
    if (puzzleState.placedPieces.has(pieceIndex)) {
        return null;
    }

    // Validate ownership: user must own this piece
    const assignment = puzzleState.assignments.find(a => a.userId === userID);
    if (!assignment || !assignment.pieceIndices.includes(pieceIndex)) {
        return null;
    }

    // Mark piece as placed
    puzzleState.placedPieces.set(pieceIndex, userID);

    const completed = puzzleState.placedPieces.size >= puzzleState.totalPieces;
    return { success: true, completed };
}

/**
 * Called when the puzzle timer expires. Broadcasts PUZZLE_ROUND_END.
 */
export function handlePuzzleTimerExpiry(roomID: string): void {
    const room = rooms.get(roomID);
    if (!room) return;

    const activeGame = activeGames.get(roomID);
    if (!activeGame?.puzzleState) return;

    const { puzzleState } = activeGame;

    // Clear timer to avoid double-fire
    if (puzzleState.timerHandle !== null) {
        clearTimeout(puzzleState.timerHandle);
        puzzleState.timerHandle = null;
    }

    const placedPieces = Array.from(puzzleState.placedPieces.keys());
    const endEventData: PuzzleRoundEndEventDataToClientType = {
        type: EventType.enum.PUZZLE_ROUND_END,
        completed: false,
        placedPieces,
        totalPieces: puzzleState.totalPieces,
    };

    broadcastToRoom(room, endEventData);
    activeGame.puzzleState = undefined;
    activeGames.set(roomID, activeGame);
}

/**
 * Called when all pieces are placed. Broadcasts PUZZLE_ROUND_END with completed=true.
 */
export function handlePuzzleComplete(roomID: string): void {
    const room = rooms.get(roomID);
    if (!room) return;

    const activeGame = activeGames.get(roomID);
    if (!activeGame?.puzzleState) return;

    const { puzzleState } = activeGame;

    // Cancel the timer since puzzle is done early
    if (puzzleState.timerHandle !== null) {
        clearTimeout(puzzleState.timerHandle);
        puzzleState.timerHandle = null;
    }

    const placedPieces = Array.from(puzzleState.placedPieces.keys());
    const endEventData: PuzzleRoundEndEventDataToClientType = {
        type: EventType.enum.PUZZLE_ROUND_END,
        completed: true,
        placedPieces,
        totalPieces: puzzleState.totalPieces,
    };

    broadcastToRoom(room, endEventData);
    activeGame.puzzleState = undefined;
    activeGames.set(roomID, activeGame);
}

/**
 * Get current puzzle sync state for late joiners.
 */
export function getPuzzleSyncState(roomID: string): { placedPieces: number[] } | null {
    const activeGame = activeGames.get(roomID);
    if (!activeGame?.puzzleState) return null;
    return {
        placedPieces: Array.from(activeGame.puzzleState.placedPieces.keys()),
    };
}
