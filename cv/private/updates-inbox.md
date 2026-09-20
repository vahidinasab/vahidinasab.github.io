# Updates inbox

Drop things here the moment they happen. Untidy is fine. This file is emptied at each
quarterly pass, when its contents are moved into `data/` and the master record.

**Log a paper when it is accepted, not when it appears.** Acceptance is when you know it is
real; publication is months later and easy to miss.

**Record what you cannot reconstruct in six months:** the date, what it was, your role, who
the counterpart was, and one number if there is one (grant value, your share, audience size,
cohort, partner count). Everything else can be looked up.

Never record: home address, telephone number, or anything covered by the standing accuracy
rules.

---

## Papers and outputs

Format: `YYYY-MM-DD · accepted/published · venue · DOI if known · your position in the author list`

- 2026-09-20 · published · Journal of Energy Storage · 10.1016/j.est.2026.124695 · TITLE AND AUTHORS STILL NEEDED

## Roles and appointments

Format: `YYYY-MM · role · organisation · scope (team size, budget, remit)`

- 2026 · Academic Research Lead, Centre for Sustainable Innovation · University of Salford · START MONTH TO CONFIRM

## Grants and bids

Format: `YYYY-MM · submitted/awarded/rejected · call · your role (PI/Co-I/WP lead) · total value · your share`

-

## Keynotes, talks and panels

Format: `YYYY-MM-DD · invited/submitted · event · city · audience size · title`

These never appear in Google Scholar. If it is not written down here it is gone.

-

## Editorial, review and esteem

Format: `YYYY-MM · role · venue or body · start or end`

-

## Supervision and people

Format: `YYYY-MM · PhD completion / new starter / examining · name · topic`

-

## Media, policy and engagement

Format: `YYYY-MM-DD · outlet or body · what · link`

-

## Awards and recognition

-

---

## Quarterly pass checklist

1. Fresh Google Scholar screenshot into the project; update `metrics` in `data/profile.json`
   and append to `metrics.history`.
2. Fresh Google Scholar and Scopus CSV exports; reconcile new records into
   `data/publications.json`.
3. Move everything above into `data/publications.json`, `data/profile.json` or
   `data/activity.json`, then clear this file back to empty headings.
4. Run `python3 build.py` and read `out/REVIEW.md` before anything goes out.
5. Run `python3 build_master.py`.
6. Push `data/`, `publications.html` and `index.html` to the GitHub Pages repo.
7. Recompile both LaTeX CV repos against the new `publications.bib` and confirm the
   two-pagers are still exactly two pages.
