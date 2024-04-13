struct gBufferOut {
    @location(0) albedo: vec4f,
    @location(1) position: vec4f,
    @location(2) normal: vec4f,
    @location(3) properties: vec4f,
}

@group(1) @binding(0) var tSampler: sampler;
@group(1) @binding(1) var tTexture: texture_2d<f32>;
@group(1) @binding(2) var normalMap: texture_2d<f32>;
@group(1) @binding(3) var aoMap: texture_2d<f32>;
@group(1) @binding(4) var roughnessMap: texture_2d<f32>;
@group(1) @binding(5) var metallicMap: texture_2d<f32>;


@fragment fn fs(vsOut: vsOutput) -> gBufferOut {
    let albedo = textureSample(tTexture, tSampler, vsOut.uv).rgb;
    let normalTex = textureSample(normalMap, tSampler, vsOut.uv).rgb;
    let ao = textureSample(aoMap, tSampler, vsOut.uv).r;
    let roughness = textureSample(roughnessMap, tSampler, vsOut.uv).r;
    let metallic = textureSample(metallicMap, tSampler, vsOut.uv).r;

    let normal = getNormal(vsOut, normalTex);

    var output = gBufferOut();
    output.albedo = vec4f(albedo.rgb, 0);
    output.position = vec4f(vsOut.position.xyz, 0);
    output.normal = vec4f(normal, 0); 
    output.properties.r = roughness;
    output.properties.g = metallic; 
    output.properties.b = ao;

    return output;
}