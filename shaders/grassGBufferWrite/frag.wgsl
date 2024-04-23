struct gBufferOut {
    @location(0) albedo: vec4f,
    @location(1) position: vec4f,
    @location(2) normal: vec4f,
    @location(3) properties: vec4f,
}

@fragment fn fs(vsOut: vsOutput) -> gBufferOut {
    var output = gBufferOut();
    output.albedo = vec4f(vsOut.color, 0);
    output.position = vec4f(vsOut.position, 0);
    output.normal = vec4f(normalize(vsOut.normal), 1); 
    output.properties.r = 1;
    output.properties.g = 1; 
    output.properties.b = 1;

    return output;
}