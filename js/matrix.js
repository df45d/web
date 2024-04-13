/* HardCoded Matrix Math */
class mat3 {
    constructor (
        a11, a12, a13,
        a21, a22, a23, 
        a31, a32, a33, 
    ) {
        this.a11 = a11; this.a12 = a12; this.a13 = a13;
        this.a21 = a21; this.a22 = a22; this.a23 = a23;
        this.a31 = a31; this.a32 = a32; this.a33 = a33;
    }

    get buffer() {
        var array = [this.a11, this.a12, this.a13, 0,
                     this.a21, this.a22, this.a23, 0,
                     this.a31, this.a32, this.a33];
        return new Float32Array(array);        
    }

    static inverse(m) {
        let det = m.a11 * (m.a22 * m.a33 - m.a23 * m.a32) -
                  m.a12 * (m.a21 * m.a33 - m.a23 * m.a31) +
                  m.a13 * (m.a21 * m.a32 - m.a22 * m.a31);

        if (det === 0) {
            return null; // Matrix is not invertible
        }

        let invDet = 1 / det;

        return new mat3(
            invDet * (m.a22 * m.a33 - m.a23 * m.a32),
            invDet * (m.a13 * m.a32 - m.a12 * m.a33),
            invDet * (m.a12 * m.a23 - m.a13 * m.a22),

            invDet * (m.a23 * m.a31 - m.a21 * m.a33),
            invDet * (m.a11 * m.a33 - m.a13 * m.a31),
            invDet * (m.a13 * m.a21 - m.a11 * m.a23),

            invDet * (m.a21 * m.a32 - m.a22 * m.a31),
            invDet * (m.a12 * m.a31 - m.a11 * m.a32),
            invDet * (m.a11 * m.a22 - m.a12 * m.a21)
        );
    }

    static lookAt(eye, target) {
        let dst = new Float32Array(9);
        let up = new vec3(0, 1, 0);
     
        const zAxis = vec3.normalize(eye.sub(target));
        const xAxis = vec3.normalize(vec3.cross(up, zAxis));
        const yAxis = vec3.normalize(vec3.cross(zAxis, xAxis));
     
        dst[0] = xAxis.x;  dst[1] = xAxis.y;  dst[2] = xAxis.z; 
        dst[3] = yAxis.x;  dst[4] = yAxis.y;  dst[5] = yAxis.z; 
        dst[6] = zAxis.x;  dst[7] = zAxis.y;  dst[8] = zAxis.z;
        return (new mat3(...dst));
    }

    static createRotationMatrixXY(x, y) {
        let rCosX = Math.cos(x * (Math.PI / 180));
        let rSinX = Math.sin(x * (Math.PI / 180));
    
        let rCosY = Math.cos(y * (Math.PI / 180));
        let rSinY = Math.sin(y * (Math.PI / 180));
    
        // No roll (z) component used in the matrix calculation
    
        return new mat3(
            rCosY, 0, -rSinY,
            rSinX * rSinY, rCosX, rSinX * rCosY, 
            rCosX * rSinY, -rSinX, rCosX * rCosY,
        );
    }
}


class mat4 {   
    constructor (
        a11, a12, a13, a14,
        a21, a22, a23, a24,
        a31, a32, a33, a34,
        a41, a42, a43, a44
    ) {
        this.a11 = a11;
        this.a12 = a12;
        this.a13 = a13;
        this.a14 = a14;
        this.a21 = a21;
        this.a22 = a22;
        this.a23 = a23;
        this.a24 = a24;                   
        this.a31 = a31;
        this.a32 = a32;
        this.a33 = a33;
        this.a34 = a34;
        this.a41 = a41;
        this.a42 = a42;
        this.a43 = a43;
        this.a44 = a44;

        this.byteLength = 4 * 9;
    }

    get buffer() {
        var array = [this.a11, this.a12, this.a13, this.a14,
                     this.a21, this.a22, this.a23, this.a24,
                     this.a31, this.a32, this.a33, this.a34,
                     this.a41, this.a42, this.a43, this.a44];

        return new Float32Array(array);        
    }

    static create() {
        return new mat4();
    }

    static createViewMatrix() {
        return;
    }

    static createRotationMatrixXY(x, y) {
        let rCosX = Math.cos(x * (Math.PI / 180));
        let rSinX = Math.sin(x * (Math.PI / 180));
    
        let rCosY = Math.cos(y * (Math.PI / 180));
        let rSinY = Math.sin(y * (Math.PI / 180));
    
        // No roll (z) component used in the matrix calculation
    
        return new mat4(
            rCosY, 0, -rSinY, 0,
            rSinX * rSinY, rCosX, rSinX * rCosY, 0,
            rCosX * rSinY, -rSinX, rCosX * rCosY, 0,
            0, 0, 0, 1,
        );
    }

    static createTranslationMatrix(x, y, z) {
        return new mat4(
            1, 0, 0, x,
            0, 1, 0, y,
            0, 0, -1, z,
            0, 0, 0, 1,
        );
    }

    static createPerspectiveMatrix(aspect_ratio, near, far) {
        return new mat4(
            1 / aspect_ratio, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1 / (far - near), -near / (far - near),
            0, 0, 1, 0
        );
    }

