(function(){
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  document.getElementById('yr').textContent = new Date().getFullYear();

  /* ---------- mobile menu ---------- */
  var nav = document.querySelector('.nav');
  var toggle = nav && nav.querySelector('.nav-toggle');
  function setMenu(open){
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if(toggle){
    toggle.addEventListener('click', function(){ setMenu(!nav.classList.contains('open')); });
    nav.querySelectorAll('.nav-links a').forEach(function(a){ a.addEventListener('click', function(){ setMenu(false); }); });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && nav.classList.contains('open')){ setMenu(false); toggle.focus(); }
    });
    document.addEventListener('click', function(e){
      if(nav.classList.contains('open') && !nav.contains(e.target)) setMenu(false);
    });
    var wide = window.matchMedia('(min-width: 981px)');
    if(wide.addEventListener) wide.addEventListener('change', function(m){ if(m.matches) setMenu(false); });
  }

  /* ---------- highlight the nav link for the section in view ---------- */
  if(nav && hasIO){
    var links = {};
    nav.querySelectorAll('.nav-links a[href^="#"]').forEach(function(a){ links[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        var a = links[e.target.id];
        if(!a) return;
        if(e.isIntersecting){
          Object.keys(links).forEach(function(k){ links[k].classList.remove('is-active'); });
          a.classList.add('is-active');
        } else {
          a.classList.remove('is-active');
        }
      });
    }, {rootMargin:'-40% 0px -55% 0px'});
    Object.keys(links).forEach(function(id){ var s = document.getElementById(id); if(s) spy.observe(s); });
  }

  /* ---------- animated counters (the HTML holds the real figures; we count up to them) ---------- */
  function fmt(n){ return n.toLocaleString('en-GB'); }
  var counters = [].slice.call(document.querySelectorAll('#stats .num[data-target]'));
  function animateCounter(el){
    var target = parseFloat(el.getAttribute('data-target'));
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = 1500, start = performance.now();
    function frame(now){
      var p = Math.min((now-start)/dur, 1);
      var eased = 1 - Math.pow(1-p, 3);
      el.textContent = prefix + fmt(Math.round(target * eased)) + suffix;
      if(p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  var statsBox = document.getElementById('stats');
  if(statsBox && hasIO && !reduce){
    counters.forEach(function(el){
      el.textContent = (el.getAttribute('data-prefix') || '') + '0' + (el.getAttribute('data-suffix') || '');
    });
    var statObs = new IntersectionObserver(function(entries){
      if(entries.some(function(e){ return e.isIntersecting; })){
        statObs.disconnect();
        counters.forEach(animateCounter);
      }
    }, {threshold:.4});
    statObs.observe(statsBox);
  }

  /* ---------- scroll reveal ---------- */
  var reveals = [].slice.call(document.querySelectorAll('.reveal'));
  function revealAll(){ reveals.forEach(function(el){ el.classList.add('in'); }); }
  if(hasIO){
    var revObs = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add('in'); revObs.unobserve(e.target); }
      });
    }, {threshold:.12, rootMargin:'0px 0px -40px 0px'});
    reveals.forEach(function(el){ revObs.observe(el); });
  } else {
    revealAll();
  }
  // printing or saving as PDF should always include every section
  window.addEventListener('beforeprint', function(){
    revealAll();
    document.querySelectorAll('img[loading="lazy"]').forEach(function(img){ img.loading = 'eager'; });
    counters.forEach(function(el){
      el.textContent = (el.getAttribute('data-prefix') || '') + fmt(parseFloat(el.getAttribute('data-target'))) + (el.getAttribute('data-suffix') || '');
    });
  });

  /* ---------- card hover glow follows cursor ---------- */
  document.querySelectorAll('.card').forEach(function(card){
    card.addEventListener('pointermove', function(ev){
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (ev.clientX - r.left) + 'px');
    });
  });

  /* ---------- hero market/frequency trace ---------- */
  var W = 1200, H = 320, pts = 46, base = H*0.60, amp = H*0.30;
  var ys = [];
  // deterministic-ish jagged curve resembling a settlement-period price / load trace
  var seed = 7;
  function rnd(){ seed = (seed*9301+49297) % 233280; return seed/233280; }
  var trend = 0;
  for(var i=0;i<=pts;i++){
    trend += (rnd()-0.5)*0.5;
    trend = Math.max(-1, Math.min(1, trend));
    var spike = rnd() > 0.86 ? (rnd()-0.5)*1.4 : 0;
    var wave = Math.sin(i/3.1)*0.35 + Math.sin(i/1.3)*0.18;
    var v = base - (trend*0.55 + wave*0.5 + spike) * amp * 0.5;
    ys.push(Math.max(H*0.12, Math.min(H*0.9, v)));
  }
  function xAt(i){ return (i/pts)*W; }
  var d = 'M ' + xAt(0).toFixed(1) + ' ' + ys[0].toFixed(1);
  for(var j=1;j<ys.length;j++){ d += ' L ' + xAt(j).toFixed(1) + ' ' + ys[j].toFixed(1); }
  var path = document.getElementById('tracePath');
  var fillPath = document.getElementById('traceFillPath');
  var dot = document.getElementById('traceDot');
  if(path){
    path.setAttribute('d', d);
    fillPath.setAttribute('d', d + ' L ' + W + ' ' + H + ' L 0 ' + H + ' Z');
    if(!reduce){
      var len = path.getTotalLength();
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;
      path.animate(
        [{strokeDashoffset:len},{strokeDashoffset:0}],
        {duration:2200, easing:'cubic-bezier(.16,1,.3,1)', fill:'forwards'}
      );
      // travelling readout dot; it only runs while the hero is on screen
      var t0 = null, travel = 5200, rafId = null, heroVisible = true, dotReady = false;
      function moveDot(ts){
        if(t0===null) t0 = ts;
        var p = ((ts - t0) % travel) / travel;
        var pt = path.getPointAtLength(p * len);
        dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
        dot.style.opacity = 1;
        rafId = requestAnimationFrame(moveDot);
      }
      function startDot(){ if(dotReady && heroVisible && rafId === null) rafId = requestAnimationFrame(moveDot); }
      function stopDot(){ if(rafId !== null){ cancelAnimationFrame(rafId); rafId = null; } }
      setTimeout(function(){ dotReady = true; startDot(); }, 2000);
      var hero = document.querySelector('.hero');
      if(hero && hasIO){
        new IntersectionObserver(function(entries){
          heroVisible = entries[entries.length-1].isIntersecting;
          if(heroVisible) startDot(); else stopDot();
        }).observe(hero);
      }
    }
  }
  /* ---------- carousels (Selected publications / Books) ---------- */
  document.querySelectorAll('.carousel').forEach(function(car){
    var track=car.querySelector('.carousel-track');
    var prev=car.querySelector('.cbtn.prev'), next=car.querySelector('.cbtn.next');
    var fill=car.querySelector('.carousel-prog span');
    function step(){var c=track.querySelector('.artcard');return c?c.getBoundingClientRect().width+16:280;}
    function update(){
      var max=track.scrollWidth-track.clientWidth;
      var ratio=max>0?track.scrollLeft/max:0;
      var vis=track.scrollWidth>0?(track.clientWidth/track.scrollWidth):1;
      var w=Math.max(14,Math.min(100,vis*100));
      if(fill){fill.style.width=w+'%';fill.style.marginLeft=(ratio*(100-w))+'%';}
      if(prev)prev.disabled=track.scrollLeft<=2;
      if(next)next.disabled=track.scrollLeft>=max-2;
    }
    if(prev)prev.addEventListener('click',function(){track.scrollBy({left:-step(),behavior:'smooth'});});
    if(next)next.addEventListener('click',function(){track.scrollBy({left:step(),behavior:'smooth'});});
    track.addEventListener('scroll',update,{passive:true});
    window.addEventListener('resize',update);
    update();
  });

  /* ---------- news: filter by source ---------- */
  var nf = document.getElementById('news-filters'), room = document.getElementById('newsroom');
  if(nf && room){
    var nItems = [].slice.call(room.querySelectorAll('.news-item'));
    var nLead = room.querySelector('.news-lead'), nFeed = room.querySelector('.news-feed');
    nf.addEventListener('click', function(e){
      var b = e.target.closest('.nchip'); if(!b) return;
      var src = b.getAttribute('data-src');
      nf.querySelectorAll('.nchip').forEach(function(x){ x.classList.remove('active'); x.setAttribute('aria-pressed','false'); });
      b.classList.add('active'); b.setAttribute('aria-pressed','true');
      nItems.forEach(function(it){ it.hidden = !(src === 'all' || it.getAttribute('data-src') === src); });
      var feedShown = nItems.some(function(it){ return it !== nLead && !it.hidden; });
      nFeed.hidden = !feedShown;
      room.classList.toggle('no-lead', nLead.hidden);
      room.classList.toggle('no-feed', !feedShown);
    });
  }

})();
