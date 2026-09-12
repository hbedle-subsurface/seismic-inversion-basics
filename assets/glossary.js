/* ===========================================================================
   glossary.js — click a technical word, get a short definition in place
   Heather Bedle and April Moreno-Ward / AASPI / University of Oklahoma

   Why this exists: the audience for this set is geologists, and the modules
   use the vocabulary a geophysicist uses because that is the vocabulary the
   student will meet in industry. A student who does not know what "tuning"
   means should not have to leave the page, find the glossary, read it, come
   back and find their place again.

   WHAT IT DOES: after the page loads, it looks through the prose for the
   terms defined below and marks the first couple of occurrences of each one
   in each step. Clicking a marked term opens a small card next to it with a
   definition and a link to the full glossary entry.

   WHAT IT DOES NOT TOUCH: headings, links, buttons, labels, input values,
   canvases, code, and anything already marked. Nothing is fetched, sent or
   stored. It works from a file:// copy with no network.

   HOW TO INSTALL: one script tag per page, alongside the other shared
   scripts. No markup change and no stylesheet change — the styles this needs
   are injected by the script, so a page that does not load it looks exactly
   as it did before.

   TO ADD A TERM: add an entry to TERMS. The key is what a student reads; the
   `also` list is other spellings and plurals that should mark the same card.
   Keep the definition to two or three sentences. The glossary page is where
   the longer version lives.

   License: CC BY-SA 4.0, the same as the repository it ships in.
   =========================================================================== */

