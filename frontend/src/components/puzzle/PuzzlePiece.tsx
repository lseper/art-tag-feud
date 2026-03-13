import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { PuzzlePieceDefinitionType } from '../../types';
import { createPieceGeometry, getCentroidWorld } from './puzzleGeometry';
import { createPieceShaderMaterial } from './puzzleShaders';

// Snap threshold: piece snaps if centroid is within this fraction of image width from target
const SNAP_THRESHOLD = 0.08;

interface PuzzlePieceProps {
    piece: PuzzlePieceDefinitionType;
    texture: THREE.Texture;
    imageAspect: number;
    isMyPiece: boolean;
    isPlaced: boolean;
    placedByUserID?: string;
    trayOffset: THREE.Vector3;
    onPlacePiece: (pieceIndex: number) => void;
    isInteractionDisabled?: boolean;
}

type PieceState = 'inTray' | 'dragging' | 'placed';

/**
 * PuzzlePiece renders a single Voronoi-cut puzzle piece as a draggable mesh.
 * Uses custom ShaderMaterial for texture rendering with edge effects.
 */
export function PuzzlePiece({
    piece,
    texture,
    imageAspect,
    isMyPiece,
    isPlaced,
    placedByUserID,
    trayOffset,
    onPlacePiece,
    isInteractionDisabled = false,
}: PuzzlePieceProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [pieceState, setPieceState] = useState<PieceState>('inTray');
    const [isHovered, setIsHovered] = useState(false);
    const [flashGreen, setFlashGreen] = useState(false);
    const { camera, gl } = useThree();

    const targetPosition = useMemo(
        () => getCentroidWorld(piece.centroid, imageAspect),
        [piece.centroid, imageAspect],
    );

    const geometry = useMemo(
        () => createPieceGeometry(piece, imageAspect),
        [piece, imageAspect],
    );

    const material = useMemo(() => createPieceShaderMaterial(texture), [texture]);

    // Set initial tray position
    useEffect(() => {
        if (meshRef.current && pieceState === 'inTray') {
            meshRef.current.position.copy(trayOffset);
        }
    }, [trayOffset, pieceState]);

    // Update material on hover/placed state
    useEffect(() => {
        if (!material) return;
        const uniforms = material.uniforms as any;
        if (isPlaced) {
            uniforms.opacity.value = 1.0;
            uniforms.highlightStrength.value = 0.0;
        } else if (flashGreen) {
            uniforms.highlightStrength.value = 0.5;
            uniforms.highlightColor.value.set(0x00ff88);
        } else if (isHovered && isMyPiece) {
            uniforms.highlightStrength.value = 0.15;
            uniforms.highlightColor.value.set(0xffffff);
        } else if (!isMyPiece) {
            uniforms.opacity.value = 0.65;
            uniforms.highlightStrength.value = 0.0;
        } else {
            uniforms.opacity.value = 1.0;
            uniforms.highlightStrength.value = 0.0;
        }
    }, [isHovered, isPlaced, flashGreen, isMyPiece, material]);

    // Drag plane for raycasting
    const dragPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
    const raycaster = useMemo(() => new THREE.Raycaster(), []);
    const dragOffset = useRef(new THREE.Vector3());

    const getPointerWorld = useCallback(
        (event: PointerEvent): THREE.Vector3 | null => {
            const rect = gl.domElement.getBoundingClientRect();
            const ndcX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const ndcY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
            const target = new THREE.Vector3();
            const hit = raycaster.ray.intersectPlane(dragPlane, target);
            return hit ? target : null;
        },
        [camera, gl.domElement, raycaster, dragPlane],
    );

    const handlePointerDown = useCallback(
        (e: any) => {
            if (isPlaced || !isMyPiece || isInteractionDisabled) return;
            e.stopPropagation();
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            const world = getPointerWorld(e.nativeEvent);
            if (!world || !meshRef.current) return;
            dragOffset.current.copy(meshRef.current.position).sub(world);
            setPieceState('dragging');
            const uniforms = (material as any).uniforms;
            uniforms.edgeDarken.value = 0.3;
        },
        [isPlaced, isMyPiece, isInteractionDisabled, getPointerWorld, material],
    );

    const handlePointerMove = useCallback(
        (e: any) => {
            if (pieceState !== 'dragging' || !meshRef.current) return;
            const world = getPointerWorld(e.nativeEvent);
            if (!world) return;
            const newPos = world.clone().add(dragOffset.current);
            newPos.z = 0.1; // lift piece while dragging
            meshRef.current.position.copy(newPos);
        },
        [pieceState, getPointerWorld],
    );

    const handlePointerUp = useCallback(
        (e: any) => {
            if (pieceState !== 'dragging' || !meshRef.current) return;
            setPieceState('inTray');
            const uniforms = (material as any).uniforms;
            uniforms.edgeDarken.value = 0.6;

            // Check snap: distance from current centroid position to target centroid
            const currentPos = meshRef.current.position;
            const dist = currentPos.distanceTo(targetPosition);
            const snapDist = SNAP_THRESHOLD * imageAspect;

            if (dist <= snapDist) {
                // Snap to correct position
                meshRef.current.position.copy(targetPosition);
                meshRef.current.position.z = 0;
                // Flash green and notify
                setFlashGreen(true);
                setTimeout(() => setFlashGreen(false), 600);
                onPlacePiece(piece.index);
            } else {
                // Return to tray offset
                meshRef.current.position.copy(trayOffset);
            }
        },
        [pieceState, material, targetPosition, imageAspect, onPlacePiece, piece.index, trayOffset],
    );

    // If piece was placed by another player, snap to target position
    useEffect(() => {
        if (isPlaced && meshRef.current) {
            meshRef.current.position.copy(targetPosition);
            meshRef.current.position.z = 0;
        }
    }, [isPlaced, targetPosition]);

    const scale = pieceState === 'dragging' ? 1.04 : (isHovered && isMyPiece && !isPlaced ? 1.02 : 1.0);

    return (
        <mesh
            ref={meshRef}
            geometry={geometry}
            material={material}
            scale={[scale, scale, 1]}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerEnter={() => !isPlaced && isMyPiece && setIsHovered(true)}
            onPointerLeave={() => setIsHovered(false)}
        />
    );
}
