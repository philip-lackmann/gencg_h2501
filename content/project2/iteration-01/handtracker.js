const FINGERS = [
    {name: 'thumb', index: 0, prefix: 'thumb-'},
    {name: 'index', index: 1, prefix: 'index-finger-'},
    {name: 'middle', index: 2, prefix: 'middle-finger-'},
    {name: 'ring', index: 3, prefix: 'ring-finger-'},
    {name: 'pinky', index: 4, prefix: 'pinky-finger-'}
];

function makeFingerState() {
    return {
        // Angle-based curl calibration
        angleStraight: (20 * Math.PI) / 180,
        angleMaxCurl: (130 * Math.PI) / 180
    };
}

AFRAME.registerComponent('hand-params', {
    schema: {
        handedness: {default: 'any'}, // 'left', 'right', 'any'

        // Debug
        debug: {default: false},
        debugRate: {default: 10}
    },

    init: function () {
        this.refSpace = null;
        this.frame = null;

        this.fingerState = {};
        for (const f of FINGERS) {
            this.fingerState[f.name] = makeFingerState();
        }

        // Public output (updated every frame)
        this.fingerParams = []; // { fingerIndex, fingerName, curl, angleRad }

        this._dbg = {
            lastUpdate: 0,
            overlay: null
        };

        if (this.data.debug) this._ensureOverlay();
    },

    remove: function () {
        if (this._dbg.overlay) this._dbg.overlay.remove();
    },

    tick: function (time) {
        const scene = this.el.sceneEl;
        const renderer = scene && scene.renderer;
        if (!renderer || !renderer.xr) return;

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

            for (const f of FINGERS) {
                const result = this.computeFingerCurl(inputSource.hand, f);
                if (result) this.fingerParams.push(result);
            }
        }

        if (this.data.debug) this._updateOverlay(time);
    },

    computeFingerCurl: function (hand, fingerDef) {
        const prefix = fingerDef.prefix;
        const state = this.fingerState[fingerDef.name];

        const meta = hand.get(prefix + 'metacarpal');
        const prox = hand.get(prefix + 'phalanx-proximal');
        const inter = hand.get(prefix + 'phalanx-intermediate');
        const tip = hand.get(prefix + 'tip');

        const metaPose = meta && this.frame.getJointPose(meta, this.refSpace);
        const proxPose = prox && this.frame.getJointPose(prox, this.refSpace);
        const interPose = inter && this.frame.getJointPose(inter, this.refSpace);
        const tipPose = tip && this.frame.getJointPose(tip, this.refSpace);

        if (!metaPose || !proxPose || !tipPose) return null;

        const metaPos = metaPose.transform.position;
        const proxPos = proxPose.transform.position;
        const interPos = interPose ? interPose.transform.position : tipPose.transform.position;

        const v1 = subVec(metaPos, proxPos);
        const v2 = subVec(interPos, proxPos);

        const angle = angleBetween(v1, v2);

        // Auto-calibration
        state.angleStraight = Math.min(state.angleStraight, angle);
        state.angleMaxCurl = Math.max(state.angleMaxCurl, angle);

        const curl = normalize01(angle, state.angleStraight, state.angleMaxCurl);

        return {
            fingerIndex: fingerDef.index,
            fingerName: fingerDef.name,
            curl,
            angleRad: angle
        };
    },

    // ---------------- Debug overlay ----------------

    _ensureOverlay: function () {
        const el = document.createElement('div');
        el.style.cssText = `
      position:fixed;
      top:10px;
      left:10px;
      z-index:9999;
      font:12px monospace;
      background:rgba(0,0,0,0.85);
      color:#fff;
      padding:10px;
      border-radius:6px;
      white-space:pre;
      pointer-events:none;
    `;
        document.body.appendChild(el);
        this._dbg.overlay = el;
    },

    _updateOverlay: function (time) {
        const interval = 1000 / this.data.debugRate;
        if (time - this._dbg.lastUpdate < interval) return;
        this._dbg.lastUpdate = time;

        const lines = ['hand-params (curl only)\n'];

        for (const f of this.fingerParams) {
            lines.push(
                `${f.fingerName.padEnd(6)} ` +
                `curl:${f.curl.toFixed(2)} ` +
                `angle:${(f.angleRad * 180 / Math.PI).toFixed(0)}°`
            );
        }

        this._dbg.overlay.textContent = lines.join('\n');
    }
});

// ---------------- Math helpers ----------------

function subVec(a, b) {
    return {x: a.x - b.x, y: a.y - b.y, z: a.z - b.z};
}

function dot(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

function mag(v) {
    return Math.hypot(v.x, v.y, v.z);
}

function angleBetween(a, b) {
    const ma = mag(a), mb = mag(b);
    if (!ma || !mb) return 0;
    let c = dot(a, b) / (ma * mb);
    return Math.acos(Math.max(-1, Math.min(1, c)));
}

function normalize01(value, min, max) {
    if (max <= min) return 0;
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
}