const GLOSS = (function () {
  'use strict';

  /* ---------------------------------------------------------------------
     THE TERMS

     def   two or three sentences, in the plainest words that are still
           correct. A definition that needs a second definition to read is
           not doing its job.
     mod   the module where the idea is built, so the card can send a
           student to where they can watch it happen.
     also  other forms that should mark the same card.
     --------------------------------------------------------------------- */

  const M = {
    m1: ['modules/01-rock-makes-seismic.html', 'Module 1'],
    m2: ['modules/02-a-number-about-a-rock.html', 'Module 2'],
    m3: ['modules/03-what-the-wavelet-does.html', 'Module 3'],
    m4: ['modules/04-more-than-one-answer.html', 'Module 4'],
    m5: ['modules/05-tying-a-well.html', 'Module 5'],
    m6: ['modules/06-never-recorded.html', 'Module 6'],
    m7: ['modules/07-reading-a-result.html', 'Module 7'],
    m8: ['modules/08-the-family-of-methods.html', 'Module 8'],
  };

  const TERMS = {
    'acoustic impedance': {
      def: 'Velocity multiplied by density, written Zp or Ip. It is one number that describes a single rock, in the same way a porosity or a density is one number about a single rock.',
      mod: 'm2', also: ['impedance', 'impedances', 'acoustic impedances'],
    },
    'reflection coefficient': {
      def: 'How much of an arriving wave comes back from a boundary: the difference in impedance across the boundary divided by the sum of the two impedances. It is a fraction of the amplitude and it carries a sign, and it describes a pair of rocks rather than either one on its own. The fraction of the energy that returns is its square.',
      mod: 'm1', also: ['reflection coefficients'],
    },
    'reflectivity series': {
      def: 'The reflection coefficients of a whole stack of layers, each placed at the two-way time its boundary sits at. Mostly zeros, with a value wherever the rock changes.',
      mod: 'm1', also: ['reflectivity'],
    },
    'wavelet': {
      def: 'The short burst of energy a seismic source leaves on the record, a few cycles long. The recording holds one copy of this shape for every reflection, which is why boundaries close together interfere with one another.',
      mod: 'm3', also: ['wavelets'],
    },
    'convolution': {
      def: 'Laying a copy of the wavelet on every reflection, scaled by the size of that reflection, and adding wherever the copies overlap. It is how a reflectivity series becomes a trace.',
      mod: 'm1', also: ['convolved', 'convolve', 'convolving'],
    },
    'forward problem': {
      def: 'Working out the seismic from the rock. It has one answer and needs no judgment. A synthetic seismogram is a forward calculation.',
      mod: 'm1', also: ['forward modeling', 'forward model'],
    },
    'inverse problem': {
      def: 'Working out the rock from the seismic. This is what seismic inversion is, and it does not have one answer.',
      mod: 'm1', also: [],
    },
    'non-uniqueness': {
      def: 'More than one arrangement of rock produces the same recording. It is not a fault in the method or in the data: the information that would separate those arrangements was never in the recording.',
      mod: 'm4', also: ['nonuniqueness', 'non-unique', 'nonunique'],
    },
    'resolution': {
      def: 'How thin a bed can be before its top and its base stop arriving as two separate events. It is set by the wavelet, not by the geology.',
      mod: 'm3', also: [],
    },
    'wedge model': {
      def: 'A bed drawn as a wedge, with a trace computed at every position across it, so the true boundaries and the events an interpreter would pick can be followed together as the bed thins to nothing.',
      mod: 'm3', also: ['wedge'],
    },
    'tuning': {
      def: 'Below about a quarter of a wavelength the reflections from the top and the base of a bed overlap and add together, so the size of the single event that is left depends on the thickness as much as on the rock.',
      mod: 'm3', also: ['tuning thickness', 'tuned'],
    },
    'bandwidth': {
      def: 'The range of frequencies a survey actually recorded. Anything outside it is missing from the data and has to come from somewhere else.',
      mod: 'm6', also: ['band-limited', 'band limited', 'seismic band'],
    },
    'low-frequency component': {
      def: 'The part of the earth\'s impedance that varies more slowly with depth than the seismic band reaches: the compaction trend, and the overall level. It is a property of the rock and exists whether or not anyone measures it. No survey records it.',
      mod: 'm6', also: ['low-frequency trend', 'low frequency component'],
    },
    'low-frequency model': {
      def: 'Somebody\'s estimate of the low-frequency component, built by filtering impedance logs down to the missing band and interpolating them across the survey along horizons. It is a thing a person makes, not a thing the seismic measured, and everything it gets wrong goes straight into the answer. Also called the background model.',
      mod: 'm6', also: ['low frequency model', 'background model'],
    },
    'relative acoustic impedance': {
      def: 'What summing a seismic trace gives: a curve with the right shape but no absolute value and no slow trend. It uses the recording alone, with no well logs, which is why it appears as a one-click attribute in most interpretation packages.',
      mod: 'm6', also: ['relative impedance'],
    },
    'colored inversion': {
      def: 'A single filter, designed once from well logs, that turns a seismic volume into something with the frequency character of an impedance log. Fast over a whole volume, and relative rather than absolute.',
      mod: 'm8', also: ['coloured inversion'],
    },
    'sparse-spike inversion': {
      def: 'An inversion that assumes the earth has only a few significant boundaries and looks for them. How many spikes are allowed is a choice somebody makes, not something the seismic decides.',
      mod: 'm8', also: ['sparse spike inversion', 'sparse-spike'],
    },
    'model-based inversion': {
      def: 'An inversion that starts from a background model, adjusts it until the synthetic it produces matches the recording, and returns absolute impedance. This is what most commercial products mean by inversion.',
      mod: 'm8', also: ['model based inversion'],
    },
    'full-waveform inversion': {
      def: 'A method that builds a detailed velocity model from the recorded waveforms, mainly to improve the image. It answers a different question from the reservoir methods, and needs long offsets, low frequencies and a good starting model.',
      mod: 'm8', also: ['FWI', 'full waveform inversion'],
    },
    'post-stack inversion': {
      def: 'Inversion of the ordinary stacked seismic volume. It returns acoustic impedance and nothing else, because stacking has already averaged the angles together.',
      mod: 'm8', also: ['post-stack', 'poststack'],
    },
    'pre-stack inversion': {
      def: 'Inversion that keeps the different angles separate instead of averaging them, which allows a second rock property to be estimated alongside acoustic impedance.',
      mod: 'm8', also: ['pre-stack', 'prestack'],
    },
    'deterministic inversion': {
      def: 'An inversion that returns one best-fitting model. Most commercial inversion is of this kind.',
      mod: 'm8', also: [],
    },
    'stochastic inversion': {
      def: 'An inversion that returns many models which all fit the data, so the spread between them can be measured. It is a way of putting a number on non-uniqueness rather than hiding it.',
      mod: 'm8', also: [],
    },
    'prior information': {
      def: 'Anything used to choose among the models that fit the data equally well: wells, geology, rock physics, or an assumption about how simple the answer ought to be.',
      mod: 'm4', also: ['prior'],
    },
    'two-way time': {
      def: 'The time a wave takes to travel down to a boundary and back up to the surface. Seismic data is recorded in two-way time; wells are measured in depth, and the two are not proportional to each other.',
      mod: 'm5', also: ['two way time', 'TWT'],
    },
    'polarity': {
      def: 'Which way a reflection deflects on the display. It follows the sign of the reflection coefficient, so it says whether the impedance stepped up or down at that boundary — provided you know the convention the display is drawn with.',
      mod: 'm1', also: [],
    },
    'zero-phase': {
      def: 'A wavelet whose largest excursion sits at the same time as the boundary that produced it, with symmetric side lobes. Processing aims for it, because it is the only shape for which the event centers on the interface.',
      mod: 'm7', also: ['zero phase'],
    },
    'synthetic seismogram': {
      def: 'A trace calculated from well logs: impedance from the sonic and density logs, reflection coefficients from the impedance, then a wavelet convolved onto them. It is the forward problem run on real logs.',
      mod: 'm5', also: ['synthetic', 'synthetics'],
    },
    'well tie': {
      def: 'Matching a synthetic seismogram made from well logs against the recorded seismic at the well, and stretching the time scale until the two line up. It is what fixes the relationship between depth in the well and time on the seismic.',
      mod: 'm5', also: ['well ties', 'tie the well'],
    },
    'checkshot': {
      def: 'A direct measurement of travel time to known depths in a well, made by recording a surface source on a geophone lowered down the hole. It anchors the time-depth relationship that the sonic log alone gets slightly wrong.',
      mod: 'm5', also: ['check shot', 'checkshot survey'],
    },
    'sonic log': {
      def: 'A well log of how long a wave takes to travel a fixed distance through the rock at the borehole wall, usually in microseconds per foot or per meter. Its reciprocal is velocity.',
      mod: 'm5', also: ['sonic'],
    },
    'bright spot': {
      def: 'A reflection that is noticeably stronger than the ones around it. It is often taken as a fluid indicator, though thickness and lithology change amplitude as well, which is the difficulty module 4 is built around.',
      mod: 'm4', also: ['bright spots'],
    },
    'misfit': {
      def: 'A number that says how far a synthetic trace is from the recorded one, usually the sum of the squared differences sample by sample. An inversion adjusts its model to make this small.',
      mod: 'm8', also: [],
    },
    'deconvolution': {
      def: 'A processing step that shortens the wavelet, so that reflections close together arrive as separate events rather than one blended one. It broadens the bandwidth at the high end, and does not recover the low frequencies.',
      mod: 'm6', also: ['deconvolved', 'decon'],
    },
    'stacking': {
      def: 'Adding together the traces that reflected from the same subsurface point at different source-receiver distances. It raises the signal against the noise, and averages away the change of amplitude with angle.',
      mod: 'm8', also: ['stacked', 'the stack'],
    },
    'trace': {
      def: 'The recording at one surface location: amplitude against two-way time, drawn as a wiggle. A seismic section is a row of traces side by side.',
      mod: 'm1', also: ['traces'],
    },
    'amplitude': {
      def: 'How far the trace departs from zero at a given time. It carries the size of the reflection there, blended with the reflections near it, and scaled by whatever gain the processing applied.',
      mod: 'm1', also: ['amplitudes'],
    },
    'frequency': {
      def: 'How many cycles a wave completes per second, in hertz. A wavelet is a mixture of frequencies rather than one, and the range a survey holds is its bandwidth.',
      mod: 'm3', also: ['frequencies'],
    },
    'phase': {
      def: 'Where a wavelet sits relative to the boundary that produced it. A zero-phase wavelet is centered on the boundary; other phases shift and distort the event, and phase cannot be checked from the seismic alone.',
      mod: 'm5', also: [],
    },
    'amplitude spectrum': {
      def: 'A plot of how much energy a signal holds at each frequency. It is where the band a survey recorded is visible, and where the absence of the low frequencies is visible as well.',
      mod: 'm6', also: ['spectrum', 'spectra'],
    },
    'offset': {
      def: 'The distance between the source and the receiver that recorded a given reflection. A larger offset means the wave struck the boundary at a larger angle, which is the information stacking averages away.',
      mod: 'm8', also: ['offsets'],
    },
    'gather': {
      def: 'The set of traces that recorded the same subsurface point at different offsets, collected together before stacking. A pre-stack inversion works on gathers; a post-stack one works on what is left after they are summed.',
      mod: 'm8', also: ['gathers', 'angle gather', 'angle gathers'],
    },
    'angle stack': {
      def: 'Traces stacked within a range of angles rather than across all of them — a near stack, a mid stack, a far stack. It is a middle course between keeping every offset and averaging them all together.',
      mod: 'm8', also: ['angle stacks', 'near stack', 'far stack'],
    },
    'horizon': {
      def: 'A boundary followed across a seismic survey and picked as a surface. Horizons carry a low-frequency model away from the wells, and a tie that is out moves every horizon by the same amount.',
      mod: 'm7', also: ['horizons'],
    },
    'shear impedance': {
      def: 'Density multiplied by shear-wave velocity, written Zs or Is. Gas in the pore space lowers the compressional velocity sharply and leaves the shear velocity almost alone, so Zs separates rocks that acoustic impedance alone cannot.',
      mod: 'm8', also: ['Zs'],
    },
    'Vp/Vs': {
      def: 'The ratio of compressional to shear velocity. It falls in a gas-charged sand and stays high in a shale, which makes it one of the more useful things a pre-stack inversion returns.',
      mod: 'm8', also: ['Vp/Vs ratio'],
    },
    'shear sonic': {
      def: 'A well log of shear-wave travel time, recorded by a tool that measures it alongside the compressional. Without one in at least one well, a pre-stack inversion has nothing to calibrate its second property against.',
      mod: 'm8', also: [],
    },
    'density log': {
      def: 'A well log of bulk density, measured from how strongly the formation scatters gamma rays from a source in the tool. With velocity from the sonic it gives impedance.',
      mod: 'm5', also: [],
    },
    'time-depth curve': {
      def: 'A two-way time for every depth in a well, built by adding up the travel time across each sonic log sample and anchored by a checkshot. It is what a well tie produces and what everything afterwards reads in both directions.',
      mod: 'm5', also: ['time-depth relationship', 'time-depth'],
    },
    'cycle skip': {
      def: 'A tie settled a whole wavelet period away from the truth, so the synthetic is matched to the neighbouring loop of the wavelet rather than the right one. The correlation can look good and every depth is out by one cycle.',
      mod: 'm5', also: ['cycle skipping'],
    },
    'Ricker wavelet': {
      def: 'A simple symmetric wavelet with one peak and a trough either side, defined by a single peak frequency. Real wavelets are messier; this one is used throughout for teaching because it has one number to change.',
      mod: 'm3', also: ['Ricker'],
    },
    'realization': {
      def: 'One of the many models a stochastic inversion returns, each fitting the recording as well as the others. The value is in how much they disagree, which is a number a single answer cannot give.',
      mod: 'm8', also: ['realizations'],
    },
    'running sum': {
      def: 'Adding a trace up sample by sample. It undoes the differencing that made the reflection coefficients, which recovers the shape of the impedance and nothing else — no level and no slow trend.',
      mod: 'm6', also: ['summing the trace', 'summed trace'],
    },
    'elastic property': {
      def: 'A property describing how a rock deforms under a passing wave — acoustic impedance, shear impedance, Vp/Vs and the rest. One of them rarely names a rock; two together often narrow it usefully.',
      mod: 'm8', also: ['elastic properties'],
    },
    'AVO': {
      def: 'Amplitude versus offset: how the size of a reflection changes as the angle at which the wave struck the boundary increases. It is the information stacking averages away and pre-stack inversion keeps.',
      mod: 'm8', also: ['amplitude versus offset'],
    },
    'Zoeppritz equations': {
      def: 'The equations giving how much energy a boundary between two elastic rocks reflects at each angle. They are exact and unwieldy, so approximations to them are what pre-stack inversion is built on.',
      mod: 'm8', also: ['Zoeppritz'],
    },
    'migration': {
      def: 'The processing step that moves reflections to where they actually came from, which for a dipping or curved boundary is not directly beneath the recording point. Inversion assumes it has already been done properly.',
      mod: 'm3', also: ['migrated'],
    },
    'ground roll': {
      def: 'Slow, low-frequency surface waves that travel along the ground rather than down through it. They arrive with far more energy than the reflections and are filtered out — which is one reason a survey holds no low frequencies.',
      mod: 'm6', also: [],
    },
    'side lobe': {
      def: 'The smaller excursions either side of a wavelet\'s main peak. They belong to the wavelet rather than to the rock, and picking one by mistake is how a horizon ends up half a lobe off.',
      mod: 'm3', also: ['side lobes'],
    },
    'gas sand': {
      def: 'A porous sand whose pore space holds gas rather than brine. Gas lowers both the velocity and the density of the rock, so it lowers the impedance, often enough to make the sand softer than the shale above it.',
      mod: 'm4', also: ['gas-filled sand', 'gas sands'],
    },
  };

  /* ---------------------------------------------------------------------
     BUILDING THE MATCH LIST

     Longest first, so "acoustic impedance" is matched before "impedance"
     and "pre-stack inversion" before "pre-stack".
     --------------------------------------------------------------------- */

  const ENTRIES = [];
  Object.keys(TERMS).forEach(function (key) {
    const t = TERMS[key];
    const forms = [key].concat(t.also || []);
    forms.forEach(function (form) {
      ENTRIES.push({ form: form, key: key });
    });
  });
  ENTRIES.sort(function (a, b) { return b.form.length - a.form.length; });

  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  // Word boundaries that also work when a term ends in a hyphenated piece.
  // Plain word boundaries. A lookbehind would read more clearly but is not
  // available in every browser a student turns up with, and \b is enough
  // here because the alternation is tried longest-first: at the start of
  // "acoustic impedance" the two-word form matches before the one-word one.
  const RE = new RegExp(
    '\\b(' +
    ENTRIES.map(function (e) { return escapeRe(e.form); }).join('|') +
    ')\\b', 'i'
  );

  const BY_FORM = {};
  ENTRIES.forEach(function (e) { BY_FORM[e.form.toLowerCase()] = e.key; });

  /* ---------------------------------------------------------------------
     WHERE IT IS ALLOWED TO MARK

     Prose only. A term inside a heading, a link, a button, a control label
     or a canvas caption is either already doing a job or is not text at
     all, and marking it there makes the page noisier without helping.
     --------------------------------------------------------------------- */

  const SKIP_TAGS = {
    A: 1, BUTTON: 1, CANVAS: 1, CODE: 1, PRE: 1, SCRIPT: 1, STYLE: 1,
    INPUT: 1, LABEL: 1, SELECT: 1, TEXTAREA: 1, OPTION: 1, SVG: 1,
    H1: 1, H2: 1, H3: 1, H4: 1, DT: 1, NOSCRIPT: 1,
  };

  // Prose containers. A pane's whole text is walked, but only these hold
  // sentences a student reads.
  const PROSE = 'p, li, dd, td, .said, .fix, .sub, .lede';

  // How many times one term is marked inside one step. Twice is enough to
  // be findable; more turns the page into a field of dotted underlines.
  const PER_TERM_PER_SECTION = 2;

  function injectCSS() {
    if (document.getElementById('gloss-css')) return;
    const css = [
      '.gterm{border:0;background:none;padding:0;margin:0;font:inherit;color:inherit;',
      '  cursor:help;border-bottom:1px dotted var(--slate,#5C6670);',
      '  text-underline-offset:2px;}',
      '.gterm:hover,.gterm:focus{border-bottom-style:solid;color:var(--crim,#841617);outline:none;}',
      '.gterm[aria-expanded="true"]{color:var(--crim,#841617);border-bottom-style:solid;}',
      '.gcard{position:absolute;z-index:4000;max-width:340px;background:#fff;',
      '  border:1px solid var(--rule,#C9CDD2);border-left:3px solid var(--crim,#841617);',
      '  box-shadow:0 6px 22px rgba(20,24,28,.16);padding:13px 15px 12px;',
      '  font-family:var(--body,"IBM Plex Sans",system-ui,sans-serif);}',
      '.gcard h5{margin:0 0 6px;font-family:var(--display,Archivo,sans-serif);',
      '  font-size:13px;letter-spacing:.02em;color:var(--ink,#16191C);}',
      '.gcard p{margin:0;font-size:13.5px;line-height:1.55;color:var(--ink,#16191C);}',
      '.gcard .gfoot{margin-top:9px;display:flex;justify-content:space-between;',
      '  align-items:baseline;gap:12px;font-family:var(--mono,monospace);font-size:10.5px;',
      '  letter-spacing:.07em;text-transform:uppercase;}',
      '.gcard .gfoot a{color:var(--crim,#841617);text-decoration:none;',
      '  border-bottom:1px solid rgba(132,22,23,.35);}',
      '.gcard .gclose{border:0;background:none;cursor:pointer;color:var(--slate,#5C6670);',
      '  font:inherit;letter-spacing:.07em;text-transform:uppercase;padding:0;}',
      '@media print{.gterm{border-bottom:0;}.gcard{display:none;}}',
    ].join('\n');
    const el = document.createElement('style');
    el.id = 'gloss-css';
    el.textContent = css;
    document.head.appendChild(el);
  }

  /* ---------------------------------------------------------------------
     THE CARD
     --------------------------------------------------------------------- */

  let card = null, openBtn = null;

  function closeCard() {
    if (card) { card.remove(); card = null; }
    if (openBtn) { openBtn.setAttribute('aria-expanded', 'false'); openBtn = null; }
  }

  // How deep this page sits, so the glossary link works from the root and
  // from modules/ without either one being special-cased.
  function root() {
    return /\/modules\//.test(location.pathname) ? '../' : '';
  }

  function anchorId(key) {
    return 'g-' + key.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  }

  function openCard(btn, key) {
    const t = TERMS[key];
    if (!t) return;
    closeCard();

    card = document.createElement('div');
    card.className = 'gcard';
    card.setAttribute('role', 'dialog');

    const h = document.createElement('h5');
    h.textContent = key.charAt(0).toUpperCase() + key.slice(1);
    const p = document.createElement('p');
    p.textContent = t.def;

    const foot = document.createElement('div');
    foot.className = 'gfoot';
    const a = document.createElement('a');
    const where = M[t.mod];
    a.href = root() + 'glossary.html#' + anchorId(key);
    a.textContent = where ? 'Full glossary — built in ' + where[1] : 'Full glossary';
    const x = document.createElement('button');
    x.type = 'button';
    x.className = 'gclose';
    x.textContent = 'close';
    x.addEventListener('click', closeCard);
    foot.appendChild(a);
    foot.appendChild(x);

    card.appendChild(h);
    card.appendChild(p);
    card.appendChild(foot);
    document.body.appendChild(card);

    // Placed against the document, not the viewport, so it stays with the
    // word when the page is scrolled.
    const r = btn.getBoundingClientRect();
    const sx = window.pageXOffset, sy = window.pageYOffset;
    const w = card.offsetWidth, h2 = card.offsetHeight;
    let left = r.left + sx;
    let top = r.bottom + sy + 8;
    const maxLeft = sx + document.documentElement.clientWidth - w - 14;
    if (left > maxLeft) left = Math.max(sx + 10, maxLeft);
    // Not enough room below: put it above the word instead.
    if (r.bottom + h2 + 20 > document.documentElement.clientHeight && r.top > h2 + 20) {
      top = r.top + sy - h2 - 8;
    }
    card.style.left = Math.round(left) + 'px';
    card.style.top = Math.round(top) + 'px';

    openBtn = btn;
    btn.setAttribute('aria-expanded', 'true');
  }

  /* ---------------------------------------------------------------------
     MARKING THE PROSE
     --------------------------------------------------------------------- */

  function markIn(container, counts) {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue || n.nodeValue.length < 4) return NodeFilter.FILTER_REJECT;
        let p = n.parentNode;
        while (p && p !== container) {
          if (p.nodeType === 1) {
            // Anything that is not ordinary HTML — an inline SVG thumbnail,
            // for instance — is left alone entirely.
            if (p.namespaceURI && p.namespaceURI !== 'http://www.w3.org/1999/xhtml') {
              return NodeFilter.FILTER_REJECT;
            }
            if (SKIP_TAGS[p.tagName]) return NodeFilter.FILTER_REJECT;
            if (p.classList && p.classList.contains('gterm')) return NodeFilter.FILTER_REJECT;
          }
          p = p.parentNode;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const texts = [];
    let n;
    while ((n = walker.nextNode())) texts.push(n);

    texts.forEach(function (node) {
      let cur = node;
      // One text node can hold several terms, so keep going on the tail.
      for (let guard = 0; guard < 12; guard++) {
        const m = RE.exec(cur.nodeValue);
        if (!m) break;
        const form = m[1];
        const key = BY_FORM[form.toLowerCase()];
        if (!key) break;
        if ((counts[key] || 0) >= PER_TERM_PER_SECTION) {
          // Already marked enough in this step. Skip past it and carry on
          // looking for other terms in the same sentence.
          const after = cur.splitText(m.index + form.length);
          cur = after;
          continue;
        }
        const tail = cur.splitText(m.index);
        tail.nodeValue = tail.nodeValue.slice(form.length);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gterm';
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('data-term', key);
        btn.title = 'What this means';
        btn.textContent = form;
        cur.parentNode.insertBefore(btn, tail);
        counts[key] = (counts[key] || 0) + 1;
        cur = tail;
      }
    });
  }

  function init() {
    if (document.body && document.body.hasAttribute('data-no-glossary')) return;
    injectCSS();

    // Each step gets its own count, so a student who lands on step 3 still
    // finds the terms marked there.
    const sections = Array.from(document.querySelectorAll('.tabpane, .mod-head, .hero, .leftout, .disclaimer, .pillars'));
    if (!sections.length) sections.push(document.querySelector('.wrap') || document.body);

    sections.forEach(function (sec) {
      const counts = {};
      Array.from(sec.querySelectorAll(PROSE)).forEach(function (el) {
        // A paragraph nested in another matched element is walked once.
        if (el.closest('.gterm')) return;
        markIn(el, counts);
      });
    });

    document.addEventListener('click', function (ev) {
      const btn = ev.target.closest ? ev.target.closest('.gterm') : null;
      if (btn) {
        ev.preventDefault();
        if (openBtn === btn) { closeCard(); return; }
        openCard(btn, btn.getAttribute('data-term'));
        return;
      }
      if (card && !ev.target.closest('.gcard')) closeCard();
    });

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') closeCard();
    });

    window.addEventListener('resize', closeCard);
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  return { TERMS: TERMS, anchorId: anchorId };
})();
