import * as THREE from 'three';
import type { PuzzlePieceDefinitionType } from '../../types';

/**
 * Create a THREE.ShapeGeometry from Voronoi polygon vertices.
 * Vertices are in normalized [0,1] x [0,1] space.
 * UV coordinates map directly to texture coordinates.
 *
 * @param piece - The puzzle piece definition
 * @param imageAspect - width / height of the source image (used to scale geometry)
 */
export function createPieceGeometry(
    piece: PuzzlePieceDefinitionType,
    imageAspect: number,
): THREE.ShapeGeometry {
    const shape = new THREE.Shape();

    if (piece.vertices.length === 0) {
        return new THREE.ShapeGeometry(shape);
    }

    // Transform from [0,1] space to world space, preserving aspect ratio.
    // We map to [-0.5 * aspect, 0.5 * aspect] x [-0.5, 0.5]
    const toWorld = (uv: [number, number]): [number, number] => [
        (uv[0] - 0.5) * imageAspect,
        (uv[1] - 0.5),
    ];

    const [startX, startY] = toWorld(piece.vertices[0]);
    shape.moveTo(startX, startY);
    for (let i = 1; i < piece.vertices.length; i++) {
        const [wx, wy] = toWorld(piece.vertices[i]);
        shape.lineTo(wx, wy);
    }
    shape.closePath();

    const geometry = new THREE.ShapeGeometry(shape);

    // Compute UV coordinates from vertex positions.
    // Since vertices are in [0,1] space and we scale by aspect, we reverse the transform for UVs.
    const positionAttr = geometry.attributes.position as THREE.BufferAttribute;
    const uvAttr = geometry.attributes.uv as THREE.BufferAttribute;
    const uvArray = new Float32Array(positionAttr.count * 2);

    for (let i = 0; i < positionAttr.count; i++) {
        const wx = positionAttr.getX(i);
        const wy = positionAttr.getY(i);
        // Convert world space back to [0,1] UV space
        uvArray[i * 2] = wx / imageAspect + 0.5;
        uvArray[i * 2 + 1] = wy + 0.5;
    }

    geometry.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
    return geometry;
}

/**
 * Create a THREE.Vector3 representing the piece centroid in world space.
 */
export function getCentroidWorld(centroid: [number, number], imageAspect: number): THREE.Vector3 {
    return new THREE.Vector3(
        (centroid[0] - 0.5) * imageAspect,
        (centroid[1] - 0.5),
        0,
    );
}
