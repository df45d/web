// Structures used for bind groups
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

struct Delta {
    value: f32,
}

// Bind Groups -> bind data from outside the shader, including per-blade grass data
@group(0) @binding(0) var<uniform> matrices: Matrices;
@group(1) @binding(0) var<storage, read> grassData: array<BladeInfo>;
@group(1) @binding(1) var tSampler: sampler;
@group(1) @binding(2) var tNoise: texture_2d<f32>;
@group(1) @binding(3) var<uniform> deltaT: Delta;


// Color Customisation for grass blades
const tipColor = vec3f(1, 0.84, 0) / 7;
const baseColor = vec3f(0.57, 0.58, 0.21) / 7;

const HALF_PI = 1.5707963267948966;

// ease in function
fn sineIn(t: f32) -> f32 {
    return sin((t - 1.0) * HALF_PI) + 1.0;
}

// rotation functions
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

// hash function adopted from glsl
fn murmurHash12(s: vec2<u32>) -> u32{
    const M = 0x5bd1e995u;
    var h = 1190494759u;
    var src = s;
    src *= M; src ^= src>>vec2(24u); src *= M;
    h *= M; h ^= src.x; h *= M; h ^= src.y;
    h ^= h>>13u; h *= M; h ^= h>>15u;
    return h;
}

fn hash12(src: vec2<f32>) -> f32{
    let h = murmurHash12(bitcast<vec2<u32>>(src));
    return bitcast<f32>((h & 0x007fffffu) | 0x3f800000u) - 1.0;
}

// perlin noise function adopted from glsl
fn noise12(p: vec2<f32>) -> f32 {
    let i = floor(p);

    let f = fract(p);
    let u = smoothstep(vec2(0.0), vec2(1.0), f);

    let val = mix(mix( hash12( i + vec2(0.0, 0.0) ), 
                        hash12( i + vec2(1.0, 0.0) ), u.x),
                mix( hash12( i + vec2(0.0, 1.0) ), 
                        hash12( i + vec2(1.0, 1.0) ), u.x), u.y);
    return val;
}

// vertex shader
@vertex fn vs(
    @builtin(instance_index) instanceID : u32,
    @location(0) position : vec3<f32>) -> vsOutput {

    // fetch per blade data
    var vsOut = vsOutput();
    let grass = grassData[instanceID];
    let offset = vec3f(grass.x, grass.y, grass.z);
    let heightPercent = position.y / 1;

    // Take two noise samples then use that to curve the grass blade, then rotate the entire grass blade.
    // Used to create a flappy effect
    let noiseSample = noise12(vec2f((vec2f(deltaT.value * 2) + offset.xz / 4) * 0.5));
    let noiseSample2 = noise12(vec2f((vec2f(deltaT.value * 0.25) + offset.xz / 4) * 2));
    let cAmount = ((noiseSample - 0.3) * 2) * 1 + (grass.lean * 0.5) + (-noiseSample2 * 0.1);
    let rotAmount = noiseSample / 2 + 0.25;

    // apply the rotations and transformations from above
    var aPosition = rotateX(position, (heightPercent / 2 * cAmount));
    aPosition = rotateX(aPosition, rotAmount);
    aPosition = rotateY(aPosition, grass.rotation / 10 + 3.92699081699);
    aPosition += offset;

    // set normal
    var normal = vec3f(0, 0, -1);
    normal = normalize(vec3f(normal.x, normal.y, -normal.z));

    // rotate normal from values above
    normal = rotateX(normal, -(heightPercent * cAmount));
    normal = rotateX(normal, -rotAmount);
    normal = normalize(rotateY(normal, -(grass.rotation / 10 + 3.92699081699)));
    normal = normalize(normal + vec3f(position.x * 15, 0, 0));
    
    // return values
    let fragPosition = vec4f(aPosition, 1) * matrices.camTranslationMatrix * matrices.camRotationMatrix;
    vsOut.normal = normalize(normal * transpose(matrices.invCamRotationMatrix)); 
    vsOut.position = fragPosition.xyz;    
    vsOut.color = mix(baseColor, tipColor, sineIn(heightPercent));
    vsOut.fragPos = vec4f(fragPosition.xyz, 1) * matrices.projectionMatrix; 

    return vsOut;
}