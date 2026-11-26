# Sustainable Local Energy Skills Roadmap: how it is put together

Plain HTML, CSS and JavaScript. No framework and no build step for the app itself: GitHub Pages serves the files as they are. GitHub Pages does not publish this `_build` folder.

## Where things live

| What | File |
| --- | --- |
| The 19 jobs: pay, ways in, official profile links | `data/jobs.js` |
| The 9 GCSE subjects and the topics, with the Department for Education wording | `data/subjects.js` |
| The home picture: its 9 parts and where each dot sits | `data/home.js` |
| Everything else: settings, the four questions, key dates, next steps, Near you, Good to know, Words explained, sources, teacher mode, and the "information checked" date | `data/guide.js` |
| The screens (welcome, questions, roadmap, job, home, Near you, More, teacher mode) | `js/app.js` |
| The matching rules, saved answers, share links, the email and copied text, the visit counter | `js/core.js` |
| The two PDFs (loaded only when someone asks for a PDF) | `js/pdf.js` and `vendor/pdf-lib-1.17.1.min.js` |
| The page frame, the welcome screen and all the styles | `index.html` |
| Offline use and "add to home screen" | `sw.js`, `manifest.webmanifest`, `assets/icon-*.png` |
| Teacher pack, privacy and accessibility pages | `teachers.html`, `slides.html`, `worksheet.html`, `poster.html`, `privacy.html`, `accessibility.html` |
| Job and subject pages for search engines (written by a script, see below) | `jobs/`, `subjects/`, `sitemap.xml` |

## Updating a fact

1. Change it in the data file. Each file starts with a short note on its fields.
2. From this tool's folder, run:

```bash
node _build/build-pages.mjs
```

This rewrites the job pages, the subject pages, `sitemap.xml` and the "Browse every job and subject" list in `index.html`, all copied from the data files. It needs Node 18 or later and nothing else. Do not edit the pages in `jobs/` or `subjects/` by hand: the next run overwrites them.

3. Commit the data file together with the pages the script rewrote.

When you re-check the facts, change `D.checked` near the top of `data/guide.js` (for example `"October 2026"`). The screens, the PDFs and the job pages all read it from there.

The app, the PDFs, the email, the copied text and the job pages all read the same data files, so a fact is changed once.

## Things to keep as they are

- `D.config.toolUrl` and `D.config.statsUrl` in `data/guide.js`: the public address and the visit counter. The counter only runs when the page is open at the public address, so previews and local copies count nothing.
- The saved-answer keys and the `#r=` share-link format in `js/core.js`. Changing them would lose people's saved answers and break links already shared.
- The security line near the top of `index.html` (`Content-Security-Policy`). It lets the page load only its own files, plus the counter. Do not add scripts, fonts or pictures from other websites.
- The styles sit inside `index.html` on purpose, so the first screen appears after one request on a slow connection.

## Offline copy

`sw.js` saves the tool on the device the first time it opens. A page is fetched fresh whenever there is a connection, and the other files refresh in the background, so a change you publish appears by the next visit. There is no version number to bump.

If you add a new file the app needs on first load, add it to the `CORE` list at the top of `sw.js`.

## Previewing on your computer

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/` in a browser. Offline use and "add to home screen" only work on `localhost` or on the published `https` address.

## Preview pictures for the job pages

```bash
node _build/build-previews.mjs
```

This draws one picture per job (`jobs/img/`, 1200 x 630) for link previews. It needs Playwright with Chromium (`npm install playwright`), used only on your computer. Run `build-pages.mjs` again afterwards so each job page points at its picture.

## Before publishing a change

- Answer the four questions on a phone-sized window and a laptop-sized one, in light and dark mode.
- Download both PDFs, and try Copy text, Email it and Share a link.
- Open an old share link, for example `?src=share#r=9.make-planet.c.geography-dt.hands`, and check it shows a roadmap.
- British English, plain words, no em dashes.
