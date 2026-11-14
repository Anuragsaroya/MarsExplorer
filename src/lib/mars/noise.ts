/** Seeded RNG + value-noise fBm used to model terrain deterministically. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Noise2D = (x: number, y: number) => number;

export function makeNoise(seed: number): Noise2D {
  const rnd = mulberry32(seed);
  const size = 256;
  const values = new Float32Array(size);
  for (let i = 0; i < size; i++) values[i] = rnd();
  const perm = new Uint8Array(size * 2);
  const p = Array.from({ length: size }, (_, i) => i);
  for (let i = size - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < size * 2; i++) perm[i] = p[i & 255];
  const fade = (t: number) => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const X = xi & 255;
    const Y = yi & 255;
    const v00 = values[perm[X + perm[Y]]];
    const v10 = values[perm[X + 1 + perm[Y]]];
    const v01 = values[perm[X + perm[Y + 1]]];
    const v11 = values[perm[X + 1 + perm[Y + 1]]];
    const u = fade(xf);
    const v = fade(yf);
    return (v00 * (1 - u) + v10 * u) * (1 - v) + (v01 * (1 - u) + v11 * u) * v;
  };
}

export function fbm(noise: Noise2D, x: number, y: number, octaves = 5, gain = 0.5) {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise(x * freq + i * 17.3, y * freq - i * 9.1);
    norm += amp;
    amp *= gain;
    freq *= 2;
  }
  return sum / norm;
}

export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
