/* global dscc */
 
// ─── Helper : lire une valeur de style proprement ───────────────────────────
function styleVal(style, key, fallback) {
  try {
    var v = style[key].value;
    if (v === null || v === undefined || v === '') return fallback;
    if (typeof v === 'object' && v.color) return v.color;
    return v;
  } catch (e) {
    return fallback;
  }
}
 
// ─── Injecter la police custom si une URL est fournie ───────────────────────
var _loadedFontUrl = null;
 
// Préchargement NouvelR
(function() {
  var s = document.createElement("style");
  s.textContent = [
    "@font-face {",
    "  font-family: \"NouvelR\";",
    "  src: url(\"https://www.renault.fr/client/NouvelR-Regular-AH-a6ef79cbe0c9af2e.woff2\") format(\"woff2\");",
    "  font-weight: 400;",
    "}",
    "@font-face {",
    "  font-family: \"NouvelR\";",
    "  src: url(\"https://www.renault.fr/client/NouvelR-Bold-AH-1c5ca002c4ab8beb.woff2\") format(\"woff2\");",
    "  font-weight: 700;",
    "}"
  ].join("\n");
  document.head.appendChild(s);
})();
function loadFont(url, family) {
  if (!url || url === _loadedFontUrl) return;
  _loadedFontUrl = url;
  var existing = document.getElementById('r5-font-face');
  if (existing) existing.remove();
  var style = document.createElement('style');
  style.id = 'r5-font-face';
  style.textContent = [
    '@font-face {',
    '  font-family: "' + family + '";',
    '  src: url("' + url + '") format("woff2"),',
    '       url("' + url + '") format("woff"),',
    '       url("' + url + '") format("truetype");',
    '  font-weight: 100 900;',
    '}'
  ].join('\n');
  document.head.appendChild(style);
}
 
// ─── Générer les 4 coins SVG ────────────────────────────────────────────────
function corners(size, thick, idleColor) {
  var s = parseInt(size) || 28;
  var arm = Math.round(s * 0.82);
  var t = parseFloat(thick) || 5;
  var c = idleColor || '#1A1E24';
  var svg = [
    '<svg viewBox="0 0 ' + s + ' ' + s + '">',
    '<line x1="0" y1="' + arm + '" x2="0" y2="0"',
    ' stroke="' + c + '" stroke-width="' + t + '" stroke-linecap="square"',
    ' class="r5-line" style="transition:stroke .4s"/>',
    '<line x1="0" y1="0" x2="' + arm + '" y2="0"',
    ' stroke="' + c + '" stroke-width="' + t + '" stroke-linecap="square"',
    ' class="r5-line" style="transition:stroke .4s"/>',
    '</svg>'
  ].join('');
  return [
    '<div class="r5-corner tl">' + svg + '</div>',
    '<div class="r5-corner tr">' + svg + '</div>',
    '<div class="r5-corner bl">' + svg + '</div>',
    '<div class="r5-corner br">' + svg + '</div>'
  ].join('');
}
 
