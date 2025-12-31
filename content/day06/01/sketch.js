let images = [];
const totalImages = 20;

let bgImages = [];
const totalBgImages = 3;

let regenerateBtn;

function preload() {
    for (let i = 1; i <= totalImages; i++) {
        let filename = `./img/img${String(i).padStart(2, '0')}.png`;
        images.push(loadImage(filename));
    }

    for (let i = 1; i <= totalBgImages; i++) {
        let filename = `./img/bg/bg${String(i).padStart(2, '0')}.png`;
        bgImages.push(loadImage(filename));
    }
}

function setup() {
    createCanvas(window.innerWidth, window.innerHeight);

    regenerateBtn = createButton('Regenerate');
    regenerateBtn.position(20, 20);
    regenerateBtn.mousePressed(generateFace);

    generateFace();
}

function generateFace() {
    clear();

    let maxW = width * 0.2;
    let maxH = height * 0.2;
    const faceOffsetY = -(height * 0.1);

    // draw background head shape
    const bgImg = rndImg(bgImages);
    drawImage(bgImg, width, height, 0, 0);

    // draw mouth
    const mouthImg = rndImg(images);
    drawImage(mouthImg, maxW, maxH, 0, maxH + faceOffsetY);

    // draw eyes
    const eyeImg = rndImg(images);
    drawImage(eyeImg, maxW, maxH, -maxW/2, faceOffsetY);
    drawImage(eyeImg, maxW, maxH, maxW/2, faceOffsetY);

    // draw nose
    const noseImg = rndImg(images);
    drawImage(noseImg, maxW/2, maxH/2, 0, maxH/2 + faceOffsetY);
}

function windowResized() {
    resizeCanvas(window.innerWidth, window.innerHeight);
}

function draw() {

}

// --- HELPERS ---

function drawImage(img, maxW, maxH, offsetX = 0, offsetY = 0) {
    const { w, h } = getScaledDimensions(img, maxW, maxH);
    image(img, (width - w) / 2 + offsetX, (height - h) / 2 + offsetY, w, h);
}

function rndImg(images) {
    if (images.length === 0) return null;
    let index = floor(random(images.length));
    return images[index];
}

function getScaledDimensions(img, maxW, maxH) {
    let imgRatio = img.width / img.height;
    let boxRatio = maxW / maxH;

    let w, h;
    if (imgRatio > boxRatio) {
        // Image is wider → limit by width
        w = maxW;
        h = maxW / imgRatio;
    } else {
        // Image is taller → limit by height
        h = maxH;
        w = maxH * imgRatio;
    }

    return { w, h };
}
