// Writes the job pages, the GCSE subject pages, their two index pages, the sitemap and the
// "Browse every job and subject" block on the main page, from the data inside index.html.
//
//   node _build/build-pages.mjs            (run from the sustainable-skills folder)
//
// Nothing here adds facts: every pay figure, route, topic and quotation is copied from the lists
// in index.html (JOBS, SUBJECTS, TOPICS, WORDS, PARTS). Run it again after changing those lists.
// It needs Node 18 or later and nothing else. GitHub Pages does not publish this folder.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://vahidinasab.github.io/sustainable-skills/';
const TOOL = 'Sustainable Local Energy Skills Roadmap';
const TODAY = process.env.BUILD_DATE || new Date().toISOString().slice(0, 10);
// Where a visit to the roadmap came from is counted through ?src= (see track() in index.html).
const START_FROM_JOB = '../?src=job-page#answers';
const START_FROM_SUBJECT = '../?src=subject-page#answers';

// ---------- Read the data from index.html ----------
const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const from = index.indexOf('  var CONFIG = {');
const to = index.indexOf('  var SUBJ = {};');
if (from < 0 || to < from) throw new Error('Could not find the data lists in index.html');
const sandbox = { window: { localStorage: { getItem: () => null } }, location: { search: '' } };
vm.createContext(sandbox);
vm.runInContext(index.slice(from, to) + '\nthis.DATA = { JOBS: JOBS, SUBJECTS: SUBJECTS, TOPICS: TOPICS, INTERESTS: INTERESTS, ROLES: ROLES, WORDS: WORDS, PARTS: PARTS, SEPARATE_SRC: SEPARATE_SRC };', sandbox);
const { JOBS, SUBJECTS, TOPICS, INTERESTS, ROLES, WORDS, PARTS, SEPARATE_SRC } = sandbox.DATA;
const checked = (index.match(/Information checked (\w+ \d{4})/) || [])[1];
if (!checked) throw new Error('Could not find "Information checked ..." in index.html');
const ICON = (index.match(/<link rel="icon" href="[^"]+">/) || [''])[0];

// ---------- Helpers ----------
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => '£' + n.toLocaleString('en-GB');
// The same rule as slug() in index.html, so links from the main page match these file names.
const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const aOrAn = (name) => (/^[aeiou]/i.test(name) ? 'an ' : 'a ') + name.charAt(0).toLowerCase() + name.slice(1);
const lower = (name) => name.charAt(0).toLowerCase() + name.slice(1);
const SUBJ = Object.fromEntries(SUBJECTS.map((s) => [s.id, s]));
const JOB = Object.fromEntries(JOBS.map((j) => [j.id, j]));
const INT = Object.fromEntries(INTERESTS.map((i) => [i.id, i]));
const jobFile = (j) => slug(j.name) + '.html';
const subjFile = (s) => slug(s.name) + '.html';
const payText = (j) => money(j.pay[0]) + ' to ' + money(j.pay[1]);
const topicsOfJob = (j) => TOPICS.filter((t) => t.jobs.includes(j.id));
const topicsOfSubject = (s) => TOPICS.filter((t) => t.s === s.id);
const jobsOfSubject = (s) => JOBS.filter((j) => topicsOfSubject(s).some((t) => t.jobs.includes(j.id)));
const badge = (t) => (t.triple ? ' <span class="badge">Separate ' + esc(t.triple) + ' only</span>' : '');
const roleTags = (j) => (j.roles || []).map((r) => '<li class="tag tag-role">' + esc(ROLES[r]) + '</li>').join('');
const ld = (obj) => '<script type="application/ld+json">\n' + JSON.stringify(obj, null, 1).replace(/</g, '\\u003c') + '\n</script>';
const crumbsLd = (url, items) => ({
  '@type': 'BreadcrumbList', '@id': url + '#breadcrumb',
  itemListElement: items.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item }))
});
const AUDIENCE = [
  { '@type': 'EducationalAudience', educationalRole: 'student' },
  { '@type': 'EducationalAudience', educationalRole: 'parent' },
  { '@type': 'EducationalAudience', educationalRole: 'teacher' }
];

