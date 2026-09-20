#!/usr/bin/env python3
"""
build.py  ·  Vahid Vahidinasab CV and publication pipeline

Single source of truth:
    data/publications.json     every itemised output
    data/profile.json          identity, metrics, leadership and editorial roles
    data/activity.json         projects, keynotes, panels, media, awards

Regenerates, into out/:
    publications.md            Part II of the master record
    publications.bib           BibTeX for the LaTeX CV repos
    publications.html          the GitHub Pages publications page (reads the JSON at runtime)
    site-metrics.json          the numbers the site's counters and header read
    REVIEW.md                  everything flagged as needing verification

Usage:
    python3 build.py                 # regenerate everything
    python3 build.py --check         # validate only, write nothing (use in CI)
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from collections import Counter
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent          # <repo>/cv
REPO = ROOT.parent                               # <repo>  (GitHub Pages root)
DATA = REPO / 'data'                             # served to the site at /data/
OUT = ROOT / 'out'                               # generated artefacts

TYPE_LABEL = {
    'journal':    'Journal publications',
    'conference': 'Conference papers',
    'book':       'Books',
    'chapter':    'Book chapters',
    'public':     'Public-facing publications',
    'whitepaper': 'White papers',
    'preprint':   'Working papers and preprints',
}
TYPE_ORDER = list(TYPE_LABEL)

# 27 Farsi-language national conference papers are counted, not itemised.
UNITEMISED_CONFERENCE = 27

SURNAME = 'Vahidinasab'


# --------------------------------------------------------------------- helpers
def load():
    pubs = json.loads((DATA / 'publications.json').read_text(encoding='utf-8'))
    profile = json.loads((DATA / 'profile.json').read_text(encoding='utf-8'))
    activity = json.loads((DATA / 'activity.json').read_text(encoding='utf-8'))
    return pubs, profile, activity


def validate(pubs):
    """Fail loudly on the mistakes that silently corrupt a CV."""
    problems, ids, dois = [], Counter(), Counter()
    for p in pubs:
        ids[p['id']] += 1
        if p.get('doi'):
            dois[p['doi'].lower()] += 1
        if p['type'] not in TYPE_LABEL:
            problems.append(f"{p['id']}: unknown type {p['type']!r}")
        if not (1990 < p['year'] < date.today().year + 2):
            problems.append(f"{p['id']}: implausible year {p['year']}")
        if not p.get('authors'):
            problems.append(f"{p['id']}: no authors")
        if not any(SURNAME.lower() in a.lower() for a in p['authors']):
            problems.append(f"{p['id']}: author list does not include {SURNAME}")
    problems += [f'duplicate id: {k}' for k, v in ids.items() if v > 1]
    problems += [f'duplicate DOI: {k}' for k, v in dois.items() if v > 1]
    return problems


def by_type(pubs, t):
    return sorted((p for p in pubs if p['type'] == t),
                  key=lambda p: (-p['year'], p['title'].lower()))


def counts(pubs):
    c = Counter(p['type'] for p in pubs)
    return {t: c.get(t, 0) for t in TYPE_ORDER}


def cite_key(p):
    first = p['authors'][0].split(',')[0]
    first = unicodedata.normalize('NFKD', first).encode('ascii', 'ignore').decode()
    first = re.sub(r'[^A-Za-z]', '', first).lower() or 'anon'
    word = next((w for w in re.findall(r"[A-Za-z]{4,}", p['title'])), 'paper')
    return f"{first}{p['year']}{word.lower()}"


def tex_escape(s):
    for a, b in [('\\', r'\textbackslash{}'), ('&', r'\&'), ('%', r'\%'),
                 ('$', r'\$'), ('#', r'\#'), ('_', r'\_'), ('{', r'\{'), ('}', r'\}')]:
        s = s.replace(a, b)
    return s


def html_escape(s):
    return (s.replace('&', '&amp;').replace('<', '&lt;')
             .replace('>', '&gt;').replace('"', '&quot;'))


# ----------------------------------------------------------------- markdown
def render_markdown(pubs, profile):
    c = counts(pubs)
    total = sum(c.values())
    m = profile['metrics']
    L = [
        '# Part II: Complete publication list',
        '',
        f"**Coverage date:** {m['verified']}  ",
        '**Sources:** Google Scholar and Scopus exports supplied by the author, reconciled and '
        'verified manually against publisher and repository records.  ',
        f'**Records itemised:** {total}, plus {UNITEMISED_CONFERENCE} non-indexed national '
        'conference papers recorded as a count.',
        '',
        '### Category summary',
        '',
        '| Category | Number of records |',
        '|---|---:|',
    ]
    for t in TYPE_ORDER:
        label = TYPE_LABEL[t] + (' itemised' if t == 'conference' else '')
        L.append(f'| {label} | {c[t]} |')
    L += [f'| **Total** | **{total}** |', '']
    L.append(
        f'In addition to the {c["conference"]} conference papers itemised below, a further '
        f'{UNITEMISED_CONFERENCE} peer-reviewed conference papers were written and presented at '
        f'national conferences in Iran, in Farsi. These are not indexed by Google Scholar or '
        f'Scopus and are recorded here as a count only, giving the '
        f'{c["conference"] + UNITEMISED_CONFERENCE} conference papers stated in the CV.')
    L.append('')

    for t in TYPE_ORDER:
        group = by_type(pubs, t)
        if not group:
            continue
        L += [f'### {TYPE_LABEL[t]}', '']
        last = None
        for p in group:
            if p['year'] != last:
                if last is not None:
                    L.append('')
                L += [f"#### {p['year']}", '']
                last = p['year']
            L.append('- ' + md_entry(p))
        L.append('')
    return '\n'.join(L).rstrip() + '\n'


def md_entry(p):
    bits = [f"{'; '.join(p['authors'])} ({p['year']}). **{p['title']}.**"]
    if p.get('venue'):
        bits.append(f"*{p['venue']}*" if p['type'] != 'book' else p['venue'])
    loc = ''
    if p.get('volume'):
        loc = p['volume'] + (f"({p['issue']})" if p.get('issue') else '')
    if loc:
        bits.append(loc)
    if p.get('pages'):
        bits.append(f"pp. {p['pages']}")
    line = bits[0] + (' ' + ', '.join(bits[1:]) if len(bits) > 1 else '')
    if p.get('url'):
        line += f". {p['url']}"
    line = line.rstrip('.') + '.'
    flags = []
    if p.get('retracted'):
        flags.append('**Retracted.**')
    if p.get('needs_verification'):
        flags.append('**[Unverified: confirm before external use.]**')
    if p.get('note'):
        flags.append(p['note'])
    return line + (' ' + ' '.join(flags) if flags else '')


# --------------------------------------------------------------------- bibtex
BIB_TYPE = {'journal': 'article', 'conference': 'inproceedings', 'book': 'book',
            'chapter': 'incollection', 'public': 'article', 'whitepaper': 'techreport',
            'preprint': 'misc'}


def render_bib(pubs):
    seen, lines = Counter(), []
    for p in sorted(pubs, key=lambda x: (-x['year'], x['title'].lower())):
        key = cite_key(p)
        seen[key] += 1
        if seen[key] > 1:
            key += chr(ord('a') + seen[key] - 2)
        f = [('author', ' and '.join(p['authors'])),
             ('title', p['title']),
             ('year', str(p['year']))]
        venue_field = {'journal': 'journal', 'public': 'journal',
                       'conference': 'booktitle', 'chapter': 'booktitle',
                       'book': 'publisher', 'whitepaper': 'institution'}.get(p['type'])
        if venue_field and p.get('venue'):
            f.append((venue_field, p['venue']))
        for k in ('volume', 'issue', 'pages', 'doi'):
            if p.get(k):
                f.append(('number' if k == 'issue' else k, str(p[k])))
        if p['type'] == 'preprint':
            f.append(('note', p.get('note') or 'Preprint'))
        body = ',\n'.join(f'  {k:<10}= {{{tex_escape(v)}}}' for k, v in f)
        lines.append(f'@{BIB_TYPE[p["type"]]}{{{key},\n{body}\n}}\n')
    return ('% Generated by build.py. Do not edit by hand: edit data/publications.json.\n'
            f'% Generated {date.today().isoformat()}\n\n' + '\n'.join(lines))


# ----------------------------------------------------------------------- html
# The site page is generated into the user's own template, so his design and his
# filter script are preserved exactly. Only the data regions are replaced.
TPL = ROOT / 'templates' / 'publications.html'

# his filter buttons use these data-cat keys; map our types onto them
SITE_CAT = {'journal': 'journal', 'conference': 'conference', 'book': 'book',
            'chapter': 'chapter', 'public': 'public', 'whitepaper': 'white',
            'preprint': 'working'}
SITE_LABEL = dict(TYPE_LABEL, public='Public engagement & media',
                  whitepaper='White papers', preprint='Working papers & preprints')


def blob(p):
    """Lower-cased search haystack, matching the template script's data-blob contract."""
    parts = [p['title'], '; '.join(p['authors']), p.get('venue') or '',
             str(p['year']), ' '.join(p.get('tags') or [])]
    return html_escape(' '.join(parts).lower())


