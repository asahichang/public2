(() => {
'use strict';
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const root = document.documentElement;
const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
const reduce = () => mqReduce.matches;
const canHover = matchMedia('(hover: hover)').matches;
const store = {
  get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } },
  set(k, v){ try { localStorage.setItem(k, v); } catch(e){} }
};
const plural = (n, f) => {
  const m = n % 10, h = n % 100;
  return (m === 1 && h !== 11) ? f[0] : (m >= 2 && m <= 4 && (h < 10 || h >= 20)) ? f[1] : f[2];
};

/* ---------- toast ---------- */
const toastEl = $('#toast');
let toastT;
const toast = msg => {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => toastEl.classList.remove('show'), 5000);
};
window.__toast = toast;

/* ---------- copy ---------- */
function copyText(text){
  const done = () => toast('Скопировано.');
  const fallback = () => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { toast('Не удалось скопировать.'); }
    document.body.removeChild(ta);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done, fallback);
  } else {
    fallback();
  }
}
window.__copyText = copyText;

/* ---------- звёздное небо ---------- */
const cv = $('#sky'), cx = cv ? cv.getContext('2d') : null;
let W = 0, H = 0, dpr = 1, warping = false;
const stars = Array.from({length: 200}, () => ({
  x: Math.random(), y: Math.random(),
  r: Math.random() * 1.15 + .25,
  a: Math.random() * .65 + .25
}));
const tint = () => {
  const cs = getComputedStyle(root);
  return {
    rgb: (cs.getPropertyValue('--star') || '255,244,225').trim(),
    k: parseFloat(cs.getPropertyValue('--star-k')) || 1
  };
};
const starCount = () => Math.min(stars.length, Math.round(W * H / 7000));

function draw(){
  if (!cx || warping) return;
  const t = tint(), n = starCount();
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cx.clearRect(0, 0, W, H);
  for (let i = 0; i < n; i++){
    const s = stars[i];
    cx.fillStyle = 'rgba(' + t.rgb + ',' + (s.a * t.k).toFixed(2) + ')';
    cx.beginPath();
    cx.arc(s.x * W, s.y * H, s.r, 0, 6.2832);
    cx.fill();
  }
}
function resize(){
  if (!cv) return;
  if (W && Math.abs(innerWidth - W) < 1 && Math.abs(innerHeight - H) < 120) return;
  W = innerWidth; H = innerHeight;
  dpr = Math.min(devicePixelRatio || 1, 1.5);
  cv.width = Math.round(W * dpr);
  cv.height = Math.round(H * dpr);
  draw();
}
let rt;
addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
resize();

/* ---------- мерцающие точки ---------- */
(() => {
  const box = $('#tws');
  if (!box) return;
  for (let i = 0; i < 16; i++){
    const d = document.createElement('i');
    d.style.cssText =
      'left:' + (Math.random() * 100).toFixed(1) + '%;' +
      'top:' + (Math.random() * 100).toFixed(1) + '%;' +
      '--d:' + (3 + Math.random() * 5).toFixed(1) + 's;' +
      '--dl:-' + (Math.random() * 6).toFixed(1) + 's';
    box.appendChild(d);
  }
})();

/* ---------- гиперпрыжок ---------- */
function warp(){
  if (warping || !cx) return;
  if (reduce()){ toast('Гиперпрыжок совершён. Анимация отключена в настройках вашей системы.'); return; }
  warping = true;
  const t = tint(), t0 = performance.now(), dur = 2300, mx = W / 2, my = H / 2, n = starCount();
  cx.lineCap = 'round';
  (function frame(now){
    const p = Math.min(1, (now - t0) / dur), v = Math.sin(p * Math.PI);
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx.clearRect(0, 0, W, H);
    cx.strokeStyle = 'rgba(' + t.rgb + ',' + (.85 * t.k).toFixed(2) + ')';
    cx.lineWidth = 1.2;
    cx.beginPath();
    for (let i = 0; i < n; i++){
      const s = stars[i], dx = s.x * W - mx, dy = s.y * H - my, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
      const d1 = d * (1 + 4 * v * v), len = v * .45 * d1;
      cx.moveTo(mx + ux * (d1 - len), my + uy * (d1 - len));
      cx.lineTo(mx + ux * d1, my + uy * d1);
    }
    cx.stroke();
    if (p < 1) requestAnimationFrame(frame);
    else { warping = false; draw(); toast('Гиперпрыжок завершён. По часам Земли вы пропустили три года.'); }
  })(t0);
}

