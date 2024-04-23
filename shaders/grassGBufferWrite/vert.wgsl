struct Matrices {
    projectionMatrix : mat4x4<f32>,
    camTranslationMatrix : mat4x4<f32>,
    camRotationMatrix : mat4x4<f32>,
    invCamRotationMatrix : mat3x3<f32>,
}

struct vsOutput {
    @builtin(position) fragPos: vec4<f32>,
    @location(0) normal: vec3<f32>,
    @location(1) position: vec3<f32>,
    @location(2) color: vec3<f32>,
}; 

struct BladeInfo {
    x: f32,
    y: f32,
    z: f32,
    rotation: f32,
    lean: f32,
}


@group(0) @binding(0) var<uniform> matrices: Matrices;
@group(1) @binding(0) var<storage, read> grassData: array<BladeInfo>;

const tipColor = vec3f(0.5, 0.5, 0.1);
const baseColor = vec3f(0.05, 0.2, 0.01);
const HALF_PI = 1.5707963267948966;

fn sineIn(t: f32) -> f32 {
    return sin((t - 1.0) * HALF_PI) + 1.0;
}

fn rotateY(vector: vec3<f32>, rotation: f32) -> vec3<f32> {
    let sinVal = sin(rotation);
    let cosVal = cos(rotation);
    return vec3f(vector.x * cosVal + vector.z * sinVal, vector.y, -vector.x * sinVal + vector.z * cosVal);
}

fn rotateX(vector: vec3<f32>, rotation: f32) -> vec3<f32> {
    let sinVal = sin(rotation);
    let cosVal = cos(rotation);
    return vec3f(vector.x, vector.y * cosVal - vector.z * sinVal, vector.y * sinVal + vector.z * cosVal);
}

@vertex fn vs(
    @builtin(instance_index) instanceID : u32,
    @location(0) position : vec3<f32>) -> vsOutput {

    var vsOut = vsOutput();
    let grass = grassData[instanceID];
    let offset = vec3f(grass.x, grass.y, grass.z);

    let heightPercent = position.y / 1;

    // position manipulation   
    var aPosition = rotateX(position, sineIn(heightPercent / 2 * grass.lean));
    aPosition = rotateY(aPosition, grass.rotation);
    aPosition += offset;

    let fragPosition = vec4f(aPosition, 1) * matrices.camTranslationMatrix * matrices.camRotationMatrix;



    var normal = vec3f(0, 0, -1);
    // inverse normal
    normal = normalize(vec3f(normal.x, normal.y, -normal.z));

    // rotate normal
    normal = rotateX(normal, -sineIn(heightPercent  * grass.lean));
    normal = normalize(rotateY(normal, -grass.rotation));
    if (dot(normal * transpose(matrices.invCamRotationMatrix), fragPosition.xyz) > 0) {
        normal = -normal;
    }

    normal = normalize(normal + vec3f(position.x * 15, 0, 0));
    

    // return values


    vsOut.normal = normalize(normal * transpose(matrices.invCamRotationMatrix)); 
    vsOut.position = fragPosition.xyz;    
    vsOut.color = mix(baseColor, tipColor, sineIn(heightPercent));
    vsOut.fragPos = vec4f(fragPosition.xyz, 1) * matrices.projectionMatrix; 

    return vsOut;
}