(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const desktop = () => innerWidth > 900;

  /* Reveal on scroll, staggered inside the same parent */
  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      revealer.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .01 });
  $$('.r').forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains('r'));
    el.style.setProperty('--d', Math.min(sibs.indexOf(el), 5) * .07 + 's');
    revealer.observe(el);
  });

  /* Count-up numbers */
  const counter = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      counter.unobserve(e.target);
      if (reduced) return;
      const to = +e.target.dataset.to;
      const t0 = performance.now();
      const step = (t) => {
        const p = clamp((t - t0) / 1400);
        e.target.textContent = Math.round(to * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: .5 });
  $$('.n').forEach((n) => counter.observe(n));

  /* Hero: the search result climbing to position 1 */
  const serp = $('#serp');
  const queries = ['seo specialist in dhaka', 'wordpress seo developer', 'link building expert'];
  const rows = $$('#serpList li');
  const me = $('.me', serp);
  const others = rows.filter((r) => r !== me);
  let serpOn = true;
  const wait = (ms) => new Promise((res) => {
    const go = () => (serpOn ? setTimeout(res, ms) : setTimeout(go, 300));
    go();
  });
  const place = (myPos) => {
    let slot = 0;
    others.forEach((row) => {
      if (slot === myPos) slot++;
      row.style.setProperty('--pos', slot);
      $('u', row).textContent = slot + 1;
      slot++;
    });
    me.style.setProperty('--pos', myPos);
    $('u', me).textContent = myPos + 1;
  };
  place(3);
  (async () => {
    const q = $('#serpQ');
    if (reduced) { q.textContent = queries[0]; place(0); serp.classList.add('won'); return; }
    await wait(900);
    for (let i = 0; ; i = (i + 1) % queries.length) {
      serp.classList.remove('won');
      place(3);
      q.textContent = '';
      for (const ch of queries[i]) { q.textContent += ch; await wait(38); }
      await wait(450);
      for (let p = 2; p >= 0; p--) { place(p); await wait(760); }
      serp.classList.add('won');
      await wait(3000);
    }
  })();
  new IntersectionObserver(([e]) => { serpOn = e.isIntersecting; }).observe(serp);

  /* Link graph: real domains and DR values from the outreach sheets */
  const canvas = $('#graph');
  const ctx = canvas.getContext('2d');
  const domains = [['domino.com', 80], ['steelcase.com', 79], ['remodelista.com', 77], ['extraspace.com', 76], ['officernd.com', 76], ['stylebyemilyhenderson.com', 75], ['struxure.com', 63], ['dinnerlovestory.com', 62], ['whytile.com', 59], ['nextpcb.com', 52], ['brickandbatten.com', 51], ['blisslights.com', 44]];
  const nodes = domains.map(([name, dr], i) => ({ name, dr, a: i / domains.length * Math.PI * 2 + .35, born: i / domains.length }));
  let W = 0, H = 0, cx = 0, cy = 0, R = 0, right = 0, graphOn = false, graphP = 0, graphShown = 0;
  const sizeGraph = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const box = canvas.getBoundingClientRect();
    W = box.width; H = box.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    right = W;
    if (desktop()) {
      /* Keep the graph inside the same 1500px column as the page content */
      const inner = Math.min(W, 1500);
      right = (W + inner) / 2;
      cx = (W - inner) / 2 + inner * .67; cy = H * .53; R = Math.min(inner * .25, H * .42);
    } else { cx = W / 2; cy = H / 2; R = Math.min(W * .39, H * .4); }
  };
  const drawGraph = (t) => {
    if (graphOn) requestAnimationFrame(drawGraph);
    graphShown += (graphP - graphShown) * .08;
    ctx.clearRect(0, 0, W, H);
    const pulse = 1 + Math.sin(t / 700) * .06;
    const small = W < 620;
    ctx.font = (small ? '10px' : '12px') + ' "JetBrains Mono",monospace';
    let lit = 0;
    nodes.forEach((n, i) => {
      const a = n.a + t / 90000;
      const rr = R * (.62 + (100 - n.dr) / 100 * .85) * (i % 2 ? 1 : .94);
      const x = Math.min(right - 80, cx + Math.cos(a) * rr), y = cy + Math.sin(a) * rr * .86;
      const on = clamp((graphShown * 1.15 - n.born) * 7);
      if (on > .99) lit += n.dr;
      if (on > 0) {
        ctx.strokeStyle = `rgba(106,124,255,${.22 + on * .32})`;
        ctx.lineWidth = 1 + n.dr / 70;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (cx - x) * on, y + (cy - y) * on); ctx.stroke();
        for (let k = 0; k < 2 && on > .99; k++) {
          const f = ((t / (2600 - n.dr * 14)) + i * .37 + k * .5) % 1;
          ctx.fillStyle = '#ffc83d';
          ctx.beginPath(); ctx.arc(x + (cx - x) * f, y + (cy - y) * f, 2.1, 0, 7); ctx.fill();
        }
      }
      const r = (small ? 3 : 4) + n.dr / (small ? 18 : 12);
      ctx.fillStyle = on > 0 ? '#1a27f0' : '#20244f';
      ctx.strokeStyle = on > 0 ? '#8f9bff' : '#3a3e70';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = on > 0 ? '#fff' : '#6d7099';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `500 ${small ? 9 : 11}px "JetBrains Mono",monospace`;
      ctx.fillText(n.dr, x, y);
      if (!small || i % 2 === 0) {
        ctx.font = `${small ? 9.5 : 12}px "JetBrains Mono",monospace`;
        ctx.textBaseline = 'top';
        ctx.fillStyle = on > 0 ? '#d2d4ef' : '#55587f';
        ctx.fillText(n.name.length > 18 && small ? n.name.slice(0, 16) + '…' : n.name, x, y + r + 5);
      }
    });
    const core = (small ? 25 : 38) * pulse + lit / 200;
    const g = ctx.createRadialGradient(cx, cy, core * .3, cx, cy, core * 2.6);
    g.addColorStop(0, '#ffc83d66'); g.addColorStop(1, '#ffc83d00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, core * 2.6, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffc83d'; ctx.beginPath(); ctx.arc(cx, cy, core, 0, 7); ctx.fill();
    ctx.fillStyle = '#0a0c24'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `700 ${small ? 11 : 14}px Bricolage,sans-serif`;
    ctx.fillText('Your site', cx, cy);
  };
  new IntersectionObserver(([e]) => {
    const was = graphOn;
    graphOn = e.isIntersecting;
    if (graphOn && !was) { sizeGraph(); requestAnimationFrame(drawGraph); }
  }).observe(canvas);

  /* Horizontal websites section: pinned on desktop, swipeable on mobile */
  const sites = $('.sites');
  const pin = $('.sites-pin');
  const track = $('#track');
  const fill = $('#trackFill');
  const now = $('#siteNow');
  const cards = $$('.site', track);
  let travel = 0;
  const sizeSites = () => {
    if (desktop() && !reduced) {
      travel = Math.max(0, track.scrollWidth - innerWidth);
      sites.style.height = pin.offsetHeight + travel + 'px';
    } else {
      travel = 0;
      sites.style.height = '';
      track.style.transform = '';
    }
  };
  const setSite = (p) => {
    fill.parentElement.style.setProperty('--tp', Math.max(.08, p));
    now.textContent = String(Math.min(cards.length, Math.floor(p * cards.length) + 1)).padStart(2, '0');
  };
  track.addEventListener('scroll', () => {
    if (!travel) setSite(track.scrollLeft / Math.max(1, track.scrollWidth - track.clientWidth));
  }, { passive: true });
  new IntersectionObserver(([e], o) => {
    if (e.isIntersecting) { $$('img', track).forEach((i) => { i.loading = 'eager'; }); o.disconnect(); }
  }, { rootMargin: '100% 0px' }).observe(sites);

  /* Scroll driver: one rAF-throttled handler for everything scroll-linked */
  const crawl = $('.crawl');
  const nav = $('#nav');
  const pill = $('#rankpill');
  const rankN = $('#rankN');
  const links = $('.links');
  const steps = $$('#steps li');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = clamp(y / max);
    crawl.style.setProperty('--p', p);
    nav.classList.toggle('solid', y > innerHeight * .72);

    const rank = Math.max(1, Math.round(48 - 47 * clamp(p / .97)));
    rankN.textContent = '#' + rank;
    pill.classList.toggle('show', y > innerHeight * .6);
    pill.classList.toggle('top', rank === 1);

    const lb = links.getBoundingClientRect();
    if (desktop()) {
      const lp = clamp(-lb.top / Math.max(1, lb.height - innerHeight));
      graphP = lp;
      const idx = Math.min(steps.length - 1, Math.floor(lp * steps.length));
      steps.forEach((s, i) => s.classList.toggle('on', i === idx));
    } else {
      graphP = clamp((innerHeight - canvas.getBoundingClientRect().top) / (innerHeight * .9));
    }

    if (travel) {
      const sb = sites.getBoundingClientRect();
      const sp = clamp(-sb.top / travel);
      track.style.transform = `translate3d(${-sp * travel}px,0,0)`;
      setSite(sp);
    }
  };
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });

  const layout = () => { sizeSites(); if (graphOn) sizeGraph(); onScroll(); };
  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(layout, 120); });
  layout();
  if (document.fonts) document.fonts.ready.then(layout);

  /* Expertise fan */
  const blades = $$('.blade');
  blades.forEach((b) => {
    const open = () => blades.forEach((o) => o.classList.toggle('on', o === b));
    b.addEventListener('click', open);
    b.addEventListener('mouseenter', open);
  });

  /* Self-audit: every check reads the live page */
  const list = $('#auditList');
  const arc = $('#gaugeArc');
  const gaugeN = $('#gaugeN');
  const meta = (n) => $(`meta[name="${n}"]`)?.content || '';
  const checks = () => {
    const imgs = $$('img').filter((i) => i.id !== 'lbImg');
    const title = document.title.length;
    const desc = meta('description').length;
    const nav0 = performance.getEntriesByType('navigation')[0];
    const load = nav0 && nav0.domContentLoadedEventEnd ? Math.round(nav0.domContentLoadedEventEnd) : 0;
    return [
      ['Title between 30 and 65 characters', title >= 30 && title <= 65, title + ' chars'],
      ['Meta description between 120 and 160', desc >= 120 && desc <= 160, desc + ' chars'],
      ['Exactly one H1', $$('h1').length === 1, $$('h1').length + ' found'],
      ['Canonical URL set', !!$('link[rel=canonical]'), ''],
      ['Structured data present', !!$('script[type="application/ld+json"]'), 'JSON-LD'],
      ['Every image has alt text', imgs.every((i) => i.alt.trim()), imgs.length + ' images'],
      ['Image sizes set, to prevent layout shift', imgs.every((i) => i.getAttribute('width')), ''],
      ['Open Graph image set', !!$('meta[property="og:image"]'), ''],
      ['Mobile viewport and language set', !!meta('viewport') && !!document.documentElement.lang, ''],
      ['Page is indexable', !/noindex/.test(meta('robots')), ''],
      ['HTML ready in under 2 seconds', load > 0 && load < 2000, load ? (load / 1000).toFixed(2) + 's' : ''],
    ];
  };
  let runId = 0;
  const runAudit = async () => {
    const id = ++runId;
    const all = checks();
    list.textContent = '';
    arc.style.strokeDasharray = '0 100';
    let passed = 0;
    for (let i = 0; i < all.length; i++) {
      if (id !== runId) return;
      const [label, ok, note] = all[i];
      if (ok) passed++;
      const li = document.createElement('li');
      li.className = ok ? '' : 'no';
      const mark = document.createElement('i');
      mark.textContent = ok ? '✓' : '✕';
      li.append(mark, label);
      if (note) { const em = document.createElement('em'); em.textContent = note; li.append(em); }
      list.append(li);
      const score = Math.round(passed / all.length * 100);
      arc.style.strokeDasharray = score + ' 100';
      gaugeN.textContent = score;
      if (!reduced) await new Promise((r) => setTimeout(r, 170));
    }
  };
  new IntersectionObserver(([e], o) => {
    if (e.isIntersecting) { runAudit(); o.disconnect(); }
  }, { threshold: .3 }).observe($('#auditCard'));
  $('#rerun').addEventListener('click', runAudit);

  /* Site search palette, built from the page's own content */
  const palette = $('#palette');
  const palQ = $('#palQ');
  const palList = $('#palList');
  const index = [
    ...$$('main section[id], footer[id]').filter((s) => s.id !== 'top').map((s) => ({
      title: (s.querySelector('h2')?.textContent || s.id).trim(),
      sub: s.id,
      href: '#' + s.id,
      text: s.textContent.toLowerCase(),
    })),
    ...$$('.svc li').map((l) => ({ title: $('h3', l).textContent, sub: 'services', href: '#services', text: l.textContent.toLowerCase() })),
    ...$$('.case').map((c) => ({ title: $('h3', c).textContent, sub: 'proof', href: '#' + (c.id = c.id || 'case-' + $('h3', c).textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-')), text: c.textContent.toLowerCase() })),
    { title: 'See my developer portfolio', sub: 'talha-bin-saleh-dev.vercel.app', href: 'https://talha-bin-saleh-dev.vercel.app/', text: 'developer portfolio react next.js code' },
  ];
  let sel = 0;
  const renderPal = () => {
    const q = palQ.value.trim().toLowerCase();
    const inTitle = (i) => i.title.toLowerCase().includes(q);
    const hits = (q ? [...index.filter(inTitle), ...index.filter((i) => !inTitle(i) && i.text.includes(q))] : index).slice(0, 8);
    sel = clamp(sel, 0, Math.max(0, hits.length - 1));
    palList.textContent = '';
    if (!hits.length) {
      const p = document.createElement('p');
      p.textContent = 'No results. That keyword is still up for grabs.';
      palList.append(p);
      return;
    }
    hits.forEach((h, i) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = h.href;
      if (i === sel) a.className = 'sel';
      const small = document.createElement('small');
      small.textContent = h.sub;
      const strong = document.createElement('strong');
      strong.textContent = h.title;
      a.append(small, strong);
      a.addEventListener('click', () => palette.close());
      li.append(a);
      palList.append(li);
    });
  };
  const openPal = () => { palQ.value = ''; sel = 0; renderPal(); palette.showModal(); palQ.focus(); };
  $('#openSearch').addEventListener('click', openPal);
  palQ.addEventListener('input', () => { sel = 0; renderPal(); });
  palQ.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      sel += e.key === 'ArrowDown' ? 1 : -1;
      renderPal();
    }
    if (e.key === 'Enter') { e.preventDefault(); $('a.sel', palList)?.click(); }
  });
  palette.addEventListener('click', (e) => { if (e.target === palette) palette.close(); });
  addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPal(); }
  });

  /* Full-resolution screenshot viewer */
  const lb = $('#lightbox');
  const lbImg = $('#lbImg');
  $$('.shot').forEach((b) => b.addEventListener('click', () => {
    lbImg.src = b.dataset.full;
    lbImg.alt = $('img', b).alt;
    lb.showModal();
  }));
  $('#lbClose').addEventListener('click', () => lb.close());
  lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
})();