/* Konami-код */
const konami = ['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a'];
let ki = 0;
addEventListener('keydown', e => {
  const k = (e.key || '').toLowerCase();
  if (k === konami[ki]){ ki++; if (ki === konami.length){ ki = 0; warp(); } }
  else ki = (k === konami[0]) ? 1 : 0;
});

/* долгое нажатие на планету */
(() => {
  const hero = $('#top'), planet = $('#planet');
  if (!hero || !planet) return;
  let lp;
  hero.addEventListener('pointerdown', e => {
    const r = planet.getBoundingClientRect();
    const cxp = r.left + r.width / 2, cyp = r.top + r.height / 2;
    if (Math.hypot(e.clientX - cxp, e.clientY - cyp) <= r.width / 2) lp = setTimeout(warp, 800);
  });
  ['pointerup','pointerleave','pointercancel'].forEach(ev => hero.addEventListener(ev, () => clearTimeout(lp)));
})();

/* ---------- 5 кликов на логотип: красное смещение ---------- */
(() => {
  const brand = document.querySelector('.brand');
  if (!brand) return;
  // На главной не уходим по ссылке — даём собрать 5 кликов
  const path = location.pathname.split('/').pop() || 'index.html';
  const isHome = path === 'index.html' || path === '';
  if (isHome) brand.setAttribute('href', '#top');

  let n = 0, t;
  brand.addEventListener('click', e => {
    if (e.target.closest('.brand i')) return; // клик по кружку — это категории
    n++;
    clearTimeout(t);
    t = setTimeout(() => n = 0, 1400);
    if (n >= 5){
      n = 0;
      if (root.getAttribute('data-spectrum') === 'red'){
        root.removeAttribute('data-spectrum');
        toast('Спектр возвращён.');
      } else {
        root.setAttribute('data-spectrum', 'red');
        toast('Красное смещение: вы удаляетесь от источника слишком быстро.');
      }
    }
  });
})();

/* ---------- аномалия ---------- */
(() => {
  const a = $('#anomaly');
  if (!a) return;
  a.addEventListener('click', () => toast('Источник на 1420,40 МГц. Это линия нейтрального водорода: на этой частоте радиоастрономы ищут чужие сигналы. Приёмник в разделе «Игры».'));
})();

/* ---------- coda (8 секунд внизу) ---------- */
(() => {
  const end = $('#end'), coda = $('#coda');
  if (!end || !coda) return;
  let t;
  new IntersectionObserver(es => {
    if (es[0].isIntersecting) t = setTimeout(() => { coda.hidden = false; }, 8000);
    else clearTimeout(t);
  }).observe(end);
})();

