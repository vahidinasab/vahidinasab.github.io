# Building the job and subject pages

The job pages (`jobs/`), the GCSE subject pages (`subjects/`), `sitemap.xml` and the "Browse every job and subject" list on the main page are written by a script from the data inside `index.html`. They are ordinary files, so GitHub Pages serves them with no build step. GitHub Pages does not publish this `_build` folder.

## After changing a job, a subject or a topic in `index.html`

From the `sustainable-skills` folder:

```bash
node _build/build-pages.mjs
```

It needs Node 18 or later and nothing else. It copies every fact from `index.html`, so do not edit the pages in `jobs/` or `subjects/` by hand: the next run would overwrite them. Commit `index.html` together with the pages it rewrote.

## Preview pictures for the job pages

```bash
node _build/build-previews.mjs
```

This draws one picture per job (`jobs/img/`, 1200 x 630) for link previews. It needs Playwright with Chromium (`npm install playwright`), which is only used on your computer. Run `build-pages.mjs` again afterwards so each job page points at its picture.
