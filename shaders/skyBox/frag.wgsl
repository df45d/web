@fragment fn fs(vsOut: vsOutput) -> @location(0) vec4<f32> {
    let baseColor = vec3f(0.06, 0.18, 0.37);
    let bottomColor = 0.3 - (1 - baseColor);


    let normal = normalize(vsOut.normal);
    let yPlaneLength = length(vec2f(normal.x, normal.z));

    let alignedNormal = vec3f(yPlaneLength, -normal.y, 0);
    let intensity = 1 - pow(abs(dot(alignedNormal, vec3f(0, 1, 0))), 0.4);

    var color: vec3f;

    let lightDir = normalize(vec3f(0, -1, 0));
    let sunIntensity = pow(max(dot(normal, lightDir), 0), 128);
    let sun = vec3f(sunIntensity, sunIntensity * 0.8, sunIntensity * 0.5);

    if (normal.y < 0) {
        color = baseColor + intensity + sun;
    }
    else {
        color = bottomColor + intensity * 1.5 + sun;
    }


    return vec4f(color, 1);
}