function page({ file, title, desc, image, imageAlt, jsonld, body, share }) {
  const url = BASE + file.replace(/index\.html$/, '');
  return `<!doctype html>
<!-- ${TOOL}. © 2026 Vahid Vahidinasab. Written by _build/build-pages.mjs from the data in index.html: change the data there, not this file. -->
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="${TOOL}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${BASE + image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(imageAlt)}">
<meta property="og:locale" content="en_GB">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#011B26" media="(prefers-color-scheme: dark)">
${ICON}
<link rel="stylesheet" href="../assets/pages.css">
${ld(jsonld)}
</head>
<body>
<a class="skip" href="#main">Skip to the content</a>
<header class="bar">
  <div class="wrap bar-in">
    <a class="uos" href="https://www.salford.ac.uk/" target="_blank" rel="noopener" aria-label="University of Salford (opens in a new tab)"><img class="logo-light" src="../assets/uos-logo.png" width="221" height="108" alt=""><img class="logo-dark" src="../assets/uos-logo-white.png" width="222" height="108" alt=""></a>
    <span class="rule" aria-hidden="true"></span>
    <a class="brand" href="../">${TOOL}</a>
    <a class="btn" href="../">Open the roadmap</a>
  </div>
</header>

<main id="main" class="wrap page">
${body}
</main>

<footer class="foot">
  <div class="wrap foot-in">
    <nav aria-label="About this tool"><a href="../">The roadmap</a><a href="../jobs/">Jobs</a><a href="../subjects/">GCSE subjects</a><a href="../teachers.html">For teachers</a><a href="../privacy.html">Privacy</a><a href="../accessibility.html">Accessibility</a></nav>
    <p>© 2026 <a href="https://www.salford.ac.uk/our-staff/vahid-vahidinasab" target="_blank" rel="noopener">Professor Vahid Vahidinasab</a>, University of Salford. Free to print and share for non-commercial education.</p>
  </div>
</footer>
${share ? SHARE_SCRIPT : ''}</body>
</html>
`;
}

// A Share button: the phone's share sheet where there is one, otherwise the link is copied. No data leaves the page.
const SHARE_BUTTON = '<p class="share-row" id="share-row" hidden><button type="button" class="btn btn-ghost" id="share-btn">Share this page</button> <span class="small" id="share-status" role="status"></span></p>';
const SHARE_SCRIPT = `<script>
(function () {
  var row = document.getElementById('share-row'), btn = document.getElementById('share-btn'), out = document.getElementById('share-status');
  if (!row || !btn) return;
  var link = document.querySelector('link[rel="canonical"]').href;
  function copy() {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(function () { out.textContent = 'Link copied.'; }, function () { out.textContent = link; });
    else out.textContent = link;
  }
  if (!navigator.share) btn.textContent = 'Copy the link to this page';
  btn.addEventListener('click', function () {
    if (navigator.share) navigator.share({ title: document.title, url: link }).catch(function (e) { if (!e || e.name !== 'AbortError') copy(); });
    else copy();
  });
  row.hidden = false;
})();
</script>
`;

const guide = (extra) => `<p class="note"><strong>Use this to explore, then talk to your careers adviser before you choose.</strong> ${extra} Information checked ${esc(checked)}.</p>`;
const cta = (h, p, href) => `  <section class="cta" aria-labelledby="cta-h">
    <h2 id="cta-h">${h}</h2>
    <p>${p}</p>
    <p><a class="btn" href="${href}">Build my roadmap</a></p>
  </section>`;

