class lightPrePass {
    static async get(inputs) {
        var headerText = "";
        const module = await ShaderModule.create(
            inputs.device, "lightPrepass",
            "shaders/texturedQuad.vert.wgsl",
            "shaders/lightPrePass/frag.wgsl",
            0,
            [],
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