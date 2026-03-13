import { Suspense, useMemo, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { PuzzlePieceDefinitionType, PuzzlePieceAssignmentType } from '../../types';
import { PuzzlePiece } from './PuzzlePiece';
import { AssemblyZone } from './AssemblyZone';
import { FragmentTray } from './FragmentTray';

interface PuzzleCanvasProps {
    pieces: PuzzlePieceDefinitionType[];
    myPieceIndices: number[];
    placedPieces: Map<number, string>;
    postUrl: string;
    onPlacePiece: (pieceIndex: number) => void;
    timerEnd: number;
}

/**
 * Inner canvas content that renders puzzle pieces once the texture is loaded.
 */
function PuzzleContent({
    pieces,
    myPieceIndices,
    placedPieces,
    postUrl,
    onPlacePiece,
}: Omit<PuzzleCanvasProps, 'timerEnd'>) {
    const texture = useTexture(postUrl);

    const imageAspect = useMemo(() => {
        if (!texture.image) return 1;
        return texture.image.width / texture.image.height;
    }, [texture]);

    const myPieceSet = useMemo(() => new Set(myPieceIndices), [myPieceIndices]);

    // Distribute tray offsets for unplaced pieces
    const trayOffsets = useMemo(() => {
        const unplaced = pieces.filter(p => !placedPieces.has(p.index));
        const colCount = Math.max(1, Math.ceil(Math.sqrt(unplaced.length)));
        return unplaced.reduce((acc, piece, i) => {
            const col = i % colCount;
            const row = Math.floor(i / colCount);
            const x = (col - (colCount - 1) / 2) * 0.25;
            const y = -0.7 - row * 0.25;
            acc.set(piece.index, new THREE.Vector3(x, y, 0));
            return acc;
        }, new Map<number, THREE.Vector3>());
    }, [pieces, placedPieces]);

    return (
        <>
            <AssemblyZone
                imageAspect={imageAspect}
                placedCount={placedPieces.size}
                totalPieces={pieces.length}
            />
            <FragmentTray imageAspect={imageAspect} unplacedCount={pieces.length - placedPieces.size} />
            {pieces.map(piece => (
                <PuzzlePiece
                    key={piece.index}
                    piece={piece}
                    texture={texture}
                    imageAspect={imageAspect}
                    isMyPiece={myPieceSet.has(piece.index)}
                    isPlaced={placedPieces.has(piece.index)}
                    placedByUserID={placedPieces.get(piece.index)}
                    trayOffset={trayOffsets.get(piece.index) ?? new THREE.Vector3(0, -0.75, 0)}
                    onPlacePiece={onPlacePiece}
                />
            ))}
        </>
    );
}

/**
 * PuzzleCanvas is the top-level R3F Canvas wrapper for the puzzle game mode.
 * Uses an orthographic camera for a 2D puzzle view.
 * Layout: upper ~60% = assembly zone, lower ~40% = fragment tray.
 */
export function PuzzleCanvas({
    pieces,
    myPieceIndices,
    placedPieces,
    postUrl,
    onPlacePiece,
    timerEnd,
}: PuzzleCanvasProps) {
    const canvasStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        minHeight: '500px',
        background: '#0d0d1a',
        borderRadius: '8px',
    };

    return (
        <div style={canvasStyle}>
            <Canvas
                orthographic
                camera={{ zoom: 200, position: [0, -0.1, 5], near: 0.1, far: 100 }}
                gl={{ antialias: true, alpha: false }}
            >
                <ambientLight intensity={1} />
                <Suspense fallback={null}>
                    <PuzzleContent
                        pieces={pieces}
                        myPieceIndices={myPieceIndices}
                        placedPieces={placedPieces}
                        postUrl={postUrl}
                        onPlacePiece={onPlacePiece}
                    />
                </Suspense>
            </Canvas>
        </div>
    );
}
