// Forked from https://editor.p5js.org/lingdong/sketches/ef6FB-uNq
// --> https://github.com/LingDong-/ Check his work!

// A choice for number of keypoints: 7,33,68,468

// === bare minimum 7 points ===
// let VTX = VTX7;

// === important facial feature 33 points ===
// let VTX = VTX33;

// === standard facial landmark 68 points ===
// let VTX = VTX68;

// === full facemesh 468 points ===
let VTX = VTX68;

// select the right triangulation based on vertices
let TRI;
if (VTX == VTX7) {
    TRI = TRI7;
} else if (VTX == VTX33) {
    TRI = TRI33;
} else if (VTX == VTX68) {
    TRI = TRI68;
} else {
    TRI = TRI468;
}

// this will be loaded with the facemesh model
// WARNING: do NOT call it 'model', because p5 already has something called 'model'
let facemeshModel = null;

// is webcam capture ready?
let videoDataLoaded = false;

let statusText = "Loading facemesh model...";

// faces detected in this browser
// currently facemesh only supports single face, so this will be either empty or singleton
let myFaces = [];
// non packed for full face contour
let myFacesFull = [];

// webcam capture, managed by p5.js
let capture;

// Load the MediaPipe facemesh model assets.
facemesh.load().then(function (_model) {
    console.log("model initialized.");
    statusText = "Model loaded.";
    facemeshModel = _model;
});

// pareidolia images
let images = [];
const totalImages = 20;

let bgImages = [];
const totalBgImages = 3;

let eyeImg;
let noseImg;
let mouthImg;
let bgImg;


function preload() {
    for (let i = 1; i <= totalImages; i++) {
        let filename = `../01/img/img${String(i).padStart(2, '0')}.png`;
        images.push(loadImage(filename));
    }
    for (let i = 1; i <= totalBgImages; i++) {
        let filename = `../01/img/bg/bg${String(i).padStart(2, '0')}.png`;
        bgImages.push(loadImage(filename));
    }
}

function setup() {
    createCanvas(window.innerWidth, window.innerHeight);
    capture = createCapture(VIDEO);

    // this is to make sure the capture is loaded before asking facemesh to take a look otherwise facemesh will be very unhappy
    capture.elt.onloadeddata = function () {
        console.log("video initialized");
        videoDataLoaded = true;
    };

    capture.hide();

    eyeImg = rndImg(images);
    noseImg = rndImg(images);
    mouthImg = rndImg(images);
    bgImg = rndImg(bgImages);
}

// draw a face object returned by facemesh
function drawFaces(faces, filled) {
    for (let i = 0; i < faces.length; i++) {
        const keypoints = faces[i].scaledMesh;

        for (let j = 0; j < keypoints.length; j++) {
            const [x, y, z] = keypoints[j];
            circle(x, y, 5);
            push();
            strokeWeight(1);
            text(j, x, y);
            pop();
        }

        for (let j = 0; j < TRI.length; j += 3) {
            let a = keypoints[TRI[j]];
            let b = keypoints[TRI[j + 1]];
            let c = keypoints[TRI[j + 2]];

            if (filled) {
                let d = [(a[0] + b[0] + c[0]) / 6, (a[1] + b[1] + c[1]) / 6];
                let color = get(...d);
                fill(color);
                noStroke();
            }
            triangle(a[0], a[1], b[0], b[1], c[0], c[1]);
        }
    }
}

// reduces the number of keypoints to the desired set
// (VTX7, VTX33, VTX68, etc.)
function packFace(face, set) {
    let ret = {
        scaledMesh: [],
    };
    for (let i = 0; i < set.length; i++) {
        let j = set[i];
        ret.scaledMesh[i] = [
            face.scaledMesh[j][0],
            face.scaledMesh[j][1],
            face.scaledMesh[j][2],
        ];
    }
    return ret;
}

function draw() {

    //otherwise super gnarly
    strokeJoin(ROUND);

    // if model and video both loaded,
    if (facemeshModel && videoDataLoaded) {

        facemeshModel.estimateFaces(capture.elt).then(function (_faces) {
            // we're faceling an async promise best to avoid drawing something here!
            // it might produce weird results due to racing

            // update the global myFaces object with the detected faces
            myFacesFull = _faces;
            myFaces = _faces.map((x) => packFace(x, VTX));

            // console.log(myFaces);
            if (!myFaces.length) {
                // haven't found any faces
                statusText = "Show some faces!";
            } else {
                // display the confidence, to 3 decimal places
                const confidence = Math.round(_faces[0].faceInViewConfidence * 1000) / 1000;
                statusText = "Confidence: " + confidence;
            }
        });
    }

    background(200);

    // first draw the debug video and annotations
    push();
    // downscale the webcam capture so it doesn't take up too much screen sapce
    scale(0.5);
    // image(capture, 0, 0, capture.width, capture.height);
    noFill();
    stroke(255,0,0);
    // draw my face skeleton
    drawFaces(myFaces);

    // draw pareidolia images
    drawPareidoliaImages();

    pop();

    push();
    fill(255, 0, 0);
    text(statusText, 2, 60);
    pop();
}

