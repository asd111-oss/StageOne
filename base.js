  // page-load preloader: 3s on first visit this session, 1s on later navigations
  (function () {
    const pre = document.getElementById('preloader');
    if (!pre) return;
    let dur = 1000;
    try {
      if (!sessionStorage.getItem('so_visited')) { dur = 3000; sessionStorage.setItem('so_visited', '1'); }
    } catch (e) { dur = 3000; }
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      pre.classList.add('hide');
      document.body.style.overflow = '';
      setTimeout(() => { pre.style.display = 'none'; }, 650);
    }, dur);
  })();

  // animated starfield warp background — fixed behind all content
  (function () {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const STAR = 'rgba(167,139,255,0.85)';
    const FILL = '#15141a';
    const QTY = 460, SPEED = 0.7;
    let w, h, cx, cy, z, colorRatio, ratio, stars = [], raf;
    const measure = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      cx = Math.round(w / 2); cy = Math.round(h / 2);
      z = (w + h) / 2; colorRatio = 1 / z; ratio = QTY / 2;
    };
    const spawn = () => {
      stars = new Array(QTY).fill(0).map(() => [
        Math.random() * w * 2 - cx * 2,
        Math.random() * h * 2 - cy * 2,
        Math.round(Math.random() * z), 0, 0, 0, 0, true
      ]);
    };
    const draw = () => {
      ctx.fillStyle = FILL; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = STAR;
      for (const s of stars) {
        s[7] = true; s[5] = s[3]; s[6] = s[4];
        s[2] -= SPEED;
        if (s[2] > z) { s[2] -= z; s[7] = false; }
        if (s[2] < 0) { s[2] += z; s[7] = false; }
        s[3] = cx + (s[0] / s[2]) * ratio;
        s[4] = cy + (s[1] / s[2]) * ratio;
        if (s[7] && s[5] > 0 && s[5] < w && s[6] > 0 && s[6] < h) {
          ctx.lineWidth = (1 - colorRatio * s[2]) * 2;
          ctx.beginPath(); ctx.moveTo(s[5], s[6]); ctx.lineTo(s[3], s[4]); ctx.stroke();
        }
      }
    };
    const loop = () => { draw(); raf = requestAnimationFrame(loop); };
    measure(); spawn();
    if (reduced) draw(); else loop();
    window.addEventListener('resize', () => { measure(); spawn(); });
  })();

  // sticky header shadow
  const header = document.getElementById('header');
  const bgCanvas = document.getElementById('bg-canvas');
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 12);
    // glow background fades (darkens) as the user scrolls down
    if (bgCanvas) bgCanvas.style.opacity = Math.max(0.05, 0.6 * (1 - window.scrollY / 1400)).toFixed(3);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // mobile menu toggle (hamburger → full-screen overlay)
  (function () {
    if (!header) return;
    const btn = header.querySelector('.nav-toggle');
    const menu = document.getElementById('mobile-menu');
    if (!btn || !menu) return;
    const setOpen = (o) => {
      header.classList.toggle('menu-open', o);
      document.body.classList.toggle('menu-open', o);
      btn.setAttribute('aria-expanded', String(o));
      document.body.style.overflow = o ? 'hidden' : '';
    };
    btn.addEventListener('click', () => setOpen(!header.classList.contains('menu-open')));
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
    window.addEventListener('resize', () => { if (window.innerWidth > 860) setOpen(false); });
  })();

  // mobile lane arrows: page horizontally-scrollable card rows left/right
  document.querySelectorAll('.lane-nav').forEach(nav => {
    const section = nav.closest('section');
    const lane = section && section.querySelector('.dir-grid, .prod-grid, .adv-grid');
    if (!lane) return;
    const btns = nav.querySelectorAll('button[data-dir]');
    const step = () => Math.max(lane.clientWidth * 0.82, 200);
    const sync = () => {
      const max = lane.scrollWidth - lane.clientWidth - 2;
      btns.forEach(b => {
        const dir = Number(b.dataset.dir);
        b.disabled = dir < 0 ? lane.scrollLeft <= 2 : lane.scrollLeft >= max;
      });
    };
    btns.forEach(b => b.addEventListener('click', () => {
      const max = lane.scrollWidth - lane.clientWidth;
      lane.scrollLeft = Math.min(Math.max(lane.scrollLeft + Number(b.dataset.dir) * step(), 0), max);
    }));
    lane.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  });

  // magic scroll reveal: every block/element starts as a faint "ghost" and
  // fades to full opacity as it scrolls up into view (applied page-wide)
  (function () {
    const els = [...document.querySelectorAll('.reveal, .mrev')];
    if (!els.length) return;
    const GHOST = 0.16;
    const update = () => {
      const vh = window.innerHeight;
      els.forEach(el => {
        const r = el.getBoundingClientRect();
        const startY = vh * 0.92, endY = vh * 0.40;
        let p = (startY - r.top) / (startY - endY);
        p = Math.min(Math.max(p, 0), 1);
        el.style.opacity = (GHOST + (1 - GHOST) * p).toFixed(3);
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    window.addEventListener('load', update);
  })();

  // holographic 3D tilt + cursor-following glow on direction & product cards
  document.querySelectorAll('.dir-card, .prod-card, .adv-card, .fmt-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotateX = (y - rect.height / 2) / 14;
      const rotateY = (rect.width / 2 - x) / 14;
      card.style.setProperty('--bg-x', (x / rect.width) * 100 + '%');
      card.style.setProperty('--bg-y', (y / rect.height) * 100 + '%');
      card.style.transition = 'transform 0s, background .25s, border-color .25s';
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform .5s ease, background .25s, border-color .25s';
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
      card.style.setProperty('--bg-x', '50%');
      card.style.setProperty('--bg-y', '50%');
    });
  });

  // pinned scroll-stacking: heading stays fixed while cards slide up & stack;
  // after the last card lands, the page scrolls on
  (function () {
    const scroller = document.querySelector('.serv-scroll');
    const stack = document.querySelector('.serv-stack');
    if (!scroller || !stack) return;
    const cards = [...stack.querySelectorAll('.serv-card')];
    const n = cards.length;
    const PEEK = 16;
    const targets = cards.map((_, i) => 1 - (n - 1 - i) * 0.05);
    // timeline with holds: each card fully rests (hold) before the next slides
    // up over it (move). nHold = n, nMove = n-1; hold is a bit shorter than move.
    const nMove = Math.max(n - 1, 1);
    const move = 1 / (nMove + 0.8 * n);
    const hold = 0.8 * move;
    const moveStart = (k) => k * hold + (k - 1) * move; // k = 1..n-1
    const update = () => {
      if (!scroller.closest('.mobstack') && window.innerWidth <= 980) { cards.forEach(c => { c.style.transform = ''; c.style.zIndex = ''; }); return; }
      const rect = scroller.getBoundingClientRect();
      const total = Math.max(rect.height - window.innerHeight, 1);
      const P = Math.min(Math.max(-rect.top, 0), total) / total;
      const H = stack.offsetHeight + 80;
      cards.forEach((card, i) => {
        card.style.zIndex = i;
        const restY = i * PEEK;
        let y = restY;
        if (i > 0) {
          const local = Math.min(Math.max((P - moveStart(i)) / move, 0), 1);
          y = H * (1 - local) + restY * local;
        }
        let scale = 1;
        if (i < n - 1) {
          const cover = Math.min(Math.max((P - moveStart(i + 1)) / move, 0), 1);
          scale = 1 - (1 - targets[i]) * cover;
        }
        card.style.transform = `translateY(${y}px) scale(${scale})`;
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  })();

  // scroll parallax on blocks 2 & 3 (directions, products): heading and card
  // grid drift at different rates as they pass through the viewport
  (function () {
    const els = [...document.querySelectorAll('.parallax-el')];
    if (!els.length) return;
    const update = () => {
      const vh = window.innerHeight;
      els.forEach(el => {
        const rect = el.getBoundingClientRect();
        let factor = 0.5 - (rect.top + rect.height / 2) / vh;
        factor = Math.min(Math.max(factor, -0.6), 0.6);
        const speed = parseFloat(el.dataset.parallax) || 0;
        el.style.transform = `translateY(${(factor * speed).toFixed(1)}px)`;
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  })();

  // form
  function submitForm(e) {
    e.preventDefault();
    const btn = e.target.querySelector('.btn-pri');
    btn.textContent = 'Заявка отправлена ✓';
    btn.style.background = 'var(--accent-2)';
    setTimeout(() => { e.target.reset(); btn.textContent = 'Отправить заявку'; btn.style.background = ''; }, 2600);
    return false;
  }
