class skyBoxShader {
    static async get(inputs) {
        var headerText = "";
        const module = await ShaderModule.create(
            inputs.device, "Skybox Shader",
            "shaders/skyBox/vert.wgsl",
            "shaders/skyBox/frag.wgsl",
            2*(4 * 3),
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
            ],
            headerText
        );
        

        return module;
    }   
}