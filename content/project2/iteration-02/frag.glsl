precision mediump float;

uniform float uLerp;

void main() {
  vec3 red  = vec3(1.0, 0.0, 0.0);
  vec3 blue = vec3(0.0, 0.0, 1.0);

  vec3 c = mix(red, blue, clamp(uLerp, 0.0, 1.0));
  gl_FragColor = vec4(c, 1.0);
}