/* ---------- Voyager 1 ---------- */
(() => {
  const el = $('#vg');
  if (!el) return;
  const target = new Date(2026, 10, 18), now = new Date();
  const days = Math.round((target - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5);
  el.textContent = days > 1 ? '18 ноября · через ' + days + ' ' + plural(days, ['день', 'дня', 'дней'])
    : days === 1 ? '18 ноября · уже завтра' : days === 0 ? 'сегодня' : 'порог пройден 18 ноября';
})();

/* ---------- hero-градиент + spotlight ---------- */
if (canHover){
  const hero = $('#top');
  if (hero){
    let hr = 0, hx = .5;
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      hx = (e.clientX - r.left) / r.width;
      if (!hr) hr = requestAnimationFrame(() => { hr = 0; hero.style.setProperty('--gx', (hx * 100).toFixed(1) + '%'); });
    }, {passive: true});
  }
  let sp = null, spx = 0, spy = 0, tick = false;
  document.addEventListener('pointermove', e => {
    const t = e.target.closest && e.target.closest('.spot');
    if (!t) return;
    const r = t.getBoundingClientRect();
    sp = t; spx = e.clientX - r.left; spy = e.clientY - r.top;
    if (!tick){
      tick = true;
      requestAnimationFrame(() => {
        tick = false;
        sp.style.setProperty('--mx', spx + 'px');
        sp.style.setProperty('--my', spy + 'px');
      });
    }
  }, {passive: true});

  /* 3D-наклон обложек */
  $$('.cover').forEach(c => {
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      c.style.setProperty('--ry', (x * 14).toFixed(1) + 'deg');
      c.style.setProperty('--rx', (-y * 14).toFixed(1) + 'deg');
    }, {passive: true});
    c.addEventListener('pointerleave', () => {
      c.style.setProperty('--rx', '0deg');
      c.style.setProperty('--ry', '0deg');
    });
  });
}

/* ---------- активный пункт навигации ---------- */
(() => {
  const links = $$('.nav a[data-s]');
  if (!links.length) return;
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) links.forEach(l => l.classList.toggle('on', l.dataset.s === en.target.id));
  }), {rootMargin: '-45% 0px -50% 0px'});
  $$('main section[id]').forEach(s => io.observe(s));
})();

/* ---------- мобильное меню ---------- */
(() => {
  const toggle = $('#menuToggle'), nav = $('#mainNav');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', nav.classList.contains('open'));
  });
})();

/* ---------- выпадающие меню ---------- */
(() => {
  const bind = (btnSel, menuSel) => {
    const btn = $(btnSel), menu = $(menuSel);
    if (!btn || !menu) return;
    btn.addEventListener('click', e => {
      e.stopPropagation();
      menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', menu.classList.contains('open'));
    });
    document.addEventListener('click', e => {
      if (!menu.classList.contains('open')) return;
      if (!menu.contains(e.target) && !btn.contains(e.target)){
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  };
  bind('#topReadBtn', '#topReadMenu');
  bind('#wdBtn', '#wdMenu');
  bind('#readBtn', '#readmenu');
})();

/* ---------- модалка категорий (главная) ---------- */
(() => {
  const brandCircle = document.querySelector('.brand i');
  const catModal = $('#catModal');
  const closeCatBtn = $('#closeCatBtn');
  if (!brandCircle || !catModal) return;

  brandCircle.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    catModal.hidden = false;
    document.body.style.overflow = 'hidden';
  });
  if (closeCatBtn) {
    closeCatBtn.addEventListener('click', () => {
      catModal.hidden = true;
      document.body.style.overflow = '';
    });
  }
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && !catModal.hidden) {
      catModal.hidden = true;
      document.body.style.overflow = '';
    }
  });
})();

/* ---------- модалка видео ---------- */
(() => {
  const modal = $('#vmodal'), frame = $('#vframe');
  if (!modal || !frame) return;
  let lastFocus = null;
  const open = id => {
    lastFocus = document.activeElement;
    frame.src = 'https://www.youtube.com/embed/' + id + '?autoplay=1&rel=0';
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    $('.modal-x', modal).focus();
  };
  const close = () => {
    modal.hidden = true;
    frame.src = '';
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };
  $$('[data-video]').forEach(b => b.addEventListener('click', () => open(b.dataset.video)));
  $$('[data-close]', modal).forEach(b => b.addEventListener('click', close));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) close(); });
})();

/* ---------- скролл полок ---------- */
(() => {
  $$('.shelf-btn').forEach(b => {
    b.addEventListener('click', () => {
      const track = document.getElementById(b.dataset.shelf);
      if (!track) return;
      track.scrollBy({
        left: (+b.dataset.dir) * Math.max(240, track.clientWidth * .86),
        behavior: reduce() ? 'auto' : 'smooth'
      });
    });
  });
})();

