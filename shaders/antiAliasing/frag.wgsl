@group(0) @binding(0) var prePass: texture_2d<f32>;
/*

// wgsl implementation of FXAA
// Derived from FXAA White Paper NVIDIA

// The minimum amount of local contrast required to apply algorithm (1/3, 1/4, 1/8, 1/16)
const FXAA_EDGE_THRESHOLD = 0.125;

// Trims the algorithm from processing darks (1/32, 1/16, 1/12)
const FXAA_EDGE_THRESHOLD_MIN = 0.0625;

// Controls removal of sub-pixel aliasing (1/2, 1/3, 1/4, 1/8, 0)
const FXAA_SUBPIX_TRIM = 0.25;

// Insures fine detail is not completely removed (3/4, 7/8, 1)
const FXAA_SUBPIX_CAP = 0.75;

// Controls the maximum number of search steps.
const FXAA_SEARCH_STEPS = 32;

// Controls when to stop searching.
const FXAA_SEARCH_THRESHOLD = 0.25;

fn fxaaLuminance(color: vec3f) -> f32 {
    return color.g * (0.587 / 0.299) + color.r;
}

fn FxaaLerp3(a: vec3f, b: vec3f, amountOfA: f32)-> vec3f {
    return (vec3f(-amountOfA) * b) + ((a * vec3f(amountOfA)) + b);
}

fn fxaa(coord: vec2i) -> vec3f {
    let dimensions = vec2f(textureDimensions(prePass, 0));

    let colorN = textureLoad(prePass, coord + vec2i(0, -1), 0).rgb;
    let colorW = textureLoad(prePass, coord + vec2i(-1, 0), 0).rgb;
    let colorM = textureLoad(prePass, coord + vec2i(0, 0), 0).rgb;
    let colorE = textureLoad(prePass, coord + vec2i(1, 0), 0).rgb;
    let colorS = textureLoad(prePass, coord + vec2i(0, 1), 0).rgb;

    var lumaN = fxaaLuminance(colorN);
    var lumaW = fxaaLuminance(colorW);
    var lumaM = fxaaLuminance(colorM);
    var lumaE = fxaaLuminance(colorE);
    var lumaS = fxaaLuminance(colorS);

    // Local Contrast Check
    let rangeMin = min(lumaM, min(min(lumaN, lumaW), min(lumaS, lumaE)));
    let rangeMax = max(lumaM, max(max(lumaN, lumaW), max(lumaS, lumaE)));

    let range = rangeMax - rangeMin;

    if (range < max(FXAA_EDGE_THRESHOLD_MIN, rangeMax * FXAA_EDGE_THRESHOLD)) {
        return colorM;
    }

    // Sub-pixel Aliasing Test

    let lumaL = (lumaN + lumaW + lumaE + lumaS) * 0.25;
    let rangeL = abs(lumaL - lumaM);
    var blendL = max(0.0, (rangeL / range) - FXAA_SUBPIX_TRIM) * (1 / (1 - FXAA_SUBPIX_TRIM));
    blendL = min(FXAA_SUBPIX_CAP, blendL);

    var colorL = colorN + colorW + colorM + colorE + colorS;
    let colorNW = textureLoad(prePass, coord + vec2i(-1,-1), 0).rgb;
    let colorNE = textureLoad(prePass, coord + vec2i( 1,-1), 0).rgb;
    let colorSW = textureLoad(prePass, coord + vec2i(-1, 1), 0).rgb;
    let colorSE = textureLoad(prePass, coord + vec2i( 1, 1), 0).rgb;
    colorL += (colorNW + colorNE + colorSW + colorSE);
    colorL *= vec3f(1 / 9); 

    var lumaNW = fxaaLuminance(colorNW);
    var lumaNE = fxaaLuminance(colorNE);
    var lumaSW = fxaaLuminance(colorSW);
    var lumaSE = fxaaLuminance(colorSE);

    // Vertical Edge Test
    let edgeVert =
        abs((0.25 * lumaNW) + (-0.5 * lumaN) + (0.25 * lumaNE)) +
        abs((0.50 * lumaW ) + (-1.0 * lumaM) + (0.50 * lumaE )) +
        abs((0.25 * lumaSW) + (-0.5 * lumaS) + (0.25 * lumaSE));
    let edgeHorz =
        abs((0.25 * lumaNW) + (-0.5 * lumaW) + (0.25 * lumaSW)) +
        abs((0.50 * lumaN ) + (-1.0 * lumaM) + (0.50 * lumaS )) +
        abs((0.25 * lumaNE) + (-0.5 * lumaE) + (0.25 * lumaSE));
    
    let horzSpan = edgeHorz >= edgeVert;
    var lengthSign: f32;
    if (horzSpan) {
        lengthSign = -dimensions.y;
    } else {
        lengthSign = -dimensions.x;
    }

    if (!horzSpan){
        lumaN = lumaW;
        lumaS = lumaE; 
    }

    var gradientN = abs(lumaN - lumaM);
    var gradientS = abs(lumaS - lumaM);
    lumaN = (lumaN + lumaM) * 0.5;
    lumaS = (lumaS + lumaM) * 0.5;

    // CHOOSE SIDE OF PIXEL WHERE GRADIENT IS HIGHEST
    let pairN = gradientN >= gradientS;
    if (!pairN) {
        lumaN = lumaS;
        gradientN = gradientS;
        lengthSign *= -1;
    }

    var posN: vec2i;
    posN.x = coord.x + i32(select(0.0, lengthSign * 0.5, horzSpan));
    posN.y = coord.y + i32(select(lengthSign * 0.5, 0.0, horzSpan));

    // CHOOSE SEARCH LIMITING VALUES
    gradientN *= FXAA_SEARCH_THRESHOLD;

    // SEARCH IN BOTH DIRECTIONS UNTIL FIND LUMA PAIR AVERAGE IS OUT OF RANGE
    var posP = posN;
    let offNP = vec2i(select(vec2f(dimensions.x, 0.0), vec2f(0.0, dimensions.y), horzSpan));
    var lumaEndN = lumaN;
    var lumaEndP = lumaN;
    var doneN = false;
    var doneP = false;

    posN += offNP * -1;
    posP += offNP * 1;

    for (var i = 0; i < FXAA_SEARCH_STEPS; i++) {
        if (!doneN) {
            lumaEndN = fxaaLuminance(textureLoad(prePass, posN.xy, 0).rgb);
        }
        if (!doneP) {
            lumaEndP = fxaaLuminance(textureLoad(prePass, posP.xy, 0).rgb);
        }

        doneN = doneN || (abs(lumaEndN - lumaN) >= gradientN);
        doneP = doneP || (abs(lumaEndP - lumaN) >= gradientN);
        if (doneN && doneP) {
            break;
        }
        if (!doneN) {
            posN -= offNP;
        }
        if (!doneP) {
            posP += offNP;
        }
    }

    // HANDLE IF CENTER IS ON POSITIVE OR NEGATIVE SIDE
    var dstN = f32(select(coord.x - posN.x, coord.y - posN.y, horzSpan));
    var dstP = f32(select(posP.x - coord.x, posP.y - coord.y, horzSpan));
    let directionN = dstN < dstP;
    lumaEndN = f32(select(lumaEndN, lumaEndP, directionN));
    
    // CHECK IF PIXEL IS IN SECTION OF SPAN WHICH GETS NO FILTERING   
    if (((lumaM - lumaN) < 0.0) == ((lumaEndN - lumaN) < 0.0))  {
        lengthSign = 0.0;
    }
    
    var spanLength = (dstP + dstN);
    dstN = select(dstN, dstP, directionN);
    var subPixelOffset = (0.5 + (dstN * (-1.0 / spanLength))) * lengthSign;
    let colorF = textureLoad(prePass, vec2i(i32(
    f32(coord.x) + select(0.0, subPixelOffset, horzSpan)),
    i32(f32(coord.y) + select(subPixelOffset, 0.0, horzSpan))), 0).rgb;    
        
    return FxaaLerp3(colorL, colorF, blendL);
}*/


