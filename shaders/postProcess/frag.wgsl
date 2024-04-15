@group(0) @binding(0) var prePass: texture_2d<f32>;

const ACESInputMat = mat3x3(
    vec3f(0.59719, 0.35458, 0.04823),
    vec3f(0.07600, 0.90834, 0.01566),
    vec3f(0.02840, 0.13383, 0.83777)
);

const ACESOutputMat = mat3x3(
    vec3f(1.60475, -0.53108, -0.07367),
    vec3f(-0.10208,  1.10813, -0.00605),
    vec3f(-0.00327, -0.07276,  1.07602)
);

fn RRTAndODTFit(v: vec3f) -> vec3f
{
    let a = v * (v + 0.0245786) - 0.000090537;
    let b = v * (0.983729 * v + 0.4329510) + 0.238081;
    return a / b;
}

// wgsl implementation of professional HILL ACES tonemapping

fn hillACES(inputColor: vec3f) -> vec3f
{
    var color = inputColor * ACESInputMat;

    color = RRTAndODTFit(color);

    color = color * ACESOutputMat;

    color = clamp(color, vec3f(0.0), vec3f(1.0));

    return color;
}


// wgsl implementation of professional Narkowicz ACES tonemapping

const a = 2.51;
const b = 0.03;
const c = 2.43;
const d = 0.59;
const e = 0.14;

fn narkowiczACES(x: vec3f) -> vec3f {
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), vec3f(0.0), vec3f(1.0));
}


@fragment fn fs(@builtin(position) coord: vec4f) -> @location(0) vec4<f32> {
    let screenPos = vec2i(floor(coord.xy));
    let color = textureLoad(prePass, screenPos, 0);
    let fragColor = narkowiczACES(color.xyz);
    
    return vec4f(fragColor, 1);
}