def render_item(p):
    title = html_escape(p['title']) + '.'
    if p.get('url'):
        u = html_escape(p['url'])
        title = f'<a href="{u}" target="_blank" rel="noopener">{title}</a>'
    authors = '; '.join(
        f'<b>{html_escape(a)}</b>' if SURNAME.lower() in a.lower() else html_escape(a)
        for a in p['authors'])
    meta = [authors]
    if p.get('venue'):
        meta.append(f'<span class="pv">{html_escape(p["venue"])}</span>')
    meta.append(str(p['year']))
    flags = ''
    if p.get('retracted'):
        flags += ' <b>[Retracted]</b>'
    if p.get('needs_verification'):
        flags += ' <b>[Unverified]</b>'
    doi = (f'<a class="pdoi" href="{html_escape(p["url"])}" target="_blank" '
           f'rel="noopener">DOI \u2197</a>') if p.get('doi') else ''
    return (f'<li class="pub-item" data-blob="{blob(p)}"><div class="pi-main">'
            f'<div class="pi-title">{title}{flags}</div>'
            f'<div class="pi-meta">{" \u00b7 ".join(meta)}</div></div>{doi}</li>')


def render_body(pubs):
    out = []
    for t_ in TYPE_ORDER:
        group = by_type(pubs, t_)
        if not group:
            continue
        out.append(f'<section class="pubcat" data-cat="{SITE_CAT[t_]}">'
                   f'<h2 class="pubcat-h"><span class="pc-idx">//</span>'
                   f'{html_escape(SITE_LABEL[t_])} '
                   f'<span class="pc-count">{len(group)}</span></h2>')
        year = None
        for p in group:
            if p['year'] != year:
                if year is not None:
                    out.append('</ul></div>')
                year = p['year']
                out.append(f'<div class="pubyear"><div class="py-label">{year}</div>'
                           f'<ul class="py-list">')
            out.append(render_item(p))
        out.append('</ul></div></section>')
    return '\n'.join(out)


