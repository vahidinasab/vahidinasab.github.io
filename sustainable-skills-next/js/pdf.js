/* The PDF: the two-page roadmap and the full teacher version. Drawn with pdf-lib (vendor/), in the browser.
   The drawing code is carried over unchanged from the version it replaces, so the PDFs come out the same.
   This file and pdf-lib are only downloaded when someone asks for a PDF. */
(function (S) {
  'use strict';
  var D = S.data, C = S.core;
  var CONFIG = D.config, TOPICS = D.topics, NEXT = D.next, ADVICE = D.advice, NEAR = D.near, NEAR_NAMES = D.nearNames, SOURCES = D.sources, SEPARATE_SRC = D.separateSrc,
    SUBJ = C.SUBJ, JOB = C.JOB, INT = C.INT, ROLES = D.roles, PROFILE_URL = C.PROFILE_URL;
  var anchorsIn = C.anchorsIn, chosenSubjects = C.chosenSubjects, money = C.money, paperUrl = C.paperUrl, plain = C.plain, roadmapWords = C.roadmapWords,
    shortUrl = C.shortUrl, subjLabel = C.subjLabel, summaryText = C.summaryText, timelineItems = C.timelineItems, topicGroups = C.topicGroups, qrRows = C.qrRows;
  // A list written as HTML in guide.js, as list items the PDF can read (its text and its links).
  function listItems(list) { return list.map(function (h) { var li = document.createElement('li'); li.innerHTML = h; Array.prototype.forEach.call(li.querySelectorAll('a'), function (a) { a.href = a.getAttribute('href'); }); return li; }); }
  var logoBytes = null;
  function loadLogo() {
    if (logoBytes) return Promise.resolve();
    return fetch('assets/uos-logo.png').then(function (r) { return r.ok ? r.arrayBuffer() : null; }).then(function (b) { logoBytes = b ? new Uint8Array(b) : null; }, function () { logoBytes = null; });
  }
  // build(pdfLib, 'summary' or 'full') gives the PDF's bytes; name(mode) gives its file name.
  S.pdf = {
    name: function (mode) { var state = C.get().state; return pdfName(mode); function pdfName(mode) { return 'local-energy-skills-roadmap' + (state.y ? '-year-' + state.y : '') + (mode === 'full' ? '-full' : '') + '.pdf'; } },
    build: function (L, mode, level) {
      var now = C.get(), state = now.state, currentTop = now.top, area = now.area;
      return loadLogo().then(function () { return buildPdf(L, mode, level); });
      function buildPdf(L, mode, level) {
        level = level || 0;
        function rgb(r, g, b) { return L.rgb(r / 255, g / 255, b / 255); }
        var C = { ink: rgb(3, 42, 59), text: rgb(29, 53, 66), muted: rgb(86, 98, 111), amber: rgb(46, 184, 149), amberDark: rgb(12, 110, 87), green: rgb(23, 120, 90), card: rgb(242, 245, 248), cardLine: rgb(220, 226, 234), note: rgb(233, 246, 242), noteLine: rgb(127, 209, 187), white: rgb(255, 255, 255) };
        var W = 595.28, H = 841.89, M = 50, CW = W - 2 * M, LIMIT = H - 62;
        var DOT = ' · '; // a separator that never starts a line
        var doc, F = {}, OK = {}, page = null, y = 0, pages = [];

        function safe(s) {
          s = String(s).replace(/ /g, ' ');
          var out = '';
          for (var i = 0; i < s.length; i++) if (OK[s.charCodeAt(i)]) out += s.charAt(i);
          return out;
        }
        // Widths without kerning, because pdf-lib draws text without kerning.
        var WCACHE = {};
        function textW(font, s, size) {
          var key = font === F.bold ? 'b' : font === F.it ? 'i' : 'r', w = 0;
          for (var i = 0; i < s.length; i++) {
            var k = key + s.charAt(i);
            if (WCACHE[k] === undefined) WCACHE[k] = font.widthOfTextAtSize(s.charAt(i), 1000);
            w += WCACHE[k];
          }
          return w * size / 1000;
        }
        function newPage() {
          page = doc.addPage([W, H]);
          pages.push(page);
          y = pages.length === 1 ? 46 : 54;
          if (pages.length > 1) page.drawText(safe('My local energy skills roadmap · ' + summaryText().split(' · ')[0]), { x: M, y: H - 32, size: 7.5, font: F.reg, color: C.muted });
        }
        function ensure(h) { if (y + h > LIMIT) newPage(); }
        function shape(path, x, top, fill, border, scale) {
          var o = { x: x, y: H - top, color: fill };
          if (border) { o.borderColor = border; o.borderWidth = 1; }
          if (scale) o.scale = scale;
          page.drawSvgPath(path, o);
        }
        function slash(x, top, w, h, color) {
          var off = h * 0.5095;
          shape('M ' + off + ' 0 L ' + (w + off) + ' 0 L ' + w + ' ' + h + ' L 0 ' + h + ' Z', x, top, color);
        }
        function box(x, top, w, h, r, fill, border) {
          shape('M ' + r + ' 0 H ' + (w - r) + ' Q ' + w + ' 0 ' + w + ' ' + r + ' V ' + (h - r) + ' Q ' + w + ' ' + h + ' ' + (w - r) + ' ' + h +
            ' H ' + r + ' Q 0 ' + h + ' 0 ' + (h - r) + ' V ' + r + ' Q 0 0 ' + r + ' 0 Z', x, top, fill, border);
        }
        function addLink(x1, y1, x2, y2, url) {
          var ctx = doc.context;
          var ref = ctx.register(ctx.obj({ Type: 'Annot', Subtype: 'Link', Rect: [x1, y1, x2, y2], Border: [0, 0, 0], A: { Type: 'Action', S: 'URI', URI: L.PDFString.of(url) } }));
          var annots = page.node.Annots();
          if (annots) annots.push(ref); else page.node.set(L.PDFName.of('Annots'), ctx.obj([ref]));
        }
        // Text comes in runs: {t: text, f: font, c: colour, u: link}. Runs are separate words;
        // a no-break space keeps two words together on one line.
        function wrap(runs, size, width) {
          var words = [];
          runs.forEach(function (r) {
            String(r.t).split(/[ \t\r\n]+/).forEach(function (t) { t = safe(t); if (t) words.push({ t: t, f: r.f || F.reg, c: r.c || null, u: r.u || null }); });
          });
          var sp = textW(F.reg, ' ', size), lines = [], cur = [], curW = 0;
          words.forEach(function (wd) {
            var ww = textW(wd.f, wd.t, size);
            if (ww > width) { // a long web address: break it after a slash or hyphen if possible
              if (cur.length) { lines.push(cur); cur = []; }
              var t = wd.t;
              while (textW(wd.f, t, size) > width) {
                var cut = t.length - 1;
                while (cut > 1 && textW(wd.f, t.slice(0, cut), size) > width) cut--;
                var p = t.lastIndexOf('/', cut - 1);
                if (p + 1 < cut / 2) p = t.lastIndexOf('-', cut - 1);
                if (p + 1 >= cut / 2) cut = p + 1;
                lines.push([{ t: t.slice(0, cut), f: wd.f, c: wd.c, u: wd.u }]);
                t = t.slice(cut);
              }
              cur = [{ t: t, f: wd.f, c: wd.c, u: wd.u }];
              curW = textW(wd.f, t, size);
              return;
            }
            if (cur.length && curW + sp + ww > width) { lines.push(cur); cur = []; curW = 0; }
            curW = cur.length ? curW + sp + ww : ww;
            cur.push(wd);
          });
          if (cur.length) lines.push(cur);
          return lines;
        }
        function drawLine(line, x, size, color, lhF) {
          var sp = textW(F.reg, ' ', size), segs = [];
          line.forEach(function (w) {
            var last = segs[segs.length - 1];
            if (last && last.f === w.f && last.c === w.c && last.u === w.u) last.t += ' ' + w.t;
            else segs.push({ t: w.t, f: w.f, c: w.c, u: w.u });
          });
          var base = H - (y + size * (lhF / 2 + 0.25));
          segs.forEach(function (s) {
            var tw = textW(s.f, s.t, size);
            page.drawText(s.t, { x: x, y: base, size: size, font: s.f, color: s.c || color });
            if (s.u) {
              page.drawLine({ start: { x: x, y: base - 1.8 }, end: { x: x + tw, y: base - 1.8 }, thickness: 0.9, color: C.amberDark });
              addLink(x, base - 3, x + tw, base + size * 0.8, s.u);
            }
            x += tw + sp;
          });
        }
        // A row is wrapped text ready to draw; blocks of rows are measured first so they never split.
        function row(runs, o) {
          o = o || {};
          var size = o.size || 10, indent = o.indent || 0;
          return { lines: wrap(typeof runs === 'string' ? [{ t: runs, f: o.font }] : runs, size, (o.width || CW) - indent), size: size, lhF: o.lh || 1.4, indent: indent, color: o.color || C.text, after: o.after || 0, bullet: !!o.bullet };
        }
        function height(rows) { return rows.reduce(function (h, r) { return h + r.lines.length * r.size * r.lhF + r.after; }, 0); }
        function draw(rows, x0) {
          rows.forEach(function (r) {
            if (r.lines.length > 1 && r.lines.length <= 4) ensure(r.lines.length * r.size * r.lhF); // keep short wrapped rows on one page
            r.lines.forEach(function (ln, i) {
              ensure(r.size * r.lhF);
              if (i === 0 && r.bullet) slash(x0 + r.indent - 10, y + r.size * (r.lhF / 2 - 0.3), 2.6, r.size * 0.62, C.amberDark);
              drawLine(ln, x0 + r.indent, r.size, r.color, r.lhF);
              y += r.size * r.lhF;
            });
            y += r.after;
          });
        }
        function para(runs, o) { draw([row(runs, o)], M); }
        function keep(rows) { ensure(height(rows)); draw(rows, M); }
        var PAD = 12;
        function cardHeight(rows) { return height(rows) - rows[rows.length - 1].after + PAD * 2; }
        function cardAt(rows, x, w, h, fill, border) { // draws at the current y and leaves y unchanged
          var top = y;
          box(x, top, w, h, 7, fill, border);
          y = top + PAD;
          draw(rows, x + PAD);
          y = top;
        }
        function card(rows, fill, border, after) {
          var h = cardHeight(rows);
          ensure(h + after);
          cardAt(rows, M, CW, h, fill, border);
          y += h + after;
        }
        function label(text, o) {
          o = o || {};
          return row([{ t: text, f: F.bold, c: C.muted }], { size: 8.5, width: o.width, after: 2 });
        }
        function heading(text, next) {
          ensure(Math.max(90, 35 + (next || 0))); // keep a heading with what follows it
          y += 8;
          slash(M, y + 2, 5, 15, C.amber);
          page.drawText(safe(text), { x: M + 16, y: H - (y + 15), size: 15, font: F.bold, color: C.ink });
          y += 27;
        }
        function linkRows(list, o) {
          return list.map(function (l) { return row([{ t: l[0] + ':', f: F.bold }, { t: shortUrl(l[1]), u: l[1] }], o); });
        }
        function domList(sel) {
          return listItems(sel).map(function (li) {
            var links = Array.prototype.slice.call(li.querySelectorAll('a')).map(function (a) { return [a.textContent.trim(), a.href]; });
            var c = li.cloneNode(true), tail = c.lastElementChild;
            // A link at the end of a "Good to know" item is a source label, not part of the sentence.
            if (tail && tail.tagName === 'A' && !tail.nextSibling) c.removeChild(tail);
            return { text: c.textContent.replace(/\s+/g, ' ').trim(), links: links };
          });
        }
        function qrPath() {
          var d = '';
          qrRows().forEach(function (bits, r) {
            var c = 0;
            while (c < bits.length) {
              if (bits.charAt(c) !== '1') { c++; continue; }
              var s = c;
              while (c < bits.length && bits.charAt(c) === '1') c++;
              d += 'M ' + s + ' ' + r + ' L ' + c + ' ' + r + ' L ' + c + ' ' + (r + 1) + ' L ' + s + ' ' + (r + 1) + ' Z ';
            }
          });
          return d;
        }

        return L.PDFDocument.create().then(function (d) {
          doc = d;
          var logo = logoBytes;
          return Promise.all([doc.embedFont(L.StandardFonts.Helvetica), doc.embedFont(L.StandardFonts.HelveticaBold), doc.embedFont(L.StandardFonts.HelveticaOblique), logo ? doc.embedPng(logo).catch(function () { return null; }) : null]);
        }).then(function (fonts) {
          F.reg = fonts[0]; F.bold = fonts[1]; F.it = fonts[2];
          F.reg.getCharacterSet().forEach(function (c) { OK[c] = true; });
          var today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

          // The two-page summary: the four jobs first, then the timeline, next steps, words, advice and the QR code.
          // "level" tightens the layout (1: timeline without details, 2: no word list) if a roadmap would run to a third page.
          function summaryPages(logoImg) {
            newPage();
            if (logoImg) { var lw = 84, lh = lw * logoImg.height / logoImg.width; page.drawImage(logoImg, { x: W - M - lw, y: H - y - lh, width: lw, height: lh }); }
            slash(M, y, 6, 16, C.amber);
            slash(M + 11, y, 6, 16, C.amber);
            y += 26;
            para([{ t: 'My local energy skills roadmap', f: F.bold, c: C.ink }], { size: 20, lh: 1.2, after: 3, width: CW - 100 });
            para(summaryText().split(' · ').join(DOT), { size: 10, after: 4 });
            para([{ t: 'Made on ' + today + '. To change your answers or see more, open' }, { t: shortUrl(CONFIG.toolUrl), u: CONFIG.toolUrl }], { size: 8.5, color: C.muted, after: 8 });

            var GAP = 10, colW = (CW - GAP) / 2, w = colW - PAD * 2;
            function jobRowsS(r) {
              var j = r.job, rows = [];
              rows.push(row([{ t: j.name, f: F.bold, c: C.ink }], { size: 11.5, lh: 1.3, width: w, after: 1 }));
              rows.push(row([{ t: money(j.pay[0]) + ' to ' + money(j.pay[1]), f: F.bold, c: C.ink }, { t: 'a year' }], { size: 8.5, width: w, after: 4 }));
              rows.push(row(j.what, { size: 8.5, width: w, after: 5 }));
              if (r.im.length) rows.push(row([{ t: 'Why it fits:', f: F.bold }, { t: r.im.map(function (id) { return INT[id].label; }).join(DOT) }], { size: 8.5, width: w, after: 5 }));
              var tg = topicGroups(r);
              if (tg.length) {
                var tr = [{ t: 'GCSE topics:', f: F.bold }];
                tg.forEach(function (g, gi) { tr.push({ t: g.k + ':', c: C.ink }); tr.push({ t: g.t.join(DOT) + (gi < tg.length - 1 ? ';' : '') }); });
                rows.push(row(tr, { size: 8.5, width: w, after: 5 }));
              }
              rows.push(label('Ways in', { width: w }));
              j.routes.slice(0, 2).forEach(function (x) { rows.push(row([{ t: x.k + ':', f: F.bold }, { t: x.v }], { size: 8.5, width: w, indent: 10, bullet: true, after: 1.5 })); });
              rows[rows.length - 1].after = 5;
              rows.push(row([{ t: 'Full job profile', u: j.url, f: F.bold }], { size: 8.5, width: w }));
              return rows;
            }
            heading('Jobs that fit you');
            para('Pay is for a year, from starting pay to experienced. The website shows every way in for each job.', { size: 8, color: C.muted, after: 6 });
            for (var i = 0; i < currentTop.length; i += 2) {
              var left = jobRowsS(currentTop[i]), right = currentTop[i + 1] ? jobRowsS(currentTop[i + 1]) : null;
              var ch = Math.max(cardHeight(left), right ? cardHeight(right) : 0);
              ensure(ch + GAP);
              cardAt(left, M, colW, ch, C.card, C.cardLine);
              if (right) cardAt(right, M + colW + GAP, colW, ch, C.card, C.cardLine);
              y += ch + GAP;
            }

            var items = timelineItems();
            if (items.length) {
              heading('Your timeline');
              items.forEach(function (it) {
                var rs = [row([{ t: it.date + ':', f: F.bold, c: C.muted }, { t: it.title, f: F.bold, c: C.ink }], { size: 9.5, indent: 12, bullet: true, after: level >= 1 ? 3 : 1 })];
                if (level < 1) rs.push(row(it.detail, { size: 8.5, indent: 12, after: 4 }));
                keep(rs);
              });
            }
            if (state.y) {
              heading('What to do next');
              NEXT[state.y].forEach(function (t) { para(plain(t), { size: 9.5, indent: 12, bullet: true, after: 3 }); });
            }
            if (NEAR[area]) {
              heading('Near you: ' + NEAR_NAMES[area]);
              NEAR[area].forEach(function (n) { keep([row([{ t: n.name + ':', f: F.bold }, { t: shortUrl(n.url), u: n.url }], { size: 9, indent: 12, bullet: true, after: 2.5 })]); });
            }
            var used = roadmapWords();
            if (used.length && level < 2) {
              heading('Words explained');
              used.forEach(function (wd) { keep([row([{ t: wd.t + ':', f: F.bold }, { t: wd.d }], { size: 8.5, indent: 12, bullet: true, after: 2.5 })]); });
            }

            // Talk it through (official services) beside the QR code back to the tool
            var QR = 76, rightW = QR + PAD * 2, leftW = CW - rightW - 10, iw = leftW - PAD * 2;
            var adv = [
              row([{ t: 'Use this to explore, then talk to your careers adviser before you choose.', f: F.bold, c: C.ink }], { size: 10, width: iw, after: 3 }),
              row('Courses, grades and pay can change. Information checked ' + D.checked + '. Your school or college careers adviser is the best place to start. Free official careers services:', { size: 8.5, width: iw, after: 3 })
            ];
            ADVICE.filter(function (a) { return a.kind !== 'route'; }).forEach(function (a) { adv.push(row([{ t: a.where + ':', f: F.bold }, { t: shortUrl(a.url), u: a.url }], { size: 8.5, width: iw, indent: 10, bullet: true, after: 1.5 })); });
            var bh = Math.max(cardHeight(adv), QR + PAD * 2 + 14);
            ensure(bh + 34);
            y += 8;
            var top = y;
            cardAt(adv, M, leftW, bh, C.note, C.noteLine);
            var bx = M + leftW + 10, qx = bx + PAD;
            box(bx, top, rightW, bh, 7, C.card, C.cardLine);
            box(qx - 3, top + PAD - 3, QR + 6, QR + 6, 4, C.white, C.cardLine);
            shape(qrPath(), qx, top + PAD, C.ink, null, QR / 33);
            addLink(qx, H - (top + PAD + QR), qx + QR, H - (top + PAD), CONFIG.toolUrl);
            y = top + PAD + QR + 5;
            draw([row('Scan to open it online', { size: 7.5, color: C.muted, width: QR + 4 })], qx);
            y = top + bh + 8;
            para('Made with the Sustainable Local Energy Skills Roadmap by Professor Vahid Vahidinasab, University of Salford. A guide, not personal careers advice. The full version, with every GCSE topic, is on the website.', { size: 7.5, color: C.muted });
          }

          if (mode === 'summary') summaryPages(fonts[3]);
          else {
          // Title and what this is
          newPage();
          if (fonts[3]) { var lw = 96, lh = lw * fonts[3].height / fonts[3].width; page.drawImage(fonts[3], { x: W - M - lw, y: H - y - lh, width: lw, height: lh }); }
          slash(M, y, 7, 18, C.amber);
          slash(M + 12, y, 7, 18, C.amber);
          y += 30;
          para([{ t: 'My local energy skills roadmap', f: F.bold, c: C.ink }], { size: 24, lh: 1.2, after: 6 });
          para(summaryText().split(' · ').join(DOT), { size: 11, after: 5 });
          para([{ t: 'Made on ' + today + ' with the Sustainable Local Energy Skills Roadmap, a free online tool that links GCSE topics to jobs in sustainable, local energy. Open it at' }, { t: shortUrl(CONFIG.toolUrl), u: CONFIG.toolUrl }, { t: 'to change your answers.' }], { size: 9, color: C.muted, after: 12 });

          // Guide, not advice, with the official services straight after
          var adv = [
            row([{ t: 'Use this to explore, then talk to your careers adviser before you choose.', f: F.bold, c: C.ink }], { size: 10.5, width: CW - 24, after: 3 }),
            row('Courses, grades and pay can change, and this roadmap does not know your own situation. Information checked ' + D.checked + '. Free official careers services:', { size: 9, width: CW - 24, after: 4 })
          ];
          ADVICE.filter(function (a) { return a.kind !== 'route'; }).forEach(function (a) { adv.push(row([{ t: a.where + ':', f: F.bold }, { t: a.name }, { t: shortUrl(a.url), u: a.url }], { size: 9, width: CW - 24, indent: 11, bullet: true, after: 1.5 })); });
          adv[adv.length - 1].after = 5;
          adv.push(label('Also useful in England', { width: CW - 24 }));
          ADVICE.filter(function (a) { return a.kind === 'route'; }).forEach(function (a) { adv.push(row([{ t: a.name + ':', f: F.bold }, { t: shortUrl(a.url), u: a.url }], { size: 9, width: CW - 24, indent: 11, bullet: true, after: 1.5 })); });
          card(adv, C.note, C.noteLine, 6);

          // Jobs, two cards to a row like the page
          var GAP = 12, colW = (CW - GAP) / 2;
          function jobRows(r) {
            var j = r.job, w = colW - PAD * 2, rows = [];
            rows.push(row([{ t: j.name, f: F.bold, c: C.ink }], { size: 12.5, lh: 1.3, width: w, after: j.alt ? 0 : 2 }));
            if (j.alt) rows.push(row(j.alt, { size: 8, color: C.muted, width: w, after: 3 }));
            if (j.roles && j.roles.length) rows.push(row(j.roles.map(function (k) { return { t: ROLES[k] + (k === j.roles[j.roles.length - 1] ? '' : ' ·'), f: F.bold, c: k === 'repair' ? C.green : C.muted }; }), { size: 8, width: w, after: 4 }));
            rows.push(row([{ t: money(j.pay[0]) + ' to ' + money(j.pay[1]), f: F.bold, c: C.ink }, { t: 'a year' }], { size: 10, width: w, after: 0 }));
            rows.push(row('From starting pay to experienced', { size: 8, color: C.muted, width: w, after: 4 }));
            rows.push(row(j.what, { size: 9, width: w, after: 5 }));
            if (j.day) rows.push(row([{ t: 'A day might include', f: F.bold }, { t: j.day }], { size: 8.5, width: w, after: 5 }));
            if (j.skills) rows.push(row([{ t: 'Skills you use:', f: F.bold }, { t: j.skills.join(DOT) }], { size: 8.5, width: w, after: 7 }));
            if (r.im.length) {
              rows.push(label('Why it fits', { width: w }));
              rows.push(row(r.im.map(function (id) { return INT[id].label; }).join(DOT), { size: 9, width: w, after: 7 }));
            }
            var tg = topicGroups(r);
            if (tg.length) {
              rows.push(label('GCSE topics it uses', { width: w }));
              tg.forEach(function (g) { rows.push(row([{ t: g.k + ':', f: F.bold }, { t: g.t.join(DOT) }], { size: 9, width: w, indent: 11, bullet: true, after: 2 })); });
              rows[rows.length - 1].after = 7;
            }
            rows.push(label('Ways in', { width: w }));
            j.routes.forEach(function (x) { rows.push(row([{ t: x.k + ':', f: F.bold }, { t: x.v }], { size: 9, width: w, indent: 11, bullet: true, after: 2 })); });
            rows[rows.length - 1].after = 7;
            rows.push(row([{ t: 'Full profile:', f: F.bold }, { t: shortUrl(j.url), u: j.url }], { size: 8.5, width: w }));
            return rows;
          }
          var firstRow = currentTop.length ? Math.max(cardHeight(jobRows(currentTop[0])), currentTop[1] ? cardHeight(jobRows(currentTop[1])) : 0) : 0;
          heading('Jobs that fit you', firstRow + GAP);
          for (var i = 0; i < currentTop.length; i += 2) {
            var left = jobRows(currentTop[i]), right = currentTop[i + 1] ? jobRows(currentTop[i + 1]) : null;
            var ch = Math.max(cardHeight(left), right ? cardHeight(right) : 0);
            ensure(ch + GAP);
            cardAt(left, M, colW, ch, C.card, C.cardLine);
            if (right) cardAt(right, M + colW + GAP, colW, ch, C.card, C.cardLine);
            y += ch + GAP;
          }

          // Timeline
          var items = timelineItems();
          if (items.length) {
            heading('Your timeline');
            var dots = [];
            items.forEach(function (it) {
              var rows = [
                row([{ t: it.date, f: F.bold }], { size: 8.5, color: C.muted, indent: 20, after: 1 }),
                row([{ t: it.title, f: F.bold, c: C.ink }], { size: 10.5, lh: 1.3, indent: 20, after: 1 }),
                row(it.detail, { size: 9.5, indent: 20, after: 10 })
              ];
              ensure(height(rows));
              dots.push({ page: page, y: y + 5.5, cls: it.cls || '' });
              draw(rows, M);
            });
            dots.forEach(function (d, i) {
              var next = dots[i + 1];
              if (next && next.page === d.page) d.page.drawLine({ start: { x: M + 6, y: H - (d.y + 7) }, end: { x: M + 6, y: H - (next.y - 7) }, thickness: 1.2, color: C.cardLine });
              var fill = d.cls === 'now' ? C.amber : d.cls === 'ctx' ? C.green : C.white;
              d.page.drawCircle({ x: M + 6, y: H - d.y, size: 4.5, color: fill, borderColor: d.cls === 'now' ? C.ink : d.cls === 'ctx' ? C.green : C.muted, borderWidth: d.cls ? 1.1 : 1.6 });
            });
          }

          // Topics
          heading('GCSE topics to look out for');
          para('From the Department for Education’s subject content for each GCSE in England. Exam boards add detail, so your course may cover more.', { size: 9, color: C.muted, after: 10 });
          var subs = chosenSubjects();
          subs.filter(function (s) { return !SUBJ[s].core; }).concat(subs.filter(function (s) { return SUBJ[s].core; })).forEach(function (s) {
            var list = TOPICS.filter(function (t) { return t.s === s && (!t.triple || state.sci === 'separate'); });
            if (!list.length) return;
            list.forEach(function (t, i) {
              var rows = [];
              if (i === 0) rows.push(row([{ t: subjLabel(s), f: F.bold, c: C.ink }, { t: '(' + list.length + ' topics)', c: C.muted }], { size: 12, lh: 1.3, after: 5 }));
              rows.push(row([{ t: t.t, f: F.bold, c: C.ink }].concat(t.triple ? [{ t: '(separate ' + t.triple + ' only)', c: C.muted }] : []), { size: 10, lh: 1.35, indent: 12, bullet: true, after: 1 }));
              rows.push(row(t.use, { size: 9.5, indent: 12, after: 2 }));
              t.q.forEach(function (q) { rows.push(row([{ t: 'The course says:', f: F.bold, c: C.muted }, { t: '“' + q + '”', f: F.it, c: C.muted }], { size: 8.8, indent: 12, after: 1 })); });
              if (t.note) rows.push(row(t.note, { size: 8.5, color: C.muted, indent: 12, after: 1 }));
              rows.push(row([{ t: 'Used by:', f: F.bold }, { t: t.jobs.filter(function (id) { return JOB[id]; }).map(function (id) { return JOB[id].name; }).join(', ') }], { size: 8.5, indent: 12, after: 9 }));
              keep(rows);
            });
            var src = [[SUBJ[s].srcLabel + ', Department for Education', SUBJ[s].src]];
            if (s === 'science' && state.sci === 'separate') src.push([SEPARATE_SRC.label + ', Department for Education', SEPARATE_SRC.url]);
            draw(linkRows(src, { size: 8, color: C.muted, after: 2 }), M);
            y += 10;
          });

          // Next steps, for parents, good to know
          if (state.y) {
            heading('What to do next');
            var useful = [];
            NEXT[state.y].forEach(function (t) {
              para(plain(t), { size: 10, indent: 12, bullet: true, after: 5 });
              useful = useful.concat(anchorsIn(t));
            });
            if (useful.length) draw(linkRows(useful, { size: 8.5, indent: 12, after: 2 }), M);
            y += 6;
          }
          if (NEAR[area]) {
            heading('Near you: ' + NEAR_NAMES[area]);
            NEAR[area].forEach(function (n) { keep([row([{ t: n.name + ':', f: F.bold }, { t: n.what }], { size: 9.5, indent: 12, bullet: true, after: 1 }), row([{ t: shortUrl(n.url), u: n.url }], { size: 8.5, indent: 12, after: 5 })]); });
          }
          var parentRows = [label('For parents and carers', { width: CW - 24 })];
          domList(D.parents).forEach(function (it) {
            parentRows.push(row(it.text, { size: 9.5, width: CW - 24, indent: 12, bullet: true, after: 3 }));
            if (it.links.length) linkRows(it.links, { size: 8.5, width: CW - 24, indent: 12, after: 3 }).forEach(function (r) { parentRows.push(r); });
          });
          card(parentRows, C.card, C.cardLine, 6);

          heading('Good to know');
          domList(D.goodToKnow).forEach(function (it) {
            keep([row(it.text, { size: 9.5, indent: 12, bullet: true, after: 1 })].concat(linkRows(it.links.map(function (l) { return ['Read more', l[1]]; }), { size: 8, color: C.muted, indent: 12, after: 6 })));
          });

          var used = roadmapWords();
          if (used.length) {
            heading('Words explained');
            used.forEach(function (wd) { keep([row([{ t: wd.t + ':', f: F.bold }, { t: wd.d }], { size: 9.5, indent: 12, bullet: true, after: 4 })]); });
          }

          // Back to the online tool: QR code, and the research when it is published
          var QR = 92, qx = M + PAD, onlineW = CW - PAD * 3 - QR;
          var online = [
            row([{ t: 'Open your roadmap online', f: F.bold, c: C.ink }], { size: 12, lh: 1.3, width: onlineW, after: 4 }),
            row('Scan the code with a phone camera to open the Sustainable Local Energy Skills Roadmap, change your answers and make a new roadmap. It is free and needs no account.', { size: 9.5, width: onlineW, after: 4 }),
            row([{ t: shortUrl(CONFIG.toolUrl), u: CONFIG.toolUrl, f: F.bold }], { size: 9.5, width: onlineW, after: 6 })
          ];
          if (CONFIG.articleUrl) online.push(row([{ t: 'Read the article in The Conversation:', f: F.bold }, { t: '“Vocational GCSEs won’t arrive until 2029 – but clean energy skills can be found in the curriculum now”', u: CONFIG.articleUrl }], { size: 9, width: onlineW, after: 2 }));
          if (paperUrl()) online.push(row([{ t: 'Read the paper:', f: F.bold }, { t: shortUrl(paperUrl()), u: paperUrl() }], { size: 9, width: onlineW, after: 2 }));
          var oh = Math.max(height(online) + PAD * 2, QR + PAD * 2);
          ensure(oh + 30);
          y += 14;
          var otop = y;
          box(M, otop, CW, oh, 7, C.card, C.cardLine);
          box(qx - 4, otop + PAD - 4, QR + 8, QR + 8, 4, C.white, C.cardLine);
          shape(qrPath(), qx, otop + PAD, C.ink, null, QR / 33);
          addLink(qx, H - (otop + PAD + QR), qx + QR, H - (otop + PAD), CONFIG.toolUrl);
          y = otop + PAD;
          draw(online, M + PAD * 2 + QR);
          y = otop + oh + 8;

          // About and sources
          heading('About this roadmap');
          para('Developed by Professor Vahid Vahidinasab, Chair in Sustainability and Academic Research Lead at the Centre for Sustainable Innovation (CSI), University of Salford.', { size: 9.5, after: 2 });
          draw(linkRows([['Staff profile', PROFILE_URL]], { size: 9.5, after: 6 }), M);
          para('Information checked in ' + D.checked + ' against Department for Education subject content, GOV.UK and the official careers website for England (formerly the National Careers Service). Pay figures are the typical yearly pay on each job’s official profile, from starter to experienced. This roadmap is advisory only and is not personal careers advice. Schools offer different subjects and exam boards, so check your choices with your school and a careers adviser.', { size: 9.5, after: 4 });
          para('© 2026 Vahid Vahidinasab. All rights reserved. Schools, teachers and families may print, copy and share this roadmap for non-commercial education.', { size: 8.5, color: C.muted, after: 10 });
          var srcRows = linkRows(SOURCES, { size: 8, after: 2 });
          keep([row([{ t: 'Sources', f: F.bold, c: C.ink }], { size: 10, after: 3 }), srcRows[0]]);
          draw(srcRows.slice(1), M);
          }

          // A summary that would run to a third page is rebuilt more tightly.
          if (mode === 'summary' && pages.length > 2 && level < 2) return buildPdf(L, mode, level + 1);

          // Footer on every page
          pages.forEach(function (p, i) {
            p.drawLine({ start: { x: M, y: 46 }, end: { x: W - M, y: 46 }, thickness: 0.75, color: C.cardLine });
            p.drawText(safe('Sustainable Local Energy Skills Roadmap · ' + shortUrl(CONFIG.toolUrl) + ' · A guide, not advice'), { x: M, y: 32, size: 7, font: F.reg, color: C.muted });
            var pn = 'Page ' + (i + 1) + ' of ' + pages.length;
            p.drawText(pn, { x: W - M - textW(F.reg, pn, 7), y: 32, size: 7, font: F.reg, color: C.muted });
          });

          doc.setTitle('My local energy skills roadmap' + (mode === 'full' ? ', full version' : ''));
          doc.setAuthor('Sustainable Local Energy Skills Roadmap');
          doc.setSubject('A personal roadmap from GCSE topics to jobs in sustainable, local energy');
          doc.setCreator('Sustainable Local Energy Skills Roadmap, ' + CONFIG.toolUrl);
          doc.setProducer('Sustainable Local Energy Skills Roadmap');
          if (doc.setLanguage) doc.setLanguage('en-GB');
          return doc.save();
        });
      }

      // ---------- Visit counter (once it is set up) ----------
      // Visits are counted only on the live site, so previews and local copies do not add to the totals.
    }
  };
})(window.SLES);
