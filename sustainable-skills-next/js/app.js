/* The screens. Each screen is a function in V that returns its title and its HTML, built from the data files.
   core.js holds the answers and the matching; this file only shows them and listens for taps.
   Addresses look like #/roadmap or #/job/solar, so the tool keeps one public address. */
(function (S) {
  'use strict';
  var D = S.data, C = S.core, esc = C.esc, money = C.money;
  var TOOL = 'Sustainable Local Energy Skills Roadmap';
  var HOME_TITLE = document.title;
  var view = document.getElementById('view'), welcome = document.getElementById('welcome');
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function ic(name) { return '<svg class="ic" aria-hidden="true" focusable="false"><use href="#i-' + name + '"/></svg>'; }
  var ui = { part: null, moving: !C.reducedMotion(), email: false, card: 0, last: 'welcome' };
  var route = { name: 'welcome', arg: '', arg2: '' };
  var QUESTIONS = [
    { title: 'Which year are you in?' },
    { title: 'What do you enjoy?' },
    { title: 'Which GCSE subjects are you taking, or thinking about?' },
    { title: 'How do you like to learn?' }
  ];

  // ---------- Small pieces used by several screens ----------
  function now() { return C.get(); }
  function demo() { return now().view !== 'mine'; }
  function pay(j) { return money(j.pay[0]) + ' to ' + money(j.pay[1]); }
  function roleTags(j) { return (j.roles || []).map(function (r) { return '<span class="tag tag-role">' + esc(D.roles[r]) + '</span>'; }).join(''); }
  function whyTags(r) { return r.im.map(function (id) { return '<span class="tag">' + esc(C.INT[id].label) + '</span>'; }).join(''); }
  function ranked(id) { return C.rankJobs().filter(function (r) { return r.job.id === id; })[0]; }
  function partsOf(id) { return D.parts.filter(function (p) { return p.who.some(function (w) { return w[1].indexOf(id) !== -1; }); }); }
  function firstUnanswered() { var m = now().mine, done = [!!m.y, m.interests.length > 0, m.s3, !!m.style], i = done.indexOf(false); return i === -1 ? 0 : i; }
  function wordsHtml(list) { return '<dl class="words">' + list.map(function (w) { return '<div><dt>' + esc(w.t) + '</dt><dd>' + esc(w.d) + '</dd></div>'; }).join('') + '</dl>'; }
  function row(icon, title, sub, href) {
    return '<a class="row" href="' + href + '"><span class="row-ic">' + ic(icon) + '</span><span class="row-t"><b>' + title + '</b>' + (sub ? '<span>' + sub + '</span>' : '') + '</span>' + ic('next') + '</a>';
  }
  var GUIDE = '<p class="guide"><strong>Use this to explore, then talk to your careers adviser before you choose.</strong> Courses, grades and pay can change, and this roadmap does not know your own situation. Information checked ' + esc(D.checked) + '. <a href="#/advice">Where to get advice</a></p>';
  // The home picture. lit: part ids to pick out. still: dots are not buttons. moving: add the moving layer.
  function scene(o) {
    o = o || {};
    var sizes = o.small ? '(min-width: 900px) 420px, 100vw' : '(min-width: 900px) 620px, 100vw';
    var dots = D.parts.map(function (p) {
      var lit = o.lit && o.lit.indexOf(p.id) !== -1, at = ' data-x="' + p.at[0] + '" data-y="' + p.at[1] + '"';
      if (o.still) return '<span class="dot' + (lit ? ' is-lit' : '') + '"' + at + '></span>';
      return '<button type="button" class="dot' + (lit ? ' is-lit' : '') + '"' + at + ' data-part="' + p.id + '" aria-pressed="' + (ui.part === p.id) + '" aria-label="' + esc(p.name) + '"></button>';
    }).join('');
    return '<div class="scene' + (o.lit ? ' has-lit' : '') + '"' + (o.still ? ' role="img" aria-label="' + esc(o.label || 'The home picture') + '"' : '') + '>' +
      '<picture><source media="(prefers-color-scheme: dark)" srcset="images/home-scene-night-800.jpg 800w, images/home-scene-night-1344.jpg 1344w" sizes="' + sizes + '"><img src="images/home-scene-800.jpg" srcset="images/home-scene-800.jpg 800w, images/home-scene-1344.jpg 1344w" sizes="' + sizes + '" width="1344" height="756" alt=""></picture>' +
      (o.moving ? '<div class="moving" id="moving" aria-hidden="true"></div>' : '') + dots +
      (o.moving ? '<button type="button" class="pause" data-act="pause" aria-pressed="' + (!ui.moving) + '">' + ic(ui.moving ? 'pause' : 'play') + '<span>' + (ui.moving ? 'Pause' : 'Play') + '</span><span class="vh"> the moving picture</span></button>' : '') + '</div>';
  }
  function placeDots(root) { $all('.dot[data-x]', root).forEach(function (d) { d.style.left = d.getAttribute('data-x') + '%'; d.style.top = d.getAttribute('data-y') + '%'; }); }

  // ---------- Content blocks ----------
  function jobCard(r, i, n) {
    var j = r.job;
    return '<article class="job-card"><p class="jc-n">' + (i + 1) + ' of ' + n + '</p><div class="tags">' + roleTags(j) + '</div><h3>' + esc(j.name) + '</h3><p class="jc-pay"><b>' + pay(j) + '</b> a year</p><p class="jc-what">' + esc(j.what) + '</p>' +
      (whyTags(r) ? '<div class="tags">' + whyTags(r) + '</div>' : '') + '<a class="btn btn-line" href="#/job/' + j.id + '">See this job<span class="vh">: ' + esc(j.name) + '</span></a></article>';
  }
  function jobBody(r) {
    var j = r.job, why = whyTags(r), words = C.wordsIn(C.routeText(j));
    var tl = C.jobTopics(r).map(function (t) { return '<li><b>' + esc(C.topicSubject(t)) + '</b> ' + esc(t.t) + '</li>'; }).join('');
    var where = [];
    D.parts.forEach(function (p) { p.who.forEach(function (w) { if (w[1].indexOf(j.id) === -1) return; var g = where.filter(function (x) { return x.k === w[0]; })[0]; if (!g) where.push(g = { k: w[0], v: [] }); g.v.push(p.name); }); });
    return '<p class="lead-s">' + esc(j.what) + '</p>' +
      (why ? '<h2 class="label">Why it fits</h2><div class="tags">' + why + '</div>' : '') +
      (j.day ? '<h2 class="label">A day might include</h2><p>' + esc(j.day.charAt(0).toUpperCase() + j.day.slice(1)) + '</p>' : '') +
      (j.skills ? '<h2 class="label">Skills you use</h2><div class="tags">' + j.skills.map(function (s) { return '<span class="tag tag-skill">' + esc(s) + '</span>'; }).join('') + '</div>' : '') +
      C.storyHtml(j.id) +
      (where.length ? '<h2 class="label">Around the home</h2>' + scene({ lit: partsOf(j.id).map(function (p) { return p.id; }), still: true, small: true, label: 'The home picture, with dots showing where this job works' }) + '<ul class="plain where">' + where.map(function (g) { return '<li><b>' + esc(g.k) + ':</b> ' + esc(g.v.join(', ')) + '</li>'; }).join('') + '</ul>' : '') +
      (tl ? '<h2 class="label">GCSE topics it uses</h2><ul class="plain">' + tl + '</ul>' : '') +
      '<h2 class="label">Ways in</h2><ul class="plain">' + j.routes.map(function (x) { return '<li><b>' + esc(x.k) + ':</b> ' + esc(x.v) + '</li>'; }).join('') + '</ul>' +
      (words.length ? '<details class="fold"><summary>What do these words mean?</summary>' + wordsHtml(words) + '</details>' : '') +
      '<p class="links"><a href="' + j.url + '" target="_blank" rel="noopener">Full job profile<span class="vh"> for ' + esc(j.name) + '</span></a>' + (j.alt ? ' <span class="muted small">' + esc(j.alt) + '</span>' : '') + '<a href="jobs/' + C.slug(j.name) + '.html">This job on its own page</a></p>';
  }
  function datesList() {
    var items = C.timelineItems();
    if (!items.length) return '<p class="muted">Choose your year group in question 1 to see your dates.</p>';
    return '<ol class="dates">' + items.map(function (it) { return '<li class="' + (it.cls || '') + '"><span class="d-when">' + esc(it.date) + '</span><span class="d-what">' + esc(it.title) + '</span><span class="d-more">' + esc(it.detail) + '</span></li>'; }).join('') + '</ol>';
  }
  function nextList() {
    var st = now().state, list = st.y ? D.next[st.y] : ['Choose your year group in question 1 to see steps for this year.'];
    return '<ul class="ticks">' + list.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>';
  }
  function parentsList() { return '<ul class="ticks">' + D.parents.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>'; }
  function topicsBlock() {
    var st = now().state, subs = C.chosenSubjects();
    var order = subs.filter(function (s) { return !C.SUBJ[s].core; }).concat(subs.filter(function (s) { return C.SUBJ[s].core; }));
    return order.map(function (s, i) {
      var list = D.topics.filter(function (t) { return t.s === s && (!t.triple || st.sci === 'separate'); });
      if (!list.length) return '';
      var src = '<a href="' + C.SUBJ[s].src + '" target="_blank" rel="noopener">' + esc(C.SUBJ[s].srcLabel) + '</a>';
      if (s === 'science' && st.sci === 'separate') src += ' and <a href="' + D.separateSrc.url + '" target="_blank" rel="noopener">' + esc(D.separateSrc.label) + '</a>';
      return '<details class="subj"' + (i === 0 ? ' open' : '') + '><summary><h2>' + esc(C.subjLabel(s)) + '</h2><span class="count">' + list.length + ' topics</span></summary><ul class="topics">' + list.map(function (t) {
        return '<li><h3>' + esc(t.t) + (t.triple ? ' <span class="badge">Separate ' + t.triple + ' only</span>' : '') + '</h3><p>' + esc(t.use) + '</p><p class="quote"><span class="ql">What the course says (official wording)</span>' + t.q.map(function (q) { return '<span class="q">“' + esc(q) + '”</span>'; }).join('') + '</p>' +
          (t.note ? '<p class="muted small">' + esc(t.note) + '</p>' : '') + '<p class="used"><span class="ql">Used by</span>' + t.jobs.filter(function (id) { return C.JOB[id]; }).map(function (id) { return '<a class="tag tag-link" href="#/job/' + id + '">' + esc(C.JOB[id].name) + '</a>'; }).join('') + '</p></li>';
      }).join('') + '</ul><p class="src">Source: ' + src + ' (Department for Education)</p><p class="src"><a href="subjects/' + C.slug(C.SUBJ[s].name) + '.html">' + esc(C.SUBJ[s].name) + ' on its own page</a></p></details>';
    }).join('');
  }
  function nearList() {
    var list = D.near[now().area] || [];
    return list.map(function (n) { return '<a class="near-card" href="' + n.url + '" target="_blank" rel="noopener"><span class="kicker">' + esc(n.kind) + '</span><b>' + esc(n.name) + '</b><span>' + esc(n.what) + '</span></a>'; }).join('');
  }
  function adviceCards() {
    return '<div class="near-list">' + D.advice.map(function (a) { return '<a class="near-card" href="' + a.url + '" target="_blank" rel="noopener"><span class="kicker">' + esc(a.kind === 'route' ? 'Also useful in England' : a.where) + '</span><b>' + esc(a.name) + '</b><span>' + esc(a.what) + '</span></a>'; }).join('') + '</div>';
  }
  function familyBlock() {
    return '<h2>' + (demo() ? 'This pupil\'s four jobs' : 'Your child\'s four jobs') + '</h2><div class="fam-jobs">' + now().top.map(function (r) {
      var j = r.job;
      return '<article class="fam-job"><h3>' + esc(j.name) + '</h3><p class="fam-pay"><b>' + pay(j) + '</b> a year</p><p class="label">Ways in</p><ul class="plain">' + j.routes.map(function (x) { return '<li><b>' + esc(x.k) + ':</b> ' + esc(x.v) + '</li>'; }).join('') + '</ul><a class="link" href="#/job/' + j.id + '">More about this job<span class="vh">: ' + esc(j.name) + '</span></a></article>';
    }).join('') + '</div><p class="muted small">Pay is for a year, from starting pay to experienced. It is the typical yearly pay on each job\'s official profile.</p>' +
      '<h2>What to ask the school</h2>' + parentsList() +
      '<h2>Key dates</h2>' + datesList() +
      '<h2>Free official advice</h2><p>' + esc(D.adviceIntro) + '</p>' + adviceCards() +
      '<div class="rows">' + row('book', 'Words explained', 'Apprenticeship, T Level and more', '#/words') + row('info', 'Good to know', 'Staying in education until 18, and new courses', '#/gtk') + '</div>';
  }
  function qrSvg() {
    var d = '';
    C.qrRows().forEach(function (bits, r) { for (var c = 0; c < bits.length; c++) if (bits.charAt(c) === '1') d += 'M' + (c + 4) + ' ' + (r + 4) + 'h1v1h-1z'; });
    return '<svg class="qr" viewBox="0 0 41 41" role="img" aria-label="QR code that opens the ' + TOOL + '"><rect width="41" height="41" fill="#FFFFFF"/><path d="' + d + '" fill="#032A3B"/></svg>';
  }
  function partPanel() {
    var p = C.PART[ui.part];
    if (!p) return '<p class="muted">Tap a dot or a button to see where it turns up in your lessons, and who installs it.</p>';
    var roles = p.who.filter(function (r) { return r[1].some(function (id) { return C.JOB[id]; }); });
    return '<h2>' + esc(p.name) + '</h2><p>' + esc(p.what) + '</p><h3 class="label">Where it turns up at GCSE</h3><ul class="plain">' + p.links.map(function (l) { return '<li><b>' + esc(C.SUBJ[l[0]].name) + ':</b> ' + esc(l[1]) + '</li>'; }).join('') + '</ul>' +
      roles.map(function (r) { return '<h3 class="label">' + esc(r[0]) + '</h3><div class="tags">' + r[1].filter(function (id) { return C.JOB[id]; }).map(function (id) { return '<a class="tag tag-link" href="#/job/' + id + '">' + esc(C.JOB[id].name) + '</a>'; }).join('') + '</div>'; }).join('');
  }
  function questionBody(i) {
    var m = now().mine;
    var pill = function (type, name, value, label, checked, off) { return '<label class="choice' + (off ? ' is-off' : '') + '"><input type="' + type + '" name="' + name + '" value="' + value + '"' + (checked ? ' checked' : '') + (off ? ' disabled' : '') + '><span class="c-body">' + label + '</span></label>'; };
    if (i === 0) return '<div class="choices years" role="radiogroup" aria-label="Year group">' + [7, 8, 9, 10, 11].map(function (y) { return pill('radio', 'year', y, '<span class="vh">Year </span>' + y, m.y === y); }).join('') + '</div>';
    if (i === 1) { var full = m.interests.length >= C.MAX_INTERESTS; return '<p class="hint" id="int-hint">' + (full ? 'You have picked three. Untick one to swap it.' : 'Pick up to three.') + '</p><div class="choices" role="group" aria-labelledby="q-h int-hint">' + D.interests.map(function (x) { var on = m.interests.indexOf(x.id) !== -1; return pill('checkbox', 'interest', x.id, esc(x.label), on, full && !on); }).join('') + '</div>'; }
    if (i === 2) return '<p class="hint" id="sci-hint">Everyone takes English, maths and science. Which science course?</p><div class="choices two" role="radiogroup" aria-labelledby="sci-hint">' + pill('radio', 'sci', 'combined', 'Combined science', m.s3 && m.sci === 'combined') + pill('radio', 'sci', 'separate', 'Separate sciences', m.sci === 'separate') + '</div><p class="hint" id="opt-hint">Your options. Electronics and Engineering are not offered at every school.</p><div class="choices" role="group" aria-labelledby="opt-hint">' + D.subjects.filter(function (s) { return !s.core; }).map(function (s) { return pill('checkbox', 'subject', s.id, esc(s.name), m.subjects.indexOf(s.id) !== -1); }).join('') + '</div>';
    return '<div class="choices" role="radiogroup" aria-labelledby="q-h">' + D.styles.map(function (s) { return pill('radio', 'style', s.id, '<b>' + esc(s.title) + '</b><small>' + esc(s.desc) + '</small>', m.style === s.id); }).join('') + '</div>';
  }
  function saveBox() {
    var canShare = !!navigator.share;
    return '<section class="save" aria-labelledby="save-h"><h2 id="save-h">Save or share your roadmap</h2><div class="save-grid">' +
      '<button type="button" class="btn" data-act="pdf" data-mode="summary">' + ic('down') + 'Download PDF (2 pages)</button>' +
      '<button type="button" class="btn btn-line" data-act="email" aria-expanded="' + ui.email + '" aria-controls="email-panel">' + ic('mail') + 'Email it</button>' +
      '<button type="button" class="btn btn-line" data-act="copy">' + ic('copy') + 'Copy text</button>' +
      '<button type="button" class="btn btn-line" data-act="share">' + ic(canShare ? 'share' : 'link') + (canShare ? 'Share a link' : 'Copy a link') + '</button></div>' +
      '<p class="muted small">For teachers: <button type="button" class="link inline" data-act="pdf" data-mode="full">download the full version</button>, with every GCSE topic and what the course says.</p>' +
      '<p class="status" id="save-status" role="status"></p>' +
      '<div class="email-panel" id="email-panel"' + (ui.email ? '' : ' hidden') + '><p class="label" id="email-h">Which email do you use?</p><div class="send-grid" role="group" aria-labelledby="email-h">' +
      [['gmail', 'Gmail'], ['outlook', 'Hotmail or Outlook.com'], ['school', 'School or work Outlook'], ['app', 'Email app']].map(function (x) { return '<a class="btn btn-line btn-s" data-send="' + x[0] + '" href="#"' + (x[0] === 'app' ? '' : ' target="_blank" rel="noopener"') + '>' + x[1] + '</a>'; }).join('') + '</div>' +
      '<p class="small">A new email opens with a short version of your roadmap, ready to send to yourself, a parent or a teacher. For the full version, attach the PDF.</p>' +
      '<details class="fold"><summary>See the message or copy it</summary><label for="email-subject">Subject</label><input class="field" id="email-subject" readonly><label for="email-body">Message</label><textarea class="field" id="email-body" readonly rows="10"></textarea><button type="button" class="btn btn-line btn-s" data-act="emailcopy">Copy message</button></details></div>' +
      '<textarea class="field" id="copy-fallback" readonly hidden rows="6" aria-label="Your roadmap as text"></textarea></section>';
  }
  function sources() {
    return '<ul class="plain src-list">' + D.sources.concat(D.subjects.map(function (s) { return [s.srcLabel, s.src]; })).concat([[D.separateSrc.label, D.separateSrc.url]]).map(function (s) { return '<li><a href="' + s[1] + '" target="_blank" rel="noopener">' + esc(s[0]) + '</a></li>'; }).join('') + '<li>Official job profiles at nationalcareers.service.gov.uk, linked from each job</li></ul>';
  }

  // ---------- The screens ----------
  var V = {
    q: function (arg) {
      var n = Math.min(4, Math.max(1, Number(arg) || firstUnanswered() + 1)), q = QUESTIONS[n - 1];
      return { t: 'Question ' + n + ' of 4', cls: 'immersive', html:
        '<header class="q-top"><a class="round" href="' + (n > 1 ? '#/q/' + (n - 1) : '#/') + '">' + ic('back') + '<span class="vh">' + (n > 1 ? 'Back to question ' + (n - 1) : 'Back to the start') + '</span></a><div class="segs" data-n="' + n + '" role="img" aria-label="Question ' + n + ' of 4"><i></i><i></i><i></i><i></i></div><span class="q-n" aria-hidden="true">' + n + ' of 4</span></header>' +
        '<form class="ask" id="quiz" novalidate><h1 id="q-h" tabindex="-1">' + q.title + '</h1>' + questionBody(n - 1) + '<p class="privacy">Your answers are saved on this device only. This page does not collect them. <a href="privacy.html">Privacy</a></p></form>' +
        '<footer class="q-foot">' + (n < 4 ? '<a class="btn btn-block btn-big" href="#/q/' + (n + 1) + '">Next question</a>' : '<a class="btn btn-block btn-big" href="#/roadmap" data-act="mine">See my roadmap</a>') + '<button type="button" class="ghost" data-act="reset">Start again</button></footer>' };
    },
    roadmap: function (arg, fam) {
      var g = now(), ex = g.view === 'example', sh = g.view === 'shared', has = C.hasAnswers(g.mine), top = g.top;
      fam = fam === true;
      var rest = C.rankJobs().length - top.length, items = C.timelineItems(), nextDate = items[1] || items[0];
      var head = '<p class="kicker">' + (ex ? 'Example' : sh ? 'Shared with you' : 'Your roadmap') + '</p><h1 tabindex="-1">' + (ex ? 'Example roadmap' : sh ? 'A roadmap shared with you' : 'Your local energy skills roadmap') + '</h1>';
      if (ex || sh) {
        head += (sh ? '<p class="sum">' + esc(C.summaryText()) + '</p>' : '') + '<div class="note"><p><strong>' + (sh ? 'Someone shared this roadmap with you.' : 'This is an example.') + '</strong> ' + (sh ? 'It was built from their answers, not yours.' : esc(C.EXAMPLE_WHO)) + (has ? ' Your own answers are still saved.' : ' Answer the four questions to see your own.') + '</p><div class="btn-row">' +
          (has ? '<button type="button" class="btn" data-act="mine">Back to my roadmap</button>' : '<a class="btn" href="#/q/1">Start my own roadmap</a>') + (sh ? '<button type="button" class="btn btn-line" data-act="useshared">' + (has ? 'Replace my answers with these' : 'Use these answers as mine') + '</button>' : '') + '</div></div>';
      } else {
        head += '<p class="sum">' + esc(C.summaryText()) + '</p><p class="muted small">' + (has ? 'Built from your answers. It changes as soon as you change an answer.' : 'Answer the four questions and your roadmap will build here as you go.') + '</p><p class="links"><a href="#/q/' + (firstUnanswered() + 1) + '">Change my answers</a><a href="#/roadmap" data-act="example">See an example</a></p>';
      }
      var seg = '<nav class="seg" aria-label="Who is reading"><a href="#/roadmap"' + (fam ? '' : ' aria-current="page"') + '>For me</a><a href="#/families"' + (fam ? ' aria-current="page"' : '') + '>For families</a></nav>';
      var body = fam ? familyBlock() :
        '<div class="h-row"><h2>' + (ex || sh ? 'Jobs that fit this pupil' : 'Jobs that fit you') + '</h2><div class="car-nav"><button type="button" class="round sm" data-act="card" data-arg="-1" aria-label="Previous job">' + ic('back') + '</button><button type="button" class="round sm" data-act="card" data-arg="1" aria-label="Next job">' + ic('next') + '</button></div></div>' +
        (g.state.interests.length ? '' : '<p class="muted small">Pick what you enjoy in question 2 to rank these for you.</p>') +
        '<div class="carousel" id="carousel" tabindex="0" role="group" aria-label="Four jobs. Swipe, or use the arrow keys.">' + top.map(function (r, i) { return jobCard(r, i, top.length); }).join('') + '</div><div class="dots-n" aria-hidden="true">' + top.map(function (r, i) { return '<i' + (i ? '' : ' class="on"') + '></i>'; }).join('') + '</div>' +
        '<div class="rows">' +
        row('jobs', rest + ' more sustainable energy jobs to explore', 'All ' + C.rankJobs().length + ' jobs, with pay', '#/jobs') +
        row('cal', ex || sh ? 'Timeline for this pupil' : 'Your timeline', nextDate ? esc(nextDate.date + ': ' + nextDate.title) : 'Choose your year group to see your dates', '#/dates') +
        row('check', 'What to do next', 'Steps for this school year', '#/next') +
        row('book', 'GCSE topics to look out for', C.chosenSubjects().length + ' subjects', '#/topics') +
        row('link', 'How your subjects connect to jobs', '', '#/links') +
        row('pin', 'Near you', g.area ? esc(D.nearNames[g.area]) : 'Choose your area', '#/near') +
        row('info', 'Good to know', 'Staying in education until 18, and new courses', '#/gtk') +
        row('book', 'Words explained', 'What the words in this roadmap mean', '#/words') + '</div>' +
        (ex || sh || !has ? '' : saveBox()) + GUIDE;
      return { t: ex ? 'Example roadmap' : sh ? 'A roadmap shared with you' : 'Your roadmap', tab: 'roadmap', html: '<div class="pad">' + head + seg + '</div><div class="pad flow">' + body + '</div>' + (fam ? '' : '<div class="print-only" id="print-all"></div>') };
    },
    families: function () { return V.roadmap('', true); },
    job: function (id) {
      var r = ranked(id) || now().top[0], j = r.job;
      var back = ['home', 'jobs', 'topics', 'families'].indexOf(ui.last) !== -1 ? '#/' + ui.last : '#/roadmap';
      return { t: j.name, tab: 'roadmap', back: back, html: '<div class="job-hero"><div class="tags">' + roleTags(j) + '</div><h1 tabindex="-1">' + esc(j.name) + '</h1><p class="jh-pay"><b>' + pay(j) + '</b> a year</p><p class="jh-note">From starting pay to experienced</p></div><div class="pad flow">' + jobBody(r) + '<button type="button" class="btn btn-line" data-act="sharejob" data-arg="' + j.id + '">' + ic(navigator.share ? 'share' : 'link') + (navigator.share ? 'Share this job' : 'Copy a link to this job') + '</button><p class="status" id="job-status" role="status"></p>' + GUIDE + '</div>' };
    },
    jobs: function () {
      var g = now(), all = C.rankJobs(), top = g.top;
      var item = function (r) { var j = r.job; return '<a class="row" href="#/job/' + j.id + '"><span class="row-t"><b>' + esc(j.name) + '</b><span>' + pay(j) + '</span></span>' + ic('next') + '</a>'; };
      return { t: 'All the jobs', tab: 'roadmap', back: '#/roadmap', html: '<div class="pad flow"><h1 tabindex="-1">All ' + all.length + ' jobs</h1><h2>' + (demo() ? 'Jobs that fit this pupil' : 'Jobs that fit you') + '</h2><div class="rows">' + top.map(item).join('') + '</div><h2>More sustainable energy jobs to explore</h2><div class="rows">' + all.filter(function (r) { return top.indexOf(r) === -1; }).map(item).join('') + '</div><p class="muted small">Pay is for a year, from starting pay to experienced.</p></div>' };
    },
    home: function (arg) {
      ui.part = C.PART[arg] ? arg : null;
      return { t: 'The home', tab: 'home', cls: 'v-wide', html: '<div class="home-grid"><div class="home-pic">' + scene({ moving: true }) + '</div><div class="pad flow"><h1 tabindex="-1">One home, many GCSE subjects</h1><p class="muted">Tap a part of the home to see where it turns up in your lessons, and who installs it and keeps it running.</p><div class="chips" role="group" aria-label="Parts of the home">' +
        D.parts.map(function (p) { return '<button type="button" class="chip" data-part="' + p.id + '" aria-pressed="' + (ui.part === p.id) + '">' + esc(p.short || p.name) + '</button>'; }).join('') + '</div><div class="part-box" id="part-box" aria-live="polite">' + partPanel() + '</div></div></div>' };
    },
    near: function () {
      var a = now().area, opts = [['gm', 'Greater Manchester'], ['eng', 'Somewhere else in England'], ['sco', 'Scotland'], ['wal', 'Wales'], ['ni', 'Northern Ireland']];
      return { t: 'Near you', tab: 'near', html: '<div class="pad flow"><h1 tabindex="-1">Near you</h1><p class="muted" id="near-hint">Where do you live? This is saved on this device only, like your answers.</p><div class="choices" role="radiogroup" aria-labelledby="near-hint">' + opts.map(function (o) { return '<label class="choice"><input type="radio" name="area" value="' + o[0] + '"' + (a === o[0] ? ' checked' : '') + '><span class="c-body">' + o[1] + '</span></label>'; }).join('') + '</div><div class="near-list" id="near-list" aria-live="polite">' + nearList() + '</div></div>' };
    },
    dates: function () { return page(demo() ? 'Timeline for this pupil' : 'Your timeline', datesList()); },
    next: function () { return page('What to do next', nextList() + '<h2>For parents and carers</h2>' + parentsList()); },
    topics: function () { return page('GCSE topics to look out for', '<p class="muted small">From the Department for Education\'s subject content for each GCSE in England. Exam boards add detail, so your course may cover more.</p>' + topicsBlock()); },
    links: function () {
      var edges = C.edges(), subs = C.chosenSubjects();
      return page('How your subjects connect to jobs', '<p class="muted small">Each job listed uses at least one topic from that subject.</p><div class="conn">' + subs.map(function (s) {
        var jobs = edges.filter(function (e) { return e.s === s; });
        return '<div class="conn-row"><h2>' + esc(C.subjLabel(s)) + '</h2>' + (jobs.length ? '<div class="tags">' + jobs.map(function (e) { return '<a class="tag tag-link" href="#/job/' + e.j + '">' + esc(C.JOB[e.j].name) + '</a>'; }).join('') + '</div>' : '<p class="muted small">None of these four jobs.</p>') + '</div>';
      }).join('') + '</div>');
    },
    gtk: function () { return page('Good to know', '<ul class="ticks">' + D.goodToKnow.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>'); },
    words: function () { return page('Words explained', '<p class="muted small">What the words in this roadmap mean.</p>' + wordsHtml(D.words)); },
    advice: function () { return page('Talk your choices through with an adviser', '<p>' + esc(D.adviceIntro) + '</p>' + adviceCards(), '#/more', 'Official careers advice', 'more'); },
    more: function () {
      return { t: 'More', tab: 'more', html: '<div class="pad flow"><h1 tabindex="-1">More</h1><div class="rows">' + row('board', 'Teacher mode', 'Run the 20-minute activity', '#/teacher') + row('family', 'For families', 'Pay, ways in and what to ask the school', '#/families') + row('people', 'Official careers advice', 'Free services in each UK nation', '#/advice') + '</div>' +
        '<div class="rows">' + row('qr', 'Share this tool', 'QR code and link', '#/share') + '<button type="button" class="row" id="install-row" data-act="install"' + (canInstall() ? '' : ' hidden') + '><span class="row-ic">' + ic('down') + '</span><span class="row-t"><b>Add to your home screen</b><span>Opens like an app, and works offline</span></span></button><button type="button" class="row" data-act="reset"><span class="row-ic">' + ic('close') + '</span><span class="row-t"><b>Start again</b><span>Clears your answers from this device</span></span></button></div>' +
        '<p class="status" id="more-status" role="status"></p>' +
        '<div class="rows">' + row('info', 'About this guide and sources', '', '#/about') + '<a class="row" href="privacy.html"><span class="row-t"><b>Privacy</b></span>' + ic('next') + '</a><a class="row" href="accessibility.html"><span class="row-t"><b>Accessibility statement</b></span>' + ic('next') + '</a></div></div>' };
    },
    share: function () {
      return page('Share this tool', '<div class="share-box">' + qrSvg() + '<p>Scan to open it on a phone, or show it in class.</p><p class="share-url">' + esc(D.config.toolUrl) + '</p><div class="btn-row">' + (navigator.share ? '<button type="button" class="btn" data-act="sharetool">' + ic('share') + 'Share</button>' : '') + '<button type="button" class="btn btn-line" data-act="copylink">' + ic('copy') + 'Copy link</button><a class="btn btn-line" href="#/qr">' + ic('qr') + 'Show it full screen</a></div><p class="status" id="share-status" role="status"></p></div>', '#/more', '', 'more');
    },
    about: function () {
      var cfg = D.config, fb, research = '';
      if (cfg.feedbackUrl) fb = '<a href="' + esc(cfg.feedbackUrl) + '" target="_blank" rel="noopener">Send feedback</a>';
      else if (cfg.contactEmail) fb = '<a href="mailto:' + esc(cfg.contactEmail) + '?subject=' + encodeURIComponent(TOOL + ': feedback') + '">Send feedback</a>';
      else fb = '<a href="' + C.PROFILE_URL + '" target="_blank" rel="noopener">Contact the author</a>';
      if (cfg.articleUrl) research += '<li><a href="' + esc(cfg.articleUrl) + '" target="_blank" rel="noopener">Read the article in The Conversation</a></li>';
      if (C.paperUrl()) research += '<li><a href="' + C.paperUrl() + '" target="_blank" rel="noopener">Read the paper: doi.org/' + esc(cfg.paperDoi.replace(/^https?:\/\/(dx\.)?doi\.org\//, '')) + '</a></li>';
      return page('About this guide', D.about.map(function (p) { return '<p>' + p.replace('{checked}', esc(D.checked)) + '</p>'; }).join('') +
        (C.statsOn() ? '<p>This page counts visits and how the tool is used, anonymously and without cookies. It keeps only totals, by country, by UK region and by where a link was shared, never your answers.</p>' : '') +
        '<p>Spotted a mistake or have an idea? ' + fb + '</p><p>Teaching with this tool? The <a href="teachers.html">teacher pack</a> has a 20-minute activity, classroom slides, a pupil worksheet and a QR poster.</p>' +
        (research ? '<h2>The research behind it</h2><ul class="plain">' + research + '</ul>' : '') +
        '<section class="reach" id="reach" hidden><h2>Reach so far</h2><p class="muted" id="reach-since"></p><p class="reach-n"><b id="st-visit">0</b> <span id="st-visit-label">visits</span></p></section>' +
        '<h2>Sources</h2>' + sources() +
        '<p class="small copyright">© 2026 <a href="' + C.PROFILE_URL + '" target="_blank" rel="noopener">Professor Vahid Vahidinasab</a>, University of Salford. All rights reserved. Schools, teachers and families may print, copy and share this tool, its PDFs and teaching resources for non-commercial education.</p><p class="links"><a href="privacy.html">Privacy</a><a href="accessibility.html">Accessibility statement</a><a href="https://vahidinasab.github.io/">vahidinasab.github.io</a></p>', '#/more', '', 'more');
    },
    teacher: function () {
      var t = D.teacher;
      return { t: 'Teacher mode', tab: 'more', back: '#/more', html: '<div class="pad flow"><p class="kicker">For teachers and careers leaders</p><h1 tabindex="-1">Teaching with the energy skills roadmap</h1><p class="lead">' + esc(t.lead) + '</p>' +
        '<section class="card"><h2>A 20-minute activity</h2><p class="small">' + esc(t.outcome) + '</p><ol class="steps">' + t.steps.map(function (s) { return '<li><span class="mins">' + s.mins + ' min</span><b>' + esc(s.title) + '</b></li>'; }).join('') + '</ol><a class="btn btn-block" href="#/run/1">' + ic('play') + 'Start the activity</a></section>' +
        '<div class="tools"><a class="tool" href="#/qr">' + ic('qr') + '<b>Show the QR code</b></a><a class="tool" href="slides.html">' + ic('board') + '<b>Classroom slides</b></a><a class="tool" href="worksheet.html">' + ic('book') + '<b>Pupil worksheet</b></a><a class="tool" href="poster.html">' + ic('qr') + '<b>QR code poster</b></a></div>' +
        '<p class="small">The full PDF, with every GCSE topic and what the course says, is under Save or share on a roadmap. <a href="teachers.html">Teacher notes, to read or print</a></p>' +
        '<h2>Before the lesson</h2><ul class="ticks">' + t.before.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><h2>Adapting it</h2><ul class="ticks">' + t.adapt.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' };
    },
    run: function (arg) {
      var steps = D.teacher.steps, n = Math.min(steps.length, Math.max(1, Number(arg) || 1)), s = steps[n - 1];
      return { t: 'Step ' + n + ': ' + s.title, cls: 'immersive board', html:
        '<header class="q-top"><a class="round" href="#/teacher">' + ic('close') + '<span class="vh">Close the activity</span></a><div class="segs" data-n="' + n + '" role="img" aria-label="Step ' + n + ' of ' + steps.length + '">' + steps.map(function () { return '<i></i>'; }).join('') + '</div><span class="q-n" aria-hidden="true">' + n + ' of ' + steps.length + '</span></header>' +
        '<div class="ask"><h1 tabindex="-1" class="mega">' + esc(s.title) + '</h1><button type="button" class="clock" id="clock" data-act="timer" data-secs="' + (s.mins * 60) + '"><span class="t-num" id="t-num">' + s.mins + ':00</span><span class="t-lab" id="t-lab">Start the timer</span></button><p class="big">' + esc(s.text) + '</p>' +
        (n === 1 ? '<a class="btn btn-line-w btn-block" href="#/home">' + ic('bolt') + 'Open the home picture</a>' : '') + (n === 2 ? '<a class="btn btn-line-w btn-block" href="#/qr">' + ic('qr') + 'Show the QR code</a>' : '') + '</div>' +
        '<footer class="q-foot">' + (n < steps.length ? '<a class="btn btn-block btn-big" href="#/run/' + (n + 1) + '">Next step</a>' : '<a class="btn btn-block btn-big" href="#/teacher">Finish</a>') + '</footer>' };
    },
    qr: function () {
      var back = ['run', 'teacher', 'share'].indexOf(ui.last) !== -1 ? '#/' + (ui.last === 'run' ? 'run/2' : ui.last) : '#/more';
      return { t: 'QR code', cls: 'immersive qr-view', html: '<div class="qr-screen"><a class="round qr-close" href="' + back + '">' + ic('close') + '<span class="vh">Close</span></a><h1 tabindex="-1">Scan to build your roadmap</h1>' + qrSvg() + '<p>Four quick questions. About five minutes. Free, with no login.</p><p class="qr-url">' + esc(C.shortUrl(D.config.toolUrl)) + '</p></div>' };
    }
  };
  function page(title, body, back, kicker, tab) {
    return { t: title, tab: tab || 'roadmap', back: back || '#/roadmap', html: '<div class="pad flow">' + (kicker ? '<p class="kicker">' + kicker + '</p>' : '') + '<h1 tabindex="-1">' + title + '</h1>' + body + '</div>' };
  }

  // ---------- Showing a screen ----------
  var LEGACY = { answers: 'q', roadmap: 'roadmap', explore: 'home', advice: 'advice', about: 'about', reach: 'about' };
  function parse() {
    var h = location.hash, m = /^#\/([a-z]+)(?:\/([a-z0-9-]+))?/.exec(h);
    if (/(?:^#|&)r=/.test(h)) return { name: 'roadmap', arg: '' };
    if (m && V[m[1]]) return { name: m[1], arg: m[2] || '' };
    if (LEGACY[h.slice(1)]) return { name: LEGACY[h.slice(1)], arg: '' };
    return { name: 'welcome', arg: '' };
  }
  function announce(msg) { var a = document.getElementById('announce'); a.textContent = ''; setTimeout(function () { a.textContent = msg; }, 60); }
  function toast(msg) { var t = document.getElementById('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('on'); }, 3500); }
  function setStatus(msg, id) { var el = document.getElementById(id || 'save-status'); if (el) el.textContent = msg; else if (msg) toast(msg); }
  function render(keep) {
    var r = parse(), v = null, y = window.pageYOffset;
    if (route.name !== r.name || route.arg !== r.arg) ui.last = route.name;
    stopTimer();
    route = r;
    if (r.name === 'welcome') { welcome.hidden = false; view.hidden = true; view.innerHTML = ''; updateWelcome(); }
    else { v = V[r.name](r.arg); welcome.hidden = true; view.hidden = false; view.className = 'view v-' + r.name + (v.cls ? ' ' + v.cls : ''); view.innerHTML = v.html; }
    var immersive = !!(v && v.cls && v.cls.indexOf('immersive') !== -1);
    document.body.classList.toggle('is-immersive', immersive); document.documentElement.classList.toggle('immersive-on', immersive);
    document.body.classList.toggle('is-board', !!(v && v.cls && v.cls.indexOf('board') !== -1));
    var tab = v ? v.tab : 'welcome', back = v && v.back;
    $all('#nav a').forEach(function (a) { if (a.getAttribute('data-tab') === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    document.getElementById('bar-back').hidden = !back; if (back) document.getElementById('bar-back').setAttribute('href', back);
    document.getElementById('bar-logo').hidden = !!back;
    document.getElementById('bar-t').textContent = v && back ? v.t : 'Local Energy Skills';
    document.title = v ? v.t + ' | ' + TOOL : HOME_TITLE;
    placeDots(document);
    if (A[r.name]) A[r.name](r.arg);
    if (keep === true) window.scrollTo(0, y);
    else {
      window.scrollTo(0, 0);
      var h = $('h1', v ? view : welcome);
      if (h && started) { try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }
    }
    started = true;
  }
  var started = false;
  function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }
  function updateWelcome() {
    var m = now().mine, has = C.hasAnswers(m), a = document.getElementById('go'), b = document.getElementById('go2');
    a.textContent = has ? 'Continue your roadmap' : 'Build my roadmap';
    a.setAttribute('href', has && C.answeredCount(m) === 4 ? '#/roadmap' : '#/q/' + (firstUnanswered() + 1));
    if (has && C.answeredCount(m) === 4) a.setAttribute('data-act', 'mine'); else a.removeAttribute('data-act');
    b.textContent = 'See an example';
    document.getElementById('welcome-back').hidden = !has || !returning;
  }
  var returning = C.hasAnswers(now().mine);   // true only when answers were already saved before this visit

  // ---------- After a screen is drawn ----------
  var exampleTimer = null, tick = null;
  function stopTimer() { if (tick) { clearInterval(tick); tick = null; } }
  var A = {
    roadmap: function () {
      var c = document.getElementById('carousel');
      if (c) {
        var dots = $all('.dots-n i');
        var sync = function () { var i = Math.round(c.scrollLeft / (c.scrollWidth / dots.length)); dots.forEach(function (d, k) { d.classList.toggle('on', k === i); }); ui.card = i; };
        c.addEventListener('scroll', sync, { passive: true });
        c.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') moveCard(1); if (e.key === 'ArrowLeft') moveCard(-1); });
      }
      if (ui.email) fillEmail();
      // An example counts as explored when it stays on screen for a few seconds.
      clearTimeout(exampleTimer);
      if (now().view === 'example') exampleTimer = setTimeout(function () { if (route.name === 'roadmap' && now().view === 'example') C.track('example'); }, 4000);
    },
    families: function () { A.roadmap(); },
    home: function () { loadMoving(); },
    about: function () { loadStats(); }
  };
  function moveCard(d) { var c = document.getElementById('carousel'); if (c) c.scrollBy({ left: d * (c.scrollWidth / c.children.length), behavior: C.reducedMotion() ? 'auto' : 'smooth' }); }
  // The moving layer of the home picture: fetched once, paused off screen, and never started for reduced motion.
  var movingSvg = null;
  function loadMoving() {
    var box = document.getElementById('moving');
    if (!box) return;
    var put = function () {
      box.innerHTML = movingSvg;
      var svg = box.firstElementChild;
      if (!svg || !svg.pauseAnimations) return;
      if (!ui.moving) svg.pauseAnimations();
      else if (window.IntersectionObserver) new IntersectionObserver(function (en) { if (!ui.moving) return; if (en[0].isIntersecting) svg.unpauseAnimations(); else svg.pauseAnimations(); }).observe(svg);
      box.parentNode.classList.toggle('is-paused', !ui.moving);
    };
    if (movingSvg) return put();
    fetch('images/home-moving.svg').then(function (r) { return r.ok ? r.text() : ''; }).then(function (t) { movingSvg = t; if (t && document.getElementById('moving')) put(); }, function () { /* the still picture is enough */ });
  }
  function loadStats() {
    if (!C.statsOn() || !window.fetch || !D.config.reachShow) return;
    fetch(C.statsUrl()).then(function (r) { return r.ok ? r.json() : null; }).then(function (s) {
      var box = document.getElementById('reach');
      if (!box || !s || typeof s.visit !== 'number' || s.visit < (D.config.reachShowFrom || 0)) return;
      document.getElementById('st-visit').textContent = Number(s.visit).toLocaleString('en-GB');
      document.getElementById('st-visit-label').textContent = s.visit === 1 ? 'visit' : 'visits';
      if (s.since) { var d = new Date(s.since + 'T12:00:00Z'); document.getElementById('reach-since').textContent = isNaN(d) ? '' : 'Counting since ' + d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); }
      box.hidden = false;
    }, function () { /* the counter is optional */ });
  }

  // ---------- Save or share: copy, email, link, PDF (the same words and steps as before) ----------
  function copyText(text, ok, fail) {
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(ok, fail); return; } } catch (e) { /* use the fallback */ }
    fail();
  }
  function copyNow(text) {
    var ta = document.createElement('textarea'), was = document.activeElement, ok = false;
    ta.value = text; ta.setAttribute('readonly', ''); ta.className = 'vh';
    document.body.appendChild(ta); ta.select();
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    if (was && was.focus) { try { was.focus({ preventScroll: true }); } catch (e) { was.focus(); } }
    return ok;
  }
  function fillEmail() {
    var body = C.emailBody();
    document.getElementById('email-subject').value = C.EMAIL_SUBJECT;
    document.getElementById('email-body').value = body;
    $all('[data-send]').forEach(function (a) { a.setAttribute('href', C.SENDERS[a.getAttribute('data-send')].link(body)); });
    // On phones and tablets the email app is usually the easiest way, so it goes first.
    var grid = $('.send-grid'), app = $('[data-send="app"]');
    if (grid && app && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) grid.insertBefore(app, grid.firstChild);
  }
  function closeEmail() { ui.email = false; var p = document.getElementById('email-panel'), b = $('[data-act="email"]'); if (p) p.hidden = true; if (b) b.setAttribute('aria-expanded', 'false'); }
  function showFallback(text, msg) { var ta = document.getElementById('copy-fallback'); if (!ta) { toast(text); return; } ta.value = text; ta.hidden = false; ta.focus(); ta.select(); setStatus(msg); }
  function hideFallback() { var ta = document.getElementById('copy-fallback'); if (ta) ta.hidden = true; }
  function shareLink(data, copied, shown) {
    function copy() { copyText(data.url, function () { copied(); C.track('share'); }, shown); }
    if (navigator.share) navigator.share(data).then(function () { C.track('share'); }, function (err) { if (!err || err.name !== 'AbortError') copy(); });
    else copy();
  }
  var libs = null, pdfBusy = false;
  function loadScript(src) { return new Promise(function (resolve, reject) { var s = document.createElement('script'); s.src = src; s.async = true; s.onload = resolve; s.onerror = function () { reject({ code: 'lib' }); }; document.head.appendChild(s); }); }
  function loadPdf() {
    if (!libs) libs = Promise.all([window.PDFLib ? null : loadScript(C.PDFLIB_URL), S.pdf ? null : loadScript('js/pdf.js')]).then(function () { if (!window.PDFLib || !S.pdf) throw { code: 'lib' }; return window.PDFLib; });
    libs.then(null, function () { libs = null; });
    return libs;
  }
  function makePdf(btn) {
    if (pdfBusy) return;
    var mode = btn.getAttribute('data-mode') || 'summary';
    pdfBusy = true; btn.setAttribute('aria-busy', 'true'); hideFallback(); closeEmail();
    setStatus(mode === 'full' ? 'Making the full PDF...' : 'Making your PDF...');
    loadPdf().then(function (L) { return S.pdf.build(L, mode); }).then(function (bytes) {
      var url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })), a = document.createElement('a');
      a.href = url; a.download = S.pdf.name(mode); document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
      setStatus(mode === 'full' ? 'Full PDF saved. Check your downloads.' : 'PDF saved. Check your downloads.');
      C.track('pdf');
    }, function (err) {
      setStatus(err && err.code === 'lib' ? 'The PDF maker did not load. Check your connection and try again, or use Copy text.' : 'Sorry, the PDF could not be made. Use Copy text or Email it instead.');
    }).then(function () { pdfBusy = false; btn.removeAttribute('aria-busy'); });
  }

  // ---------- Installing as an app ----------
  var installEvent = null;
  var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  var isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function canInstall() { return !standalone && (!!installEvent || isIos); }
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEvent = e; var r = document.getElementById('install-row'); if (r) r.hidden = false; });
  window.addEventListener('appinstalled', function () { installEvent = null; var r = document.getElementById('install-row'); if (r) r.hidden = true; });

  // ---------- Taps ----------
  var ACT = {
    example: function () { C.setView('example'); C.track('example'); go('#/roadmap'); return true; },
    mine: function () { if (C.hasAnswers(now().mine)) C.setView('mine'); go('#/roadmap'); return true; },
    useshared: function () { C.useShared(); returning = false; announce('These answers are now yours.'); go('#/roadmap'); },
    card: function (b) { moveCard(Number(b.getAttribute('data-arg'))); },
    reset: function () { C.reset(); returning = false; ui.email = false; announce('Your answers are cleared.'); if (route.name === 'q') go('#/q/1'); else { toast('Your answers are cleared from this device.'); go('#/'); } updateWelcome(); },
    pause: function (b) {
      ui.moving = !ui.moving;
      var svg = $('#moving svg'); if (svg && svg.pauseAnimations) { if (ui.moving) svg.unpauseAnimations(); else svg.pauseAnimations(); }
      b.setAttribute('aria-pressed', String(!ui.moving)); b.parentNode.classList.toggle('is-paused', !ui.moving);
      $('use', b).setAttribute('href', '#i-' + (ui.moving ? 'pause' : 'play')); $('span', b).textContent = ui.moving ? 'Pause' : 'Play';
    },
    pdf: function (b) { makePdf(b); },
    email: function (b) { hideFallback(); setStatus(''); ui.email = !ui.email; document.getElementById('email-panel').hidden = !ui.email; b.setAttribute('aria-expanded', String(ui.email)); if (ui.email) fillEmail(); },
    emailcopy: function () {
      var text = 'Subject: ' + C.EMAIL_SUBJECT + '\n\n' + document.getElementById('email-body').value;
      copyText(text, function () { setStatus('Message copied. Paste it into a new email.'); C.track('copy'); }, function () { var ta = document.getElementById('email-body'); ta.focus(); ta.select(); setStatus('Select the message text and copy it.'); });
    },
    copy: function () {
      var text = C.roadmapText(); closeEmail();
      copyText(text, function () { hideFallback(); setStatus('Copied. Paste it into a message, email or note.'); C.track('copy'); }, function () { showFallback(text, 'Select all the text in the box below and copy it.'); });
    },
    share: function () {
      var link = C.roadmapLink(now().mine); closeEmail(); hideFallback(); setStatus('');
      shareLink({ title: 'My local energy skills roadmap', text: 'My local energy skills roadmap', url: link }, function () { setStatus('Link copied. Anyone who opens it sees this roadmap, with your four answers.'); }, function () { showFallback(link, 'Select the link in the box below and copy it.'); });
    },
    sharetool: function () { shareLink({ title: TOOL, text: 'Join the dots from your GCSEs to clean energy jobs', url: D.config.toolUrl + '?src=share' }, function () { setStatus('Link copied.', 'share-status'); }, function () { setStatus(D.config.toolUrl, 'share-status'); }); },
    copylink: function () { copyText(D.config.toolUrl, function () { setStatus('Link copied.', 'share-status'); C.track('share'); }, function () { setStatus(D.config.toolUrl, 'share-status'); }); },
    sharejob: function (b) {
      var j = C.JOB[b.getAttribute('data-arg')], url = D.config.toolUrl + 'jobs/' + C.slug(j.name) + '.html';
      shareLink({ title: j.name, url: url }, function () { setStatus('Link copied.', 'job-status'); }, function () { setStatus(url, 'job-status'); });
    },
    install: function () {
      if (installEvent) { installEvent.prompt(); installEvent = null; }
      else setStatus('On an iPhone or iPad: tap Share in Safari, then Add to Home Screen.', 'more-status');
    },
    timer: function (b) {
      var num = document.getElementById('t-num'), lab = document.getElementById('t-lab');
      if (tick) { stopTimer(); lab.textContent = 'Carry on'; return; }
      lab.textContent = 'Pause';
      tick = setInterval(function () {
        var s = Math.max(0, Number(b.getAttribute('data-secs')) - 1); b.setAttribute('data-secs', s);
        num.textContent = Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
        if (!s) { stopTimer(); lab.textContent = 'Time is up'; announce('Time is up.'); }
      }, 1000);
    }
  };
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-act],[data-part],[data-send]') : null;
    if (!t) return;
    if (t.hasAttribute('data-send')) {
      var key = t.getAttribute('data-send'), text = document.getElementById('email-body').value;
      var lead = key === 'app' ? 'Opening your email app. If nothing opens, pick Gmail or Outlook instead.' : 'Opening ' + C.SENDERS[key].name + ' in a new tab.', also = ' Your roadmap is copied too, in case you need to paste it.';
      if (copyNow(text)) setStatus(lead + also); else { setStatus(lead); copyText(text, function () { setStatus(lead + also); }, function () {}); }
      C.track('email');
      return;
    }
    if (t.hasAttribute('data-part')) {
      var id = t.getAttribute('data-part');
      if (route.name !== 'home') { go('#/home/' + id); return; }
      ui.part = ui.part === id ? null : id;
      $all('[data-part]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-part') === ui.part)); });
      document.getElementById('part-box').innerHTML = partPanel();
      try { history.replaceState(null, '', '#/home' + (ui.part ? '/' + ui.part : '')); } catch (err) { /* the address stays as it was */ }
      return;
    }
    var act = ACT[t.getAttribute('data-act')];
    if (act && act(t) === true) e.preventDefault();
  });
  document.addEventListener('change', function (e) {
    var el = e.target, n = el.name;
    if (n === 'area') { C.setArea(el.value); document.getElementById('near-list').innerHTML = nearList(); return; }
    if (['year', 'interest', 'sci', 'subject', 'style'].indexOf(n) === -1) return;
    var checked = function (name) { return $all('input[name="' + name + '"]:checked', view).map(function (x) { return x.value; }); };
    var patch = {};
    if (n === 'year') patch.y = Number(el.value);
    if (n === 'interest') patch.interests = checked('interest').slice(0, C.MAX_INTERESTS);
    if (n === 'sci') { patch.sci = el.value; patch.s3 = true; }
    if (n === 'subject') { patch.subjects = checked('subject'); patch.s3 = true; }
    if (n === 'style') patch.style = el.value;
    C.answer(patch);
    ui.email = false;
    if (n === 'interest') {   // at three, the rest switch off until one is unticked
      var full = now().mine.interests.length >= C.MAX_INTERESTS;
      $all('input[name="interest"]', view).forEach(function (x) { var off = full && !x.checked; x.disabled = off; x.parentNode.classList.toggle('is-off', off); });
      document.getElementById('int-hint').textContent = full ? 'You have picked three. Untick one to swap it.' : 'Pick up to three.';
    }
    var m = now().mine, count = C.answeredCount(m);
    announce('Saved. ' + count + ' of 4 questions answered.');
    if (m.y && count >= 2) C.track('own');
  });
  window.addEventListener('hashchange', function () {
    if (/(?:^#|&)r=/.test(location.hash)) C.readShared();
    render();
  });
  // Printing the roadmap screen prints the whole roadmap, not only what is on screen.
  window.addEventListener('beforeprint', function () {
    var box = document.getElementById('print-all'); if (!box) return;
    box.innerHTML = '<h2>' + (demo() ? 'Jobs that fit this pupil' : 'Jobs that fit you') + '</h2>' + now().top.map(function (r) { return '<article class="print-job"><h3>' + esc(r.job.name) + '</h3><p><b>' + pay(r.job) + '</b> a year, from starting pay to experienced</p>' + jobBody(r) + '</article>'; }).join('') +
      '<h2>' + (demo() ? 'Timeline for this pupil' : 'Your timeline') + '</h2>' + datesList() + '<h2>GCSE topics to look out for</h2>' + topicsBlock() + '<h2>What to do next</h2>' + nextList() + '<h2>For parents and carers</h2>' + parentsList() +
      '<h2>Good to know</h2><ul class="ticks">' + D.goodToKnow.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul><h2>Words explained</h2>' + wordsHtml(D.words);
    $all('details', box).forEach(function (d) { d.open = true; });
  });
  window.addEventListener('afterprint', function () { var box = document.getElementById('print-all'); if (box) box.innerHTML = ''; });

  // ---------- Start ----------
  var hero = document.getElementById('hero-dots');
  if (hero) hero.innerHTML = D.parts.map(function (p) { return '<span class="dot" data-x="' + p.at[0] + '" data-y="' + p.at[1] + '"></span>'; }).join('');
  render();
  if (C.statsOn()) { C.track('visit'); if (C.visitSource()) C.track('source', C.visitSource()); }
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () { /* the tool works without it */ }); });
  }
})(window.SLES);
