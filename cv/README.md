# CV and publication pipeline

This lives inside `vahidinasab.github.io` because the site is the only consumer that needs the
data at runtime. Everything else takes a copy.

One source of truth, everything else generated. Adding a paper means one JSON record and one
command. The master record, the website, both LaTeX CV repos and the funder-facing lists all
update together and cannot drift apart.

## Layout

```
vahidinasab.github.io/
├── index.html                    PUBLIC. Fetches data/*.json in the browser.
├── publications.html             PUBLIC, GENERATED. Overwritten on every build.
├── data/                         PUBLIC
│   ├── publications.json           173 itemised outputs: the canonical list
│   └── profile.json                GENERATED slim copy: only what index.html shows
├── cv/
│   ├── build.py                  regenerates everything
│   ├── build_master.py           reassembles the master record
│   ├── templates/
│   │   └── publications.html     your page with the data regions blanked out
│   ├── private/                  GITIGNORED. Edit these.
│   │   ├── profile.json            full profile: roles, esteem, verification notes
│   │   ├── activity.json           projects, keynotes, panels, media, awards
│   │   ├── master-part1.md         Part I of the master record
│   │   └── updates-inbox.md        rolling capture between quarterly passes
│   ├── exports/                  GITIGNORED scratch for Scholar and Scopus CSVs
│   └── out/                      GITIGNORED, GENERATED
├── .github/workflows/validate.yml
└── .nojekyll
```

## The loop

```bash
# 1. edit data/publications.json (or profile.json / activity.json)
# 2. regenerate
python3 cv/build.py
python3 cv/build_master.py

# 3. read the review queue before anything leaves the machine
cat cv/out/REVIEW.md

# 4. publish
git add -A && git commit -m "publications: <what changed>" && git push
```

GitHub Pages rebuilds on push. The Action validates the data and fails the build if the
generated files are stale, so a committed change that was never rebuilt cannot ship.

`python3 cv/build.py --check` validates and writes nothing. It exits non-zero on a duplicate
id, a duplicate DOI, an implausible year, a missing author list, or an author list that does
not contain your own name. That last one is the mistake that actually happens when copying
entries between files.

## What gets generated, and where it goes

| File | Destination |
|---|---|
| `publications.html` (repo root) | the live site. Written automatically. |
| `index.html` | unchanged by the build: it fetches `data/*.json` in the browser |
| `cv/out/Vahid-Vahidinasab-Full-CV-Master-Record.md` | the CV-RESUME project, replacing the current master |
| `cv/out/publications.md` | Part II of that master record |
| `cv/out/publications.bib` | `CV_VV_2025` → replaces `Publications_GS.bib` and the `JNL/*.bib` set |
| `cv/out/pubs-full.tex` | `vahidinasab-cv` → `content/pubs-full.tex` |
| `cv/out/pubs-selected.tex` | `vahidinasab-cv` → `content/pubs-selected.tex` |
| `cv/out/metrics.tex` | `vahidinasab-cv` → `content/metrics.tex` |
| `cv/out/REVIEW.md` | your desk, before any external submission |

The three CV repos stay separate. This one holds the facts; `vahidinasab-cv` and `CV_VV_2025`
hold the typesetting. Copy the generated `.tex` and `.bib` across, recompile, and confirm the
two 2-pagers are still exactly 2 pages (`pdfinfo file.pdf | grep Pages`).

## Themed selection

The two 2-pagers carry a curated short list. Theme it to the opportunity:

```bash
python3 cv/build.py --selected v2g          # or flexibility, markets, microgrid,
                                            # resilience, storage, wholesystem, ai, planning
```

It picks lead-author work first, most recent next, and caps books at two so a short list is
not five monographs. Always read the selection before it goes out; it is a starting point,
not a decision.

## Adding a record

```json
{
  "id": "2026-short-slug-of-the-title",
  "type": "journal",
  "year": 2026,
  "authors": ["Surname, First", "Vahidinasab, Vahid"],
  "title": "Title without a trailing full stop",
  "venue": "Journal name",
  "volume": "155", "issue": null, "pages": "121413",
  "doi": "10.1016/...", "url": "https://doi.org/10.1016/...",
  "tags": ["v2g", "flexibility"],
  "retracted": false,
  "needs_verification": false,
  "note": null
}
```

`type` is one of `journal`, `conference`, `book`, `chapter`, `public`, `whitepaper`,
`preprint`.

Set `needs_verification: true` on anything not yet confirmed. It is rendered with a visible
flag in the markdown, the LaTeX and on the website, and listed in `cv/out/REVIEW.md`, so an
unconfirmed record cannot quietly reach a funder.

## How the two pages work

**`publications.html` is generated into your own template.** `cv/templates/publications.html`
is your page with four regions blanked out: the coverage date, the metrics strip, the total
count, and the list itself. `build.py` fills them. Your CSS and your filter script are copied
through byte for byte, so the design is untouched and the search and category filters keep
working exactly as before. If you restyle the page, edit the template, not the output.

**`index.html` fetches its figures at runtime** from `data/profile.json` and
`data/publications.json`: the four counters, the bibliometrics line under the hero, and the
publication count on the "View all" button. The last known values stay in the markup as a
fallback, so the page still reads correctly if the fetch fails. It is the only page that reads
the JSON in the browser; everything else is generated at build time.

## This repo is public

GitHub Pages serves every committed file. So `cv/private/` and `cv/out/` are gitignored and
never leave your machine: the full profile with its verification notes, `master-part1.md`
with the section 20 conventions, `updates-inbox.md`, and the generated master record.

What is public: `index.html`, `publications.html`, `data/publications.json`, a slim
`data/profile.json` carrying only the figures the front page displays, and the build scripts.

Keep `cv/private/` backed up. It is the source of truth and git is no longer protecting it.

## Standing rules the pipeline enforces

- No telephone number and no home address anywhere in the data files.
- Citation metrics always carry a verification date, and the history is kept in
  `profile.json` under `metrics.history`.
- Niroo roles carry the "national electric power research institute" context, so no derived
  CV can present them as a UK university post.
- Retracted records stay in the list and stay labelled.
- Nothing is invented. Unknown fields are `null`, not guessed.

## First push

```bash
cd vahidinasab.github.io
git add -A
git commit -m "Add CV and publication pipeline; regenerate publications page"
git push
```
