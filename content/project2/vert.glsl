#ifdef GL_ES
precision mediump float;
#endif

attribute vec3 aPosition;
attribute vec3 aNormal;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;

varying vec3 vPosObj;
varying vec3 vNormalView;

void main() {
  vPosObj = aPosition;
  vNormalView = normalize(uNormalMatrix * aNormal);

  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
}
