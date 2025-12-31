/* Credits originally go to kishimisu: https://youtu.be/f4s1h2YETNY

   Performance-lean coral <-> cloud/fluid morph.
   UPDATE:
   - Palette A redesigned for much stronger contrast and saturation extremes
   - Palette B unchanged
*/

#ifdef GL_ES
precision mediump float;
#endif

uniform float uTime;
uniform float uScale;
uniform float uSpeed;
uniform float uWarp;
uniform float uPaletteMix;    // 0 = paletteA, 1 = paletteB
uniform float uPaletteShift;
uniform float uContrast;
uniform float uDetail;
uniform float uMorph;

varying vec3 vPosObj;
varying vec3 vNormalView;

// ------------------------------
// Palettes (IQ)
// ------------------------------

// NEW: high-contrast, high-saturation palette
vec3 paletteA(float t) {
  // Darker baseline → stronger shadows
  vec3 a = vec3(0.18, 0.14, 0.22);

  // Large amplitude → vivid highlights
  vec3 b = vec3(0.90, 0.75, 1.00);

  // Per-channel frequency offsets for stronger hue separation
  vec3 c = vec3(1.00, 1.15, 0.85);

  // Phase offsets push channels apart
  vec3 d = vec3(0.15, 0.45, 0.75) + uPaletteShift;

  return a + b * cos(6.28318 * (c * t + d));
}

// UNCHANGED
vec3 paletteB(float t) {
  vec3 a = vec3(0.45, 0.40, 0.55);
  vec3 b = vec3(0.55, 0.45, 0.35);
  vec3 c = vec3(1.00);
  vec3 d = vec3(0.00, 0.20, 0.40) - uPaletteShift * 0.5;
  return a + b * cos(6.28318 * (c * t + d));
}

vec3 paletteMix(float t) {
  return mix(paletteA(t), paletteB(t), clamp(uPaletteMix, 0.0, 1.0));
}

// ------------------------------
// Hash / Noise
// ------------------------------
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

vec2 hash22(vec2 p) {
  float n = hash21(p);
  return vec2(n, hash21(p + n + 19.19));
}

float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// 3-octave fbm
float fbm3(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.7, -1.2, 1.2, 1.7);
  for (int i = 0; i < 3; i++) {
    v += a * noise2(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

float ridgedFbm3(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.7, -1.1, 1.1, 1.7);
  for (int i = 0; i < 3; i++) {
    float n = noise2(p);
    n = 1.0 - abs(2.0 * n - 1.0);
    n *= n;
    v += a * n;
    p = m * p;
    a *= 0.5;
  }
  return clamp(v, 0.0, 1.0);
}

vec2 warp2(vec2 p, float t, float strength) {
  float w1 = fbm3(p * 1.3 + vec2(0.0,  7.2) + t * 0.06);
  float w2 = fbm3(p * 1.3 + vec2(9.2, -3.4) - t * 0.07);
  return p + strength * (vec2(w1, w2) - 0.5);
}

// ------------------------------
// Nested fBm warp
// ------------------------------
vec2 fbmVec2(vec2 p) {
  return vec2(
  fbm3(p + vec2(13.1, 7.7)),
  fbm3(p + vec2( 9.2, 2.8))
  ) - 0.5;
}

vec2 nestedWarp(vec2 p, float t, float strength, float freq) {
  vec2 q = p + fbmVec2(p * freq + t * 0.10) * strength;
  vec2 r = q + fbmVec2(q * (freq * 1.9) - t * 0.12) * (strength * 0.75);
  vec2 s = r + fbmVec2(r * (freq * 3.1) + t * 0.08) * (strength * 0.45);
  return s;
}

// ------------------------------
// Voronoi
// ------------------------------
struct VoronoiResult {
  float F1;
  float F2;
  vec2 cell;
};

VoronoiResult voronoiFast(vec2 p) {
  vec2 g = floor(p);
  vec2 f = fract(p);

  float F1 = 1e9;
  float F2 = 1e9;
  vec2 bestCell = vec2(0.0);

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 o = vec2(float(x), float(y));
      vec2 r = hash22(g + o);
      vec2 d = o + r - f;
      float dist = dot(d, d);
      if (dist < F1) { F2 = F1; F1 = dist; bestCell = g + o; }
      else if (dist < F2) { F2 = dist; }
    }
  }

  VoronoiResult res;
  res.F1 = F1;
  res.F2 = F2;
  res.cell = bestCell;
  return res;
}

