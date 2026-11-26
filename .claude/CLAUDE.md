# Maintaining vahidinasab.github.io

Static academic profile of Professor Vahid Vahidinasab. GitHub Pages builds `main` with Jekyll, so files and folders whose names start with `.` or `_` are never published (this file included). Plain HTML, CSS and JavaScript, with no build step and no dependencies.

## Scope

- `index.html` is the profile, `publications.html` the full publication list, `assets/` the images.
- `sustainable-skills/` is maintained separately. Never edit anything inside it. Linking to it from the profile is fine (the featured card in `#projects` uses its `og-image.png`).

## Security rules

- Both pages carry a Content-Security-Policy meta tag: they may load only files from this site. Never add scripts, fonts, styles, images or embeds from another domain (no CDNs, no Google Fonts, no hotlinked images, no social media embed widgets). Copy a file into `assets/` instead, and only if its licence allows it.
- Page scripts live in `assets/site.js` and `assets/publications.js`. No inline `<script>` blocks and no `onclick=` attributes: the policy blocks them. The one exception is the one-line script in the head of `index.html`, allowed by its sha256 value in the policy; if that line changes, recompute the hash.
- Fonts are served from `assets/fonts/` through `assets/fonts.css`.
- Every link that opens a new tab has `rel="noopener"`. Use full `https://` addresses to the real destination, not link shorteners.
- Never write text from outside sources into the page with `innerHTML`.

## House style

- British English. No em dashes anywhere. En dashes only for ranges such as `2021 – Dec 2024`; where a published title contains a dash, the site uses a comma instead.
- Keep the owner's wording. Never invent figures, dates, co-authors, partners or roles: ask for them.
- Never add phone numbers or home addresses.
- Every new block on the profile gets the `reveal` class, like its neighbours.

## Adding a publication (publications.html)

1. Find the category section (`data-cat` = `journal`, `conference`, `book`, `chapter`, `public`, `white` or `working`) and the year group (`py-label`). Create the year group if it is missing; newest year first.
2. Copy a neighbouring `<li class="pub-item">` and update all of it: `data-blob` (lower-case title, authors, venue and year; the search box reads it), the title link, the authors with the owner as `<b>Vahidinasab, Vahid</b>`, the venue in `<span class="pv">`, the year, and the `pdoi` button (`DOI ↗` for DOIs, `Article ↗` for other links).
3. Update the counts: the section's `pc-count`, the matching metric tile at the top (Journal papers, Conference, Books, Chapters), the `All (N)` filter button, and the `View all N publications` button in `index.html`.
4. Run the recount below.

## Adding an activity (index.html)

- Roles: the `#career` timeline, newest first. A current headline role also goes in the hero `.role` lines, the bio paragraph, the meta and `og:description` tags and the JSON-LD `jobTitle`.
- Awards, editorial roles and memberships: the three lists in `#recognition`.
- Projects and tools: cards in `#projects`.
- News, articles, posts and media: the `#news` section, newest first. The newest item is the lead card (`.news-lead`); when adding a newer one, move the old lead into the top of `.news-feed` as a list row. Each item carries `data-src` (`salford`, `conversation` or `linkedin`; a new source also needs a filter button and an `.n-src` dot colour). Then update the strip under the hero (`.latest`) so it shows the three newest items. Use the owner's headline wording. Articles the owner wrote (The Conversation) also get an entry in the `public` section of `publications.html`; news stories about him do not.
- The selected publications carousel (`#work`) changes only when asked.

## Citation figures

Google Scholar figures live in `index.html` (the `#stats` tiles, where `data-target` and the visible number must match, and the date and i10-index in `.stats-note`) and in `publications.html` (the metric tiles and the date in `.coverage`).

## Before committing

Recount the publication list:

```bash
python3 - <<'PY'
import re
s = open('publications.html', encoding='utf-8').read()
total = 0
for cat, body in re.findall(r'<section class="pubcat" data-cat="([^"]+)">(.*?)</section>', s, re.S):
    n = len(re.findall(r'<li class="pub-item"', body)); total += n
    print(cat, 'stated', re.search(r'pc-count">(\d+)', body).group(1), 'actual', n)
print('total', total, '| All button', re.search(r'All \((\d+)\)', s).group(1))
PY
```

Then serve the folder (`python3 -m http.server`) and check both pages at desktop and phone widths: the Menu button, search and filters, and print preview. Never commit `.DS_Store` files.
