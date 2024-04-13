class postProcess {
    static async get(inputs) {
        var headerText = "";
        const module = await ShaderModule.create(
            inputs.device, "postProcess",
            "shaders/texturedQuad.vert.wgsl",
            "shaders/postProcess/frag.wgsl",
            0,
            [],
            headerText
        );

        return module;


    }
    
}