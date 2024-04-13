/* Basic Vector Math */

class vec4 {
    constructor(x, y, z, w) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    add(vec) {
        this.x += vec.x;
        this.y += vec.y;
        this.z += vec.z;
        this.w += vec.w;
    }

    get array() {
        return [this.x, this.y, this.z, this.w];
    }
}

class vec3 {
    constructor(x, y, z) {
        this.x = parseFloat(x);
        this.y = parseFloat(y);
        this.z = parseFloat(z);
    }

    add(vec) {
        let vec0 = new vec3(...this.array);
        vec0.x += vec.x;
        vec0.y += vec.y;
        vec0.z += vec.z;
        return vec0;
    }

    sub(vec) {
        let vec0 = new vec3(...this.array);
        vec0.x -= vec.x;
        vec0.y -= vec.y;
        vec0.z -= vec.z;
        return vec0;
    }

    div(int) {
        let vec0 = new vec3(...this.array);
        vec0.x /= int;
        vec0.y /= int;
        vec0.z /= int
        return vec0;
    }

    static cross(a, b) {
        let dst = new vec3();
     
        const t0 = a.y * b.z - a.z * b.y;
        const t1 = a.z * b.x - a.x * b.z;
        const t2 = a.x * b.y - a.y * b.x;
     
        dst.x = t0;
        dst.y = t1;
        dst.z = t2;
     
        return dst;
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    static normalize(v) {
        let dst = new vec3();
        
        let length = v.length();
        // make sure we don't divide by 0.
        if (length > 0.00001) {
            dst.x = v.x / length;
            dst.y = v.y / length;
            dst.z = v.z / length;
        } else {
            dst.x = 0;
            dst.y = 0;
            dst.z = 0;
        }

        return dst;
    }
    
    rotateY(angle) {
        let rCos = Math.cos(angle * (Math.PI / 180));
        let rSin = Math.sin(angle * (Math.PI / 180));

        let x = this.x;
        let z = this.z;

        this.x = (x * rCos) + (z * rSin);
        this.z = (-x * rSin) + (z * rCos);
    }

    get array() {
        return [this.x, this.y, this.z];
    }
}

class vec2 {
    constructor(x, y) {
        this.x = parseFloat(x);
        this.y = parseFloat(y);
    }

    add(vec) {
        let vec0 = new vec2(...this.array);
        vec0.x += vec.x;
        vec0.y += vec.y;
        return vec0;
    }

    sub(vec) {
        let vec0 = new vec2(...this.array);
        vec0.x -= vec.x;
        vec0.y -= vec.y;
        return vec0;
    }

    get array() {
        return [this.x, this.y];
    }
}