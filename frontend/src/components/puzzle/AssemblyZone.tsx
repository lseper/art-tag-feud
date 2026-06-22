import { useMemo } from 'react';
import * as THREE from 'three';

interface AssemblyZoneProps {
    imageAspect: number;
    placedCount: number;
    totalPieces: number;
}

/**
 * AssemblyZone renders a guide outline showing the target image boundary
 * in the upper portion of the canvas, along with a completion progress indicator.
 */
export function AssemblyZone({ imageAspect, placedCount, totalPieces }: AssemblyZoneProps) {
    const linePoints = useMemo(() => {
        const hw = imageAspect * 0.5;
        const hh = 0.5;
        return [
            new THREE.Vector3(-hw, -hh, 0),
            new THREE.Vector3(hw, -hh, 0),
            new THREE.Vector3(hw, hh, 0),
            new THREE.Vector3(-hw, hh, 0),
            new THREE.Vector3(-hw, -hh, 0),
        ];
    }, [imageAspect]);

    const progress = totalPieces > 0 ? placedCount / totalPieces : 0;
    const outlineColor = progress >= 1 ? '#00ff88' : '#ffffff';

    return (
        <group position={[0, 0, -0.01]}>
            {/* Guide outline */}
            <line>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[new Float32Array(linePoints.flatMap(p => [p.x, p.y, p.z])), 3]}
                    />
                </bufferGeometry>
                <lineBasicMaterial color={outlineColor} linewidth={2} transparent opacity={0.5} />
            </line>
        </group>
    );
}