// ---------- Job pages ----------
function jobPage(j) {
  const file = 'jobs/' + jobFile(j), url = BASE + file;
  const title = `${j.name}: pay, GCSEs and ways in`;
  const desc = `What ${aOrAn(j.name)} does, typical pay (${payText(j)} a year), the GCSE topics the job uses and the ways in. For pupils in Years 7 to 11 and their families.`;
  const hasImg = fs.existsSync(path.join(ROOT, 'jobs', 'img', slug(j.name) + '.jpg'));
  const image = hasImg ? 'jobs/img/' + slug(j.name) + '.jpg' : 'og-image.png';
  const topics = topicsOfJob(j);
  const bySubject = SUBJECTS.map((s) => [s, topics.filter((t) => t.s === s.id)]).filter(([, list]) => list.length);
  const words = WORDS.filter((w) => w.m.test(j.routes.map((r) => r.k + ': ' + r.v).join(' | ')));
  // Around the home: the parts this job works on, grouped by what the job does there.
  const home = [];
  PARTS.forEach((p) => p.who.forEach(([label, ids]) => {
    if (!ids.includes(j.id)) return;
    let g = home.find((x) => x.label === label);
    if (!g) home.push(g = { label, parts: [] });
    g.parts.push(p.name);
  }));
  const others = JOBS.filter((x) => x.id !== j.id);
  const body = `  <nav class="crumbs" aria-label="Breadcrumb"><a href="../">Roadmap</a> <span aria-hidden="true">/</span> <a href="./">Clean energy jobs</a> <span aria-hidden="true">/</span> <span aria-current="page">${esc(j.name)}</span></nav>
  <p class="eyebrow">Clean energy job</p>
  <h1>${esc(j.name)}</h1>
  <p class="lead">${esc(j.what)}</p>
  <ul class="tags" aria-label="What this job does">${roleTags(j)}</ul>

  <section class="card" aria-labelledby="pay-h">
    <h2 id="pay-h">Pay</h2>
    <p class="pay"><strong>${payText(j)}</strong> a year</p>
    <p class="muted small">From starting pay to experienced. This is the typical yearly pay on the job's official profile.${j.alt ? ' ' + esc(j.alt) + '.' : ''}</p>
  </section>
${j.day ? `
  <h2>A day might include</h2>
  <p>${esc(j.day.charAt(0).toUpperCase() + j.day.slice(1))}</p>
` : ''}${j.skills ? `
  <h2>Skills you use</h2>
  <ul class="tags">${j.skills.map((s) => '<li class="tag tag-skill">' + esc(s) + '</li>').join('')}</ul>
` : ''}
  <h2>It could suit you if you enjoy</h2>
  <ul class="tags">${j.interests.map((id) => '<li class="tag">' + esc(INT[id].label) + '</li>').join('')}</ul>

  <h2>GCSE topics it uses</h2>
  <p class="muted small">From the Department for Education's subject content for each GCSE in England. Exam boards add detail, so your course may cover more.</p>
${bySubject.map(([s, list]) => `  <h3><a href="../subjects/${subjFile(s)}">${esc(s.name)}</a></h3>
  <ul class="kv">
${list.map((t) => `    <li><b>${esc(t.t)}</b>${badge(t)}<br>${esc(t.use)}</li>`).join('\n')}
  </ul>`).join('\n')}

  <h2>Ways in</h2>
  <ul class="kv">
${j.routes.map((r) => `    <li><b>${esc(r.k)}:</b> ${esc(r.v)}</li>`).join('\n')}
  </ul>
${words.length ? `  <h3>What these words mean</h3>
  <dl class="words">
${words.map((w) => `    <div><dt>${esc(w.t)}</dt><dd>${esc(w.d)}</dd></div>`).join('\n')}
  </dl>
` : ''}${home.length ? `
  <h2>Around the home</h2>
  <ul class="kv">
${home.map((g) => `    <li><b>${esc(g.label)}:</b> ${esc(g.parts.join(', '))}</li>`).join('\n')}
  </ul>
` : ''}
  <h2>Find out more</h2>
  <p><a href="${j.url}" target="_blank" rel="noopener">Full job profile on the official careers website for England</a> (opens in a new tab)</p>
  ${guide('Courses, grades and pay can change.')}
  ${SHARE_BUTTON}

${cta('See how this job fits you', 'Answer four quick questions to get your own roadmap: the jobs that fit you, your key dates and what to do next.', START_FROM_JOB)}

  <h2>More clean energy jobs</h2>
  <ul class="cols">
${others.map((x) => `    <li><a href="${jobFile(x)}">${esc(x.name)}</a></li>`).join('\n')}
  </ul>`;
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage', '@id': url, url, name: title, description: desc, inLanguage: 'en-GB',
        isPartOf: { '@id': BASE + '#tool' }, primaryImageOfPage: BASE + image, isBasedOn: j.url,
        audience: AUDIENCE, breadcrumb: { '@id': url + '#breadcrumb' }, mainEntity: { '@id': url + '#job' }
      },
      crumbsLd(url, [[TOOL, BASE], ['Clean energy jobs', BASE + 'jobs/'], [j.name, url]]),
      {
        '@type': 'Occupation', '@id': url + '#job', name: j.name, description: j.what,
        estimatedSalary: { '@type': 'MonetaryAmount', currency: 'GBP', value: { '@type': 'QuantitativeValue', minValue: j.pay[0], maxValue: j.pay[1], unitText: 'YEAR' } },
        occupationLocation: { '@type': 'Country', name: 'England' },
        ...(j.skills ? { skills: j.skills.join(', ') } : {}),
        qualifications: j.routes.map((r) => r.k + ': ' + r.v).join('; '),
        mainEntityOfPage: { '@id': url }
      }
    ]
  };
  return { file, html: page({ file, title, desc, image, imageAlt: `${j.name}: ${payText(j)} a year. ${TOOL}`, jsonld, body, share: true }) };
}