function drawPareidoliaImages() {
    if (myFacesFull.length > 0) {
        const fFull = myFacesFull[0]; // full 468
        drawHeadImage(bgImg, fFull, 2.0); // tweak padding to taste
    }
    if (myFaces.length > 0) {
        const f = myFaces[0];

        // EYES
        const left  = eyePoseLeft(f);
        const right = eyePoseRight(f);
        const EYE_SCALE = 1.0;

        if (left)  drawImgAtPose(eyeImg,  left.cx,  left.cy,  left.ang,  left.w  * EYE_SCALE);
        if (right) drawImgAtPose(eyeImg, right.cx, right.cy, right.ang, right.w * EYE_SCALE);

        // NOSE (use wing-to-wing width)
        // const nose = nosePose(f);
        // const NOSE_SCALE = 1.0; // tweak to taste
        // if (nose) drawImgAtPose(noseImg, nose.cx, nose.cy, nose.ang, nose.w * NOSE_SCALE);

        // MOUTH (corner-to-corner width)
        const mouth = mouthPose(f);
        const MOUTH_SCALE = 1.0; // tweak to taste
        if (mouth) drawImgAtPose(mouthImg, mouth.cx, mouth.cy, mouth.ang, mouth.w * MOUTH_SCALE);
    }
}

function rndImg(images) {
    if (images.length === 0) return null;
    let index = floor(random(images.length));
    return images[index];
}

// --- helpers to fetch packed landmark points by their original 468 ids ---
function idx468(id){ return VTX.indexOf(id); }
function pt(face, id468){
    const i = idx468(id468);
    if (i === -1) return null;
    const [x,y] = face.scaledMesh[i];
    return {x,y};
}

function poseBetween(face, idA, idB){
    const a = pt(face, idA);
    const b = pt(face, idB);
    if (!a || !b) return null;
    const cx = (a.x + b.x) / 2;
    const cy = (a.y + b.y) / 2;
    const w  = dist(a.x, a.y, b.x, b.y);
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    return {cx, cy, w, ang};
}

// convenience wrappers
function eyePoseLeft(face){
    return poseBetween(face, 33, 133);
}

function eyePoseRight(face){
    return poseBetween(face, 362, 263);
}

function nosePose(face){  // nose wings
    return poseBetween(face, 98, 327);
}

function mouthPose(face){ // mouth corners
    return poseBetween(face, 78, 308);
}

// Draw a centered, rotated image with a width target, preserving aspect ratio
function drawImgAtPose(img, cx, cy, ang, targetW){
    if (!img) return;
    const ar = img.height ? (img.width / img.height) : 1;
    const w = targetW;
    const h = w / ar;
    push();
    imageMode(CENTER);
    translate(cx, cy);
    rotate(ang);
    image(img, 0, 0, w, h);
    pop();
}

// Head contour ids in 468-id space (these are present in VTX68)
/* cont */
const HEAD_IDS = [127,234,132,58,172,150,149,148,152,377,378,379,397,288,361,454,356];

function getPoints(face, ids468){
    const pts = [];
    for (const id of ids468){
        const i = VTX.indexOf(id);
        if (i !== -1){
            const [x,y] = face.scaledMesh[i];
            pts.push({x,y});
        }
    }
    return pts;
}

function bboxOfPoints(pts){
    let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
    for (const p of pts){ minX=Math.min(minX,p.x); minY=Math.min(minY,p.y); maxX=Math.max(maxX,p.x); maxY=Math.max(maxY,p.y); }
    return {minX,minY,maxX,maxY, w:maxX-minX, h:maxY-minY, cx:(minX+maxX)/2, cy:(minY+maxY)/2};
}

// Estimate head rotation from left/right jaw extremes
function headAngle(face){
    const L = pt(face, 127); // left jaw
    const R = pt(face, 356); // right jaw
    if (!L || !R) return 0;
    return Math.atan2(R.y - L.y, R.x - L.x);
}

function drawHeadImage(img, face, scalePad = 1.15){
    if (!img || !face) return;

    // Get the ordered face-oval polygon in full 468 space
    const poly = getPointsFull(face, FACE_OVAL_IDS);
    if (poly.length < 3) return;

    const box = bboxOfPoints(poly);
    const ang = headAngleFull(face);

    // Fit image to width with a bit of padding
    const targetW = box.w * scalePad;
    const ar = img.width / img.height;
    const targetH = targetW / ar;

    // Clip to oval and draw
    push();
    translate(box.cx, box.cy);
    rotate(ang);

    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.moveTo(poly[0].x - box.cx, poly[0].y - box.cy);
    for (let i = 1; i < poly.length; i++){
        drawingContext.lineTo(poly[i].x - box.cx, poly[i].y - box.cy);
    }
    drawingContext.closePath();
    drawingContext.clip();

    imageMode(CENTER);
    image(img, 0, 0, targetW, targetH);

    drawingContext.restore();
    pop();
}

// MediaPipe Face Mesh "face oval" path (468-id space, ordered around the outline)
const FACE_OVAL_IDS = [
    10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,
    152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109
];

// Full-face point by 468 id (no packing)
function ptFull(face, id468){
    const p = face.scaledMesh[id468];
    if (!p) return null;
    return {x:p[0], y:p[1]};
}

function getPointsFull(face, ids){
    const pts = [];
    for (const id of ids){
        const p = ptFull(face, id);
        if (p) pts.push(p);
    }
    return pts;
}

// Head yaw from jaw extremes (468 ids)
function headAngleFull(face){
    const L = ptFull(face,127); // left jaw
    const R = ptFull(face,356); // right jaw
    if (!L || !R) return 0;
    return Math.atan2(R.y - L.y, R.x - L.x);
}
