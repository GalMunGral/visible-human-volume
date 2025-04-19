#version 300 es
precision mediump sampler3D;
precision mediump float;

#define FLT_MAX 3.402823466e+38
#define M_PI 3.1415926535897932384626433832795

uniform vec2 viewport;
uniform mat3 R_inv;
uniform vec3 eye;
uniform vec3 forward;
uniform vec3 up;
uniform vec3 right;
uniform float focus;
uniform float fov;
uniform float value;

uniform sampler3D volume;


out vec4 fragColor;

vec3 viridis_quintic(float x) {
	x = clamp(x, 0.0, 1.0);
	vec4 x1 = vec4( 1.0, x, x * x, x * x * x ); // 1 x x2 x3
	vec4 x2 = x1 * x1.w * x; // x4 x5 x6 x7
	return vec3(
		dot( x1.xyzw, vec4( +0.280268003, -0.143510503, +2.225793877, -14.815088879 ) ) + dot( x2.xy, vec2( +25.212752309, -11.772589584 ) ),
		dot( x1.xyzw, vec4( -0.002117546, +1.617109353, -1.909305070, +2.701152864 ) ) + dot( x2.xy, vec2( -1.685288385, +0.178738871 ) ),
		dot( x1.xyzw, vec4( +0.300805501, +2.614650302, -12.019139090, +28.933559110 ) ) + dot( x2.xy, vec2( -33.491294770, +13.762053843 ) ) );
}


vec3 plasma_quintic(float x) {
	x = clamp(x, 0.0, 1.0);
	vec4 x1 = vec4( 1.0, x, x * x, x * x * x ); // 1 x x2 x3
	vec4 x2 = x1 * x1.w * x; // x4 x5 x6 x7
	return vec3(
		dot( x1.xyzw, vec4( +0.063861086, +1.992659096, -1.023901152, -0.490832805 ) ) + dot( x2.xy, vec2( +1.308442123, -0.914547012 ) ),
		dot( x1.xyzw, vec4( +0.049718590, -0.791144343, +2.892305078, +0.811726816 ) ) + dot( x2.xy, vec2( -4.686502417, +2.717794514 ) ),
		dot( x1.xyzw, vec4( +0.513275779, +1.580255060, -5.164414457, +4.559573646 ) ) + dot( x2.xy, vec2( -1.916810682, +0.570638854 ) ) );
}

void main() {
  float scale = (2.0 * focus * tan(fov / 2.0)) /  max(viewport.x, viewport.y);
  float x = (gl_FragCoord.x - viewport.x / 2.0) * scale;
  float y = (gl_FragCoord.y - viewport.y / 2.0) * scale;

  vec3 C = vec3(0.0);
  float A = 0.0;

  float s = 1.0 / 512.;
  float sx = 512. * s;
  float sy = 512. * s;
  float sz = 234. * s;
  int steps = 200;

  vec3 p = eye;
  vec3 d = 2.0 / float(steps) * normalize(x * right + y * up + focus * forward);

  for(int i = 0; i < steps; ++i) {
    if(abs(p.x) < 0.25 * sx && abs(p.y) < 0.4 * sy && abs(p.z) < sz) {
      vec4 color = texture(volume, vec3(p.x / (2.0 * sx) + 0.5, p.y / (2.0 * sy) + 0.5, p.z / (2.0 * sz) + 0.5));

      const float delta = 0.25;
      float a = 0.075;

      float t = clamp(abs(color.r - value) / delta, 0.0, 1.0);
      a *= (1.0 - t) * 1.0 + t * 0.0;

      C += (1.0 - A) * a * vec3(viridis_quintic(0.2 + 2.0 * color.r));
      A += (1.0 - A) * a;
    }
    p += d;
  }
  fragColor = vec4(C, 1.0);
}
