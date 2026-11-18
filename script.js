(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var fine = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);

  /* ---------- Fondo ---------- */
  (function () {
    var host = $('#sym');
    if (!host || reduce) return;
    var chars = ['i', 'ℂ', '√', 'π', '∑', 'z', 'a+bi', '−1', 'Re', 'Im'];
    for (var k = 0; k < 14; k++) {
      var s = document.createElement('span');
      s.textContent = chars[k % chars.length];
      s.style.left = (Math.random() * 95) + '%';
      s.style.top = (Math.random() * 95) + '%';
      s.style.setProperty('--s', (18 + Math.random() * 30) + 'px');
      s.style.setProperty('--d', (9 + Math.random() * 10) + 's');
      s.style.setProperty('--dl', (-Math.random() * 10) + 's');
      host.appendChild(s);
    }
  })();
  requestAnimationFrame(function () { setTimeout(function () { document.body.classList.add('ready'); }, 80); });

  /* ---------- Revelado por scroll ---------- */
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }) : null;

  function prepareReveal(view) {
    var els = $$('[data-reveal]', view);
    els.forEach(function (el, idx) {
      if (!el.style.getPropertyValue('--rd')) el.style.setProperty('--rd', Math.min(idx, 10) * 70 + 'ms');
      el.classList.remove('in');
    });
    if (!io || reduce) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    setTimeout(function () { els.forEach(function (el) { io.observe(el); }); }, 60);
  }

  /* ---------- Tilt 3D ---------- */
  if (fine && !reduce) {
    document.addEventListener('pointermove', function (e) {
      var card = e.target.closest && e.target.closest('[data-tilt]');
      if (!card) return;
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--ry', ((px - 0.5) * 7).toFixed(2) + 'deg');
      card.style.setProperty('--rx', ((0.5 - py) * 6).toFixed(2) + 'deg');
      card.style.setProperty('--mx', (px * 100) + '%');
      card.style.setProperty('--my', (py * 100) + '%');
    });
    document.addEventListener('pointerout', function (e) {
      var card = e.target.closest && e.target.closest('[data-tilt]');
      if (!card || card.contains(e.relatedTarget)) return;
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  }

  /* ---------- Progreso y parallax ---------- */
  var ORDER = ['inicio', 'operaciones', 'practica', 'reflexion', 'conclusion', 'perfil'];
  var visited = { inicio: true };
  var ticking = false;

  function updateTopBar() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    var seen = Object.keys(visited).length / ORDER.length * 100;
    $('#gbar').style.width = Math.min(100, seen * 0.7 + pct * 0.3).toFixed(1) + '%';
  }

  function parallax() {
    ticking = false;
    if (reduce) return;
    var y = window.scrollY;
    $$('.blob').forEach(function (b, idx) {
      b.style.transform = 'translate3d(0,' + (y * (0.04 + idx * 0.02)) + 'px,0)';
    });
    var view = document.querySelector('.view.active');
    if (view) $$('.deco', view).forEach(function (d, idx) {
      d.style.transform = 'translate3d(0,' + (y * -0.05 * (idx + 1)) + 'px,0)';
    });
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(parallax); }
    updateTopBar();
  }, { passive: true });

  /* ---------- Navegación ---------- */
  var current = 'inicio';
  var busy = false;
  var tabs = $$('.tab');
  var pill = $('#pill');

  function movePill(id) {
    var tab = document.querySelector('.tab[data-go="' + id + '"]');
    if (!tab || !pill) return;
    pill.style.width = tab.offsetWidth + 'px';
    pill.style.transform = 'translateX(' + tab.offsetLeft + 'px)';
  }

  function setTabs(id) {
    tabs.forEach(function (t) { t.setAttribute('aria-current', t.getAttribute('data-go') === id ? 'true' : 'false'); });
    movePill(id);
  }

  function activate(target, id) {
    current = id;
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'auto' });
    prepareReveal(target);
    if (id === 'practica') refreshPractice();
    if (id === 'reflexion') refreshReflection();
    if (id === 'perfil') renderProfile();
    updateTopBar();
  }

  function go(id) {
    var target = document.getElementById('v-' + id);
    if (!target || busy || id === current) return;
    busy = true;
    var from = document.getElementById('v-' + current);
    visited[id] = true;
    setTabs(id);
    try { history.replaceState(null, '', '#' + id); } catch (e) { /* ignorar */ }
    if (!reduce && from) {
      from.classList.add('leaving');
      setTimeout(function () {
        from.classList.remove('active', 'leaving');
        activate(target, id);
        busy = false;
      }, 380);
    } else {
      if (from) from.classList.remove('active', 'leaving');
      activate(target, id);
      busy = false;
    }
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-go]');
    if (!btn) return;
    e.preventDefault();
    if (btn.hasAttribute('data-reset-ex')) resetPractice();
    go(btn.getAttribute('data-go'));
  });

  tabs.forEach(function (t) {
    t.addEventListener('keydown', function (e) {
      var idx = ORDER.indexOf(t.getAttribute('data-go'));
      if (e.key === 'ArrowRight') { e.preventDefault(); go(ORDER[Math.min(ORDER.length - 1, idx + 1)]); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(ORDER[Math.max(0, idx - 1)]); }
    });
  });

  window.addEventListener('resize', function () { movePill(current); });

  prepareReveal(document.getElementById('v-inicio'));
  setTabs('inicio');
  setTimeout(function () { movePill(current); }, 60);
  updateTopBar();

  /* ---------- Fórmula interactiva ---------- */
  var PARTS = {
    a: { title: 'a · Parte real', text: 'Es el número que aparece sin la unidad imaginaria. En 3 + 2i, <span class="res">a = 3</span>. Si el número es real puro, como 5, entonces b = 0.' },
    b: { title: 'b · Coeficiente imaginario', text: 'Es el número real que multiplica a i. En 3 + 2i, <span class="res">b = 2</span>. Observá que b es 2, no 2i: la unidad i aparece aparte.' },
    i: { title: 'i · Unidad imaginaria', text: 'Cumple <span class="res">i² = −1</span>. Gracias a ella podemos escribir √−1 como i y operar con raíces de números negativos.' }
  };
  var panel = $('#partPanel');
  var partEls = $$('.part');

  function showPart(key) {
    var info = PARTS[key];
    if (!info) return;
    partEls.forEach(function (p) { p.classList.toggle('on', p.getAttribute('data-part') === key); });
    panel.classList.remove('swap');
    void panel.offsetWidth;
    panel.innerHTML = '<strong>' + info.title + '</strong><p>' + info.text + '</p>';
    panel.classList.add('swap');
  }

  partEls.forEach(function (p) {
    p.addEventListener('click', function () { showPart(p.getAttribute('data-part')); });
    p.addEventListener('mouseenter', function () { if (fine) showPart(p.getAttribute('data-part')); });
    p.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showPart(p.getAttribute('data-part')); }
    });
  });

  /* ---------- Pasos a paso ---------- */
  var STEPS = {
    'st-unit': [
      { tag: 'Planteo', html: 'Queremos calcular <b>√−9</b>.' },
      { tag: 'Separación', html: 'Separamos el signo negativo: √−9 = √(9 · (−1)).' },
      { tag: 'Propiedad', html: 'Aplicamos √(a·b) = √a · √b: √−9 = √9 · √−1 = 3 · √−1.' },
      { tag: 'Definición', html: 'Por definición, √−1 = <b>i</b>, entonces √−9 = <span class="res">3i</span>.' },
      { tag: 'Comprobación', html: '(3i)² = 9 · i² = 9 · (−1) = −9 ✓' }
    ],
    'st-sum': [
      { tag: 'Ejemplo', html: 'Dados (3 + 2i) + (1 + 4i).' },
      { tag: 'Paso 1 · Agrupación', html: '(3 + 1) + (2i + 4i)' },
      { tag: 'Paso 2 · Suma', html: '4 + 6i' },
      { tag: 'Resultado', html: '<span class="res">4 + 6i</span>' }
    ],
    'st-sub': [
      { tag: 'Ejemplo', html: 'Dados (5 + 3i) − (2 + i). El signo − afecta a todo el segundo complejo.' },
      { tag: 'Paso 1 · Agrupación', html: '(5 − 2) + (3i − i)' },
      { tag: 'Paso 2 · Resta', html: '3 + 2i' },
      { tag: 'Resultado', html: '<span class="res">3 + 2i</span>' }
    ],
    'st-mul': [
      { tag: 'Ejemplo', html: 'Dados (2 + i)(3 + i). Aplicamos la propiedad distributiva.' },
      { tag: 'Paso 1 · Distributiva', html: '2·3 + 2·i + i·3 + i·i = 6 + 2i + 3i + i²' },
      { tag: 'Paso 2 · Sustitución', html: 'Sumamos términos semejantes y reemplazamos i² por −1: 6 + 5i − 1' },
      { tag: 'Resultado', html: '<span class="res">5 + 5i</span>' }
    ]
  };

  $$('[data-stepper]').forEach(function (box) {
    var steps = STEPS[box.getAttribute('data-stepper')] || [];
    var idx = 0;
    var area = $('.step-area', box), dots = $('.dots', box), bar = $('.bar i', box);
    var cur = $('.counter .cur', box), tot = $('.counter .tot', box);
    var prev = $('[data-act="prev"]', box), next = $('[data-act="next"]', box);
    tot.textContent = steps.length;
    steps.forEach(function () { dots.appendChild(document.createElement('i')); });

    function render() {
      area.innerHTML = '';
      steps.forEach(function (s, k) {
        if (k > idx) return;
        var el = document.createElement('div');
        el.className = 'step' + (k === idx ? ' now' : ' past');
        el.innerHTML = '<span class="tag">' + s.tag + '</span>' + s.html;
        area.appendChild(el);
      });
      $$('i', dots).forEach(function (d, k) { d.className = k < idx ? 'done' : (k === idx ? 'cur' : ''); });
      cur.textContent = idx + 1;
      bar.style.width = ((idx + 1) / steps.length * 100) + '%';
      prev.disabled = idx === 0;
      next.disabled = idx === steps.length - 1;
      next.textContent = idx === steps.length - 1 ? 'Completado ✓' : 'Siguiente →';
    }

    prev.addEventListener('click', function () { if (idx > 0) { idx--; render(); } });
    next.addEventListener('click', function () { if (idx < steps.length - 1) { idx++; render(); } });
    $('[data-act="reset"]', box).addEventListener('click', function () { idx = 0; render(); });
    render();
  });

  /* ---------- Práctica ---------- */
  var EXERCISES = {
    1: { type: 'pair', re: 4, im: 7,
      hint: 'La parte real es el número sin i. El coeficiente imaginario es el número que acompaña a i, sin la i.',
      expl: 'En 4 + 7i, la parte real es <span class="res">4</span> y el coeficiente imaginario es <span class="res">7</span>.' },
    2: { type: 'complex', re: 6, im: 4,
      hint: 'Sumá las partes reales (2 + 4) y las partes imaginarias (3i + i).',
      expl: '(2 + 3i) + (4 + i) = (2 + 4) + (3i + i) = <span class="res">6 + 4i</span>.' },
    3: { type: 'complex', re: 4, im: 2,
      hint: 'Restá las partes reales (6 − 2) y las imaginarias (5i − 3i). Cuidado con el signo.',
      expl: '(6 + 5i) − (2 + 3i) = (6 − 2) + (5i − 3i) = <span class="res">4 + 2i</span>.' },
    4: { type: 'complex', re: 0, im: 5,
      hint: 'Aplicá la distributiva: 2 + i + 4i + 2i². Después reemplazá i² por −1.',
      expl: '2 + i + 4i + 2i² = 2 + 5i − 2 = <span class="res">5i</span>, es decir, 0 + 5i.' }
  };

  var state = {};
  for (var k = 1; k <= 4; k++) state[k] = { done: false, attempts: 0, hints: 0 };

  function parseReal(raw) {
    var s = String(raw).trim().replace(/\s+/g, '').replace(/−/g, '-').replace(',', '.');
    if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
    return parseFloat(s);
  }

  /* Acepta 6+4i, 5i, 0+5i, 5*i, 5·i, -5i, i, 4-7i, 4 */
  function parseComplex(raw) {
    var s = String(raw).trim().replace(/\s+/g, '').replace(/−/g, '-').replace(/[·×]/g, '*').replace(/,/g, '.');
    if (s === '') return null;
    if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(s)) return { re: parseFloat(s), im: 0 };
    if (!/i$/.test(s)) return null;
    var body = s.slice(0, -1).replace(/\*$/, '');
    var cut = -1;
    for (var j = body.length - 1; j > 0; j--) {
      if (body[j] === '+' || body[j] === '-') { cut = j; break; }
    }
    var reStr = cut > 0 ? body.slice(0, cut) : '';
    var imStr = cut > 0 ? body.slice(cut) : body;
    var re = reStr === '' ? 0 : parseReal(reStr);
    var im = (imStr === '' || imStr === '+') ? 1 : (imStr === '-' ? -1 : parseReal(imStr));
    if (re === null || im === null) return null;
    return { re: re, im: im };
  }

  function nearly(a, b) { return Math.abs(a - b) < 1e-9; }

  function setFeedback(card, ok, msg) {
    var fb = $('[data-fb]', card);
    card.classList.remove('ok', 'bad');
    void card.offsetWidth;
    card.classList.add(ok ? 'ok' : 'bad');
    fb.className = 'fb ' + (ok ? 'ok' : 'bad');
    fb.textContent = msg;
    var st = $('[data-status]', card);
    st.className = 'ex-status ' + (ok ? 'ok' : 'bad');
    st.textContent = ok ? 'Correcto ✓' : 'Revisá el procedimiento';
    if (ok) burst(card);
  }

  function burst(card) {
    if (reduce) return;
    var colors = ['#7ff7e4', '#22d3ee', '#4ade80', '#2dd4bf'];
    for (var j = 0; j < 14; j++) {
      var s = document.createElement('span');
      var ang = j / 14 * Math.PI * 2;
      var dist = 70 + Math.random() * 40;
      s.className = 'spark';
      s.style.left = '50%';
      s.style.top = '40%';
      s.style.setProperty('--c', colors[j % colors.length]);
      s.style.setProperty('--tx', (Math.cos(ang) * dist).toFixed(1) + 'px');
      s.style.setProperty('--ty', (Math.sin(ang) * dist).toFixed(1) + 'px');
      card.appendChild(s);
      setTimeout(removeNode(s), 1000);
    }
  }

  function removeNode(el) {
    return function () { if (el.parentNode) el.parentNode.removeChild(el); };
  }

  function refreshPractice() {
    var n = 0;
    for (var j = 1; j <= 4; j++) if (state[j].done) n++;
    $('#solvedN').textContent = n;
    $('#practiceBar').style.width = (n / 4 * 100) + '%';
  }

  var FIXED_XP = { 1: 10, 2: 10, 3: 10, 4: 15 };

  function finishExercise(n, card, msg) {
    state[n].done = true;
    var u = currentUser();
    if (u) {
      if (u.fixedSolved.indexOf(n) === -1) {
        u.fixedSolved.push(n);
        var pts = FIXED_XP[n] + (state[n].attempts === 1 ? 5 : 0);
        msg += ' +' + pts + ' XP';
        registerResult(u, true, pts, 'Guiado ' + n + ': ' + card.querySelector('.ex-expr').textContent);
      } else {
        msg += ' (La XP de este ejercicio ya la ganaste antes.)';
      }
    }
    setFeedback(card, true, msg);
    $$('input', card).forEach(function (i) { i.disabled = true; });
    $('[data-check]', card).disabled = true;
    $('[data-explain]', card).disabled = false;
    refreshPractice();
  }

  function checkExercise(n) {
    var card = document.querySelector('[data-ex="' + n + '"]');
    var ex = EXERCISES[n];
    if (state[n].done) return;
    state[n].attempts++;

    if (ex.type === 'pair') {
      var inRe = $('[data-f="re"]', card), inIm = $('[data-f="im"]', card);
      var vRe = parseReal(inRe.value), vIm = parseReal(inIm.value);
      if (vRe === null || vIm === null) {
        setFeedback(card, false, 'Completá los dos campos con números.');
        return;
      }
      var okRe = nearly(vRe, ex.re), okIm = nearly(vIm, ex.im);
      inRe.classList.toggle('right', okRe); inRe.classList.toggle('wrong', !okRe);
      inIm.classList.toggle('right', okIm); inIm.classList.toggle('wrong', !okIm);
      if (okRe && okIm) {
        finishExercise(n, card, 'Muy bien: la parte real es 4 y el coeficiente imaginario es 7.');
      } else {
        var where = (!okRe && !okIm) ? 'Ninguno de los dos valores es correcto.'
          : (!okRe ? 'Revisá la parte real.' : 'Revisá el coeficiente imaginario.');
        setFeedback(card, false, where + ' Podés volver a intentarlo o pedir una pista.');
      }
      return;
    }

    var input = $('[data-f="z"]', card);
    var z = parseComplex(input.value);
    if (!z) {
      input.classList.remove('right');
      input.classList.add('wrong');
      setFeedback(card, false, 'No pude leer la respuesta. Escribila con el formato a + bi (por ejemplo 9 − 1i).');
      return;
    }
    var ok = nearly(z.re, ex.re) && nearly(z.im, ex.im);
    input.classList.toggle('right', ok);
    input.classList.toggle('wrong', !ok);
    if (ok) finishExercise(n, card, 'Excelente, el resultado es correcto.');
    else setFeedback(card, false, 'Todavía no es correcto. Revisá el procedimiento o pedí una pista.');
  }

  function showHint(n) {
    var card = document.querySelector('[data-ex="' + n + '"]');
    var box = $('[data-hints]', card);
    if (box.children.length) return;
    var h = document.createElement('div');
    h.className = 'hint';
    h.textContent = 'Pista: ' + EXERCISES[n].hint;
    box.appendChild(h);
    state[n].hints++;
  }

  function showExplain(n) {
    var card = document.querySelector('[data-ex="' + n + '"]');
    var box = $('[data-explain-box]', card);
    if (!state[n].done) {
      setFeedback(card, false, 'Primero intentá resolverlo. La explicación se habilita al responder correctamente.');
      return;
    }
    box.hidden = false;
    box.innerHTML = '<strong style="color:var(--cyan)">Explicación</strong><div class="mathline">' + EXERCISES[n].expl + '</div>';
  }

  function retryExercise(n) {
    var card = document.querySelector('[data-ex="' + n + '"]');
    if (state[n].done) return;
    card.classList.remove('ok', 'bad');
    $$('input', card).forEach(function (i) { i.value = ''; i.classList.remove('right', 'wrong'); });
    var fb = $('[data-fb]', card);
    fb.className = 'fb';
    fb.textContent = '';
    var st = $('[data-status]', card);
    st.className = 'ex-status';
    st.textContent = 'Pendiente';
    $$('input', card)[0].focus();
  }

  function resetPractice() {
    for (var j = 1; j <= 4; j++) {
      state[j] = { done: false, attempts: 0, hints: 0 };
      var card = document.querySelector('[data-ex="' + j + '"]');
      $$('input', card).forEach(function (i) { i.value = ''; i.disabled = false; i.classList.remove('right', 'wrong'); });
      $('[data-check]', card).disabled = false;
      $('[data-explain]', card).disabled = true;
      $('[data-explain-box]', card).hidden = true;
      $('[data-hints]', card).innerHTML = '';
      var fb = $('[data-fb]', card);
      fb.className = 'fb';
      fb.textContent = '';
      card.classList.remove('ok', 'bad');
      var st = $('[data-status]', card);
      st.className = 'ex-status';
      st.textContent = 'Pendiente';
    }
    $('#summary').classList.remove('show');
    refreshPractice();
  }

  $$('[data-ex]').forEach(function (card) {
    var n = parseInt(card.getAttribute('data-ex'), 10);
    $('[data-check]', card).addEventListener('click', function () { checkExercise(n); });
    $('[data-hint]', card).addEventListener('click', function () { showHint(n); });
    $('[data-explain]', card).addEventListener('click', function () { showExplain(n); });
    $('[data-retry]', card).addEventListener('click', function () { retryExercise(n); });
    $$('input', card).forEach(function (inp) {
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') checkExercise(n); });
    });
  });

  $('#btnSummary').addEventListener('click', function () {
    var solved = 0;
    var list = $('#sumList');
    list.innerHTML = '';
    for (var j = 1; j <= 4; j++) {
      if (state[j].done) solved++;
      var li = document.createElement('li');
      var a = document.createElement('span');
      a.textContent = 'Ejercicio ' + j + ': ' + (state[j].done ? 'resuelto ✓' : 'pendiente');
      var b = document.createElement('span');
      b.textContent = 'Intentos: ' + state[j].attempts + ' · Pistas: ' + state[j].hints;
      li.appendChild(a);
      li.appendChild(b);
      list.appendChild(li);
    }
    $('#sumText').textContent = 'Resolviste ' + solved + ' de 4 ejercicios.';
    $('#summary').classList.add('show');
  });

  $('#btnResetPractice').addEventListener('click', resetPractice);

  /* ---------- Reflexión (se conserva durante la sesión) ---------- */
  var QUESTIONS = [
    '¿Qué aprendí sobre los números complejos?',
    '¿Puedo diferenciar la parte real de la parte imaginaria?',
    '¿Qué operación me resultó más fácil?',
    '¿Qué tema me costó más comprender?',
    '¿Qué hice para resolver mis dudas?',
    '¿En qué necesito seguir practicando?'
  ];
  var answers = QUESTIONS.map(function () { return ''; });
  var reflGrid = $('#reflGrid');

  function isAnswered(idx) { return answers[idx].trim().length >= 3; }

  function updateReflProgress() {
    var n = 0;
    for (var j = 0; j < QUESTIONS.length; j++) if (isAnswered(j)) n++;
    $('#reflN').textContent = n;
    $('#reflBar').style.width = (n / QUESTIONS.length * 100) + '%';
  }

  function paintQuestion(card, idx) {
    var ok = isAnswered(idx);
    card.classList.toggle('done', ok);
    $('.q-state', card).textContent = ok ? 'Respondida ✓' : 'Sin responder';
    $('.q-count', card).textContent = answers[idx].length + ' / 600';
  }

  function buildReflection() {
    reflGrid.innerHTML = '';
    QUESTIONS.forEach(function (text, idx) {
      var card = document.createElement('div');
      card.className = 'q';
      card.innerHTML =
        '<div class="q-head"><div class="q-n">' + (idx + 1) + '</div><div class="q-title"></div></div>' +
        '<textarea maxlength="600" placeholder="Escribí tu respuesta…" aria-label="Respuesta ' + (idx + 1) + '"></textarea>' +
        '<div class="q-foot"><span class="q-state"></span><span class="q-count"></span></div>';
      $('.q-title', card).textContent = text;
      var ta = $('textarea', card);
      ta.value = answers[idx];
      ta.addEventListener('input', function () {
        answers[idx] = ta.value;
        paintQuestion(card, idx);
        updateReflProgress();
      });
      reflGrid.appendChild(card);
      paintQuestion(card, idx);
    });
    updateReflProgress();
  }

  function refreshReflection() {
    if (!reflGrid.children.length) buildReflection();
    $$('.q', reflGrid).forEach(function (c, idx) {
      $('textarea', c).value = answers[idx];
      paintQuestion(c, idx);
    });
    updateReflProgress();
  }

  $('#btnReview').addEventListener('click', function () {
    var list = $('#reviewList');
    list.innerHTML = '';
    QUESTIONS.forEach(function (q, idx) {
      var item = document.createElement('div');
      item.className = 'rev-item';
      var title = document.createElement('b');
      title.textContent = (idx + 1) + '. ' + q;
      var body = document.createElement('p');
      body.textContent = answers[idx].trim() ? answers[idx] : '(sin respuesta)';
      item.appendChild(title);
      item.appendChild(body);
      list.appendChild(item);
    });
    $('#review').classList.add('show');
    $('#reflMsg').textContent = 'Revisá tus respuestas. Podés editarlas antes de finalizar.';
  });

  $('#btnFinish').addEventListener('click', function () {
    var n = 0;
    for (var j = 0; j < QUESTIONS.length; j++) if (isAnswered(j)) n++;
    if (n < QUESTIONS.length) {
      $('#reflMsg').textContent = 'Te faltan ' + (QUESTIONS.length - n) + ' preguntas por responder.';
      return;
    }
    $('#final').classList.add('show');
    $('#reflMsg').textContent = '';
  });

  /* Estado inicial de la reflexión */
  buildReflection();

  /* =========================================================
     USUARIOS, CONTRASEÑAS Y EXPERIENCIA
     ========================================================= */
  var fb = null; // sin servidor: todo se guarda en el navegador

  /* ----- Modo local (sin Firebase) ----- */
  var DB_KEY = 'complejos_usuarios_v1';
  var memDB = null;
  function loadDB() {
    try { var raw = localStorage.getItem(DB_KEY); if (raw) return JSON.parse(raw) || {}; }
    catch (e) { /* sin almacenamiento */ }
    return memDB || {};
  }
  function saveDB(db) {
    memDB = db;
    try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) { /* ignorar */ }
  }

  /* ----- Usuario en sesión ----- */
  var me = null;
  function currentUser() { return me; }
  function plain(u) { var o = {}; for (var k in u) if (k !== 'save' && u.hasOwnProperty(k)) o[k] = u[k]; return o; }
  function newUserData(name) {
    return { name: name, xp: 0, created: Date.now(), seed: randHex(8), fixedSolved: [], seen: [], history: [],
      stats: { solved: 0, wrong: 0, streak: 0, best: 0 } };
  }
  // Prepara los datos y les agrega save(), que guarda en Firebase o en el navegador
  function startSession(data, saver) {
    var u = data;
    u.xp = u.xp || 0;
    u.fixedSolved = u.fixedSolved || [];
    u.seen = u.seen || [];
    u.history = u.history || [];
    u.stats = u.stats || { solved: 0, wrong: 0, streak: 0, best: 0 };
    if (!u.seed) u.seed = randHex(8);
    u.save = function () { saver(plain(u)); };
    me = u;
  }
  function localSaver(key) {
    return function (data) { var db = loadDB(); var old = db[key] || {}; data.salt = old.salt; data.hash = old.hash; data.algo = old.algo; db[key] = data; saveDB(db); };
  }

  function randHex(n) {
    var a = new Uint8Array(n);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a);
    else for (var j = 0; j < n; j++) a[j] = Math.floor(Math.random() * 256);
    return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }
  function fallbackHash(str) { // hash simple (solo si no hay crypto.subtle)
    var h1 = 0x811c9dc5, h2 = 0x01000193;
    for (var j = 0; j < str.length; j++) {
      h1 = Math.imul(h1 ^ str.charCodeAt(j), 16777619) >>> 0;
      h2 = Math.imul(h2 + str.charCodeAt(j), 2246822519) >>> 0;
    }
    return h1.toString(16) + h2.toString(16);
  }
  function hashPass(pass, salt, algo) {
    if (algo === 'sha256' && window.crypto && crypto.subtle && window.TextEncoder) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + pass)).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
      });
    }
    return Promise.resolve(fallbackHash(salt + ':' + pass));
  }
  var ALGO = (window.crypto && crypto.subtle && window.TextEncoder) ? 'sha256' : 'simple';

  /* ----- Niveles ----- */
  var LEVEL_NAMES = [
    { sym: 'ℕ', name: 'Natural' }, { sym: 'ℤ', name: 'Entero' }, { sym: 'ℚ', name: 'Racional' },
    { sym: 'ℝ', name: 'Real' }, { sym: 'ℂ', name: 'Complejo' }
  ];
  function levelMin(L) { return 50 * (L - 1) * L; }   // 1:0, 2:100, 3:300, 4:600, 5:1000...
  function levelOf(xp) { var L = 1; while (xp >= levelMin(L + 1)) L++; return L; }
  function levelInfo(L) {
    var base = LEVEL_NAMES[Math.min(L, LEVEL_NAMES.length) - 1];
    var extra = L > LEVEL_NAMES.length ? ' ' + (L - LEVEL_NAMES.length + 1) : '';
    return { sym: base.sym, name: 'Nivel ' + L + ' · ' + base.name + extra };
  }

  function toast(text, cls) {
    var t = document.createElement('div');
    t.className = 'toast' + (cls ? ' ' + cls : '');
    t.textContent = text;
    $('#toasts').appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(removeNode(t), 450); }, 2600);
  }

  function registerResult(u, ok, pts, label) {
    var before = levelOf(u.xp);
    if (ok) {
      u.xp += pts;
      u.stats.solved++;
      u.stats.streak++;
      if (u.stats.streak > u.stats.best) u.stats.best = u.stats.streak;
    } else {
      u.stats.wrong++;
      u.stats.streak = 0;
    }
    u.history.unshift({ e: label, ok: ok, xp: ok ? pts : 0, t: Date.now() });
    if (u.history.length > 30) u.history.length = 30;
    u.save();
    if (ok && pts) toast('+' + pts + ' XP');
    var after = levelOf(u.xp);
    if (after > before) setTimeout(function () { toast('¡Subiste de nivel! ' + levelInfo(after).name, 'lvl'); }, 500);
    updateChip();
  }

  function updateChip() {
    var u = currentUser(), chip = $('#uchip');
    if (!u) { chip.classList.remove('show'); return; }
    chip.classList.add('show');
    $('#chipAv').textContent = u.name.charAt(0).toUpperCase();
    $('#chipName').textContent = u.name;
    $('#chipXp').textContent = u.xp + ' XP';
  }

  function renderProfile() {
    var u = currentUser();
    if (!u) return;
    var L = levelOf(u.xp), info = levelInfo(L);
    var from = levelMin(L), to = levelMin(L + 1);
    $('#pAv').textContent = u.name.charAt(0).toUpperCase();
    $('#pName').textContent = u.name;
    $('#pLvlSym').textContent = info.sym;
    $('#pLvl').textContent = info.name;
    $('#pSince').textContent = 'Miembro desde ' + new Date(u.created).toLocaleDateString('es-AR');
    $('#pXp').textContent = u.xp + ' XP';
    $('#pLvlFrom').textContent = (u.xp - from) + ' / ' + (to - from) + ' XP en este nivel';
    $('#pNext').textContent = 'Faltan ' + (to - u.xp) + ' XP para el nivel ' + (L + 1);
    setTimeout(function () { $('#pBar').style.width = ((u.xp - from) / (to - from) * 100) + '%'; }, 120);
    var tries = u.stats.solved + u.stats.wrong;
    $('#sSolved').textContent = u.stats.solved;
    $('#sAcc').textContent = tries ? Math.round(u.stats.solved / tries * 100) + '%' : '—';
    $('#sStreak').textContent = u.stats.streak;
    $('#sBest').textContent = u.stats.best;
    var list = $('#pHist');
    list.innerHTML = '';
    if (!u.history.length) {
      var li0 = document.createElement('li');
      li0.innerHTML = '<span class="muted">Todavía no resolviste ejercicios. ¡Andá a Práctica!</span>';
      list.appendChild(li0);
    }
    u.history.slice(0, 10).forEach(function (h) {
      var li = document.createElement('li');
      var e = document.createElement('span'); e.className = 'e'; e.textContent = h.e;
      var x = document.createElement('span'); x.className = 'x' + (h.ok ? '' : ' no');
      x.textContent = h.ok ? '+' + h.xp + ' XP' : 'Incorrecto';
      li.appendChild(e); li.appendChild(x); list.appendChild(li);
    });
  }

  /* ----- Pantalla de acceso: solo el nombre ----- */
  var auth = $('#auth');
  function showForm() {
    $('#lgMsg').textContent = '';
    setTimeout(function () { $('#lgUser').focus(); }, 50);
  }

  function enter() {
    auth.hidden = true;
    document.body.classList.remove('locked');
    resetPractice();
    resetGen();
    updateChip();
    toast('¡Hola, ' + me.name + '!');
    if (current !== 'inicio') go('inicio');
    setTimeout(function () { movePill(current); }, 60);
  }

  function doLogin() {
    var msg = $('#lgMsg');
    try {
      var name = $('#lgUser').value.replace(/\s+/g, ' ').trim();
      msg.className = 'auth-msg';
      msg.textContent = '';
      if (!name) { msg.textContent = 'Escribí tu nombre para entrar.'; return; }
      var key = name.toLowerCase();
      var db = loadDB(), u = db[key], data;
      if (u) {                       // ya existe: se recupera su perfil y nivel
        data = plain(u); delete data.salt; delete data.hash; delete data.algo;
      } else {                       // nombre nuevo: se crea el perfil
        data = newUserData(name);
        db[key] = plain(data);
        saveDB(db);
      }
      startSession(data, localSaver(key));
      $('#lgUser').value = '';
      enter();
    } catch (err) {
      msg.textContent = 'No se pudo entrar: ' + (err && err.message ? err.message : err);
    }
  }
  $('#btnEnter').addEventListener('click', doLogin);
  $('#lgUser').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); doLogin(); }
  });

  $('#btnLogout').addEventListener('click', function () {
    me = null;
    updateChip();
    resetPractice();
    resetGen();
    go('inicio');
    $('#lgUser').value = '';
    auth.hidden = false;
    document.body.classList.add('locked');
    showForm();
  });

  /* =========================================================
     GENERADOR DE OPERACIONES ALEATORIAS
     ========================================================= */
  // Aleatorio criptográfico mezclado con una semilla propia de cada usuario
  var genCounter = 0;
  function rnd() {
    var a = new Uint32Array(1);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a); else a[0] = Math.floor(Math.random() * 4294967296);
    var u = currentUser();
    var seed = u && u.seed ? parseInt(u.seed.slice(0, 8), 16) : 0;
    var x = (a[0] ^ Math.imul(seed + (++genCounter), 2654435761)) >>> 0;
    return x / 4294967296;
  }
  function rint(min, max) { return min + Math.floor(rnd() * (max - min + 1)); }
  function rnz(max) { var v = 0; while (v === 0) v = rint(-max, max); return v; }

  var M = '−';
  function fmt(re, im) { // formato lindo de un complejo
    if (im === 0) return (re < 0 ? M + Math.abs(re) : String(re));
    var imAbs = Math.abs(im), imTxt = (imAbs === 1 ? '' : imAbs) + 'i';
    if (re === 0) return (im < 0 ? M : '') + imTxt;
    return (re < 0 ? M + Math.abs(re) : re) + (im < 0 ? ' ' + M + ' ' : ' + ') + imTxt;
  }
  function par(re, im) { return '(' + fmt(re, im) + ')'; }
  function pn(n) { return n < 0 ? '(' + n + ')' : String(n); }

  var GEN_TYPES = {
    suma:  { label: 'Suma', xp: 10 },
    resta: { label: 'Resta', xp: 10 },
    mult:  { label: 'Multiplicación', xp: 20 }
  };

  function makeExercise() {
    var u = currentUser();
    var L = u ? levelOf(u.xp) : 1;
    var max = Math.min(5 + L * 2, 15);          // números más grandes a medida que subís de nivel
    var maxM = Math.min(3 + L, 8);
    var types = ['suma', 'resta', 'mult'];
    var ex, key, tries = 0;
    do {
      var t = types[rint(0, types.length - 1)];
      var m = t === 'mult' ? maxM : max;
      var a = rnz(m), b = rnz(m), c = rnz(m), d = rnz(m);
      var re, im, op, steps, hint;
      if (t === 'suma') {
        re = a + c; im = b + d; op = ' + ';
        hint = 'Sumá las partes reales entre sí y las partes imaginarias entre sí.';
        steps = '(' + a + ' + ' + pn(c) + ') + (' + b + ' + ' + pn(d) + ')i = ' + fmt(re, im);
      } else if (t === 'resta') {
        re = a - c; im = b - d; op = ' ' + M + ' ';
        hint = 'El signo menos afecta a todo el segundo número: restá real con real e imaginaria con imaginaria.';
        steps = '(' + a + ' ' + M + ' ' + pn(c) + ') + (' + b + ' ' + M + ' ' + pn(d) + ')i = ' + fmt(re, im);
      } else {
        re = a * c - b * d; im = a * d + b * c; op = '';
        hint = 'Aplicá la distributiva (cada término por cada término) y reemplazá i² por −1.';
        steps = pn(a) + '·' + pn(c) + ' + ' + pn(a) + '·' + pn(d) + 'i + ' + pn(b) + '·' + pn(c) + 'i + ' + pn(b) + '·' + pn(d) + 'i² = '
          + (a * c) + ' + ' + pn(a * d + b * c) + 'i + ' + pn(b * d) + '·(−1) = ' + fmt(re, im);
      }
      steps = steps.replace(/-/g, M);
      key = t + ':' + a + ',' + b + ',' + c + ',' + d;
      ex = { type: t, key: key, expr: par(a, b) + op + par(c, d), re: re, im: im, hint: hint, steps: steps };
      tries++;
    } while (u && u.seen.indexOf(key) !== -1 && tries < 50);
    if (u) { u.seen.push(key); if (u.seen.length > 500) u.seen.shift(); u.save(); }
    return ex;
  }

  var gen = null; // { ex, attempts, done, hint }
  var genCard = $('#gen');

  function genSetStatus(cls, text) {
    var st = $('[data-status]', genCard);
    st.className = 'ex-status' + (cls ? ' ' + cls : '');
    st.textContent = text;
  }

  function resetGen() {
    gen = null;
    $('#genBody').hidden = true;
    $('#genEmpty').hidden = false;
    genCard.classList.remove('ok', 'bad');
  }

  function newGen() {
    var ex = makeExercise();
    gen = { ex: ex, attempts: 0, done: false, hint: false };
    $('#genEmpty').hidden = true;
    $('#genBody').hidden = false;
    $('#genType').textContent = GEN_TYPES[ex.type].label;
    $('#genXp').textContent = '+' + GEN_TYPES[ex.type].xp + ' XP';
    $('#genPrompt').textContent = ex.type === 'mult' ? 'Calculá:' : 'Resolvé:';
    $('#genExpr').textContent = ex.expr;
    var inp = $('#genIn');
    inp.value = ''; inp.disabled = false; inp.classList.remove('right', 'wrong');
    $('#genCheck').disabled = false;
    $('#genHint').disabled = false;
    $('#genWrong').hidden = true;
    $('#genHints').innerHTML = '';
    var fb = $('#genFb'); fb.className = 'fb'; fb.textContent = '';
    $('#genExplain').hidden = true;
    genCard.classList.remove('ok', 'bad');
    genSetStatus('', 'Pendiente');
    $('#btnGen').innerHTML = 'Generar operación <span class="arrow">⟳</span>';
    inp.focus();
  }

  function checkGen() {
    if (!gen || gen.done) return;
    var inp = $('#genIn'), fb = $('#genFb');
    var z = parseComplex(inp.value);
    if (!z) {
      inp.classList.add('wrong');
      fb.className = 'fb bad';
      fb.textContent = 'No pude leer la respuesta. Escribila con el formato a + bi.';
      return;
    }
    gen.attempts++;
    var ok = nearly(z.re, gen.ex.re) && nearly(z.im, gen.ex.im);
    genCard.classList.remove('ok', 'bad'); void genCard.offsetWidth;
    inp.classList.toggle('right', ok); inp.classList.toggle('wrong', !ok);
    var u = currentUser();
    if (ok) {
      gen.done = true;
      var pts = GEN_TYPES[gen.ex.type].xp + (gen.attempts === 1 ? 5 : 0);
      genCard.classList.add('ok');
      fb.className = 'fb ok';
      fb.textContent = '¡Correcto! Ganaste ' + pts + ' XP' + (gen.attempts === 1 ? ' (incluye +5 por acertar al primer intento).' : '.');
      genSetStatus('ok', 'Correcto ✓');
      inp.disabled = true;
      $('#genCheck').disabled = true;
      $('#genHint').disabled = true;
      $('#genWrong').hidden = true;
      var box = $('#genExplain');
      box.hidden = false;
      box.innerHTML = '<strong style="color:var(--cyan)">Procedimiento</strong><div class="mathline"></div>';
      $('.mathline', box).textContent = gen.ex.expr + ' = ' + gen.ex.steps;
      $('#btnGen').innerHTML = 'Generar otra operación <span class="arrow">⟳</span>';
      burst(genCard);
      if (u) registerResult(u, true, pts, gen.ex.expr + ' = ' + fmt(gen.ex.re, gen.ex.im));
    } else {
      genCard.classList.add('bad');
      fb.className = 'fb bad';
      fb.textContent = 'No es correcto. Podés reintentar o cambiar de ejercicio.';
      genSetStatus('bad', 'Incorrecto');
      inp.disabled = true;
      $('#genCheck').disabled = true;
      $('#genWrong').hidden = false;
      if (u && gen.attempts === 1) registerResult(u, false, 0, gen.ex.expr);
    }
  }

  function retryGen() {
    if (!gen || gen.done) return;
    var inp = $('#genIn');
    inp.disabled = false; inp.value = ''; inp.classList.remove('right', 'wrong');
    $('#genCheck').disabled = false;
    $('#genWrong').hidden = true;
    var fb = $('#genFb'); fb.className = 'fb'; fb.textContent = '';
    genCard.classList.remove('ok', 'bad');
    genSetStatus('', 'Reintento');
    inp.focus();
  }

  $('#btnGen').addEventListener('click', newGen);
  $('#genCheck').addEventListener('click', checkGen);
  $('#genRetry').addEventListener('click', retryGen);
  $('#genChange').addEventListener('click', newGen);
  $('#genHint').addEventListener('click', function () {
    if (!gen || gen.hint) return;
    gen.hint = true;
    var h = document.createElement('div');
    h.className = 'hint';
    h.textContent = 'Pista: ' + gen.ex.hint;
    $('#genHints').appendChild(h);
  });
  $('#genIn').addEventListener('keydown', function (e) { if (e.key === 'Enter') checkGen(); });

  /* =========================================================
     ÓRBITA: LETRAS DE LOS CONJUNTOS NUMÉRICOS
     ========================================================= */
  var SETS = [
    { s: 'ℕ', t: 'ℕ · Números naturales', d: 'Los que usamos para contar: 1, 2, 3, 4…' },
    { s: 'ℤ', t: 'ℤ · Números enteros', d: 'Naturales, sus opuestos negativos y el cero: …, −2, −1, 0, 1, 2…' },
    { s: 'ℚ', t: 'ℚ · Números racionales', d: 'Se pueden escribir como fracción a/b con b ≠ 0: ½, −3, 0,75…' },
    { s: '𝕀', t: '𝕀 · Números irracionales', d: 'No se pueden escribir como fracción; tienen infinitas cifras decimales no periódicas: π, √2, e…' },
    { s: 'ℝ', t: 'ℝ · Números reales', d: 'La unión de racionales e irracionales: todos los puntos de la recta numérica.' },
    { s: 'i', t: 'i · Unidad imaginaria', d: 'Cumple i² = −1. Sus múltiplos (2i, −5i…) son los imaginarios puros.' }
  ];
  (function () {
    var host = $('#letters'), orbit = $('#orbit');
    if (!host) return;
    SETS.forEach(function (st, k) {
      var ang = (k / SETS.length) * Math.PI * 2 - Math.PI / 2;
      var el = document.createElement('div');
      el.className = 'letter';
      el.style.left = (50 + Math.cos(ang) * 50).toFixed(2) + '%';
      el.style.top = (50 + Math.sin(ang) * 50).toFixed(2) + '%';
      el.innerHTML = '<div class="lt" tabindex="0" role="button"></div>';
      var lt = el.firstChild;
      lt.setAttribute('aria-label', st.t + '. ' + st.d);
      lt.appendChild(document.createTextNode(st.s));
      var tip = document.createElement('span');
      tip.className = 'tip';
      tip.innerHTML = '<b></b>';
      tip.firstChild.textContent = st.t;
      tip.appendChild(document.createTextNode(st.d));
      lt.appendChild(tip);
      host.appendChild(el);
    });
    // En pantallas táctiles: tocar una letra la muestra y frena la órbita
    function clearOn() { $$('.letter.on, .core.on', orbit).forEach(function (x) { x.classList.remove('on'); }); }
    orbit.addEventListener('click', function (e) {
      var item = e.target.closest('.letter') || e.target.closest('.core');
      if (!item) return;
      var was = item.classList.contains('on');
      clearOn();
      if (!was) { item.classList.add('on'); orbit.classList.add('paused'); }
      else orbit.classList.remove('paused');
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('#orbit')) { clearOn(); orbit.classList.remove('paused'); }
    });
    orbit.addEventListener('focusin', function () { orbit.classList.add('paused'); });
    orbit.addEventListener('focusout', function () { if (!$('.on', orbit)) orbit.classList.remove('paused'); });
  })();

  /* ----- Arranque: pedir usuario ----- */
  showForm();

})();