/* ---------- подписка + промо-ссылки ---------- */
/* ---------- подписка + промо-ссылки ---------- */
(() => {
  const inlineForm = $('#subForm');
  const inlineSeg = $('#subSeg');
  const inlineEmail = $('#email');

  const setTabOn = (seg, val) => {
    if (!seg) return;
    seg.querySelectorAll('.seg-btn').forEach(x => {
      const on = x.dataset.val === val;
      x.classList.toggle('on', on);
      x.setAttribute('aria-pressed', String(on));
    });
  };

  /* --- форма на самой странице (главная) --- */
  if (inlineSeg) {
    inlineSeg.addEventListener('click', e => {
      const b = e.target.closest('.seg-btn');
      if (!b) return;
      setTabOn(inlineSeg, b.dataset.val);
    });
  }
  if (inlineForm) {
    inlineForm.addEventListener('submit', e => {
      e.preventDefault();
      if (!inlineEmail.value || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(inlineEmail.value)) {
        toast('Проверьте адрес почты.');
        inlineEmail.focus();
        return;
      }
      toast('Готово. Первое письмо придёт с ближайшим запуском.');
      inlineForm.reset();
    });
  }

  /* --- модальное окно подписки --- */
  let modal = null, modalForm, modalSeg, modalEmail, modalLastFocus = null;

  function buildModal() {
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'subModal';
    modal.hidden = true;
    modal.innerHTML =
      '<div class="modal-back" data-close></div>' +
      '<div class="modal-box" role="dialog" aria-modal="true" aria-label="Подписка" style="max-width:520px">' +
        '<button class="modal-x" type="button" data-close aria-label="Закрыть">' +
          '<svg class="ic" aria-hidden="true"><use href="#i-close"/></svg>' +
        '</button>' +
        '<form class="panel news-f" novalidate>' +
          '<div>' +
            '<p class="eyebrow" style="margin-bottom:.4rem">Рассылка · раз в две недели</p>' +
            '<h2 class="news-h g ga" style="font-size:clamp(1.4rem,4vw,2rem);margin:0">Подпишись на&nbsp;новости</h2>' +
          '</div>' +
          '<label class="sr-only" for="subModalEmail">Email</label>' +
          '<input id="subModalEmail" type="email" name="email" placeholder="you@example.com" autocomplete="email" required>' +
          '<div class="seg" role="group" aria-label="Кому подписаться">' +
            '<button type="button" class="seg-btn" data-val="r" aria-pressed="false">Читателям</button>' +
            '<button type="button" class="seg-btn" data-val="w" aria-pressed="false">Писателям</button>' +
          '</div>' +
          '<button class="btn p" type="submit">Подписаться</button>' +
          '<p class="news-note mono">Никакого спама. Отписаться можно в один клик.</p>' +
        '</form>' +
      '</div>';
    document.body.appendChild(modal);

    modalForm = modal.querySelector('form');
    modalSeg = modal.querySelector('.seg');
    modalEmail = modal.querySelector('input[type=email]');

    modalSeg.addEventListener('click', e => {
      const b = e.target.closest('.seg-btn');
      if (!b) return;
      setTabOn(modalSeg, b.dataset.val);
    });

    modalForm.addEventListener('submit', e => {
      e.preventDefault();
      if (!modalSeg.querySelector('.seg-btn.on')) {
        toast('Выберите, кому подписаться: читателям или писателям.');
        return;
      }
      if (!modalEmail.value || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(modalEmail.value)) {
        toast('Проверьте адрес почты.');
        modalEmail.focus();
        return;
      }
      toast('Готово. Первое письмо придёт с ближайшим запуском.');
      modalForm.reset();
      setTabOn(modalSeg, null);
      closeModal();
    });

    modal.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeModal));
    addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });
    return modal;
  }

  function openModal(tab) {
    buildModal();
    setTabOn(modalSeg, tab || null);
    modalLastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    const x = modal.querySelector('.modal-x');
    if (x) x.focus();
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    if (modalLastFocus && modalLastFocus.focus) modalLastFocus.focus();
  }

  /* --- промо-кнопки --- */
  $$('.p-link').forEach(btn => {
    btn.addEventListener('click', () => {
      if (inlineForm) {
        if (btn.dataset.tab && inlineSeg) setTabOn(inlineSeg, btn.dataset.tab);
        const el = $('#subscribe');
        if (el) el.scrollIntoView({behavior: reduce() ? 'auto' : 'smooth', block: 'center'});
      } else {
        const isMobile = btn.classList.contains('p-mob');
        openModal(isMobile ? null : (btn.dataset.tab || null));
      }
    });
  });
})();

