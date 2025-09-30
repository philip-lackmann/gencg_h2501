let canvas;

// ---------- config ----------
const DOT_COUNT = 6;
const BRANCHES_PER_DOT = 1;
const STEP = 2;                 // ridge sampling step (px)
const STAR_COUNT = 220;
const BRANCH_ALPHA = 255;       // 0–255 (trail darkness)
const BRANCH_MAX_SPEED_X = 1;
const BRANCH_SPEED_Y = 1;       // downward drift
const TRAIL_FADE_ALPHA = 10;    // 5–30; smaller = longer trails
const JUMP_THRESH = 50;         // px; skip drawing if movement exceeds this

// ---------- state ----------
const dots = [];
const branches = [];            // {x,y,px,py,vx,vy,r, sx,sy}
const ridge = [];               // sampled y for each x bucket
const stars = [];               // moving, twinkling stars

let ridgeLayer;                 // outlines on top (static)
let terrainLayer;               // white interior + fading black trails

// ---------- setup ----------
function setup() {
    canvas = createCanvas(windowWidth, windowHeight);
    pixelDensity(1);
    noSmooth();

    initDots();
    computeRidge();
    initStars();
    buildRidgeLayer();
    buildTerrainLayer();          // persistent layer (white interior + trails)
}

// ---------- draw ----------
function draw() {
    // 1) black background
    background(0);

    // 2) stars (move + twinkle), constrained to sky (above ridge)
    drawStars();

    // 3) fade the terrain layer slightly INSIDE the mountains (no hard clear)
    fadeTerrainLayer(TRAIL_FADE_ALPHA);

    // 4) update + draw branch trails onto terrainLayer (only below ridge)
    drawBranchTrails();

    // 5) composite terrain (white interior + trails)
    image(terrainLayer, 0, 0);

    // 6) mountain outline lines on top
    image(ridgeLayer, 0, 0);
}

// ---------- resize ----------
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);

    ridge.length = 0;
    computeRidge();

    stars.length = 0;
    initStars();

    buildRidgeLayer();
    buildTerrainLayer();
}

// ---------- helpers ----------
function initDots() {
    for (let i = 0; i < DOT_COUNT; i++) {
        const x = Math.random() * width;
        const y = rndInt(height * 0.1, height * 0.5);
        const r = Math.random() * 2;
        dots.push({ x, y, r });

        for (let j = 0; j < BRANCHES_PER_DOT; j++) {
            branches.push({
                x, y, r,
                px: x, py: y,          // previous pos for trail segment
                vx: 0,
                vy: BRANCH_SPEED_Y,
                sx: x, sy: y           // seed position (used for respawn jitter)
            });
        }
    }
}

// y(x) = min_i ( y_i + |x - x_i| )
function computeRidge() {
    for (let x = 0; x <= width; x += STEP) {
        let yMin = Infinity;
        for (const d of dots) {
            const y = d.y + Math.abs(x - d.x);
            if (y < yMin) yMin = y;
        }
        ridge.push(yMin);
    }
}

function initStars() {
    for (let i = 0; i < STAR_COUNT; i++) {
        const x = Math.random() * width;
        const xi = clampInt(Math.floor(x / STEP), 0, ridge.length - 1);
        const ridgeY = ridge[xi] ?? height;
        const y = Math.random() * Math.max(0, ridgeY);
        stars.push({
            x, y,
            r: Math.random() * 2,
            phase: Math.random() * TWO_PI,
            speed: 0.01 + Math.random() * 0.02,  // twinkle speed
            dx: (Math.random() - 0.5) * 0.12 * 4,    // slow drift
            dy: (Math.random() - 0.5) * 0.06 * 4,
        });
    }
}

function drawStars() {
    noStroke();
    for (const s of stars) {
        // Update drift
        s.x += s.dx;
        s.y += s.dy;

        // Wrap X
        if (s.x < 0) s.x += width;
        if (s.x > width) s.x -= width;

        // Keep star inside the sky (y < ridge at its x)
        const xi = clampInt(Math.floor(s.x / STEP), 0, ridge.length - 1);
        const ridgeY = ridge[xi] ?? height;
        // wrap within [0, ridgeY)
        if (s.y < 0) s.y += ridgeY;
        if (s.y >= ridgeY) s.y -= ridgeY;
        // clamp backup
        s.y = Math.min(Math.max(0, s.y), Math.max(0, ridgeY - 1));

        // Twinkle via alpha modulation
        const a = 180 + 75 * Math.sin(frameCount * s.speed + s.phase);
        fill(255, 255, 255, a);
        circle(s.x, s.y, s.r);
    }
}