    static lookAt(eye, target) {
        let dst = new Float32Array(16);
        let up = new vec3(0, 1, 0);
     
        const zAxis = vec3.normalize(eye.sub(target));
        const xAxis = vec3.normalize(vec3.cross(up, zAxis));
        const yAxis = vec3.normalize(vec3.cross(zAxis, xAxis));
     
        dst[ 0] = xAxis.x;  dst[ 1] = xAxis.y;  dst[ 2] = xAxis.z;  dst[ 3] = 0;
        dst[ 4] = yAxis.x;  dst[ 5] = yAxis.y;  dst[ 6] = yAxis.z;  dst[ 7] = 0;
        dst[ 8] = zAxis.x;  dst[ 9] = zAxis.y;  dst[10] = zAxis.z;  dst[11] = 0;
        dst[12] = 0;    dst[13] = 0;    dst[14] = 0;    dst[15] = 1;
     
        return (new mat4(...dst));
    }

    static inverse(m) {
        // inverse matrix credit to webgpufundamentals.com

        let dst = new Float32Array(16);
    
        const m00 = m.a11;
        const m01 = m.a12;
        const m02 = m.a13;
        const m03 = m.a14;
        const m10 = m.a21;
        const m11 = m.a22;
        const m12 = m.a23;
        const m13 = m.a24;
        const m20 = m.a31;
        const m21 = m.a32;
        const m22 = m.a33;
        const m23 = m.a34;
        const m30 = m.a41;
        const m31 = m.a42;
        const m32 = m.a43;
        const m33 = m.a44;
    
        const tmp0 = m22 * m33;
        const tmp1 = m32 * m23;
        const tmp2 = m12 * m33;
        const tmp3 = m32 * m13;
        const tmp4 = m12 * m23;
        const tmp5 = m22 * m13;
        const tmp6 = m02 * m33;
        const tmp7 = m32 * m03;
        const tmp8 = m02 * m23;
        const tmp9 = m22 * m03;
        const tmp10 = m02 * m13;
        const tmp11 = m12 * m03;
        const tmp12 = m20 * m31;
        const tmp13 = m30 * m21;
        const tmp14 = m10 * m31;
        const tmp15 = m30 * m11;
        const tmp16 = m10 * m21;
        const tmp17 = m20 * m11;
        const tmp18 = m00 * m31;
        const tmp19 = m30 * m01;
        const tmp20 = m00 * m21;
        const tmp21 = m20 * m01;
        const tmp22 = m00 * m11;
        const tmp23 = m10 * m01;
    
        const t0 = (tmp0 * m11 + tmp3 * m21 + tmp4 * m31) -
                   (tmp1 * m11 + tmp2 * m21 + tmp5 * m31);
        const t1 = (tmp1 * m01 + tmp6 * m21 + tmp9 * m31) -
                   (tmp0 * m01 + tmp7 * m21 + tmp8 * m31);
        const t2 = (tmp2 * m01 + tmp7 * m11 + tmp10 * m31) -
                   (tmp3 * m01 + tmp6 * m11 + tmp11 * m31);
        const t3 = (tmp5 * m01 + tmp8 * m11 + tmp11 * m21) -
                   (tmp4 * m01 + tmp9 * m11 + tmp10 * m21);
    
        const d = 1 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);
    
        dst[0] = d * t0;
        dst[1] = d * t1;
        dst[2] = d * t2;
        dst[3] = d * t3;
    
        dst[4] = d * ((tmp1 * m10 + tmp2 * m20 + tmp5 * m30) -
                      (tmp0 * m10 + tmp3 * m20 + tmp4 * m30));

        dst[5] = d * ((tmp0 * m00 + tmp7 * m20 + tmp8 * m30) -
                      (tmp1 * m00 + tmp6 * m20 + tmp9 * m30));

        dst[6] = d * ((tmp3 * m00 + tmp6 * m10 + tmp11 * m30) -
                      (tmp2 * m00 + tmp7 * m10 + tmp10 * m30));

        dst[7] = d * ((tmp4 * m00 + tmp9 * m10 + tmp10 * m20) -
                      (tmp5 * m00 + tmp8 * m10 + tmp11 * m20));
    
        dst[8] = d * ((tmp12 * m13 + tmp15 * m23 + tmp16 * m33) -
                      (tmp13 * m13 + tmp14 * m23 + tmp17 * m33));

        dst[9] = d * ((tmp13 * m03 + tmp18 * m23 + tmp21 * m33) -
                      (tmp12 * m03 + tmp19 * m23 + tmp20 * m33));

        dst[10] = d * ((tmp14 * m03 + tmp19 * m13 + tmp22 * m33) -
                       (tmp15 * m03 + tmp18 * m13 + tmp23 * m33));

        dst[11] = d * ((tmp17 * m03 + tmp20 * m13 + tmp23 * m23) -
                       (tmp16 * m03 + tmp21 * m13 + tmp22 * m23));
    
        dst[12] = d * ((tmp14 * m22 + tmp17 * m32 + tmp13 * m12) -
                       (tmp16 * m32 + tmp12 * m12 + tmp15 * m22));

        dst[13] = d * ((tmp20 * m32 + tmp12 * m02 + tmp19 * m22) -
                       (tmp18 * m22 + tmp21 * m32 + tmp13 * m02));

        dst[14] = d * ((tmp18 * m12 + tmp23 * m32 + tmp15 * m02) -
                       (tmp22 * m32 + tmp14 * m02 + tmp19 * m12));

        dst[15] = d * ((tmp22 * m22 + tmp16 * m02 + tmp21 * m12) -
                       (tmp20 * m12 + tmp23 * m22 + tmp17 * m02));
        return new mat4(...dst);
    }
}
