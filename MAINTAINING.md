# Maintaining this set

Conventions that keep the eight modules consistent. The advanced set has its own
file; where they differ, this one wins for this repo.

## Audience

Undergraduate geology students, some with little maths. Assume density,
velocity, reflection and roughly what a seismic section is. Assume nothing else.
Anything needing inverse theory, statistics or matrix algebra belongs in the
advanced set, not here.

## Every module has

- A sticky lab head: one canvas showing the whole process, and the controls.
- Three or four numbered steps, each with at least one thing the student can
  change.
- A **misconception callout** naming a wrong belief and correcting it, phrased
  so the student can test the correction with the controls on that page.
- A **why this matters** section, two to four sentences, geological.
- A **check yourself** tab: three or more questions, each with an explanation
  that appears on any answer. Never just "correct".
- A **how this page works** tab: the arithmetic, then what the page leaves out.
- **Instructor notes** inside a `<details>`: objectives, key takeaway,
  discussion questions, misconceptions, completion time.

## Shared drop-in scripts

Three files are shared, take no configuration, and must be loaded by every
module. Each one fails by doing nothing rather than by breaking the page, so a
module with a stale `assets/` loses a feature and keeps working.

- **`assets/glossary.js`** — marks technical terms in the prose after the page
  loads and opens a definition card when one is clicked. No markup change: it
  walks the text itself. To add a term, add an entry to `TERMS` at the top of
  the file **and** a matching `<dt id="g-slug">` to `glossary.html`, or the
  card's link lands on the top of the glossary instead of the entry.
  `tools/check-glossary.js` checks that pairing. A page that should not be
  marked at all carries `<body data-no-glossary>`, which is how the glossary
  page avoids defining its own terms inside its own definitions.
- **`assets/panelout.js`** — puts a button on the lab head that opens the panel
  in a second window, so the controls sit beside the panels they drive. It needs
  the top panel to be `.labhead` with at least one `.cap` inside it, and nothing
  else. `ADD-PANELOUT.md` is the procedure and is the same file in every
  repository.

  The panel does **not** move into the other window. An earlier attempt did move
  it, and that cannot work: every module looks its elements up with
  `document.getElementById` against its own document and delegates control
  events with a listener on that document, so a panel that has left the document
  cannot be found by the module that owns it, and its sliders raise events in a
  document nothing is listening to. `panelout.js` leaves the panel where it is,
  puts a copy in the second window, writes values from the copy onto the real
  inputs and fires ordinary events there. The module cannot tell the difference.

  The two are paired **by position**, element by element in document order.
  Anything that changes the element count of one and not the other breaks the
  pairing, and the file refuses to wire rather than wiring the pairs up wrongly.
  `tools/check-panelout.js` is what catches that, because a second window whose
  sliders move and whose module does not looks perfectly healthy in a screenshot.

  There was also a `pin-panel.js`, which stuck the panel to the top of the window
  instead. It has been removed: two buttons offering two answers to the same
  problem is one more decision than a student meeting this material needs.
- **`assets/synth2d.js`** — the shared 2D line used from module 6 onward. It
  builds the earth in **impedance** and derives reflectivity and the recorded
  section from it, so a module always has a truth on screen to compare an
  inversion against. Do not build a second 2D model: a student who has met this
  line in module 6 should recognize it in module 8.

## Renumbering

The module number appears in six places per module, and all of them have to move
together: the file name, the `<title>`, the `.eyebrow`, the next-up and pager
links at the foot, the `M` map in `assets/glossary.js`, the card and its
`.card-no` on the landing page, and the table in `README.md`. Prose references
in other modules move too, including ranged ones like "modules 1 to 4".

Rename files from the highest number down, or the rename collides with a file
that still exists. Then run `tools/check-links.js`, which is the check that
catches what was missed.

## The second elastic property

`assets/synth2d.js` carries a Vp/Vs field alongside the impedance, and shear
impedance is Zp divided by it. The model has two soft bodies in the same
interval on purpose: a gas sand near the crest and a lens of soft organic shale
on the right flank, whose acoustic impedances are within about 100 units of each
other and whose shear impedances are about 1,000 apart. That pairing is what
makes the pre-stack argument demonstrable rather than assertable, so do not
"tidy" the lens away.

## Two names that are not the same thing

Keep these apart in prose and in code. Getting them confused is the single
most common muddle in this material.

- The **low-frequency component** is a property of the earth: the part of the
  true impedance below the seismic band. It exists whether or not anyone
  measures it.
- The **low-frequency model**, also called the background model, is an estimate
  of that component, built by a person from well logs and horizons.

Earlier drafts called these the "slow part" and the "fast part". Do not
reintroduce that: it reads as a description of two curves rather than of a
frequency split, and it gives a student no word they will meet again.

## Checks