// ─── Rendu principal ─────────────────────────────────────────────────────────
function drawViz(data) {
  var style = data.style;
 
  // Typo
  var fontUrl    = styleVal(style, 'font_url',     '');
  var fontFamily = styleVal(style, 'font_family',  'Arial');
  var valueSize  = styleVal(style, 'value_size',   '32');
  var valueWeight= styleVal(style, 'value_weight', '700');
  var labelSize  = styleVal(style, 'label_size',   '10');
  var textAlign  = styleVal(style, 'text_align',   'left');
  var valueColor = styleVal(style, 'value_color',  '#D0D4DA');
  var labelColor = styleVal(style, 'label_color',  '#3A4050');
 
  // Contenu
  var label       = styleVal(style, 'label',          'Mon KPI');
  var showTrend   = styleVal(style, 'show_trend',     true);
  var trendVal    = styleVal(style, 'trend_value',    '');
  var trendDir    = styleVal(style, 'trend_direction','up');
  var showSub     = styleVal(style, 'show_subtitle',  true);
  var subtitle    = styleVal(style, 'subtitle',       '');
  var showBar     = styleVal(style, 'show_bar',       false);
  var barValue    = parseInt(styleVal(style, 'bar_value', '74')) || 0;
  var showIcon    = styleVal(style, 'show_icon',      false);
  var iconSvg     = styleVal(style, 'icon_svg',       '');
 
  // Coins
  var cornerIdle  = styleVal(style, 'corner_color_idle',  '#1A1E24');
  var cornerHover = styleVal(style, 'corner_color_hover', '#909AAA');
  var cornerSize  = styleVal(style, 'corner_size',        '28');
  var cornerThick = styleVal(style, 'corner_thickness',   '5');
 
  // Valeur depuis la donnée Looker
  var metricValue = '—';
  try {
    var rows = data.tables.DEFAULT;
    if (rows && rows.length > 0) {
      var raw = rows[0].metric[0];
      if (raw !== null && raw !== undefined) {
        metricValue = typeof raw === 'number'
          ? raw.toLocaleString('fr-FR')
          : raw;
      }
    }
  } catch (e) { /* pas de donnée connectée */ }
 
  // Charger la police si URL fournie
  if (fontUrl) loadFont(fontUrl, fontFamily);
 
  // Trend couleur
  var trendBg, trendColor;
  if (trendDir === 'up') {
    trendBg = 'rgba(20,60,35,0.6)'; trendColor = '#3d9e6a';
  } else if (trendDir === 'down') {
    trendBg = 'rgba(70,20,20,0.6)'; trendColor = '#c05050';
  } else {
    trendBg = 'rgba(30,35,45,0.6)'; trendColor = '#506070';
  }
 
  // Footer visible ?
  var hasFooter = (showTrend && trendVal) || (showSub && subtitle) || showBar;
 
  // Icône
  var iconHtml = '';
  if (showIcon && iconSvg) {
    iconHtml = '<div class="r5-icon" aria-hidden="true">'
      + '<svg viewBox="0 0 24 24" width="18" height="18" fill="none"'
      + ' stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'
      + iconSvg
      + '</svg></div>';
  }
 
  // HTML
  var html = [
    '<style>',
    '  * { box-sizing: border-box; margin: 0; padding: 0; }',
    '  body { background: transparent; overflow: hidden; }',
    '  .r5-card {',
    '    position: relative;',
    '    width: 100%; height: 100%;',
    '    padding: 20px 18px 18px;',
    '    cursor: pointer;',
    '    font-family: "' + fontFamily + '", Arial, sans-serif;',
    '  }',
    '  .r5-corner { position: absolute; width: ' + cornerSize + 'px; height: ' + cornerSize + 'px; }',
    '  .r5-corner.tl { top:0; left:0; }',
    '  .r5-corner.tr { top:0; right:0; transform:scaleX(-1); }',
    '  .r5-corner.bl { bottom:0; left:0; transform:scaleY(-1); }',
    '  .r5-corner.br { bottom:0; right:0; transform:scale(-1); }',
    '  .r5-card:hover .r5-line { stroke: ' + cornerHover + ' !important; }',
    '  .r5-icon {',
    '    position: absolute; top: 16px; right: 16px;',
    '    color: rgba(255,255,255,0.12);',
    '    transition: color .35s;',
    '  }',
    '  .r5-card:hover .r5-icon { color: rgba(100,140,180,0.5); }',
    '  .r5-label {',
    '    font-size: ' + labelSize + 'px;',
    '    letter-spacing: 0.13em;',
    '    text-transform: uppercase;',
    '    color: ' + labelColor + ';',
    '    text-align: ' + textAlign + ';',
    '    margin-bottom: 8px;',
    '  }',
    '  .r5-value {',
    '    font-size: ' + valueSize + 'px;',
    '    font-weight: ' + valueWeight + ';',
    '    color: ' + valueColor + ';',
    '    line-height: 1;',
    '    letter-spacing: -0.5px;',
    '    text-align: ' + textAlign + ';',
    '    margin-bottom: 0;',
    '  }',
    '  .r5-divider {',
    '    width: 100%; height: 1px;',
    '    background: rgba(255,255,255,0.05);',
    '    margin: 10px 0 8px;',
    '  }',
    '  .r5-footer {',
    '    display: flex; align-items: center; gap: 6px; flex-wrap: wrap;',
    '    justify-content: ' + (textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start') + ';',
    '  }',
    '  .r5-trend {',
    '    font-size: 11px; font-weight: 600;',
    '    padding: 2px 6px; border-radius: 2px;',
    '    background: ' + trendBg + ';',
    '    color: ' + trendColor + ';',
    '  }',
    '  .r5-sub { font-size: 11px; color: rgba(140,155,175,0.45); }',
    '  .r5-bar-track {',
    '    height: 1.5px; background: rgba(255,255,255,0.05);',
    '    border-radius: 1px; margin-top: 8px; overflow: hidden;',
    '  }',
    '  .r5-bar-fill {',
    '    height: 100%; width: ' + barValue + '%;',
    '    background: rgba(80,110,150,0.5); border-radius: 1px;',
    '  }',
    '</style>',
 
    '<div class="r5-card">',
      corners(cornerSize, cornerThick, cornerIdle),
      iconHtml,
      '<div class="r5-label">' + label + '</div>',
      '<div class="r5-value">' + metricValue + '</div>',
      hasFooter ? '<div class="r5-divider"></div>' : '',
      hasFooter ? '<div class="r5-footer">' : '',
        (showTrend && trendVal) ? '<span class="r5-trend">' + trendVal + '</span>' : '',
        (showSub && subtitle)   ? '<span class="r5-sub">'   + subtitle  + '</span>' : '',
      hasFooter ? '</div>' : '',
      showBar ? '<div class="r5-bar-track"><div class="r5-bar-fill"></div></div>' : '',
    '</div>'
  ].join('');
 
  document.body.innerHTML = html;
}
 
// ─── Branchement Looker Studio ───────────────────────────────────────────────
dscc.subscribeToData(drawViz, { transform: dscc.objectTransform });
