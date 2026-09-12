# Adding the panel pop-out to a repository

`assets/panelout.js` puts an **Open controls in a window** button on the
interactive panel at the top of every module. The student gets the controls in a
second window and can work them while the panels they drive stay on screen in
the first.

The same file goes in every teaching repository, unchanged. Copy it, add one
script tag per module, run the checks. Nothing else changes — no markup edit,
no stylesheet edit.

---

## 1. Copy the file

Copy `assets/panelout.js` from any repository that already has it into
`assets/panelout.js` here. Do not edit it. If it needs a change, change it
everywhere.

## 2. Add one script tag per module

In each module, next to the other shared scripts:

```html
<script src="../assets/count.js"></script>
<script src="../assets/glossary.js"></script>
<script src="../assets/panelout.js"></script>
<script src="../assets/seismic.js"></script>
```

Order does not matter. The script waits for `DOMContentLoaded` and touches
nothing but the top panel.

## 3. What the module has to provide

Two things, both already true of every module built to the house template:

- the interactive panel at the top is `<div class="labhead">`
- it contains at least one `<p class="cap">`, which is where the button goes

If either is missing, the button does not appear and the page is otherwise
untouched.

## 4. How it works, and why no module needs changing

The panel does not leave the document. A **copy** of it goes into the second
window, and events are forwarded between the two:

- a control moved in the copy has its value written onto the real input in the
  first window, and an ordinary `input` event fired there. Every module already
  listens for that event, so it cannot tell the difference.
- a button in the copy calls `click()` on its counterpart.
- a pointer press on a copied canvas is reproduced on the real canvas at the
  same fractional position.
- a timer copies text, classes and canvas bitmaps back the other way, so the
  copy shows whatever the module drew.

The real panel is parked in a zero-height wrapper rather than hidden with
`display:none`, because the modules size their canvases from their parent's
width and an element with `display:none` has no width to measure.

This is the part worth knowing if something goes wrong: **the panel and its copy
are paired by position**, element by element in document order. Anything that
changes the element count of one and not the other breaks the pairing, and the
file refuses to wire rather than wiring the pairs up wrongly. It says so in the
second window instead of leaving a set of controls that move and do nothing.

## 5. Check it

```bash
for m in modules/*.html; do
  printf "%-34s " "$(basename $m)"
  node tools/check-panelout.js "$m" | tail -1
done
```

`tools/check-panelout.js` opens the module in JSDOM, stubs `window.open`, clicks
the button, and then checks the things that fail silently: that the copy is the
same shape as the panel, that moving a slider in the copy actually reaches the
module's state, that the real panel is left somewhere it can still be measured,
and that bringing it back puts it where it was.

Then open one module in a browser and click the button. Move a slider in the
second window and watch the panels in the first follow it, close the second
window, and check the panel comes back.

## 6. There used to be a pinning button as well

`assets/pin-panel.js` stuck the panel to the top of the window instead, so the
steps scrolled underneath it. It is gone. The two solved the same problem and
offering both meant a student met two buttons and a decision before they met any
seismic. If a repository still has it, remove the script tag and the file when
this one goes in.

## 7. What it does and does not do

**Does:** copies markup that is already on the page into a second window and
forwards events between the two.

**Does not:** fetch anything, send anything, store anything, or set a cookie. It
works from a `file://` copy with no network, which is the case that matters when
a student is working from a downloaded folder or an instructor is offline during
a lecture.

## 8. Browser notes

- The window is opened by a click, so ordinary pop-up blocking does not apply.
  If a blocker refuses anyway, the button says so in place for a few seconds and
  then resets, rather than failing silently.
- The window is named per module, so opening the controls for two modules gives
  two windows rather than one that keeps being overwritten.
- Closing the second window puts the panel back. Closing the *first* window
  leaves the second saying the controls no longer drive anything, rather than
  leaving them looking live.
- A step that hides the panel dims the copy, for the same reason.