// ---------- Subject pages ----------
function subjectPage(s) {
  const file = 'subjects/' + subjFile(s), url = BASE + file;
  const topics = topicsOfSubject(s), jobs = jobsOfSubject(s);
  const title = `${s.name} GCSE: topics that lead to clean energy jobs`;
  const desc = `The ${topics.length} ${lower(s.name)} GCSE topics that clean energy jobs use, what the course says about each one, and the jobs that use them. For pupils in Years 7 to 11 in England.`;
  const home = [];
  PARTS.forEach((p) => p.links.forEach(([sid, text]) => { if (sid === s.id) home.push([p.name, text]); }));
  const sources = [[s.srcLabel, s.src]].concat(s.id === 'science' ? [[SEPARATE_SRC.label, SEPARATE_SRC.url]] : []);
  const notEverywhere = s.id === 'electronics' || s.id === 'engineering';
  const body = `  <nav class="crumbs" aria-label="Breadcrumb"><a href="../">Roadmap</a> <span aria-hidden="true">/</span> <a href="./">GCSE subjects</a> <span aria-hidden="true">/</span> <span aria-current="page">${esc(s.name)}</span></nav>
  <p class="eyebrow">GCSE subject</p>
  <h1>${esc(s.name)} GCSE and clean energy jobs</h1>
  <p class="lead">${topics.length} GCSE topics to look out for, and the ${jobs.length} clean energy jobs that use them.</p>
  <p class="muted small">From the Department for Education's subject content for each GCSE in England. Exam boards add detail, so your course may cover more.${s.core ? ' Everyone takes English, maths and science.' : ''}${notEverywhere ? ' Electronics and Engineering are not offered at every school.' : ''}</p>

  <h2>GCSE topics to look out for</h2>
  <ul class="topic-list">
${topics.map((t) => `    <li>
      <h3>${esc(t.t)}${badge(t)}</h3>
      <p>${esc(t.use)}</p>
      <p class="quote"><span class="ql">What the course says (official wording)</span>${t.q.map((q) => '<span class="q">“' + esc(q) + '”</span>').join('')}</p>
${t.note ? `      <p class="muted small">${esc(t.note)}</p>\n` : ''}      <p class="used"><span class="ql">Used by</span> ${t.jobs.filter((id) => JOB[id]).map((id) => `<a class="tag" href="../jobs/${jobFile(JOB[id])}">${esc(JOB[id].name)}</a>`).join(' ')}</p>
    </li>`).join('\n')}
  </ul>
  <p class="muted small">Source: ${sources.map(([label, href]) => `<a href="${href}" target="_blank" rel="noopener">${esc(label)}</a>`).join(' and ')} (Department for Education)</p>
${home.length ? `
  <h2>Around the home</h2>
  <ul class="kv">
${home.map(([part, text]) => `    <li><b>${esc(part)}:</b> ${esc(text)}</li>`).join('\n')}
  </ul>
` : ''}
  <h2>Jobs that use ${esc(lower(s.name))}</h2>
  <ul class="cols">
${jobs.map((j) => `    <li><a href="../jobs/${jobFile(j)}">${esc(j.name)}</a> <span class="muted small">${payText(j)}</span></li>`).join('\n')}
  </ul>
  <p class="muted small">Pay is for a year, from starting pay to experienced.</p>
  ${guide('Schools offer different subjects and exam boards, so check your choices with your school.')}
  ${SHARE_BUTTON}

${cta('See where your subjects could take you', 'Answer four quick questions to get your own roadmap: the jobs that fit you, your key dates and what to do next.', START_FROM_SUBJECT)}

  <h2>More GCSE subjects</h2>
  <ul class="cols">
${SUBJECTS.filter((x) => x.id !== s.id).map((x) => `    <li><a href="${subjFile(x)}">${esc(x.name)}</a></li>`).join('\n')}
  </ul>`;
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['WebPage', 'LearningResource'], '@id': url, url, name: title, description: desc, inLanguage: 'en-GB',
        isAccessibleForFree: true, isPartOf: { '@id': BASE + '#tool' }, educationalLevel: 'GCSE',
        about: { '@type': 'Thing', name: s.name + ' GCSE' }, teaches: topics.map((t) => t.t),
        isBasedOn: sources.map(([, href]) => href), audience: AUDIENCE, breadcrumb: { '@id': url + '#breadcrumb' }
      },
      crumbsLd(url, [[TOOL, BASE], ['GCSE subjects', BASE + 'subjects/'], [s.name, url]])
    ]
  };
  return { file, html: page({ file, title, desc, image: 'og-image.png', imageAlt: `${TOOL}: an illustration of a family home with solar panels, a heat pump and an electric car on charge`, jsonld, body, share: true }) };
}

