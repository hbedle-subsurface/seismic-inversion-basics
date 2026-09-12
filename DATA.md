# Data

## Maui-4

Modules 5 to 8 run on a real well. Modules 1 to 4 do not: they use small made-up
layer stacks, because a made-up model can be changed while a student watches and
a real log cannot.

| | |
|---|---|
| Well | Maui-4 |
| Basin | Offshore Taranaki, New Zealand |
| Operator | Shell BP & Todd Oil Services Ltd |
| Spudded | 11 May 1970 |
| Source | NZP&M Geodata Catalogue, Petroleum Report 543; GNS Science composite log v04.08.2010 |
| Interval in this repository | 1981.5 to 2713.8 m below drill floor |
| Sample spacing | 0.152 m (4,806 samples) |

The data is open file. It was released by New Zealand Petroleum & Minerals, part
of the Ministry of Business, Innovation & Employment, through the Geodata
Catalogue at <https://www.nzpam.govt.nz/maps-geoscience/geodata-catalogue>. It
is free to download and is used here with acknowledgement. It is **not** covered
by the CC BY-SA 4.0 license that covers the rest of this repository; anyone
reusing it should acknowledge NZP&M in the same way.

## Curves

`data/maui-4.js` holds a trimmed copy of the log as a plain JavaScript object,
loaded with a `<script>` tag rather than fetched, because a browser blocks
`fetch()` of a local file and every module has to work from a copy on disk.

| Curve | Units | Note |
|-------|-------|------|
| `DEPT` | m below drill floor | |
| `TWT` | s, two-way | see below |
| `DT` | µs/ft | the sonic, as logged |
| `RHOB` | g/cc | the density log |
| `GR` | API | |
| `CALI` | in | |
| `VP` | m/s | derived: 304800 / `DT` |
| `AI` | (m/s)(g/cc) | derived: `VP` × `RHOB` |

`VP` and `AI` are derived rather than logged, and are stored so that every
module reads the same numbers instead of each recomputing them. They are exact
to within rounding: `VP` reproduces 304800/`DT` to better than one part in
10,000, and `AI` reproduces `VP`·`RHOB` to better than one part in 30,000.

## Two-way time

`TWT` is a sonic integration: the travel time across each sample is twice the
sample spacing divided by the velocity there, accumulated down the log and
anchored to the checkshot at the top of the logged interval. Over the 365 ms the
log spans, the integrated base differs from the checkshot by about 5 ms.

That residual is ordinary sonic drift and it is left in. Module 5 makes the same
sum from `VP` while the student watches, and deliberately starts it 18 ms early
so that the tie control has a real offset to find; the drift itself is named in
that module's "How this page works" pane as something the page does not correct.

## Markers

The markers in `data/maui-4.js` come from the well completion report.

| Marker | Top (m) | Base (m) | Note |
|--------|---------|----------|------|
| Tested oil sand | 2030.6 | 2051.9 | 47 ft net, 12% porosity, 30% Sw; tested 575 b/d |
| Coal | 2055.9 | 2057.2 | AI about 3,573; reflection coefficient at its top about −0.46 |
| Oil sand | 2064.7 | 2073.3 | 22 ft net, 14% porosity, 40% Sw |
| Mangahewa Fm, C sand | 2266.0 | — | formation top |

The coal carries the largest impedance contrast anywhere in the logged interval,
which is why modules 5 and 7 hang their examples on it. It is 1.3 m thick, which
is well below anything the seismic in these modules could resolve — that is the
point being made in module 5 step 3, not an oversight.

## Cautions for anyone reusing this copy

- The interval here is trimmed. The full log runs deeper and shallower.
- No environmental corrections have been applied beyond whatever was applied in
  the composite log as released. `CALI` is included so washouts can be seen.
- The impedance is acoustic only. There is no shear sonic in this interval,
  which is why module 8 names pre-stack inversion but does not run it.
- Anything computed on top of this log by the modules — synthetic traces,
  relative impedance, background models — is a teaching construction and is
  described in each module's "How this page works" pane. None of it came with
  the data.

For the original, go to the Geodata Catalogue and search for Maui-4 or for
Petroleum Report 543.
