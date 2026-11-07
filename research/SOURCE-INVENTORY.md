# Source inventory and public mapping

Audit date: 2026-11-06. Destination: public `arccoxx/Eurorack-Onwards` on branch `cursor/symposium-synthesis-demos-e642`. Visibility was public before this work and is not changed. Existing files `README.md` (append only), `ctc-round-2026-11-06.md`, and `knowledge-graph-2026-11-06.json` stay. Prior main commit `2d035c5dbe386484960a1da56dbeaaca070f967f` is the parent of this branch.

The three uploaded archives were extracted together under a staging directory. They are parts of one transfer (t481) carrying t472 research and t479 handoff notes.

## Published from that transfer

| Material | Where it went | What was removed first |
|---|---|---|
| Untested HTML seeds | `awesome-ai-symposium-synthesis-1954/seeds/` | Nothing. They are labeled untested and are not the working demo. |
| Publication titles, years, venues, short original “why major” notes | `research/publications-catalogue.json` | Local PDF paths and file bytes |
| Art-theory grid, 42 metadata records | `research/art-theory-synthesis-grid.json` and `.md` | `local_text` paths; no full books or JSTOR articles |
| Solomonoff, Dartmouth, strong-AI, synth, RISC-V findings | `research/*.md` | Private absolute paths, access diagnostics, scraped HTML/PDF bodies |
| Snapshot hashes of files we did **not** republish | `research/SNAPSHOT-HASHES.md` | The files themselves |
| AMD product-table figures fetched again on 2026-11-06 | `research/citations/amd-zynq-ultrascale-plus-mpsoc.md` | Marketing page chrome |

## Written new, not copied from the archives

Working demos, `signal-core.js`, `signal_core.py`, schemas, tests, verdicts, SVG/PNG diagrams, module and patch notes, `llms.txt`, and this inventory. The overnight package had no executable Python simulations. The seeds were not a finished UI.

## Read and not published

| Class | Examples | Why |
|---|---|---|
| Owner-only review bucket | 221 of 236 transfer files in the packer’s SUMMARY | Public availability is not redistribution permission |
| Third-party HTML, PDF, JPG | Solomonoff memorial mirrors, paper PDFs, JSTOR HTML, VCV and Espressif HTML, SRS and Zurich PDFs, `formula.jpg` | Bulk full text stays out. Equations are restated as mathematics. The formula image is cited by URL and hash. |
| Access and account diagnostics | `access-diagnostics.md`, `errors.jsonl`, internal handoff | Private operational notes |
| Proprietary ledger details | Constitution article numbers, live ledger paths, auditor internals from the KG note | Replaced by a generic append-only method |
| Other repositories | `aidan-relativity-computing`, `parallel-history`, private supersystem recovery | Not touched |

## Counts from the transfer summary

236 files, 39,076,554 payload bytes, 15 public-candidate files, 221 owner-only-review files. Overnight simulations implemented: false. HTML seeds: present and untested at transfer time. This coding session is what first ran tests.

## Seeds versus this release

`seeds/demo1-matrix-mixer.html` draws the patch with the same formula as the reference and writes a residual of zero by construction. That file was not executed as a claim of correctness. The tested residual lives in `implementations/signal-core.js`.
