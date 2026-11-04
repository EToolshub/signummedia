/* Orquestación: scroll, revelados, navegación, acordeón, formulario */
(function () {
  'use strict';
  var root = document.documentElement;
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (RM) root.classList.add('rm');
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };
  function safe(fn, label) { try { return fn(); } catch (e) { if (window.console) console.warn('[boceto] ' + label + ': ' + e.message); } }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Titulares: entra palabra a palabra ---------- */
  function split(h) {
    var frag = document.createDocumentFragment();
    [].slice.call(h.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(function (tok) {
          if (!tok) return;
          if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
          var w = document.createElement('span'); w.className = 'w';
          var i = document.createElement('span'); i.className = 'wi'; i.textContent = tok;
          w.appendChild(i); frag.appendChild(w);
        });
      } else frag.appendChild(node.cloneNode(true));
    });
    h.innerHTML = ''; h.appendChild(frag);
    return $$('.wi', h);
  }

  function reveals() {
    if (!hasGsap || RM) return;
    // Los estados iniciales ocultos los pone este script, nunca el CSS
    $$('[data-split]').forEach(function (h) {
      var words = split(h);
      gsap.set(words, { yPercent: 112 });
      ScrollTrigger.create({ trigger: h, start: 'top 88%', once: true, onEnter: function () { gsap.to(words, { yPercent: 0, duration: 1.05, ease: 'expo.out', stagger: .075 }); } });
    });
    $$('[data-r]').forEach(function (el, i) {
      // Agrupa por sección para el escalonado
      el.dataset.rg = '1';
    });
    $$('main section, .real').forEach(function (sec) {
      var items = $$('[data-r]', sec).filter(function (x) { return !x.dataset.rd; });
      if (!items.length) return;
      items.forEach(function (x) { x.dataset.rd = '1'; });
      var inHero = sec.classList.contains('hero');
      items.forEach(function (x, i) {
        gsap.set(x, { opacity: 0, y: 26 });
        if (inHero) { gsap.to(x, { opacity: 1, y: 0, duration: .9, ease: 'expo.out', delay: .8 + i * .09, clearProps: 'transform' }); return; }
        ScrollTrigger.create({ trigger: x, start: 'top 92%', once: true, onEnter: function () { gsap.to(x, { opacity: 1, y: 0, duration: .85, ease: 'expo.out', delay: (i % 4) * .075, clearProps: 'transform' }); } });
      });
    });
    // Tabla de contraste: la columna Signum sube como un telón y las filas entran después
    var wrap = $('#cmpWrap');
    if (wrap) {
      var sig = $('#cmpSig'), rows = $$('tbody tr', wrap);
      gsap.set(sig, { scaleY: 0, transformOrigin: 'top' });
      gsap.set(rows, { opacity: 0, x: -24 });
      ScrollTrigger.create({ trigger: wrap, start: 'top 78%', once: true, onEnter: function () {
        gsap.to(sig, { scaleY: 1, duration: 1.1, ease: 'expo.inOut' });
        gsap.to(rows, { opacity: 1, x: 0, duration: .8, ease: 'expo.out', stagger: .08, delay: .3 });
      } });
    }
  }

  /* ---------- Navegación ---------- */
  var lenis = null;
  function nav() {
    var navEl = $('#nav'), tg = $('#navToggle'), links = $('#navLinks');
    function closeMenu() { tg.setAttribute('aria-expanded', 'false'); navEl.classList.remove('open'); }
    tg.addEventListener('click', function () { var o = tg.getAttribute('aria-expanded') === 'true'; tg.setAttribute('aria-expanded', String(!o)); navEl.classList.toggle('open', !o); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (navEl.classList.contains('open')) { closeMenu(); tg.focus(); } } });
    var navH = function () { return navEl.offsetHeight; };
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href').slice(1), t = document.getElementById(id);
        if (!t) return;
        e.preventDefault(); closeMenu();
        var off = id === 'inicio' ? 0 : -navH();
        if (lenis) lenis.scrollTo(t, { offset: off, duration: 1.4 });
        else window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY + off, behavior: RM ? 'auto' : 'smooth' });
        if (id !== 'inicio' && !t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
        if (id !== 'inicio') t.focus({ preventScroll: true });
        if (history.replaceState) { try { history.replaceState(null, '', '#' + id); } catch (err) {} }
      });
    });
    // La barra se retira al bajar y vuelve al subir
    var lastY = window.scrollY;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (!RM) {
        if (y > lastY + 6 && y > 200 && !navEl.classList.contains('open') && !navEl.contains(document.activeElement)) navEl.classList.add('away');
        else if (y < lastY - 6 || y < 200) navEl.classList.remove('away');
      }
      lastY = y;
    }, { passive: true });
    navEl.addEventListener('focusin', function () { navEl.classList.remove('away'); });
  }

  /* ---------- Muro ---------- */
  var scene = { start: 0, range: 1 };
  var medio = $('#medio');
  var beats = { b1: $('.beat1'), b2: $('.beat2'), b3: $('.beat3') };
  function medioP() {
    if (RM || !root.classList.contains('webgl')) return 0;
    var r = medio.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, medio.offsetHeight - window.innerHeight), 0, 1);
  }
  function wind(p, a, b, c, d) {
    // Sube de a a b, baja de c a d
    var up = clamp((p - a) / (b - a), 0, 1), down = clamp((p - c) / (d - c), 0, 1);
    up = up * up * (3 - 2 * up); down = down * down * (3 - 2 * down);
    return { o: up * (1 - down), y: (1 - up) * 46 - down * 46 };
  }
  function onScene(sp) {
    var a = wind(sp, .03, .11, .25, .33), b = wind(sp, .56, .68, 2, 3), c = wind(sp, .74, .84, 2, 3);
    beats.b1.style.opacity = a.o; beats.b1.style.transform = 'translate3d(0,' + a.y.toFixed(1) + 'px,0)'; beats.b1.style.visibility = a.o < .01 ? 'hidden' : 'visible';
    beats.b2.style.opacity = b.o; beats.b2.style.transform = 'translate3d(0,' + b.y.toFixed(1) + 'px,0)'; beats.b2.style.visibility = b.o < .01 ? 'hidden' : 'visible';
    beats.b3.style.opacity = c.o; beats.b3.style.transform = 'translate3d(0,' + c.y.toFixed(1) + 'px,0)'; beats.b3.style.visibility = c.o < .01 ? 'hidden' : 'visible';
  }

  function initWall() {
    var canvas = $('#wall'), cN = $('#cN'), cT = $('#cT'), hint = $('#counterHint'), live = $('#counterLive'), status = $('.hero-status');
    if (!window.THREE) return Promise.resolve(false);
    var touch = !window.matchMedia('(hover: hover)').matches;
    hint.textContent = touch ? 'Contenido de muestra y piezas reales. Toque cualquier pantalla: la orden sale de ahí.' : 'Contenido de muestra y piezas reales. Pulse cualquier pantalla: la orden sale de ahí.';
    var res = window.SignumWall.init({
      canvas: canvas, reduced: RM, getProgress: medioP, onScene: RM ? null : onScene,
      onCount: function (n, tot, phase, user) {
        cN.textContent = n; cT.textContent = tot;
        status.classList.toggle('air', phase === 'end');
        if (phase === 'end' && user) live.textContent = 'Simulación: ' + tot + ' de ' + tot + ' pantallas actualizadas.';
      }
    });
    if (res === false) return Promise.resolve(false);
    return res.then(function () {
      if (!RM) root.classList.add('webgl');
      cT.textContent = window.SignumWall.n;
      var pub = $('#publish');
      pub.addEventListener('click', function () { window.SignumWall.publish(null, true); });
      var io = new IntersectionObserver(function (es) { window.SignumWall.setVisible(es[0].isIntersecting); }, { rootMargin: '5% 0px' });
      io.observe($('#muro'));
      // Primera demostración si el visitante no toca nada
      if (!RM) setTimeout(function () { if (!window.SignumWall.attracted && window.scrollY < 80) window.SignumWall.publish(null, false); }, 4200);
      else { window.SignumWall.staticFrame(); }
      return true;
    }).catch(function (e) { console.warn('[boceto] muro: ' + e.message); return false; });
  }

  /* ---------- Trabajo real: desplazamiento horizontal fijado ---------- */
  var real = { on: false, sp: 0 };
  function initReal() {
    var sec = $('#real'), track = $('#realTrack'), figs = $$('.scr', track);
    function measure() {
      real.on = !RM && window.innerWidth >= 1100;
      root.classList.toggle('real-wide', real.on);
      track.style.transform = '';
      if (real.on) { real.dist = Math.max(0, track.scrollWidth - window.innerWidth); sec.style.height = (window.innerHeight + real.dist * 1.1) + 'px'; }
      else sec.style.height = '';
    }
    real.measure = measure; measure();
    real.tick = function (dt) {
      if (!real.on) return;
      var r = sec.getBoundingClientRect(), range = sec.offsetHeight - window.innerHeight, p = clamp(-r.top / Math.max(1, range), 0, 1);
      if (r.bottom < -100 || r.top > window.innerHeight + 100) return;
      real.sp += (p - real.sp) * (1 - Math.exp(-dt * 9));
      track.style.transform = 'translate3d(' + (-real.sp * real.dist).toFixed(1) + 'px,0,0)';
    };
    // Encendido de cada pantalla: la tapa se abre al entrar
    if (RM) $$('img', track).forEach(function (im) { im.loading = 'eager'; });
    if (!RM && hasGsap) figs.forEach(function (f, i) {
      var off = $('.scr-off', f), cap = $('figcaption', f);
      gsap.set(off, { opacity: 1 });
      gsap.set(cap, { opacity: 0, y: 14 });
      var done = false;
      var check = function () { if (done) return; var b = f.getBoundingClientRect(); if (b.left < window.innerWidth * .82 && b.right > 0 && b.top < window.innerHeight * .9 && b.bottom > 0) { done = true; gsap.to(off, { opacity: 0, duration: .9, ease: 'steps(7)' }); gsap.to(cap, { opacity: 1, y: 0, duration: .7, delay: .3, ease: 'expo.out' }); } };
      real['c' + i] = check; (real.checks = real.checks || []).push(check);
    });
  }

  /* ---------- Acordeón de entornos ---------- */
  function initAcc() {
    var ul = $('#acc'), ps = $$('.acc-p', ul), secVisible = false, hoverT;
    if (RM) { ps.forEach(function (x) { x.classList.add('is-open'); $('.acc-b', x).setAttribute('aria-expanded', 'true'); }); return; }
    function setSrc(v) { if (!v.src && v.dataset.src) { v.src = v.dataset.src; } }
    function play(p) { var v = $('video', p); setSrc(v); if (RM) return; var q = v.play(); if (q && q.catch) q.catch(function () {}); }
    function stop(p) { var v = $('video', p); if (!v.paused) v.pause(); }
    function open(p) {
      ps.forEach(function (x) {
        var o = x === p;
        x.classList.toggle('is-open', o);
        $('.acc-b', x).setAttribute('aria-expanded', o ? 'true' : 'false');
        if (o && secVisible) play(x); else stop(x);
      });
    }
    ps.forEach(function (p) {
      var b = $('.acc-b', p);
      b.addEventListener('click', function () { open(p); });
      b.addEventListener('focus', function () { if (b.matches(':focus-visible')) open(p); });
      // Solo con movimiento real: un puntero quieto no debe abrir paneles al desplazar la página
      p.addEventListener('pointermove', function (e) { if (e.pointerType === 'touch' || (!e.movementX && !e.movementY) || p.classList.contains('is-open')) return; clearTimeout(hoverT); hoverT = setTimeout(function () { open(p); }, 90); });
      p.addEventListener('pointerleave', function () { clearTimeout(hoverT); });
    });
    var io = new IntersectionObserver(function (es) {
      secVisible = es[0].isIntersecting;
      var cur = $('.is-open', ul);
      if (secVisible && cur) play(cur); else ps.forEach(stop);
    }, { threshold: .2 });
    io.observe(ul);
  }

  /* ---------- Formulario ---------- */
  function initForm() {
    var form = $('#form'), ok = $('#formOk'), again = $('#formAgain');
    var FREE = /@(gmail|hotmail|outlook|yahoo|live|icloud|proton|protonmail)\./i;
    function msg(f) {
      var v = (f.value || '').trim();
      if (f.tagName === 'SELECT' && !v) return f.id === 'fSector' ? 'Elija el sector de su empresa.' : 'Elija cuántas ubicaciones opera.';
      if (!v) return { fEmpresa: 'Indique el nombre de su empresa.', fNombre: 'Indique su nombre y cargo.', fCorreo: 'Indique su correo corporativo.', fMsg: 'Cuéntenos qué necesita su red.' }[f.id];
      if (f.id === 'fCorreo') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Escriba un correo válido, por ejemplo nombre@suempresa.com.';
        if (FREE.test(v)) return 'Use su correo corporativo, no uno personal.';
      }
      return '';
    }
    var fields = $$('input,select,textarea', form);
    function show(f, m) {
      var e = document.getElementById(f.getAttribute('aria-describedby'));
      e.textContent = m || '';
      f.classList.toggle('bad', !!m);
      if (m) f.setAttribute('aria-invalid', 'true'); else f.removeAttribute('aria-invalid');
    }
    fields.forEach(function (f) {
      f.addEventListener('blur', function () { if (f.classList.contains('bad') || f.value) show(f, msg(f)); });
      f.addEventListener('input', function () { if (f.classList.contains('bad')) show(f, msg(f)); });
      f.addEventListener('change', function () { if (f.classList.contains('bad')) show(f, msg(f)); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var first = null;
      fields.forEach(function (f) { var m = msg(f); show(f, m); if (m && !first) first = f; });
      if (first) {
        first.focus();
        if (!RM && hasGsap) gsap.fromTo(form, { x: -7 }, { x: 0, duration: .5, ease: 'elastic.out(1,.3)', clearProps: 'transform' });
        return;
      }
      form.hidden = true; ok.hidden = false; ok.focus({ preventScroll: true });
      if (!RM && hasGsap) gsap.from($$('p,button', ok), { opacity: 0, y: 18, duration: .7, stagger: .08, ease: 'expo.out' });
    });
    again.addEventListener('click', function () { form.reset(); fields.forEach(function (f) { show(f, ''); }); ok.hidden = true; form.hidden = false; fields[0].focus(); });
  }

  /* ---------- Arranque ---------- */
  var hasLenis = !RM && window.Lenis && window.matchMedia('(pointer: fine)').matches && window.innerWidth >= 1100;
  if (hasLenis) safe(function () { lenis = new Lenis({ lerp: .12, wheelMultiplier: 1 }); window.__lenis = lenis; }, 'lenis');

  safe(nav, 'nav');
  safe(function () { window.SignumProc.init({ reduced: RM }); }, 'proceso');
  safe(initReal, 'real');
  safe(initAcc, 'acordeón');
  safe(initForm, 'formulario');
  safe(function () { window.SignumConsole.init({ reduced: RM }); }, 'consola');
  safe(reveals, 'revelados');

  // Primera demostración de la consola al entrar a la sección
  var conIO = safe(function () {
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); setTimeout(function () { window.SignumConsole.demo && window.SignumConsole.demo(); }, 700); } }, { threshold: .4 });
    io.observe($('#console')); return io;
  }, 'consola io');

  var wallReady = safe(initWall, 'muro') || Promise.resolve(false);
  var ledReady = Promise.resolve(false);
  try { ledReady = window.SignumLed.init({ reduced: RM }); } catch (e) { console.warn('[boceto] led: ' + e.message); }
  ledReady = ledReady.catch(function (e) { console.warn('[boceto] led: ' + e.message); root.classList.add('no-led'); return false; });

  var last = performance.now();
  function frame(now) {
    var dt = Math.min(.1, (now - last) / 1000); last = now;
    safe(function () {
      if (window.SignumWall.tick) window.SignumWall.tick(now);
      if (window.SignumLed.tick) window.SignumLed.tick(now);
      if (window.SignumProc.tick) window.SignumProc.tick(dt);
      if (real.tick) real.tick(dt);
      if (real.checks) real.checks.forEach(function (c) { c(); });
    }, 'bucle');
  }
  if (hasGsap) {
    if (lenis) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(function (t) { lenis.raf(t * 1000); }); }
    gsap.ticker.lagSmoothing(0);
    gsap.ticker.add(function () { frame(performance.now()); });
  } else {
    (function loop(t) { frame(t); requestAnimationFrame(loop); })(performance.now());
  }

  // Cambios de tamaño: solo ancho o saltos grandes, para no recalcular con la barra del móvil
  var wPrev = window.innerWidth, hPrev = window.innerHeight, rT;
  window.addEventListener('resize', function () {
    clearTimeout(rT);
    rT = setTimeout(function () {
      if (window.innerWidth === wPrev && Math.abs(window.innerHeight - hPrev) < 140) return;
      wPrev = window.innerWidth; hPrev = window.innerHeight;
      safe(function () { window.SignumWall.resize && window.SignumWall.resize(); }, 'r muro');
      safe(function () { window.SignumLed.resize && window.SignumLed.resize(); }, 'r led');
      safe(function () { window.SignumProc.resize(); }, 'r proc');
      safe(function () { real.measure(); }, 'r real');
      if (hasGsap) ScrollTrigger.refresh();
    }, 180);
  });
  window.addEventListener('load', function () { if (hasGsap) ScrollTrigger.refresh(); safe(function () { window.SignumProc.resize(); window.SignumLed.resize && window.SignumLed.resize(); }, 'load'); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (hasGsap) ScrollTrigger.refresh(); safe(function () { window.SignumProc.resize(); }, 'fuentes'); });
  Promise.all([wallReady, ledReady]).then(function () { if (hasGsap) ScrollTrigger.refresh(); safe(function () { window.SignumLed.resize && window.SignumLed.resize(); }, 'led2'); });
})();
