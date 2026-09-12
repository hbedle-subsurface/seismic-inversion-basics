# Changes made in response to the review

Every item from the review's Must Fix, Should Clarify and Optional lists, with
what was changed and how it was verified. `sh tools/check-all.sh` passes, which
now includes a new regression driver, `tools/verify-fixes.js`, that boots each
module and reads back the numbers the prose quotes.

---

## Must Fix

### 1. Module 1 — the additive-shift error

The step 3 callout, the misconception box, check-yourself question 4 and its
explanation, and the "If question 4 surprised you" box all said that moving every
impedance by the same amount leaves the reflection coefficients untouched. All
five now use the multiplicative case, and question 4's explanation names the
additive case as the one that does move the trace, which lines it up with Module
4 step 1.

Rather than only rewording, step 3 gained a control that makes the exact case
something a student can do in one gesture: **Multiply every one of them by**,
0.5 to 2.0, applied to all three guess impedances.

Verified: with the guess at the true impedances, the trace score holds at 1.000
at every multiplier from 0.5 to 2.0 while the rock error runs from 0 to 5,533.

### 2. Module 1 — step 3 opened already solved

`gz1/gz2/gz3` defaulted to 4,200 / 6,900 / 5,500, which are exactly
2000 × 2.10, 3000 × 2.30 and 2500 × 2.20. New defaults are 5,000 / 6,000 /
7,000: wrong size and wrong shape, with both boundaries positive where the real
second one steps down.

Verified: step 3 now opens at a trace score of 0.092.

### 3. Module 1 — the hard-coded three-frequency claim

`s2e` was the string "55 Hz, the narrowest wavelet". The wavelet is normalized
to unit peak and the boundaries are 70 ms apart, so all three traces peak at the
same height on a fixed axis. It is computed now and reports "none of them — all
three peak at 0.243" when the three agree to within 2 percent, and names the
tallest when they genuinely differ. The stat label changed from "Highest of the
three traces" to "Tallest of the three traces", which is what it measures.

### 4. Module 6 — the clipped error curve

`AX.err` was `[0, 900]` while the four errors at the defaults are 915 to 1,028,
so every point clamped to the top of the panel and the curve drew flat beside a
tag reading "error climbs". Raised to `[0, 1400]`. The axis label changed from
"percent, and error scaled to it" to "shape, % · error, % of 1,400", so the
divisor is on the screen.

### 5. Module 6 — the collapsing stand-in wells

Fixed offsets of 150 / 300 / 480 m ran off the end of the log, because a 400 m
window inside a log ending at 2,714 m leaves only about 320 m of usable range.
At a window top of 2,100 m, three of the four wells landed on the same clamped
depth and the error fell with distance.

The offsets are now measured toward whichever end of the log has more room and
spread evenly across it, so there are four distinct wells at every setting. The
distance to each is printed beside the control and in the readout.

Verified across eight window settings from 1,990 to 2,300 m: four distinct
errors every time. The default window still gives exactly 915 → 1,028 and 12
percent, so the numbers quoted in the prose are unchanged.

One honest residual: at a window top near 2,150 m the error still dips before it
rises, because a more distant interval happens to fit the level better there.
Rather than force monotonicity, step 3 now says so — distance from a well makes
a background less reliable, not reliably worse — and points at the split between
the two readouts as the thing that holds at every setting.

### 6. Module 3 — the non-monotonic departure thickness

The peak-to-trough gap was counted in whole 1 ms samples, which is 1.3 m of
apparent thickness per sample here. Combined with a hard 20 percent threshold and
a "thickest failing bed" rule, that made the readout jump from 8.1 m at 50 Hz to
13.2 m at 52 Hz — the limit getting worse as the wavelet got shorter.

Both extremum positions are now fitted parabolically through their neighboring
samples. The wedge picks are drawn at the same sub-sample precision, so the dots
track smoothly rather than stair-stepping.

Verified: monotonic across the whole 12–70 Hz range, 32.5 m down to 5.1 m, no
reversals. At 30 Hz the departure is 12.2 m rather than 11.2 m, so the two places
the prose said "about 11 m" now say "about 12 m". The method pane says the
positions are fitted rather than rounded, and the gap readout carries a decimal.

### 7. `LICENSE`

