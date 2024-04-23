class ObjLoader {
    static async create(filePath, vertexNormalOnly) {
        const objLoader = new ObjLoader;

        const file = await fetch(filePath);
        var text = await file.text();

        var textArray = text.split("\n");    

        var vertexData = [];
        var normalData = [];
        var uvData = [];
        var faceData = [];
        // inefficient
        for (let item of textArray) {
            let itemArray = item.split(" ");
            if (itemArray[0] == "v") {
                vertexData.push(new vec3(...itemArray.slice(1, 4)));
            }
            else if (itemArray[0] == "vn") {
                normalData.push(new vec3(...itemArray.slice(1, 4)));
            }
            else if (itemArray[0] == "f") {
                faceData.push(itemArray.slice(1, 4));
            }
            else if (itemArray[0] == "vt") {
                let vec = new vec2(...itemArray.slice(1, 3));
                let x = vec.x;
                vec.x = vec.x;
                vec.y = -vec.y;
                uvData.push(vec);
            }
        }
        
        let vertices = [];
        let number = 0;
        for (let item of faceData) {
            let itemArray = []
            for (let faceItem of item) {
                itemArray.push(faceItem.split("/"));
            }
            let uv = [];
            let vertex = [];
            let normal = [];

            for (let i = 0; i < 3; i++) { 
                vertex.push(new vec3(
                    ...vertexData[itemArray[i][0]-1].array,
                ));

                normal.push(new vec3(
                    ...normalData[itemArray[i][2]-1].array,
                ));

                uv.push(uvData[itemArray[i][1]-1]);

                number += 1;
            }

            let faceNormal = (normal[0].add(normal[1]).add(normal[2])).div(3);

            let edge1 = vertex[1].sub(vertex[0]);
            let edge2 = vertex[2].sub(vertex[0]);
            let deltaUV1 = uv[1].sub(uv[0]);
            let deltaUV2 = uv[2].sub(uv[0]);

            let f =  1 / (deltaUV1.x * deltaUV2.y - deltaUV2.x * deltaUV1.y);

            let tangent = new vec3();
            let biTangent = new vec3();

            tangent.x = f * (deltaUV2.y * edge1.x - deltaUV1.y * edge2.x);
            tangent.y = f * (deltaUV2.y * edge1.y - deltaUV1.y * edge2.y);
            tangent.z = f * (deltaUV2.y * edge1.z - deltaUV1.y * edge2.z);


            for (let v = 0; v < 3; v++) {
                if (vertexNormalOnly) {
                    vertices.push(
                        ...vertex[v].array, ...normal[v].array
                    );
                }
                else {
                    vertices.push(
                        ...vertex[v].array, ...normal[v].array, 
                        ...uv[v].array, ...tangent.array);
                }
                
            }
        }

        objLoader.vertices = new Float32Array(vertices);
        objLoader.vertexNumber = objLoader.vertices.length / 5;
        objLoader.vertexNumber = number;


        return objLoader;
    }
}