/* Ilustraciones genéricas de comida para los menús de muestra. Sin marcas. */
(function () {
  'use strict';
  function svg(vb, body) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '">' + body + '</svg>'; }
  var F = {
    burger: svg('0 0 200 170',
      '<path fill="#E9A23B" d="M18 78C18 32 58 10 100 10s82 22 82 68z"/>' +
      '<g fill="#FFF1CF"><ellipse cx="62" cy="42" rx="7" ry="4" transform="rotate(-24 62 42)"/><ellipse cx="96" cy="28" rx="7" ry="4"/><ellipse cx="132" cy="42" rx="7" ry="4" transform="rotate(24 132 42)"/><ellipse cx="82" cy="58" rx="7" ry="4"/><ellipse cx="118" cy="60" rx="7" ry="4"/></g>' +
      '<path fill="#7CB518" d="M10 78h180c6 0 6 14-2 14-9 0-9 8-20 8s-12-8-22-8-12 8-23 8-12-8-23-8-12 8-23 8-12-8-22-8-11 8-21 8-11-8-22-8c-8 0-8-14-2-14z"/>' +
      '<rect x="20" y="96" width="160" height="12" rx="6" fill="#E8372C"/>' +
      '<path fill="#FFC815" d="M16 106h168l-30 16-22-12-30 18-28-18-24 10z"/>' +
      '<rect x="20" y="112" width="160" height="24" rx="11" fill="#5B2A12"/>' +
      '<path fill="#DE9434" d="M22 138h156v6c0 14-12 22-26 22H48c-14 0-26-8-26-22z"/>'),
    fries: svg('0 0 200 200',
      '<g fill="#FFC815"><rect x="56" y="30" width="15" height="92" rx="3" transform="rotate(-9 63 76)"/><rect x="76" y="14" width="15" height="108" rx="3" transform="rotate(-3 83 68)"/><rect x="96" y="22" width="15" height="100" rx="3" transform="rotate(2 103 72)"/><rect x="116" y="10" width="15" height="112" rx="3" transform="rotate(6 123 66)"/><rect x="134" y="34" width="15" height="88" rx="3" transform="rotate(11 141 78)"/></g>' +
      '<g fill="#F4A70B"><rect x="66" y="48" width="12" height="74" rx="3" transform="rotate(5 72 85)"/><rect x="107" y="40" width="12" height="82" rx="3" transform="rotate(-5 113 81)"/></g>' +
      '<path fill="#E8372C" d="M42 92c18 14 98 14 116 0l-14 100H56z"/>' +
      '<path fill="#FFF4DF" d="M72 128h56l-3 28c-14 7-36 7-50 0z"/>'),
    cup: svg('0 0 200 220',
      '<path fill="none" stroke="#E8372C" stroke-width="10" stroke-linecap="round" d="M112 44 124 8h22"/>' +
      '<path fill="#F7F1E6" d="M46 60h108l-14 150H60z"/><path fill="#E8372C" d="M51 106h98l-5 62H56z"/>' +
      '<rect x="36" y="42" width="128" height="20" rx="8" fill="#FFF"/><circle cx="100" cy="137" r="20" fill="#FFF4DF"/>'),
    coffee: svg('0 0 200 180',
      '<g fill="none" stroke="#B9A18C" stroke-width="9" stroke-linecap="round"><path d="M72 42c-10-12 10-18 0-32"/><path d="M108 42c-10-12 10-18 0-32"/></g>' +
      '<path fill="#FFF" d="M34 54h126v50c0 30-22 48-50 48H84c-28 0-50-18-50-48z"/><path fill="#6B3A1E" d="M34 54h126v16H34z"/>' +
      '<path fill="none" stroke="#FFF" stroke-width="13" d="M160 72h10c28 0 28 44-4 44h-10"/><rect x="18" y="156" width="164" height="12" rx="6" fill="#D9CDBF"/>'),
    icecream: svg('0 0 170 230',
      '<path fill="#E9A23B" d="m40 110 45 112 45-112z"/><path fill="none" stroke="#C47F24" stroke-width="5" d="m58 110 40 72M84 110l28 50M112 110 72 182M86 110l-28 50"/>' +
      '<circle cx="62" cy="90" r="38" fill="#FFF4DF"/><circle cx="110" cy="90" r="38" fill="#F48FB1"/><circle cx="85" cy="50" r="38" fill="#7A4A2A"/><circle cx="85" cy="16" r="10" fill="#E8372C"/>'),
    arepa: svg('0 0 200 150',
      '<ellipse cx="100" cy="88" rx="92" ry="52" fill="#D79A3C"/><ellipse cx="100" cy="70" rx="92" ry="52" fill="#EFC26A"/>' +
      '<path fill="#FFF4DF" d="M14 72c30 18 142 18 172 0-4 12-14 22-28 30-30 12-86 12-116 0-14-8-24-18-28-30z"/>' +
      '<g fill="#B97A28"><ellipse cx="62" cy="50" rx="12" ry="6"/><ellipse cx="112" cy="40" rx="15" ry="7"/><ellipse cx="146" cy="60" rx="9" ry="5"/></g>')
  };
  window.SIGNUM_FOOD = F;
  window.SIGNUM_FOOD_URI = function (name) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(F[name].replace('<svg ', '<svg width="800" height="800" preserveAspectRatio="xMidYMid meet" ')); };
})();
