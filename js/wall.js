/* El muro: anfiteatro WebGL de pantallas, la onda de publicación y la formación de la S */
(function () {
  'use strict';

  var INK = '#F5F2FA', NIGHT = '#0E0318', SURF = '#220835', PUR = '#4D1377', PUR2 = '#3E0566', MAG = '#D70A84', LIME = '#B5D334';

  // Contorno oficial de la S (BRIEF), coordenadas del logo, y hacia abajo
  var S_POLY = [[3.33, 70.04], [3.33, 52.28], [23.48, 55.21], [23.48, 59.07], [62.55, 59.07], [62.55, 52.28], [3.34, 42.94], [3.34, 16], [82.71, 16], [82.71, 34.76], [62.56, 31.67], [62.56, 26.96], [23.48, 26.96], [23.48, 34.29], [82.7, 43.63], [82.7, 70.03], [3.33, 70.04]];

  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ---------- Reparto de la S en N rectángulos exactos ---------- */
  function sTiles(N) {
    var top = 16, bot = 70.04, H = bot - top, best = null;
    function intervals(y) {
      var xs = [];
      for (var i = 0; i < S_POLY.length - 1; i++) {
        var a = S_POLY[i], b = S_POLY[i + 1];
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
      }
      xs.sort(function (p, q) { return p - q; });
      var out = [];
      for (var k = 0; k + 1 < xs.length; k += 2) if (xs[k + 1] - xs[k] > 0.6) out.push([xs[k], xs[k + 1]]);
      return out;
    }
    for (var rows = 5; rows < 60; rows++) {
      var h = H / rows, list = [], sum = 0;
      for (var r = 0; r < rows; r++) {
        var y = top + h * (r + 0.5), iv = intervals(y);
        iv.forEach(function (s) { var c = Math.max(1, Math.round((s[1] - s[0]) / (h * 1.55))); list.push({ y: y, a: s[0], b: s[1], c: c }); sum += c; });
      }
      if (!best || Math.abs(sum - N) < Math.abs(best.sum - N)) best = { list: list, sum: sum, h: h };
    }
    var L = best.list, sumC = best.sum;
    while (sumC < N) { L.sort(function (p, q) { return (q.b - q.a) / q.c - (p.b - p.a) / p.c; }); L[0].c++; sumC++; }
    while (sumC > N) { L.sort(function (p, q) { return (p.b - p.a) / p.c - (q.b - q.a) / q.c; }); var j = 0; while (L[j].c < 2) j++; L[j].c--; sumC--; }
    var out = [], cx = 43.02, cy = 43.02, w0 = 79.37;
    L.forEach(function (s) {
      var w = (s.b - s.a) / s.c;
      for (var i = 0; i < s.c; i++) out.push({ x: (s.a + w * (i + 0.5) - cx) / w0, y: -(s.y - cy) / w0, w: w / w0, h: best.h / w0 });
    });
    return out;
  }

  /* ---------- Contenido: menús genéricos de comida rápida, sin marcas, dibujados por código ---------- */
  function F(px, stretch) { return stretch === 'normal' ? '800 normal ' + Math.round(px) + 'px Archivo, Arial, sans-serif' : '400 ' + Math.round(px) + 'px Anton, Impact, sans-serif'; }
  function fit(ctx, text, maxW, maxPx, stretch) {
    var px = maxPx;
    ctx.font = F(px, stretch);
    var w = ctx.measureText(text).width;
    if (w > maxW) px = px * maxW / w;
    ctx.font = F(px, stretch);
    return px;
  }
  function rombo(ctx, x, y, s, c, stroke) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4);
    var r = s * 0.22, a = -s / 2;
    ctx.beginPath(); ctx.moveTo(a + r, a); ctx.arcTo(-a, a, -a, -a, r); ctx.arcTo(-a, -a, a, -a, r); ctx.arcTo(a, -a, a, a, r); ctx.arcTo(a, a, -a, a, r); ctx.closePath();
    if (stroke) { ctx.lineWidth = stroke; ctx.strokeStyle = c; ctx.stroke(); } else { ctx.fillStyle = c; ctx.fill(); }
    ctx.restore();
  }
  function arrow(ctx, x, y, s, c, up) {
    ctx.save(); ctx.translate(x, y); if (up) ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = c; ctx.beginPath();
    ctx.moveTo(-s, -s * .22); ctx.lineTo(s * .2, -s * .22); ctx.lineTo(s * .2, -s * .62); ctx.lineTo(s, 0); ctx.lineTo(s * .2, s * .62); ctx.lineTo(s * .2, s * .22); ctx.lineTo(-s, s * .22); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  var CREAM = '#FFF4DF', BROWN = '#2A1408', RED = '#E8372C', GOLD = '#FFC815', PINK = '#FCE4EC';
  var MENUS = {
    combos: { bg: CREAM, ink: BROWN, acc: RED, t: 'Combos', img: 'burger', rows: [['Doble con papas', '5,99'], ['Pollo crujiente', '5,50'], ['Alitas y bebida', '6,50']] },
    desayuno: { bg: GOLD, ink: BROWN, acc: RED, t: 'Desayuno', img: 'coffee', rows: [['Arepa con queso', '2,50'], ['Empanada y café', '3,00'], ['Cachito y jugo', '3,50']] },
    almuerzo: { bg: RED, ink: '#FFFFFF', acc: GOLD, t: 'Almuerzo', img: 'burger', rows: [['Combo doble', '5,99'], ['Pollo y papas', '5,50'], ['Ensalada', '4,00']] },
    cena: { bg: SURF, ink: '#FFFFFF', acc: LIME, t: 'Cena', img: 'fries', rows: [['Combo familiar', '11,99'], ['Dos hamburguesas', '8,50'], ['Alitas (12)', '9,00']] },
    merienda: { bg: PINK, ink: PUR2, acc: MAG, t: 'Merienda', img: 'icecream', rows: [['Helado doble', '2,50'], ['Tequeños (6)', '3,00'], ['Malteada', '3,50']] },
    papas: { bg: BROWN, ink: '#FFFFFF', acc: GOLD, t: 'Papas', img: 'fries', rows: [['Pequeñas', '1,50'], ['Medianas', '2,00'], ['Grandes', '2,50']] },
    bebidas: { bg: PUR, ink: '#FFFFFF', acc: LIME, t: 'Bebidas', img: 'cup', rows: [['Refresco', '1,50'], ['Jugo natural', '2,00'], ['Malteada', '3,50']] },
    dosxuno: { bg: MAG, ink: '#FFFFFF', acc: GOLD, t: '2×1', big: 1, sub: 'En combos, solo hoy', img: 'fries' },
    nuevo: { bg: LIME, ink: NIGHT, acc: RED, t: 'Nuevo', big: 1, sub: 'Doble crujiente', img: 'burger' },
    arepas: { bg: CREAM, ink: BROWN, acc: PUR, t: 'Arepas', img: 'arepa', rows: [['Reina pepiada', '3,50'], ['Queso de mano', '3,00'], ['Pabellón', '4,50']] },
    precios: { bg: NIGHT, ink: '#FFFFFF', acc: GOLD, t: 'Promoción', img: 'cup', rows: [['Combo y bebida', '6,50'], ['Papas y bebida', '3,00'], ['Dos helados', '3,50']] },
    cafe: { bg: '#6B3A1E', ink: '#FFFFFF', acc: GOLD, t: 'Café', img: 'coffee', rows: [['Negrito', '1,00'], ['Con leche', '1,50'], ['Y cachito', '3,50']] }
  };
  var VERT = {
    oferta: { bg: RED, ink: '#FFFFFF', acc: GOLD, t: '2×1', sub: 'Combos', img: 'burger' },
    nuevo: { bg: LIME, ink: NIGHT, acc: RED, t: 'Nuevo', sub: 'Doble', img: 'burger' },
    helado: { bg: PINK, ink: PUR2, acc: MAG, t: 'Helado', sub: 'Doble', img: 'icecream' },
    bebida: { bg: PUR, ink: '#FFFFFF', acc: LIME, t: 'Bebida', sub: 'Grande', img: 'cup' },
    cafe: { bg: CREAM, ink: BROWN, acc: RED, t: 'Café', sub: 'Mañanas', img: 'coffee' },
    papas: { bg: GOLD, ink: BROWN, acc: RED, t: 'Papas', sub: 'Grandes', img: 'fries' }
  };
  function drawMenu(c, w, h, m, imgs) {
    c.fillStyle = m.bg; c.fillRect(0, 0, w, h);
    var pad = w * .055, im = imgs[m.img];
    if (m.big) {
      c.fillStyle = m.ink; fit(c, m.t, w * .56, h * .46); c.fillText(m.t, pad, h * .56);
      c.font = F(h * .085, 'normal'); c.fillText(m.sub, pad, h * .74);
      c.drawImage(im, w * .56, h * .14, h * .72, h * .72);
      return;
    }
    c.fillStyle = m.ink; fit(c, m.t, w * .56, h * .2); c.fillText(m.t, pad, h * .26);
    c.fillStyle = m.acc; c.fillRect(pad, h * .31, w * .13, h * .022);
    m.rows.forEach(function (r, i) {
      var y = h * (.47 + i * .185);
      c.fillStyle = m.ink; c.font = '650 normal ' + Math.round(h * .068) + 'px Archivo, Arial, sans-serif'; c.fillText(r[0], pad, y);
      c.fillStyle = m.acc; c.font = F(h * .082, 'normal'); var pw = c.measureText(r[1]).width; c.fillText(r[1], w * .63 - pw, y);
    });
    c.drawImage(im, w * .655, h * .2, w * .31, w * .31);
  }
  function drawVert(c, w, h, m, imgs) {
    c.fillStyle = m.bg; c.fillRect(0, 0, w, h);
    c.fillStyle = m.ink; fit(c, m.t, w * .84, w * .48); c.fillText(m.t, w * .08, h * .2);
    c.drawImage(imgs[m.img], w * .1, h * .3, w * .8, w * .8);
    c.fillStyle = m.acc; c.fillRect(w * .08, h * .78, w * .84, h * .12);
    c.fillStyle = m.bg; fit(c, m.sub, w * .72, h * .06); c.fillText(m.sub, w * .14, h * .86);
  }

  function buildAtlas(size, imgs) {
    var canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
    var ctx = canvas.getContext('2d'), s = size / 2048;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, size, size);
    var CW = 512, CH = 307, VW = 256, VH = 569;
    var names = Object.keys(MENUS);
    var vnames = Object.keys(VERT);
    var H = {}, V = {}, avgC = document.createElement('canvas'); avgC.width = avgC.height = 4;
    var avgX = avgC.getContext('2d', { willReadFrequently: true });
    function reg(x, y, w, h, store, key) {
      var pad = 3;
      avgX.drawImage(canvas, x * s, y * s, w * s, h * s, 0, 0, 4, 4);
      var d = avgX.getImageData(0, 0, 4, 4).data, r = 0, g = 0, b = 0;
      for (var i = 0; i < 64; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
      store[key] = { r: [(x + pad) / 2048, (y + pad) / 2048, (w - 2 * pad) / 2048, (h - 2 * pad) / 2048], a: [r / 16 / 255, g / 16 / 255, b / 16 / 255] };
    }
    names.forEach(function (n, i) {
      var x = (i % 4) * CW, y = Math.floor(i / 4) * CH;
      ctx.save(); ctx.scale(s, s); ctx.translate(x, y);
      ctx.beginPath(); ctx.rect(0, 0, CW, CH); ctx.clip();
      ctx.textBaseline = 'alphabetic';
      drawMenu(ctx, CW, CH, MENUS[n], imgs);
      ctx.restore();
      reg(x, y, CW, CH, H, n);
    });
    vnames.forEach(function (n, i) {
      var x = i * VW, y = 3 * CH;
      ctx.save(); ctx.scale(s, s); ctx.translate(x, y);
      ctx.beginPath(); ctx.rect(0, 0, VW, VH); ctx.clip();
      ctx.textBaseline = 'alphabetic'; drawVert(ctx, VW, VH, VERT[n], imgs);
      ctx.restore();
      reg(x, y, VW, VH, V, n);
    });
    return { canvas: canvas, H: H, V: V, hKeys: Object.keys(H), vKeys: Object.keys(V) };
  }

  /* Murales: una sola pieza repartida entre todas las pantallas */
  function buildMurals(W, aspect, central) {
    var hEach = Math.round(W / aspect), canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = hEach * 4;
    var c = canvas.getContext('2d'), maxW = W * central, x0 = (W - maxW) / 2;
    function row(i, fn) { c.save(); c.translate(0, i * hEach); c.beginPath(); c.rect(0, 0, W, hEach); c.clip(); fn(); c.restore(); }
    function two(a, b, col, px) {
      c.fillStyle = col;
      var p = Math.min(hEach * px, 400);
      var pa = fit(c, a, maxW, p); c.fillText(a, x0 + (maxW - c.measureText(a).width) / 2, hEach * .5);
      var pb = fit(c, b, maxW, p); c.fillText(b, x0 + (maxW - c.measureText(b).width) / 2, hEach * .5 + Math.max(pa, pb) * .98);
    }
    row(0, function () { c.fillStyle = MAG; c.fillRect(0, 0, W, hEach); two('TODA SU CADENA,', 'AL MISMO TIEMPO', INK, .44); });
    row(1, function () { c.fillStyle = RED; c.fillRect(0, 0, W, hEach); two('ALMUERZO', 'DESDE LAS 11:00', GOLD, .44); });
    row(2, function () { c.fillStyle = LIME; c.fillRect(0, 0, W, hEach); two('FIN DE SEMANA', 'EN TODOS LOS LOCALES', NIGHT, .44); });
    row(3, function () { c.fillStyle = CREAM; c.fillRect(0, 0, W, hEach); two('NUEVO PRECIO', 'EN TODA LA CADENA', BROWN, .44); });
    return { canvas: canvas, rows: 4 };
  }

  /* ---------- Shaders ---------- */
  var placeVS = [
    'attribute vec3 aPW;attribute vec4 aWS;attribute vec4 aPS;attribute vec3 aSF;',
    'attribute vec4 aUVA;attribute vec4 aUVB;attribute vec4 aTM;',
    'attribute vec2 aAvg;',
    'vec3 unp(float v){return vec3(mod(v,32.),mod(floor(v/32.),32.),floor(v/1024.))/31.;}',
    'uniform float uTime,uMorph,uWaveR,uWaveOn,uBand,uIntro,uHover,uFocusId,uFocus,uTint,uMirror,uFloor,uHaloK;',
    'uniform vec3 uOrigin;',
    'varying vec2 vUv;varying vec4 vRect;varying float vSel;varying vec2 vSize;varying float vBright;varying float vFront;varying float vTintL;varying float vHov;varying float vBez;varying float vFade;varying vec3 vHalo;varying float vAir;',
    'mat3 rY(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}',
    'mat3 rX(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}',
    'void main(){',
    ' float seed=aTM.z;float m=clamp((uMorph-aPS.w*.5)/.5,0.,1.);float e=m*m*m*(m*(m*6.-15.)+10.);float arc=sin(e*3.14159);',
    ' float back=1.+sin(clamp((m-.72)/.28,0.,1.)*3.14159)*.10;',
    ' float d=distance(aPW,uOrigin);float x=d-uWaveR;float band=uWaveOn*exp(-x*x/(uBand*uBand));float passed=uWaveOn*step(d,uWaveR);',
    ' float intro=smoothstep(seed*.35+d*0.0,seed*.35+.3,uIntro);',
    ' float ry=mix(aWS.x,0.,e)+arc*(seed-.5)*6.28+band*(seed>.5?.5:-.5)*(1.-e);',
    ' float rx=mix(aWS.y,0.,e)+arc*(fract(seed*7.3)-.5)*2.2-band*.25*(1.-e);',
    ' vec2 size=mix(aWS.zw,aSF.xy,e)*back;',
    ' #ifdef HALO',
    ' size=size*uHaloK+vec2(.42)*(1.-e)+vec2(.1)*e;',
    ' #endif',
    ' size*=1.+band*.12+smoothstep(.5,0.,abs(aTM.w-uHover))*.08*(1.-e);',
    ' vec3 l=vec3(position.xy*size,0.);',
    ' vec3 n=vec3(sin(aWS.x),0.,cos(aWS.x));',
    ' vec3 p=mix(aPW,aPS.xyz,e);p.z+=arc*(1.2+seed*4.5);p.y+=arc*(seed-.5)*3.2;p.x+=arc*sin(seed*43.)*1.6;',
    ' p+=n*band*1.1*(1.-e);',
    ' vec3 w=rY(ry)*(rX(rx)*l)+p;',
    ' vFade=0.;',
    ' if(uMirror>.5){w.y=2.*uFloor-w.y;vFade=clamp((uFloor-w.y)/7.,0.,1.);}',
    ' gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);',
    ' vUv=uv;vSize=size;',
    ' float useB=passed;vRect=useB>.5?aUVB:aUVA;vSel=useB>.5?aTM.y:aTM.x;',
    ' float flick=1.+.045*sin(uTime*(1.5+seed*5.)+seed*60.);',
    ' float tail=passed*exp(-max(uWaveR-d,0.)/(uBand*1.6));',
    ' float flash=exp(-max(uTime-aSF.z,0.)*5.);',
    ' float foc=abs(aTM.w-uFocusId)<.5?1.:1.-uFocus*.9;',
    ' float sweep=pow(.5+.5*sin(aPS.x*.85+aPS.y*.55-uTime*1.5),5.);',
    ' vBright=intro*flick*foc*(1.+tail*.7+flash*.9)*(1.+uTint*sweep*.3)*mix(1.,.7+.42*seed,uTint);',
    ' vAir=uTint*smoothstep(.985,1.,sin(aPS.x*1.1-aPS.y*.5-uTime*.9));',
    ' vFront=band;vTintL=uTint;vHov=smoothstep(.5,0.,abs(aTM.w-uHover))*(1.-e);vBez=mix(.035,.012,e);',
    ' vec3 ac=unp(useB>.5?aAvg.y:aAvg.x);',
    ' vHalo=mix(ac*.55*foc*intro,vec3(.84,.04,.52)*(.8+sweep*.9),max(uTint,0.))+vec3(.84,.04,.52)*band*2.4;',
    '}'
  ].join('\n');

  var screenFS = [
    'uniform sampler2D uAtlas,uMural;uniform float uMirror,uShade,uTime;uniform vec2 uRes;',
    'varying vec2 vUv;varying vec4 vRect;varying float vSel;varying vec2 vSize;varying float vBright;varying float vFront;varying float vTintL;varying float vHov;varying float vBez;varying float vFade;varying vec3 vHalo;varying float vAir;',
    'void main(){',
    ' vec2 t=vRect.xy+vec2(vUv.x,1.-vUv.y)*vRect.zw;',
    ' vec3 c=vSel<.5?texture2D(uAtlas,t).rgb:texture2D(uMural,t).rgb;',
    ' vec2 gr=vUv*vec2(72.,46.);float gw=fwidth(gr.x);vec2 g=abs(fract(gr)-.5);',
    ' float led=mix(.91+.09*smoothstep(.5,.2,max(g.x,g.y)),1.,smoothstep(.12,.45,gw));',
    ' c*=led;',
    ' float l=dot(c,vec3(.3,.59,.11));',
    ' vec3 duo=mix(vec3(.46,.05,.62),mix(vec3(.9,.05,.56),vec3(1.,.9,.97),smoothstep(.6,.98,l)),smoothstep(.0,.5,l));',
    ' c=mix(c,duo,vTintL);',
    ' c*=vBright;',
    ' c=mix(c,vec3(.71,.827,.204),vAir);',
    ' c=mix(c,vec3(.843,.039,.518)*1.25,clamp(vFront*vFront*1.05,0.,1.));',
    ' c=mix(c,vec3(1.,.82,.93),vHov*.16);',
    ' vec2 dd=min(vUv,1.-vUv)*vSize;float bd=min(dd.x,dd.y);float aa=fwidth(bd)+.0001;',
    ' float scr=smoothstep(vBez,vBez+aa,bd);',
    ' vec3 fr=mix(vec3(.05,.02,.08),vec3(.843,.039,.518),max(vHov,vFront*.6));',
    ' c=mix(fr,c,scr);',
    ' if(uMirror>.5){float f=1.-vFade;c*=f*f*f*.34;}',
    ' vec2 q=gl_FragCoord.xy/uRes;',
    ' float sh=uShade*smoothstep(.62,.08,q.y)*(1.-smoothstep(.55,.95,q.x)*.55);',
    ' c*=1.-sh*.86;',
    ' gl_FragColor=vec4(c,1.);',
    '}'
  ].join('\n');

  var haloFS = [
    'uniform vec2 uRes;uniform float uShade,uHaloAmp;',
    'varying vec2 vUv;varying vec3 vHalo;varying float vBright;',
    'void main(){float r=length(vUv-.5)*2.;float a=pow(max(0.,1.-r),2.4);',
    ' vec2 q=gl_FragCoord.xy/uRes;float sh=uShade*smoothstep(.62,.08,q.y);',
    ' gl_FragColor=vec4(vHalo*a*uHaloAmp*(1.-sh*.8),1.);}'
  ].join('\n');

  /* ---------- Muro ---------- */
  var Wall = { ok: false, n: 0 };
  window.SignumWall = Wall;

  Wall.init = function (opt) {
    var canvas = opt.canvas, RM = opt.reduced;
    var w0 = window.innerWidth;
    var tier = w0 < 700 ? 'm' : w0 < 1100 ? 't' : 'd';
    var CONF = {
      d: { rows: [11, 11, 11, 11, 10, 10, 10], R: 15, pitchX: 1.18, pitchY: .74, tw: 1.0, th: .6, fov: 36, camZ: 12, camY: 3.0, tgtY: .95, atlas: 3072, central: .62 },
      t: { rows: [8, 8, 8, 8, 8, 8, 8], R: 12, pitchX: 1.18, pitchY: .74, tw: 1.0, th: .6, fov: 36, camZ: 16, camY: 3.0, tgtY: 1.9, atlas: 2048, central: .62 },
      m: { rows: [5, 5, 5, 5, 5, 5, 5, 5], R: 9.5, pitchX: 1.18, pitchY: .74, tw: 1.0, th: .6, fov: 40, camZ: 14, camY: 2.2, tgtY: .4, atlas: 1536, central: .82 }
    };
    var C = CONF[tier];
    var N = C.rows.reduce(function (a, b) { return a + b; }, 0);
    Wall.n = N;

    var gl2ok = false;
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: tier !== 'm', alpha: false, powerPreference: 'high-performance', stencil: false });
      gl2ok = renderer.capabilities.isWebGL2;
    } catch (e) { return false; }
    if (!gl2ok) { renderer.dispose(); return false; }

    var dprMax = Math.min(window.devicePixelRatio || 1, 1.5), dpr = dprMax;
    renderer.setPixelRatio(dpr);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.setClearColor(new THREE.Color().setRGB(14 / 255, 3 / 255, 24 / 255, THREE.LinearSRGBColorSpace), 1);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(C.fov, 1, .1, 120);

    var rand = rng(20261104);
    var yMax = (C.rows.length - 1) * C.pitchY + C.th, floorY = -.32;
    var halfArc = (C.rows[0] * C.pitchX) / 2;

    // Ranuras: filas centradas, con columnas alineadas para poder unir dos filas
    var slots = [];
    var used = {};
    C.rows.forEach(function (count, r) {
      for (var i = 0; i < count; i++) slots.push({ r: r, c: i - (count - 1) / 2 });
    });
    function key(r, c) { return r + ':' + c; }
    var verticals = [];
    for (var v = 0; v < Math.round(N * .07); v++) {
      var a = slots[Math.floor(rand() * slots.length)];
      var has = C.rows[a.r + 1] && Math.abs(a.c) <= (C.rows[a.r + 1] - 1) / 2;
      if (!has || used[key(a.r, a.c)] || used[key(a.r + 1, a.c)]) continue;
      used[key(a.r, a.c)] = used[key(a.r + 1, a.c)] = 1;
      verticals.push({ r: a.r, c: a.c });
    }
    var items = [];
    function place(row, colx, tw, th, y, vert) {
      var rr = row / Math.max(1, C.rows.length - 1);
      var Rr = C.R - rr * rr * 1.6;
      var theta = (colx * C.pitchX) / C.R;
      items.push({ x: Rr * Math.sin(theta), y: y, z: -Rr * Math.cos(theta), ry: -theta, rx: lerp(-.04, .2, rr), w: tw, h: th, theta: theta, vert: vert, row: row });
    }
    slots.forEach(function (s) {
      if (used[key(s.r, s.c)]) return;
      place(s.r, s.c, C.tw, C.th, s.r * C.pitchY + C.th / 2, false);
    });
    verticals.forEach(function (b) {
      var yy = (b.r + .5) * C.pitchY + C.th / 2, hh = C.th + C.pitchY, ww = (C.tw - .06) / 2;
      place(b.r + .5, b.c - .25 * (C.tw + .06) / C.pitchX, ww, hh, yy, true);
      place(b.r + .5, b.c + .25 * (C.tw + .06) / C.pitchX, ww, hh, yy, true);
    });
    items = items.slice(0, N);

    // Pantalla protagonista para el acercamiento
    var fIdx = 0, fBest = 1e9;
    items.forEach(function (it, i) {
      if (it.vert) return;
      var dd = Math.abs(it.x) + Math.abs(it.row - C.rows.length * .46) * .9;
      if (dd < fBest) { fBest = dd; fIdx = i; }
    });

    // Geometría y atributos
    var geo = new THREE.PlaneGeometry(1, 1);
    function attr(name, size) { var a = new THREE.InstancedBufferAttribute(new Float32Array(N * size), size); geo.setAttribute(name, a); return a; }
    var aPW = attr('aPW', 3), aWS = attr('aWS', 4), aPS = attr('aPS', 4), aSF = attr('aSF', 3), aUVA = attr('aUVA', 4), aUVB = attr('aUVB', 4), aTM = attr('aTM', 4), aAvg = attr('aAvg', 2);
    for (var fz = 0; fz < N; fz++) aSF.setZ(fz, -100);
    function pack(c) { return Math.floor(c[0] * 31) + Math.floor(c[1] * 31) * 32 + Math.floor(c[2] * 31) * 1024; }
    items.forEach(function (it, i) {
      aPW.setXYZ(i, it.x, it.y, it.z);
      aWS.setXYZW(i, it.ry, it.rx, it.w, it.h);
      aTM.setZ(i, rand()); aTM.setW(i, i);
    });

    var uni = {
      uTime: { value: 0 }, uMorph: { value: 0 }, uWaveR: { value: 0 }, uWaveOn: { value: 0 }, uBand: { value: 1.7 }, uIntro: { value: RM ? 1 : 0 },
      uHover: { value: -5 }, uFocusId: { value: fIdx }, uFocus: { value: 0 }, uTint: { value: 0 }, uFloor: { value: floorY }, uOrigin: { value: new THREE.Vector3() },
      uAtlas: { value: null }, uMural: { value: null }, uShade: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uHaloK: { value: 1.9 }, uHaloAmp: { value: .1 }
    };
    function mat(extra) {
      var u = Object.assign({}, uni, extra.uniforms || {});
      return new THREE.ShaderMaterial({ uniforms: u, vertexShader: placeVS, fragmentShader: extra.fs, side: THREE.DoubleSide, defines: extra.defines || {}, transparent: !!extra.add, blending: extra.add ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: !extra.add, depthTest: !extra.add });
    }
    var mMain = mat({ fs: screenFS, uniforms: { uMirror: { value: 0 } } });
    var mMirror = mat({ fs: screenFS, uniforms: { uMirror: { value: 1 } } });
    var mHalo = mat({ fs: haloFS, add: true, defines: { HALO: 1 }, uniforms: { uMirror: { value: 0 } } });

    function inst(m, order) { var x = new THREE.InstancedMesh(geo, m, N); x.frustumCulled = false; x.renderOrder = order; scene.add(x); return x; }
    var meshMirror = inst(mMirror, 0), meshHalo = inst(mHalo, .5), mesh = inst(mMain, 1);

    /* ---- Estado de contenido ---- */
    var atlas, mural, wallAspect = (2 * halfArc) / yMax;
    var hKeys, vKeys;
    function setSlot(attrUV, texIdx, i, cell) {
      attrUV.setXYZW(i, cell.r[0], cell.r[1], cell.r[2], cell.r[3]);
      aAvg.setComponent(i, texIdx, pack(cell.a));
      aTM.setComponent(i, texIdx, 0);
    }
    function setMural(attrUV, texIdx, i, row, col) {
      var it = items[i];
      var arcHalf = it.w / 2;
      var uc = (it.theta * C.R + halfArc) / (2 * halfArc);
      var du = (2 * arcHalf) / (2 * halfArc);
      var vc = 1 - (it.y + 0) / yMax;
      var dv = it.h / yMax;
      attrUV.setXYZW(i, uc - du / 2, (row + clamp(vc - dv / 2, 0, 1)) / mural.rows, du, clamp(dv, 0, 1) / mural.rows);
      aAvg.setComponent(i, texIdx, pack(col));
      aTM.setComponent(i, texIdx, 1);
    }
    function touch() { aUVA.needsUpdate = aUVB.needsUpdate = aTM.needsUpdate = aAvg.needsUpdate = true; }

    var MCOL = [[.84, .04, .52], [.91, .22, .17], [.71, .83, .2], [1, .96, .87]];
    var CAMP = [{ m: 0 }, { h: 'almuerzo', v: 'oferta' }, { m: 1 }, { mix: 1 }, { m: 2 }, { h: 'cena', v: 'bebida' }, { m: 3 }, { h: 'dosxuno', v: 'papas' }];
    var campI = 0, wallMode = 'mix', focusForced = false, swapped = false;
    function fillMix(attrUV, texIdx, r) {
      for (var i = 0; i < N; i++) {
        var it = items[i], cell;
        if (it.vert) cell = atlas.V[vKeys[Math.floor(r() * vKeys.length)]];
        else cell = atlas.H[hKeys[Math.floor(r() * hKeys.length)]];
        setSlot(attrUV, texIdx, i, cell);
      }
    }
    function fillCampaign(cmp) {
      var r = rng(campI * 77 + 5);
      if (cmp.m !== undefined) for (var i = 0; i < N; i++) setMural(aUVB, 1, i, cmp.m, MCOL[cmp.m]);
      else if (cmp.mix) fillMix(aUVB, 1, r);
      else for (var j = 0; j < N; j++) setSlot(aUVB, 1, j, items[j].vert ? atlas.V[cmp.v] : atlas.H[cmp.h]);
    }

    /* ---- Destino S ---- */
    var endCam = new THREE.Vector3(), endTgt = new THREE.Vector3(), sOrder = null, zS = -3;
    function layoutS() {
      var asp = camera.aspect, dist = 10, seen = dist - .9, visH = 2 * seen * Math.tan(C.fov * Math.PI / 360), visW = visH * asp;
      var sw, cx, cy, ratio = 54.04 / 79.37;
      if (asp > 1.25) { sw = Math.min(visW * .62, (visH * .62) / ratio); cx = 0; cy = visH * .1; }
      else if (asp > .7) { sw = visW * .84; cx = 0; cy = visH * .09; }
      else { sw = visW * .92; cx = 0; cy = visH * .15; }
      var yC = yMax * .45;
      endCam.set(0, yC, zS + dist); endTgt.set(0, yC, zS);
      if (!sOrder) {
        var tiles = sTiles(N), r2 = rng(909);
        tiles = tiles.slice(0, N);
        var idx = []; for (var i = 0; i < N; i++) idx.push(i);
        for (var k = N - 1; k > 0; k--) { var q = Math.floor(r2() * (k + 1)), t = idx[k]; idx[k] = idx[q]; idx[q] = t; }
        // La pantalla protagonista aterriza cerca del centro de la S
        var cBest = 0, cD = 1e9; tiles.forEach(function (t2, i2) { var dd = t2.x * t2.x + t2.y * t2.y; if (dd < cD) { cD = dd; cBest = i2; } });
        var pos = idx.indexOf(fIdx), sw2 = idx[cBest]; idx[cBest] = fIdx; idx[pos] = sw2;
        sOrder = { tiles: tiles, idx: idx, delay: new Float32Array(N), r: r2 };
        for (var d = 0; d < N; d++) sOrder.delay[d] = r2();
      }
      for (var j = 0; j < N; j++) {
        var tile = sOrder.tiles[j], inst2 = sOrder.idx[j];
        aPS.setXYZW(inst2, cx + tile.x * sw, yC + cy + tile.y * sw, zS, inst2 === fIdx ? .02 : sOrder.delay[j]);
        aSF.setX(inst2, tile.w * sw); aSF.setY(inst2, tile.h * sw);
      }
      aPS.needsUpdate = aSF.needsUpdate = true;
    }

    /* ---- Cámara ---- */
    var heroPos = new THREE.Vector3(), heroTgt = new THREE.Vector3(), focPos = new THREE.Vector3(), focTgt = new THREE.Vector3();
    var size = { w: 1, h: 1 };
    function resize() {
      size.w = canvas.clientWidth || window.innerWidth; size.h = canvas.clientHeight || window.innerHeight;
      renderer.setSize(size.w, size.h, false);
      camera.aspect = size.w / size.h; camera.updateProjectionMatrix();
      uni.uRes.value.set(size.w * dpr, size.h * dpr);
      heroPos.set(0, C.camY, C.camZ); heroTgt.set(0, C.tgtY - Math.max(0, camera.aspect - 1.6) * 1.6, -C.R * .9);
      fitHero();
      var f = items[fIdx], ry = f.ry, nx = Math.sin(ry), nz = Math.cos(ry);
      var ft = Math.tan(C.fov * Math.PI / 360), frac = camera.aspect > 1.2 ? .44 : camera.aspect > .7 ? .62 : .8;
      var fd = (1 / frac) / (camera.aspect * 2 * ft);
      focPos.set(f.x + nx * fd, f.y - fd * ft * .22, f.z + nz * fd); focTgt.set(f.x, f.y - fd * ft * .22, f.z);
      layoutS();
      camUpdate(scene2.sp);
      render();
    }

    // La portada reserva abajo su bloque de texto: el muro se encuadra solo en la zona libre
    var heroShift = 0;
    function fitHero() {
      var free = opt.getFree ? opt.getFree() : { top: 0, bottom: size.h };
      var pT = new THREE.Vector3(), pB = new THREE.Vector3();
      function measure() {
        camera.clearViewOffset();
        camera.position.copy(heroPos); camera.lookAt(heroTgt); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
        pT.set(0, yMax, -C.R).project(camera); pB.set(0, 0, -C.R).project(camera);
        return { t: (-pT.y * .5 + .5) * size.h, b: (-pB.y * .5 + .5) * size.h };
      }
      var m = measure(), want = Math.max(120, (free.bottom - free.top) * .96);
      var th = halfArc / C.R, pL = new THREE.Vector3(-C.R * Math.sin(th), yMax * .5, -C.R * Math.cos(th)).project(camera);
      var wallW = Math.abs(pL.x) * size.w;
      var k = clamp(Math.min((m.b - m.t) / want, wallW / (size.w * 1.08)), .2, 1.9);
      // Acercar o alejar a lo largo de la línea de mirada, nunca más allá del objetivo
      heroPos.sub(heroTgt).multiplyScalar(k).add(heroTgt);
      m = measure();
      var pL2 = new THREE.Vector3(-C.R * Math.sin(th), yMax * .5, -C.R * Math.cos(th)).project(camera), k2 = clamp(Math.min((m.b - m.t) / want, Math.abs(pL2.x) * size.w / (size.w * 1.08)), .6, 1.4);
      heroPos.sub(heroTgt).multiplyScalar(k2).add(heroTgt);
      m = measure();
      heroShift = (m.t + m.b) / 2 - (free.top + free.bottom) / 2;
    }

    /* ---- Interacción ---- */
    var sorted = null, waveDists = new Float32Array(N);
    var wave = { on: false, t0: 0, speed: 1, max: 0, count: 0, user: false };
    var ptr = { x: 0, y: 0, sx: 0, sy: 0, moved: false };
    var scene2 = { p: 0, sp: 0 };
    var cb = opt.onCount || function () {};
    var lastT = 0;

    function commit() {
      aUVA.array.set(aUVB.array);
      for (var i = 0; i < N; i++) { aTM.setX(i, aTM.getY(i)); aAvg.setX(i, aAvg.getY(i)); }
      touch();
      uni.uWaveOn.value = 0; uni.uWaveR.value = 0;
      wave.on = false;
    }
    Wall.publish = function (originIdx, user) {
      if (!atlas) return;
      if (wave.on) commit();
      var cmp = CAMP[campI % CAMP.length]; campI++;
      fillCampaign(cmp);
      wallMode = cmp.mix ? 'mix' : 'camp'; focusForced = false; swapped = false;
      touch();
      if (originIdx === undefined || originIdx === null || originIdx < 0) originIdx = fIdx;
      var o = items[originIdx];
      uni.uOrigin.value.set(o.x, o.y, o.z);
      var mx = 0;
      for (var i = 0; i < N; i++) { var it = items[i], dx = it.x - o.x, dy = it.y - o.y, dz = it.z - o.z, d = Math.sqrt(dx * dx + dy * dy + dz * dz); waveDists[i] = d; if (d > mx) mx = d; }
      sorted = Array.prototype.slice.call(waveDists).sort(function (a, b) { return a - b; });
      wave = { on: true, t0: lastT, speed: mx / 1.9, max: mx, count: 0, user: !!user };
      Wall.attracted = true;
      cb(0, N, 'start', !!user);
      if (RM) { commit(); cb(N, N, 'end', !!user); render(); return; }
      uni.uWaveOn.value = 1; uni.uWaveR.value = 0;
    };

    function pick(cx, cy) {
      var v = new THREE.Vector3(), best = -1, bd = 1e9, cw = size.w, ch = size.h;
      camera.updateMatrixWorld();
      for (var i = 0; i < N; i++) {
        var it = items[i];
        v.set(it.x, it.y, it.z).project(camera);
        var sx = (v.x * .5 + .5) * cw, sy = (-v.y * .5 + .5) * ch;
        var dist = (it.x - camera.position.x) * (it.x - camera.position.x) + (it.z - camera.position.z) * (it.z - camera.position.z);
        var pxPerUnit = (ch / (2 * Math.tan(C.fov * Math.PI / 360))) / Math.sqrt(dist);
        var hw = it.w * pxPerUnit * .55 * Math.abs(Math.cos(it.ry + Math.atan2(camera.position.x - it.x, camera.position.z - it.z))) + 2, hh = it.h * pxPerUnit * .55;
        if (Math.abs(cx - sx) < hw && Math.abs(cy - sy) < hh) { var dd = (cx - sx) * (cx - sx) + (cy - sy) * (cy - sy); if (dd < bd) { bd = dd; best = i; } }
      }
      return best;
    }

    canvas.addEventListener('click', function (ev) {
      if (scene2.sp > .02 || !atlas) return;
      var r = canvas.getBoundingClientRect(), i = pick(ev.clientX - r.left, ev.clientY - r.top);
      if (i >= 0) Wall.publish(i, true);
    });
    var hoverDirty = null;
    canvas.addEventListener('pointermove', function (ev) { if (ev.pointerType !== 'touch') hoverDirty = ev; });
    canvas.addEventListener('pointerleave', function () { uni.uHover.value = -5; canvas.style.cursor = ''; });
    if (!RM) window.addEventListener('pointermove', function (ev) { ptr.x = ev.clientX / window.innerWidth - .5; ptr.y = ev.clientY / window.innerHeight - .5; }, { passive: true });

    /* ---- Bucle ---- */
    var visible = true, startT = -1, flashT = 0, idleR = rng(31), fTimes = [], low = 0;
    var cA = new THREE.Vector3(), cB = new THREE.Vector3();

    function camUpdate(p) {
      // De sala a pantalla única, y de ahí al vuelo final
      var a = smooth(0, .24, p), b = smooth(.3, .62, p), c2 = smooth(.62, 1, p);
      cA.copy(heroPos).lerp(focPos, a).lerp(endCam, b);
      cB.copy(heroTgt).lerp(focTgt, a).lerp(endTgt, b);
      var par = RM ? 0 : (1 - a) * 1 + b * .35;
      cA.x += ptr.sx * 2.2 * par; cA.y += -ptr.sy * .9 * par;
      cA.z -= c2 * .9;
      camera.position.copy(cA); camera.lookAt(cB);
      var sh = heroShift * (1 - a);
      if (Math.abs(sh) > .5) camera.setViewOffset(size.w, size.h, 0, sh, size.w, size.h); else camera.clearViewOffset();
    }

    function render() {
      if (!atlas) return;
      renderer.render(scene, camera);
    }

    function tick(now) {
      if (startT < 0) startT = now;
      var t = (now - startT) / 1000, dt = Math.min(.05, t - lastT);
      lastT = t;
      uni.uTime.value = t;
      if (!RM && uni.uIntro.value < 1) uni.uIntro.value = Math.min(1, t / 1.5);

      // Progreso de la escena
      var p = opt.getProgress ? opt.getProgress() : 0;
      scene2.p = p;
      scene2.sp += (p - scene2.sp) * (RM ? 1 : (1 - Math.exp(-dt * 7)));
      var sp = scene2.sp;
      if (Math.abs(sp - p) < .0005) sp = scene2.sp = p;

      ptr.sx += (ptr.x - ptr.sx) * (1 - Math.exp(-dt * 3));
      ptr.sy += (ptr.y - ptr.sy) * (1 - Math.exp(-dt * 3));
      camUpdate(sp);

      uni.uMorph.value = smooth(.3, .9, sp) ;
      uni.uFocus.value = smooth(.06, .24, sp) * (1 - smooth(.28, .42, sp));
      uni.uTint.value = smooth(.5, .86, sp);
      uni.uShade.value = 0;
      uni.uHaloAmp.value = lerp(tier === 'm' ? .1 : .13, .34, uni.uTint.value);
      uni.uHaloK.value = lerp(1.9, 1.5, uni.uTint.value);
      meshMirror.visible = quality > 0 && uni.uMorph.value < .85;
      meshHalo.visible = quality > 1 || uni.uTint.value > 0;

      // La protagonista muestra un menú completo; el resto cambia a mezcla mientras está a oscuras
      if (sp > .025 && !focusForced) {
        if (wave.on) { commit(); cb(N, N, 'end', wave.user); }
        setSlot(aUVA, 0, fIdx, atlas.H.combos); setSlot(aUVB, 1, fIdx, atlas.H.combos); touch(); focusForced = true;
      }
      if (sp > .2 && !swapped) {
        var rs = rng(5150);
        fillMix(aUVA, 0, rs); setSlot(aUVA, 0, fIdx, atlas.H.combos);
        aUVB.array.set(aUVA.array);
        for (var si = 0; si < N; si++) { aTM.setY(si, aTM.getX(si)); aAvg.setY(si, aAvg.getX(si)); }
        touch(); swapped = true; wallMode = 'mix';
      }
      // Onda
      if (wave.on) {
        var r = (t - wave.t0) * wave.speed;
        uni.uWaveR.value = r;
        var lo = 0, hi = N;
        while (lo < hi) { var mid = (lo + hi) >> 1; if (sorted[mid] <= r) lo = mid + 1; else hi = mid; }
        if (lo !== wave.count) { wave.count = lo; cb(lo, N, 'run', wave.user); }
        if (r > wave.max + uni.uBand.value * 1.8) { commit(); cb(N, N, 'end', wave.user); }
      } else if (sp < .02 && t - flashT > 1.6 && wallMode === 'mix') {
        // Pantallas vivas: cambio ocasional mientras no haya una campaña común
        flashT = t;
        var i = Math.floor(idleR() * N), it = items[i];
        setSlot(aUVA, 0, i, it.vert ? atlas.V[vKeys[Math.floor(idleR() * vKeys.length)]] : atlas.H[hKeys[Math.floor(idleR() * hKeys.length)]]);
        aSF.setZ(i, t); aSF.needsUpdate = true; touch();
      } else if (sp < .02 && t - flashT > 2.4) {
        flashT = t; var j = Math.floor(idleR() * N); aSF.setZ(j, t); aSF.needsUpdate = true;
      }

      if (hoverDirty && sp < .02) {
        var rc = canvas.getBoundingClientRect(), h = pick(hoverDirty.clientX - rc.left, hoverDirty.clientY - rc.top);
        uni.uHover.value = h; canvas.style.cursor = h >= 0 ? 'pointer' : '';
        hoverDirty = null;
      }

      // Calidad adaptable
      fTimes.push(dt);
      if (fTimes.length >= 70) {
        var avg = fTimes.reduce(function (s, x) { return s + x; }, 0) / fTimes.length; fTimes.length = 0;
        if (t > 2.5 && avg > 1 / 40) {
          low++;
          if (low >= 1 && quality > 0) { quality--; if (quality === 0 && dpr > 1) { dpr = Math.max(1, dpr - .25); renderer.setPixelRatio(dpr); uni.uRes.value.set(size.w * dpr, size.h * dpr); } }
          else if (dpr > 1) { dpr = Math.max(1, dpr - .25); renderer.setPixelRatio(dpr); uni.uRes.value.set(size.w * dpr, size.h * dpr); }
        }
      }
      render();
      if (opt.onScene) opt.onScene(sp);
    }
    var quality = 2;

    Wall.tick = function (now) { if (!RM && visible && atlas && !document.hidden) tick(now); };
    Wall.setVisible = function (v) { visible = v; };
    Wall.progress = function () { return scene2.sp; };
    Wall.staticFrame = function () { render(); };
    Wall.debug = { uni: uni, items: items, get wave() { return wave; }, quality: function () { return quality; }, dpr: function () { return dpr; }, setProgress: function (p) { scene2.sp = p; } };

    /* ---- Carga de contenido ---- */
    function load(src) { return new Promise(function (res, rej) { var i = new Image(); i.onload = function () { res(i); }; i.onerror = rej; i.src = src; }); }
    var FOODS = ['burger', 'fries', 'cup', 'coffee', 'icecream', 'arepa'];
    var wait = FOODS.map(function (n) { return load(window.SIGNUM_FOOD_URI(n)); });
    wait.push((document.fonts && document.fonts.load) ? Promise.race([Promise.all([document.fonts.load('800 60px Archivo'), document.fonts.load('400 60px Anton', '2×1 Ñáéíóú')]), new Promise(function (r) { setTimeout(r, 2000); })]) : Promise.resolve());
    return Promise.all(wait).then(function (r) {
      var imgs = {}; FOODS.forEach(function (n, i) { imgs[n] = r[i]; });
      atlas = buildAtlas(C.atlas, imgs);
      hKeys = atlas.hKeys; vKeys = atlas.vKeys;
      var muralW = tier === 'm' ? 1024 : 2048;
      mural = buildMurals(muralW, wallAspect, C.central);
      var tex = new THREE.CanvasTexture(atlas.canvas);
      tex.flipY = false; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); tex.colorSpace = THREE.NoColorSpace;
      var tm = new THREE.CanvasTexture(mural.canvas);
      tm.flipY = false; tm.generateMipmaps = true; tm.minFilter = THREE.LinearMipmapLinearFilter; tm.magFilter = THREE.LinearFilter; tm.anisotropy = tex.anisotropy; tm.colorSpace = THREE.NoColorSpace;
      uni.uAtlas.value = tex; uni.uMural.value = tm;

      var ri = rng(12);
      fillMix(aUVA, 0, ri);
      setSlot(aUVA, 0, fIdx, atlas.H.combos);
      aUVB.array.set(aUVA.array);
      for (var i = 0; i < N; i++) { aTM.setY(i, aTM.getX(i)); aAvg.setY(i, aAvg.getX(i)); }
      touch();
      resize();
      Wall.ok = true;
      Wall.resize = resize;
      return true;
    });
  };
})();
