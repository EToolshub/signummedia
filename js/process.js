/* Cómo trabajamos: un cable recorre las cinco etapas mientras la cámara lo sigue */
(function () {
  'use strict';
  var Proc = { mode: 'off' };
  window.SignumProc = Proc;

  function smooth(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

  Proc.init = function (opt) {
    var section = document.getElementById('proceso'), world = document.getElementById('procWorld'), stick = document.getElementById('procStick');
    var svg = document.getElementById('procCable'), path = document.getElementById('cablePath'), base = document.getElementById('cableBase'), tip = document.getElementById('cableTip');
    var fill = document.getElementById('procFill');
    var stages = [].slice.call(section.querySelectorAll('.st'));
    var head = section.querySelector('.proc-h');
    var grid = document.getElementById('operGrid');

    // Rejilla de Operación
    if (grid && !grid.children.length) {
      var count = 180;
      for (var i = 0; i < count; i++) { var c = document.createElement('i'); c.style.setProperty('--d', (Math.random() * 3.6).toFixed(2) + 's'); if (i === 47 || i === 112) c.className = 'alert'; grid.appendChild(c); }
    }

    var wide = false, centers = [], ports = [], lens = [], L = 0, state = { p: 0, sp: 0, f: -1 };

    function measure() {
      wide = !opt.reduced && window.innerWidth >= 1100;
      document.documentElement.classList.toggle('proc-wide', wide);
      if (!wide) {
        world.style.transform = '';
        stages.forEach(function (s) { s.classList.add('is-on'); });
        var bar = section.querySelector('.proc-bar'), lst = section.querySelector('.proc-list');
        if (bar && lst) bar.style.top = lst.offsetTop + 'px';
        Proc.mode = 'list';
        return;
      }
      Proc.mode = 'world';
      var w = world.offsetWidth, h = world.offsetHeight;
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      svg.setAttribute('width', w); svg.setAttribute('height', h);
      var vw = stick.clientWidth, vh = stick.clientHeight;
      function box(el) { var x = 0, y = 0, e = el; while (e && e !== world) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; } return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight }; }

      // Puntos donde se detiene la cámara: arriba el titular, luego cada etapa
      centers = [{ x: vw / 2, y: vh / 2 }];
      stages.forEach(function (s) { var b = box(s); centers.push({ x: b.x + b.w / 2, y: b.y + b.h / 2 }); });

      var hb = box(head), start = { x: hb.x, y: hb.y + hb.h + vh * .1 };
      ports = [start];
      stages.forEach(function (s) { var b = box(s.querySelector('.st-vis')); ports.push({ x: b.x + b.w / 2, y: b.y + b.h / 2 }); });

      // Recorrido ortogonal con esquinas redondas, como un cable real tendido en obra
      var R = Math.min(70, vw * .05), d = 'M' + start.x + ' ' + start.y, pts = [start];
      function corner(a, b, c) {
        // a->b->c con radio en b
        var v1x = Math.sign(b.x - a.x), v1y = Math.sign(b.y - a.y), v2x = Math.sign(c.x - b.x), v2y = Math.sign(c.y - b.y);
        var r1 = Math.min(R, Math.abs(b.x - a.x + b.y - a.y) / 2), r2 = Math.min(R, Math.abs(c.x - b.x + c.y - b.y) / 2), r = Math.min(r1, r2);
        return 'L' + (b.x - v1x * r) + ' ' + (b.y - v1y * r) + ' Q' + b.x + ' ' + b.y + ' ' + (b.x + v2x * r) + ' ' + (b.y + v2y * r);
      }
      var route = [start];
      for (var k = 1; k < ports.length; k++) {
        var a = ports[k - 1], b2 = ports[k];
        if (k === 1) {
          route.push({ x: b2.x, y: a.y }); route.push(b2);
        } else {
          var midY = (a.y + b2.y) / 2 + vh * .02;
          route.push({ x: a.x, y: midY }); route.push({ x: b2.x, y: midY }); route.push(b2);
        }
      }
      for (var q = 1; q < route.length - 1; q++) {
        if (route[q].port) continue;
        d += ' ' + corner(route[q - 1], route[q], route[q + 1]);
      }
      var last = route[route.length - 1];
      d += ' L' + last.x + ' ' + last.y;
      path.setAttribute('d', d); base.setAttribute('d', d);
      L = path.getTotalLength();
      path.style.strokeDasharray = L + ' ' + L;
      base.style.strokeDasharray = 'none';

      // Longitud de cada puerto, buscando el punto del trazo más cercano
      lens = [0];
      var stepS = 8, cursor = 0;
      for (var pi = 1; pi < ports.length; pi++) {
        var best = cursor, bd = 1e12;
        for (var s = cursor; s <= L; s += stepS) { var pt = path.getPointAtLength(s), dd = Math.pow(pt.x - ports[pi].x, 2) + Math.pow(pt.y - ports[pi].y, 2); if (dd < bd) { bd = dd; best = s; } if (bd < 400 && dd > bd * 4) break; }
        lens.push(best); cursor = best;
      }
      lens[lens.length - 1] = L;
      state.f = -1;
      update(true);
    }

    function pAt() {
      var r = section.getBoundingClientRect(), range = section.offsetHeight - window.innerHeight;
      return Math.max(0, Math.min(1, -r.top / Math.max(1, range)));
    }

    function update(force, dt) {
      if (Proc.mode === 'world') {
        var p = pAt();
        if (force) state.sp = p; else state.sp += (p - state.sp) * (1 - Math.exp(-(dt || .016) * 8));
        if (Math.abs(state.sp - p) < .0003) state.sp = p;
        if (!force && state.sp === state.f) return;
        state.f = state.sp;
        var n = centers.length - 1, x = state.sp * n, i = Math.min(n - 1, Math.floor(x)), t = x - i;
        var f = smooth(.2, .8, t);
        var ln = lens[i] + (lens[i + 1] - lens[i]) * f;
        path.style.strokeDashoffset = (L - ln);
        var pt = path.getPointAtLength(ln);
        tip.setAttribute('cx', pt.x); tip.setAttribute('cy', pt.y);
        tip.classList.toggle('end', state.sp > .985);
        var c0 = centers[i], c1 = centers[i + 1];
        var cx = c0.x + (c1.x - c0.x) * f, cy = c0.y + (c1.y - c0.y) * f;
        var vw = stick.clientWidth, vh = stick.clientHeight;
        world.style.transform = 'translate3d(' + (-cx + vw / 2).toFixed(1) + 'px,' + (-cy + vh / 2).toFixed(1) + 'px,0)';
        for (var s = 0; s < stages.length; s++) {
          var on = (ln >= lens[s + 1] - (lens[s + 1] - lens[s]) * .5);
          stages[s].classList.toggle('is-on', on);
          stages[s].classList.toggle('is-here', on && (s === stages.length - 1 || ln < lens[s + 2] - (lens[s + 2] - lens[s + 1]) * .5));
        }
      } else if (fill) {
        var r = stick.getBoundingClientRect();
        var pv = (window.innerHeight * .6 - r.top) / Math.max(1, r.height);
        fill.style.transform = 'scaleY(' + Math.max(0, Math.min(1, opt.reduced ? 1 : pv)).toFixed(4) + ')';
      }
    }

    Proc.tick = function (dt) { update(false, dt); };
    Proc.resize = measure;
    Proc.debug = function () { return { mode: Proc.mode, sp: state.sp, L: L, lens: lens }; };
    measure();
  };
})();
