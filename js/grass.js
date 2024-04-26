// Grass Blade Constancts
const bladeSize = 2;
const bladeWidth = 0.25 / (2 ** (bladeSize + 1));
const bladeHeight = 1;

// Function made in desmos to shape the tip of a grass blade
function shapeBlade(y) {  
    return Math.sqrt((-y + bladeHeight) / (128 * (4 ** bladeSize)));
}

// function to shape a blade of grass
function getGrassBlade(bladeVertices) {
    // create the vertex array
    let verts = []
    // number of rows of vertices (excluding the tip)
    let rows = (bladeVertices - 1) / 2;
    for (let row = 0; row < rows; row++) {
        let y = (bladeHeight / rows) * row ;
        
        // if the vertex is higher than half, use the shaping function, if else it is the bladWidth
        let x;
        if (y > bladeHeight / 2) {
            x = shapeBlade(y);
        }
        else {
            x = bladeWidth / 2;
        }
        // add the vertex to the list
        verts.push(new vec3(x, y, 0), new vec3(-x, y, 0)); 
    }

    // push the tip of the blade
    verts.push(new vec3(0, bladeHeight, 0));

    // turn the vertices into faces, sorting the triangles in clockwise winding order
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

    // return necessary values
    return {
        vertexArray: new Float32Array(faceVertices), 
        vertices: faceVertices.length/3 
    };
}

// function to get the offset for a grass blade
function offset(magnitude) {
    return (Math.random()-0.5) * 2 * magnitude;
}

// function to get per-blade grass data
function loadGrassData() {
    // variables to control the grass
    let width = 1028; let depth = 1400; let density = 12; let off = 1;
    let grassData = [];

    // loop through every possible blade and apply a small offset, lean value and rotation 
    for (let x = -width / 2; x < width / 2; x++) {
        for (let z = -depth / 2; z < depth / 2; z++) {
            grassData.push(
                x / density + offset(off / density), 0, 
                z / density + offset(off / density),    
                offset(Math.PI), offset(0.5) + 1
            );
        }
    }

    // return necessary values
    return {
        array: new Float32Array(grassData),
        length: width * depth
    }
}


