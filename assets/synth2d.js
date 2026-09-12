/* ===========================================================================
   synth2d.js — one 2D earth, in impedance, shared by the later modules
   Heather Bedle and April Moreno-Ward / AASPI / University of Oklahoma

   Why this exists: the first four modules work on a single trace, because a
   single trace is where the arithmetic is visible. From module 5 onward the
   questions are about things that only show up across a line — how far a
   background model can be carried from a well, whether a body holds its shape
   when the level moves, what a relative result looks like next to an absolute
   one. Those need a section.

   The model is built in IMPEDANCE and everything else is derived from it.
   That order matters for an inversion set: the truth is impedance, the
   recording is what is left after the impedance has been differenced and
   convolved, and an inversion is judged by how close it gets back. A model
   built from reflection coefficients has no truth to compare against.

   THE EARTH, top to bottom:

     a shale section on a low-relief anticline, getting harder with depth
     a hard marker at the top, for a clean isolated event
     a wedge sand, 44 ms thinning to nothing across the line
     a sand that is gas-charged over the crest and brine-filled off it
     a set of thin interbeds, below resolution
     a hard carbonate at the base

   The gas sand is the feature the teaching rests on. Over the crest it is
   soft enough to sit at the same impedance as the shale beside it, which is
   the case the modules use to say that one impedance value does not name a
   rock.

   License: CC BY-SA 4.0, the same as the repository it ships in.
   =========================================================================== */

