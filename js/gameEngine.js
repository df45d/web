class gameEngine {
    async init() {
        this.fpsCounter = document.getElementById("fps");
        this.menu = document.getElementById("menu");
        this.normalMapping = document.getElementById("normalMapping");
        this.normalMapping.onchange = () => this.menuChange("normalMapping");

        this.resolution = document.getElementById("resolution");
        this.resolution.onchange = () => this.menuChange("resolution");

        this.textureFilter = document.getElementById("textureFilter");
        this.textureFilter.onchange = () => this.menuChange("textureFilter");

        this.stop = false;
        this.change = undefined;

        this.escapePressed = false;
        this.keyboard = new Keyboard();
        
        this.xDir = 0;
        this.yDir = 0;
        this.pos = new vec3(0, 0, -4);

        await this.initGPU();
        this.gameLoop();
    }

    async initDisplay() {
        let res = new vec2();
        let resolution = this.resolution.value;
        if (resolution == "1") {
            res.x = window.outerWidth;
            res.y = window.innerHeight;
        } else if (resolution == "2") {
            res.x = window.outerWidth * 2;
            res.y = window.innerHeight * 2;
        } else if (resolution == "1080") {
            res.x = 1920;
            res.y = 1080;
        } else if (resolution == "720") {
            res.x = 1280;
            res.y = 720;
        } else if (resolution == "480") {
            res.x = 854;
            res.y = 480;
        } else if (resolution == "360") {
            res.x = 640;
            res.y = 360;
        }

        await this.gpu.initCanvas({
            resolution: res,
        });
    }

    async initGPU() {
        this.gpu = WebGPU.create();
        await WebGPU.initGPU(this.gpu);
    }

    menuChange (change) {
        this.change = change;
        this.stop = true;
    }

    async handleSettingChange () {
       /* if (this.change == "normalMapping") {
            var floorShader = await defaultShader.get({
                normalMapping: this.normalMapping.value === 'true',
                device: this.gpu.device,
            });
            await this.gpu.createPipeline("Floor Pipeline", floorShader);
        } else if (this.change == "resolution") {
            this.initDisplay();
        } else if (this.change == "textureFilter") {
            await this.gpu.loadRenderPass({
                textureFilter: this.textureFilter.value
            });
        }
        this.change = undefined;
        this.stop = false;*/
        engine.gameLoop();
    }

    gameLoop() {
        this.fpsCounter.textContent = "FPS: " + String(Math.round(1000 / this.gpu.deltaTime));

        if (this.keyboard.keyPressed["Escape"] && !this.escapePressed) {
            this.escapePressed = true;  
            let display = this.menu.style.display;

            if (display == "none") {
                this.menu.style.display = "block";
            } else {
                this.menu.style.display = "none";
            }
        } 
        else if (!this.keyboard.keyPressed["Escape"]){
            this.escapePressed = false; 
        };
        
        // rotation
        if (this.keyboard.keyPressed["ArrowUp"]) {
            this.xDir += this.gpu.deltaTime / 15;
        };
        if (this.keyboard.keyPressed["ArrowDown"]) {
            this.xDir -= this.gpu.deltaTime / 15;
        };
        if (this.keyboard.keyPressed["ArrowLeft"]) {
            this.yDir -= this.gpu.deltaTime / 15;
        };
        if (this.keyboard.keyPressed["ArrowRight"]) {
            this.yDir += this.gpu.deltaTime / 15;
        };

        // movement
        let movement = new vec3(0, 0, 0);

        if (this.keyboard.keyPressed["w"]) {
            movement.z += this.gpu.deltaTime / 150;
        };
        if (this.keyboard.keyPressed["s"]) {
            movement.z -= this.gpu.deltaTime / 150;
        };
        if (this.keyboard.keyPressed["d"]) {
            movement.x += this.gpu.deltaTime / 150;
        };
        if (this.keyboard.keyPressed["a"]) {
            movement.x -= this.gpu.deltaTime / 150;
        };
        if (this.keyboard.keyPressed["r"]) {
            this.pos.y += this.gpu.deltaTime / 150;
        }
        if (this.keyboard.keyPressed["f"]) {
            this.pos.y -= this.gpu.deltaTime / 150;
        };

        movement.rotateY(this.yDir);
        this.pos = this.pos.add(movement);
        this.setCamPos(...this.pos.array);

        this.rotateCam(this.xDir, this.yDir, 0);
        
        this.gpu.render();    
        if (!this.stop) {
            requestAnimationFrame(() => this.gameLoop());
        } else {
            this.handleSettingChange();
        }
    }

    rotateCam(x, y) {
        this.gpu.rotationMatrix = mat4.createRotationMatrixXY(-x, y);
        this.gpu.invRotationMatrix = mat3.inverse(mat3.createRotationMatrixXY(-x, y));
        // this.gpu.rotationMatrix = mat4.lookAt(new vec3(0, 0, 0), this.pos);
        // this.gpu.invRotationMatrix = mat3.inverse(mat3.lookAt(new vec3(0, 0, 0), this.pos));
    }

    lookAt(pos) {
        this.gpu.rotationMatrix = mat4.lookAt(pos, this.pos);
        this.gpu.invRotationMatrix = mat3.inverse(mat3.lookAt(pos, this.pos));
    }

    setCamPos(x, y, z) {
        this.gpu.translationMatrix = mat4.createTranslationMatrix(-x, -y, -z);
    }
}