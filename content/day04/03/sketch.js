let inkCircle = { x: 0, y: 0, vx: 0, vy: 0, r: 10, speed: 50 };
let inkTrail = [];
const inkTrailMaxPoints = 1024; // length of the trail (more = longer)

// === NEW: centralize vibration circle configs so we can both draw & collide ===
const vibrationCircles = [
    { min: 10, max: 100, loopFrames: 60 },
    { min: 10, max: 200, loopFrames: 60 },
    { min: 10, max: 300, loopFrames: 60 },
    { min: 10, max: 400, loopFrames: 60 },
];

let img;

let debugCheckbox;
let showDebug = false;

function preload() {
    img = loadImage("topography.png");
}

function setup() {
    createCanvas(window.innerWidth, window.innerHeight);

    img.loadPixels();

    noFill();
    stroke(0);
    setupInkCircle();

    // Create checkbox
    debugCheckbox = createCheckbox('Show debug', false);
    debugCheckbox.position(10, 10);
    debugCheckbox.changed(() => {
        showDebug = debugCheckbox.checked();
    });
}

function windowResized() {
    resizeCanvas(window.innerWidth, window.innerHeight);

    // Keep the ink circle inside bounds after a resize
    inkCircle.x = constrain(inkCircle.x, inkCircle.r, width - inkCircle.r);
    inkCircle.y = constrain(inkCircle.y, inkCircle.r, height - inkCircle.r);
}

function setupInkCircle() {
    inkCircle.x = width / 2;
    inkCircle.y = height / 2;
    const theta = random(TWO_PI);
    inkCircle.vx = cos(theta) * inkCircle.speed;
    inkCircle.vy = sin(theta) * inkCircle.speed;
}

function draw() {
    background(255, 255, 255);

    const imgSample = sampleImageFeaturesAtTime(img, frameCount * 0.5, {
        traversal: "hilbert",
        speed: 1,
        hilbertOrder: 8,
        padding: 1
    });

    // Draw all vibration circles
    for (const cfg of vibrationCircles) {
        drawVibrationCircle(cfg.min, 20 + cfg.max * (1 + imgSample.gradMag), cfg.loopFrames * (imgSample.gradAng * 0.1));
    }

    drawInkCircle(1 + pow(imgSample.gradAng, 2));
}

// === Helper: current radius of a vibration circle for this frame ===
function getVibrationRadius(minRadius, maxRadius, loopSpeedInFrames = 120) {
    let t = (frameCount % loopSpeedInFrames) / loopSpeedInFrames; // 0..1
    return map(sin(TWO_PI * t), -1, 1, minRadius, maxRadius);
}

function drawVibrationCircle(minRadius, maxRadius, loopSpeedInFrames = 120) {
    const r = getVibrationRadius(minRadius, maxRadius, loopSpeedInFrames);
    push();

    noFill();
    stroke(0);
    if (!showDebug) {
        noStroke()
    }
    ellipse(width / 2, height / 2, r * 2);

    pop();
}

function drawInkCircle(thickness) {
    // Move
    inkCircle.x += inkCircle.vx;
    inkCircle.y += inkCircle.vy;

    // --- Add random jitter to motion ---
    // const jitterStrength = 0.5; // try values between 0.2 and 2.0
    // inkCircle.vx += random(-jitterStrength, jitterStrength);
    // inkCircle.vy += random(-jitterStrength, jitterStrength);

    // Bounce on X edges
    if (inkCircle.x - inkCircle.r <= 0) {
        inkCircle.x = inkCircle.r;
        inkCircle.vx *= -1;
    } else if (inkCircle.x + inkCircle.r >= width) {
        inkCircle.x = width - inkCircle.r;
        inkCircle.vx *= -1;
    }

    // Bounce on Y edges
    if (inkCircle.y - inkCircle.r <= 0) {
        inkCircle.y = inkCircle.r;
        inkCircle.vy *= -1;
    } else if (inkCircle.y + inkCircle.r >= height) {
        inkCircle.y = height - inkCircle.r;
        inkCircle.vy *= -1;
    }

    // === NEW: interact with each vibration circle's current radius ===
    for (const cfg of vibrationCircles) {
        const r = getVibrationRadius(cfg.min, cfg.max, cfg.loopFrames);
        applyRadialPushIfOnRing(width / 2, height / 2, r);
    }

    // Limit speed so impulses don't send it flying forever
    limitInkSpeed(inkCircle.speed);

    // NEW: update & draw the trail for the current position
    drawInkCircleTrail(thickness);

    // Draw the ink circle on top
    fill(0);
    noStroke();
    ellipse(inkCircle.x, inkCircle.y, inkCircle.r * 2, inkCircle.r * 2);
}

