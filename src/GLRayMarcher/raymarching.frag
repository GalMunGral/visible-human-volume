#version 300 es
precision highp sampler3D;
precision highp float;

const float DRAW_DIST = 1.0;
const int RM_STEPS = 200;
const float RM_STEP_SIZE = DRAW_DIST / float(RM_STEPS);
const float ALPHA = 0.2;

uniform vec2 viewport;

uniform sampler3D data;
uniform vec3 volume_dims;

uniform vec3 camera_pos;
uniform vec3 camera_forward;
uniform vec3 camera_right;
uniform vec3 camera_up;
uniform float screen_dist;
uniform float fovy;

out vec4 fragColor;

float clamp01(float v) { return clamp(v, 0.0, 1.0); }

/**
 * Copied from https://www.shadertoy.com/view/XtGGzG
 */
vec3 viridis_quintic(float x) {
  x = clamp01(x);
  vec4 x1 = vec4(1.0, x, x * x, x * x * x);
  vec4 x2 = x1 * x1.w * x;
  return vec3(dot(x1.xyzw, vec4(+0.280268003, -0.143510503, +2.225793877,
                                -14.815088879)) +
                  dot(x2.xy, vec2(+25.212752309, -11.772589584)),
              dot(x1.xyzw, vec4(-0.002117546, +1.617109353, -1.909305070,
                                +2.701152864)) +
                  dot(x2.xy, vec2(-1.685288385, +0.178738871)),
              dot(x1.xyzw, vec4(+0.300805501, +2.614650302, -12.019139090,
                                +28.933559110)) +
                  dot(x2.xy, vec2(-33.491294770, +13.762053843)));
}

vec3 ray() {
  float screen_height = 2.0 * screen_dist * tan(fovy / 2.0);
  float units_per_pixel = screen_height / viewport.y;
  float x = (gl_FragCoord.x - viewport.x / 2.0) * units_per_pixel;
  float y = (gl_FragCoord.y - viewport.y / 2.0) * units_per_pixel;
  return normalize(x * camera_right + y * camera_up +
                   screen_dist * camera_forward);
}

bool in_bounds(vec3 p, vec3 dims) {
  return (abs(p.x) < 0.5 * dims.x && abs(p.y) < 0.5 * dims.y &&
          abs(p.z) < 0.5 * dims.z);
}

vec3 get_texcoords(vec3 p, vec3 dims) {
  return vec3(p.x / dims.x + 0.5, p.y / dims.y + 0.5, p.z / dims.z + 0.5);
}
void main() {
  vec4 accumulated = vec4(0.0);
  vec3 cur_p = camera_pos;
  vec3 rm_step = RM_STEP_SIZE * ray();

  for (int i = 0; i < RM_STEPS; ++i) {
    if (in_bounds(cur_p, volume_dims)) {
      vec3 texcoords = get_texcoords(cur_p, volume_dims);
      float value = texture(data, texcoords).r;
      vec3 c = viridis_quintic(value);
      float a = mix(0.0, ALPHA,  value);
      a *= 1.0 - accumulated.a;
      accumulated.rgb += a * c;
      accumulated.a += a;
    }
    cur_p += rm_step;
  }
  fragColor = vec4(accumulated.rgb, 1.0);
}
