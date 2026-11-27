// Writes the job pages, the GCSE subject pages, their two index pages, the sitemap, and the
// "join the dots" picture and "Browse" lists on the welcome screen, from the data files in data/.
//
//   node _build/build-pages.mjs            (run from the sustainable-skills folder)
//
// Nothing here adds facts: every pay figure, route, topic and quotation is copied from the data
// files (data/jobs.js, data/subjects.js, data/home.js, data/guide.js). Run it again after changing them.
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
const START_FROM_JOB = '../?src=job-page#/q';
const START_FROM_SUBJECT = '../?src=subject-page#/q';

// ---------- Read the data files ----------
const sandbox = { window: {} };
sandbox.window.SLES = undefined;
vm.createContext(sandbox);
for (const f of ['guide.js', 'subjects.js', 'jobs.js', 'home.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'), sandbox, { filename: f });
const DATA = sandbox.window.SLES.data;
const { jobs: JOBS, subjects: SUBJECTS, topics: TOPICS, interests: INTERESTS, roles: ROLES, words: WORDS, parts: PARTS, separateSrc: SEPARATE_SRC, checked } = DATA;
if (!JOBS || !SUBJECTS || !TOPICS || !checked) throw new Error('Could not read the data files in data/');
const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
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
<!-- ${TOOL}. © 2026 Vahid Vahidinasab. Written by _build/build-pages.mjs from the data files: change the data there, not this file. -->
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
<meta name="theme-color" content="#032A3B" media="(prefers-color-scheme: dark)">
<script>try{var t=localStorage.getItem('gcse-clean-energy-roadmap-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}</script>
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

// The lists of links on the welcome screen, between its two markers.
const browse = `<!-- browse:start (written by _build/build-pages.mjs) -->
          <details class="browse">
            <summary>All ${JOBS.length} clean energy jobs</summary>
            <ul>
${JOBS.map((j) => `              <li><a href="jobs/${jobFile(j)}">${esc(j.name)}</a></li>`).join('\n')}
              <li><a href="jobs/">Compare all the jobs</a></li>
            </ul>
          </details>
          <details class="browse">
            <summary>All ${SUBJECTS.length} GCSE subjects</summary>
            <ul>
${SUBJECTS.map((s) => `              <li><a href="subjects/${subjFile(s)}">${esc(s.name)}</a></li>`).join('\n')}
              <li><a href="subjects/">See all the subjects</a></li>
            </ul>
          </details>
<!-- browse:end -->`;
const a = index.indexOf('<!-- browse:start'), b = index.indexOf('<!-- browse:end -->');
if (a < 0 || b < a) throw new Error('index.html has no browse:start and browse:end markers');
let next = index.slice(0, a) + browse + index.slice(b + '<!-- browse:end -->'.length);

// The "join the dots" picture at the top of the welcome screen, between its two markers. It is the example
// roadmap drawn as lines: the example pupil's subjects, their four jobs, and a line wherever a job uses at least
// one topic from a subject. The app's own matching code (js/core.js) works it out, so it always agrees with the app.
const appBox = { window: { location: { hash: '', search: '', pathname: '/', hostname: '', href: '' }, navigator: {} } };
appBox.location = appBox.window.location; appBox.navigator = appBox.window.navigator;
vm.createContext(appBox);
for (const f of ['data/guide.js', 'data/subjects.js', 'data/jobs.js', 'data/home.js', 'js/core.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), appBox, { filename: f });
const CORE = appBox.window.SLES.core;
if (CORE.get().view !== 'example') throw new Error('Could not work out the example roadmap for the welcome picture');
const heroSubs = CORE.chosenSubjects(), heroJobs = CORE.get().top.map((r) => r.job), heroEdges = CORE.edges();
const H = 1200, yOf = (i, n) => ((i + 0.5) / n) * H, hotJob = heroJobs[0].id;
const line = (e) => { const y1 = yOf(heroSubs.indexOf(e.s), heroSubs.length).toFixed(0), y2 = yOf(heroJobs.findIndex((j) => j.id === e.j), heroJobs.length).toFixed(0); return `<path${e.j === hotJob ? ' class="hot"' : ''} d="M0 ${y1} C50 ${y1} 50 ${y2} 100 ${y2}"/>`; };
const hotSubs = heroEdges.filter((e) => e.j === hotJob).map((e) => e.s);
const list = (a) => a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0];
const hero = `<!-- hero:start (written by _build/build-pages.mjs from the example roadmap) -->
        <div class="hero-map" role="img" aria-label="An example of joining the dots. Lines join the GCSE subjects ${esc(list(heroSubs.map((s) => CORE.subjLabel(s))))} to the jobs ${esc(list(heroJobs.map((j) => j.name)))}.">
          <p class="hm-head"><span>GCSE subjects</span><span>Clean energy jobs</span></p>
          <div class="hm-grid">
            <ul class="hm-col hm-left">${heroSubs.map((s) => `<li${hotSubs.includes(s) ? ' class="is-on"' : ''}><span>${esc(CORE.subjLabel(s))}</span></li>`).join('')}</ul>
            <span class="hm-mid"><svg class="hm-lines" viewBox="0 0 100 ${H}" preserveAspectRatio="none" focusable="false">${heroEdges.filter((e) => e.j !== hotJob).map(line).join('')}${heroEdges.filter((e) => e.j === hotJob).map(line).join('')}</svg></span>
            <ul class="hm-col hm-right">${heroJobs.map((j) => `<li${j.id === hotJob ? ' class="is-on"' : ''}><span>${esc(j.name)}</span></li>`).join('')}</ul>
          </div>
        </div>
<!-- hero:end -->`;
const ha = next.indexOf('<!-- hero:start'), hb = next.indexOf('<!-- hero:end -->');
if (ha < 0 || hb < ha) throw new Error('index.html has no hero:start and hero:end markers');
next = next.slice(0, ha) + hero + next.slice(hb + '<!-- hero:end -->'.length);
if (next !== index) fs.writeFileSync(path.join(ROOT, 'index.html'), next);

// ---------- The QR code picture (assets/qr.svg) ----------
// Drawn from D.qr in data/guide.js in the brand colours, with the app's logo (assets/logo.svg) at its centre.
// The code is error-correction level H, so the logo can cover the middle and it still scans.
{
  const NAVY = '#032A3B', RED = '#D71A20', rows = DATA.qr.split(','), n = rows.length, quiet = 4, size = n + 2 * quiet;
  const bits = rows.map((h) => BigInt('0x' + h).toString(2).padStart(n, '0'));
  const hole = 11, h0 = (n - hole) / 2;                      // modules cleared in the middle for the logo
  const inEye = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  const inHole = (r, c) => r >= h0 && r < h0 + hole && c >= h0 && c < h0 + hole;
  let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (bits[r][c] !== '1' || inEye(r, c) || inHole(r, c)) continue;
    let e = c; while (e < n && bits[r][e] === '1' && !inEye(r, e) && !inHole(r, e)) e++;
    d += `M${c + quiet} ${r + quiet}h${e - c}v1h-${e - c}z`; c = e - 1;
  }
  const eye = (r, c) => `<rect x="${c + quiet}" y="${r + quiet}" width="7" height="7" rx="2" fill="${NAVY}"/><rect x="${c + quiet + 1}" y="${r + quiet + 1}" width="5" height="5" rx="1.2" fill="#FFFFFF"/><rect x="${c + quiet + 2}" y="${r + quiet + 2}" width="3" height="3" rx=".9" fill="${RED}"/>`;
  const logo = fs.readFileSync(path.join(ROOT, 'assets', 'logo.svg'), 'utf8').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" rx="3" fill="#FFFFFF"/><path d="${d}" fill="${NAVY}"/>${eye(0, 0)}${eye(0, n - 7)}${eye(n - 7, 0)}` +
    `<rect x="${h0 + quiet}" y="${h0 + quiet}" width="${hole}" height="${hole}" rx="2.4" fill="#FFFFFF"/><svg x="${h0 + quiet + 1}" y="${h0 + quiet + 1}" width="${hole - 2}" height="${hole - 2}" viewBox="0 0 64 64">${logo}</svg></svg>\n`;
  fs.writeFileSync(path.join(ROOT, 'assets', 'qr.svg'), svg);
}

console.log(`Wrote ${JOBS.length} job pages, ${SUBJECTS.length} subject pages, 2 index pages, sitemap.xml (${locs.length} addresses) the QR code picture, and the welcome picture and browse lists in index.html.`);
