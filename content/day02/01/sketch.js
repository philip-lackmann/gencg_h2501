// Matter aliases
const Engine = Matter.Engine;
const World = Matter.World;
const Bodies = Matter.Bodies;
const Constraint = Matter.Constraint;
const Composite = Matter.Composite;

// ------------ Grid settings ------------
const GRID_ROWS = 6;   // try 2–5
const GRID_COLS = 12;   // try 2–6

// ------------ Rendering symmetry ------------
const symmetryCount = 12; // 1 disables kaleidoscope
const symmetryOffset = 0;

// ------------ Base physics config ------------
const baseCfg = {
    r1: 4,       // bob1 radius (px)
    r2: 4,       // bob2 radius (px)
    mass1: 100.0, // heavier first bob adds inertia
    mass2: 1.0,
    air: 0.0025,
    stiff: 0.999,
    gravity: 0.7,
    len: 128,
    shouldShowPendulum: false
};

// add/subtract those values randomly
const rndCfg = {
    mass1: 50.0,
    mass2: 1.0,
    air: 0.0025,
    // stiff: 0.999,
    gravity: 0.2,
}

let colorCfg;

// One engine/world for everything
let engine, world;

// A "system" = one double pendulum in one grid cell
// { cx, cy, L1, L2, bob1, bob2, link1, link2, trail: [] }
let systems = [];
const maxTrail = 300; // per system (keep modest for performance)

// functions to shift color for each system
let shiftStrokes = [];

// -------------- p5 lifecycle --------------
function setup() {
    pixelDensity(1);
    createCanvas(windowWidth, windowHeight);
    resetSystems();

    colorCfg = {
        color1: color(107, 255, 184, 200),
        color2: color(255, 92, 119, 200),
    };

    for (let i = 0; i < systems.length; i++) {
        const colorCycleCount = 6;
        let cyclePos = i % colorCycleCount; // find position within the cycle
        let t = cyclePos / colorCycleCount; // normalize to [0,1]
        shiftStrokes[i] = shiftStroke(colorCfg.color1, colorCfg.color2, 0.01, t);
    }
}

function draw() {
    background(20, 20, 20);

    // Fixed timestep
    Engine.update(engine, 1000 / 120);

    // Update trails & draw each system
    for (let i = 0; i < systems.length; i++) {
        const s = systems[i];

        // Record trail from second bob
        s.trail.push({ x: s.bob2.position.x, y: s.bob2.position.y });
        if (s.trail.length > maxTrail) s.trail.shift();

        if (baseCfg.shouldShowPendulum) {
            // Rods
            drawLinkPointToBody(s.cx, s.cy, s.bob1);
            drawLink(s.bob1, s.bob2);

            // Pivot + bobs
            drawPivot(s.cx, s.cy);
            drawBob(s.bob1, baseCfg.r1);
            drawBob(s.bob2, baseCfg.r2);
        }
    }

    // Trails on top (looks nicer)
    for (let i = 0; i < systems.length; i++) {
        drawTrailKaleidoscopeFor(systems[i], i);
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    resetSystems();
}

function makeSystem(cx, cy, L1, L2) {
    // Slight offset from vertical so it starts moving
    const a = Math.PI / 2 - 0.05;

    const p1 = { x: cx + L1 * Math.sin(a), y: cy + L1 * Math.cos(a) };
    const p2 = { x: p1.x + L2 * Math.sin(a * 1.15), y: p1.y + L2 * Math.cos(a * 1.15) };

    const bob1 = Bodies.circle(p1.x, p1.y, baseCfg.r1, {
        frictionAir: baseCfg.air, mass: baseCfg.mass1, restitution: 0.0, density: 0.0015,
    });

    const bob2 = Bodies.circle(p2.x, p2.y, baseCfg.r2, {
        frictionAir: baseCfg.air, mass: baseCfg.mass2, restitution: 0.0, density: 0.0015,
    });

    // First rod: fixed world-space pivot at (cx, cy)
    const link1 = Constraint.create({
        bodyA: null,
        pointA: { x: cx, y: cy },
        bodyB: bob1,
        pointB: { x: 0, y: 0 },
        length: L1,
        stiffness: baseCfg.stiff,
    });

    // Second rod between bobs
    const link2 = Constraint.create({
        bodyA: bob1, pointA: { x: 0, y: 0 },
        bodyB: bob2, pointB: { x: 0, y: 0 },
        length: L2,
        stiffness: baseCfg.stiff,
    });

    World.add(world, [bob1, bob2, link1, link2]);

    return { cx, cy, L1, L2, bob1, bob2, link1, link2, trail: [] };
}

function resetSystems() {
    if (engine) Composite.clear(engine.world, false);

    engine = Engine.create({ enableSleeping: false });
    world = engine.world;
    world.gravity.y = baseCfg.gravity;

    systems = [];

    // Compute cell size
    // Rod lengths scaled to cell (leave margin)
    const len = baseCfg.len;
    const L1 = len * 0.5;
    const L2 = len * 0.5;

    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
            const offset = (r % 2) * len;
            const cx = c * (len - 32) * 2;
            const cy = r * (len - 32) * 2;
            const sys = makeSystem(cx - offset, cy, L1, L2);
            systems.push(sys);
        }
    }
}

// -------------- Drawing helpers --------------
function drawLinkPointToBody(px, py, body) {
    stroke(220);
    strokeWeight(1.5);
    line(px, py, body.position.x, body.position.y);
}

function drawLink(bodyA, bodyB) {
    stroke(220);
    strokeWeight(1.5);
    line(bodyA.position.x, bodyA.position.y, bodyB.position.x, bodyB.position.y);
}

function drawBob(body, radius) {
    noStroke();
    const g = drawingContext;
    g.save();
    g.shadowColor = 'rgba(190, 230, 255, 0.25)';
    g.shadowBlur = 8;
    fill(180, 225, 255);
    circle(body.position.x, body.position.y, radius * 2);
    g.restore();
    fill(28, 100, 242);
    circle(body.position.x, body.position.y, radius * 1.2);
}

function drawPivot(x, y) {
    noStroke();
    fill(220);
    circle(x, y, 4);
}

// Rotate N copies of one system's trail around its fixed pivot
function drawTrailKaleidoscopeFor(sys, i) {
    const tr = sys.trail;
    if (tr.length < 2) return;

    const ox = sys.cx, oy = sys.cy;

    // clear canvas to create sense of depth / overlapping shapes
    fill(20, 20, 20);
    noStroke();
    circle(sys.cx, sys.cy, baseCfg.len * 2);

    shiftStrokes[i]();
    noFill();
    strokeWeight(2);

    for (let k = 0; k < Math.max(1, symmetryCount); k++) {
        const theta = (TWO_PI * k) / Math.max(1, symmetryCount) + symmetryOffset;

        beginShape();
        for (let i = 0; i < tr.length; i++) {
            const pt = tr[i];
            const rx = pt.x - ox;
            const ry = pt.y - oy;
            const x = ox + (rx * Math.cos(theta) - ry * Math.sin(theta));
            const y = oy + (rx * Math.sin(theta) + ry * Math.cos(theta));
            vertex(x, y);
        }
        endShape();
    }
}
