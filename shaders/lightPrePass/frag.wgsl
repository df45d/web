struct Matrices {
    projectionMatrix : mat4x4<f32>,
    camTranslationMatrix : mat4x4<f32>,
    camRotationMatrix : mat4x4<f32>,
    amRotationMatrix : mat4x4<f32>,
}

/*struct LightingData {
    direction: vec4<f32>,
    color: vec4f<f32>,
}*/

@group(0) @binding(0) var<uniform> matrices: Matrices;

@group(1) @binding(0) var gBufferAlbedo: texture_2d<f32>;
@group(1) @binding(1) var gBufferPosition: texture_2d<f32>;
@group(1) @binding(2) var gBufferNormal: texture_2d<f32>;
@group(1) @binding(3) var gBufferProperties: texture_2d<f32>;

//@group(2) @binding(0) var<uniform> lightData: LightingData;


@fragment fn fs(@builtin(position) coord: vec4f) -> @location(0) vec4<f32> {
    let screenPos = vec2i(floor(coord.xy));
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

    /*let ambient = lightingData.ambientStrength * ao;
    let specularStrength = 1f;


    let normal = getNormal(vsOut, normalTex);
    let lightDir = -normalize(lightData.direction);
    let diffuse = max(dot(normal, lightDir), 0);

    var viewDir = normalize(vsOut.position);
    let halfDir = normalize(lightDir + viewDir);

    let spec = pow(max(dot(halfDir, normal), 0), 32);
    let specular = specularStrength * spec;*/

    let diffuse = max(dot(normal, vec3f(0, 0, 1)), 0);

    var fragColor = vec4f(normal, 0);
    return fragColor;
}
