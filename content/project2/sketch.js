// Hand Pose Detection with ml5.js
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/hand-pose

let video;
let handPose;
let hands = [];

let myShader;

const FINGER_SMOOTHING = 12.0;
let fingerTarget = [0, 0, 0, 0, 0];
let fingerSmooth = [0, 0, 0, 0, 0];

function preload() {
    // Initialize HandPose model with flipped video input
    handPose = ml5.handPose({ flipped: true });
    myShader = loadShader('vert.glsl', 'frag.glsl');
}

function mousePressed() {
    console.log(hands);
}

function gotHands(results) {
    hands = results;
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);

    video = createCapture({
        video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 }
        },
        audio: false
    });
    video.size(640, 480);   // important: actually sets the p5 capture size
    video.hide();

    handPose.detectStart(video, gotHands);
}

function draw() {
    background(0);

    if (hands[0]) {
        updateFingerTargets(hands[0], fingerTarget);
    }

    smoothFingers(
        fingerSmooth,
        fingerTarget,
        deltaTime / 1000,
        FINGER_SMOOTHING
    );

    const [thumb, index, middle, ring, pinky] = fingerSmooth;

    push();
    shader(myShader);
    myShader.setUniform("uTime", millis() / 1000);

    // Gentle modulation ranges
    myShader.setUniform("uSpeed", modAroundBase(0.6, 0.4, ring));
    myShader.setUniform("uWarp", 0.3/*modAroundBase(0.30, 0.12, middle)*/);

    const paletteMix = constrain(middle, 0, 1);
    myShader.setUniform("uPaletteMix", paletteMix);

    myShader.setUniform("uDetail", constrain(modAroundBase(0.35, 0.25, index), 0, 1));
    myShader.setUniform("uMorph", modAroundBase(0.5, 0.5, index));

    myShader.setUniform("uContrast", modAroundBase(0.5, 0.5, pinky));

    myShader.setUniform("uScale", modAroundBase(1.2, 0.2, thumb));
    sphere(modAroundBase(800, 100, thumb), 96, 96);
    pop();

    drawFingerTrackingDebug();
}

function drawFingerTrackingDebug() {
    let vw = video.width;
    let vh = video.height;
    let cw = width;
    let ch = height;

    let scaleFactor = max(cw / vw, ch / vh);
    let w = vw * scaleFactor;
    let h = vh * scaleFactor;

    let x = (cw - w) / 2;
    let y = (ch - h) / 2;

    // draw hand keypoints in the same transformed space
    push();
    translate(x, y);
    scale(scaleFactor);

    for (const hand of hands) {
        if (hand.confidence > 0.1) {
            fill(hand.handedness === "Left" ? [255, 0, 255] : [255, 255, 0]);
            noStroke();
            for (const kp of hand.keypoints) {
                circle(kp.x, kp.y, 16 / scaleFactor);
            }
        }
    }
    pop();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function getFingerCurls(hand) {
    // Keypoint indices per finger: [base, middle, tip]
    const fingers = {
        0: [1, 2, 4],    // thumb (CMC, MCP, tip)
        1: [5, 6, 8],    // index
        2: [9, 10, 12],  // middle
        3: [13, 14, 16], // ring
        4: [17, 18, 20]  // pinky
    };

    const curls = {};

    for (const [fingerIndex, [a, b, c]] of Object.entries(fingers)) {
        const p1 = hand.keypoints[a];
        const p2 = hand.keypoints[b];
        const p3 = hand.keypoints[c];

        // Vectors p2->p1 and p2->p3
        const v1 = createVector(p1.x - p2.x, p1.y - p2.y);
        const v2 = createVector(p3.x - p2.x, p3.y - p2.y);

        // Angle at the middle joint
        const angle = v1.angleBetween(v2); // radians

        // Map angle to curl value
        // ~PI = straight finger, ~0.5 rad = tightly curled
        const curl = constrain(
            map(angle, PI, 0.5, 0, 1),
            0,
            1
        );

        curls[fingerIndex] = curl;
    }

    return curls;
}

function updateFingerTargets(hand, target) {
    const curls = getFingerCurls(hand);
    for (let i = 0; i < 5; i++) {
        target[i] = constrain(curls[i], 0, 1);
    }
}

function smoothFingers(current, target, dtSeconds, smoothing) {
    const alpha = 1.0 - Math.exp(-smoothing * dtSeconds);

    for (let i = 0; i < 5; i++) {
        current[i] = lerp(current[i], target[i], alpha);
    }

    return current;
}

function modAroundBase(base, depth, x01) {
    // x01: 0..1 -> (x01-0.5): -0.5..+0.5
    return base + depth * (x01 - 0.5) * 2.0;
}
