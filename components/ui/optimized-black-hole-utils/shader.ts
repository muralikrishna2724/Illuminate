/**
 * Fragment shader: ray-traces light around a Schwarzschild black hole.
 *
 * Units: Schwarzschild radius r_s = 1 (photon sphere 1.5, ISCO 3).
 * Each pixel's ray is bent by the approximate geodesic acceleration
 *   a = -1.5 · h² · x / |x|⁵        (h = |x × v|, conserved angular momentum)
 * and whenever it crosses the equatorial plane inside the disk radii it picks
 * up emission from a thin, turbulent accretion disk (with Doppler beaming and
 * gravitational redshift). Rays that escape sample a procedural star field,
 * so stars near the hole are lensed as well.
 */
export const VERTEX_SHADER = /* glsl */ `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export function fragmentShader(steps: number): string {
  return /* glsl */ `
precision highp float;

#define STEPS ${steps}
#define R_IN 2.6
#define R_OUT 15.0
#define ESCAPE_R 60.0

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uFocus;       // screen-space position of the hole (height-normalised units)
uniform float uFocal;      // focal length (larger = closer / bigger hole)
uniform vec3 uCamPos;
uniform vec3 uCamRight;
uniform vec3 uCamUp;
uniform vec3 uCamForward;
uniform vec3 uTint;
uniform float uExposure;

float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}

float vnoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  float n000 = hash13(i);
  float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash13(i + vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
    mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y),
    u.z
  );
}

float fbm(vec3 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    sum += amp * vnoise(p);
    p = p * 2.07 + vec3(1.7, 9.2, 3.1);
    amp *= 0.5;
  }
  return sum;
}

vec3 starField(vec3 dir) {
  vec3 col = vec3(0.0);
  for (int layer = 0; layer < 2; layer++) {
    float scale = layer == 0 ? 60.0 : 140.0;
    float threshold = layer == 0 ? 0.975 : 0.955;
    vec3 p = dir * scale;
    vec3 cell = floor(p);
    float h = hash13(cell + float(layer) * 17.0);
    if (h > threshold) {
      vec3 jitter = vec3(hash13(cell + 1.3), hash13(cell + 2.7), hash13(cell + 5.1)) - 0.5;
      // Angular distance between the ray and the star's direction → round stars.
      vec3 starDir = normalize(cell + 0.5 + jitter * 0.6);
      float d = length(cross(dir, starDir)) * scale;
      float brightness = (h - threshold) / (1.0 - threshold);
      float radius = layer == 0 ? 0.13 : 0.1;
      col += vec3(smoothstep(radius, 0.0, d) * (0.15 + 1.1 * brightness * brightness * brightness));
    }
  }
  return col * vec3(1.0, 0.97, 0.93);
}

// Emission (rgb, premultiplied) and opacity of the disk at world point p.
vec4 diskSample(vec3 p, vec3 rayDir) {
  float r = length(p.xz);
  if (r < R_IN || r > R_OUT) return vec4(0.0);

  float phi = atan(p.z, p.x);
  // A fixed amount of Keplerian shear (inner orbits lead) plus a slow rigid
  // rotation. Integrating true differential rotation over time would wind
  // the texture into ever-thinner grooves.
  float omega = pow(r, -1.5);
  float ang = phi + 5.0 * omega + uTime * 0.045;
  vec2 circ = vec2(cos(ang), sin(ang));

  // Streaks along the orbit + domain-warped turbulence.
  float warp = fbm(vec3(circ * 2.4, r * 0.45));
  float streaks = fbm(vec3(circ * 1.7, r * 0.85 + warp * 2.6));
  float clumps = fbm(vec3(circ * 4.2 + warp * 2.2, r * 1.1 - warp * 0.8));
  float density = clamp(streaks * 0.9 + clumps * 0.9 - 0.4, 0.0, 1.0);
  density = density * density * (3.0 - 2.0 * density);

  float x = (r - R_IN) / (R_OUT - R_IN);
  float profile = smoothstep(0.0, 0.05, x) * (1.0 - smoothstep(0.25, 1.0, x)) * pow(R_IN / r, 1.35);

  // Relativistic beaming: the side moving towards the viewer is brighter.
  vec3 vdir = normalize(vec3(p.z, 0.0, -p.x));
  float v = sqrt(0.5 / r);
  float gamma = inversesqrt(1.0 - v * v);
  float cosT = dot(vdir, -rayDir);
  float doppler = 1.0 / (gamma * (1.0 - v * cosT));
  float redshift = sqrt(max(1.0 - 1.0 / r, 0.0));
  float boost = pow(doppler * redshift, 2.6);

  float intensity = profile * boost * (0.25 + 1.9 * density) * uExposure;
  float alpha = clamp((0.35 + density) * profile * 1.8, 0.0, 0.92);

  // Hotter (whiter) near the inner edge, slightly warmer further out.
  vec3 color = mix(uTint, vec3(1.0), clamp(boost * profile * 0.8, 0.0, 1.0));
  return vec4(color * intensity * alpha, alpha);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  uv = (uv - uFocus) / uFocal;

  vec3 pos = uCamPos;
  vec3 vel = normalize(uCamForward + uv.x * uCamRight + uv.y * uCamUp);
  vec3 dir0 = vel; // unbent direction: stars use a softened lensing (full lensing smears them into arcs)
  vec3 hv = cross(pos, vel);
  float h2 = dot(hv, hv);

  vec3 color = vec3(0.0);
  float alpha = 0.0;
  float glow = 0.0;
  bool captured = false;
  bool escaped = false;

  for (int i = 0; i < STEPS; i++) {
    float r2 = dot(pos, pos);
    float r = sqrt(r2);
    if (r < 1.0) { captured = true; break; }
    if (r > ESCAPE_R && dot(pos, vel) > 0.0) { escaped = true; break; }

    float dt = clamp(0.075 * r, 0.035, 2.5);
    vec3 accel = -1.5 * h2 * pos / (r2 * r2 * r);
    vel += accel * dt;
    vec3 next = pos + vel * dt;

    // Soft haze hugging the disk plane gives the disk visible thickness.
    float rr = length(pos.xz);
    if (rr > R_IN * 0.9 && rr < R_OUT) {
      float falloff = exp(-abs(pos.y) * 4.5 / (0.15 + 0.06 * rr));
      glow += falloff * pow(R_IN / rr, 2.0) * dt * 0.018;
    }

    if (pos.y * next.y < 0.0) {
      float t = pos.y / (pos.y - next.y);
      vec3 hit = mix(pos, next, t);
      vec4 d = diskSample(hit, normalize(vel));
      color += (1.0 - alpha) * d.rgb;
      alpha += (1.0 - alpha) * d.a;
      if (alpha > 0.985) break;
    }
    pos = next;
  }

  if (escaped || (!captured && alpha < 0.985)) {
    color += (1.0 - alpha) * starField(normalize(mix(dir0, normalize(vel), 0.3))) * (escaped ? 1.0 : 0.0);
  }
  color += glow * uTint * (1.0 - alpha * 0.5) * uExposure;

  // Filmic tone map.
  color = vec3(1.0) - exp(-color * 1.25);
  gl_FragColor = vec4(color, 1.0);
}
`;
}
