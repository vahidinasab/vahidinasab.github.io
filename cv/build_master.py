#!/usr/bin/env python3
"""
build_master.py · rebuild Vahid-Vahidinasab-Full-CV-Master-Record.md

Part I (career record) is carried forward from master-part1.md, which is the only
file edited by hand. Part II is regenerated from data/publications.json by build.py.
"""
import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent          # <repo>/cv
REPO = ROOT.parent                               # <repo>
DATA = REPO / 'data'
PART1 = ROOT / 'master-part1.md'
PART2 = ROOT / 'out' / 'publications.md'
DEST = ROOT / 'out' / 'Vahid-Vahidinasab-Full-CV-Master-Record.md'

RECONCILIATION = """### Reconciliation notes

- Records are reconciled from the author's Google Scholar and Scopus exports and verified
  manually against publisher and repository records.
- Titles are matched after normalisation; DOI and document-type metadata are retained from
  Scopus where available.
- Duplicate rows are consolidated to one entry per distinct work.
- Preprints, white papers and public-facing articles are listed under their own categories.
  Editorial front matter and publisher notices are not listed.
- A record marked as retracted is retained in the journal list and explicitly labelled.
- Bibliographic fields absent from both exports have not been invented. Records that are too
  recent to be indexed are marked as unverified until the author confirms them.
- Two papers presented at ICREPQ 2016 in Madrid appear under journal publications for 2016,
  because the ICREPQ proceedings are published as the *Renewable Energy and Power Quality
  Journal*.

"""


def main():
    profile = json.loads((DATA / 'profile.json').read_text(encoding='utf-8'))
    pubs = json.loads((DATA / 'publications.json').read_text(encoding='utf-8'))
    part1 = PART1.read_text(encoding='utf-8')
    part2 = PART2.read_text(encoding='utf-8')

    # splice the reconciliation notes in after the Part II preamble
    part2 = part2.replace('### Category summary', RECONCILIATION + '### Category summary', 1)

    today = date.today().strftime('%-d %B %Y')
    verified = date.fromisoformat(profile['metrics']['verified']).strftime('%-d %B %Y')
    m = profile['metrics']

    header = f"""# Vahid Vahidinasab
## Complete Professional and Academic Record

**Full CV and master source document**

| | |
|---|---|
| Prepared | {today} |
| Bibliometrics verified | {verified} |
| Purpose | Single authoritative source for all professional and academic experience |
| Contents | Part I: career record, sections 1 to 20. Part II: complete itemised publication list, {len(pubs)} records |

> **How to use this document.** This is the master factual record. It is written to be
> neutral and complete rather than tailored to any single opportunity, so that any CV,
> profile, application or biography can be derived from it. Part I is maintained by hand in
> `master-part1.md`. Part II is generated from `data/publications.json` by `build.py` and
> must not be edited here: edits made directly to this file are overwritten on the next
> build. Two standing rules apply to everything derived from this record. First, no telephone
> number is to appear in any version, public or private. Second, citation metrics carry a
> verification date and are refreshed from a current Google Scholar screenshot before any
> high-stakes submission. Section 20 records the full set of accuracy conventions.

"""

    body = part1.split('# Part I: Professional and academic record', 1)[-1]
    body = '# Part I: Professional and academic record' + body

    out = header + body.rstrip() + '\n\n---\n\n' + part2
    DEST.write_text(out, encoding='utf-8')

    print(f'master record written: {DEST}')
    print(f'  {len(out.splitlines())} lines, {len(pubs)} publication records')
    print(f"  metrics verified {verified}: {m['all_time']['citations']:,} citations, "
          f"h {m['all_time']['h_index']}, i10 {m['all_time']['i10_index']}")


if __name__ == '__main__':
    main()