def render_metrics_block(pubs, profile):
    a = profile['metrics']['all_time']
    c = counts(pubs)
    cells = [('Citations', f"{a['citations']:,}"), ('h-index', a['h_index']),
             ('i10-index', a['i10_index']), ('Journal papers', c['journal']),
             ('Conference', c['conference']), ('Books', c['book']),
             ('Chapters', c['chapter'])]
    return '\n'.join(f'      <div class="metric"><div class="n">{v}</div>'
                      f'<div class="l">{k}</div></div>' for k, v in cells)


def render_html(pubs, profile):
    if not TPL.exists():
        raise SystemExit(f'Template missing: {TPL}')
    verified = date.fromisoformat(profile['metrics']['verified']).strftime('%-d %B %Y')
    html = TPL.read_text(encoding='utf-8')
    for k, v in {'{{COVERAGE}}': verified,
                 '{{TOTAL}}': str(len(pubs)),
                 '{{METRICS}}': render_metrics_block(pubs, profile),
                 '{{BODY}}': render_body(pubs)}.items():
        html = html.replace(k, v)
    assert '{{' not in html, 'unsubstituted placeholder in the template'
    return html


# ------------------------------------------------------------------ latex
def tex_entry(p, bold_me=True):
    r"""One \item line for the inline (non-biblatex) publication lists."""
    auth = '; '.join(
        (r'\textbf{' + tex_escape(a) + '}') if (bold_me and SURNAME.lower() in a.lower())
        else tex_escape(a)
        for a in p['authors'])
    bits = [f"{auth} ({p['year']}). \\emph{{{tex_escape(p['title'])}}}."]
    if p.get('venue'):
        bits.append(tex_escape(p['venue']))
    if p.get('volume'):
        bits.append(tex_escape(p['volume'] + (f"({p['issue']})" if p.get('issue') else '')))
    if p.get('pages'):
        bits.append('pp.~' + tex_escape(p['pages']))
    line = bits[0] + (' ' + ', '.join(bits[1:]) if len(bits) > 1 else '')
    if p.get('doi'):
        line = line.rstrip('.') + ('. \\href{https://doi.org/' + p['doi'] + '}{doi:'
                                   + tex_escape(p['doi']) + '}')
    line = line.rstrip('.') + '.'
    if p.get('retracted'):
        line += ' \\textbf{[Retracted.]}'
    if p.get('needs_verification'):
        line += ' \\textbf{[Unverified.]}'
    return '  \\item ' + line


