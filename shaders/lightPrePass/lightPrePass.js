class lightPrePass {
    static async get(inputs) {
        var headerText = "";
        const module = await ShaderModule.create(
            inputs.device, "lightPrepass",
            "shaders/lightPrePass/vert.wgsl",
            "shaders/lightPrePass/frag.wgsl",
            0,
            [],
            headerText
        );

        return module;


    }
    
}