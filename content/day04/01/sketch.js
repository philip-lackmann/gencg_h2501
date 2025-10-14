let lastTime = 0;
const intervalInSeconds = 0.1;

let lastMouseX, lastMouseY = 0;

let circles = []; // { x, y, radius }

let sound;

// Allowed semitone offsets for C pentatonic across [-12, +12]
// C D E G A within -1 octave, 0, +1 octave; clipped to range
const PENTATONIC_STEPS = [-12, -10, -8, -5, -3, 0, 2, 4, 7, 9, 12];


function preload() {
    sound = loadSound('kalimba.mp3');
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    background(255);

    lastMouseX = mouseX;
    lastMouseY = mouseY;
}

function draw() {
    background(255);

    // create circles every n seconds
    lastTime += deltaTime;
    if (lastTime >= intervalInSeconds * 1000) {
        lastTime = 0;

        const radius = calcMouseVelocityNormalized() * 40;

        if (!mouseIsPressed) // block drawing with mouse button
            circles.push({ x: mouseX, y: mouseY, radius: radius });
    }

    // move circles upward
    for (let i = circles.length - 1; i >= 0; i--) {
        const c = circles[i];
        c.y -= 2;

        drawCircle(c.x, c.y, c.radius);

        // remove circles off-screen
        if (c.y + c.radius / 2 <= 0) {
            console.log("brr");
            if (sound) {
                const rate = radiusToQuantizedRate(c.radius);
                sound.rate(rate);
                sound.play();
            }
            circles.splice(i, 1);
        }
    }
}

function drawCircle(x, y, radius = 10) {
    stroke(0);
    noFill();

    circle(x, y, radius);
}

function calcMouseVelocityNormalized() {
    const dx = mouseX - lastMouseX;
    const dy = mouseY - lastMouseY;

    const distance = Math.sqrt(dx * dx + dy * dy);

    const velocity = distance / intervalInSeconds;

    lastMouseX = mouseX;
    lastMouseY = mouseY;

    // Normalize velocity (0 to 1)
    // Adjust `maxVelocity` based on expected speed range
    const maxVelocity = 2000; // pixels per second (tune this)
    return constrain(velocity / maxVelocity, 0, 1);
}

function radiusToQuantizedRate(radius, rMin = 0, rMax = 40) {
    const r = constrain(radius, rMin, rMax);
    const idx = Math.round(map(r, rMin, rMax, PENTATONIC_STEPS.length - 1, 0));
    const semis = PENTATONIC_STEPS[idx];
    return pow(2, semis / 12); // 2^(n/12) -> playback rate
}
