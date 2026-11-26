/* The parts of the tool that do not touch the page: saved answers, job matching, key dates, the words for
   email and copy, share links and the anonymous counter. This code is carried over unchanged from the
   version it replaces, so a roadmap comes out the same. The screens are in app.js; the PDF is in pdf.js. */
(function (S) {
  'use strict';
  var D = S.data;
  var CONFIG = D.config, QR_HEX = D.qr, INTERESTS = D.interests, SUBJECTS = D.subjects, SEPARATE_SRC = D.separateSrc, TOPICS = D.topics,
    JOBS = D.jobs, ROLES = D.roles, WORDS = D.words, PARTS = D.parts, NEAR = D.near, NEAR_NAMES = D.nearNames, ADVICE = D.advice,
    STYLES = D.styles, STYLE_BONUS = D.styleBonus, STYLE_PHRASE = D.stylePhrase, NEXT = D.next, SOURCES = D.sources, STORIES = D.stories || [];
  var EXAMPLE_WHO = D.exampleWho;
  var AREA_KEY = 'gcse-clean-energy-roadmap-area';
  var area = (function () { try { var a = window.localStorage.getItem(AREA_KEY); return NEAR[a] ? a : ''; } catch (e) { return ''; } })();


  function routeText(j) { return j.routes.map(function (r) { return r.k + ': ' + r.v; }).join(' | '); }
  function wordsIn(text) { return WORDS.filter(function (w) { return w.m.test(text); }); }
  function wordsHtml(list) { return list.map(function (w) { return '<div><dt>' + esc(w.t) + '</dt><dd>' + esc(w.d) + '</dd></div>'; }).join(''); }
  function wordsBox(list) { return list.length ? '<details class="words"><summary>What do these words mean?</summary><dl>' + wordsHtml(list) + '</dl></details>' : ''; }
  // The words used in the current roadmap: its four jobs' routes and its timeline.
  function roadmapWords() {
    var text = currentTop.map(function (r) { return routeText(r.job); }).join(' | ') + ' | ' + timelineItems().map(function (it) { return it.title + ' ' + it.detail; }).join(' ');
    return wordsIn(text);
  }

  var SUBJ = {}; SUBJECTS.forEach(function (s) { SUBJ[s.id] = s; });
  var JOB = {}; JOBS.forEach(function (j) { JOB[j.id] = j; });
  var INT = {}; INTERESTS.forEach(function (i) { INT[i.id] = i; });
  var PART = {}; PARTS.forEach(function (p) { PART[p.id] = p; });

  var MAX_INTERESTS = 3;
  var KEY = 'gcse-clean-energy-roadmap-v1';
  var PDFLIB_URL = 'vendor/pdf-lib-1.17.1.min.js';   // pdf-lib 1.17.1 (MIT licence), served from this site
  var PROFILE_URL = 'https://www.salford.ac.uk/our-staff/vahid-vahidinasab';
  // Adding ?sample-stories to the address shows how a story looks, with a clear sample label. It never shows otherwise.
  var SAMPLE_STORIES = /[?&]sample-stories\b/.test(location.search) ? [
    { job: 'heatpump', quote: 'I liked science but wanted to work with my hands. Now I fit heat pumps and spend one day a week at college.', name: 'Sample name', detail: 'Apprentice heat pump engineer, age 19' },
    { job: 'solar', quote: 'Every roof is different, so no two days are the same. I like seeing a family\u2019s first sunny-day reading.', name: 'Sample name', detail: 'Solar panel installer, age 23' },
    { job: 'electronics', quote: 'I design the circuit boards inside car chargers. Maths and physics at school were the start.', name: 'Sample name', detail: 'Electronics engineer, age 27' }
  ] : [];
  function storyHtml(jobId) {
    var s = STORIES.filter(function (x) { return x.job === jobId; })[0], sample = false;
    if (!s) { s = SAMPLE_STORIES.filter(function (x) { return x.job === jobId; })[0]; sample = !!s; }
    if (!s) return '';
    return '<figure class="story">' + (sample ? '<span class="story-sample">Sample layout, not a real person</span>' : '') + '<blockquote>\u201C' + esc(s.quote) + '\u201D</blockquote><figcaption>' + esc(s.name) + ', ' + esc(s.detail) + '</figcaption></figure>';
  }


  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return '£' + n.toLocaleString('en-GB'); }
  // File names of the job and subject pages; the same rule as slug() in _build/build-pages.mjs.
  function slug(name) { return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function joinList(arr) { if (arr.length <= 1) return arr.join(''); return arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1]; }
  function lower(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
  function reducedMotion() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function shortUrl(u) { return String(u).replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''); }
  function paperUrl() { return CONFIG.paperDoi ? 'https://doi.org/' + CONFIG.paperDoi.replace(/^https?:\/\/(dx\.)?doi\.org\//, '') : ''; }

  // ---------- State ----------
  function cleanState(s) {
    var out = { y: null, interests: [], sci: 'combined', subjects: [], style: null, s3: false };
    if (s && typeof s === 'object') {
      if ([7, 8, 9, 10, 11].indexOf(s.y) !== -1) out.y = s.y;
      if (Array.isArray(s.interests)) out.interests = s.interests.filter(function (i) { return !!INT[i]; }).slice(0, MAX_INTERESTS);
      if (s.sci === 'separate') out.sci = 'separate';
      if (Array.isArray(s.subjects)) out.subjects = s.subjects.filter(function (i) { return SUBJ[i] && !SUBJ[i].core; });
      if (STYLE_BONUS[s.style]) out.style = s.style;
      out.s3 = !!s.s3 || out.subjects.length > 0 || out.sci === 'separate';
    }
    return out;
  }
  function hasAnswers(s) { return !!(s.y || s.interests.length || s.subjects.length || s.style || s.sci === 'separate' || s.s3); }
  function answeredCount(s) { return (s.y ? 1 : 0) + (s.interests.length ? 1 : 0) + (s.s3 ? 1 : 0) + (s.style ? 1 : 0); }
  function loadMine() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (raw) {
        var saved = JSON.parse(raw);
        if (saved && saved.touched === false) return cleanState({});
        return cleanState(saved);
      }
    } catch (e) { /* storage unavailable: start blank */ }
    return cleanState({});
  }
  function saveMine() {
    try { window.localStorage.setItem(KEY, JSON.stringify(mine)); } catch (e) { /* not saved, page still works */ }
  }

  // The form always holds the pupil's own answers ("mine"); the roadmap shows the example or theirs, and says which.
  var EXAMPLE = cleanState(D.example);
  var mine = loadMine();
  // A link can reopen a roadmap. The answers travel after the # in the address, which browsers never send to a server.
  function encodeState(s) {
    return [s.y || 0, s.interests.join('-') || 0, s.s3 ? (s.sci === 'separate' ? 's' : 'c') : 'n', s.subjects.join('-') || 0, s.style || 0].join('.');
  }
  function decodeState(code) {
    var p = String(code).split('.');
    if (p.length !== 5) return null;
    var st = cleanState({ y: Number(p[0]), interests: p[1] === '0' ? [] : p[1].split('-'), sci: p[2] === 's' ? 'separate' : 'combined', subjects: p[3] === '0' ? [] : p[3].split('-'), style: p[4], s3: p[2] !== 'n' });
    return hasAnswers(st) && encodeState(st) === code ? st : null;   // anything that is not a real set of answers is ignored
  }
  function sharedFromAddress() {
    var m = /(?:^#|&)r=([a-z0-9.\-]+)/.exec(location.hash);
    var st = m ? decodeState(m[1]) : null;
    return st && encodeState(st) !== encodeState(mine) ? st : null;   // a link to your own roadmap just opens yours
  }
  function roadmapLink(s) { return CONFIG.toolUrl + '?src=share#r=' + encodeState(s); }
  function clearAddress() {
    if (!/(?:^#|&)r=/.test(location.hash)) return;
    try { window.history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* the address stays; nothing else changes */ }
  }
  // The roadmap shows the example, a roadmap someone shared ("shared"), or the pupil's own ("mine"), and says which.
  var shared = sharedFromAddress();
  var view = shared ? 'shared' : hasAnswers(mine) ? 'mine' : 'example';
  var state = view === 'shared' ? shared : view === 'example' ? EXAMPLE : mine;
  var currentTop = [];

  // ---------- Derived data ----------
  function chosenSubjects() {
    return SUBJECTS.filter(function (s) { return s.core || state.subjects.indexOf(s.id) !== -1; }).map(function (s) { return s.id; });
  }
  function activeTopics() {
    var chosen = chosenSubjects();
    return TOPICS.filter(function (t) { return chosen.indexOf(t.s) !== -1 && (!t.triple || state.sci === 'separate'); });
  }
  function subjLabel(id) {
    if (id === 'science') return state.sci === 'separate' ? 'Separate sciences' : 'Combined science';
    return SUBJ[id].name;
  }
  function rankJobs() {
    var topics = activeTopics();
    return JOBS.map(function (j, i) {
      var im = j.interests.filter(function (x) { return state.interests.indexOf(x) !== -1; });
      var links = topics.filter(function (t) { return t.jobs.indexOf(j.id) !== -1; });
      var per = {};
      links.forEach(function (t) { per[t.s] = (per[t.s] || 0) + 1; });
      var sw = 0;
      Object.keys(per).forEach(function (s) { sw += Math.min(per[s], 2) * (SUBJ[s].core ? 0.5 : 1.5); });
      var st = state.style ? STYLE_BONUS[state.style][j.style] : 0;
      return { job: j, im: im, links: links, score: im.length * 3 + sw + st - i * 0.01 };
    }).sort(function (a, b) { return b.score - a.score; });
  }
  // The top jobs, making sure every interest the pupil picked shows up in at least one of them.
  function pickTop(ranked, n) {
    var top = ranked.slice(0, n);
    function fits(r, id) { return r.job.interests.indexOf(id) !== -1; }
    state.interests.forEach(function (id) {
      if (top.some(function (r) { return fits(r, id); })) return;
      var cand = ranked.filter(function (r) { return top.indexOf(r) === -1 && fits(r, id); })[0];
      if (!cand) return;
      // Swap out the lowest-ranked job whose interests the others still cover.
      for (var i = top.length - 1; i >= 0; i--) {
        var others = top.filter(function (r, k) { return k !== i; }).concat([cand]);
        var keepsAll = state.interests.every(function (x) { return !fits(top[i], x) || others.some(function (r) { return fits(r, x); }); });
        if (keepsAll) { top[i] = cand; return; }
      }
    });
    return top.sort(function (a, b) { return b.score - a.score; });
  }
  function jobTopics(r) {
    return r.links.slice().sort(function (a, b) { return (SUBJ[a.s].core ? 1 : 0) - (SUBJ[b.s].core ? 1 : 0); }).slice(0, 4);
  }
  function topicSubject(t) { return t.s === 'science' && t.triple ? 'Separate ' + t.triple : SUBJ[t.s].short; }
  function topicGroups(r) {
    var groups = [];
    jobTopics(r).forEach(function (t) {
      var k = topicSubject(t), g = groups.filter(function (x) { return x.k === k; })[0];
      if (g) g.t.push(t.t); else groups.push({ k: k, t: [t.t] });
    });
    return groups;
  }
  function edges() {
    var topics = activeTopics();
    var out = [];
    chosenSubjects().forEach(function (s) {
      currentTop.forEach(function (r) {
        var n = topics.filter(function (t) { return t.s === s && t.jobs.indexOf(r.job.id) !== -1; }).length;
        if (n) out.push({ s: s, j: r.job.id, n: n });
      });
    });
    return out;
  }
  function timelineItems() {
    var y = state.y;
    if (!y) return [];
    var now = new Date();
    var a = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
    var exam = a + (11 - y) + 1;
    var nowKey = now.getFullYear() + now.getMonth() / 12;
    var items = [];
    var nowText = {
      7: 'A good time to explore. Solar panels, heat pumps, home batteries and chargers are appearing on more homes, and each one needs people to install it and keep it running.',
      8: 'A good time to explore subjects and clubs before you choose your options.',
      9: 'Options year. The subjects you pick now shape what you can study at 16.',
      10: 'You are in the first year of your GCSE courses.',
      11: 'Your GCSE year, and the time to apply for what comes next.'
    };
    items.push({ key: nowKey, cls: 'now', date: 'Now', title: 'Year ' + y, detail: nowText[y] });
    if (y <= 9) {
      var oy = a + (9 - y) + 1;
      items.push({ key: oy + 0.15, date: 'Spring ' + oy, title: 'Choose your GCSE options', detail: 'Most schools do this in Year 9, and a few in Year 8. Ask which subjects can include an energy project.' });
      var ty = a + (10 - y);
      var tNote = 'Your two-year GCSE courses begin.';
      if (ty >= 2029) tNote = 'New technical routes from age 14 are planned from September 2028, and vocational GCSEs in some subjects from as early as September 2029. You could be among the first to take one.';
      else if (ty === 2028) tNote = 'New technical routes from age 14 are planned to start in September 2028, with more links to employers and work experience.';
      items.push({ key: ty + 0.7, date: 'September ' + ty, title: 'Start your GCSE courses', detail: tNote });
    }
    items.push({ key: exam - 1 + 0.8, date: 'Autumn ' + (exam - 1) + ' to spring ' + exam, title: 'Apply for your next step', detail: (y === 11 ? 'This is happening now. ' : '') + 'Apply to colleges, sixth forms and apprenticeships. Most deadlines fall during Year 11.' });
    items.push({ key: exam + 0.45, date: 'May to June ' + exam, title: 'GCSE exams', detail: 'Results day is in August. Aim for at least a grade 4 in English and maths, because most T Levels and advanced apprenticeships ask for it.' });
    items.push({ key: exam + 0.7, date: 'September ' + exam, title: 'Your next step at 16', detail: post16Detail(exam) });
    items.push({ key: exam + 2.6, date: String(exam + 2), title: 'Your next step at 18', detail: 'A job, a higher or degree apprenticeship, a higher technical qualification or a degree. Many sustainable energy jobs start with an apprenticeship.' });
    if (nowKey < 2031) items.push({ key: 2030.5, cls: 'ctx', date: 'By 2030', title: 'Clean energy jobs expected to double', detail: 'The government expects the sector to employ 860,000 people.' });
    items.sort(function (p, q) { return p.key - q.key; });
    return items;
  }
  function post16Detail(exam) {
    var tlevel = null;
    for (var i = 0; i < currentTop.length && !tlevel; i++) {
      currentTop[i].job.routes.forEach(function (r) { if (!tlevel && r.k === 'T Level') tlevel = r.v.split(',')[0].split(' (')[0]; });
    }
    var text;
    if (state.style === 'hands') text = 'An apprenticeship, or a T Level' + (tlevel ? ' such as ' + tlevel : '') + '.';
    else if (state.style === 'class') text = 'A levels, for example maths and a science, or a mix of A levels and V Levels.';
    else text = 'A T Level, V Levels, A levels or an apprenticeship.';
    if (exam >= 2027 && state.style !== 'class') text += ' V Levels are new from September 2027 and can be mixed with A levels.';
    return text + ' You must stay in education or training until you are 18.';
  }

  function summaryText() {
    var parts = [];
    parts.push(state.y ? 'Year ' + state.y : 'Year not chosen yet');
    if (state.interests.length) parts.push('enjoys ' + joinList(state.interests.map(function (i) { return INT[i].short; })));
    parts.push('takes ' + joinList(chosenSubjects().map(function (id) { return id === 'dt' ? 'D&T' : lower(subjLabel(id)); })));
    if (state.style) parts.push(STYLE_PHRASE[state.style]);
    return parts.join(' · ');
  }

  var ADVISORY = 'Use this roadmap to explore, then talk to your school or college careers adviser before you choose. Information checked ' + D.checked + '. Official careers information for England: https://nationalcareers.service.gov.uk/';
  function plain(html) { return String(html).replace(/<[^>]+>/g, ''); }
  function anchorsIn(html) {
    var out = [], re = /<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g, m;
    while ((m = re.exec(html))) out.push([m[2], m[1]]);
    return out;
  }
  function payText(j) { return money(j.pay[0]) + ' to ' + money(j.pay[1]) + ' a year (starting pay to experienced)'; }

  function roadmapText() {
    var lines = ['My local energy skills roadmap', summaryText(), '', 'Made with the Sustainable Local Energy Skills Roadmap: ' + CONFIG.toolUrl, ''];
    lines.push('Jobs that fit');
    currentTop.forEach(function (r, i) {
      var j = r.job;
      lines.push((i + 1) + '. ' + j.name + ': ' + payText(j));
      var tg = topicGroups(r);
      if (tg.length) lines.push('   GCSE topics: ' + tg.map(function (g) { return g.k + ': ' + g.t.join(' · '); }).join('; '));
      lines.push('   Ways in: ' + j.routes.map(function (x) { return x.k + ': ' + x.v; }).join('; '));
      lines.push('   More: ' + j.url);
    });
    var items = timelineItems();
    if (items.length) {
      lines.push('', 'Timeline');
      items.forEach(function (it) { lines.push('- ' + it.date + ': ' + it.title); });
    }
    if (state.y) {
      lines.push('', 'Next steps');
      NEXT[state.y].forEach(function (t) { lines.push('- ' + plain(t)); });
    }
    lines.push('', ADVISORY);
    if (paperUrl()) lines.push('', 'The research behind this tool: ' + paperUrl());
    lines.push('', 'From the Sustainable Local Energy Skills Roadmap by Professor Vahid Vahidinasab, University of Salford. Information checked October 2026.');
    return lines.join('\n');
  }
  function emailBody() {
    var head = ['My local energy skills roadmap', summaryText()];
    var jobsLinked = ['Jobs that fit me:'], jobsPlain = ['Jobs that fit me:'];
    currentTop.forEach(function (r, i) {
      jobsPlain.push((i + 1) + '. ' + r.job.name + ', ' + payText(r.job));
      jobsLinked.push((i + 1) + '. ' + r.job.name + ', ' + payText(r.job), '   ' + r.job.url);
    });
    var next = state.y ? ['Next steps:'].concat(NEXT[state.y].map(function (t) { return '- ' + plain(t); })) : [];
    var dates = timelineItems().filter(function (it) { return !it.cls; }).map(function (it) { return '- ' + it.date + ': ' + it.title; });
    if (dates.length) dates.unshift('Key dates:');
    var tail = [['Build or update this roadmap online: ' + roadmapLink(state)], [ADVISORY]];
    var options = [[head, jobsLinked, next, dates], [head, jobsLinked, next], [head, jobsPlain, next, dates], [head, jobsPlain, next], [head, jobsPlain]];
    for (var i = 0; i < options.length; i++) {
      var body = options[i].concat(tail).filter(function (b) { return b.length; }).map(function (b) { return b.join('\n'); }).join('\n\n');
      if (longestLink(body) <= EMAIL_MAX || i === options.length - 1) return body;
    }
  }
  // Each way to send opens a new email with the subject and message filled in.
  // Links stay under 2,000 characters: Windows does not pass longer email links to the email app.
  var EMAIL_SUBJECT = 'My local energy skills roadmap';
  var EMAIL_MAX = 2000;
  function q(s) { return encodeURIComponent(s); }
  var SENDERS = {
    gmail: { name: 'Gmail', link: function (b) { return 'https://mail.google.com/mail/?view=cm&fs=1&su=' + q(EMAIL_SUBJECT) + '&body=' + q(b); } },
    outlook: { name: 'Outlook', link: function (b) { return 'https://outlook.live.com/mail/0/deeplink/compose?subject=' + q(EMAIL_SUBJECT) + '&body=' + q(b); } },
    school: { name: 'Outlook', link: function (b) { return 'https://outlook.office.com/mail/deeplink/compose?subject=' + q(EMAIL_SUBJECT) + '&body=' + q(b); } },
    app: { name: 'your email app', link: function (b) { return 'mailto:?subject=' + q(EMAIL_SUBJECT) + '&body=' + q(b.replace(/\n/g, '\r\n')); } }
  };
  function longestLink(body) {
    return Math.max.apply(null, Object.keys(SENDERS).map(function (k) { return SENDERS[k].link(body).length; }));
  }
  function qrRows() {
    return QR_HEX.split(',').map(function (h) {
      var bits = parseInt(h, 16).toString(2);
      while (bits.length < 33) bits = '0' + bits;
      return bits;
    });
  }

  // ---------- The anonymous counter ----------
  var LIVE = (function () { try { var u = new URL(CONFIG.toolUrl); return location.hostname === u.hostname && location.pathname.indexOf(u.pathname) === 0; } catch (e) { return false; } })();
  var stats = { on: !!CONFIG.statsUrl, sent: {} };
  function statsBase() { return CONFIG.statsUrl.replace(/\/+$/, ''); }
  function track(event, src) {
    if (!stats.on || !LIVE || stats.sent[event]) return;
    stats.sent[event] = true;
    var url = statsBase() + '/hit', body = JSON.stringify(src ? { event: event, src: src } : { event: event });
    try { if (navigator.sendBeacon && navigator.sendBeacon(url, body)) return; } catch (e) { /* fall through */ }
    try { fetch(url, { method: 'POST', body: body, mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(function () {}); } catch (e) { /* counting is optional */ }
  }
  // Where a visit came from. A link can end ?src=newsletter (utm_source works too); only that short label is
  // counted, as a second message, so the visit count itself is unchanged. Letters, numbers and hyphens, 32 at most.
  function visitSource() {
    var m = /[?&](?:src|utm_source)=([^&#]*)/.exec(location.search), v = '';
    if (!m) return '';
    try { v = decodeURIComponent(m[1].replace(/\+/g, ' ')); } catch (e) { return ''; }
    return v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32);
  }

  // ---------- What the screens and the PDF use ----------
  function compute() { currentTop = pickTop(rankJobs(), 4); return currentTop; }
  function setView(v) {
    if (v !== 'shared') clearAddress();
    view = v === 'shared' && !shared ? 'example' : v;
    state = view === 'shared' ? shared : view === 'example' ? EXAMPLE : mine;
    compute();
  }
  compute();
  S.core = {
    SUBJ: SUBJ, JOB: JOB, INT: INT, PART: PART, MAX_INTERESTS: MAX_INTERESTS, PDFLIB_URL: PDFLIB_URL, PROFILE_URL: PROFILE_URL, EXAMPLE_WHO: EXAMPLE_WHO,
    ADVISORY: ADVISORY, EMAIL_SUBJECT: EMAIL_SUBJECT, SENDERS: SENDERS, LIVE: LIVE,
    esc: esc, money: money, slug: slug, joinList: joinList, lower: lower, reducedMotion: reducedMotion, shortUrl: shortUrl, paperUrl: paperUrl,
    hasAnswers: hasAnswers, answeredCount: answeredCount, encodeState: encodeState, roadmapLink: roadmapLink,
    chosenSubjects: chosenSubjects, activeTopics: activeTopics, subjLabel: subjLabel, rankJobs: rankJobs, jobTopics: jobTopics, topicSubject: topicSubject,
    topicGroups: topicGroups, edges: edges, timelineItems: timelineItems, summaryText: summaryText, routeText: routeText, wordsIn: wordsIn,
    roadmapWords: roadmapWords, storyHtml: storyHtml, cleanState: cleanState, roadmapText: roadmapText, emailBody: emailBody, payText: payText, plain: plain, anchorsIn: anchorsIn, qrRows: qrRows,
    track: track, visitSource: visitSource, statsOn: function () { return stats.on; }, statsUrl: function () { return statsBase() + '/stats'; },
    // The current roadmap: whose it is ("mine", "example" or "shared"), the answers behind it and its four jobs.
    get: function () { return { mine: mine, state: state, view: view, top: currentTop, area: area, shared: shared }; },
    setView: setView,
    answer: function (patch) { Object.keys(patch).forEach(function (k) { mine[k] = patch[k]; }); saveMine(); setView('mine'); },
    reset: function () { mine = cleanState({}); saveMine(); setView('mine'); },
    useShared: function () { if (!shared) return; mine = cleanState(JSON.parse(JSON.stringify(shared))); saveMine(); setView('mine'); },
    readShared: function () { var st = sharedFromAddress(); if (st) { shared = st; setView('shared'); } return !!st; },
    setArea: function (a) { area = NEAR[a] ? a : ''; try { if (area) window.localStorage.setItem(AREA_KEY, area); else window.localStorage.removeItem(AREA_KEY); } catch (e) { /* not saved, still shown */ } }
  };
})(window.SLES);