def render_pubs_full_tex(pubs):
    """Complete inline list for vahidinasab-cv/content/pubs-full.tex."""
    L = ['% Generated by build.py from data/publications.json. Do not edit by hand.',
         f'% Generated {date.today().isoformat()}', '']
    for t in TYPE_ORDER:
        group = by_type(pubs, t)
        if not group:
            continue
        L += [f'\\cvsection{{{TYPE_LABEL[t]}}}', r'\begin{cvbullets}']
        L += [tex_entry(p) for p in group]
        L += [r'\end{cvbullets}', '']
    return '\n'.join(L)


def render_pubs_selected_tex(pubs, tag=None, n=6):
    """Curated short list for the two 2-pagers. Pass --selected <tag> to theme it."""
    pool = [p for p in pubs
            if p['type'] in ('journal', 'book')
            and not p.get('needs_verification')
            and not p.get('retracted')]
    if tag:
        pool = [p for p in pool if tag in (p.get('tags') or [])] or pool
    def rank(p):
        return (0 if SURNAME.lower() in p['authors'][0].lower() else 1, -p['year'])
    journals = sorted((p for p in pool if p['type'] == 'journal'), key=rank)
    books = sorted((p for p in pool if p['type'] == 'book'), key=rank)
    picked = (journals[:n - min(2, len(books))] + books[:2])[:n]
    picked.sort(key=rank)
    head = ('% Generated by build.py'
            + (f' with --selected {tag}' if tag else ' (no theme: most recent, lead-author first)')
            + '. Review the selection by hand before submitting.')
    return '\n'.join([head, f'% Generated {date.today().isoformat()}', '',
                       r'\begin{cvbullets}'] + [tex_entry(p) for p in picked]
                      + [r'\end{cvbullets}', ''])


def render_metrics_tex(profile):
    m = profile['metrics']
    a, s = m['all_time'], m['since_2021']
    verified = date.fromisoformat(m['verified']).strftime('%-d %B %Y')
    return ('% Generated by build.py from data/profile.json. Do not edit by hand.\n'
            f'% Generated {date.today().isoformat()}\n\n'
            r'\begin{cvbullets}' + '\n'
            f"  \\item Citations: \\textbf{{{a['citations']:,}}} "
            f"({s['citations']:,} since 2021)\n"
            f"  \\item h-index: \\textbf{{{a['h_index']}}} "
            f"({s['h_index']} since 2021) \\quad i10-index: "
            f"\\textbf{{{a['i10_index']}}} ({s['i10_index']} since 2021)\n"
            f"  \\item Google Scholar, verified {verified}\n"
            + r'\end{cvbullets}' + '\n')


