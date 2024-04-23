const bladeWidth = 0.25 / 2;
const bladeHeight = 1;
const bladeVertices = 15;

function shapeBlade(y) {
    
    return Math.sqrt((-y + bladeHeight) / 128);
}

function getGrassBlade() {
    let verts = []

    let rows = (bladeVertices - 1) / 2;
    for (let row = 0; row < rows; row++) {
        let y = (bladeHeight / rows) * row ;
        let x;

        if (y > bladeHeight / 2) {
            x = shapeBlade(y);
        }
        else {
            x = bladeWidth / 2;
        }

        verts.push(new vec3(x, y, 0), new vec3(-x, y, 0)); 
    }

    verts.push(new vec3(0, bladeHeight, 0)); //, new vec3(0, bladeHeight, 0)); 

    let faceVertices = [];    
    for (let vert = 0; vert < (bladeVertices - 2); vert++) {
        let vertices = verts.slice(vert, vert + 3); 
        vertices = vertices.sort((a, b) => a.z - b.z);
        let p1 = vertices[1]; let p2 = vertices[2];
        if (vertices[1].x > vertices[2].x) {
            vertices[1] = p2; vertices[2] = p1;
        }
        faceVertices.push(...vertices[0].array, ...vertices[1].array, ...vertices[2].array);
    }


    return {
        vertexArray: new Float32Array(faceVertices), 
        vertices: faceVertices.length/3 
    };
}


function offset(magnitude) {
    return (Math.random()-0.5) * 2 * magnitude;
}


function loadGrassData() {
    let width = 128; let depth = 128; let density = 8; let off = 1;
    let grassData = [];
    for (let x = -width/2; x < width/2; x++) {
        for (let z = -depth/2; z < depth/2; z++) {
            grassData.push(
                x / density + offset(off / density), 0, 
                z / density + offset(off / density), 
                offset(Math.PI), offset(0.5) + 1
            );
        }
    }

    return {
        array: new Float32Array(grassData),
        length: width * depth
    }
}