const FXAA_REDUCE_MIN = 0.0078125;

const FXAA_REDUCE_MUL = 0.125;

const FXAA_SPAN_MAX = 8.0;


// simple FXAA
fn fxaa(coord: vec2i) -> vec3f {
    let dimensions = vec2f(textureDimensions(prePass, 0));

    var color: vec3f;

    let rgbNW = textureLoad(prePass, coord + vec2i(-1, -1), 0).rgb;
    let rgbNE = textureLoad(prePass, coord + vec2i(1, -1), 0).rgb;
    let rgbSW = textureLoad(prePass, coord + vec2i(-1, 1), 0).rgb;
    let rgbSE = textureLoad(prePass, coord + vec2i(1, 1), 0).rgb;
    let texColor = textureLoad(prePass, coord, 0);


    let rgbM  = texColor.rgb;
    let luma = vec3(0.299, 0.587, 0.114);
    let lumaNW = dot(rgbNW, luma);
    let lumaNE = dot(rgbNE, luma);
    let lumaSW = dot(rgbSW, luma);
    let lumaSE = dot(rgbSE, luma);
    let lumaM  = dot(rgbM,  luma);
    let lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
    let lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));
    
    var dir: vec2f;
    dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
    dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));
    
    let dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) * (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);
    
    let rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
    dir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX), max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX), dir * rcpDirMin));
    
    let rgbA = 0.5 * (
        textureLoad(prePass, vec2i(vec2f(coord) + dir * (1.0 / 3.0 - 0.5)), 0).xyz +
        textureLoad(prePass, vec2i(vec2f(coord) + dir * (2.0 / 3.0 - 0.5)), 0).xyz);
    let rgbB = rgbA * 0.5 + 0.25 * (
        textureLoad(prePass, vec2i(vec2f(coord) + dir * -0.5), 0).xyz +
        textureLoad(prePass, vec2i(vec2f(coord) + dir * 0.5), 0).xyz);

    let lumaB = dot(rgbB, luma);
    if ((lumaB < lumaMin) || (lumaB > lumaMax)) {
        color = vec3f(rgbA);
    } else {
        color = vec3f(rgbB);
    }
    return color;
}

@fragment fn fs(@builtin(position) coord: vec4f) -> @location(0) vec4<f32> {
    let screenPos = vec2i(floor(coord.xy));

    var fragColor = fxaa(screenPos);

    return vec4f(fragColor, 1);
}
