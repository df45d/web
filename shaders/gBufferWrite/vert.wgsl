struct Matrices {
    projectionMatrix : mat4x4<f32>,
    camTranslationMatrix : mat4x4<f32>,
    camRotationMatrix : mat4x4<f32>,
    invCamRotationMatrix : mat3x3<f32>,
}

struct vsOutput {
    @builtin(position) fragPos: vec4<f32>,
    @location(0) uv: vec2<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) position: vec3<f32>,
    @location(3) biTangent: vec3<f32>,
    @location(4) tangent: vec3<f32>,
};

@group(0) @binding(0) var<uniform> matrices: Matrices;

@vertex fn vs(
    @location(0) position: vec3<f32>, 
    @location(1) normal: vec3<f32>, 
    @location(2) uv: vec2<f32>,
    @location(3) tangent: vec3<f32>) -> vsOutput {

    var vsOut: vsOutput;
    let fragPosition = vec4f(position, 1) * matrices.camTranslationMatrix * matrices.camRotationMatrix;

    let invMat = transpose(matrices.invCamRotationMatrix);
    let invNormal = vec3f(normal.x, normal.y, -normal.z);
    let fragNormal = normalize(invNormal * transpose(matrices.invCamRotationMatrix));

    let t = normalize(tangent);
    let N = fragNormal;
    let T = normalize(t - dot(t, N) * N);
    let B = normalize(cross(N, T));

    vsOut.position = fragPosition.xyz;
    vsOut.uv = uv;
    vsOut.normal = fragNormal;
    vsOut.tangent = T;
    vsOut.biTangent = B;

    vsOut.fragPos = fragPosition * matrices.projectionMatrix; 
    return vsOut;
}