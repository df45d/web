class antiAliasing {
    static async get(inputs) {
        var headerText = "";
        const module = await ShaderModule.create(
            inputs.device, "postProcess",
            "shaders/texturedQuad.vert.wgsl",
            "shaders/antiAliasing/frag.wgsl",
            0,
            [],
            headerText
        );

        return module;


    }
    
}