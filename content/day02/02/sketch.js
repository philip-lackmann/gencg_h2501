let canvas;
let img1, img2;
let cellSize = 10;
let morph = 0.0;

function preload() {
    img1 = loadImage('./Mona_Lisa.jpg');
    img2 = loadImage('./Mona_Lisa_Scary.jpg');
}

function setup() {
    canvas = createCanvas(window.innerWidth, window.innerHeight);

    img1.resize(width, height);
    img2.resize(width, height);

    frameRate(60);
    noStroke();
}


function draw() {
    background(255);

    // oscillate morph between 0..1
    morph = 0.5 + 0.5 * sin(millis() * 0.01);

    for (let y = 0; y < height; y += cellSize) {
        for (let x = 0; x < width; x += cellSize) {
            // sample color from both images
            let c1 = img1.get(x, y);
            let c2 = img2.get(x, y);

            // interpolate between them
            let c = lerpColor(color(c1), color(c2), morph);

            drawCircle(x, y, c)
        }
    }
}

function drawCircle(x, y, c) {
    // map brightness to size
    let b = brightness(c);
    let s = map(b, 0, 100, cellSize, 2);

    // draw circle
    fill(c);
    ellipse(x + cellSize/2, y + cellSize/2, s, s);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