// ---------- The two index pages ----------
function listLd(url, title, desc, crumbName, items) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'CollectionPage', '@id': url, url, name: title, description: desc, inLanguage: 'en-GB', isPartOf: { '@id': BASE + '#tool' }, breadcrumb: { '@id': url + '#breadcrumb' }, mainEntity: { '@id': url + '#list' } },
      crumbsLd(url, [[TOOL, BASE], [crumbName, url]]),
      { '@type': 'ItemList', '@id': url + '#list', numberOfItems: items.length, itemListElement: items.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, url: item })) }
    ]
  };
}
function jobsIndex() {
  const file = 'jobs/index.html', url = BASE + 'jobs/';
  const title = `${JOBS.length} clean energy jobs: pay, GCSEs and ways in`;
  const desc = `${JOBS.length} jobs that install, run and repair clean, local energy. See what each one pays, the GCSE topics it uses and the ways in. For pupils in Years 7 to 11 and their families.`;
  const body = `  <nav class="crumbs" aria-label="Breadcrumb"><a href="../">Roadmap</a> <span aria-hidden="true">/</span> <span aria-current="page">Clean energy jobs</span></nav>
  <p class="eyebrow">For pupils in Years 7 to 11 and their families</p>
  <h1>Clean energy jobs</h1>
  <p class="lead">${JOBS.length} jobs that install, run and repair clean, local energy. Pick one to see its pay, the GCSE topics it uses and the ways in.</p>
  <ul class="tiles">
${JOBS.map((j) => `    <li class="card">
      <h2><a href="${jobFile(j)}">${esc(j.name)}</a></h2>
      <ul class="tags">${roleTags(j)}</ul>
      <p class="pay-s"><strong>${payText(j)}</strong> a year</p>
      <p>${esc(j.what)}</p>
    </li>`).join('\n')}
  </ul>
  <p class="muted small">Pay is for a year, from starting pay to experienced. It is the typical yearly pay on each job's official profile.</p>
  ${guide('Courses, grades and pay can change.')}

${cta('Which jobs fit you?', 'Answer four quick questions to get your own roadmap: the jobs that fit you, your key dates and what to do next.', START_FROM_JOB)}`;
  return { file, html: page({ file, title, desc, image: 'og-image.png', imageAlt: `${TOOL}: an illustration of a family home with solar panels, a heat pump and an electric car on charge`, jsonld: listLd(url, title, desc, 'Clean energy jobs', JOBS.map((j) => [j.name, BASE + 'jobs/' + jobFile(j)])), body }) };
}
function subjectsIndex() {
  const file = 'subjects/index.html', url = BASE + 'subjects/';
  const title = 'GCSE subjects and the clean energy jobs they lead to';
  const desc = `${SUBJECTS.length} GCSE subjects and the topics in each one that clean energy jobs use, from science and maths to design and technology. For pupils in Years 7 to 11 in England.`;
  const body = `  <nav class="crumbs" aria-label="Breadcrumb"><a href="../">Roadmap</a> <span aria-hidden="true">/</span> <span aria-current="page">GCSE subjects</span></nav>
  <p class="eyebrow">For pupils in Years 7 to 11 and their families</p>
  <h1>GCSE subjects and clean energy jobs</h1>
  <p class="lead">Pick a subject to see the GCSE topics to look out for, and the clean energy jobs that use them.</p>
  <ul class="tiles">
${SUBJECTS.map((s) => `    <li class="card">
      <h2><a href="${subjFile(s)}">${esc(s.name)}</a></h2>
      <p>${topicsOfSubject(s).length} topics, used by ${jobsOfSubject(s).length} jobs</p>
    </li>`).join('\n')}
  </ul>
  <p class="muted small">From the Department for Education's subject content for each GCSE in England. Exam boards add detail, so your course may cover more. Electronics and Engineering are not offered at every school.</p>

${cta('See where your subjects could take you', 'Answer four quick questions to get your own roadmap: the jobs that fit you, your key dates and what to do next.', START_FROM_SUBJECT)}`;
  return { file, html: page({ file, title, desc, image: 'og-image.png', imageAlt: `${TOOL}: an illustration of a family home with solar panels, a heat pump and an electric car on charge`, jsonld: listLd(url, title, desc, 'GCSE subjects', SUBJECTS.map((s) => [s.name + ' GCSE', BASE + 'subjects/' + subjFile(s)])), body }) };
}

