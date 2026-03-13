import { describe, expect, it, beforeEach, vi } from 'vitest';
import { generatePuzzlePieces, assignPiecesToPlayers } from '../src/services/puzzleService';

describe('generatePuzzlePieces', () => {
    it('generates the requested number of pieces', () => {
        const pieces = generatePuzzlePieces(4, 42);
        expect(pieces).toHaveLength(4);
    });

    it('assigns sequential indices', () => {
        const pieces = generatePuzzlePieces(6, 99);
        pieces.forEach((piece, i) => {
            expect(piece.index).toBe(i);
        });
    });

    it('each piece has vertices and centroid', () => {
        const pieces = generatePuzzlePieces(3, 7);
        for (const piece of pieces) {
            expect(piece.vertices.length).toBeGreaterThanOrEqual(3);
            expect(piece.centroid).toHaveLength(2);
            const [cx, cy] = piece.centroid;
            expect(cx).toBeGreaterThanOrEqual(0);
            expect(cx).toBeLessThanOrEqual(1);
            expect(cy).toBeGreaterThanOrEqual(0);
            expect(cy).toBeLessThanOrEqual(1);
        }
    });

    it('produces same layout for same seed', () => {
        const a = generatePuzzlePieces(5, 123);
        const b = generatePuzzlePieces(5, 123);
        expect(a.map(p => p.centroid)).toEqual(b.map(p => p.centroid));
    });

    it('produces different layouts for different seeds', () => {
        const a = generatePuzzlePieces(5, 1);
        const b = generatePuzzlePieces(5, 2);
        const aCentroids = a.map(p => p.centroid);
        const bCentroids = b.map(p => p.centroid);
        expect(aCentroids).not.toEqual(bCentroids);
    });

    it('handles single piece', () => {
        const pieces = generatePuzzlePieces(1, 0);
        expect(pieces).toHaveLength(1);
        expect(pieces[0].index).toBe(0);
    });

    it('all vertices are within [0,1] x [0,1] bounds', () => {
        const pieces = generatePuzzlePieces(8, 55);
        for (const piece of pieces) {
            for (const [x, y] of piece.vertices) {
                expect(x).toBeGreaterThanOrEqual(-0.001);
                expect(x).toBeLessThanOrEqual(1.001);
                expect(y).toBeGreaterThanOrEqual(-0.001);
                expect(y).toBeLessThanOrEqual(1.001);
            }
        }
    });
});

describe('assignPiecesToPlayers', () => {
    it('assigns all pieces across players', () => {
        const pieces = generatePuzzlePieces(6, 42);
        const players = ['alice', 'bob', 'carol'];
        const assignments = assignPiecesToPlayers(pieces, players);

        expect(assignments).toHaveLength(3);
        const allAssigned = assignments.flatMap(a => a.pieceIndices);
        expect(allAssigned.sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5]);
    });

    it('distributes evenly with round-robin', () => {
        const pieces = generatePuzzlePieces(6, 1);
        const players = ['p1', 'p2', 'p3'];
        const assignments = assignPiecesToPlayers(pieces, players);

        assignments.forEach(a => {
            expect(a.pieceIndices).toHaveLength(2);
        });
    });

    it('handles more pieces than players', () => {
        const pieces = generatePuzzlePieces(5, 1);
        const players = ['p1', 'p2'];
        const assignments = assignPiecesToPlayers(pieces, players);

        const total = assignments.reduce((sum, a) => sum + a.pieceIndices.length, 0);
        expect(total).toBe(5);
        expect(assignments).toHaveLength(2);
    });

    it('handles single player getting all pieces', () => {
        const pieces = generatePuzzlePieces(4, 1);
        const assignments = assignPiecesToPlayers(pieces, ['solo']);
        expect(assignments).toHaveLength(1);
        expect(assignments[0].pieceIndices).toHaveLength(4);
        expect(assignments[0].userId).toBe('solo');
    });

    it('returns empty array for no players', () => {
        const pieces = generatePuzzlePieces(4, 1);
        const assignments = assignPiecesToPlayers(pieces, []);
        expect(assignments).toHaveLength(0);
    });

    it('each piece index appears exactly once', () => {
        const pieces = generatePuzzlePieces(7, 77);
        const players = ['a', 'b', 'c'];
        const assignments = assignPiecesToPlayers(pieces, players);

        const allIndices = assignments.flatMap(a => a.pieceIndices);
        const uniqueIndices = new Set(allIndices);
        expect(uniqueIndices.size).toBe(pieces.length);
        expect(allIndices).toHaveLength(pieces.length);
    });
});
