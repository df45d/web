class ShaderModule {
    static async #loadShader(filePath) {
        const d = await fetch(filePath);
        return await d.text();
    }
    
    static async #buildShaders(vertex, fragment) {
        const vertText = await ShaderModule.#loadShader(vertex);
        const fragText = await ShaderModule.#loadShader(fragment);
        return `${vertText}\n${fragText}`;
    }

    static async create(device, name, vertex, fragment, arrayStride, attributes, header) {
        let shaderModule = new ShaderModule();

        shaderModule.arrayStride = arrayStride;
        shaderModule.attributes = attributes;

        const defaultShaders = await ShaderModule.#buildShaders(vertex, fragment) + header;

        shaderModule.module = device.createShaderModule({
            label: `${name}'s shader`,
            code: defaultShaders
        });

        return shaderModule;
    }
}