// ---------- Write everything ----------
const pages = [jobsIndex(), ...JOBS.map(jobPage), subjectsIndex(), ...SUBJECTS.map(subjectPage)];
const names = pages.map((p) => p.file);
if (new Set(names).size !== names.length) throw new Error('Two pages would have the same file name');
for (const dir of ['jobs', 'subjects']) {
  fs.mkdirSync(path.join(ROOT, dir), { recursive: true });
  for (const f of fs.readdirSync(path.join(ROOT, dir))) if (f.endsWith('.html') && !names.includes(dir + '/' + f)) fs.unlinkSync(path.join(ROOT, dir, f));
}
for (const p of pages) {
  if (p.html.includes(String.fromCharCode(8212))) throw new Error('Long dash in ' + p.file);   // house style: none anywhere
  fs.writeFileSync(path.join(ROOT, p.file), p.html);
}

// The sitemap keeps each page's date unless the page changed.
const STATIC = ['', 'teachers.html', 'slides.html', 'worksheet.html', 'poster.html', 'privacy.html', 'accessibility.html'];
const sitemapPath = path.join(ROOT, 'sitemap.xml');
const oldMap = fs.existsSync(sitemapPath) ? fs.readFileSync(sitemapPath, 'utf8') : '';
const oldDates = Object.fromEntries([...oldMap.matchAll(/<loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g)].map((m) => [m[1], m[2]]));
const locs = STATIC.concat(names.map((n) => n.replace(/index\.html$/, ''))).map((u) => BASE + u);
fs.writeFileSync(sitemapPath, '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  locs.map((u) => `  <url><loc>${u}</loc><lastmod>${process.env.BUILD_DATE || oldDates[u] || TODAY}</lastmod></url>\n`).join('') + '</urlset>\n');

// The list of links on the main page, between its two markers.
const browse = `<!-- browse:start (written by _build/build-pages.mjs) -->
<section class="browse" aria-labelledby="browse-h">
  <div class="wrap browse-in">
    <h2 id="browse-h">Browse every job and subject</h2>
    <div class="browse-grid">
      <details class="more">
        <summary>All ${JOBS.length} clean energy jobs</summary>
        <ul class="browse-list">
${JOBS.map((j) => `          <li><a href="jobs/${jobFile(j)}">${esc(j.name)}</a></li>`).join('\n')}
        </ul>
        <p class="browse-all"><a href="jobs/">Compare all the jobs</a></p>
      </details>
      <details class="more">
        <summary>All ${SUBJECTS.length} GCSE subjects</summary>
        <ul class="browse-list">
${SUBJECTS.map((s) => `          <li><a href="subjects/${subjFile(s)}">${esc(s.name)}</a></li>`).join('\n')}
        </ul>
        <p class="browse-all"><a href="subjects/">See all the subjects</a></p>
      </details>
    </div>
  </div>
</section>
<!-- browse:end -->`;
const a = index.indexOf('<!-- browse:start'), b = index.indexOf('<!-- browse:end -->');
if (a < 0 || b < a) throw new Error('index.html has no browse:start and browse:end markers');
const next = index.slice(0, a) + browse + index.slice(b + '<!-- browse:end -->'.length);
if (next !== index) fs.writeFileSync(path.join(ROOT, 'index.html'), next);

console.log(`Wrote ${JOBS.length} job pages, ${SUBJECTS.length} subject pages, 2 index pages, sitemap.xml (${locs.length} addresses) and the browse list in index.html.`);
