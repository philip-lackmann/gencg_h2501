const FINGERS = [
    { name: 'thumb',  index: 0, prefix: 'thumb-' },
    { name: 'index',  index: 1, prefix: 'index-finger-' },
    { name: 'middle', index: 2, prefix: 'middle-finger-' },
    { name: 'ring',   index: 3, prefix: 'ring-finger-' },
    { name: 'pinky',  index: 4, prefix: 'pinky-finger-' }
];

function makeFingerState() {
    return {
        // For curl, we map angle [angleStraight, angleMaxCurl] -> [0, 1]
        angleStraight: (20 * Math.PI) / 180,   // ~20° considered "straight-ish"
        angleMaxCurl:  (130 * Math.PI) / 180,  // ~130° considered "fully curled"

        // For distance to palm we'll auto-calibrate
        minDist: Infinity,
        maxDist: 0
    };
}

AFRAME.registerComponent('hand-params', {
    schema: {
        handedness: { default: 'any' } // 'left', 'right', or 'any'
    },

    init: function () {
        this.refSpace = null;
        this.frame = null;

        // Per-finger calibration state
        this.fingerState = {};
        for (const f of FINGERS) {
            this.fingerState[f.name] = makeFingerState();
        }

        // Public data: updated every frame
        this.fingerParams = []; // { fingerIndex, curl, distanceToPalm }[]
    },

    tick: function () {
        const scene = this.el.sceneEl;
        const renderer = scene.renderer;
        const session = renderer.xr.getSession();
        if (!session || !scene.frame) return;

        if (!this.refSpace) {
            this.refSpace = renderer.xr.getReferenceSpace();
            if (!this.refSpace) return;
        }

        this.frame = scene.frame;
        this.fingerParams.length = 0;

        for (const inputSource of session.inputSources) {
            if (!inputSource.hand) continue;
            if (this.data.handedness !== 'any' &&
                inputSource.handedness !== this.data.handedness) continue;

            const hand = inputSource.hand;

            // Palm reference position
            const wristSpace = hand.get('wrist');
            if (!wristSpace) continue;
            const wristPose = this.frame.getJointPose(wristSpace, this.refSpace);
            if (!wristPose) continue;
            const palmPos = wristPose.transform.position;

            for (const f of FINGERS) {
                const result = this.computeFingerParams(hand, f, palmPos);
                if (!result) continue;
                this.fingerParams.push(result);
            }
        }

        // Example: feed into your drawing machine here
        // this.el.emit('hand-params-updated', { fingers: this.fingerParams });
    },

    computeFingerParams: function (hand, fingerDef, palmPos) {
        const prefix = fingerDef.prefix;
        const state = this.fingerState[fingerDef.name];

        // Get relevant joints
        // For thumb, there is no "intermediate", so we’ll adjust.
        const metaSpace  = hand.get(prefix + 'metacarpal');           // thumb-metacarpal
        const proxSpace  = hand.get(prefix + 'phalanx-proximal');     // ...-phalanx-proximal
        const interSpace = hand.get(prefix + 'phalanx-intermediate'); // except thumb (probably null)
        const tipSpace   = hand.get(prefix + 'tip');                  // ...-tip

        const metaPose  = metaSpace  && this.frame.getJointPose(metaSpace,  this.refSpace);
        const proxPose  = proxSpace  && this.frame.getJointPose(proxSpace,  this.refSpace);
        const interPose = interSpace && this.frame.getJointPose(interSpace, this.refSpace);
        const tipPose   = tipSpace   && this.frame.getJointPose(tipSpace,   this.refSpace);

        if (!metaPose || !proxPose || !tipPose) return null;

        const metaPos  = metaPose.transform.position;
        const proxPos  = proxPose.transform.position;
        const interPos = interPose ? interPose.transform.position : null;
        const tipPos   = tipPose.transform.position;

        // ---------- CURL (0..1) ----------
        // Main idea: angle at prox between (prox->meta) and (prox->inter or prox->tip)
        const v1 = subVec(metaPos, proxPos);
        const v2 = subVec(interPos || tipPos, proxPos);

        const angle = angleBetween(v1, v2); // radians

        // Optional: auto-tune straight/curl angles a bit by tracking min/max seen
        // (You can comment this out if you want fixed thresholds)
        state.angleStraight = Math.min(state.angleStraight, angle);
        state.angleMaxCurl  = Math.max(state.angleMaxCurl,  angle);

        const curl = normalize01(angle, state.angleStraight, state.angleMaxCurl);

        // ---------- DISTANCE FROM PALM (0..1) ----------
        const d = dist(palmPos, tipPos);

        // Auto-calibrate per finger
        if (d < state.minDist) state.minDist = d;
        if (d > state.maxDist) state.maxDist = d;

        const distanceToPalm = normalize01(d, state.minDist, state.maxDist);

        return {
            fingerIndex: fingerDef.index,
            curl,
            distanceToPalm
        };
    }
});

function subVec(a, b) {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function dot(a, b) {
    return a.x*b.x + a.y*b.y + a.z*b.z;
}

function mag(v) {
    return Math.hypot(v.x, v.y, v.z);
}

function angleBetween(a, b) {
    const ma = mag(a), mb = mag(b);
    if (!ma || !mb) return 0;
    let c = dot(a, b) / (ma * mb);
    c = Math.max(-1, Math.min(1, c));
    return Math.acos(c); // radians
}

function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function normalize01(value, minValue, maxValue) {
    if (maxValue <= minValue) return 0;
    const t = (value - minValue) / (maxValue - minValue);
    return Math.max(0, Math.min(1, t));
}
