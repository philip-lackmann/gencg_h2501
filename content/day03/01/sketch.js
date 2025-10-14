// Sidereal orbital periods (days) from standard references (NASA/JPL).
const PLANETS = [
    { name: "sun",      diameter: 1392700, color: "#FEC601", periodDays: null }, // no orbit
    { name: "mercury",  diameter: 4879,    color: "#B1B1B1", periodDays: 87.969 },
    { name: "venus",    diameter: 12104,   color: "#EED28A", periodDays: 224.701 },
    { name: "earth",    diameter: 12742,   color: "#3DA5D9", periodDays: 365.256 }, // sidereal year
    { name: "mars",     diameter: 6779,    color: "#C1440E", periodDays: 686.980 },
    { name: "jupiter",  diameter: 139820,  color: "#D2B48C", periodDays: 4332.59 },
    { name: "saturn",   diameter: 116460,  color: "#E5C07B", periodDays: 10759.22 },
    { name: "uranus",   diameter: 50724,   color: "#7FDBFF", periodDays: 30688.5 },
    { name: "neptune",  diameter: 49244,   color: "#4666FF", periodDays: 60182.0 },
];

let x = window.innerWidth / 2;
let y = window.innerHeight / 2;

const planetScale = 1;   // extra visual scaling for diameters
const SUN_DIAMETER = y/10;  // px
const ORBIT_OFFSET = SUN_DIAMETER*2;  // px between orbits

// Animation mapping: 1 Earth year -> 1 second on screen
const EARTH_YEAR_SECONDS = 1;
const EARTH_YEAR_DAYS = 365.256;

function setup() {
    createCanvas(windowWidth, windowHeight);
}

function draw() {
    background(0);

    // sun
    noStroke();
    fill(PLANETS[0].color);
    circle(x, y, SUN_DIAMETER);

    const sun = PLANETS[0];

    for (let i = 1; i < PLANETS.length; i++) {
        const p = PLANETS[i];

        // orbit diameter spacing
        const orbitDiameterPx = ORBIT_OFFSET * i + ORBIT_OFFSET;

        // scale planet size relative to the sun (circle() takes DIAMETER)
        let planetDiameterPx = (p.diameter / sun.diameter) * SUN_DIAMETER * planetScale;
        // keep tiny planets visible
        planetDiameterPx = max(SUN_DIAMETER/2, planetDiameterPx);
        // let planetDiameterPx = SUN_DIAMETER/5;

        // compute orbit duration in seconds on-screen
        const orbitSeconds =
            EARTH_YEAR_SECONDS * (p.periodDays / EARTH_YEAR_DAYS);

        drawOrbit(orbitSeconds, orbitDiameterPx, planetDiameterPx, p.color);
    }
}

function drawOrbit(orbitSeconds, orbitDiameter, planetDiameter, planetColor) {
    // angle advances with time
    const t = (millis() / 1000) / orbitSeconds;
    const angle = t * TWO_PI;

    // orbit path
    noFill();
    stroke(255);
    strokeWeight(1);
    circle(x, y, orbitDiameter);

    // position on orbit
    const r = orbitDiameter / 2;
    const ex = x + r * cos(angle);
    const ey = y + r * sin(angle);

    // planet
    noStroke();
    fill(planetColor);
    circle(ex, ey, planetDiameter);
}
