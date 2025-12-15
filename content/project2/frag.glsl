/* This animation is the material of my first youtube tutorial about creative
   coding, which is a video in which I try to introduce programmers to GLSL
   and to the wonderful world of shaders, while also trying to share my recent
   passion for this community.
                                       Video URL: https://youtu.be/f4s1h2YETNY
*/

#ifdef GL_ES
precision mediump float;
#endif

uniform float uTime;
uniform float uScale;
uniform float uSpeed;
uniform float uWarp;
uniform float uPaletteMix;   // 0 = paletteA, 1 = paletteB
uniform float uPaletteShift; // keep this if you still want subtle phase shifting
uniform float uContrast;
uniform float uDetail;

varying vec3 vPosObj;
varying vec3 vNormalView;

// https://iquilezles.org/articles/palettes/
vec3 paletteA(float t) {
  vec3 a = vec3(0.5);
  vec3 b = vec3(0.5);
  vec3 c = vec3(1.0);
  vec3 d = vec3(0.263, 0.416, 0.557) + uPaletteShift;
  return a + b * cos(6.28318 * (c * t + d));
}

vec3 paletteB(float t) {
  // Warmer / higher-contrast vibe
  vec3 a = vec3(0.45, 0.40, 0.55);
  vec3 b = vec3(0.55, 0.45, 0.35);
  vec3 c = vec3(1.00, 1.00, 1.00);
  vec3 d = vec3(0.00, 0.20, 0.40) - uPaletteShift * 0.5;
  return a + b * cos(6.28318 * (c * t + d));
}

vec3 paletteMix(float t) {
  return mix(paletteA(t), paletteB(t), clamp(uPaletteMix, 0.0, 1.0));
}

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
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

vec3 shade(vec2 uvBase) {

  float time = uTime * uSpeed;

  // --- domain warp happens ONCE ---
  float freq = mix(1.5, 10.0, clamp(uDetail, 0.0, 1.0));
  float amp  = mix(0.00, 0.35, clamp(uDetail, 0.0, 1.0));

  vec2 warp = vec2(
    noise2(uvBase * freq + time * 0.20),
    noise2(uvBase * freq - time * 0.17)
  ) - 0.5;

  vec2 uv0 = uvBase + amp * warp;

  // --- iterative folding uses a working copy ---
  vec2 uv = uv0;
  vec3 finalColor = vec3(0.0);

  for (float i = 0.0; i < 4.0; i++) {
    uv = fract(uv * (1.5 + uWarp)) - 0.5;

    float d = length(uv) * exp(-length(uv0));

    vec3 col = paletteMix(length(uv0) + i * 0.4 + time * 0.4);

    d = sin(d * 8.0 + time) / 8.0;
    d = abs(d);
    d = max(d, 1e-4);
    d = pow(0.01 / d, 1.2 + uContrast);

    finalColor += col * d;
  }

  return finalColor;
}

void main() {
  vec3 p = vPosObj * uScale;

  // Triplanar projection
  vec2 uvX = p.yz;
  vec2 uvY = p.xz;
  vec2 uvZ = p.xy;

  vec3 n = normalize(vNormalView);
  vec3 w = pow(abs(n), vec3(4.0));
  w /= (w.x + w.y + w.z + 1e-6);

  vec3 color =
      shade(uvX) * w.x +
      shade(uvY) * w.y +
      shade(uvZ) * w.z;

  gl_FragColor = vec4(color, 1.0);
}