# --------------------------------------------------------------------- review
def render_review(pubs, profile, activity, problems):
    L = ['# Review queue', '',
         f'Generated {date.today().isoformat()} by build.py. '
         'Nothing here should reach an external CV until it is confirmed.', '']
    if problems:
        L += ['## Validation errors', ''] + [f'- {p}' for p in problems] + ['']
    flagged = [p for p in pubs if p.get('needs_verification')]
    if flagged:
        L += ['## Publications awaiting confirmation', '']
        for p in flagged:
            L.append(f"- **{p['title']}** ({p['year']}, {p.get('venue') or 'venue unknown'})"
                     + (f" &mdash; {p['note']}" if p.get('note') else ''))
        L.append('')
    for label, key in [('Leadership roles', 'leadership_roles'),
                       ('Editorial roles', 'editorial_roles')]:
        flag = [r for r in profile.get(key, []) if r.get('needs_verification')]
        if flag:
            L += [f'## {label} awaiting confirmation', '']
            for r in flag:
                name = r.get('role') or r.get('venue')
                L.append(f"- **{name}**, {r.get('org') or r.get('venue')}, "
                         f"{r.get('from')} to {r.get('to')}"
                         + (f" &mdash; {r['note']}" if r.get('note') else ''))
            L.append('')
    retracted = [p for p in pubs if p.get('retracted')]
    if retracted:
        L += ['## Retracted records (kept and labelled)', '']
        L += [f"- {p['title']} ({p['year']})" for p in retracted] + ['']
    m = profile['metrics']
    L += ['## Metrics', '',
          f"- Verified {m['verified']} from {m['source']}",
          f"- All time: {m['all_time']['citations']:,} citations, "
          f"h-index {m['all_time']['h_index']}, i10-index {m['all_time']['i10_index']}",
          f"- Since 2021: {m['since_2021']['citations']:,} citations, "
          f"h-index {m['since_2021']['h_index']}, i10-index {m['since_2021']['i10_index']}", '']
    if not flagged and not problems:
        L += ['_No blocking issues._', '']
    return '\n'.join(L)


# ----------------------------------------------------------------------- main
def main():
    check_only = '--check' in sys.argv
    pubs, profile, activity = load()
    problems = validate(pubs)

    for p in problems:
        print('VALIDATION:', p, file=sys.stderr)

    if check_only:
        print(f'{len(pubs)} records, {len(problems)} validation problems.')
        sys.exit(1 if problems else 0)

    OUT.mkdir(exist_ok=True)
    (OUT / 'publications.md').write_text(render_markdown(pubs, profile), encoding='utf-8')
    (OUT / 'publications.bib').write_text(render_bib(pubs), encoding='utf-8')
    (OUT / 'pubs-full.tex').write_text(render_pubs_full_tex(pubs), encoding='utf-8')
    (OUT / 'metrics.tex').write_text(render_metrics_tex(profile), encoding='utf-8')

    # the site page is written straight to the Pages root, beside index.html
    html = render_html(pubs, profile)
    (OUT / 'publications.html').write_text(html, encoding='utf-8')
    (REPO / 'publications.html').write_text(html, encoding='utf-8')

    tag = None
    if '--selected' in sys.argv:
        tag = sys.argv[sys.argv.index('--selected') + 1]
    (OUT / 'pubs-selected.tex').write_text(
        render_pubs_selected_tex(pubs, tag), encoding='utf-8')
    (OUT / 'REVIEW.md').write_text(
        render_review(pubs, profile, activity, problems), encoding='utf-8')

    c = counts(pubs)
    m = profile['metrics']
    (OUT / 'site-metrics.json').write_text(json.dumps({
        'verified': m['verified'],
        'citations': m['all_time']['citations'],
        'h_index': m['all_time']['h_index'],
        'i10_index': m['all_time']['i10_index'],
        'years_in_field': profile['headline_numbers']['years_in_field'],
        'funding_gbp_m': profile['headline_numbers']['funding_attributable_gbp_m'],
        'counts': c,
        'total_itemised': sum(c.values()),
    }, indent=1), encoding='utf-8')

    print(f'{sum(c.values())} records  ->  ' + ', '.join(f'{k} {v}' for k, v in c.items()))
    print(f"metrics verified {m['verified']}: {m['all_time']['citations']:,} citations, "
          f"h {m['all_time']['h_index']}, i10 {m['all_time']['i10_index']}")
    flagged = sum(1 for p in pubs if p.get('needs_verification'))
    print(f'{flagged} record(s) flagged for verification, {len(problems)} validation problems.')
    print('written to', OUT)
    print('site page written to', REPO / 'publications.html')


if __name__ == '__main__':
    main()