// ------------------------------
// Shading
// ------------------------------
vec3 shade(vec2 uvBase) {
  float time = uTime * uSpeed;

  float detail = clamp(uDetail, 0.0, 1.0);
  float morph  = smoothstep(0.0, 1.0, clamp(uMorph, 0.0, 1.0));

  float baseFreq = mix(1.2, 5.0, detail);
  float baseAmp  = mix(0.02, 0.35, detail);

  vec2 uv0 = uvBase;
  uv0 += (vec2(
  fbm3(uv0 * baseFreq + time * 0.06),
  fbm3(uv0 * baseFreq - time * 0.05)
  ) - 0.5) * baseAmp;

  float ws = mix(0.03, 0.55, detail) * (0.35 + uWarp);

  vec2 pc = warp2(warp2(uv0, time, ws), time + 9.0, ws * 0.65);

  vec2 pf = nestedWarp(
    uv0,
    time,
    ws * (1.6 + 1.2 * morph),
    mix(1.5, 4.0, detail)
  );

  vec2 pm = mix(pc, pf, morph);

  float cellScale = mix(2.0, 10.0, detail);
  VoronoiResult v = voronoiFast(pm * cellScale + time * 0.05);

  float edge = max(v.F2 - v.F1, 0.0);

  float membrane = smoothstep(mix(0.020, 0.060, morph), 0.0, edge);
  membrane = pow(membrane, mix(1.6, 1.1, morph));
  membrane *= mix(0.75, 0.55, morph);

  float micro = ridgedFbm3(pm * 5.0 + v.cell * 0.03);

  float cloud = fbm3(pm * 2.2 + time * 0.03);
  float billow = 1.0 - abs(2.0 * cloud - 1.0);
  float fluidBody = smoothstep(0.15, 0.85, billow);

  float f1 = sqrt(max(v.F1, 1e-8));
  float interior = pow(1.0 - smoothstep(0.20, 0.55, f1), 0.9);
  float tissue = interior * (0.55 + 0.75 * micro);

  float coralLike = membrane * (0.45 + 0.85 * micro) + tissue * 0.55;
  float fluidLike = max(membrane * (0.55 + 0.35 * micro), fluidBody * 0.80);
  fluidLike = max(fluidLike, tissue * 0.35);

  float baseField = mix(coralLike, fluidLike, morph);
  baseField *= mix(1.10, 0.95, morph);

  float edgeSignal = 1.0 / (1.0 + mix(80.0, 18.0, morph) * edge);
  float palBase = 0.55 * cloud + 0.35 * edgeSignal + 0.35 * micro;

  vec3 col = vec3(0.0);
  for (float i = 0.0; i < 3.0; i++) {
    float palT = palBase * 1.6 + i * 0.55 + time * 0.12;
    float d = pow(max(baseField, 1e-4), 1.05 + uContrast);
    col += paletteMix(palT) * d * 2.2;
  }

  return col / (1.0 + col);
}

// ------------------------------
// Main (triplanar)
// ------------------------------
void main() {
  vec3 p = vPosObj * uScale;

  vec3 n = normalize(vNormalView);
  vec3 w = pow(abs(n), vec3(4.0));
  w /= (w.x + w.y + w.z + 1e-6);

  vec3 color =
  shade(p.yz) * w.x +
  shade(p.xz) * w.y +
  shade(p.xy) * w.z;

  gl_FragColor = vec4(color, 1.0);
}