```bash
npm install jsdom
for m in modules/*.html; do node tools/check-module.js "$m"; done
for m in modules/*.html; do node tools/check-glossary.js "$m"; done
node tools/check-index.js
node tools/check-links.js
node tools/check-panels.js
node tools/check-head.js
node tools/check-overflow.js
node tools/check-tabs.js
node tools/check-tabnav.js
node tools/check-terms.js
node tools/check-reading.js
node tools/check-game.js
node tools/check-steprefs.js    # prints for reading, no pass or fail
```

Or `sh tools/check-all.sh`, which runs all of them.

`check-module.js` boots a module, drives every control through its range and
reports any readout that goes to NaN. `check-glossary.js` confirms terms are
marked, that none are marked inside a heading, link or control label, that the
pop-out button was added, and that every marked term has a glossary anchor.
`check-index.js` covers the landing and glossary pages, which carry no module
script and so are skipped by the first two. `check-links.js` confirms every
internal link resolves and every module is reachable from the landing page,
which is the thing a renumber breaks without saying so. `check-panels.js`
renders every step and confirms that panels drawn side by side in a `.sec-row`
came out the same size.

Two panels meant to be compared must be the same width **and** the same height.
Width is handled by the stylesheet — `.sec-row > .panel-col` is `flex: 1 1 0`,
so columns share the row whatever is written above them. Height is not: it comes
from the aspect ratio passed to each module's `panel()` call, so both panels in a
row need the same ratio. Mismatches there are small enough to read as sloppiness
rather than as a bug, which is why there is a check for it.

`PANEL.quantity` writes the name of a quantity on a baseline 17 px above the
panel rectangle in an 11 px face, so its ascenders reach 28 px above it. A rect
with less headroom than that has its title clipped by the top of the canvas.
`PANEL.QUANTITY_HEADROOM` is 30; use it, or a top margin of at least 30, for any
panel that carries a title.

`tools/check-overflow.js` records every string the modules draw and reports
anything that lands outside its canvas. Text is the thing that breaks when a
column is narrow: `SEIS.tag` and `PANEL.tagAt` now keep their boxes inside the
canvas and `PANEL.quantity` moves its units to the right edge rather than off
it, but a clamped label sits over the drawing, so a label that trips this check
usually wants shortening rather than nudging.

## Anything drawn on top of a section must carry the dip

The sections in module 7 are built with a dip of `DIP` samples per trace, so a
boundary is deeper on the right than on the left. Anything drawn to mark that
boundary has to carry the same shift, or it crosses the bed instead of following
it and only agrees with it at one point across the panel. `dipShift(x)` is the
one definition; the model uses it and so does `interfaceLine`.

## The linked pointer

`PTR` in module 7 holds a trace and a sample, not pixels, so the same position
means the same thing on panels of different sizes. `wirePointer(id)` attaches
the mouse and touch handling to a section canvas and `pointerAt(ctx, rect)`
draws the crosshair; every section on the page calls the second, so a pointer
moved over one panel is marked on all of them. It exists because two sections
compared by eye across a gap is exactly how a difference gets missed.

Both helpers assume the section rect is the one the module draws into
(`x: 46, y: 30, w: w - 64, h: h - 104`). If that changes, change it in
`wirePointer` too.

## Vocabulary and level

The audience is geology undergraduates. They arrive knowing porosity,
lithology, compaction and anticline; they do not arrive knowing trace,
amplitude spectrum, gather, offset, Vp/Vs or cycle skip. Anything in the second
group needs a dictionary entry, and adding one means **two** edits that have to
match: a `TERMS` entry in `assets/glossary.js` and a `<dt id="g-slug">` in
`glossary.html`. `tools/check-terms.js` holds the list of words worth checking
and reports any used in the prose that the dictionary lacks; its `NOT_NEEDED`
set records the ones left undefined on purpose, so the decision is written down
rather than forgotten.

`tools/check-reading.js` reports sentence length. The set runs at a mean of 12
to 16 words, which is right for this audience; it flags anything over 40 words,
which is usually two sentences that have been joined with a comma.

`tools/check-tie.js` prints module 5's own numbers: the spread of velocity
across the log window, the tie offset that brings the correlation up, and what a
tie error of 5, 10 and 20 ms does to the impedance you would report at the
target. Like `check-steprefs.js` it prints for reading rather than passing or
failing, so it is not in `check-all.sh`.

`tools/check-game.js` plays module 3's ranking game 200 deals at a time at three
frequencies and checks that it still teaches what its prose says: that the
brightest trace names the thickest bed no more often than picking at random,
that the peak-to-trough separation does rank the beds, and that the thickness
read off a trace gets closer to the truth as the frequency rises. A game whose
answer can be had from the wrong instinct is worse than no game, and that
failure is invisible from the screen.