/* ---------- назад вверх ---------- */
(() => {
  const btn = $('#backToTop');
  if (!btn) return;
  addEventListener('scroll', () => btn.classList.toggle('show', scrollY > innerHeight * 0.8), {passive: true});
  btn.addEventListener('click', () => scrollTo({top: 0, behavior: reduce() ? 'auto' : 'smooth'}));
})();

/* ---------- копирование email ---------- */
(() => {
  const mail = $('#mail'), btn = $('#copymail');
  if (mail && btn) btn.addEventListener('click', () => copyText(mail.textContent));
})();

/* ---------- генератор вводных ---------- */
(() => {
  const box = $('#seed'), genBtn = $('#gen'), copyBtn = $('#copyseed');
  if (!box || !genBtn) return;

  const pick = a => a[Math.floor(Math.random() * a.length)];
  const A = ['Ка','Ве','Ор','Ми','Зен','Ар','Не','Си','Дра','Кор','Эл','Тар','Ила','Ной'];
  const B = ['лис','нор','ва','ти','ра','мен','сон','гея','лон','бек'];
  const C = ['', ' II', ' b', '-7', ' Дальняя'];
  const ATM = [
    'разреженный, выходить можно только в скафандре',
    'плотный и тёплый, как суп',
    'пригодный для дыхания, но с ядовитыми приливами',
    'почти нет, люди живут под куполами',
    'прозрачный: звёзды видны в разгар дня',
    'шумный: ветер никогда не стихает'
  ];
  const NEED = ['вода','запчасти','чужое разрешение','время','тишина','доверие'];
  const TROUBLE = [
    'смена экипажа задерживается уже второй год',
    'два посёлка делят единственный источник тепла',
    'терраформирование идёт быстрее, чем люди готовы меняться',
    'кто-то пользуется задержкой связи и отдаёт приказы от чужого имени',
    'найден артефакт, который нельзя ни прочитать, ни выбросить',
    'грузовой корабль вернулся раньше, чем улетел',
    'главный инженер скрывает, что запас воздуха считали неверно'
  ];
  const RULE = [
    'каждый разговор с Землёй стоит суток запаса воздуха',
    'двигатель работает только пока экипаж спит',
    'копия памяти оставляет оригинал без воспоминаний',
    'оружие нельзя брать на борт без согласия всего экипажа',
    'пассажиры стареют быстрее команды',
    'любое чудо оплачивается чьим-то временем'
  ];
  let text = '';

  function gen(){
    const s = {
      'Планета': pick(A) + pick(B) + pick(C),
      'Тяжесть': (.2 + Math.random() * 1.7).toFixed(2).replace('.', ',') + ' g',
      'Воздух': pick(ATM),
      'Не хватает': pick(NEED),
      'Что пошло не так': pick(TROUBLE),
      'Непреложное правило': pick(RULE),
      'Связь с метрополией': Math.round(3 + Math.random() * 37) + ' мин в одну сторону'
    };
    box.textContent = '';
    Object.keys(s).forEach(k => {
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = k;
      dd.textContent = s[k];
      if (k === 'Планета') dd.className = 'pn g gw';
      box.appendChild(dt);
      box.appendChild(dd);
    });
    text = Object.keys(s).map(k => k + ': ' + s[k]).join('\n');
  }
  genBtn.addEventListener('click', gen);
  if (copyBtn) copyBtn.addEventListener('click', () => copyText(text));
  gen();
})();

