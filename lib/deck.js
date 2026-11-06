/* Слёт партнёров Чио Чио · анимации слайдов.
   Каждый слой из Figma доступен как #k<nodeId> (например #k5_65), исходное имя — data-name. */
(function () {
  const stage = document.getElementById('stage');
  const slides = [...document.querySelectorAll('.slide')];
  const RED = '#E50040', NAVY = '#0D263F';
  let cur = -1, ctx = null, made = [];

  /* ---------- масштаб сцены ---------- */
  function fit() {
    const k = Math.min(innerWidth / 1920, innerHeight / 1080);
    stage.style.transform = `translate(${-960 * k}px, ${-540 * k}px) scale(${k})`;
  }
  addEventListener('resize', fit); fit();

  /* ---------- поиск слоёв ---------- */
  const CHROME = /^(Паттерн\/Волны|Логотип\/(Белый|Тёмный)|Слёт партнёров Чио Чио · 13\.11\.2026)$/;
  const $ = (s, id) => s.querySelector('#k' + id);
  const $$ = (s, ids) => ids.map(i => $(s, i)).filter(Boolean);
  const byName = (s, name) => [...s.querySelectorAll('[data-name]')].filter(e => e.dataset.name === name);
  const range = (s, a, b, pre) => { const out = []; for (let i = a; i <= b; i++) { const e = $(s, pre + '_' + i); if (e) out.push(e); } return out; };
  function topLayers(s) {
    return [...s.querySelectorAll('[id^="k"]')].filter(e => !e.parentElement.closest('[id^="k"]'));
  }
  function isChrome(s, e) {
    const n = e.dataset.name || '';
    return CHROME.test(n) || n === s.dataset.n;
  }
  const svgOf = s => s.querySelector('svg.art');
  const bb = e => e.getBBox();
  // getBBox без учёта transform предков: для наших слоёв предки без смещений
  function center(e) { const b = bb(e); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }

  function mk(s, tag, attrs, before) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    const root = svgOf(s);
    root.appendChild(el);
    made.push(el);
    return el;
  }

  /* ---------- счётчики ---------- */
  const NUM = /^([>+\-−]?)(\d[\d  ]*(?:[.,]\d+)?)(.*)$/;
  function isCounter(name) {
    if (!name || /^20\d\d$/.test(name) || /\d\.\d+\.\d/.test(name)) return false;
    const m = name.match(NUM);
    if (!m) return false;
    if (/[A-Za-zА-Яа-яЁё]/.test(m[3])) return false;
    return m[2].replace(/\D/g, '').length >= 2 || /[%+₽]/.test(name);
  }
  function counter(s, el, tl, at, dur = 1.6) {
    const name = el.dataset.name;
    const m = name.match(NUM);
    const pre = m[1], body = m[2], suf = m[3];
    const dec = (body.match(/[.,](\d+)$/) || [, ''])[1].length;
    const sep = body.includes(',') ? ',' : '.';
    const target = parseFloat(body.replace(/[  ]/g, '').replace(',', '.'));
    const grouped = /\d[  ]\d{3}/.test(body);
    const fmt = v => {
      let t = v.toFixed(dec);
      let [i, f] = t.split('.');
      if (grouped) i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return pre + i + (f ? sep + f : '') + suf;
    };
    const b = bb(el);
    const fill = (el.getAttribute('fill') || el.querySelector('[fill]')?.getAttribute('fill') || '#fff');
    const t = mk(s, 'text', { x: b.x, y: b.y, fill, 'font-family': 'Cera Pro', 'font-weight': 900, 'font-size': 100, class: 'cnt' });
    t.textContent = name;
    // подгоняем размер текста под ширину векторной надписи
    const tb = t.getBBox();
    const fs = 100 * b.width / tb.width;
    t.setAttribute('font-size', fs);
    const tb2 = t.getBBox();
    t.setAttribute('y', b.y + (b.y - tb2.y) + (b.height - tb2.height) / 2);
    const o = { v: 0 };
    t.textContent = fmt(0);
    gsap.set(t, { opacity: 0 });
    tl.set(el, { opacity: 0 }, 0);
    tl.to(t, { opacity: 1, duration: .2 }, at);
    tl.to(o, { v: target, duration: dur, ease: 'power3.out', onUpdate: () => { t.textContent = fmt(o.v); } }, at);
    tl.set(t, { opacity: 0 }, at + dur);
    tl.set(el, { opacity: 1 }, at + dur);
  }

  /* ---------- приёмы ---------- */
  const growY = (tl, els, at, o = {}) => tl.from(els, { scaleY: 0, transformOrigin: '50% 100%', duration: o.d || .9, ease: o.ease || 'power3.out', stagger: o.st || .08 }, at);
  const growX = (tl, els, at, o = {}) => tl.from(els, { scaleX: 0, transformOrigin: o.origin || '0% 50%', duration: o.d || .7, ease: 'power3.out', stagger: o.st || .08 }, at);
  const pop = (tl, els, at, o = {}) => tl.from(els, { scale: 0, transformOrigin: '50% 50%', duration: o.d || .6, ease: o.ease || 'back.out(2.2)', stagger: o.st || .08 }, at);
  const rise = (tl, els, at, o = {}) => tl.from(els, { y: o.y || 40, x: o.x || 0, opacity: 0, duration: o.d || .7, ease: 'power3.out', stagger: o.st || .07 }, at);
  function draw(tl, el, at, dur = 1.2, ease = 'power2.inOut') {
    const paths = el.tagName === 'path' ? [el] : [...el.querySelectorAll('path')];
    paths.forEach(p => {
      const L = p.getTotalLength();
      tl.fromTo(p, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: dur, ease }, at);
    });
  }
  function ripple(s, tl, x, y, at, r = 60, color = RED) {
    const c = mk(s, 'circle', { cx: x, cy: y, r, fill: 'none', stroke: color, 'stroke-width': 4 });
    gsap.set(c, { opacity: 0 });
    tl.fromTo(c, { scale: .2, opacity: .9, transformOrigin: '50% 50%' }, { scale: 1.6, opacity: 0, duration: .9, ease: 'power2.out', immediateRender: false }, at);
  }
  function typeOn(tl, el, at, dur = 1.6) {
    tl.fromTo(el, { clipPath: 'inset(-10% 100% -10% 0)' }, { clipPath: 'inset(-10% 0% -10% 0)', duration: dur, ease: `steps(${Math.max(8, Math.round(dur * 18))})` }, at);
  }

  /* ---------- базовый сценарий для всех слайдов ---------- */
  function base(s, tl, handled) {
    const layers = topLayers(s);
    const waves = layers.filter(e => e.dataset.name === 'Паттерн/Волны');
    waves.forEach((w, i) => gsap.to(w, { x: i % 2 ? -40 : 40, duration: 6, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    const rest = layers.filter(e => !isChrome(s, e) && !handled.has(e));
    const title = rest.find(e => { const n = e.dataset.name || ''; return n.length > 6 && n === n.toUpperCase() && /[А-ЯЁ]/.test(n); });
    if (title) tl.from(title, { y: 60, opacity: 0, duration: .8, ease: 'power4.out' }, .05);
    const others = rest.filter(e => e !== title);
    others.forEach((e, i) => {
      const at = .35 + i * .05;
      tl.from(e, { y: 30, opacity: 0, duration: .6, ease: 'power3.out' }, at);
      if (isCounter(e.dataset.name)) counter(s, e, tl, at + .1);
    });
    return title;
  }

  /* ---------- сценарии слайдов ---------- */
  const A = {};

  A[1] = (s, tl) => {
    const circ = $(s, '5_4');
    tl.from(circ, { scale: 0, rotation: -120, transformOrigin: '50% 50%', duration: 1.4, ease: 'back.out(1.4)' }, .1);
    gsap.to(circ, { scale: 1.03, transformOrigin: '50% 50%', duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.6 });
    tl.from($(s, '5_29'), { y: 80, opacity: 0, duration: 1, ease: 'power4.out' }, .5);
    tl.from($(s, '5_30'), { y: 40, opacity: 0, duration: .8, ease: 'power3.out' }, .75);
    growX(tl, $(s, '5_31'), 1.0, { d: .8 });
    rise(tl, $$(s, ['5_32', '5_33', '5_34']), 1.15, { st: .12 });
    return ['5_4', '5_29', '5_30', '5_31', '5_32', '5_33', '5_34'];
  };

  A[2] = (s, tl) => {
    const cards = ['5_61', '5_68', '5_75', '5_82'];
    const groups = [['5_62', '5_63', '5_64', '5_65', '5_66', '5_67'], ['5_69', '5_70', '5_71', '5_72', '5_73', '5_74'], ['5_76', '5_77', '5_78', '5_79', '5_80', '5_81'], ['5_83', '5_84', '5_85', '5_86', '5_87', '5_88']];
    const ids = [...cards];
    cards.forEach((c, i) => {
      const at = .4 + i * .35;
      const [lab, grow, b25, b26, n25, n26] = groups[i];
      rise(tl, $(s, c), at, { y: 60 });
      rise(tl, $(s, lab), at + .1);
      growY(tl, $(s, b25), at + .25, { d: 1 });
      growY(tl, $(s, b26), at + .4, { d: 1.2, ease: 'power4.out' });
      counter(s, $(s, n25), tl, at + .3, 1.2);
      counter(s, $(s, n26), tl, at + .45, 1.6);
      pop(tl, $(s, grow), at + 1.4, { ease: 'back.out(3)' });
      ids.push(...groups[i]);
    });
    return ids;
  };

  A[3] = (s, tl) => {
    const all = range(s, 119, 191, '5').filter(e => e.tagName === 'rect');
    const bars = all.filter(e => bb(e).height > 4 && bb(e).width < 60);
    const base = Math.max(...bars.map(e => { const b = bb(e); return b.y + b.height; }));
    const cols = {};
    bars.forEach(e => { const k = Math.round(bb(e).x); (cols[k] = cols[k] || []).push(e); });
    Object.keys(cols).map(Number).sort((a, b) => a - b).forEach((k, i) => {
      cols[k].forEach(e => {
        const b = bb(e);
        tl.from(e, { y: base - (b.y + b.height), scaleY: 0, transformOrigin: '50% 100%', duration: .7, ease: 'power3.out' }, .6 + i * .09);
      });
    });
    // всплеск роста: подсветка последних месяцев
    const legend = ['5_193', '5_194', '5_195', '5_196', '5_197', '5_198', '5_199', '5_200', '5_201', '5_202', '5_203', '5_204', '5_205', '5_206', '5_207'];
    rise(tl, $$(s, legend).filter(e => !isCounter(e.dataset.name)), 1.2, { x: 40, y: 0, st: .05 });
    ['5_197', '5_202', '5_207'].forEach((id, i) => counter(s, $(s, id), tl, 2.2 + i * .2, 1.8));
    ['5_196', '5_201', '5_206'].forEach((id, i) => { counter(s, $(s, id), tl, 2.6 + i * .25, 1.2); });
    return [...bars.map(e => e.id.slice(1)), ...legend];
  };

  A[4] = (s, tl) => {
    pop(tl, $(s, '23_356'), .3, { d: 1, ease: 'back.out(1.6)' });
    tl.from($$(s, ['23_357', '23_358']), { y: 260, opacity: 0, duration: 1.1, ease: 'power4.out' }, .45);
    const winA = range(s, 359, 364, '23'), winB = range(s, 365, 370, '23');
    tl.from(winA, { x: 260, opacity: 0, duration: 1, ease: 'power4.out' }, .8);
    tl.from(winB, { x: 260, opacity: 0, duration: 1, ease: 'power4.out' }, 1.05);
    const labs = [['5_238', '5_239', '23_371'], ['5_233', '5_234', '23_373'], ['5_243', '5_244', '23_372']];
    labs.forEach(([d, t, l], i) => {
      const at = 1.5 + i * .3;
      pop(tl, $(s, d), at);
      rise(tl, $(s, t), at + .05, { x: -20, y: 0 });
      growX(tl, $(s, l), at + .3, { origin: l === '23_373' ? '100% 50%' : '0% 50%' });
    });
    // сканирующая линия по ChioMaps и по таблице
    [['23_370', 2.6], ['23_364', 3.4]].forEach(([id, at]) => {
      const b = bb($(s, id));
      const ln = mk(s, 'rect', { x: b.x, y: b.y, width: 6, height: b.height, fill: RED, rx: 3 });
      gsap.set(ln, { opacity: 0 });
      tl.fromTo(ln, { x: 0, opacity: 1 }, { x: b.width - 6, duration: 1.4, ease: 'power1.inOut', immediateRender: false }, at);
      tl.to(ln, { opacity: 0, duration: .3 }, at + 1.4);
    });
    // экран телефона: кнопка «Записаться» подсвечивается
    const ph = bb($(s, '23_358'));
    ripple(s, tl, ph.x + ph.width / 2, ph.y + ph.height * .86, 2.2, 70);
    return ['23_356', '23_357', '23_358', ...winA.map(e => e.id.slice(1)), ...winB.map(e => e.id.slice(1)), ...labs.flat()];
  };

  A[5] = (s, tl) => {
    const chain = [['6_86', '6_87', '6_88'], ['6_89'], ['6_90', '6_91', '6_92'], ['6_93'], ['6_94', '6_95', '6_96'], ['6_97'], ['6_98', '6_99', '6_100']];
    let at = .5;
    chain.forEach(g => {
      const els = $$(s, g);
      if (g.length === 1) {
        pop(tl, els, at, { ease: 'back.out(3)' });
        tl.to(els, { fill: RED, duration: .15, yoyo: true, repeat: 1 }, at + .3);
        at += .25;
      } else {
        rise(tl, els[0], at, { y: 50 });
        rise(tl, els.slice(2), at + .1);
        if (els[1]) counter(s, els[1], tl, at + .1, .9);
        at += .45;
      }
    });
    rise(tl, $$(s, ['6_83', '6_101', '6_109']), at, { y: 80 });
    const tail = [['6_102', '6_103', '6_104'], ['6_105'], ['6_106', '6_107', '6_108']];
    at += .4;
    tail.forEach(g => {
      const els = $$(s, g);
      if (g.length === 1) { pop(tl, els, at); at += .2; return; }
      rise(tl, els[0], at, { y: 40 }); rise(tl, els.slice(2), at + .1);
      counter(s, els[1], tl, at + .1, 1); at += .45;
    });
    const total = $(s, '6_110');
    tl.from(total, { scale: .4, opacity: 0, transformOrigin: '50% 50%', duration: 1.1, ease: 'elastic.out(1, .6)' }, at + .2);
    typeOn(tl, total, at + .2, 1.2);
    rise(tl, $(s, '6_111'), at + .6);
    pop(tl, $(s, '6_112'), at + .9);
    return [...chain.flat(), ...tail.flat(), '6_83', '6_101', '6_109', '6_110', '6_111', '6_112'];
  };

  A[6] = (s, tl) => {
    const cards = [['6_142', '6_143', '6_144', '6_145', '6_146', '6_147'], ['6_149', '6_150', '6_152', '6_153'], ['6_154', '6_155', '6_157', '6_158']];
    const logos = ['6_148', '6_151', '6_156'];
    cards.forEach((c, i) => {
      const at = .4 + i * .3;
      rise(tl, $(s, c[0]), at, { y: 80 });
      rise(tl, $$(s, c.slice(1)), at + .2);
      const lg = $(s, logos[i]);
      tl.from(lg, { y: -420, opacity: 0, duration: 1, ease: 'bounce.out' }, at + .5);
      const cc = center(lg);
      ripple(s, tl, cc.x, cc.y, at + 1.25, 50);
      ripple(s, tl, cc.x, cc.y, at + 1.45, 50);
    });
    return [...cards.flat(), ...logos];
  };

  A[7] = (s, tl) => {
    const rows = [['6_184', '6_185', '6_186'], ['6_187', '6_188', '6_189', '6_190'], ['6_191', '6_192', '6_193', '6_194']];
    rise(tl, $$(s, ['6_181', '6_182', '6_183']), .35, { st: .05 });
    rows.forEach((r, i) => {
      const at = .6 + i * .35;
      r.forEach((id, j) => { const e = $(s, id); if (!e) return; if (isCounter(e.dataset.name)) counter(s, e, tl, at + .1 + (j > 1 ? .3 : 0), 1.4); else rise(tl, e, at); });
    });
    rise(tl, $(s, '6_195'), 1.8);
    [['6_196', '6_197', '6_198'], ['6_199', '6_200', '6_201']].forEach((g, i) => {
      const at = 1.9 + i * .3;
      tl.from($(s, g[0]), { y: 300, opacity: 0, duration: 1, ease: 'power4.out' }, at);
      counter(s, $(s, g[1]), tl, at + .3, 1.6);
      rise(tl, $(s, g[2]), at + .4);
    });
    return ['6_181', '6_182', '6_183', ...rows.flat(), '6_195', '6_196', '6_197', '6_198', '6_199', '6_200', '6_201'];
  };

  A[8] = (s, tl) => {
    rise(tl, $$(s, ['6_224', '6_225', '6_226']), .4, { y: 70 });
    tl.from($(s, '6_226'), { scale: 1.12, duration: 2.4, ease: 'power2.out' }, .4);
    rise(tl, $$(s, ['6_227', '6_228', '6_229']), .7);
    rise(tl, $$(s, ['6_230', '6_231', '6_232']), .8, { y: 70 });
    growY(tl, range(s, 233, 237, '6'), 1.1, { st: .1, d: 1, ease: 'back.out(1.6)' });
    rise(tl, $$(s, ['6_238', '6_239']), 1.1, { y: 70 });
    tl.from($(s, '6_239'), { scale: 1.12, duration: 2.4, ease: 'power2.out' }, 1.1);
    rise(tl, $$(s, ['6_240', '6_241']), 1.4);
    return ['6_224', '6_225', '6_226', '6_227', '6_228', '6_229', '6_230', '6_231', '6_232', '6_233', '6_234', '6_235', '6_236', '6_237', '6_238', '6_239', '6_240', '6_241'];
  };

  A[9] = (s, tl) => {
    rise(tl, $(s, '7_150'), .35);
    // окно виджета
    tl.from($$(s, ['7_163', '7_164', '7_165', '9_311', '9_312', '9_313']), { x: 300, opacity: 0, duration: 1.1, ease: 'power4.out' }, .4);
    // секундомер: кольцо прорисовывается, пока клиент проходит шаги
    rise(tl, $(s, '7_161'), .5, { y: 0 });
    draw(tl, $(s, '7_162'), .9, 4.2, 'none');
    const steps = [['7_152', '7_151', '7_153'], ['7_155', '7_154', '7_156'], ['7_158', '7_157']];
    steps.forEach((g, i) => {
      const at = 1.0 + i * 1.0;
      const els = $$(s, g);
      tl.from(els, { x: -40, opacity: 0, duration: .5, ease: 'power3.out', stagger: .05 }, at);
      const c = center(els[0]);
      ripple(s, tl, c.x, c.y, at + .45, 40);
    });
    const btn = $$(s, ['7_160', '7_159']);
    pop(tl, btn, 4.0, { ease: 'back.out(2.6)' });
    const cb = center(btn[0]);
    ripple(s, tl, cb.x, cb.y, 4.4, 70);
    tl.from($(s, '7_166'), { scale: 2.2, opacity: 0, transformOrigin: '50% 50%', duration: .8, ease: 'back.out(2)' }, 4.9);
    return ['7_150', '7_163', '7_164', '7_165', '9_311', '9_312', '9_313', '7_161', '7_162', ...steps.flat(), '7_160', '7_159', '7_166'];
  };

  A[10] = (s, tl) => {
    rise(tl, $(s, '7_189'), .35);
    rise(tl, $(s, '7_190'), .5, { y: 30 });
    const ball = $(s, '7_192');
    pop(tl, ball, .6);
    gsap.to(ball, { scale: 1.18, transformOrigin: '50% 50%', duration: .6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: .8 });
    typeOn(tl, $(s, '7_191'), .9, 1.8);
    // «волны мысли» от шара Алисы
    const c = center(ball);
    [2.7, 2.95, 3.2].forEach(t => ripple(s, tl, c.x, c.y, t, 40, '#8B5CF6'));
    tl.from($$(s, ['7_200', '7_201']), { y: 200, opacity: 0, duration: 1.1, ease: 'power4.out' }, 3.0);
    tl.fromTo($(s, '7_201'), { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.6, ease: 'power2.inOut' }, 3.1);
    draw(tl, $(s, '7_202'), 4.8, 1.1);
    return ['7_189', '7_190', '7_191', '7_192', '7_200', '7_201', '7_202'];
  };

  A[11] = (s, tl) => {
    const cols = [['7_225', '7_226', '7_227'], ['7_231'], ['7_243', '7_244', '7_245']];
    rise(tl, $$(s, ['7_225', '7_243']), .4, { y: 70, st: .3 });
    rise(tl, $$(s, ['7_226', '7_231', '7_244']), .6, { st: .2 });
    counter(s, $(s, '7_227'), tl, .9, 1.4);
    counter(s, $(s, '7_245'), tl, 1.3, 1.6);
    // шкала конверсии
    const th = range(s, 228, 230, '7');
    th.forEach((e, i) => { const b = bb(e); (b.height > b.width ? growY : growX)(tl, e, .8 + i * .15, { d: 1.2 }); });
    // поисковая выдача: строки появляются, наши окрашиваются
    const serp = range(s, 232, 242, '7');
    tl.from(serp, { x: -30, opacity: 0, duration: .5, ease: 'power3.out', stagger: .07 }, 1.0);
    // рост трафика
    range(s, 246, 247, '7').forEach((e, i) => { const b = bb(e); (b.height > b.width ? growY : growX)(tl, e, 1.4 + i * .2, { d: 1.2 }); });
    return [...cols.flat(), ...th.map(e => e.id.slice(1)), ...serp.map(e => e.id.slice(1)), '7_246', '7_247'];
  };

  A[12] = (s, tl) => {
    pop(tl, $(s, '7_275'), .3, { d: 1.1, ease: 'back.out(1.5)' });
    tl.from($$(s, ['7_283', '7_284', '7_285']), { y: 300, opacity: 0, duration: 1.2, ease: 'power4.out' }, .5);
    const ph = center($(s, '7_284'));
    // «скачивания» слетаются к телефону
    for (let i = 0; i < 28; i++) {
      const ang = Math.random() * Math.PI * 2, R = 600 + Math.random() * 400;
      const d = mk(s, 'circle', { cx: ph.x, cy: ph.y, r: 6 + Math.random() * 8, fill: RED });
      gsap.set(d, { opacity: 0 });
      tl.fromTo(d, { x: Math.cos(ang) * R, y: Math.sin(ang) * R, opacity: 1 }, { x: 0, y: 0, opacity: 0, duration: 1.2, ease: 'power2.in', immediateRender: false }, 1.0 + i * .06);
    }
    rise(tl, $(s, '7_270'), .6, { y: 50 });
    counter(s, $(s, '7_270'), tl, .7, 2.6);
    rise(tl, $(s, '7_271'), .9);
    growX(tl, $(s, '7_272'), 1.6);
    counter(s, $(s, '7_273'), tl, 1.9, 2.2);
    rise(tl, $(s, '7_274'), 2.0);
    return ['7_275', '7_283', '7_284', '7_285', '7_270', '7_271', '7_272', '7_273', '7_274'];
  };

  A[13] = (s, tl) => {
    const phones = [['8_222', '8_223'], ['8_225', '8_226'], ['8_228', '8_229'], ['8_231', '8_232'], ['8_234']];
    const labels = ['8_224', '8_227', '8_230', '8_233', '8_242'];
    phones.forEach((g, i) => {
      const at = .45 + i * .28;
      tl.from($$(s, g), { y: 220, rotation: i % 2 ? 4 : -4, opacity: 0, duration: 1, ease: 'power4.out' }, at);
      rise(tl, $(s, labels[i]), at + .35);
    });
    rise(tl, $(s, '8_243'), 2.0);
    const rest = topLayers(s).filter(e => /^k8_2(3[5-9]|4[01])$/.test(e.id));
    rise(tl, rest, 1.8, { st: .05 });
    // по очереди «приподнимаем» экраны
    const loop = gsap.timeline({ repeat: -1, delay: 3.2 });
    phones.forEach(g => loop.to($$(s, g), { y: -24, duration: .4, ease: 'power2.out' }).to($$(s, g), { y: 0, duration: .5, ease: 'power2.in' }, '+=1.1'));
    return [...phones.flat(), ...labels, '8_243', ...rest.map(e => e.id.slice(1))];
  };

  A[14] = (s, tl) => {
    rise(tl, $(s, '8_266'), .35);
    tl.from($(s, '8_283'), { x: 400, opacity: 0, duration: 1.2, ease: 'power4.out' }, .4);
    tl.from($$(s, ['8_278', '8_279']), { scale: .8, opacity: 0, transformOrigin: '50% 50%', duration: .9, ease: 'power3.out' }, .8);
    const steps = [['8_268', '8_267', '8_269'], ['8_271', '8_270', '8_272'], ['8_274', '8_273', '8_275'], ['8_277', '8_276']];
    steps.forEach((g, i) => {
      const at = 1.1 + i * .45;
      tl.from($$(s, g), { x: -40, opacity: 0, duration: .5, ease: 'power3.out', stagger: .04 }, at);
      const c = center($(s, g[0]));
      ripple(s, tl, c.x, c.y, at + .4, 36);
    });
    tl.from($$(s, ['8_280', '8_281']), { y: 80, opacity: 0, duration: .9, ease: 'back.out(1.6)' }, 3.0);
    const ok = $(s, '8_282');
    pop(tl, ok, 3.5, { ease: 'back.out(3)' });
    gsap.to(ok, { scale: 1.12, transformOrigin: '50% 50%', duration: .8, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 4.2 });
    const c = center(ok);
    [3.7, 3.95, 4.2].forEach(t => ripple(s, tl, c.x, c.y, t, 50));
    return ['8_266', '8_283', '8_278', '8_279', ...steps.flat(), '8_280', '8_281', '8_282'];
  };

  A[15] = (s, tl) => {
    const books = ['8_306', '8_330', '8_354'], caps = ['8_329', '8_353', '8_377'];
    books.forEach((id, i) => {
      const at = .4 + i * .3;
      tl.from($(s, id), { y: -900, rotation: [-14, 9, -6][i], transformOrigin: '50% 100%', duration: 1.1, ease: 'bounce.out' }, at);
      rise(tl, $(s, caps[i]), at + 1);
      gsap.to($(s, id), { y: -10, duration: 2 + i * .3, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2 + i * .2 });
    });
    return [...books, ...caps];
  };

  A[16] = (s, tl) => {
    rise(tl, $$(s, ['8_400', '8_401']), .35, { y: 60 });
    const ring = $(s, '8_430'), pin = $$(s, ['8_431', '8_432']);
    tl.from(ring, { scale: 0, transformOrigin: '50% 50%', duration: 1.4, ease: 'power3.out' }, .9);
    pop(tl, pin, .8, { ease: 'back.out(3)' });
    gsap.to(ring, { scale: 1.06, transformOrigin: '50% 50%', duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2.4 });
    const c = center(pin[0]);
    [1.6, 2.2, 2.8].forEach(t => ripple(s, tl, c.x, c.y, t, 90));
    pop(tl, $$(s, ['8_433', '8_434']), 1.9);
    rise(tl, $$(s, ['8_435', '24_377', '8_437', '8_438']), 1.2);
    rise(tl, $$(s, ['8_439', '8_440']), .6, { y: 60 });
    const bubbles = [['8_441', '8_442', '8_443'], ['8_444', '8_445', '8_446'], ['8_447', '8_448', '8_449']];
    bubbles.forEach((g, i) => tl.from($$(s, g), { scale: 0, transformOrigin: '0% 100%', duration: .6, ease: 'back.out(2.4)' }, 1.4 + i * .6));
    rise(tl, $$(s, ['8_450', '8_451']), 1.2);
    const ops = [['24_379', '24_380', '8_453', '8_452'], ['24_385', '24_386', '8_455', '8_454'], ['24_395', '24_396', '8_457', '8_456']];
    ops.forEach((g, i) => tl.from($$(s, g), { x: 60, opacity: 0, duration: .6, ease: 'power3.out' }, 2.3 + i * .2));
    return ['8_400', '8_401', '8_430', '8_431', '8_432', '8_433', '8_434', '8_435', '24_377', '8_437', '8_438', '8_439', '8_440', ...bubbles.flat(), '8_450', '8_451', ...ops.flat()];
  };

  A[17] = (s, tl) => {
    tl.from($(s, '10_333'), { x: -420, opacity: 0, duration: 1.4, ease: 'power4.out' }, .4);
    tl.from($(s, '10_334'), { x: 420, opacity: 0, duration: 1.4, ease: 'power4.out' }, .4);
    rise(tl, $$(s, ['10_335', '24_400']), 1.3);
    pop(tl, $$(s, ['10_337', '10_338']), 1.7, { st: .2 });
    rise(tl, $(s, '10_339'), .5);
    rise(tl, $(s, '10_340'), .7, { y: 50 });
    counter(s, $(s, '10_340'), tl, .8, 2);
    rise(tl, $$(s, ['10_341', '10_342', '10_343', '10_344', '10_345']), 1.0, { st: .1 });
    return ['10_333', '10_334', '10_335', '24_400', '10_337', '10_338', '10_339', '10_340', '10_341', '10_342', '10_343', '10_344', '10_345'];
  };

  A[18] = (s, tl) => {
    rise(tl, $$(s, ['10_368', '10_369']), .35, { y: 60 });
    const eq = range(s, 370, 389, '10');
    growY(tl, eq, .6, { st: .03, d: .5 });
    eq.forEach((e, i) => gsap.to(e, { scaleY: () => .25 + Math.random() * .9, transformOrigin: '50% 50%', duration: .22 + Math.random() * .25, ease: 'sine.inOut', yoyo: true, repeat: -1, repeatRefresh: true, delay: 1.4 + i * .02 }));
    const chips = [['10_392', '10_391'], ['10_394', '10_393'], ['10_396', '10_395']];
    chips.forEach((g, i) => tl.from($$(s, g), { x: -50, opacity: 0, duration: .6, ease: 'back.out(1.8)' }, 1.2 + i * .35));
    rise(tl, $(s, '10_397'), 2.4);
    const stats = [['10_398', '10_399', '10_400', '10_401'], ['10_402', '10_403', '10_404', '10_405'], ['10_406', '10_407', '10_408', '10_409'], ['10_410', '10_411', '10_412', '10_413']];
    stats.forEach((g, i) => {
      const at = 1.0 + i * .3;
      const els = $$(s, g);
      tl.from(els[0], { y: 120, opacity: 0, duration: .9, ease: 'power4.out' }, at);
      els.slice(1).forEach(e => { if (isCounter(e.dataset.name)) counter(s, e, tl, at + .3, 1.5); else rise(tl, e, at + .3); });
    });
    return ['10_368', '10_369', ...eq.map(e => e.id.slice(1)), ...chips.flat(), '10_397', ...stats.flat()];
  };

  A[19] = (s, tl) => {
    const circ = $(s, '10_416');
    tl.from(circ, { scale: 0, transformOrigin: '50% 50%', duration: 1.4, ease: 'elastic.out(1, .5)' }, .2);
    gsap.to(circ, { scale: 1.04, transformOrigin: '50% 50%', duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.8 });
    tl.from($(s, '10_424'), { scale: .6, opacity: 0, transformOrigin: '50% 50%', duration: 1.1, ease: 'back.out(1.8)' }, .6);
    rise(tl, $$(s, ['10_435', '10_436']), 1.1, { st: .15 });
    return ['10_416', '10_424', '10_435', '10_436'];
  };

  /* ---------- запуск слайда ---------- */
  function run(i) {
    const s = slides[i];
    const n = +s.dataset.n;
    ctx = gsap.context(() => {
      const tl = gsap.timeline();
      window.__tl = tl;
      let ids = [];
      if (A[n]) ids = A[n](s, tl) || [];
      const handled = new Set(ids.map(id => $(s, id)).filter(Boolean));
      // слои, вложенные в обработанные, тоже считаем обработанными
      base(s, tl, handled);
    }, s);
  }
  function stop() {
    if (ctx) ctx.revert();
    ctx = null;
    made.forEach(e => e.remove());
    made = [];
  }
  function go(i, force) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    if (i === cur && !force) return;
    const prev = slides[cur];
    stop();
    slides.forEach(s => s.classList.remove('on', 'leaving'));
    if (prev && prev !== slides[i]) {
      prev.classList.add('leaving');
      gsap.fromTo(prev, { opacity: 1 }, { opacity: 0, duration: .35, onComplete: () => { prev.classList.remove('leaving'); gsap.set(prev, { opacity: 1 }); } });
    }
    cur = i;
    slides[i].classList.add('on');
    run(i);
    document.getElementById('progress').style.width = ((i + 1) / slides.length * 100) + '%';
    history.replaceState(null, '', '#' + (i + 1));
  }

  addEventListener('keydown', e => {
    if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); go(cur + 1); }
    else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); go(cur - 1); }
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(slides.length - 1);
    else if (e.key === 'r' || e.key === 'R' || e.key === 'к' || e.key === 'К') go(cur, true);
    else if (e.key === 'f' || e.key === 'F' || e.key === 'а' || e.key === 'А') {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen();
    }
  });
  stage.addEventListener('click', e => { go(e.clientX > innerWidth / 3 ? cur + 1 : cur - 1); });
  let tx = null;
  addEventListener('touchstart', e => { tx = e.touches[0].clientX; });
  addEventListener('touchend', e => { if (tx == null) return; const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 50) go(cur + (d < 0 ? 1 : -1)); tx = null; });

  window.deck = { go: i => go(i - 1, true), seek: t => window.__tl && window.__tl.pause().seek(t) };
  const start = Math.max(0, (parseInt(location.hash.slice(1)) || 1) - 1);
  const fontsReady = document.fonts
    ? Promise.all(['400', '700', '900'].map(w => document.fonts.load(w + ' 100px "Cera Pro"', '0123456789'))).catch(() => {})
    : Promise.resolve();
  fontsReady.then(() => go(start));
})();
