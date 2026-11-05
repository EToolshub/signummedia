/* Cómo trabajamos: la barra avanza con la lectura y cada etapa arranca su animación al entrar */
(function () {
  'use strict';
  var Proc = {};
  window.SignumProc = Proc;

  Proc.init = function (opt) {
    var body = document.getElementById('procBody'), fill = document.getElementById('procFill'), grid = document.getElementById('operGrid');
    var stages = [].slice.call(body.querySelectorAll('.st'));

    if (grid && !grid.children.length) {
      for (var i = 0; i < 180; i++) { var c = document.createElement('i'); c.style.setProperty('--d', (Math.random() * 3.6).toFixed(2) + 's'); if (i === 47 || i === 112) c.className = 'alert'; grid.appendChild(c); }
    }
    if (opt.reduced || !window.IntersectionObserver) stages.forEach(function (s) { s.classList.add('is-on'); });
    else {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle('is-on', e.isIntersecting); }); }, { threshold: .3 });
      stages.forEach(function (s) { io.observe(s); });
    }
    Proc.tick = function () {
      if (!fill) return;
      var r = body.getBoundingClientRect();
      var p = opt.reduced ? 1 : (window.innerHeight * .62 - r.top) / Math.max(1, r.height);
      fill.style.transform = 'scaleY(' + Math.max(0, Math.min(1, p)).toFixed(4) + ')';
    };
    Proc.resize = function () {};
  };
})();