/* ---------- приёмник ---------- */
(() => {
  const rx = $('#rx');
  if (!rx) return;
  const N = 40, TARGET = 1420.40;
  const bars = [], spec = $('#spec');
  for (let i = 0; i < N; i++){ const b = document.createElement('i'); spec.appendChild(b); bars.push(b); }
  const f = $('#freq'), out = $('#fout'), fill = $('#mfill'), mtxt = $('#mtxt'), stat = $('#rxstat');
  let locked = store.get('hline') === '1', hold = 0, visible = false, running = false, last = 0;
  const fmt = v => v.toFixed(2).replace('.', ',');
  const sig = () => Math.exp(-Math.pow((parseFloat(f.value) - TARGET) / .9, 2));

  function unlock(){
    const secret = $('#secret');
    if (secret) secret.hidden = false;
  }
  function render(t){
    const s = sig(), tt = t / 1000;
    for (let i = 0; i < N; i++){
      const d = (i - (N - 1) / 2) / 3.2;
      const peak = s * .9 * Math.exp(-d * d);
      const noise = (.12 + .38 * (reduce() ? .5 : Math.random()) + .08 * Math.sin(tt * 2.2 + i * .9)) * (1 - .82 * s);
      bars[i].style.transform = 'scaleY(' + Math.min(1, .05 + noise + peak).toFixed(3) + ')';
    }
  }
  function sync(){
    out.textContent = fmt(parseFloat(f.value));
    const s = sig();
    fill.style.setProperty('--m', s.toFixed(3));
    mtxt.textContent = 'Уровень сигнала: ' + Math.round(s * 100) + '%';
  }
  function onLock(){
    locked = true;
    store.set('hline', '1');
    unlock();
    stat.classList.add('ok');
    stat.textContent = 'Захват. Три импульса, пауза, три импульса, повтор каждые 71 секунду. Расшифровка: «Мы тоже слушали».';
    toast('Найдена неопубликованная рукопись. Загляните в раздел «Книги».');
  }
  function check(t){
    if (locked) return;
    if (Math.abs(parseFloat(f.value) - TARGET) <= .05){
      if (reduce() || (hold && t - hold > 700)) onLock();
      else if (!hold) hold = t;
    } else hold = 0;
  }
  function loop(t){
    if (!visible){ running = false; return; }
    requestAnimationFrame(loop);
    if (t - last < 66) return;
    last = t;
    render(t);
    check(t);
  }
  const update = () => { sync(); render(performance.now()); check(performance.now()); };
  f.addEventListener('input', update);
  $$('.step').forEach(b => b.addEventListener('click', () => {
    f.value = (parseFloat(f.value) + parseFloat(b.dataset.step)).toFixed(2);
    update();
  }));
  if (locked){
    unlock();
    f.value = TARGET.toFixed(2);
    stat.classList.add('ok');
    stat.textContent = 'Сигнал уже пойман. Расшифровка: «Мы тоже слушали». Рукопись ждёт в разделе «Книги».';
  }
  sync();
  render(0);
  new IntersectionObserver(es => {
    visible = es[0].isIntersecting;
    if (visible && !running && !reduce()){ running = true; requestAnimationFrame(loop); }
  }).observe(rx);
})();