// === NEW: push ink away from the ring if overlapping its stroke radius ===
function applyRadialPushIfOnRing(cx, cy, ringRadius) {
    const dx = inkCircle.x - cx;
    const dy = inkCircle.y - cy;
    const d = Math.hypot(dx, dy);
    if (d === 0) return; // avoid NaNs

    // Treat the "stroke" as a thin ring; collide when the center is within this band
    const band = inkCircle.r + 1;
    const delta = d - ringRadius; // negative if inside, positive if outside

    if (Math.abs(delta) <= band) {
        // 🎲 Random chance for collision to actually occur
        const collisionChance = 0.5;
        if (random() > collisionChance) return; // skip most collisions

        // Unit normal (radial direction)
        const nx = dx / d;
        const ny = dy / d;

        // Direction that increases distance from the ring (away from stroke)
        const dir = delta > 0 ? 1 : -1;

        // Impulse strength
        const impulse = 0.6 * inkCircle.speed;

        // Apply impulse to velocity
        inkCircle.vx += nx * dir * impulse;
        inkCircle.vy += ny * dir * impulse;

        // Nudge position slightly outward so it doesn’t get stuck
        const separation = band - Math.abs(delta) + 0.5;
        inkCircle.x += nx * dir * separation;
        inkCircle.y += ny * dir * separation;

        // Dampen tangential velocity
        const vdotn = inkCircle.vx * nx + inkCircle.vy * ny;
        const tx = -ny, ty = nx; // unit tangent
        const v_dott = inkCircle.vx * tx + inkCircle.vy * ty;
        const tangentialDamp = 0.85;
        inkCircle.vx = vdotn * nx + v_dott * tangentialDamp * tx;
        inkCircle.vy = vdotn * ny + v_dott * tangentialDamp * ty;
    }
}

// === NEW: cap velocity magnitude ===
function limitInkSpeed(maxSpeed) {
    const v = Math.hypot(inkCircle.vx, inkCircle.vy);
    if (v > maxSpeed) {
        const s = maxSpeed / v;
        inkCircle.vx *= s;
        inkCircle.vy *= s;
    }
}

function drawInkCircleTrail(thickness) {
    // Store thickness per point so history does NOT change when thickness changes later
    inkTrail.push({ x: inkCircle.x, y: inkCircle.y, th: thickness });
    if (inkTrail.length > inkTrailMaxPoints) inkTrail.shift();

    noStroke();
    fill(0);

    // How dense the stamps are. Lower => more circles (smoother, heavier).
    // Tie spacing to thickness so thick trails don't look "dotted".
    const minSpacing = 0.75;

    // Draw oldest -> newest with fade and (optional) taper
    for (let i = 1; i < inkTrail.length; i++) {
        const p0 = inkTrail[i - 1];
        const p1 = inkTrail[i];

        const t = i / inkTrail.length;     // 0..1 (older -> newer)
        const a = 255 * t;                 // fade older stamps

        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;
        const d = Math.hypot(dx, dy);
        if (d < 1e-6) continue;

        // Use thickness local to the newer sample (or average both)
        const th = p1.th;

        // Circle diameter in pixels. You can scale for a more "inky" feel.
        const diam = th;

        // Stamp spacing
        const step = Math.max(minSpacing, diam * 0.5);
        const steps = Math.max(1, Math.floor(d / step));

        for (let s = 0; s <= steps; s++) {
            const u = s / steps;
            const x = p0.x + dx * u;
            const y = p0.y + dy * u;

            // Optional taper: make older stamps slightly thinner
            const taper = 0.35 + 0.65 * t; // keeps some visible body in old parts
            const stampDiam = diam * taper;

            fill(0, a);
            circle(x, y, stampDiam);
        }
    }

    // Restore defaults if you rely on them elsewhere
    noFill();
    stroke(0);
    strokeWeight(1);
}
