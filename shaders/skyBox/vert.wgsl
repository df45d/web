struct Matrices {
    projectionMatrix : mat4x4<f32>,
    camTranslationMatrix : mat4x4<f32>,
    camRotationMatrix : mat4x4<f32>,
    invCamRotationMatrix : mat3x3<f32>,
}

struct vsOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) normal: vec3<f32>,
};

@group(0) @binding(0) var<uniform> matrices: Matrices;

@vertex fn vs(@location(0) position: vec3<f32>, @location(1) normal: vec3<f32>) -> vsOutput {

    var vsOut: vsOutput;
    let aPosition = vec4f(position, 1);
    vsOut.normal = normal;

    vsOut.position = aPosition * matrices.camRotationMatrix * matrices.projectionMatrix; 
    return vsOut;
}