/* ---------- 3D-карусель (главная) ---------- */
(() => {
  const track = document.getElementById('hc-carouselTrack');
  const prevBtn = document.getElementById('hc-prevBtn');
  const nextBtn = document.getElementById('hc-nextBtn');
  const thumbs = document.querySelectorAll('.hc-thumb');
  if (!track || !prevBtn || !nextBtn) return;

  let currentIndex = 0;
  const totalSlides = 6;

  function updateCarousel(){
    track.style.transform = 'translateX(-' + (currentIndex * 100) + '%)';
    thumbs.forEach((thumb, i) => thumb.classList.toggle('active', i === currentIndex));
  }
  prevBtn.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
    updateCarousel();
  });
  nextBtn.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % totalSlides;
    updateCarousel();
  });
  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      currentIndex = parseInt(thumb.getAttribute('data-index'), 10);
      updateCarousel();
    });
  });
})();

/* ---------- лайтбокс для картинок 2 ---------- */
(() => {
  const items = $$('[data-lightbox]');
  if (!items.length) return;

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'imgModal';
  modal.hidden = true;
  
  // Стрелки создаются только если картинок больше одной
  const arrowsHTML = items.length > 1 ? `
      <button class="modal-arrow prev" type="button" aria-label="Предыдущее фото">←</button>
      <button class="modal-arrow next" type="button" aria-label="Следующее фото">→</button>
  ` : '';

  modal.innerHTML = `
    <div class="modal-back" data-close></div>
    <div class="modal-box" role="dialog" aria-modal="true" aria-label="Просмотр фото">
      <button class="modal-x" type="button" data-close aria-label="Закрыть">
        <svg class="ic" aria-hidden="true"><use href="#i-close"/></svg>
      </button>
      ${arrowsHTML}
      <figure class="modal-frame">
        <img id="imgModalSrc" src="" alt="">
        <figcaption id="imgModalCap"></figcaption>
      </figure>
    </div>
  `;
  document.body.appendChild(modal);

  const imgEl = modal.querySelector('#imgModalSrc');
  const capEl = modal.querySelector('#imgModalCap');
  const prevBtn = modal.querySelector('.modal-arrow.prev');
  const nextBtn = modal.querySelector('.modal-arrow.next');
  let lastFocus = null;
  let currentIndex = 0;

  const update = (index) => {
    currentIndex = (index + items.length) % items.length;
    const btn = items[currentIndex];
    const src = btn.dataset.lightbox;
    const cap = btn.dataset.caption;
    const img = btn.querySelector('img');
    imgEl.src = src;
    imgEl.alt = img ? img.alt : (cap || '');
    if (cap) {
      capEl.textContent = cap;
      capEl.hidden = false;
    } else {
      capEl.hidden = true;
    }
  };

  const open = (index) => {
    lastFocus = document.activeElement;
    update(index);
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal-x').focus();
  };

  const close = () => {
    modal.hidden = true;
    imgEl.src = '';
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };

  items.forEach((btn, i) => {
    btn.addEventListener('click', () => open(i));
  });

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); update(currentIndex - 1); });
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); update(currentIndex + 1); });
  }

  modal.addEventListener('click', e => {
    if (
      e.target === modal || 
      e.target.classList.contains('modal-back') || 
      e.target.classList.contains('modal-frame') ||
      e.target.classList.contains('modal-box')
    ) {
      close();
    }
  });

  modal.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));

  addEventListener('keydown', e => {
    if (modal.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft' && items.length > 1) update(currentIndex - 1);
    if (e.key === 'ArrowRight' && items.length > 1) update(currentIndex + 1);
  });
})();


