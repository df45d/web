struct Matrices {
    projectionMatrix : mat4x4<f32>,
    camTranslationMatrix : mat4x4<f32>,
    camRotationMatrix : mat4x4<f32>,
    invRotationMatrix : mat3x3<f32>,
}

struct LightingData {
    direction: vec4<f32>,
    color: vec4<f32>,
}

struct vsOutput {
    @builtin(position) coord: vec4f,
    @location(0) viewSpaceLightDir: vec3f,
}

const screen = array(
    vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0, 1.0),
    vec2(-1.0, 1.0), vec2(1.0, -1.0), vec2(1.0, 1.0),
);

@group(0) @binding(0) var<uniform> matrices: Matrices;
@group(2) @binding(0) var<uniform> lightData: LightingData;

@vertex fn vs(@builtin(vertex_index) VertexIndex : u32) -> vsOutput {
    var vsOut: vsOutput;
    vsOut.coord = vec4f(screen[VertexIndex], 0.0, 1.0);
    vsOut.viewSpaceLightDir = lightData.direction.xyz * transpose(matrices.invRotationMatrix);

    return vsOut;
}