#version 300 es
precision highp sampler3D;
precision highp float;

const float FD_STEP_SIZE = 0.1f;

const float DRAW_DIST = 2.;
const int RM_STEPS = 500;
const float RM_STEP_SIZE = DRAW_DIST / float(RM_STEPS);

const float BAND_WIDTH = 0.5f;
const float ALPHA = 0.02f;

uniform vec2 viewport;

uniform sampler3D data;
uniform vec3 volume_dims;
uniform float peak;

uniform vec3 camera_pos;
uniform vec3 camera_forward;
uniform vec3 camera_right;
uniform vec3 camera_up;
uniform float screen_dist;
uniform float fovy;

out vec4 fragColor;

float clamp01(float v) { return clamp(v, 0., 1.); }

/**
 * Copied from https://www.shadertoy.com/view/XtGGzG
 */
vec3 viridis_quintic(float x) {
  x = clamp01(x);
  vec4 x1 = vec4(1., x, x * x, x * x * x);
  vec4 x2 = x1 * x1.w * x;
  return vec3(dot(x1.xyzw, vec4(+0.280268003f, -0.143510503f, +2.225793877f,
                                -14.815088879f)) +
                  dot(x2.xy, vec2(+25.212752309f, -11.772589584f)),
              dot(x1.xyzw, vec4(-0.002117546f, +1.617109353f, -1.909305070f,
                                +2.701152864f)) +
                  dot(x2.xy, vec2(-1.685288385f, +0.178738871f)),
              dot(x1.xyzw, vec4(+0.300805501f, +2.614650302f, -12.019139090f,
                                +28.933559110f)) +
                  dot(x2.xy, vec2(-33.491294770f, +13.762053843f)));
}

vec3 ray() {
  float screen_height = 2. * screen_dist * tan(fovy / 2.);
  float units_per_pixel = screen_height / viewport.y;
  float x = (gl_FragCoord.x - viewport.x / 2.) * units_per_pixel;
  float y = (gl_FragCoord.y - viewport.y / 2.) * units_per_pixel;
  return normalize(x * camera_right + y * camera_up +
                   screen_dist * camera_forward);
}

bool in_bounds(vec3 p, vec3 dims) {
  return (abs(p.x) < 0.25f * dims.x && abs(p.y) < 0.5f * dims.y &&
          abs(p.z) < dims.z);
}

vec3 get_texcoords(vec3 p, vec3 dims) {
  return vec3(p.x / dims.x * 0.5f + 0.5f, p.y / dims.y * 0.5f + 0.5f,
              p.z / dims.z * 0.5f + 0.5f);
}

vec4 derivative(sampler3D sampler, vec3 texcoords, vec3 h) {
  return texture(sampler, texcoords + h) -
         texture(sampler, texcoords - h) / (2. * length(h));
}

vec3 gradient(sampler3D sampler, vec3 texcoords) {
  return vec3(derivative(sampler, texcoords, vec3(FD_STEP_SIZE, 0, 0)).r,
              derivative(sampler, texcoords, vec3(0, FD_STEP_SIZE, 0)).r,
              derivative(sampler, texcoords, vec3(0, 0, FD_STEP_SIZE)).r);
}

float phong_shading(vec3 p, vec3 n) {
  vec3 l = normalize(camera_pos + camera_right + camera_up);
  vec3 v = normalize(camera_pos - p);
  vec3 r = 2. * dot(l, n) * n - l;
  float ambient = 0.5f;
  float diffuse = 0.5f * clamp01(abs(dot(n, l)));
  float specular = 0.5f * pow(clamp01(dot(v, r)), 5.);
  return ambient + diffuse + specular;
}

void main() {
  vec4 accumulated = vec4(0.);
  vec3 cur_p = camera_pos;
  vec3 rm_step = RM_STEP_SIZE * ray();

  for (int i = 0; i < RM_STEPS; ++i) {
    if (in_bounds(cur_p, volume_dims)) {
      vec3 texcoords = get_texcoords(cur_p, volume_dims);
      float value = texture(data, texcoords).r;
      vec3 grad = gradient(data, texcoords);

      vec3 n = normalize(grad);
      float I = phong_shading(cur_p, n);

      float t = clamp01(abs(value - peak) / BAND_WIDTH);
      float a = length(grad) > 0. ? mix(ALPHA, 0., t) : 0.;

      a *= 1. - accumulated.a;
      accumulated.rgb += a * I * viridis_quintic(3. * value);
      accumulated.a += a;
    }
    cur_p += rm_step;
  }
  fragColor = vec4(accumulated.rgb, 1.);
}
