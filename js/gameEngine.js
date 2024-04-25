class gameEngine {
    async init() {
        this.fpsCounter = document.getElementById("FPS");
        this.fpsList = Array(100);

        this.menu = document.getElementById("menu");
        this.title = document.getElementById("TITLE");

        this.normalMapping = document.getElementById("NORMAL MAPPING");
        this.normalMapping.onchange = () => this.menuChange("normalMapping");

        this.resolution = document.getElementById("DISPLAY RESOLUTION");
        this.resolution.onchange = () => this.menuChange("resolution");

        this.hdr = document.getElementById("HDR");
        this.hdr.onchange = () => this.menuChange("HDR");

        this.aliasing = document.getElementById("ANTI-ALIASING");
        this.aliasing.onchange = () => this.menuChange("aliasing");

        this.stop = false;
        this.change = undefined;

        this.escapePressed = false;
        this.keyboard = new Keyboard();
        
        this.xDir = 0;
        this.yDir = 0;
        this.pos = new vec3(0, 0, -42);

        this.screen = "intro";
        this.movement =new vec3(0, 1, -10);

        await this.initDisplay();
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
        if (!res.x) {
            res.x = window.outerWidth;;
            res.y = window.innerHeight;
        }


        let grass = this.hdr.value;
        if (!grass) {
            grass = 7
        }
        grass = parseFloat(grass);

        let fxaaO = this.aliasing.value;
        if (!this.aliasing) {
            fxaaO = "fxaa"
        }

        await this.initGPU({
            res,
            fxaa: fxaaO,
            grass: grass,
        });

        /*await this.gpu.loadRenderPass({
            textureFilter: "linear",
        });*/
    }

    async initGPU(inputs) {
        this.gpu = WebGPU.create();
        await WebGPU.initGPU(this.gpu, inputs);
    }

    menuChange (change) {
        this.change = change;
        this.stop = true;
    }

    async handleSettingChange () {
        console.log(this.change)
        if (this.change == "resolution" || this.change == "HDR")
        {
            await this.initDisplay();
        } 

        this.change = undefined;
        this.stop = false;
        engine.gameLoop();
    }

    rotate(vector, rotation) {
        let sinVal = Math.sin(rotation);
        let cosVal = Math.cos(rotation);
        return new vec3(vector.x * cosVal + vector.z * sinVal, vector.y, -vector.x * sinVal + vector.z * cosVal);
    }

    gameLoop() {
        this.fpsList.splice(0, 0, Math.round(1000 / this.gpu.deltaTime)); 
        this.fpsList.splice(this.fpsList.length-1, 1); 
        let average = Math.round(this.fpsList.reduce((a, b) => a + b, 0) / this.fpsList.length);

        this.fpsCounter.textContent = "FPS: " + String(average);        
        
        if (this.title.value == "game") {
            // movement

            if (this.keyboard.keyPressed["a"]) {
                this.movement.x += this.gpu.deltaTime / 1500;
            }
            else if (this.keyboard.keyPressed["d"]) {
                this.movement.x -= this.gpu.deltaTime / 1500;
            }
            else if (!this.keyboard.keyPressed["l"]){
                this.movement.x += this.gpu.deltaTime / 5000;
            }
            if (this.keyboard.keyPressed[" "]) {
                this.movement.y += this.gpu.deltaTime / 100;
            } else if (this.movement.y > 1) {
                this.movement.y -= this.gpu.deltaTime / 1000;
            }
            if (this.keyboard.keyPressed["w"]) {
                if (this.movement.z < -1) {
                    this.movement.z += this.gpu.deltaTime / 500;
                }
            } else if (this.keyboard.keyPressed["s"]) {
                this.movement.z -= this.gpu.deltaTime / 500;
            }
            if (!this.gpu.deltaTime) {
                this.movement = new vec3(0, 1, -10);
            }

            let pivot = new vec3(0, this.movement.y, -this.movement.z);

            this.pos = this.rotate(pivot, (this.movement.x) % (Math.PI * 2)).add(new vec3(0, 0, -38));
            
            this.lookAt(new vec3(0, 1, -38));
            this.setCamPos(...this.pos.array);
            

        } else {
            this.rotateCam(this.xDir, this.yDir, 0);
            this.setCamPos(...this.pos.array);
            if (this.pos.y < 1) {
                if (this.gpu.deltaTime) {
                    this.pos.y += this.gpu.deltaTime * 0.001;
                    this.pos.y = Math.min(this.pos.y, 1);
                } 
            }
        }
        
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