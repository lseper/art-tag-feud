import * as THREE from 'three';

export interface PieceShaderUniforms {
    map: THREE.IUniform<THREE.Texture | null>;
    opacity: THREE.IUniform<number>;
    edgeDarken: THREE.IUniform<number>;
    highlightColor: THREE.IUniform<THREE.Color>;
    highlightStrength: THREE.IUniform<number>;
}

const vertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
uniform sampler2D map;
uniform float opacity;
uniform float edgeDarken;
uniform vec3 highlightColor;
uniform float highlightStrength;

varying vec2 vUv;

void main() {
    vec4 texColor = texture2D(map, vUv);

    // Edge darkening: darken pixels near UV boundary (0 or 1)
    float edgeDist = min(
        min(vUv.x, 1.0 - vUv.x),
        min(vUv.y, 1.0 - vUv.y)
    );
    float edge = 1.0 - smoothstep(0.0, 0.03, edgeDist);
    vec3 darkened = texColor.rgb * (1.0 - edge * edgeDarken);

    // Highlight overlay (used for hover/placement feedback)
    vec3 final = mix(darkened, highlightColor, highlightStrength);

    gl_FragColor = vec4(final, texColor.a * opacity);
}
`;

/**
 * Create a ShaderMaterial for rendering puzzle pieces.
 * Applies subtle edge darkening and supports highlight overlays.
 */
export function createPieceShaderMaterial(texture: THREE.Texture): THREE.ShaderMaterial {
    const uniforms: PieceShaderUniforms = {
        map: { value: texture },
        opacity: { value: 1.0 },
        edgeDarken: { value: 0.6 },
        highlightColor: { value: new THREE.Color(0x00ff88) },
        highlightStrength: { value: 0.0 },
    };

    return new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        transparent: true,
        side: THREE.FrontSide,
    });
}
