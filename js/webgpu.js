
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
                size: [2048, 2048, 2],
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
        }

        constructor() {
            this.pipeline = {};
        }

        static create() {
            return new WebGPU();
        }

        static async initGPU(pipeline, inputs) {
            this.fxaa = inputs.fxaa;
            this.grass = inputs.grass;


            await pipeline.fetchGPU();

      
            await pipeline.initCanvas({
                resolution: inputs.res,
            });

            let gBufferWriteShader = await gBufferWrite.get({
                normalMapping: true,
                device: pipeline.device,
            })

            await pipeline.gBufferWritePipeline(gBufferWriteShader);

            let grassShader = await GrassGBufferWrite.get({
                device: pipeline.device,
            })

            await pipeline.grassPipeline(grassShader);

            await pipeline.loadRenderPass({
                textureFilter: "linear",
            });

            let lightPrePassShader = await lightPrePass.get({
                device: pipeline.device,
            });

            await pipeline.lightPrePassPipeline(lightPrePassShader);

            let skyboxPipelineShader = await skyBoxShader.get({
                device: pipeline.device,
            });

            await pipeline.skyboxPipeline(skyboxPipelineShader);

            var postProcessShader = await postProcess.get({
                device: pipeline.device,
            });

            await pipeline.postProcessPipeline(postProcessShader);

            var antiAliasingShader = await antiAliasing.get({
                device: pipeline.device,
            });

            await pipeline.antiAliasingPipeline(antiAliasingShader);

            var obj = await ObjLoader.create("assets/models/sword.obj");
            await pipeline.loadModel(obj.vertices , obj.vertexNumber);

            let grass = getGrassBlade(inputs.grass);
            await pipeline.loadGrassModel(grass.vertexArray, grass.vertices);

            obj = await ObjLoader.create("assets/models/skybox.obj", true);
            await pipeline.loadSkyBoxModel(obj.vertices, obj.vertexNumber);

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

            this.grassPass = {
                label: "Grass",
                colorAttachments: [
                    {
                        view: this.gBufferTextureAlbedo.createView(),
                        loadOp: "load",
                        storeOp: "store"
                    },
                    {
                        view: this.gBufferTexturePosition.createView(),
                        loadOp: "load",
                        storeOp: "store"
                    },
                    {
                        view: this.gBufferTextureNormal.createView(),
                        loadOp: "load",
                        storeOp: "store"
                    },
                    {
                        view: this.gBufferTextureProperties.createView(),
                        loadOp: "load",
                        storeOp: "store"
                    }    
                ],
                depthStencilAttachment: {
                    depthLoadOp: 'load',
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

            this.skyboxPass = {
                label: "Sky Box",
                colorAttachments: [
                    {
                        view: this.lightPrePassBuffer.createView(),
                        loadOp: "load",
                        storeOp: "store"
                    }  
                ],
                depthStencilAttachment: {
                    depthLoadOp: 'load',
                    depthStoreOp: 'store',
                },
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

        async grassPipeline(shaderModule) {
            this.noise = await this.#loadTexture(`assets/noise.png`);
            this.grassBindGroupLayout = this.device.createBindGroupLayout({
                entries: [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.VERTEX,
                        buffer: {
                            type: 'read-only-storage',
                        }
                    },
                    {
                        binding: 1,
                        visibility: GPUShaderStage.VERTEX,
                        sampler: {},
                    },
                    {
                        binding: 2,
                        visibility: GPUShaderStage.VERTEX,
                        texture: {}
                    },
                    {
                        binding: 3,
                        visibility: GPUShaderStage.VERTEX,
                        buffer: {
                            type: 'uniform',
                        }
                    },
                ]
            });
            let pipeline = this.device.createRenderPipeline({
                label: "grassPipeline",
                layout: this.device.createPipelineLayout({
                    bindGroupLayouts: [
                        this.matrixBindGroupLayout,
                        this.grassBindGroupLayout
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

            this.pipeline["grassPipeline"] = pipeline;
        }

        async skyboxPipeline(shaderModule) {
            let pipeline = this.device.createRenderPipeline({
                label: "skybox",
                layout: this.device.createPipelineLayout({
                    bindGroupLayouts: [
                        this.matrixBindGroupLayout,
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
                    targets: [{format: "bgra8unorm"}]
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

            this.pipeline["skybox"] = pipeline;
        }

        async postProcessPipeline(shaderModule) {
            this.timeStamp = Date.now();
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
            this.deltaTime = (Date.now() - this.prevTime);
            this.prevTime = Date.now();  
            let canvasTexture = this.context.getCurrentTexture();

            this.antiAliasingPass.colorAttachments[0].view = canvasTexture.createView();
            this.gBufferPass.depthStencilAttachment.view = this.depthTexture.createView();
            this.grassPass.depthStencilAttachment.view = this.depthTexture.createView();
            this.skyboxPass.depthStencilAttachment.view = this.depthTexture.createView();

            this.device.queue.writeBuffer(
                this.lightBuffer, 
                0,
                new Float32Array([0, -1, 0, 1, 1, 1, 1, 1]).buffer
            );
            this.device.queue.writeBuffer(
                this.delta, 
                0,
                new Float32Array([(Date.now()-this.timeStamp)/1000]).buffer
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

            // Grass
            const grassPass = encoder.beginRenderPass(this.grassPass);
            grassPass.setPipeline(this.pipeline["grassPipeline"]);
            grassPass.setBindGroup(0, this.uniformBindGroup);
            grassPass.setBindGroup(1, this.grassBindGroup);
            grassPass.setVertexBuffer(0, this.grassVertexBuffer);
            grassPass.draw(this.grassVertexBufferLength, this.grassData.length, 0, 0);
            grassPass.end();

            // Light Prepass
            const lightPrePass = encoder.beginRenderPass(this.lightPrePass);
            lightPrePass.setPipeline(this.pipeline["lightPrePass"]);
            lightPrePass.setBindGroup(0, this.uniformBindGroup);
            lightPrePass.setBindGroup(1, this.gBufferBindGroup);
            lightPrePass.setBindGroup(2, this.lightDataBindGroup);
            lightPrePass.draw(6);
            lightPrePass.end();

            
            const skyboxPass = encoder.beginRenderPass(this.skyboxPass);
            skyboxPass.setPipeline(this.pipeline["skybox"]);
            skyboxPass.setBindGroup(0, this.uniformBindGroup);
            skyboxPass.setVertexBuffer(0, this.skyboxVertexBuffer);
            skyboxPass.draw(36);
            skyboxPass.end();


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

            let name = "sword";
            this.texture = await this.#loadArrayTexture();
            await this.#loadTextureToArray(`assets/${name}/albedo.jpeg`, this.texture, 0);
            //await this.#loadTextureToArray(`assets/rough/albedo.png`, this.texture, 1);


            this.normalMap = await this.#loadTexture(`assets/${name}/normal.png`);
            this.ao = await this.#loadTexture(`assets/${name}/ao.png`);
            this.metallicMap = await this.#loadTexture(`assets/${name}/metallic.png`);
            this.roughnessMap = await this.#loadTexture(`assets/${name}/roughness.png`);
            
        }

        async loadSkyBoxModel(vertexArray, vertices) {
            this.skyboxVertexBuffer = this.device.createBuffer({
                size: vertexArray.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true,
            });
            this.skyboxVertexBufferLength = vertices;
            
            new Float32Array(this.skyboxVertexBuffer.getMappedRange()).set(vertexArray);
            this.skyboxVertexBuffer.unmap();
        }

        async loadGrassModel(vertexArray, vertices) {
            this.grassVertexBuffer = this.device.createBuffer({
                size: vertexArray.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true,
            });
            this.grassVertexBufferLength = vertices;
            
            new Float32Array(this.grassVertexBuffer.getMappedRange()).set(vertexArray);
            this.grassVertexBuffer.unmap();
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

            this.delta = this.device.createBuffer({
                size: 48,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST 
            });

            this.grassData = loadGrassData();

            this.grassBuffer = this.device.createBuffer({
                size: this.grassData.length * 5 * 4,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true,
            });

            new Float32Array(this.grassBuffer.getMappedRange()).set(this.grassData.array);
            this.grassBuffer.unmap();


            this.uniformBindGroup = this.device.createBindGroup({
                label: 'uniformBindGroup',
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
            
            
            this.grassBindGroup = this.device.createBindGroup({
                layout: this.grassBindGroupLayout,
                entries: [
                    {
                        binding: 0,
                        resource: {buffer: this.grassBuffer},
                    },
                    {
                        binding: 1,
                        resource: this.sampler,
                    },
                    {
                        binding: 2,
                        resource: this.noise.createView(),
                    },
                    {
                        binding: 3,
                        resource: {buffer: this.delta},
                    }
                ]
            });
        }
    }
