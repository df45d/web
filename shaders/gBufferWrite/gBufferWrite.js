class gBufferWrite {
    static normalMappingEnabled = `
    fn getNormal(vsOut: vsOutput, normalTex: vec3f) -> vec3<f32>{
        var normal = normalize(normalTex * 2 - vec3f(1, 1, 1));
        var TBN = mat3x3f(vsOut.tangent, vsOut.biTangent, vsOut.normal);
        return normalize(TBN * normal);
    }
    `

    static normalMappingDisabled = `
        fn getNormal(vsOut: vsOutput, normalTex: vec3f) -> vec3<f32>{
            return normalize(vsOut.normal);
        }
    `

    static async get(inputs) {
        var headerText = "";
        if (inputs.normalMapping) {
            headerText = gBufferWrite.normalMappingEnabled;
        } else {
            headerText = gBufferWrite.normalMappingDisabled;
        }
        const module = await ShaderModule.create(
            inputs.device, "gBufferWrite",
            "shaders/gBufferWrite/vert.wgsl",
            "shaders/gBufferWrite/frag.wgsl",
            2*(4 * 3) + 4 * 2 + (4 * 3),
            [
             {
                shaderLocation: 0,
                offset: 0,
                format: 'float32x3',
             },
             {
                shaderLocation: 1,
                offset: 4 * 3,
                format: 'float32x3',
             },
             {
                shaderLocation: 2,
                offset: 2*(4 * 3),
                format: 'float32x2',
             },
             {
                shaderLocation: 3,
                offset: 2*(4 * 3) + 4 * 2,
                format: 'float32x3',
             },
             
            ],
            headerText
        );

        module.targets = [
            {format: "bgra8unorm"},
            {format: "rgba16float"},
            {format: "rgba16float"},
            {format: "bgra8unorm"}
        ];
        
        return module;


    }
    
}