
class WebGPU {
    async #loadTexture(filePath) {
        var response = await fetch(filePath);
        const imageBitmap = await createImageBitmap(await response.blob());

        let texture = this.device.createTexture({
            size: [imageBitmap.width, imageBitmap.height, 1],
            format: "rgba8unorm",
            usage: GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT
        });

        this.device.queue.copyExternalImageToTexture(
            {source: imageBitmap},
            {texture: texture},
            [imageBitmap.width, imageBitmap.height],
        );

        return texture;
    }

    async #loadArrayTexture() {
        let texture = this.device.createTexture({
            size: [4096, 4096, 8],
            format: "rgba8unorm",
            usage: GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT
        });


        return texture;
    }

    async #loadTextureToArray(filePath, dst, index) {
        var response = await fetch(filePath);
        const imageBitmap = await createImageBitmap(await response.blob());

        this.device.queue.copyExternalImageToTexture(
            {source: imageBitmap},
            {texture: dst, origin: [0, 0, index]},
            [imageBitmap.width, imageBitmap.height],
        );
        // Please don't do this - Terrible Convensions 
        for (let x; x < imageBitmap.width / 4096; x++) {

        }
    }

    constructor() {
        this.pipeline = {};
    }

    static create() {
        return new WebGPU();
    }

    static async initGPU(pipeline) {
        await pipeline.fetchGPU();

        let res = new vec2(3200, 2000);        
        await pipeline.initCanvas({
            resolution: res,
        });

        let gBufferWriteShader = await gBufferWrite.get({
            normalMapping: true,
            device: pipeline.device,
        })

        await pipeline.gBufferWritePipeline(gBufferWriteShader);

        await pipeline.loadRenderPass({
            textureFilter: "linear",
        });

        let lightPrePassShader = await lightPrePass.get({
            device: pipeline.device,
        });

        await pipeline.lightPrePassPipeline(lightPrePassShader);

        var postProcessShader = await postProcess.get({
            device: pipeline.device,
        });

        await pipeline.postProcessPipeline(postProcessShader);

        var antiAliasingShader = await antiAliasing.get({
            device: pipeline.device,
        });

        await pipeline.antiAliasingPipeline(antiAliasingShader);

        let obj = await ObjLoader.create("assets/models/gun.obj");
        await pipeline.loadModel(obj.vertices , obj.vertexNumber);
        pipeline.setCameraMatrix();
    }

    async fetchGPU() {
        this.adapter = await navigator.gpu?.requestAdapter({
            powerPreference: 'high-performance',
        });
        this.device = await this.adapter?.requestDevice();

        const adapterInfo = await this.adapter.requestAdapterInfo();
        console.log(adapterInfo.vendor);

        if (!this.device) {
            alert("WebGPU isn't supported on your browser");
            console.error("WebGPU isn't supported on your browser");
            return null;
        }

    }

    async initCanvas(inputs) {
        this.canvas = document.getElementById("canvas");
        this.context = canvas.getContext("webgpu");
        this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();

        this.canvas.width = inputs.resolution.x; 
        this.canvas.height = inputs.resolution.y;

        var device = this.device;
        this.context.configure({
            device,
            format: this.canvasFormat
        });

        this.depthTexture = this.device.createTexture({
            size: [this.canvas.width, this.canvas.height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });

        this.gBufferTextureAlbedo = device.createTexture({
            size: [this.canvas.width, this.canvas.height],
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
            format: 'bgra8unorm',
        });

        this.gBufferTexturePosition = device.createTexture({
            size: [this.canvas.width, this.canvas.height],
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
            format: 'rgba16float',
        });

        this.gBufferTextureNormal = device.createTexture({
            size: [this.canvas.width, this.canvas.height],
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
            format: 'rgba16float',
        });

        this.gBufferTextureProperties = device.createTexture({
            size: [this.canvas.width, this.canvas.height],
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
            format: 'rgba16float',
        });

        this.lightPrePassBuffer = device.createTexture({
            size: [this.canvas.width, this.canvas.height],
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
            format: 'bgra8unorm',
        });

        this.postProcessBuffer = device.createTexture({
            size: [this.canvas.width, this.canvas.height],
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
            format: 'bgra8unorm',
        });
    }

    async loadRenderPass(inputs) {
        this.gBufferPass = {
            label: "gBufferPass",
            colorAttachments: [
                {
                    view: this.gBufferTextureAlbedo.createView(),
                    clearValue: [0, 0, 0, 0],
                    loadOp: "clear",
                    storeOp: "store"
                },
                {
                    view: this.gBufferTexturePosition.createView(),
                    clearValue: [0, 0, 0, 0],
                    loadOp: "clear",
                    storeOp: "store"
                },
                {
                    view: this.gBufferTextureNormal.createView(),
                    clearValue: [0, 0, 0, 0],
                    loadOp: "clear",
                    storeOp: "store"
                },
                {
                    view: this.gBufferTextureProperties.createView(),
                    clearValue: [0, 0, 0, 0],
                    loadOp: "clear",
                    storeOp: "store"
                }    
            ],

            depthStencilAttachment: {
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
        };

        this.lightPrePass = {
            label: "Light Prepass",
            colorAttachments: [
                {
                    view: this.lightPrePassBuffer.createView(),
                    clearValue: [0, 0, 0, 0],
                    loadOp: "clear",
                    storeOp: "store"
                }  
            ]
        };  
        
        this.postProcessPass = {
            label: "post Process",
            colorAttachments: [
                {
                    view: this.postProcessBuffer.createView(),
                    clearValue: [0, 0, 0, 0],
                    loadOp: "clear",
                    storeOp: "store"
                }  
            ]
        };  

        this.antiAliasingPass = {
            label: "AntiAliasing",
            colorAttachments: [
                {
                    clearValue: [0, 0, 0, 0],
                    loadOp: "clear",
                    storeOp: "store"
                }  
            ]
        }; 

        this.sampler = this.device.createSampler({
            magFilter: inputs.textureFilter,
            minFilter: inputs.textureFilter,
            addressModeU: 'repeat',
            addressModeV: 'repeat',
        });
    }

    async lightPrePassPipeline(shaderModule) {
        this.gBufferTexturesBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {sampleType: 'unfilterable-float'},
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {sampleType: 'unfilterable-float'},
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {sampleType: 'unfilterable-float'},
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {sampleType: 'unfilterable-float'},
                }
            ]
        });

        this.lightDataBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
                    buffer: {type: 'uniform'},
                },
            ]
        });

        let pipeline = this.device.createRenderPipeline({
            label: "lightPrePass",
            layout: this.device.createPipelineLayout({
                bindGroupLayouts: [
                    this.matrixBindGroupLayout,
                    this.gBufferTexturesBindGroupLayout,
                    this.lightDataBindGroupLayout
                ],
            }),
            vertex: {
                module: shaderModule.module, 
                entryPoint: "vs",
            },
            fragment: {
                module: shaderModule.module,
                entryPoint: "fs",
                targets: [{format: this.canvasFormat}]
            },
        });

        this.pipeline["lightPrePass"] = pipeline;
    }

    async gBufferWritePipeline(shaderModule) {
        this.matrixBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
                    buffer: {
                        type: 'uniform',
                    }
                }
            ]
        });

        this.textureBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {},
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: { viewDimension: '2d-array' }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {},
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {},
                },
                {
                    binding: 4,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {},
                },
                {
                    binding: 5,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {},
                },
            ]
        });

        let pipeline = this.device.createRenderPipeline({
            label: "gBufferWrite",
            layout: this.device.createPipelineLayout({
                bindGroupLayouts: [
                    this.matrixBindGroupLayout,
                    this.textureBindGroupLayout,
                ],
            }),
            vertex: {
                module: shaderModule.module, 
                entryPoint: "vs",
                buffers: [{
                      arrayStride: shaderModule.arrayStride,
                      attributes: shaderModule.attributes
                }]
            },
            fragment: {
                module: shaderModule.module,
                entryPoint: "fs",
                targets: [
                    {format: "bgra8unorm"},
                    {format: "rgba16float"},
                    {format: "rgba16float"},
                    {format: "rgba16float"}
                ]
            },
            primitive: {
                topology: "triangle-list",
                cullMode: "none",
            },

            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth24plus',
            }
        });

        this.pipeline["gBufferWrite"] = pipeline;
    }

    async postProcessPipeline(shaderModule) {
        this.postProcessBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {sampleType: 'unfilterable-float'},
                }
            ]
        });

        let pipeline = this.device.createRenderPipeline({
            label: "postProcess",
            layout: this.device.createPipelineLayout({
                bindGroupLayouts: [
                    this.postProcessBindGroupLayout,
                ],
            }),
            vertex: {
                module: shaderModule.module, 
                entryPoint: "vs",
            },
            fragment: {
                module: shaderModule.module,
                entryPoint: "fs",
                targets: [{format: "bgra8unorm"}]
            }
        });

        this.pipeline["postProcess"] = pipeline;
    }

    async antiAliasingPipeline(shaderModule) {
        let pipeline = this.device.createRenderPipeline({
            label: "antiAliasing",
            layout: this.device.createPipelineLayout({
                bindGroupLayouts: [
                    this.postProcessBindGroupLayout,
                ],
            }),
            vertex: {
                module: shaderModule.module, 
                entryPoint: "vs",
            },
            fragment: {
                module: shaderModule.module,
                entryPoint: "fs",
                targets: [{format: this.canvasFormat}]
            }
        });

        this.pipeline["antiAliasing"] = pipeline;
    }

    setUniformBuffer() {
        this.device.queue.writeBuffer(
            this.uniformBuffer, 
            0,
            this.perspectiveMatrix.buffer
        );

        this.device.queue.writeBuffer(
            this.uniformBuffer, 
            64,
            this.translationMatrix.buffer
        );
        
        this.device.queue.writeBuffer(
            this.uniformBuffer, 
            128,
            this.rotationMatrix.buffer
        );

        this.device.queue.writeBuffer(
            this.uniformBuffer, 
            192,
            this.invRotationMatrix.buffer
        );
    }

    render() {
        let canvasTexture = this.context.getCurrentTexture();

        this.antiAliasingPass.colorAttachments[0].view = canvasTexture.createView();
        this.gBufferPass.depthStencilAttachment.view = this.depthTexture.createView();

        this.device.queue.writeBuffer(
            this.lightBuffer, 
            0,
            new Float32Array([0, 0, 1, 1, 1, 1, 1, 1]).buffer
        );

        this.setUniformBuffer(); 

        const encoder = this.device.createCommandEncoder({label: "Encoder"});


        // gBufferPrepass
        const gBufferPass = encoder.beginRenderPass(this.gBufferPass);

        gBufferPass.setPipeline(this.pipeline["gBufferWrite"]);
        gBufferPass.setVertexBuffer(0, this.vertexBuffer);
        gBufferPass.setBindGroup(0, this.uniformBindGroup);
        gBufferPass.setBindGroup(1, this.textureBindGroup);
        gBufferPass.draw(this.vertexBufferLength);
        gBufferPass.end();

        // Light Prepass
        const lightPrePass = encoder.beginRenderPass(this.lightPrePass);

        lightPrePass.setPipeline(this.pipeline["lightPrePass"]);
        lightPrePass.setBindGroup(0, this.uniformBindGroup);
        lightPrePass.setBindGroup(1, this.gBufferBindGroup);
        lightPrePass.setBindGroup(2, this.lightDataBindGroup);
        lightPrePass.draw(6);
        lightPrePass.end();

        // Post Process
        const postProcessPass = encoder.beginRenderPass(this.postProcessPass);
        
        postProcessPass.setPipeline(this.pipeline["postProcess"]);
        postProcessPass.setBindGroup(0, this.postProcessBindGroup);
        postProcessPass.draw(6);
        postProcessPass.end();

        // Anti Aliasing
        const antiAliasingPass = encoder.beginRenderPass(this.antiAliasingPass);
        antiAliasingPass.setPipeline(this.pipeline["antiAliasing"]);
        antiAliasingPass.setBindGroup(0, this.antiAliasingBindGroup);
        antiAliasingPass.draw(6);
        antiAliasingPass.end();

        
        const commandBuffer = encoder.finish();
        this.device.queue.submit([commandBuffer]);

        this.deltaTime = (Date.now() - this.prevTime);
        this.prevTime = Date.now();         
    }

    async loadModel(vertexArray, vertices) {
        this.vertexBuffer = this.device.createBuffer({
            size: vertexArray.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true,
        });
        this.vertexBufferLength = vertices;
        
        new Float32Array(this.vertexBuffer.getMappedRange()).set(vertexArray);
        this.vertexBuffer.unmap();

        let name = "gun2";
        this.texture = await this.#loadArrayTexture();
        await this.#loadTextureToArray(`assets/${name}/albedo.png`, this.texture, 0);
        //await this.#loadTextureToArray(`assets/rough/albedo.png`, this.texture, 1);


        this.normalMap = await this.#loadTexture(`assets/${name}/normal.png`);
        this.ao = await this.#loadTexture(`assets/${name}/ao.png`);
        this.metallicMap = await this.#loadTexture(`assets/${name}/metallic.png`);
        this.roughnessMap = await this.#loadTexture(`assets/${name}/roughness.png`);

    }


    setCameraMatrix(near, far) {
        this.perspectiveMatrix = mat4.createPerspectiveMatrix(this.canvas.width / this.canvas.height, 0.1, 64);
        this.translationMatrix = mat4.createTranslationMatrix(0, 0, 2);
        this.rotationMatrix;
        this.invRotationMatrix;

        this.uniformBuffer = this.device.createBuffer({
            size: 64 * 3 + 48,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST 
        });

        this.lightBuffer = this.device.createBuffer({
            size: 48,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST 
        });

        this.uniformBindGroup = this.device.createBindGroup({
            layout: this.matrixBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.uniformBuffer,
                    },
                    
                },   
            ]
        });

        this.textureBindGroup = this.device.createBindGroup({
            layout: this.pipeline["gBufferWrite"].getBindGroupLayout(1),
            entries: [
                {
                    binding: 0,
                    resource: this.sampler,
                },
                {
                    binding: 1,
                    resource: this.texture.createView(),
                },
                {
                    binding: 2,
                    resource: this.normalMap.createView(),
                },
                {
                    binding: 3,
                    resource: this.ao.createView(),
                },
                {
                    binding: 4,
                    resource: this.roughnessMap.createView(),
                },
                {
                    binding: 5,
                    resource: this.metallicMap.createView(),
                },

            ]
        });

        this.gBufferBindGroup = this.device.createBindGroup({
            layout: this.gBufferTexturesBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: this.gBufferTextureAlbedo.createView(),
                },
                {
                    binding: 1,
                    resource: this.gBufferTexturePosition.createView(),
                },
                {
                    binding: 2,
                    resource: this.gBufferTextureNormal.createView(),
                },
                {
                    binding: 3,
                    resource: this.gBufferTextureProperties.createView(),
                },

            ]
        });

    
        this.lightDataBindGroup = this.device.createBindGroup({
            layout: this.lightDataBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {buffer: this.lightBuffer},
                }
            ]
        });

        this.postProcessBindGroup = this.device.createBindGroup({
            layout: this.postProcessBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: this.lightPrePassBuffer.createView(),
                }
            ]
        });

        this.antiAliasingBindGroup = this.device.createBindGroup({
            layout: this.postProcessBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: this.postProcessBuffer.createView(),
                }
            ]
        });
    }
}
