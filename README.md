# Seismic Inversion, from the start

Eight short interactive modules on what seismic inversion is, why it does not
have a single answer, and what to ask about a result somebody hands you.

**[Start here →](https://hbedle-subsurface.github.io/seismic-inversion-basics/)**

## Who it is for

Undergraduate geology and geophysics students meeting inversion for the first
time, and anyone who is handed an impedance map and expected to have an opinion
about it.

Density, velocity and roughly what a seismic section is. That is all the
background the set assumes. Each module takes fifteen to twenty-five minutes,
including the questions at the end of it.

## The eight modules

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

Module 1 stands on its own. After that each module depends on the ones before
it, so the first time through is best done in order. Modules 1, 4 and 7 are the
three to read if there is only an hour, and module 3 is the one to add if
resolution matters to the project in hand.

Every module has controls at the top and three or four short steps below them.
The student changes the rock and watches the seismic change, then the rock is
hidden and they try to get it back. Everything is calculated in the browser
while they watch, so nothing has to be taken on trust.

There is a [glossary](glossary.html) of 140 terms. Technical words in the prose
are marked wherever they appear, and clicking one opens its definition in place.

## What a student should be able to do afterward

- Say what acoustic impedance is, and why a geologist would rather have it than
  an amplitude.
- Explain the difference between the forward and the inverse problem.
- Give a reason why an inversion does not have a single answer.
- Say what a wavelet does to a thin bed, and work out a resolution limit from a
  velocity and a frequency.
- Say where the low frequencies in an inversion result came from, and roughly
  how much of the answer they are.
- Ask sensible questions about a result somebody else produced.

## Two things the whole set tried to teach

**More than one rock makes the same recording.** A reflection is a difference
between two rocks divided by their sum, so a whole section can be scaled and
every reflection stays where it was. A thin bed with a large contrast and a
thick one with a small contrast make the same bright event. An inversion result
is one member of a set of models that all fit the data, and something other than
the seismic chose which one is on the screen.

**The lowest frequencies were never recorded.** Impedance climbs with depth as
rocks compact, and that climb is too slow for a survey to record. The missing
part is supplied from wells, and on the well used here it is about 86 percent of
every value in the answer. The pattern comes from the seismic; most of the
number on the color bar came from a well.

## What the set leaves out

These are teaching models, built to make ideas visible. The arithmetic is what
the literature describes, on one trace at a time and in its plainest form, and
every module tries to list what it left out. This is not inversion software: the numbers
describe the model on the screen, not anyone's survey.

Wavelet estimation, the model-based loop, prestack and elastic inversion, and
building a background model across a survey are named in module 8 and
demonstrated in the companion set rather than here.

## Data

Modules 1 to 4 use simple layered models, because a made-up model can be changed
while a student watches and a real well cannot. Modules 5 to 8 use Maui-4, an
open-file well from the Taranaki Basin, so the last thing a student sees is real
rock.

Well data from the New Zealand Petroleum & Minerals Geodata Catalogue, Ministry
of Business, Innovation & Employment. Maui-4: Petroleum Report 543, composite log
compiled by GNS Science, version 04.08.2010. Open-file and used with
acknowledgement. `DATA.md` has the provenance, the curve list and the cautions
for anyone reusing the copy in `data/`.

## Privacy

Nothing a student does inside a module leaves the browser. No slider, no click
and no computed trace is transmitted anywhere, no cookie is set and no
identifier is stored. The one thing recorded is that a page was opened, so that
the modules people use are the ones that get improved.

## Authorship and how to cite it

Built for teaching by **Dr. Heather Bedle** and **Dr. April Moreno-Ward**,
School of Geosciences, University of Oklahoma, with the Attribute Assisted
Seismic Processing and Interpretation (AASPI) consortium.

Each of these teaching module sets has a short companion working paper on SSRN.
The paper is the citable object: it states what the set covers, who it is for,
what it deliberately leaves out, and where the data came from. The site is the
thing students use; the paper is the thing a reader cites.

    H. Bedle and A. Moreno-Ward, Seismic Inversion, from the start,
    University of Oklahoma. SSRN: [article link to follow]

## License

CC BY-SA 4.0. Free to use, adapt and share, including commercially, provided the
source is credited and adaptations carry the same license. Attribution is to
both authors named above. Adaptations released under the share-alike terms
should carry both names.

