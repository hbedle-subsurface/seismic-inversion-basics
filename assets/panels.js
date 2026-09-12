/* =============================================================================
   panels.js — labelling helpers, shared by every module in this set.
   Heather Bedle and April Moreno-Ward / AASPI / University of Oklahoma

   These exist because of one problem seen over and over in teaching figures:
   the caption says "impedance: yours teal, multiplied red" and the student has
   to hold a color key in their head while looking at the picture. Labelling a
   curve where it actually runs removes that step. A beginner should be able to
   read a panel without reading anything underneath it.

   Every function here draws only. Nothing computes.

   Load after seismic.js and before the module's own script.
   ========================================================================== */

const PANEL = (function () {
  'use strict';

  const MONO = '"IBM Plex Mono", monospace';
  const SANS = '"IBM Plex Sans", sans-serif';
  const SLATE = '#5C6670';
  const INK = '#16191C';

  /* --- what a track is measuring ------------------------------------------
     A short heading above a vertical track, giving the quantity and its units,
     with the range at the two ends. Without this a student sees two numbers
     floating over a wiggle and has to guess what they count.                */
  /* The name of the quantity, its units, and the two ends of its range,
     written above a panel.

     This needs 28 px of clear space above rect.y: the name sits on a baseline
     17 px up in an 11 px face, so its ascenders reach rect.y - 28. Panels that
     left less than that clipped the title against the top of the canvas. A
     module that calls this has to leave the room. */
  function quantity(ctx, rect, name, units, lo, hi, fmt) {
    const f = fmt || ((v) => String(Math.round(v)));
    ctx.save();
    ctx.font = '600 11px ' + SANS;
    ctx.fillStyle = INK;
    ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
    ctx.fillText(name, rect.x, rect.y - 17);
    if (units) {
      /* The units sit just after the name. On a narrow panel that ran them off
         the right-hand edge of the canvas, so when they will not fit they are
         moved to the right edge of the panel instead of being cut off. */
      ctx.font = '10px ' + MONO;
      ctx.fillStyle = SLATE;
      const after = rect.x + measure(ctx, name, '600 11px ' + SANS) + 7;
      const uw = ctx.measureText(units).width;
      ctx.textAlign = (after + uw > rect.x + rect.w) ? 'right' : 'left';
      ctx.fillText(units, ctx.textAlign === 'right' ? rect.x + rect.w : after, rect.y - 17);
      ctx.textAlign = 'left';
    }
    ctx.font = '10px ' + MONO;
    ctx.fillStyle = SLATE;
    ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
    ctx.fillText(f(lo), rect.x, rect.y - 4);
    ctx.textAlign = 'right';
    ctx.fillText(f(hi), rect.x + rect.w, rect.y - 4);
    ctx.restore();
  }


  function measure(ctx, text, font) {
    ctx.save(); ctx.font = font;
    const w = ctx.measureText(text).width;
    ctx.restore(); return w;
  }

  /* --- name a curve where it runs -----------------------------------------
     Places a small label beside a curve at a given fraction down the panel,
     in the curve's own color, with a pale backing so it stays readable over
     whatever it lands on.                                                   */
  function curveLabel(ctx, rect, values, rng, frac, text, color, side) {
    const n = values.length;
    const i = Math.max(0, Math.min(n - 1, Math.round(frac * (n - 1))));
    const f = (values[i] - rng[0]) / (rng[1] - rng[0]);
    const x = rect.x + Math.max(0.02, Math.min(0.98, f)) * rect.w;
    const y = rect.y + frac * rect.h;
    tagAt(ctx, x, y, text, color, side || (f > 0.6 ? 'right' : 'left'));
  }

  /* A label at an explicit position, backed so it reads over anything. */
  /* A label placed against a feature inside a panel, on a pale ground so it
     stays readable over a curve. Like SEIS.tag, it is kept inside the canvas:
     a label anchored at the middle of a narrow panel can be wider than the room
     to its right, and losing the end of it is worse than moving it. */
  function tagAt(ctx, x, y, text, color, align) {
    ctx.save();
    ctx.font = '600 10.5px ' + SANS;
    const w = ctx.measureText(text).width;
    const pad = 4;
    let bx = x + 7;
    if (align === 'right') bx = x - 7 - w - 2 * pad;
    const cw = (ctx.canvas && ctx.canvas.style && parseFloat(ctx.canvas.style.width)) || 0;
    if (cw) {
      if (bx + w + 2 * pad > cw - 2) bx = cw - 2 - w - 2 * pad;
      if (bx < 2) bx = 2;
    }
    ctx.fillStyle = 'rgba(255,255,255,.84)';
    ctx.fillRect(bx, y - 8, w + 2 * pad, 16);
    ctx.fillStyle = color;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(text, bx + pad, y);
    ctx.restore();
  }

  /* --- which way is down ---------------------------------------------------
     Every vertical panel on this site has time increasing downward, which is
     obvious to a geophysicist and not to a first-year student. This draws a
     small arrow and the word, once per row of panels.                       */
  function downArrow(ctx, rect, label) {
    const x = rect.x - 30;
    const y0 = rect.y + rect.h * 0.30, y1 = rect.y + rect.h * 0.62;
    ctx.save();
    ctx.strokeStyle = SLATE; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1 - 5); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 3.5, y1 - 6); ctx.lineTo(x + 3.5, y1 - 6); ctx.lineTo(x, y1);
    ctx.closePath(); ctx.fillStyle = SLATE; ctx.fill();
    ctx.font = '9.5px ' + MONO;
    ctx.translate(x - 5, (y0 + y1) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(label || 'deeper', 0, 0);
    ctx.restore();
  }

  /* --- a time scale down the side -----------------------------------------
     ticks: [{ t, label }] in the panel's own sample or time units, with pos
     given as a fraction from the top.                                       */
  function sideScale(ctx, rect, ticks, unitLabel) {
    ctx.save();
    ctx.font = '9px ' + MONO;
    ctx.fillStyle = SLATE;
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ticks.forEach((tk) => {
      const y = rect.y + tk.pos * rect.h;
      ctx.fillText(tk.label, rect.x - 6, y);
      ctx.strokeStyle = 'rgba(201,205,210,.75)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(rect.x, y); ctx.lineTo(rect.x + rect.w, y); ctx.stroke();
    });
    if (unitLabel) {
      ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      ctx.fillText(unitLabel, rect.x - 6, rect.y - 4);
    }
    ctx.restore();
  }

  return { quantity, curveLabel, tagAt, downArrow, sideScale };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = PANEL;