const SYNTH2D = (function () {
  'use strict';

  /* --- the grid ------------------------------------------------------------
     96 traces and 400 samples at 2 ms gives 0.8 s of section, which is enough
     to hold the whole model with room above and below it. Fixed, so every
     module that draws this line draws the same one. */
  const NX = 96;
  const NT = 400;
  const DT = 0.002;

  // The window every panel draws, in seconds of two-way time.
  const TV0 = 0.10;
  const TV1 = 0.72;

  // Fixed display ranges. Nothing here auto-scales: a student notices a body
  // changing color and does not notice an axis quietly rescaling underneath
  // it, so the axes are held and the data is allowed to move.
  const Z_RANGE = [4000, 15000];      // impedance, (m/s)(g/cc)
  const A_RANGE = [-1, 1];            // amplitude, after normalization
  const R_RANGE = [-5000, 5000];      // relative impedance, arbitrary level

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function smooth(x) { const u = clamp(x, 0, 1); return u * u * (3 - 2 * u); }

  /* --- the shape of the structure ------------------------------------------
     One broad anticline with its crest a third of the way along, and a gentle
     regional dip on top of it. Every boundary carries the same shift, so the
     structure is a structure rather than a set of unrelated wiggles. */
  function structure(ix) {
    const crest = -0.030 * Math.exp(-0.5 * Math.pow((ix - 34) / 17, 2));
    const flank = 0.011 * Math.exp(-0.5 * Math.pow((ix - 78) / 14, 2));
    const dip = 0.00019 * (ix - 48);
    return crest + flank + dip;
  }

  /* --- where the boundaries sit, before the structure is added ------------- */
  const T_MARKER_TOP = 0.200, T_MARKER_BASE = 0.214;
  const T_WEDGE_TOP = 0.296;
  const T_SAND_TOP = 0.412, SAND_THICK = 0.034;
  const T_INTERBED = 0.520, INTERBED_N = 7, INTERBED_DT = 0.011;
  const T_CARBONATE = 0.640;

  // The wedge: 44 ms at the left, pinching out three quarters of the way
  // across. A student who has done module 3 on one trace can watch the same
  // thing happen on a section here.
  function wedgeThickness(ix) {
    return 0.044 * (1 - smooth((ix - 6) / 66));
  }

  // How much gas is in the sand at this trace: 1 over the crest, 0 off it,
  // with a short transition so the edge of the accumulation is a ramp rather
  // than a step. A gas-water contact in real data is sharper than this; the
  // ramp is here so a student can see the impedance pass through every value
  // between the two rocks.
  function gasFraction(ix) {
    return clamp(Math.min(smooth((ix - 14) / 7), 1 - smooth((ix - 52) / 9)), 0, 1);
  }

  /* A lens of soft, organic-rich shale on the right-hand flank, in the same
     interval as the sand and at the same acoustic impedance as the gas sand.

     It is here so that acoustic impedance on its own cannot tell the two apart,
     which is the case module 1 and module 4 argue in words and this line can
     show. Their Vp/Vs ratios are quite different, so anything that recovers a
     second elastic property separates them immediately. That is the whole
     argument for pre-stack inversion, and it needs two rocks that agree on one
     property and disagree on another. */
  function shaleLensFraction(ix) {
    return clamp(Math.min(smooth((ix - 64) / 6), 1 - smooth((ix - 86) / 6)), 0, 1);
  }

  /* --- the rocks -----------------------------------------------------------
     Impedance in (m/s)(g/cc). The shale compacts with depth, which is why the
     background is a ramp rather than a constant: it is the compaction trend
     that a low-frequency model has to carry, and it is the reason a summed
     trace on its own comes out flat.

     The gas sand at 5,900 sits inside the range an organic shale occupies, and
     that overlap is deliberate. */
  const SHALE_TOP = 6100;             // impedance of the shale at the top
  const SHALE_GRAD = 7600;            // how much it gains per second of time
  const MARKER = 13400;               // a hard, clean limestone marker
  const WEDGE_SAND = 8900;            // a cemented sand, harder than the shale
  const GAS_SAND = 5900;              // soft: gas in the pore space
  const BRINE_SAND = 9300;            // the same sand, brine filled
  const CARBONATE = 14200;

  function shaleAt(t) { return SHALE_TOP + SHALE_GRAD * t; }

  /**
   * The true impedance of the earth at every trace and every sample.
   * Returns a trace-major Float32Array of length NX * NT.
   */
  function impedanceField() {
    const z = new Float32Array(NX * NT);
    for (let ix = 0; ix < NX; ix++) {
      const s = structure(ix);
      const g = gasFraction(ix);
      const wt = wedgeThickness(ix);
      const lens = shaleLensFraction(ix);
      // where the lens sits, the interval is soft shale at the gas sand's value
      const sand = lens > 0.5
        ? GAS_SAND + (shaleAt(T_SAND_TOP) - GAS_SAND) * (1 - lens)
        : GAS_SAND + (BRINE_SAND - GAS_SAND) * (1 - g);

      const mTop = T_MARKER_TOP + s, mBase = T_MARKER_BASE + s;
      const wTop = T_WEDGE_TOP + s, wBase = wTop + wt;
      const sTop = T_SAND_TOP + s, sBase = sTop + SAND_THICK;
      const cTop = T_CARBONATE + s;

      for (let it = 0; it < NT; it++) {
        const t = it * DT;
        let v = shaleAt(t);

        if (t >= mTop && t < mBase) v = MARKER;
        else if (wt > 0.001 && t >= wTop && t < wBase) v = WEDGE_SAND;
        else if (t >= sTop && t < sBase) v = sand;
        else if (t >= cTop) v = CARBONATE;
        else if (t >= T_INTERBED + s && t < T_INTERBED + s + INTERBED_N * INTERBED_DT) {
          // thin alternating beds, each well under the tuning thickness, so
          // the section shows one blended response rather than seven events
          const k = Math.floor((t - T_INTERBED - s) / INTERBED_DT);
          v = shaleAt(t) + (k % 2 ? 1250 : -1050);
        }

        z[ix * NT + it] = v;
      }
    }
    return z;
  }

  /* --- the second elastic property -----------------------------------------

     Zp is velocity times density and one number does not name a rock: a gas
     sand and a soft organic shale can sit at the same value. What separates
     them is how fast a shear wave crosses them, because gas in the pore space
     lowers the compressional velocity sharply and leaves the shear velocity
     almost alone. The ratio Vp/Vs therefore drops in a gas sand and does not in
     a shale.

     Shear impedance is Zs = rho * Vs, which is Zp divided by Vp/Vs. A post-stack
     inversion returns Zp and nothing else, because stacking averaged the angles
     together. A pre-stack inversion keeps the angles and can return both.

     The values below are typical of a clastic section and are not from Maui-4.
     They are broad enough to be honest and separated enough to be visible.
     -------------------------------------------------------------------- */

  const VPVS_SHALE = 2.25;
  const VPVS_ORGANIC_SHALE = 2.35;    // the lens: soft, and still shaly
  const VPVS_GAS_SAND = 1.62;         // gas drops Vp and leaves Vs alone
  const VPVS_BRINE_SAND = 2.05;
  const VPVS_CEMENTED = 1.85;         // the wedge sand and the marker
  const VPVS_CARBONATE = 1.88;

  /** Vp/Vs at every trace and sample, on the same grid as the impedance. */
  function vpvsField() {
    const r = new Float32Array(NX * NT);
    for (let ix = 0; ix < NX; ix++) {
      const s = structure(ix);
      const g = gasFraction(ix);
      const lens = shaleLensFraction(ix);
      const wt = wedgeThickness(ix);

      const mTop = T_MARKER_TOP + s, mBase = T_MARKER_BASE + s;
      const wTop = T_WEDGE_TOP + s, wBase = wTop + wt;
      const sTop = T_SAND_TOP + s, sBase = sTop + SAND_THICK;
      const cTop = T_CARBONATE + s;

      for (let it = 0; it < NT; it++) {
        const t = it * DT;
        let v = VPVS_SHALE;
        if (t >= mTop && t < mBase) v = VPVS_CEMENTED;
        else if (wt > 0.001 && t >= wTop && t < wBase) v = VPVS_CEMENTED;
        else if (t >= sTop && t < sBase) {
          v = lens > 0.5
            ? VPVS_ORGANIC_SHALE
            : VPVS_BRINE_SAND + (VPVS_GAS_SAND - VPVS_BRINE_SAND) * g;
        } else if (t >= cTop) v = VPVS_CARBONATE;
        r[ix * NT + it] = v;
      }
    }
    return r;
  }

  /** Shear impedance: Zp divided by Vp/Vs. */
  function shearImpedanceField(z, vpvs) {
    const out = new Float32Array(z.length);
    for (let i = 0; i < z.length; i++) out[i] = z[i] / (vpvs[i] || 2);
    return out;
  }

  /** Mean of a field over the soft shale lens, for comparing it with the sand. */
  function meanInShaleLens(field) {
    let sum = 0, n = 0;
    for (let ix = 0; ix < NX; ix++) {
      if (shaleLensFraction(ix) < 0.7) continue;
      const s = structure(ix);
      const i0 = Math.round((T_SAND_TOP + s) / DT);
      const i1 = Math.round((T_SAND_TOP + SAND_THICK + s) / DT);
      for (let it = i0; it < i1; it++) { sum += field[ix * NT + it]; n++; }
    }
    return n ? sum / n : 0;
  }

  /**
   * Reflection coefficients from an impedance field, sample by sample. The
   * value at sample i belongs to the boundary between sample i and i+1, which
   * is the convention the modules draw with.
   */
  function reflectivityFrom(z) {
    const r = new Float32Array(NX * NT);
    for (let ix = 0; ix < NX; ix++) {
      const o = ix * NT;
      for (let it = 0; it < NT - 1; it++) {
        const a = z[o + it], b = z[o + it + 1];
        r[o + it] = (b - a) / (b + a);
      }
      r[o + NT - 1] = 0;
    }
    return r;
  }

  /**
   * Convolve a reflectivity field with a wavelet.
   *
   *   freq      peak frequency of the Ricker wavelet, in Hz
   *   opts.norm divide by this instead of by the field's own peak. Passing the
   *             value returned for the default settings keeps the display from
   *             rescaling every time a slider moves, which is the quickest way
   *             to hide the effect a student is being asked to look at.
   *
   * Returns { field, peak } so the caller can capture that constant once.
   */
  function sectionFrom(r, freq, opts) {
    const o = opts || {};
    let w = SEIS.makeWavelet({ f: freq });
    if (o.phase) w = SEIS.phaseRotate(w, o.phase);
    const wf = w.fn ? w.fn : null;

    // Sample the wavelet onto the trace grid once, then convolve directly.
    const half = Math.ceil(0.9 / Math.max(6, freq) / DT);
    const kern = new Float64Array(2 * half + 1);
    for (let k = -half; k <= half; k++) {
      kern[k + half] = wf ? wf(k * DT) : SEIS.ricker(k * DT, freq);
    }

    const out = new Float32Array(NX * NT);
    for (let ix = 0; ix < NX; ix++) {
      const off = ix * NT;
      for (let it = 0; it < NT; it++) {
        let sum = 0;
        for (let k = -half; k <= half; k++) {
          const j = it - k;
          if (j < 0 || j >= NT) continue;
          sum += r[off + j] * kern[k + half];
        }
        out[off + it] = sum;
      }
    }

    let peak = 0;
    for (let i = 0; i < out.length; i++) peak = Math.max(peak, Math.abs(out[i]));
    peak = peak || 1;
    const div = (o.norm && o.norm > 0) ? o.norm : peak;
    for (let i = 0; i < out.length; i++) out[i] /= div;
    return { field: out, peak: peak };
  }

  /**
   * Add band-limited random noise to a section, as a percentage of its RMS.
   * Uses one seed for the whole field so a given percentage always looks the
   * same, rather than reshuffling every time a slider moves.
   */
  function addNoise(field, percent, freq, seed) {
    if (!percent) return field;
    const n = SEIS.bandLimitedNoise(NX, NT, DT, SEIS.makeWavelet({ f: freq }),
                                    seed || 7, 3);
    let sum2 = 0;
    for (let i = 0; i < field.length; i++) sum2 += field[i] * field[i];
    const rms = Math.sqrt(sum2 / field.length) || 1;
    const a = rms * percent / 100;
    const out = new Float32Array(field.length);
    for (let i = 0; i < field.length; i++) out[i] = field[i] + a * n[i];
    return out;
  }

  /* --- the low-frequency model ---------------------------------------------

     Two separate things wear similar names and a student has to keep them
     apart.

     The LOW-FREQUENCY COMPONENT is a property of the earth: the part of the
     true impedance that varies more slowly with depth than the seismic band
     reaches. lowFrequencyComponent() extracts it from the true impedance, so a
     module can show what the recording is missing.

     The LOW-FREQUENCY MODEL is a thing somebody builds: an estimate of that
     component, made from well logs and carried along horizons out to where
     there is no well. backgroundModel() builds one from the true impedance at
     a chosen trace and spreads it across the line, which is what makes the
     distance from the well visible.
     -------------------------------------------------------------------- */

  /** A running average wide enough to pass only frequencies below fLo. */
  function lowPassTrace(x, off, fLo) {
    const half = Math.max(1, Math.round(1 / (2 * fLo * DT)));
    const out = new Float64Array(NT);
    // Two passes of a boxcar, which rolls the edge off more gently than one.
    let tmp = new Float64Array(NT);
    for (let pass = 0; pass < 2; pass++) {
      const src = pass === 0 ? null : tmp;
      for (let it = 0; it < NT; it++) {
        let sum = 0, n = 0;
        for (let k = -half; k <= half; k++) {
          const j = clamp(it + k, 0, NT - 1);
          sum += src ? src[j] : x[off + j];
          n++;
        }
        out[it] = sum / n;
      }
      tmp = Float64Array.from(out);
    }
    return out;
  }

  /**
   * The part of the true impedance that lies below the seismic band. This is
   * what the recording does not contain.
   */
  function lowFrequencyComponent(z, fLo) {
    const out = new Float32Array(NX * NT);
    for (let ix = 0; ix < NX; ix++) {
      const lo = lowPassTrace(z, ix * NT, fLo);
      for (let it = 0; it < NT; it++) out[ix * NT + it] = lo[it];
    }
    return out;
  }

  /**
   * A low-frequency model built from one well and carried across the line.
   *
   *   wellIx  the trace the well sits on
   *   fLo     the lowest frequency the survey holds
   *   follow  1 to hang the model on the structure, 0 to leave it flat. A
   *           model built along horizons follows; one interpolated in time
   *           without horizons does not, and the difference is worth showing.
   *
   * The model is the well's low-frequency component, shifted in time to match
   * the structure at each trace. Everything the model gets wrong away from the
   * well comes from the rock changing laterally, which is exactly what happens
   * in the field.
   */
  function backgroundModel(z, wellIx, fLo, follow) {
    const at = lowPassTrace(z, clamp(wellIx, 0, NX - 1) * NT, fLo);
    const sRef = structure(clamp(wellIx, 0, NX - 1));
    const out = new Float32Array(NX * NT);
    for (let ix = 0; ix < NX; ix++) {
      const shift = (follow === 0) ? 0 : (structure(ix) - sRef) / DT;
      for (let it = 0; it < NT; it++) {
        const j = clamp(Math.round(it - shift), 0, NT - 1);
        out[ix * NT + it] = at[j];
      }
    }
    return out;
  }

  /* --- inversion, in its plainest form -------------------------------------

     Summing a trace undoes the differencing that made the reflection
     coefficients, which recovers the shape of the impedance and nothing else:
     no absolute value, and no trend below the seismic band. That result is
     relative impedance. Adding a low-frequency model to it gives absolute
     impedance. Every method in module 7 is a more careful version of these two
     lines, and none of them escapes needing the second one.
     -------------------------------------------------------------------- */

  /**
   * Relative impedance: the running sum of each trace.
   *
   * A running sum drifts, because any small bias in the trace accumulates
   * down the whole record. That drift is not information — it sits below the
   * band the survey recorded, and it is the same part of the answer the low
   * frequency model exists to supply. So the drift is filtered back out at
   * fLo, which leaves a curve holding exactly the band the recording holds.
   *
   * The result has no units and no level. Both come from calibrateAtWell and
   * a background model.
   */
  function relativeImpedance(section, fLo) {
    const cut = fLo || 10;
    const out = new Float32Array(NX * NT);
    for (let ix = 0; ix < NX; ix++) {
      const off = ix * NT;
      let run = 0;
      for (let it = 0; it < NT; it++) {
        run += section[off + it];
        out[off + it] = run;
      }
      const drift = lowPassTrace(out, off, cut);
      for (let it = 0; it < NT; it++) out[off + it] -= drift[it];
    }
    return out;
  }

  /**
   * The number that turns a relative result into impedance units.
   *
   * A summed trace is a shape. Giving it units means matching it against
   * something measured, which in the field means a well: the scale is the one
   * that makes the relative curve at the well trace sit as close as it can to
   * the seismic-band part of the impedance log there. This is a real step in a
   * real project, and it is another place where a well decides the numbers on
   * the color bar.
   */
  function calibrateAtWell(rel, z, wellIx, fLo) {
    const cut = fLo || 10;
    const i0 = window0(), i1 = window1();
    // wellIx of null or undefined calibrates against the whole line, which is
    // what a module wants when it is isolating some other variable and does not
    // want the scaling moving underneath it as well.
    const list = (wellIx === null || wellIx === undefined)
      ? Array.from({ length: NX }, (_, i) => i)
      : [clamp(wellIx, 0, NX - 1)];
    let num = 0, den = 0;
    list.forEach((ix) => {
      const off = ix * NT;
      const lo = lowPassTrace(z, off, cut);
      for (let it = i0; it < i1; it++) {
        const target = z[off + it] - lo[it];     // what the seismic could see
        const have = rel[off + it];
        num += target * have;
        den += have * have;
      }
    });
    return den > 0 ? num / den : 1;
  }

  /** Multiply a field through by a scalar. */
  function scaleField(field, k) {
    const out = new Float32Array(field.length);
    for (let i = 0; i < field.length; i++) out[i] = field[i] * k;
    return out;
  }

  /** Absolute impedance: the relative result standing on a background model. */
  function absoluteImpedance(rel, background) {
    const out = new Float32Array(NX * NT);
    for (let i = 0; i < rel.length; i++) out[i] = rel[i] + background[i];
    return out;
  }

  /* --- drawing -------------------------------------------------------------
     Thin wrappers over the shared helpers, so every module draws this line the
     same way and a student can carry a feature from one panel to the next. */

  /** Time in seconds to a y position inside a panel rectangle. */
  function yAt(t, rect) {
    return rect.y + rect.h * (clamp(t, TV0, TV1) - TV0) / (TV1 - TV0);
  }

  /** The sample range the drawn window covers. */
  function window0() { return Math.round(TV0 / DT); }
  function window1() { return Math.round(TV1 / DT); }

  /**
   * Draw a field as a variable-density image inside rect, cropped to the
   * display window.
   *
   *   cmap  a function of a value in [-1, 1] returning [r, g, b]
   *   rng   [lo, hi] the value range mapped onto that
   */
  function drawField(ctx, field, rect, cmap, rng) {
    const i0 = window0(), i1 = window1(), nt = i1 - i0;
    const crop = new Float32Array(NX * nt);
    const lo = rng[0], hi = rng[1], mid = (lo + hi) / 2, halfSpan = (hi - lo) / 2;
    for (let ix = 0; ix < NX; ix++) {
      for (let it = 0; it < nt; it++) {
        crop[ix * nt + it] = (field[ix * NT + i0 + it] - mid) / halfSpan;
      }
    }
    SEIS.drawVarDensity(ctx, crop, NX, nt, rect, { cmap: cmap, gain: 1, clip: 1 });
    SEIS.frame(ctx, rect);
  }

  /** Time down the side of a panel, every 100 ms. */
  function timeScale(ctx, rect, withLabel) {
    const ticks = [];
    for (let t = Math.ceil(TV0 * 10) / 10; t <= TV1 + 1e-9; t += 0.1) {
      ticks.push({ pos: (t - TV0) / (TV1 - TV0), label: String(Math.round(t * 1000)) });
    }
    PANEL.sideScale(ctx, rect, ticks, withLabel === false ? '' : 'ms');
  }

  /** Trace numbers along the bottom, and the well if there is one. */
  function traceScale(ctx, rect, wellIx, slate) {
    ctx.save();
    ctx.font = '9px "IBM Plex Mono", monospace';
    ctx.fillStyle = slate || '#5C6670';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';  ctx.fillText('trace 1', rect.x, rect.y + rect.h + 5);
    ctx.textAlign = 'right'; ctx.fillText('trace ' + NX, rect.x + rect.w, rect.y + rect.h + 5);
    ctx.restore();
    if (wellIx !== undefined && wellIx !== null) markWell(ctx, rect, wellIx);
  }

  /** Where a well sits on the line, drawn down the whole panel. */
  function markWell(ctx, rect, ix, label) {
    const x = rect.x + rect.w * (ix + 0.5) / NX;
    ctx.save();
    ctx.strokeStyle = 'rgba(22,25,28,.55)';
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x, rect.y); ctx.lineTo(x, rect.y + rect.h); ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '600 9.5px "IBM Plex Sans", sans-serif';
    ctx.fillStyle = '#16191C';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(label || 'well', x, rect.y - 3);
    ctx.restore();
  }

  /** The outline of the gas sand, for panels that need to say where it is. */
  function outlineGasSand(ctx, rect, color) {
    ctx.save();
    ctx.strokeStyle = color || 'rgba(22,25,28,.75)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    let started = false;
    for (let ix = 0; ix < NX; ix++) {
      if (gasFraction(ix) < 0.5) { started = false; continue; }
      const x = rect.x + rect.w * (ix + 0.5) / NX;
      const y = yAt(T_SAND_TOP + structure(ix), rect);
      if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
    }
    for (let ix = NX - 1; ix >= 0; ix--) {
      if (gasFraction(ix) < 0.5) continue;
      const x = rect.x + rect.w * (ix + 0.5) / NX;
      ctx.lineTo(x, yAt(T_SAND_TOP + SAND_THICK + structure(ix), rect));
    }
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  /* --- reading values off the model ---------------------------------------- */

  /** Mean of a field over the gas sand, where the gas actually is. */
  function meanInGasSand(field) {
    let sum = 0, n = 0;
    for (let ix = 0; ix < NX; ix++) {
      if (gasFraction(ix) < 0.7) continue;
      const s = structure(ix);
      const i0 = Math.round((T_SAND_TOP + s) / DT);
      const i1 = Math.round((T_SAND_TOP + SAND_THICK + s) / DT);
      for (let it = i0; it < i1; it++) { sum += field[ix * NT + it]; n++; }
    }
    return n ? sum / n : 0;
  }

  /** Mean of a field in the shale just above the sand, for a contrast. */
  function meanAboveSand(field) {
    let sum = 0, n = 0;
    for (let ix = 0; ix < NX; ix++) {
      const s = structure(ix);
      const i1 = Math.round((T_SAND_TOP + s) / DT) - 3;
      const i0 = i1 - 12;
      for (let it = i0; it < i1; it++) { sum += field[ix * NT + it]; n++; }
    }
    return n ? sum / n : 0;
  }

  /** How well two fields agree, as a correlation over the drawn window. */
  function agreement(a, b) {
    const i0 = window0(), i1 = window1();
    let ma = 0, mb = 0, n = 0;
    for (let ix = 0; ix < NX; ix++) {
      for (let it = i0; it < i1; it++) { ma += a[ix * NT + it]; mb += b[ix * NT + it]; n++; }
    }
    ma /= n; mb /= n;
    let num = 0, va = 0, vb = 0;
    for (let ix = 0; ix < NX; ix++) {
      for (let it = i0; it < i1; it++) {
        const da = a[ix * NT + it] - ma, db = b[ix * NT + it] - mb;
        num += da * db; va += da * da; vb += db * db;
      }
    }
    return (va > 0 && vb > 0) ? num / Math.sqrt(va * vb) : 0;
  }

  return {
    NX, NT, DT, TV0, TV1, Z_RANGE, A_RANGE, R_RANGE,
    T_MARKER_TOP, T_WEDGE_TOP, T_SAND_TOP, SAND_THICK, T_CARBONATE,
    GAS_SAND, BRINE_SAND, WEDGE_SAND, MARKER, CARBONATE,
    structure, gasFraction, shaleLensFraction, wedgeThickness, shaleAt,
    vpvsField, shearImpedanceField, meanInShaleLens,
    ZS_RANGE: [1800, 7600], VPVS_RANGE: [1.5, 2.5],
    impedanceField, reflectivityFrom, sectionFrom, addNoise,
    lowFrequencyComponent, backgroundModel,
    relativeImpedance, calibrateAtWell, scaleField, absoluteImpedance,
    yAt, window0, window1, drawField, timeScale, traceScale, markWell,
    outlineGasSand, meanInGasSand, meanAboveSand, agreement,
  };
})();