function buildRidgeLayer() {
    ridgeLayer = createGraphics(width, height);
    ridgeLayer.pixelDensity(1);
    ridgeLayer.noSmooth();
    ridgeLayer.clear();

    ridgeLayer.stroke(0);
    for (const d of dots) {
        ridgeLayer.strokeWeight(rndInt(2, 10));
        ridgeLayer.line(d.x, d.y, d.x + 1000, d.y + rndInt(500, 1000));
        ridgeLayer.line(d.x, d.y, d.x - 1000, d.y + rndInt(500, 1000));
    }
}

function buildTerrainLayer() {
    terrainLayer = createGraphics(width, height);
    terrainLayer.pixelDensity(1);
    terrainLayer.noSmooth();
    terrainLayer.clear();

    // Paint solid white interior once
    terrainLayer.noStroke();
    terrainLayer.fill(255);
    drawInteriorPolygon(terrainLayer);

    // Initialize previous positions to current to avoid first-frame long lines
    for (const b of branches) {
        b.px = b.x;
        b.py = b.y;
    }
}

// Draw the interior polygon (below ridge) on a given graphics ctx
function drawInteriorPolygon(g) {
    g.beginShape();
    g.vertex(0, g.height);
    for (let xi = 0; xi < ridge.length; xi++) {
        const x = xi * STEP;
        g.vertex(x, ridge[xi]);
    }
    g.vertex(g.width, g.height);
    g.endShape(CLOSE);
}

// Slightly fade existing trails inside the interior (no hard clear)
function fadeTerrainLayer(alpha) {
    terrainLayer.noStroke();
    terrainLayer.fill(255, alpha);   // white with small alpha “erases” slowly
    drawInteriorPolygon(terrainLayer);
}

// Update & draw trails (lines) onto terrainLayer, only inside mountains
function drawBranchTrails() {
    terrainLayer.stroke(0, BRANCH_ALPHA);
    terrainLayer.strokeWeight(1.5);
    terrainLayer.noFill();

    for (const b of branches) {
        // integrate velocity
        b.vx += rndInt(-1, 1) * 0.2;                             // horizontal jitter
        b.vx = constrain(b.vx, -BRANCH_MAX_SPEED_X, BRANCH_MAX_SPEED_X);
        b.x += b.vx;
        b.y += b.vy;                                             // always downward

        // Wrap X softly (reset prev to avoid long line)
        if (b.x < 0) { b.x = width - 1; b.px = b.x; b.py = b.y; }
        if (b.x > width) { b.x = 0; b.px = b.x; b.py = b.y; }

        // Ridge at this x
        const xi = clampInt(Math.floor(b.x / STEP), 0, ridge.length - 1);
        const ridgeY = ridge[xi] ?? height;

        // If it entered the sky (above ridge) OR reached bottom, respawn at ridge
        if (b.y < ridgeY || b.y > height) {
            // respawn near its seed x (small horizontal jitter)
            const jitter = (Math.random() - 0.5) * 20;
            b.x = clamp(width, b.sx + jitter, 0, width);
            // place exactly at ridge at that x
            const xi2 = clampInt(Math.floor(b.x / STEP), 0, ridge.length - 1);
            const ry2 = ridge[xi2] ?? height;
            b.y = ry2;

            // reset trail continuity + keep downward motion
            b.vx = 0;
            b.vy = Math.abs(BRANCH_SPEED_Y);
            b.px = b.x;
            b.py = b.y;

            // skip drawing this frame
            continue;
        }

        // Skip drawing if movement jumped too far (safety)
        const dx = Math.abs(b.x - b.px);
        const dy = Math.abs(b.y - b.py);
        if (dx < JUMP_THRESH && dy < JUMP_THRESH) {
            terrainLayer.line(b.px, b.py, b.x, b.y);
        }

        // update previous position
        b.px = b.x;
        b.py = b.y;
    }
}

// ---------- utils ----------
function rndInt(min, max) {
    min = Math.floor(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clampInt(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
}

function clamp(w, v, lo, hi) { // numeric clamp with explicit width arg not used; kept simple
    return Math.max(lo, Math.min(hi, v));
}
