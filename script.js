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
  var ORDER = ['inicio', 'operaciones', 'practica', 'reflexion', 'conclusion'];
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

  function finishExercise(n, card, msg) {
    state[n].done = true;
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
        setFeedback(card, false, 'Completá los dos campos con números (por ejemplo, 4 y 7).');
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
      setFeedback(card, false, 'No pude leer la respuesta. Escribila como a + bi, por ejemplo 6 + 4i.');
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

})();
