function getGrassBlade() {
    let bodyQuads = 2;
    let vertNumber = (bodyQuads * 2) + 3;
    let bladeLength = 1;


    let spacing = bladeLength / (bodyQuads + 1);

    let upperWidth = 0.1;
    let lowerWidth = 0.1;
    let hLowerWidth = lowerWidth / 2;
    let hUpperWidth = upperWidth / 2;

    let bottom = [new vec3(hLowerWidth, 0, 0), new vec3(-hLowerWidth, 0, 0)];

    let top = [
        new vec3(hUpperWidth, bladeLength - spacing, 0), 
        new vec3(-hUpperWidth, bladeLength - spacing, 0)
    ];

    let tip = new vec3(0, bladeLength, 0);

    let step = (hLowerWidth - hUpperWidth) / (bodyQuads);

    let vertexPairs = [];

    for (let i = 0; i < (bodyQuads - 1); i++) {
        let vert = [new vec3(-step*(i+1) + hLowerWidth, (spacing*(i+1)), 0), 
            new vec3(-(-step*(i+1) + hLowerWidth), (spacing*(i+1)), 0)];
        vertexPairs.push(vert);
    }

    let vertices = [];
    vertices.push(...bottom)

    for (let i = 0; i < (bodyQuads - 1); i++) {
        vertices.push(...vertexPairs[i])
    }
    vertices.push(...top);
    vertices.push(tip);

    let faceVertices = [];
    console.log(vertices, vertNumber)
    for (let i = 0; i < (vertNumber-2); i+=1) {
        let pVertices = [...vertices[i].array, 1, 0, 1, ...vertices[i+1].array, 1, 0, 1, ...vertices[i+2].array, 1, 0, 1];
        faceVertices.push(...pVertices);
    }
    return [new Float32Array(faceVertices), (vertNumber-2) * 3 ];
}


