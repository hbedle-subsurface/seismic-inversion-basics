/* =============================================================================
   physics.js — the calculations this site teaches, with plain names.
   Heather Bedle and April Moreno-Ward / AASPI / University of Oklahoma

   Every function here is small enough to read. That is the point: a student
   who wants to know what the page did can open this file and find the same
   arithmetic the module described, rather than a library call.

   Units, fixed everywhere on the site:
     velocity   m/s
     density    g/cc
     impedance  (m/s)(g/cc)
     time       seconds
     frequency  Hz
     angle      degrees

   Depends on nothing. Load it before any module script.
   ========================================================================== */

const PHYS = (function () {
  'use strict';

  /* --- impedance and reflection ------------------------------------------ */

  // Acoustic impedance: how much a rock resists being moved by a passing wave.
  function impedance(vp, density) {
    return vp * density;
  }

  // Normal-incidence reflection coefficient at one boundary. The fraction of
  // the arriving wave's amplitude that comes back, which is a signed number:
  // positive when the lower rock is harder. The fraction of the energy that
  // comes back is its square, and the two are easy to confuse.
  function reflectionCoefficient(z1, z2) {
    if (!(z1 + z2)) return 0;
    return (z2 - z1) / (z2 + z1);
  }

  // A layer stack in time to a reflectivity series on a regular grid.
  // layers: [{ t0, t1, vp, density }] in seconds.
  function reflectivitySeries(layers, t0, dt, n) {
    const r = new Float64Array(n);
    for (let k = 1; k < layers.length; k++) {
      const za = impedance(layers[k - 1].vp, layers[k - 1].density);
      const zb = impedance(layers[k].vp, layers[k].density);
      const i = Math.round((layers[k].t0 - t0) / dt);
      if (i > 0 && i < n) r[i] += reflectionCoefficient(za, zb);
    }
    return r;
  }

  // The same stack sampled as an impedance log, so it can be drawn beside the
  // reflectivity and compared.
  function impedanceSeries(layers, t0, dt, n) {
    const z = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const t = t0 + i * dt;
      let lay = layers[0];
      for (let k = 0; k < layers.length; k++) {
        if (t >= layers[k].t0 && t < layers[k].t1) { lay = layers[k]; break; }
        if (t >= layers[layers.length - 1].t1) lay = layers[layers.length - 1];
      }
      z[i] = impedance(lay.vp, lay.density);
    }
    return z;
  }

  /* --- the wavelet -------------------------------------------------------- */

  // A Ricker wavelet: the shape a short seismic source leaves on the record.
  // f is the peak frequency in Hz. Returns a sampled, centered wavelet.
  // Every module in this set uses a zero-phase wavelet: phase is a subject of
  // its own and it belongs to the advanced set, where it can be rotated and
  // the effect looked at properly.
  function wavelet(f, dt) {
    const half = 1.6 / f;                       // enough to hold the side lobes
    const n = 2 * Math.round(half / dt) + 1;
    const w = new Float64Array(n);
    const mid = (n - 1) / 2;
    for (let i = 0; i < n; i++) {
      const t = (i - mid) * dt;
      const a = Math.PI * f * t;
      w[i] = (1 - 2 * a * a) * Math.exp(-a * a);
    }
    return w;
  }

  /* --- making a trace ----------------------------------------------------- */

  // Convolution: lay a copy of the wavelet on every reflection, scaled by that
  // reflection's size, and add up wherever the copies overlap.
  function convolve(r, w) {
    const n = r.length, m = w.length, mid = (m - 1) / 2;
    const out = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      if (!r[i]) continue;
      for (let k = 0; k < m; k++) {
        const j = i + k - mid;
        if (j >= 0 && j < n) out[j] += r[i] * w[k];
      }
    }
    return out;
  }

  // Reproducible pseudo-random numbers, so a page redraws the same way twice.
  function randomSeed(seed) {
    let a = seed >>> 0;
    return function () {
      a += 0x6D2B79F5;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gaussian(rnd) {
    let u = 0, v = 0;
    while (!u) u = rnd();
    while (!v) v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  // Add noise as a percentage of the trace's own size, so the number on the
  // slider means the same thing whatever the layers are doing.
  function addNoise(trace, percent, seed) {
    if (!percent) return Float64Array.from(trace);
    const rnd = randomSeed(seed === undefined ? 1 : seed);
    const level = (percent / 100) * rms(trace);
    return Float64Array.from(trace, (v) => v + level * gaussian(rnd));
  }

  function rms(x) {
    let s = 0;
    for (let i = 0; i < x.length; i++) s += x[i] * x[i];
    return Math.sqrt(s / Math.max(1, x.length));
  }

  // The whole forward calculation in one call: rock in, trace out.
  function syntheticTrace(layers, opts) {
    const o = opts || {};
    const dt = o.dt || 0.001, t0 = o.t0 || 0, n = o.n || 300;
    const r = reflectivitySeries(layers, t0, dt, n);
    const w = wavelet(o.frequency || 30, dt, o.phase || 0);
    const clean = convolve(r, w);
    return {
      reflectivity: r,
      wavelet: w,
      clean: clean,
      trace: addNoise(clean, o.noise || 0, o.seed),
    };
  }

  /* --- going backward ----------------------------------------------------- */

  // Running sum of a trace. Turns a record of boundaries back into something
  // shaped like a log. It has no starting value and no slow trend, which is
  // what modules 3 and 5 are about.
  function runningSum(trace, opts) {
    const o = opts || {};
    const n = trace.length, out = new Float64Array(n);
    let s = 0;
    for (let i = 0; i < n; i++) { s += trace[i]; out[i] = s; }
    if (o.removeDrift !== false) {
      const a = out[0], b = out[n - 1];
      for (let i = 0; i < n; i++) out[i] -= a + (b - a) * i / (n - 1);
    }
    if (o.normalize) {
      let mx = 0;
      for (let i = 0; i < n; i++) mx = Math.max(mx, Math.abs(out[i]));
      if (mx) for (let i = 0; i < n; i++) out[i] /= mx;
    }
    return out;
  }

  // How well two curves agree in shape, ignoring level and scale. 1 is
  // identical, 0 is unrelated. Ends are trimmed because convolution damages
  // them and the damage is not what is being measured.
  function agreement(a, b) {
    const n = Math.min(a.length, b.length);
    const k0 = Math.min(30, Math.floor(n / 6)), k1 = n - k0;
    let ma = 0, mb = 0, m = 0;
    for (let i = k0; i < k1; i++) { ma += a[i]; mb += b[i]; m++; }
    if (m < 4) return 0;
    ma /= m; mb /= m;
    let sa = 0, sb = 0, sab = 0;
    for (let i = k0; i < k1; i++) {
      const da = a[i] - ma, db = b[i] - mb;
      sa += da * da; sb += db * db; sab += da * db;
    }
    return (sa > 0 && sb > 0) ? sab / Math.sqrt(sa * sb) : 0;
  }

  // How far a synthetic sits from a recording, in the recording's own units.
  function misfit(observed, synthetic) {
    const n = Math.min(observed.length, synthetic.length);
    let s = 0;
    for (let i = 0; i < n; i++) {
      const d = observed[i] - synthetic[i];
      s += d * d;
    }
    return Math.sqrt(s / Math.max(1, n));
  }

  /* --- filtering ---------------------------------------------------------- */

  // A zero-phase band-pass, done in the frequency domain so it does not shift
  // anything sideways. A running average is much cheaper but smears phase, and
  // a curve that has been phase-smeared cannot be honestly compared with one
  // that has not. Trace lengths on this site are a few hundred samples, so a
  // direct transform is fast enough.
  //
  // f1..f2 is the low taper, f3..f4 the high one. Everything between f2 and f3
  // passes untouched; everything outside f1..f4 is removed.
  function bandpass(x, dt, f1, f2, f3, f4) {
    const n = x.length;
    const re = new Float64Array(n), im = new Float64Array(n);
    for (let k = 0; k <= n / 2; k++) {
      let sr = 0, si = 0;
      for (let i = 0; i < n; i++) {
        const a = -2 * Math.PI * k * i / n;
        sr += x[i] * Math.cos(a);
        si += x[i] * Math.sin(a);
      }
      const f = k / (n * dt);
      let g;
      if (f <= f1 || f >= f4) g = 0;
      else if (f < f2) g = 0.5 - 0.5 * Math.cos(Math.PI * (f - f1) / (f2 - f1));
      else if (f <= f3) g = 1;
      else g = 0.5 + 0.5 * Math.cos(Math.PI * (f - f3) / (f4 - f3));
      re[k] = sr * g; im[k] = si * g;
      if (k > 0 && k < n - k) { re[n - k] = sr * g; im[n - k] = -si * g; }
    }
    const out = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      let s = 0;
      for (let k = 0; k < n; k++) {
        const a = 2 * Math.PI * k * i / n;
        s += re[k] * Math.cos(a) - im[k] * Math.sin(a);
      }
      out[i] = s / n;
    }
    return out;
  }

  // The band a wavelet of this peak frequency actually carries. A Ricker holds
  // useful energy from roughly a fifth of its peak to a little over twice it.
  function waveletBand(peakHz) {
    return { f1: peakHz * 0.12, f2: peakHz * 0.25, f3: peakHz * 1.8, f4: peakHz * 2.6 };
  }

  /* --- resolution --------------------------------------------------------- */

  // Dominant wavelength of a wavelet in a rock: how thick a bed has to be before
  // its top and base arrive as separate events.
  function wavelength(velocity, frequency) {
    return velocity / frequency;
  }

  // The thickness at which the two reflections stop separating and start
  // adding to one another. A quarter of a wavelength, in thickness.
  function tuningThickness(velocity, frequency) {
    return wavelength(velocity, frequency) / 4;
  }

  return {
    impedance, reflectionCoefficient, reflectivitySeries, impedanceSeries,
    wavelet, convolve, addNoise, syntheticTrace,
    runningSum, agreement, misfit, rms,
    bandpass, waveletBand,
    wavelength, tuningThickness,
    randomSeed, gaussian,
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = PHYS;
