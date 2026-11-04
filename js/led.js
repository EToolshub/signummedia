/* Muro LED: logos muestreados a una matriz de puntos, con shader. Sirve a la vitrina, la marquesina y el pie */
(function () {
  'use strict';

  var VS = '#version 300 es\nin vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FS = [
    '#version 300 es',
    'precision highp float;',
    'uniform vec2 uOrigin,uRes;uniform float uPitch,uTime,uSweep,uResolve,uScroll,uStrip,uTexW,uFade;',
    'uniform vec4 uFitA,uFitB;uniform sampler2D uA,uB;uniform vec3 uPtr;uniform vec3 uLit;uniform float uPtrR;',
    'out vec4 o;',
    'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float sampleAt(sampler2D t,vec2 uv,vec4 f,float lod){vec2 q=(uv-f.xy)/f.zw;if(q.x<0.||q.x>1.||q.y<0.||q.y>1.)return 0.;vec4 c=textureLod(t,q,lod);return c.a*max(c.r,max(c.g,c.b));}',
    'float sampleSharp(sampler2D t,vec2 uv,vec4 f){vec2 q=(uv-f.xy)/f.zw;if(q.x<0.||q.x>1.||q.y<0.||q.y>1.)return 0.;vec4 c=texture(t,q);return c.a*max(c.r,max(c.g,c.b));}',
    'void main(){',
    ' vec2 px=gl_FragCoord.xy-uOrigin;',
    ' vec2 sc=vec2(uScroll,0.);',
    ' vec2 cell=floor((px+vec2(mod(uScroll,uPitch),0.))/uPitch);',
    ' vec2 ctr=(cell+.5)*uPitch-vec2(mod(uScroll,uPitch),0.);',
    ' vec2 f=px-ctr;',
    ' float n=hash(cell+floor((uScroll)/uPitch)*vec2(1.,0.));',
    ' vec2 uv=ctr/uRes;float a;float lod=uStrip;',
    ' if(uStrip>0.){vec2 u2=vec2(fract((ctr.x+uScroll)/uTexW),uv.y);a=textureLod(uA,u2,lod).a;}',
    ' else{',
    '  float edge=uv.x+(n-.5)*.22;float useB=step(edge,uSweep*1.4-.2);',
    '  a=useB>.5?sampleAt(uB,uv,uFitB,uFade):sampleAt(uA,uv,uFitA,uFade);',
    ' }',
    ' float on=smoothstep(.07,.5,a);',
    ' float t=uTime;',
    ' float flick=.84+.16*sin(t*(2.5+n*8.)+n*50.);',
    ' float roll=smoothstep(.12,0.,abs(fract(t*.22)-fract(uv.y+uv.x*.15)));',
    ' float pd=length(ctr-uPtr.xy);float swell=uPtr.z*exp(-pd*pd/(uPtrR*uPtrR));',
    ' float rOff=uPitch*.15,rOn=uPitch*(.22+.28*a+.05*n);',
    ' float r=mix(rOff,rOn,on)+uPitch*.17*swell;r=min(r,uPitch*.62);',
    ' float d=length(f);float aa=1.1;float dotM=1.-smoothstep(r-aa,r+aa,d);',
    ' vec3 lit=uLit;float k=hash(cell*.37+floor(t*.5));',
    ' lit=mix(lit,vec3(.843,.039,.518),step(.93,n)*(1.-swell));',
    ' lit=mix(lit,vec3(.71,.827,.204),step(.985,n)*(1.-swell));',
    ' lit=mix(lit,vec3(1.),roll*.6);',
    ' vec3 off=vec3(.2,.08,.3)+vec3(.84,.04,.52)*swell*.55;',
    ' vec3 col=mix(off,lit*flick*(1.+swell*.2),on);',
    ' vec3 bg=vec3(.082,.024,.13);',
    ' vec3 dotC=mix(bg,col,dotM);',
    ' if(uResolve>.001&&uStrip<=0.){',
    '  float ra=length(px-uPtr.xy);float maxR=length(uRes)*1.05;',
    '  float loc=smoothstep(uResolve*maxR,uResolve*maxR-uPitch*6.,ra);',
    '  float shA=uSweep>=.999?sampleSharp(uB,px/uRes,uFitB):sampleSharp(uA,px/uRes,uFitA);',
    '  if(uSweep>.001&&uSweep<.999){shA=px.x/uRes.x<uSweep*1.4-.2?sampleSharp(uB,px/uRes,uFitB):sampleSharp(uA,px/uRes,uFitA);}',
    '  vec3 sh=mix(vec3(.082,.024,.13),vec3(.96,.95,.98),clamp(shA*1.4,0.,1.));',
    '  dotC=mix(dotC,sh,loc);',
    ' }',
    ' o=vec4(dotC,1.);',
    '}'
  ].join('\n');

  function compile(gl) {
    function sh(t, s) { var x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; }
    var p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }

  function load(src) { return new Promise(function (res, rej) { var i = new Image(); i.onload = function () { res(i); }; i.onerror = rej; i.src = src; }); }

  // Recorta el margen transparente del logo para que llene el panel
  function bbox(img) {
    var S = 96, c = document.createElement('canvas'); c.width = c.height = S;
    var x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0, S, S);
    var d = x.getImageData(0, 0, S, S).data, a = S, b = S, e = 0, f = 0;
    for (var j = 0; j < S; j++) for (var i = 0; i < S; i++) if (d[(j * S + i) * 4 + 3] > 40) { if (i < a) a = i; if (j < b) b = j; if (i > e) e = i; if (j > f) f = j; }
    return { x: a / S, y: b / S, w: (e - a + 1) / S, h: (f - b + 1) / S };
  }

  function Stage(canvas, opt) {
    this.canvas = canvas;
    this.opt = opt;
    var gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'low-power' });
    if (!gl) throw new Error('sin webgl2');
    this.gl = gl;
    var pr = this.prog = compile(gl);
    gl.useProgram(pr);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p');
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.u = {};
    var self = this;
    ['uOrigin', 'uRes', 'uPitch', 'uTime', 'uSweep', 'uResolve', 'uScroll', 'uStrip', 'uTexW', 'uFade', 'uFitA', 'uFitB', 'uA', 'uB', 'uPtr', 'uLit', 'uPtrR'].forEach(function (n) { self.u[n] = gl.getUniformLocation(pr, n); });
    gl.uniform1i(this.u.uA, 0); gl.uniform1i(this.u.uB, 1);
    gl.enable(gl.SCISSOR_TEST);
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.panels = [];
    this.visible = false;
    this.lastDraw = 0;
    this.tex = {};
  }
  Stage.prototype.texture = function (src, repeat) {
    var gl = this.gl, t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  Stage.prototype.resize = function () {
    var r = this.canvas.getBoundingClientRect();
    this.rect = r;
    this.canvas.width = Math.round(r.width * this.dpr);
    this.canvas.height = Math.round(r.height * this.dpr);
    this.panels.forEach(function (p) { if (p.measure) p.measure(); });
  };
  Stage.prototype.fitFor = function (logo, w, h, padF) {
    // Devuelve rectángulo uv del panel donde cae la textura completa, recortando el bbox
    var pad = padF === undefined ? .085 : padF, b = logo.box, boxAsp = (b.w * logo.w) / (b.h * logo.h);
    var aw = w * (1 - pad * 2), ah = h * (1 - pad * 2), bw, bh;
    if (aw / ah > boxAsp) { bh = ah; bw = bh * boxAsp; } else { bw = aw; bh = bw / boxAsp; }
    var tw = bw / b.w, th = bh / b.h;              // tamaño de la textura entera en px del panel
    var x0 = (w - bw) / 2 - b.x * tw, y0 = (h - bh) / 2 - (1 - b.y - b.h) * th;
    return [x0 / w, y0 / h, tw / w, th / h];
  };
  Stage.prototype.draw = function (now) {
    var gl = this.gl, u = this.u, t = now / 1000, self = this;
    gl.useProgram(this.prog);
    gl.clearColor(.055, .012, .094, 1);
    gl.disable(gl.SCISSOR_TEST); gl.viewport(0, 0, this.canvas.width, this.canvas.height); gl.clear(gl.COLOR_BUFFER_BIT); gl.enable(gl.SCISSOR_TEST);
    gl.uniform1f(u.uTime, t);
    this.panels.forEach(function (p) {
      var d = self.dpr, x = Math.round(p.x * d), w = Math.round(p.w * d), h = Math.round(p.h * d), y = Math.round(self.canvas.height - (p.y + p.h) * d);
      if (w <= 0 || h <= 0) return;
      gl.viewport(0, 0, self.canvas.width, self.canvas.height);
      gl.scissor(x, y, w, h);
      gl.uniform2f(u.uOrigin, x, y);
      gl.uniform2f(u.uRes, w, h);
      gl.uniform1f(u.uPitch, p.pitch * d);
      gl.uniform1f(u.uSweep, p.sweep || 0);
      gl.uniform1f(u.uResolve, p.resolve || 0);
      gl.uniform1f(u.uScroll, (p.scroll || 0) * d);
      gl.uniform1f(u.uStrip, p.strip ? p.stripLod : 0);
      gl.uniform1f(u.uTexW, p.strip ? p.texW * d : 1);
      gl.uniform1f(u.uFade, p.lod || 0);
      gl.uniform4fv(u.uFitA, p.fitA || [0, 0, 1, 1]);
      gl.uniform4fv(u.uFitB, p.fitB || p.fitA || [0, 0, 1, 1]);
      var ptrY = h - (p.py || 0) * d;
      gl.uniform3f(u.uPtr, (p.px || 0) * d, ptrY, p.hot || 0);
      gl.uniform1f(u.uPtrR, (p.ptrR || 90) * d);
      gl.uniform3fv(u.uLit, p.lit || [.96, .95, .98]);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, p.texA);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, p.texB || p.texA);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });
  };

  var Led = { stages: [] };
  window.SignumLed = Led;

  function tracker(stage, host, panelFor) {
    host.addEventListener('pointermove', function (e) {
      var r = stage.canvas.getBoundingClientRect();
      stage.panels.forEach(function (p) { p.px = e.clientX - r.left - p.x; p.py = e.clientY - r.top - p.y; p.hotT = 1; });
    }, { passive: true });
    host.addEventListener('pointerleave', function () { stage.panels.forEach(function (p) { p.hotT = 0; }); });
  }

  Led.init = function (o) {
    var RM = o.reduced, L = window.SIGNUM_LOGOS;
    if (!L) return Promise.reject(new Error('sin logos'));
    var names = ['mcdonalds', 'kfc', 'cinex', 'arturos', 'alquadrado', 'sotano7', 'laplaza', 'migas', 'hulmans', 'golfiao'];
    var LABEL = { mcdonalds: "McDonald's", kfc: 'KFC', cinex: 'Cinex', arturos: "Arturo's" };
    return Promise.all(names.map(function (n) { return load(L[n]); }).concat([load(window.SIGNUM_BRAND.wordmark)])).then(function (imgs) {
      var logos = {};
      names.forEach(function (n, i) { logos[n] = { img: imgs[i], w: imgs[i].width, h: imgs[i].height, box: bbox(imgs[i]) }; });

      /* -------- Vitrina: cuatro paneles que rotan -------- */
      var wall = document.getElementById('ledWall');
      var st = new Stage(document.getElementById('ledCanvas'));
      Object.keys(LABEL).forEach(function (n) { logos[n].tex = st.texture(logos[n].img); });
      var order = ['mcdonalds', 'kfc', 'cinex', 'arturos'];
      var pEls = [].slice.call(wall.querySelectorAll('.panel'));
      var lits = [[.96, .95, .98], [.843, .039, .518], [.71, .827, .204], [.96, .95, .98]];
      pEls.forEach(function (el, i) {
        var pn = { el: el, i: i, cur: order[i], next: order[i], sweep: 0, resolve: 0, resolveT: 0, hot: 0, hotT: 0, lit: lits[i], ptrR: 80 };
        pn.measure = function () {
          var r = el.getBoundingClientRect(), c = st.canvas.getBoundingClientRect();
          pn.x = r.left - c.left; pn.y = r.top - c.top; pn.w = r.width; pn.h = r.height;
          pn.pitch = window.innerWidth < 700 ? 4 : window.innerWidth < 1100 ? 6 : 7.5;
          pn.px = pn.w / 2; pn.py = pn.h / 2;
          pn.fitA = st.fitFor(logos[pn.cur], pn.w * st.dpr, pn.h * st.dpr);
          pn.fitB = st.fitFor(logos[pn.next], pn.w * st.dpr, pn.h * st.dpr);
          pn.lod = Math.max(0, Math.log2(pn.pitch * st.dpr * 600 / Math.max(pn.fitA[2] * pn.w * st.dpr, 1)) - .7);
        };
        pn.bind = function () { pn.texA = logos[pn.cur].tex; pn.texB = logos[pn.next].tex; };
        pn.label = function () { el.setAttribute('aria-label', 'Mostrar nítido el logo de ' + LABEL[pn.cur]); var im = el.querySelector('img'); im.src = 'assets/logos/' + pn.cur + '.png'; im.alt = 'Logo de ' + LABEL[pn.cur]; };
        pn.bind(); pn.label();
        st.panels.push(pn);
        var hold = false;
        function res(on) { pn.resolveT = on ? 1 : 0; pn.hold = on; }
        el.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') res(true); });
        el.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') res(false); });
        el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); pn.px = e.clientX - r.left; pn.py = e.clientY - r.top; pn.hotT = 1; }, { passive: true });
        el.addEventListener('focus', function () { if (el.matches(':focus-visible')) { pn.px = pn.w / 2; pn.py = pn.h / 2; res(true); } });
        el.addEventListener('blur', function () { res(false); });
        el.addEventListener('click', function (e) {
          var r = el.getBoundingClientRect();
          if (e.clientX) { pn.px = e.clientX - r.left; pn.py = e.clientY - r.top; }
          clearTimeout(pn.tm);
          res(true);
          pn.tm = setTimeout(function () { if (!el.matches(':hover') && document.activeElement !== el) res(false); }, 3000);
          if (document.activeElement === el && !e.clientX) { pn.tm && clearTimeout(pn.tm); }
        });
        el.querySelector('img').style.opacity = 0;
      });
      st.resize();
      Led.stages.push(st);

      // Rotación: cada panel pasa al logo siguiente con un barrido de puntos
      var rotT = 0;
      st.update = function (now, dt) {
        rotT += dt;
        var anyHold = st.panels.some(function (p) { return p.hold; });
        if (rotT > 5.5 && !anyHold && !RM) {
          rotT = 0;
          order.push(order.shift());
          st.panels.forEach(function (p, i) { p.next = order[i]; p.fitB = st.fitFor(logos[p.next], p.w * st.dpr, p.h * st.dpr); p.bind(); p.sweepOn = true; p.sweepD = i * .14; p.sweep = 0; });
        }
        st.panels.forEach(function (p) {
          if (p.sweepOn) {
            p.sweepD -= dt;
            if (p.sweepD <= 0) {
              p.sweep = Math.min(1, p.sweep + dt / 1.05);
              if (p.sweep >= 1) { p.cur = p.next; p.fitA = p.fitB; p.bind(); p.sweep = 0; p.sweepOn = false; p.label(); }
            }
          }
          p.resolve += (p.resolveT - p.resolve) * (1 - Math.exp(-dt * (p.resolveT ? 4.5 : 7)));
          if (p.resolve < .002) p.resolve = 0;
          p.hot += (p.hotT - p.hot) * (1 - Math.exp(-dt * 6));
        });
      };

      /* -------- Marquesina continua -------- */
      var stripHost = document.getElementById('ledStrip');
      var stS = new Stage(document.getElementById('stripCanvas'));
      var sel = ['alquadrado', 'sotano7', 'laplaza', 'migas', 'hulmans', 'golfiao'];
      var pieceH = 512, x = 0, gap = 180, cuts = sel.map(function (n) { var l = logos[n], b = l.box, w = b.w * l.w, h = b.h * l.h, k = pieceH * .86 / h, W = w * k; var it = { n: n, W: W, H: h * k }; return it; });
      var stripW = cuts.reduce(function (s, c) { return s + c.W + gap; }, 0);
      var POT = 4096, sc = POT / stripW;
      var cv = document.createElement('canvas'); cv.width = POT; cv.height = 256; var cx = cv.getContext('2d');
      cx.clearRect(0, 0, POT, 256);
      cuts.forEach(function (c) {
        var l = logos[c.n], b = l.box;
        var dw = c.W * sc, dh = c.H * (256 / 512);
        var clampH = Math.min(dh, 236), clampW = dw * (clampH / dh);
        cx.drawImage(l.img, b.x * l.w, b.y * l.h, b.w * l.w, b.h * l.h, x * sc + (dw - clampW) / 2, (256 - clampH) / 2, clampW, clampH);
        x += c.W + gap;
      });
      var texS = stS.texture(cv, true);
      var sp = { strip: true, sweep: 0, resolve: 0, hot: 0, hotT: 0, scroll: 0, lit: [.96, .95, .98], ptrR: 110, texA: texS, texB: texS };
      sp.measure = function () {
        var r = stripHost.getBoundingClientRect();
        sp.x = 0; sp.y = 0; sp.w = r.width; sp.h = r.height;
        sp.pitch = window.innerWidth < 700 ? 4 : 6;
        sp.texW = r.height * (stripW / pieceH);
        sp.stripLod = Math.max(.5, Math.log2((256 / (r.height / sp.pitch))) - .2);
        sp.px = -9999; sp.py = 0;
      };
      stS.panels.push(sp);
      stS.resize();
      var spHot = false;
      tracker(stS, stripHost);
      stS.update = function (now, dt) {
        sp.scroll += dt * (RM ? 0 : (window.innerWidth < 700 ? 42 : 84)) * (1 - sp.hot * .85);
        sp.hot += (sp.hotT - sp.hot) * (1 - Math.exp(-dt * 6));
      };
      stripHost.addEventListener('click', function (e) { var r = stripHost.getBoundingClientRect(); sp.px = e.clientX - r.left; sp.py = e.clientY - r.top; sp.hotT = 1; setTimeout(function () { sp.hotT = 0; }, 1500); });
      stripHost.querySelector('.strip-fallback').style.display = 'none';
      Led.stages.push(stS);

      /* -------- Pie: la marca a todo el ancho -------- */
      var pieHost = document.getElementById('pieLed');
      var stP = new Stage(document.getElementById('pieCanvas'));
      var wm = imgs[names.length];
      var lg = { img: wm, w: wm.width, h: wm.height, box: bbox(wm) };
      var tw = stP.texture(wm);
      var pp = { sweep: 0, resolve: 0, hot: 0, hotT: 0, lit: [.96, .95, .98], ptrR: 130, texA: tw, texB: tw };
      pp.measure = function () {
        var r = pieHost.getBoundingClientRect();
        pp.x = 0; pp.y = 0; pp.w = r.width; pp.h = r.height;
        pp.pitch = window.innerWidth < 700 ? 3 : window.innerWidth < 1100 ? 5 : 6;
        pp.lod = Math.max(0, Math.log2(pp.pitch * stP.dpr * wm.width / Math.max(pp.w * stP.dpr, 1)) - .9);
        pp.fitA = stP.fitFor(lg, pp.w * stP.dpr, pp.h * stP.dpr, 0);
        pp.px = pp.w / 2; pp.py = pp.h / 2;
      };
      stP.panels.push(pp);
      stP.resize();
      tracker(stP, pieHost);
      stP.update = function (now, dt) { pp.hot += (pp.hotT - pp.hot) * (1 - Math.exp(-dt * 5)); };
      pieHost.querySelector('.pie-fallback').style.display = 'none';
      Led.stages.push(stP);

      // Visibilidad y bucle a 30 fps: basta para un LED y cuida la GPU integrada
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          Led.stages.forEach(function (s) { if (s.canvas === e.target) s.visible = e.isIntersecting; });
        });
      }, { rootMargin: '10% 0px' });
      Led.stages.forEach(function (s) { io.observe(s.canvas); });

      var last = 0, accum = 0;
      Led.tick = function (now) {
        var dt = Math.min(.1, (now - last) / 1000); last = now;
        accum += dt;
        if (RM) now = 4000;
        if (accum < (RM ? .25 : 1 / 31)) return;
        var step = accum; accum = 0;
        Led.stages.forEach(function (s) { if (s.visible && !document.hidden) { s.update(now, step); s.draw(now); } });
      };
      Led.resize = function () { Led.stages.forEach(function (s) { s.resize(); if (RM) { s.update(4000, 0); s.draw(4000); } }); };
      if (RM) Led.resize();
      Led.ok = true;
      return true;
    });
  };
})();