Named the wrong work: the title and citation URL were the advanced companion's,
and it cited Pohokura South-1, which this repository does not use. Rewritten for
this set, with the `seismic-inversion-basics` URL.

### 8. `DATA.md`

Referenced by both `LICENSE` and `data/maui-4.js` and did not exist. Written:
provenance and licensing, the curve table with which curves are logged and which
are derived, the arithmetic checks on the derived ones, how the two-way time was
built and what the 5 ms sonic drift is, the markers from the completion report,
and cautions for anyone reusing the trimmed copy.

### 9. The NZP&M link

`index.html` pointed at `/maps-geoscience/geoscience-data/`, which does not
resolve. Now `/maps-geoscience/geodata-catalogue`.

### 10. Attribution in source headers

`seismic.js`, `count.js`, `synth2d.js`, `glossary.js` and `pin-panel.js` named
only Heather Bedle. `physics.js` and `panels.js` had no author line at all. All
seven now read "Heather Bedle and April Moreno-Ward / AASPI / University of
Oklahoma".

`seismic.js` also carried the title of a different site ("What Can You REALLY
See in Seismic?") and a comment at `hilbert()` about AASPI similarity attributes,
which nothing in this repository uses. Both replaced.

---

## Should Clarify

**Module 1 scoring.** The trace score was a Pearson correlation, which ignores
amplitude: under the operation the module asked students to try it read 1.000
while the drawn traces visibly differed in height. It is now
`1 − misfit / rms(target)`, measured in the target trace's own units. It falls
when the amplitude is wrong (a shape-right, size-wrong guess scores 0.306) and
still reaches exactly 1.000 under the multiplier, because there the two traces
really are the same trace. The method pane explains both scores.

**Module 6, the 86 percent.** The method pane now says what it is a ratio of: an
average level of about 9,400 against a swing of about 1,500, that the two are
different kinds of measurement, and why the comparison is the one the question
calls for. Step 1 says the sizes are for the window the page opens on and gives
the range across the well, 86 to 91 percent.

**Module 8, sparse spike.** The page called the retained trace samples "the
largest reflections". It now says plainly that a real sparse-spike inversion
deconvolves the wavelet out first and searches for a small set of reflection
coefficients, that the deconvolution is the method, and that the panel takes a
shortcut which keeps the assumption but not the machinery.

**Module 8, the identical shape scores.** Added a paragraph saying the
model-based and relative shape scores match exactly by construction, and that
this is the arithmetic form of what the panels show.

**Glossary.** "low-frequency component" was an alias of the "low-frequency
model" entry, so clicking it in Module 6 returned the definition of the thing
Module 6 is at pains to separate it from. It has its own entry now, in both
`assets/glossary.js` and `glossary.html`, with the distinction stated in each.

**Module 5.** "The lowest impedance in the well" is true in the module's window
but not across the whole logged interval, where the minimum is 2,921 at 2,506 m.
Now "the lowest impedance anywhere in this window". The checkshot note said real
checkshot times were unavailable; it now matches the data file, which records
that the supplied two-way time is anchored to the checkshot at the top and
differs from it by about 5 ms at the base.

**Module 4.** The 31 / 29 / 27 / 2 counts are stated as the default-setting
values, with a note that they move with the wavelet frequency while the ordering
does not.

**Reflection coefficient labelling.** The axis unit "fraction returned" became
"fraction of the amplitude", in Modules 1 and 3. The `physics.js` comment and the
glossary entry both now say it is a signed fraction of the amplitude and that the
energy fraction is its square, which is one of the pairs the brief asks to keep
separate.

---

## Optional Enhancement

**Module 7 performance.** `shiftBg()` was called inside the mapping callback of
`Float64Array.from`, rebuilding a whole array once per sample: about 3.5 million
operations per redraw. Both shifts are computed once per trace now. Measured on
the same work: 1,851 ms down to 148 ms.

**Module 2 axis.** The impedance axis is fixed at [2,000, 22,000] and the
hardest rock the controls allow, multiplied by 2.5, is roughly twice that. Rather
than rescale the axis, an "off the scale →" label appears when a curve leaves the
panel, so a clipped curve is not mistaken for one that has stopped moving. The
method pane notes it.

**Module 8 step counter.** `buildStepNav` numbered only panes matching `p<digit>`
in id order, so Module 8's `pmap` / `pps` / `p3` / `p2` / `p4` arrangement made
the counter read "step 1 of 3" on what the tab strip called step 3. It numbers
from the tab strip now, excluding the meta group. Verified across all eight
modules: 3, 3, 3, 3, 3, 4, 3 and 5 steps, matching each tab strip.

---

## Not changed, and why

**Module 6 step 3's residual dip.** Left in and described, as above. Forcing it
to climb monotonically would mean choosing intervals for how they score rather
than for how far away they are, which would make the exercise a demonstration of
itself.

**The 86 percent metric.** Left as a level against a swing rather than switched
to like-for-like statistics. It is the right comparison for the question the
module asks — how much of one printed number came from each source — and it is
now stated rather than left to be inferred.

**Module 8's four implementations.** Still caricatures. The page says so, and the
sparse-spike caveat is now specific about which step is missing.

---

## Added after the review: the panel pop-out

`assets/panelout.js` is installed, copied unchanged from the spectral repository
where it was already working, with a script tag in all eight modules.

The button reads **Open controls in a window** and sits on the last `.cap` of the
top panel. The panel itself does not leave the document: a live copy goes into
the second window, and values moved there are written onto the real inputs with
an ordinary `input` event fired after them, which every module already listens
for. Canvases are mirrored back on a 120 ms timer, so the copy shows what the
module drew.

`assets/pin-panel.js` carried a comment saying a second window "cannot work",
with a reasonable-sounding argument: modules look their elements up against
their own document and delegate events on it, so a panel moved out of the
document arrives blank and dead. That is true of *moving* the panel and false of
copying it and forwarding events, which is what `panelout.js` does. The comment
is rewritten to say which approach fails, which works, and that the two
behaviors are complementary rather than alternatives.

`tools/check-panelout.js` is new and is in `check-all.sh`. It opens each module
in JSDOM, stubs `window.open`, clicks the button and then tests the things that
fail silently:

- the copy matches the panel element for element, which is what the bridge pairs
  on. A mismatch leaves controls that move and do nothing, and looks fine in a
  screenshot.
- moving a slider in the copy reaches the module's own state, not just the copy.
- the real panel is parked somewhere it can still be measured, since the modules
  size their canvases from their parent's width.
- bringing the panel back restores it to the page.

All eight modules pass. Module 1 reports the bridge driving `fr` from 30 to 70 Hz
from the second window; module 6 reports the same for `top`.

`ADD-PANELOUT.md` is the install procedure, written to match the house
`ADD-COUNTING.md` / `ADD-GLOSSARY.md` convention so it can be copied to the other
repositories with the file.

### One thing found while doing it

`popOutTeaching()` in `assets/seismic.js` is the exercises pop-out, and in this
repository it is dead code. It is wired to `#popBtn` and to panes `#pe` and
`#pk`, and this set has none of them: its panes are `p1`–`p4`, `pmap`, `pps`,
`pw`, `pc` and `pm`. The handler looks for `#popBtn`, does not find it, and
returns. Nothing breaks — the button simply never appears, in any module.

The spectral repository solves this with a separate shared file,
`assets/popout.js`, which is hardcoded to the pane id `pe`. Wiring it up here
needs a decision about which pane is the analogue: "Check yourself" (`pc`) is the
closest, with "Why this matters" (`pw`) as a second. Left alone pending that
decision rather than guessed at.

### Pinning removed

`assets/pin-panel.js` and its button — **Keep the panel in view**, with the
`a lot on one page?` label beside it — are gone. The script tag is out of all
eight modules and the file is deleted. It and the pop-out answered the same
question two ways, and a student meeting this material should not have to pick
between two buttons before they have looked at any seismic.

The stylesheet needed no change: the pinning rules were injected by the script
itself, so deleting the file took them with it.

`tools/check-glossary.js` asserted that the pin button had been injected above
the panel, and would have failed for every module. It checks for the pop-out
button instead.

`MAINTAINING.md` and `ADD-PANELOUT.md` both described the two as complementary.
Both now say pinning is gone and why, and `MAINTAINING.md` keeps the warning
about the approach that genuinely does not work — moving the panel out of the
document — separated from the one that does.

---

## The final pass before publication

### Module 3 was a file behind the rest of the repository

The snapshot held `modules/03-what-the-pulse-does.html` while `index.html`,
`glossary.html`, `assets/glossary.js`, `README.md`, modules 2 and 4 and
`tools/verify-fixes.js` all linked to `03-what-the-wavelet-does.html`. Thirteen
broken links, an unreachable module 3 card on the landing page, and
`verify-fixes.js` exiting on ENOENT. Because `check-all.sh` ran under `set -e`,
the eight checks after `check-links.js` never ran at all.

The file itself was the pre-rename draft: "pulse" in 33 places and nowhere else
in the repository, no `glossary.js`, `panelout.js` or `panels.js`, the
cross-reference for the missing low frequencies still pointing at module 5
rather than module 6, and a whole-sample gap measurement with no sub-sample fit.
It has been renamed, brought up to the state the rest of the repository assumes,
and given a fourth step.

- `pulse` → `wavelet` throughout, including the title, the eyebrow, the tab, the
  canvas descriptions and the axis label.
- The three missing script tags are in, so the module now marks its glossary
  terms and carries the **Open controls in a window** button. `check-panelout.js`
  passes on it, driving `thick` from 30 to 60 m from the second window.
- Both extremum positions are fitted through their neighboring samples.
- `metres` → `meters`.

### Module 3, the quarter-wavelength claim

The method pane said a quarter of a wavelength "predicts that point closely at
every frequency". It does not. Measured on this page, the thickness at which the
gap departs from the true two-way time by more than 20 percent is 0.58 to 0.61
of the quarter-wavelength value across 12 to 70 Hz — 13.1 m against 21.7 m at
the default 30 Hz. The rule is built on the wavelet's peak frequency, while the
plateau is set by the separation between the wavelet's peak and its trough. Both
scale as velocity over frequency, so they differ by a constant.

Rather than pick one, the page now carries all three numbers and draws two of
them: the rule of thumb and the measured departure appear as separate marker
lines on the step 2 panel and as separate curves on the step 3 panel, and the
brightest thickness is reported separately again. New readouts give the
departure with its ratio to the rule, and the gap read back as a thickness.
`s2d` and `s2g` are new; the step 3 stats now name which definition each one is.

### Module 3, step 4: the ranking game

Three sands are dealt from a seed that rides in the URL. Each has its own
thickness between 4 and 45 m and its own density between 1.90 and 2.40 g/cc, so
thickness and impedance contrast both vary. Only the traces are shown; choosing
the thickest reveals the thickness each trace implies beside the thickness that
is there. Two scores are kept: how often the thickest bed is named, and how
often all three reported thicknesses are within a quarter of the truth. The
second moves with frequency, which is the point of the step.

The first design of this step was wrong and the check caught it. It scored
whether ranking by the gap succeeded, split by whether the beds were resolved,
on the assumption that ranking fails below the limit. It does not: the two
reflections from a bed in uniform shale are equal and opposite, so the trace
shape depends on thickness alone and the ordering survives however thin the beds
are. What fails below the limit is the reported value, by as much as a factor of
five. The step was rebuilt around that, and the method pane says which failure
this page shows and which one needs a real section.

`tools/check-game.js` is new and is in `check-all.sh`. It plays 200 deals at
each of 20, 35 and 60 Hz and fails if the brightest trace names the thickest bed
more than 55 percent of the time, if the peak-to-trough separation ranks them
less than 95 percent of the time, or if the reported thickness does not get
closer to the truth as frequency rises. Measured: the brightest trace is the
thickest bed 41, 24 and 26 percent of the time against 33 percent for guessing,
the separation ranks them every time, and all three thicknesses land within a
quarter of the truth in 21, 55 and 83 percent of deals.

### Across the set

- `check-all.sh` no longer runs under `set -e`, so every check runs and the
  output has to be read rather than trusted to stop at the first failure.
- `tools/check-links.js` reads the markdown as well. The broken module 3 link in
  `README.md` was invisible to it, and the README is the first page anyone
  arriving from GitHub reads.
- The instructor-notes heading **Key takeaway** is **Summary** in all eight
  modules.
- American spellings: `metres` in modules 2 and 3 and a comment in module 6,
  `modelled` in module 7, `labelled` in comments in modules 2 and 5,
  `recognise` in `MAINTAINING.md`.
- `index.html`: the doubled verb in "what a seismic section is, is all you need",
  and two manufactured contrasts — the module 3 card and the non-uniqueness
  panel both used "it is not X, it is Y" where the direct statement is shorter.
- `assets/pin-panel.js` and `assets/popout.js` are deleted. The first was
  already documented as gone. The second turned out not to be the exercises
  pop-out at all: it is an earlier panel pop-out that moves the live panel, the
  approach `MAINTAINING.md` records as the one that fails, and nothing loaded
  it.
- `README.md` describes the files that ship. It had listed five of the assets
  and three of the tools, and omitted the glossary, `panels.js`, `synth2d.js`
  and the well data.

### Still open

The exercises pop-out in `assets/seismic.js` is still dead in this set, as the
note above records. The nearest pane is **Check yourself**, and copying it into
a second window would give a student questions whose buttons do nothing, because
the quiz is wired to the first document. Wiring it properly means a change to a
shared file and it is not a publication blocker, so it is left alone.

`assets/panelout.js` carries a header comment about "the companion file
popout.js", which no longer exists here. The file is meant to be byte-identical
in every repository, so it is left untouched rather than allowed to drift.

### Dead code removed in the same pass

Everything below was either unreachable or referenced by nothing. Each removal
was made and then checked by booting all eight modules, so anything that was
load-bearing would have shown up as a `ReferenceError` in `check-module.js`
rather than as a silent change on screen.

- **`tools/harness.js`, 37 KB, deleted.** It could not run in this repository at
  all: it defaults to `modules/start-here.html`, which does not exist here, and
  it loads `assets/inversion.js`, which belongs to the advanced set. Its job is
  done by `check-module.js` for the drives, `check-overflow.js` for the drawing
  bounds and `verify-fixes.js` for the numbers the prose quotes. The stale "run
  the harness" line in `ADD-PANELOUT.md` now says to run the checks.
- **`PHYS.rotatePhase` and the `hilbert` it existed to call, deleted.** Every
  call site in the set passed a phase of zero, and `wavelet()` tested that
  argument for truthiness, so the rotation never ran and the Hilbert transform
  was never reached. `wavelet(f, dt)` now takes two arguments, the five call
  sites pass two, and a comment says that phase belongs to the advanced set.
  `physics.js` is the file the README sends a student to read, so 35 lines of
  unreachable arithmetic in it are worse there than they would be elsewhere.
- **`PANEL.callout` and `PANEL.QUANTITY_HEADROOM`, deleted.** No module called
  either. The comment on `quantity()` claimed modules used the constant to set
  their top margin; none did, and it now states the clearance the function
  needs without naming a constant that nothing reads.
- **Five unused color constants**, `OLIVE` in modules 1, 2, 4 and 6 and both
  `OLIVE` and `GRID` in module 7.
- **Three unused axis definitions**: `AX.peak` in module 4, `AX.amp` and
  `AX.share` in module 6. A fixed axis that nothing plots against is a
  particular nuisance, because it reads as a promise that some panel is holding
  that range.
- `tools/check-tie.js` was kept. It runs, it prints module 5's own numbers
  against the claims that module makes, and it was simply undocumented.
  `MAINTAINING.md` now describes it beside `check-steprefs.js` as the other
  tool that prints for reading rather than passing or failing.

### Dead weight left alone, and why

- **`assets/seismic.js`** has about twenty exports this set never calls:
  `ormsby`, `spectrum`, `traceValue`, `sampleTrace`, `rc`, `mulberry32`,
  `gaussRand`, `fft`, `fkSpectrum`, `hilbert`, `SEQMAPS`, `drawWiggle`,
  `niceTicks`, `drawColorbar`, `UNITS`, `savePNG`, `popOutTeaching`,
  `buildStepNav` and `guides`. The README calls this file shared with the other
  teaching sites, and several of those are used there. Trimming it here would
  fork it, which costs more than the bytes are worth. The same argument covers
  the 21 class names in `assets/style.css` that no page in this set uses.
- **`assets/synth2d.js`** exports 50 names and the modules call 30 of them. The
  other 20 are constants and helpers the file uses internally; only the export
  list is wider than it needs to be, and narrowing it changes no behavior.
- **`data/maui-4.js`** carries eight curves and the modules read four: `DEPT`,
  `TWT`, `VP` and `AI`. `GR` and `CALI` are 28 KB each and nothing reads them.
  `DT` and `RHOB` are also unread, but `VP` and `AI` are derived from them and
  `DATA.md` rests on that being checkable, so those two should stay whatever is
  decided about the other two.
