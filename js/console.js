/* Consola de automatizaciones: la hora cambia el menú y el cambio viaja a las sucursales. Es una simulación. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var Con = {};
  window.SignumConsole = Con;

  var RULES = [
    { id: 'desayuno', name: 'Desayuno', from: 6, to: 11, seg: '#FFC815', bg: '#FFF4DF', ink: '#2A1408', acc: '#E8372C', food: 'coffee', hero: 'Café y arepa', price: '3,99',
      items: [['Arepa con queso', '2,50'], ['Empanada y café', '3,00'], ['Cachito y jugo', '3,50'], ['Café con leche', '1,50']] },
    { id: 'almuerzo', name: 'Almuerzo', from: 11, to: 16, seg: '#E8372C', bg: '#E8372C', ink: '#FFFFFF', acc: '#FFC815', food: 'burger', hero: 'Combo doble', price: '5,99',
      items: [['Hamburguesa doble', '4,50'], ['Combo con papas', '5,99'], ['Pollo crujiente', '5,50'], ['Papas grandes', '2,00']] },
    { id: 'merienda', name: 'Merienda', from: 16, to: 18, seg: '#F48FB1', bg: '#FCE4EC', ink: '#3E0566', acc: '#D70A84', food: 'icecream', hero: 'Doble helado', price: '2,50',
      items: [['Helado doble', '2,50'], ['Tequeños (6)', '3,00'], ['Malteada', '3,50'], ['Café frío', '2,00']] },
    { id: 'cena', name: 'Cena', from: 18, to: 22, seg: '#4D1377', bg: '#160524', ink: '#FFFFFF', acc: '#B5D334', food: 'fries', hero: 'Para compartir', price: '11,99',
      items: [['Combo familiar', '11,99'], ['Dos hamburguesas', '8,50'], ['Alitas (12)', '9,00'], ['Bebida de litro', '2,50']] }
  ];
  function ruleAt(h) { for (var i = 0; i < RULES.length; i++) if (h < RULES[i].to) return RULES[i]; return RULES[RULES.length - 1]; }
  function hhmm(h) { var m = Math.round(h * 60), H = Math.floor(m / 60), M = m % 60; return (H < 10 ? '0' : '') + H + ':' + (M < 10 ? '0' : '') + M; }
  function el(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  Con.init = function (opt) {
    var RM = opt.reduced, MAP = window.VE_MAP, FOOD = window.SIGNUM_FOOD || {};
    var board = document.getElementById('board'), wipe = document.getElementById('wipe'), range = document.getElementById('timeRange'), now = document.getElementById('timeNow');
    var playBtn = document.getElementById('timePlay'), promo = document.getElementById('promo'), rulesUl = document.getElementById('rules'), seg = document.getElementById('timeSeg');
    var netList = document.getElementById('netList'), netCount = document.getElementById('netCount'), live = document.getElementById('logLive'), appState = document.getElementById('appState');
    var nodesG = document.getElementById('mapNodes'), arcsG = document.getElementById('mapArcs'), land = document.getElementById('mapLand'), root = document.getElementById('console');
    var current = null, playing = !RM, visible = false, last = 0, swapT = 0, rafs = [], timers = [], ruleBtns = {};

    /* Pista de horario y reglas */
    RULES.forEach(function (r) {
      var s = document.createElement('i');
      s.style.left = ((r.from - 6) / 16 * 100) + '%'; s.style.width = ((r.to - r.from) / 16 * 100) + '%'; s.style.background = r.seg;
      seg.appendChild(s);
      var li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button'; b.className = 'rule'; b.setAttribute('aria-pressed', 'false');
      b.innerHTML = '<i style="background:' + r.seg + '"></i><b>' + esc(r.name) + '</b><span>' + hhmm(r.from) + ' a ' + hhmm(r.to) + '</span>';
      b.addEventListener('click', function () { stop(); setHour(r.from + (r.to - r.from) * .4, true); });
      li.appendChild(b); rulesUl.appendChild(li); ruleBtns[r.id] = b;
    });

    /* Menú en pantalla */
    function renderBoard(r) {
      board.style.setProperty('--b-bg', r.bg); board.style.setProperty('--b-ink', r.ink); board.style.setProperty('--b-acc', r.acc);
      board.innerHTML = '<div class="b-head"><span class="b-title">' + esc(r.name) + '</span><span class="b-hours">' + hhmm(r.from) + ' a ' + hhmm(r.to) + '</span></div>' +
        '<ul class="b-list">' + r.items.map(function (it) { return '<li><span>' + esc(it[0]) + '</span><b><small>REF</small> ' + esc(it[1]) + '</b></li>'; }).join('') + '</ul>' +
        '<div class="b-hero"><div class="b-pic">' + (FOOD[r.food] || '') + '</div><div class="b-price"><small>' + esc(r.hero) + '</small><b><small>REF</small> ' + esc(r.price) + '</b></div></div>' +
        (promo.checked ? '<div class="b-promo">2×1 en combos, solo por hoy</div>' : '');
    }

    /* Cortinilla por bloques */
    for (var w = 0; w < 10; w++) { var strip = document.createElement('i'); strip.style.setProperty('--i', w); wipe.appendChild(strip); }
    function swap(r) {
      clearTimeout(swapT);
      if (RM || !visible) { renderBoard(r); return; }
      wipe.classList.remove('run'); void wipe.offsetWidth; wipe.classList.add('run');
      swapT = setTimeout(function () { renderBoard(r); }, 340);
    }

    /* Red de sucursales */
    var names = MAP ? Object.keys(MAP.cities) : [], O = MAP ? MAP.cities.Caracas : [0, 0], rows = {}, nodes = {};
    if (MAP) {
      land.setAttribute('d', MAP.d);
      names.forEach(function (n) {
        var c = MAP.cities[n], g = el('g', { 'class': 'node' }, nodesG);
        el('circle', { 'class': 'node-ring', cx: c[0], cy: c[1], r: 18 }, g);
        el('circle', { 'class': 'node-dot', cx: c[0], cy: c[1], r: 15 }, g);
        nodes[n] = g;
        var li = document.createElement('li'); li.textContent = n; li.className = 'ok'; netList.appendChild(li); rows[n] = li;
        g.classList.add('live');
      });
    }
    function dist(n) { var c = MAP.cities[n], dx = c[0] - O[0], dy = c[1] - O[1]; return Math.sqrt(dx * dx + dy * dy); }
    function publish(label) {
      if (!MAP) return;
      rafs.forEach(cancelAnimationFrame); rafs = []; timers.forEach(clearTimeout); timers = [];
      while (arcsG.firstChild) arcsG.removeChild(arcsG.firstChild);
      var total = names.length, done = 0;
      function arrive(n) {
        nodes[n].classList.remove('live'); void nodes[n].getBBox(); nodes[n].classList.add('live');
        rows[n].className = 'ok';
        done++;
        netCount.textContent = done + ' de ' + total + ' al día';
        if (done === total) live.textContent = label + ' aplicado en ' + total + ' sucursales. Simulación.';
      }
      names.forEach(function (n) { rows[n].className = 'wait'; nodes[n].classList.remove('live'); });
      netCount.textContent = '0 de ' + total + ' al día';
      if (RM || !visible) { names.forEach(arrive); return; }
      names.slice().sort(function (a, b) { return dist(a) - dist(b); }).forEach(function (n) {
        var c = MAP.cities[n], d = dist(n);
        if (d < 1) { timers.push(setTimeout(function () { arrive(n); }, 120)); return; }
        var mx = (O[0] + c[0]) / 2, my = (O[1] + c[1]) / 2 - Math.min(170, 50 + d * .28);
        var path = el('path', { 'class': 'arc', d: 'M' + O[0] + ',' + O[1] + ' Q' + mx + ',' + my + ' ' + c[0] + ',' + c[1], pathLength: 1 }, arcsG);
        var L = path.getTotalLength(), st = performance.now() + 60 + d * .32, dur = 420 + d * 1.05;
        (function step() {
          var id = requestAnimationFrame(function () {
            var k = Math.max(0, Math.min(1, (performance.now() - st) / dur)), e = k * k * (3 - 2 * k);
            path.style.strokeDashoffset = 1 - e;
            if (k < 1) step(); else { path.classList.add('done'); arrive(n); }
          });
          rafs.push(id);
        })();
      });
    }

    /* Hora */
    function paintRange(h) {
      now.textContent = hhmm(h);
      range.setAttribute('aria-valuetext', hhmm(h));
      if (+range.value !== h) range.value = h;
    }
    function setHour(h, fromUser) {
      paintRange(h);
      var r = ruleAt(h);
      if (r === current) return;
      var first = !current;
      current = r;
      Object.keys(ruleBtns).forEach(function (k) { var on = k === r.id; ruleBtns[k].setAttribute('aria-pressed', String(on)); ruleBtns[k].classList.toggle('on', on); });
      if (first) { renderBoard(r); return; }
      swap(r);
      publish('Menú de ' + r.name.toLowerCase());
    }
    function stop() {
      playing = false;
      playBtn.classList.add('paused'); playBtn.setAttribute('aria-label', 'Reproducir la demostración');
      appState.textContent = 'Control manual';
      appState.classList.add('off');
    }
    function play() {
      playing = true;
      playBtn.classList.remove('paused'); playBtn.setAttribute('aria-label', 'Pausar la demostración');
      appState.textContent = 'Automatización activa';
      appState.classList.remove('off');
    }
    range.addEventListener('input', function () { stop(); setHour(+range.value, true); });
    playBtn.addEventListener('click', function () { if (playing) stop(); else play(); });
    promo.addEventListener('change', function () {
      if (current) { swap(current); publish(promo.checked ? 'Promoción 2×1' : 'Fin de la promoción'); }
    });

    var io = new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: .2 });
    io.observe(root);

    Con.tick = function (dt) {
      if (!playing || !visible || RM) return;
      var hv = parseFloat(range.dataset.c || range.value) + dt * (16 / 24);
      if (hv >= 22) hv = 6;
      range.dataset.c = hv;
      setHour(Math.round(hv * 4) / 4, false);
    };

    if (RM) { playBtn.classList.add('paused'); playBtn.hidden = true; }
    setHour(12, false);
    range.dataset.c = 12;
    range.addEventListener('input', function () { range.dataset.c = range.value; });
    rulesUl.addEventListener('click', function () { range.dataset.c = range.value; });
  };
})();
