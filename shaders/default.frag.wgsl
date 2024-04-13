@group(1) @binding(1) var tSampler: sampler;
@group(1) @binding(2) var tTexture: texture_2d<f32>;
@group(1) @binding(3) var normalMap: texture_2d<f32>;
@group(1) @binding(4) var aoMap: texture_2d<f32>;
@group(1) @binding(5) var roughnessMap: texture_2d<f32>;
@group(1) @binding(6) var metallicMap: texture_2d<f32>;


@fragment fn fs(vsOut: vsOutput) -> @location(0) vec4<f32> {
    let albedo = textureSample(tTexture, tSampler, vsOut.uv);
    let normalTex = textureSample(normalMap, tSampler, vsOut.uv).rgb;
    let ao = textureSample(aoMap, tSampler, vsOut.uv).r;
    let roughness = textureSample(roughnessMap, tSampler, vsOut.uv).r;
    let metallic = textureSample(metallicMap, tSampler, vsOut.uv).r;


    let ambient = lightingData.ambientStrength * ao;
    let specularStrength = 1f;


    let normal = getNormal(vsOut, normalTex);
    let lightDir = normalize(vec3f(-vsOut.lightDir.x, vsOut.lightDir.y, vsOut.lightDir.z));
    let diffuse = max(dot(-normal, lightDir), 0);

    var viewDir = normalize(vsOut.position);
    let halfDir = normalize(lightDir + viewDir);

    let spec = pow(max(dot(halfDir, -normal), 0), 32);
    let specular = specularStrength * spec;


    var fragColor = albedo * (ambient + specular + diffuse) * lightingData.lightColor;
    return fragColor;
}