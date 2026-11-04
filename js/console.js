/* Consola de red: mapa real, campañas y publicación simulada desde Caracas */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var Con = {};
  window.SignumConsole = Con;

  function el(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function fmt(s) { return s.toFixed(2).replace('.', ',') + ' s'; }

  Con.init = function (opt) {
    var RM = opt.reduced, MAP = window.VE_MAP;
    if (!MAP) return;
    var form = document.getElementById('conForm'), nodesG = document.getElementById('mapNodes'), arcsG = document.getElementById('mapArcs');
    var body = document.getElementById('logBody'), live = document.getElementById('logLive'), count = document.getElementById('logCount'), err = document.getElementById('conErr');
    var btn = document.getElementById('conPublish'), checks = [].slice.call(form.querySelectorAll('input[name=city]'));
    var nodes = {}, timers = [], rafs = [], touched = false, running = false;
    var O = MAP.cities.Caracas;

    // Posición de etiqueta a mano para que no se pisen en la costa norte
    var LAB = { Caracas: [0, -30, 'middle'], Maracaibo: [-4, -30, 'middle'], Valencia: [0, 52, 'middle'], Barquisimeto: [-6, -28, 'middle'], 'Puerto Ordaz': [0, 54, 'middle'], Barcelona: [0, 52, 'middle'], 'San Cristóbal': [22, 12, 'start'], Maturín: [24, 12, 'start'], Porlamar: [24, 4, 'start'], Mérida: [24, 12, 'start'] };

    Object.keys(MAP.cities).forEach(function (name) {
      var c = MAP.cities[name], g = el('g', { 'class': 'node', 'data-city': name }, nodesG);
      el('circle', { 'class': 'node-ring', cx: c[0], cy: c[1], r: 15 }, g);
      el('circle', { 'class': 'node-dot', cx: c[0], cy: c[1], r: 9 }, g);
      el('circle', { 'class': 'node-hit', cx: c[0], cy: c[1], r: 26 }, g);
      var L = LAB[name], t = el('text', { 'class': 'node-lbl', x: c[0] + L[0], y: c[1] + L[1], 'text-anchor': L[2] }, g);
      t.textContent = name;
      nodes[name] = g;
      g.style.transformOrigin = c[0] + 'px ' + c[1] + 'px';
      g.addEventListener('click', function () {
        var ch = checks.filter(function (x) { return x.value === name; })[0];
        ch.checked = !ch.checked; touched = true; sync();
      });
    });

    function selected() { return checks.filter(function (c) { return c.checked; }).map(function (c) { return c.value; }); }
    function sync() {
      Object.keys(nodes).forEach(function (n) { var on = checks.filter(function (x) { return x.value === n; })[0].checked; nodes[n].classList.toggle('sel', on); });
      if (selected().length) err.textContent = '';
    }
    checks.forEach(function (c) { c.addEventListener('change', function () { touched = true; sync(); }); });
    document.getElementById('conAll').addEventListener('click', function () { checks.forEach(function (c) { c.checked = true; }); touched = true; sync(); });
    document.getElementById('conNone').addEventListener('click', function () { checks.forEach(function (c) { c.checked = false; }); touched = true; sync(); });
    [].slice.call(form.querySelectorAll('input[type=radio]')).forEach(function (r) { r.addEventListener('change', function () { touched = true; }); });
    sync();

    function reset() {
      timers.forEach(clearTimeout); timers = [];
      rafs.forEach(cancelAnimationFrame); rafs = [];
      while (arcsG.firstChild) arcsG.removeChild(arcsG.firstChild);
      Object.keys(nodes).forEach(function (n) { nodes[n].classList.remove('live'); });
      body.innerHTML = '';
    }

    function arrive(name, total, when, camp, t0, doneRef) {
      nodes[name].classList.add('live');
      var tr = document.createElement('tr'), secs = (performance.now() - t0) / 1000;
      var state = when === 'ahora' ? 'Al aire' : 'A las ' + when;
      tr.innerHTML = '<td></td><td><span class="stat"></span></td><td class="num"></td>';
      tr.children[0].textContent = name;
      tr.querySelector('.stat').textContent = state;
      tr.children[2].textContent = '+' + fmt(RM ? 0 : secs);
      tr.title = camp;
      body.appendChild(tr);
      var scroller = body.closest('.log-scroll');
      if (scroller) scroller.scrollTop = scroller.scrollHeight;
      if (!RM) { tr.classList.add('row-in'); }
      doneRef.n++;
      count.textContent = doneRef.n + ' de ' + total + (when === 'ahora' ? ' al aire' : ' programadas');
      if (doneRef.n === total) {
        running = false;
        btn.querySelector('span').textContent = 'Publicar de nuevo';
        live.textContent = camp + ': ' + total + (total === 1 ? ' ciudad actualizada.' : ' ciudades actualizadas.') + ' Simulación.';
      }
    }

    function publish(auto) {
      var list = selected();
      if (!list.length) { err.textContent = 'Elija al menos una ciudad para publicar.'; return; }
      err.textContent = '';
      reset();
      running = true;
      var camp = form.querySelector('input[name=camp]:checked').value, when = form.querySelector('input[name=when]:checked').value;
      var t0 = performance.now(), ref = { n: 0 }, total = list.length;
      count.textContent = '0 de ' + total + (when === 'ahora' ? ' al aire' : ' programadas');
      // Caracas es origen: sale primero
      list.sort(function (a, b) { return dist(a) - dist(b); });
      list.forEach(function (name) {
        var c = MAP.cities[name], d = dist(name);
        if (d < 1) { timers.push(setTimeout(function () { arrive(name, total, when, camp, t0, ref); }, RM ? 0 : 120)); return; }
        var mx = (O[0] + c[0]) / 2, my = (O[1] + c[1]) / 2 - Math.min(170, 50 + d * .28);
        var path = el('path', { 'class': 'arc', d: 'M' + O[0] + ',' + O[1] + ' Q' + mx + ',' + my + ' ' + c[0] + ',' + c[1], pathLength: 1 }, arcsG);
        if (RM) { path.style.strokeDashoffset = 0; arrive(name, total, when, camp, t0, ref); return; }
        var dot = el('circle', { 'class': 'packet', r: 8, cx: 0, cy: 0 }, arcsG);
        var L = path.getTotalLength(), delay = 80 + d * .35, dur = 480 + d * 1.25;
        var st = performance.now() + delay;
        (function step() {
          var id = requestAnimationFrame(function () {
            var now = performance.now(), k = Math.max(0, Math.min(1, (now - st) / dur)), e = k * k * (3 - 2 * k);
            path.style.strokeDashoffset = 1 - e;
            var pt = path.getPointAtLength(L * e);
            dot.setAttribute('transform', 'translate(' + pt.x + ' ' + pt.y + ')');
            if (k < 1) step();
            else { dot.remove(); path.classList.add('done'); arrive(name, total, when, camp, t0, ref); }
          });
          rafs.push(id);
        })();
      });
    }
    function dist(n) { var c = MAP.cities[n], dx = c[0] - O[0], dy = c[1] - O[1]; return Math.sqrt(dx * dx + dy * dy); }

    form.addEventListener('submit', function (e) { e.preventDefault(); touched = true; publish(false); });

    Con.demo = function () { if (!touched && !running && !RM) publish(true); };
    Con.publish = publish;
  };
})();
