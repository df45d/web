@group(1) @binding(0) var gBufferAlbedo: texture_2d<f32>;
@group(1) @binding(1) var gBufferPosition: texture_2d<f32>;
@group(1) @binding(2) var gBufferNormal: texture_2d<f32>;
@group(1) @binding(3) var gBufferProperties: texture_2d<f32>;

@fragment fn fs(vsOut: vsOutput) -> @location(0) vec4<f32> {
    let screenPos = vec2i(floor(vsOut.coord.xy));
    let albedoLoad = textureLoad(gBufferAlbedo, screenPos, 0);
    let positionLoad = textureLoad(gBufferPosition, screenPos, 0);
    let normalLoad = textureLoad(gBufferNormal, screenPos, 0);
    let propertiesLoad = textureLoad(gBufferProperties, screenPos, 0);

    let albedo = albedoLoad.rgb;
    let position = positionLoad.xyz;
    let normal = normalLoad.xyz;
    let roughness = propertiesLoad.r;
    let metallic = propertiesLoad.g;
    let ao = propertiesLoad.b;

    let ambient = 0.3 * ao;
    let lightColor = lightData.color.xyz;

    let lightDir = -normalize(vsOut.viewSpaceLightDir);
    let diffuse = max(dot(normal, lightDir), 0);

    var viewDir = normalize(-position);
    let halfDir = normalize(lightDir + viewDir);

    let specular = pow(max(dot(halfDir, normal), 0), 32);

    var fragColor = (ambient + diffuse + specular) * albedo * lightColor;
    return vec4f(fragColor, 1);
}
