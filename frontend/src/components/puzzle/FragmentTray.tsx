import * as THREE from 'three';

interface FragmentTrayProps {
    imageAspect: number;
    unplacedCount: number;
}

/**
 * FragmentTray renders a visual indicator for the tray area (lower portion of canvas)
 * where unplaced pieces are scattered.
 */
export function FragmentTray({ imageAspect, unplacedCount }: FragmentTrayProps) {
    const hw = imageAspect * 0.5 + 0.1;
    const top = -0.55;
    const bottom = -1.05;

    const points = new Float32Array([
        -hw, top, 0,
        hw, top, 0,
        hw, bottom, 0,
        -hw, bottom, 0,
        -hw, top, 0,
    ]);

    return (
        <group>
            {/* Tray outline */}
            <line>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[points, 3]} />
                </bufferGeometry>
                <lineBasicMaterial color="#444466" linewidth={1} transparent opacity={0.4} />
            </line>
            {/* Tray label placeholder - rendered as a subtle plane */}
            {unplacedCount > 0 && (
                <mesh position={[0, (top + bottom) / 2, -0.02]}>
                    <planeGeometry args={[hw * 2, Math.abs(top - bottom)]} />
                    <meshBasicMaterial color="#111122" transparent opacity={0.2} />
                </mesh>
            )}
        </group>
    );
}