`tools/check-steprefs.js` prints every "step N" in the prose next to the title
of the step it now points at. Reordering a module's tabs does not move the
sentences that refer to it, and nothing else catches that — the page still
works, it just sends the student to the wrong place.

## The tab strip

The two meta tabs — Check yourself, How this page works — sit inside a
`.tabs-meta` span after the spacer. Without it the spacer pushes them apart and,
on a strip too wide for one line, one of them drops alone to a second row at the
left, which reads as a broken page. Keep new step buttons before the spacer.

`tools/check-tabs.js` estimates the width of a strip and reports one that will
wrap. The estimate is deliberately generous, so aim for at least 50 px to spare
rather than passing by a few. A tab is a handle, not a heading: when a strip is
tight, shorten the button and leave the full wording on the step's own `<h3>`.
Module 8 has five steps and module 3 has four; those two are the tightest in
the set, at 118 px and 260 px to spare.

`tools/check-tabnav.js` clicks every tab in every module and confirms it opens
its own pane and closes the others. Reordering a strip is exactly the edit that
can leave a button pointing at a pane id that no longer exists.

## Controls that do nothing

`tools/check-head.js` drives every slider in a module's lab head from one end of
its range to the other and compares the drawing commands. A control sitting next
to the picture that changes nothing in it reads as a broken page, whatever it
does further down.

Every module passes. Where a control drove a step rather than the head there
were two ways out, and both are in use: show the thing in the head, which is
what module 5's third panel and module 6's spectrum do, or move the control into
the step it serves, which is what happened to module 2's multiplier, module 4's
thickness, module 6's well distance and module 8's realizations. Prefer the
second unless the control genuinely belongs to the whole module.

`check-overflow.js` and `check-panels.js` read the tab list from the page rather
than walking a fixed p1..p4, so a new pane is checked the moment it is added.

The canvas in all three is a stand-in that records geometry rather than drawing.
When a module starts using a part of the canvas API the stand-in does not
answer, the fix goes in the stand-in, not in a guard around the module code.

## Language

- Short sentences. Nothing over about 30 words. Split rather than subordinate.
- No analogies, no metaphors, no commercial framing.
- American spelling.
- Say what a thing is before naming it. The name comes second.
- Describe, do not instruct: no "you should conclude that".

## Interaction

- **Numeric inputs for real quantities** (velocity, density) so a student can
  type a value and see the units. Sliders only for things with no natural
  value, such as a frequency being swept or a guess being explored.
- Every step must have something to move.
- Fixed axis ranges everywhere. A student watching a bar move should not have
  the axis move underneath it. Ranges live in one `AX` object per module.
- One time-to-y mapping per module, used by every panel.
- A reset button on every module.

## Checks before committing

```
node tools/check-module.js modules/<file>.html
```

It boots the page, drives every control through its full range, and fails on any
readout that goes to NaN, Infinity or undefined. It also checks the module has
its callout, its why-this-matters, its questions and its instructor notes.

Then check local links resolve, and read the prose aloud once.

## Things that must not drift

**Both authors, every page.** Heather Bedle and April Moreno-Ward are named in
the footer of every page and in the citation line. Start a new page by copying
an existing one; do not write a footer from scratch.

**The SSRN citation.** Every page carries
`SSRN: [article link to follow]`. When the paper is posted, replace it
everywhere in one pass:

```
grep -rl "article link to follow" . --include=*.html
```

**Counting.** `assets/count.js` is copied verbatim between repositories and is
not edited here. It must be loaded before the page's own scripts, and every page
needs a real `<title>`. The full procedure and the reason the query string is
stripped are in `ADD-COUNTING.md`. If you add a page and forget the count line,
the page still works and simply never appears on the dashboard, so check new
pages against an existing one.

**The disclosure notice.** The footer says what is recorded and why. It is part
of the deal with the reader, not decoration, and it stays even if the wording
around it changes.

## Making a panel readable without a caption

A student should be able to read a panel without reading anything underneath
it. `assets/panels.js` has the helpers for this, and every new panel uses them.

- **`PANEL.quantity`** above every track: the name of the quantity, its units,
  and the range at the two ends. Two bare numbers over a wiggle tell a beginner
  nothing.
- **`PANEL.curveLabel`** beside each curve, in the curve's own color. Never
  write a caption like "log teal, recovered red" — that makes the student hold
  a color key in their head and look back and forth. Label the line where it
  runs.
- **`PANEL.sideScale`** and **`PANEL.downArrow`** on vertical panels, so that
  time increasing downward is stated rather than assumed.
- **`PANEL.callout`** for the one feature a panel exists to show. A panel with
  three callouts has none.

Leave at least 46 px of left padding on any panel carrying a side scale, and
56 px if it also carries the "deeper" arrow. `tools/check-module.js` does not
catch a label drawn off the canvas, so check a new panel at a narrow width.
