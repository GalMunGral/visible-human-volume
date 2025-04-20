#version 300 es
precision mediump sampler3D;
precision mediump float;

#define FLT_MAX 3.402823466e+38
#define M_PI 3.1415926535897932384626433832795

const float draw_dist = 2.0;
const int steps = 500;
const float step_size = draw_dist / float(steps);

const float h = 0.01;

const vec3 l = normalize(vec3(1.0, 1.0, 1.0));
const vec3 skin_color = vec3(0.96, 0.76, 0.62);
const vec3 tissue_color = vec3(0.7, 0.7, 0.9);
const vec3 bone_color = vec3(0.96, 0.96, 0.86);

const float band_width = 0.1;
const float alpha = 0.1;

uniform sampler3D volume;
uniform vec3 u_dims;
uniform float peak;

uniform vec2 viewport;
uniform mat3 R_inv;
uniform vec3 eye;
uniform vec3 forward;
uniform vec3 up;
uniform vec3 right;
uniform float focus;
uniform float fov;

out vec4 fragColor;

float clamp01(float v) {
  return clamp(v, 0.0, 1.0);
}

vec3 ray_dir() {
  float scale = (2.0 * focus * tan(fov / 2.0)) /  max(viewport.x, viewport.y);
  float x = (gl_FragCoord.x - viewport.x / 2.0) * scale;
  float y = (gl_FragCoord.y - viewport.y / 2.0) * scale;
  return normalize(x * right + y * up + focus * forward);
}

bool in_bounds(vec3 p, vec3 dims) {
  return abs(p.x) < 0.25 * dims.x && abs(p.y) < dims.y && abs(p.z) < dims.z;
}

vec3 get_texcoords(vec3 p, vec3 dims) {
  return vec3(
    p.x / dims.x * 0.5 + 0.5, 
    p.y / dims.y * 0.5 + 0.5, 
    p.z / dims.z * 0.5 + 0.5
  );
}

vec4 D(sampler3D sampler, vec3 texcoords, vec3 h) {
  return texture(sampler, texcoords + h) - texture(sampler, texcoords - h) / (2.0 * length(h));
}

vec3 gradient(sampler3D sampler, vec3 texcoords) {
  return vec3(
    D(sampler, texcoords, vec3(h, 0, 0)).r,
    D(sampler, texcoords, vec3(0, h, 0)).r,
    D(sampler, texcoords, vec3(0, 0, h)).r
  );
}

float phong_shading(vec3 p, vec3 n) {
  vec3 e = normalize(eye - p);
  vec3 r = 2.0 * dot(l, n) * n - l;
  float ambient = 0.5;
  float diffuse = 0.5 * clamp01(dot(n, l));
  float specular = 0.5 * pow(clamp01(dot(e, r)), 2.0);
  return ambient + diffuse + specular;
}

void main() {
  vec4 accumulated = vec4(0.0);

  vec3 cur_p = eye;
  vec3 step = step_size * ray_dir();
  vec3 dims = normalize(u_dims);

  for(int i = 0; i < steps; ++i) {
    if(in_bounds(cur_p, dims)) {
      vec3 texcoords = get_texcoords(cur_p, dims);
      vec4 color = texture(volume, texcoords);
      vec3 grad = gradient(volume, texcoords);

      vec3 n = normalize(grad);
      float I = phong_shading(cur_p, n);

      float t = clamp01(abs(color.r - peak) / band_width);
      float a = length(grad) > 0.0 ? mix(alpha, 0.0, t) : 0.0;

      accumulated.rgb += (1.0 - accumulated.a) * a * I;
      accumulated.a += (1.0 - accumulated.a) * a;
    }
    cur_p += step;
  }
  fragColor = vec4(accumulated.rgb, 1.0);
}
