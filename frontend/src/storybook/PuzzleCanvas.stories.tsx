import type { Meta, StoryObj } from '@storybook/react';
import { PuzzleCanvas } from '../components/puzzle/PuzzleCanvas';
import type { PuzzlePieceDefinitionType } from '../types';

// Sample Voronoi-like pieces (simplified grid for story display)
const makePiece = (index: number, x: number, y: number, size: number): PuzzlePieceDefinitionType => ({
    index,
    vertices: [
        [x, y],
        [x + size, y],
        [x + size, y + size],
        [x, y + size],
    ],
    centroid: [x + size / 2, y + size / 2],
});

const PIECES_2x2: PuzzlePieceDefinitionType[] = [
    makePiece(0, 0.0, 0.0, 0.5),
    makePiece(1, 0.5, 0.0, 0.5),
    makePiece(2, 0.0, 0.5, 0.5),
    makePiece(3, 0.5, 0.5, 0.5),
];

const PIECES_3x3: PuzzlePieceDefinitionType[] = Array.from({ length: 9 }, (_, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    return makePiece(i, col / 3, row / 3, 1 / 3);
});

const meta: Meta<typeof PuzzleCanvas> = {
    title: 'Puzzle/PuzzleCanvas',
    component: PuzzleCanvas,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;
type Story = StoryObj<typeof PuzzleCanvas>;

export const FourPieces: Story = {
    args: {
        pieces: PIECES_2x2,
        myPieceIndices: [0, 1],
        placedPieces: new Map(),
        postUrl: 'https://picsum.photos/400/400',
        onPlacePiece: (idx) => console.log('Place piece', idx),
        timerEnd: Date.now() + 120000,
    },
};

export const NinePieces: Story = {
    args: {
        pieces: PIECES_3x3,
        myPieceIndices: [0, 3, 6],
        placedPieces: new Map(),
        postUrl: 'https://picsum.photos/400/400',
        onPlacePiece: (idx) => console.log('Place piece', idx),
        timerEnd: Date.now() + 120000,
    },
};

export const SomePiecesPlaced: Story = {
    args: {
        pieces: PIECES_2x2,
        myPieceIndices: [0, 1],
        placedPieces: new Map([[0, 'player1'], [3, 'player2']]),
        postUrl: 'https://picsum.photos/400/400',
        onPlacePiece: (idx) => console.log('Place piece', idx),
        timerEnd: Date.now() + 60000,
    },
};

export const AllPiecesPlaced: Story = {
    args: {
        pieces: PIECES_2x2,
        myPieceIndices: [0, 1],
        placedPieces: new Map([[0, 'p1'], [1, 'p2'], [2, 'p1'], [3, 'p2']]),
        postUrl: 'https://picsum.photos/400/400',
        onPlacePiece: (idx) => console.log('Place piece', idx),
        timerEnd: Date.now() + 30000,
    },
};

export const UrgentTimer: Story = {
    args: {
        pieces: PIECES_2x2,
        myPieceIndices: [0, 1, 2, 3],
        placedPieces: new Map(),
        postUrl: 'https://picsum.photos/400/400',
        onPlacePiece: (idx) => console.log('Place piece', idx),
        timerEnd: Date.now() + 8000,
    },
};
