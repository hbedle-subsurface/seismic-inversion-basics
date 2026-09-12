# Seismic Inversion, from the start

Eight short interactive modules on what seismic inversion is, why it does not
have a single answer, and what to ask about a result somebody hands you. Built
for undergraduate geology students.

Live: https://hbedle-subsurface.github.io/seismic-inversion-basics/

| # | Module | Question it answers |
|---|--------|---------------------|
| **01** | [Rock makes seismic](modules/01-rock-makes-seismic.html) | What is inversion actually trying to do? |
| **02** | [A number about a rock](modules/02-a-number-about-a-rock.html) | Why is impedance more useful than a wiggle? |
| **03** | [What the wavelet does](modules/03-what-the-wavelet-does.html) | Why can't you read the rock off the trace? |
| **04** | [More than one answer fits](modules/04-more-than-one-answer.html) | Why doesn't inversion have one answer? |
| **05** | [Tying a well](modules/05-tying-a-well.html) | How does a well get onto the seismic? |
| **06** | [The part that was never recorded](modules/06-never-recorded.html) | Where does the rest of the answer come from? |
| **07** | [Reading somebody else's result](modules/07-reading-a-result.html) | What should I ask when I am handed one? |
| **08** | [The family of methods](modules/08-the-family-of-methods.html) | What do all these names actually mean? |

All eight modules are built.

## The companion set

*How Seismic Inversion Actually Works* is the advanced treatment: background
models, the model-based loop, wavelet estimation, prestack inversion and reading
a section, all on real well data. This set comes first.

## How it is built

Plain HTML, JavaScript and canvas. No build step, no framework, no
dependencies. Open a file and edit it.

- `assets/physics.js` — the calculations this site teaches, with plain names
  and short bodies. Read it if you want to check what a module did.
- `assets/seismic.js` — drawing and URL-state helpers, shared with the other
  teaching sites.
- `assets/panels.js` — the labeled quantity tracks, curve labels and callouts
  the panels are drawn from, so two modules label the same thing the same way.
- `assets/synth2d.js` — the shared 2D line used from module 6 onward. It builds
  the earth in impedance and derives the recorded section from it, so a module
  always has a truth on screen to compare an inversion against.
- `assets/glossary.js` and `glossary.html` — one dictionary of 140 terms and
  spellings. The script marks the terms it knows wherever they appear in the
  prose and opens the definition in place; the page is the same dictionary to
  read straight through. `tools/check-terms.js` fails if a module introduces
  vocabulary the dictionary does not hold.
- `assets/style.css` — the shared stylesheet plus the components this set adds:
  misconception callouts, self-check questions, instructor notes, glossary.
- `assets/panelout.js` — opens the top panel in a second, live window, so the
  controls sit beside the panels they drive. The panel stays in the document and
  a working copy goes into the new window, which forwards values onto the real
  inputs, so no module needs to know about it. `ADD-PANELOUT.md` is the install
  procedure and is the same file in every repository.
- `assets/count.js` — the page count, copied verbatim from every other
  repository. `ADD-COUNTING.md` is the procedure.
- `data/maui-4.js` — the trimmed Maui-4 log the later modules read. `DATA.md`
  has its provenance and the cautions for reusing it.

`tools/` holds the checks. `sh tools/check-all.sh` runs all of them and is the
thing to run before publishing. Three are worth knowing by name:

- `tools/check-module.js` — boots a module in JSDOM, drives every control
  through its whole range and fails if any readout goes bad.
- `tools/check-panelout.js` — opens the pop-out in JSDOM and checks it is live:
  that the copy matches the panel element for element, that moving a slider in
  the copy reaches the module, and that the panel comes back afterwards.
- `tools/verify-fixes.js` — boots every module and reads back the specific
  numbers the prose quotes, so a claim in the text cannot drift away from the
  readout underneath it without something failing.

```
node tools/check-module.js modules/01-rock-makes-seismic.html
sh tools/check-all.sh
```

## Data

Modules 1 to 4 use simple layered models, because a made-up model can be changed
while a student watches. Modules 5 to 8 use Maui-4 from the New Zealand
Petroleum & Minerals Geodata Catalogue (Petroleum Report 543; composite log by
GNS Science, v04.08.2010), open-file and used with acknowledgement. `DATA.md` has
the provenance, the curve list, what is derived rather than logged, and the
cautions for anyone reusing the copy in `data/`.

## Authorship

Built for teaching by **Dr. Heather Bedle** and **Dr. April Moreno-Ward**,
School of Geosciences, University of Oklahoma, with the Attribute Assisted
Seismic Processing and Interpretation (AASPI) consortium.

Both names go on this set, on the companion set, and on the SSRN paper that
accompanies it. Any adaptation released under the share-alike terms below should
carry both. The footer of every page in the repository already names them, so a
new page should be started by copying an existing one rather than written from
scratch.

## The SSRN working paper

Each of these teaching module sets has a short companion working paper on SSRN.
The paper is the citable object: it states what the set covers, who it is for,
what it deliberately leaves out, and where the data came from. The site is the
thing students use; the paper is the thing a reader cites and a tenure committee
can find.

    H. Bedle and A. Moreno-Ward, Seismic Inversion, from the start,
    University of Oklahoma. SSRN: [article link to follow]

The placeholder appears in the footer of every page and in `glossary.html`. When
the paper is posted, replace `[article link to follow]` everywhere in one pass:

```
grep -rl "article link to follow" . --include=*.html
```

The argument sections of each paper are written fresh. Shared boilerplate — the
license, availability and acknowledgement paragraphs — is the same across
papers, but the case each one makes for its own set is not recycled from
another.

## Page counting

One GoatCounter account, code `hbedle`, covers every teaching repository served
from `hbedle-subsurface.github.io`. The path tells them apart, so this set
appears under `/seismic-inversion-basics/...`. Counts are at
<https://hbedle.goatcounter.com>.

What is recorded is that a page was opened: path, title, referrer, screen size
and user-agent, once per load. No cookie is set, no identifier is stored, and
nothing that happens inside a module — no slider, no click, no computed trace —
ever leaves the browser. The modules make no network requests of their own.

The count exists for two reasons, both stated in the footer of every page: so
that the modules people actually use are the ones that get improved, and so the
university can see the sets are being used.

`ADD-COUNTING.md` is the procedure, and it is the same file in every repository.
Two things in it matter more than they look:

- **Copy `assets/count.js` verbatim.** It strips the query string before
  reporting. These modules write every control position into the address bar so
  a setup can be handed out as a link, so without that line GoatCounter files
  each visit under its own row and the module's total reads zero.
- **Give every page a real `<title>`.** GoatCounter shows it beside the path,
  and a page called "Untitled" counts perfectly well while telling you nothing.

Counting is never allowed to matter to the page. If the script is blocked or the
service is down, `onerror` swallows it and the module carries on.

## License

CC BY-SA 4.0. Free to use, adapt and share, including commercially, provided the
source is credited and adaptations carry the same license. Attribution is to
both authors named above.
