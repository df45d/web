struct Matrices {
    projectionMatrix : mat4x4<f32>,
    camTranslationMatrix : mat4x4<f32>,
    camRotationMatrix : mat4x4<f32>,
    invCamRotationMatrix : mat4x4<f32>,
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
    let aPosition = vec4f(position, 1) * matrices.camTranslationMatrix * matrices.camRotationMatrix;
    vsOut.uv = uv;
    
    var normalR = (vec4f(normalize(normal), 0) * (matrices.invCamRotationMatrix)).xyz;

    vsOut.normal = normalize(normalR);

    let t = normalize((vec4f(normalize(tangent), 0) * (matrices.invCamRotationMatrix)).xyz); //normalize((vec4f(normalize(tangent), 1) * (matrices.invCamRotationMatrix)).xyz);
    let N = normalize(normalR);
    var T = normalize(t - dot(t, N) * N);
    let B = normalize(cross(N, T));

    vsOut.biTangent = B;
    vsOut.tangent = T;

    vsOut.position = vec3f(aPosition.x, aPosition.y, aPosition.z);

    vsOut.fragPos = aPosition * matrices.projectionMatrix; 
    return vsOut;
}