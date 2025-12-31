/**
 * Sample image features at time t by traversing the image along a path.
 * Returns luminance, gradient magnitude, and gradient angle (radians).
 *
 * Notes:
 * - Works in p5.js global mode.
 * - Uses central differences on luminance for gradients (Sobel-free, fast).
 * - Call img.loadPixels() once after the image is loaded (or let this do it).
 *
 * @param {p5.Image} img - Source image.
 * @param {number} t - Time parameter (typically increasing). Any real number.
 * @param {object} [opts]
 * @param {"scan"|"hilbert"|"z"} [opts.traversal="scan"] - Traversal mode.
 * @param {number} [opts.speed=1] - Pixels advanced per unit t (scan/z) or index step (hilbert).
 * @param {number} [opts.padding=1] - Border padding to keep gradient samples in-bounds.
 * @param {number} [opts.hilbertOrder=8] - Order for Hilbert traversal (image will be sampled on 2^order grid).
 * @param {boolean} [opts.ensurePixels=true] - If true, ensures pixels are loaded.
 * @returns {{x:number,y:number,luminance:number,gradMag:number,gradAng:number}}
 */
function sampleImageFeaturesAtTime(img, t, opts = {}) {
    const traversal = opts.traversal ?? "scan";
    const speed = opts.speed ?? 1;
    const padding = opts.padding ?? 1;
    const hilbertOrder = opts.hilbertOrder ?? 8;
    const ensurePixels = opts.ensurePixels ?? true;

    if (!img) throw new Error("img is required");
    if (ensurePixels && (!img.pixels || img.pixels.length === 0)) img.loadPixels();

    // Pick a sampling position (x,y) based on traversal and time t.
    const pos = (traversal === "hilbert")
        ? hilbertPosition(img.width, img.height, t, speed, hilbertOrder, padding)
        : (traversal === "z")
            ? mortonPosition(img.width, img.height, t, speed, padding)
            : scanPosition(img.width, img.height, t, speed, padding);

    const x = pos.x;
    const y = pos.y;

    // Luminance at (x,y)
    const Lc = luminanceAt(img, x, y);

    // Central differences on luminance for gradient
    // dL/dx ~ (L(x+1,y)-L(x-1,y))/2 ; dL/dy ~ (L(x,y+1)-L(x,y-1))/2
    const Lx1 = luminanceAt(img, x + 1, y);
    const Lx0 = luminanceAt(img, x - 1, y);
    const Ly1 = luminanceAt(img, x, y + 1);
    const Ly0 = luminanceAt(img, x, y - 1);

    const dLdx = (Lx1 - Lx0) * 0.5;
    const dLdy = (Ly1 - Ly0) * 0.5;

    const gradMag = Math.hypot(dLdx, dLdy);
    const gradAng = Math.atan2(dLdy, dLdx); // radians, -PI..PI

    return { x, y, luminance: Lc, gradMag, gradAng };

    // ---------------- helpers ----------------

    function clamp(v, lo, hi) {
        return Math.max(lo, Math.min(hi, v));
    }

    function luminanceAt(image, xi, yi) {
        // Clamp to valid pixel indices
        const xx = clamp(Math.round(xi), 0, image.width - 1);
        const yy = clamp(Math.round(yi), 0, image.height - 1);

        // p5.Image pixels are in RGBA order
        const idx = 4 * (yy * image.width + xx);
        const r = image.pixels[idx];
        const g = image.pixels[idx + 1];
        const b = image.pixels[idx + 2];

        // Rec. 709 luma, normalized to 0..1
        return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    }

    function scanPosition(w, h, tt, spd, pad) {
        // Row-major scan over the interior [pad..w-pad-1] x [pad..h-pad-1]
        const iw = Math.max(1, w - 2 * pad);
        const ih = Math.max(1, h - 2 * pad);
        const n = iw * ih;

        // Convert time to an integer index along the scan
        const idx = mod(Math.floor(tt * spd), n);

        const x = pad + (idx % iw);
        const y = pad + Math.floor(idx / iw);
        return { x, y };
    }

    function mortonPosition(w, h, tt, spd, pad) {
        // Z-order curve on a power-of-two grid covering the interior.
        const iw = Math.max(1, w - 2 * pad);
        const ih = Math.max(1, h - 2 * pad);
        const side = nextPow2(Math.max(iw, ih)); // square power-of-two grid
        const n = side * side;

        const idx = mod(Math.floor(tt * spd), n);
        const p = mortonDecode2D(idx);

        // Map from [0..side-1] to interior
        const x = pad + clamp(Math.floor((p.x / (side - 1 || 1)) * (iw - 1)), 0, iw - 1);
        const y = pad + clamp(Math.floor((p.y / (side - 1 || 1)) * (ih - 1)), 0, ih - 1);
        return { x, y };
    }

    function hilbertPosition(w, h, tt, spd, order, pad) {
        // Hilbert curve on a 2^order square grid, mapped to the interior.
        const iw = Math.max(1, w - 2 * pad);
        const ih = Math.max(1, h - 2 * pad);

        const side = 1 << order; // 2^order
        const n = side * side;

        const idx = mod(Math.floor(tt * spd), n);
        const p = hilbertIndexToXY(order, idx);

        // Map from [0..side-1] to interior
        const x = pad + clamp(Math.floor((p.x / (side - 1 || 1)) * (iw - 1)), 0, iw - 1);
        const y = pad + clamp(Math.floor((p.y / (side - 1 || 1)) * (ih - 1)), 0, ih - 1);
        return { x, y };
    }

    function mod(a, n) {
        return ((a % n) + n) % n;
    }

    function nextPow2(v) {
        let p = 1;
        while (p < v) p <<= 1;
        return p;
    }

    // ---- Morton (Z-order) decode: integer -> (x,y) for a square grid ----
    function mortonDecode2D(code) {
        return { x: compact1By1(code), y: compact1By1(code >> 1) };

        function compact1By1(x) {
            x &= 0x55555555;
            x = (x ^ (x >> 1)) & 0x33333333;
            x = (x ^ (x >> 2)) & 0x0f0f0f0f;
            x = (x ^ (x >> 4)) & 0x00ff00ff;
            x = (x ^ (x >> 8)) & 0x0000ffff;
            return x;
        }
    }

    // ---- Hilbert index -> (x,y) for 2^order grid ----
    // Based on standard Hilbert curve algorithms.
    function hilbertIndexToXY(order, index) {
        let x = 0, y = 0;
        let t = index;

        for (let s = 1; s < (1 << order); s <<= 1) {
            const rx = 1 & (t >> 1);
            const ry = 1 & (t ^ rx);
            const rotated = rot(s, x, y, rx, ry);
            x = rotated.x;
            y = rotated.y;
            x += s * rx;
            y += s * ry;
            t >>= 2;
        }
        return { x, y };

        function rot(n, xx, yy, rx, ry) {
            // Rotate/flip a quadrant appropriately.
            if (ry === 0) {
                if (rx === 1) {
                    xx = n - 1 - xx;
                    yy = n - 1 - yy;
                }
                // swap x and y
                const tmp = xx;
                xx = yy;
                yy = tmp;
            }
            return { x: xx, y: yy };
        }
    }
}
