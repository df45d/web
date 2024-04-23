class GrassGBufferWrite {
    static async get(inputs) {
        var headerText = "";
        const module = await ShaderModule.create(
            inputs.device, "GrassGBufferWrite",
            "shaders/grassGBufferWrite/vert.wgsl",
            "shaders/grassGBufferWrite/frag.wgsl",
            4 * 3,
            [
             {
                shaderLocation: 0,
                offset: 0,
                format: 'float32x3',
             },
            ],
            headerText
        );
        
        return module;


    }
    
}