/* ---------- тематический фон (слайдшоу и статика) ---------- */
(() => {
  const containers = $$('.theme-bg-container');
  if (!containers.length) return;

  // Вешаем класс на body, чтобы скрыть дефолтные звезды
  document.body.classList.add('theme-bg');

  containers.forEach(container => {
    // Если это статичный фон (нет data-images), JS дальше не нужен
    if (!container.dataset.images) return;

    const duration = parseInt(container.dataset.duration || 10000, 10);
    const images = container.dataset.images.split(',').map(s => s.trim()).filter(Boolean);
    if (!images.length) return;

    // Создаем два слоя для перекрестного затухания
    const layer1 = document.createElement('div');
    const layer2 = document.createElement('div');
    layer1.className = 'theme-bg-layer active';
    layer2.className = 'theme-bg-layer';
    layer1.style.backgroundImage = `url('${images[0]}')`;
    container.appendChild(layer1);
    container.appendChild(layer2);

    let current = 0;
    let isLayer1 = true;

    function nextSlide() {
      const currentLayer = isLayer1 ? layer1 : layer2;
      const nextLayer = isLayer1 ? layer2 : layer1;
      current = (current + 1) % images.length;

      nextLayer.style.backgroundImage = `url('${images[current]}')`;
      
      // Сброс анимации зума для нового слоя
      nextLayer.classList.remove('zoomed', 'active');
      void nextLayer.offsetWidth; // принудительный рефлоу
      
      nextLayer.classList.add('active');
      currentLayer.classList.remove('active');
      isLayer1 = !isLayer1;

      // Начинаем медленный зум на 7-й секунде (70% от duration)
      setTimeout(() => {
        nextLayer.classList.add('zoomed');
      }, duration * 0.7);
    }

    // Первый запуск зума
    setTimeout(() => {
      layer1.classList.add('zoomed');
    }, duration * 0.7);

    // Запуск интервала переключения
    if (images.length > 1) {
      setInterval(nextSlide, duration);
    }
  });
})();

(function initSvgPlayer() {
  const obj      = document.getElementById('svgPlayerObj');
  const playBtn  = document.getElementById('svgPlayBtn');
  const pauseBtn = document.getElementById('svgPauseBtn');

  let svgDoc = null;
  let svgRoot = null;
  let loaded = false;

  // Ставит все анимации (SMIL + CSS) на паузу. reset=true — на кадр 0
  function pauseAll(reset) {
    // SMIL (<animate>, <animateTransform>)
    if (svgRoot) {
      try { svgRoot.pauseAnimations(); } catch (e) {}
      if (reset) { try { svgRoot.setCurrentTime(0); } catch (e) {} }
    }
    // CSS-анимации внутри SVG (Web Animations API)
    if (svgDoc && typeof svgDoc.getAnimations === 'function') {
      try {
        svgDoc.getAnimations().forEach(a => {
          a.pause();
          if (reset) a.currentTime = 0;
        });
      } catch (e) {}
    }
  }

  // Продолжает все анимации
  function playAll() {
    if (svgRoot) {
      try { svgRoot.unpauseAnimations(); } catch (e) {}
    }
    if (svgDoc && typeof svgDoc.getAnimations === 'function') {
      try { svgDoc.getAnimations().forEach(a => a.play()); } catch (e) {}
    }
  }

  obj.addEventListener('load', () => {
    try {
      svgDoc  = obj.contentDocument;
      svgRoot = svgDoc && svgDoc.documentElement;
      if (!svgRoot) {
        console.warn('[svg-player] Нет доступа к содержимому SVG (cross-origin?). ' +
                     'Play/Pause работать не будет — положи SVG рядом с HTML.');
        return;
      }
      loaded = true;
      // Останавливаем и сбрасываем на первый кадр
      pauseAll(true);
      // Повторно через 50 мс — на случай, если анимации инициализировались позже
      setTimeout(() => pauseAll(true), 50);
    } catch (e) {
      console.warn('[svg-player] Ошибка доступа к SVG:', e);
    }
  });

  playBtn.addEventListener('click', () => {
    if (!loaded) return;
    playAll();
    playBtn.classList.add('hidden');
    pauseBtn.classList.remove('hidden');
  });

  pauseBtn.addEventListener('click', () => {
    pauseAll(false); // пауза, но НЕ сброс — продолжит с того же места
    pauseBtn.classList.add('hidden');
    playBtn.classList.remove('hidden');
  });
})();

/* всегда в конце */

try { console.log('%c Сигнал принят ', 'background:#ffb23f;color:#07090f;font:700 14px monospace;padding:4px 8px', '\nЕсли вы читаете код, привет, коллега.'); } catch (e) {}
})();