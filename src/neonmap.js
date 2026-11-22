/*! gta6-map (NeonMap) | MIT License | Unofficial fan project, not affiliated with Rockstar Games or Take-Two. */
(function (root) {
  'use strict';

  var THEMES = {
    sunset: {
      bg: '#1b1033', land: '#231340', park: '#17453f', water: '#0fb5c9', waterDeep: '#0a6f94',
      building: '#3a1d5c', buildingTop: '#ff5fa2', minor: '#5a3380', major: '#ff8a3d',
      highway: '#ff3d81', glow: '#ff3d81', label: '#ffe9d6', halo: '#1b1033', accent: '#ff3d81', accent2: '#ffb347'
    },
    midnight: {
      bg: '#060a1a', land: '#0b1129', park: '#0d3030', water: '#123f8c', waterDeep: '#0b2763',
      building: '#141d45', buildingTop: '#32e0ff', minor: '#25315f', major: '#32e0ff',
      highway: '#8a5cff', glow: '#32e0ff', label: '#dcecff', halo: '#060a1a', accent: '#32e0ff', accent2: '#8a5cff'
    },
    daybreak: {
      bg: '#ffe3c9', land: '#ffeedd', park: '#b9e6c0', water: '#58d3e0', waterDeep: '#2eb4cf',
      building: '#ffc9b0', buildingTop: '#ff7f6e', minor: '#ffffff', major: '#ffb057',
      highway: '#ff5a7a', glow: '#ff8fa3', label: '#44203f', halo: '#fff4ea', accent: '#e8336d', accent2: '#ff8c2e'
    }
  };

  var SOURCE = 'openmaptiles';
  var FONT = ['Noto Sans Regular'];
  var FONT_BOLD = ['Noto Sans Bold'];

  function width(a, b, c) {
    return ['interpolate', ['exponential', 1.5], ['zoom'], 6, a, 12, b, 18, c];
  }

  function classFilter(classes) {
    return ['in', ['get', 'class'], ['literal', classes]];
  }

  function line(id, classes, color, w, extra) {
    return {
      id: id, type: 'line', source: SOURCE, 'source-layer': 'transportation',
      filter: classFilter(classes),
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: Object.assign({ 'line-color': color, 'line-width': w }, extra || {})
    };
  }

  function buildStyle(themeName) {
    var t = THEMES[themeName] || THEMES.sunset;
    var big = ['motorway', 'trunk'];
    var mid = ['primary', 'secondary'];
    var small = ['tertiary', 'minor', 'service', 'street'];
    return {
      version: 8,
      name: 'neonmap-' + themeName,
      glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
      sources: {
        openmaptiles: {
          type: 'vector',
          url: 'https://tiles.openfreemap.org/planet',
          attribution: '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">&copy; OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
        }
      },
      layers: [
        { id: 'bg', type: 'background', paint: { 'background-color': t.land } },
        { id: 'park', type: 'fill', source: SOURCE, 'source-layer': 'landcover', filter: classFilter(['grass', 'wood']), paint: { 'fill-color': t.park, 'fill-opacity': 0.75 } },
        { id: 'landuse-park', type: 'fill', source: SOURCE, 'source-layer': 'landuse', filter: classFilter(['park', 'cemetery', 'stadium', 'pitch']), paint: { 'fill-color': t.park, 'fill-opacity': 0.6 } },
        { id: 'water', type: 'fill', source: SOURCE, 'source-layer': 'water', paint: { 'fill-color': ['interpolate', ['linear'], ['zoom'], 4, t.waterDeep, 14, t.water] } },
        { id: 'water-edge', type: 'line', source: SOURCE, 'source-layer': 'water', paint: { 'line-color': t.glow, 'line-opacity': 0.45, 'line-width': 1.2, 'line-blur': 1.5 } },
        { id: 'waterway', type: 'line', source: SOURCE, 'source-layer': 'waterway', paint: { 'line-color': t.water, 'line-width': 1.2 } },
        line('road-small', small, t.minor, width(0.2, 1, 9), { 'line-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0, 12, 1] }),
        line('road-mid-glow', mid, t.major, width(1, 5, 22), { 'line-blur': 5, 'line-opacity': 0.3 }),
        line('road-mid', mid, t.major, width(0.4, 1.5, 11)),
        line('road-big-glow', big, t.glow, width(3, 10, 34), { 'line-blur': 7, 'line-opacity': 0.42 }),
        line('road-big', big, t.highway, width(0.8, 2.6, 15)),
        {
          id: 'buildings', type: 'fill-extrusion', source: SOURCE, 'source-layer': 'building', minzoom: 14,
          paint: {
            'fill-extrusion-color': ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 6], 0, t.building, 70, t.buildingTop],
            'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 6],
            'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
            'fill-extrusion-opacity': 0.88
          }
        },
        {
          id: 'road-names', type: 'symbol', source: SOURCE, 'source-layer': 'transportation_name', minzoom: 13,
          layout: { 'symbol-placement': 'line', 'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']], 'text-font': FONT, 'text-size': 11 },
          paint: { 'text-color': t.label, 'text-halo-color': t.halo, 'text-halo-width': 1.4, 'text-opacity': 0.85 }
        },
        {
          id: 'water-names', type: 'symbol', source: SOURCE, 'source-layer': 'water_name',
          layout: { 'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']], 'text-font': FONT, 'text-size': 12, 'text-letter-spacing': 0.12 },
          paint: { 'text-color': t.label, 'text-halo-color': t.waterDeep, 'text-halo-width': 1, 'text-opacity': 0.8 }
        },
        {
          id: 'place-names', type: 'symbol', source: SOURCE, 'source-layer': 'place',
          layout: {
            'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']], 'text-font': FONT_BOLD,
            'text-size': ['interpolate', ['linear'], ['zoom'], 4, 11, 12, 16], 'text-transform': 'uppercase', 'text-letter-spacing': 0.1
          },
          paint: { 'text-color': t.label, 'text-halo-color': t.halo, 'text-halo-width': 1.8 }
        }
      ]
    };
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function safeUrl(value) {
    try {
      var url = new URL(String(value), location.href);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
    } catch (e) {
      return null;
    }
  }

  function applyThemeVars(container, themeName) {
    var t = THEMES[themeName] || THEMES.sunset;
    container.style.setProperty('--nm-accent', t.accent);
    container.style.setProperty('--nm-accent2', t.accent2);
    container.style.setProperty('--nm-ink', themeName === 'daybreak' ? '#44203f' : '#fff4ea');
    container.style.setProperty('--nm-panel', themeName === 'daybreak' ? 'rgba(255,247,240,.96)' : 'rgba(22,12,42,.95)');
  }

  function popupContent(place) {
    var box = el('div', 'nm-popup');
    if (place.category) box.appendChild(el('div', 'nm-popup-cat', place.category));
    box.appendChild(el('strong', 'nm-popup-title', place.name));
    if (place.description) box.appendChild(el('p', 'nm-popup-text', place.description));
    var row = el('div', 'nm-popup-row');
    if (place.price) row.appendChild(el('span', 'nm-popup-price', place.price));
    var href = place.url && safeUrl(place.url);
    if (href) {
      var link = el('a', 'nm-popup-link', place.cta || 'View');
      link.href = href;
      row.appendChild(link);
    }
    if (row.childNodes.length) box.appendChild(row);
    return box;
  }

  function create(target, options) {
    if (!root.maplibregl) throw new Error('NeonMap needs MapLibre GL JS. Load it before neonmap.js.');
    var opts = Object.assign({ center: [-80.13, 25.79], zoom: 13, pitch: 50, bearing: -18, theme: 'sunset', places: [], fit: true }, options || {});
    var container = typeof target === 'string' ? document.querySelector(target) : target;
    if (!container) throw new Error('NeonMap: map container not found.');
    container.classList.add('nm-root');
    var theme = THEMES[opts.theme] ? opts.theme : 'sunset';
    applyThemeVars(container, theme);

    var map = new root.maplibregl.Map({
      container: container, style: buildStyle(theme), center: opts.center, zoom: opts.zoom,
      pitch: opts.pitch, bearing: opts.bearing, maxPitch: 70, attributionControl: { compact: true }
    });
    map.addControl(new root.maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

    var markers = {};
    var places = [];
    var popup = new root.maplibregl.Popup({ offset: 24, maxWidth: '270px', className: 'nm-popup-wrap' });
    var selectedId = null;

    function mark(id) {
      Object.keys(markers).forEach(function (key) {
        markers[key].getElement().classList.toggle('is-active', key === String(id));
      });
    }

    function select(id, move) {
      var place = places.find(function (p) { return String(p.id) === String(id); });
      if (!place) return;
      selectedId = place.id;
      mark(place.id);
      popup.setLngLat([place.lng, place.lat]).setDOMContent(popupContent(place)).addTo(map);
      if (move !== false) map.easeTo({ center: [place.lng, place.lat], zoom: Math.max(map.getZoom(), 14.5), duration: 700 });
      if (opts.onSelect) opts.onSelect(place);
    }

    function setPlaces(next, fit) {
      Object.keys(markers).forEach(function (key) { markers[key].remove(); });
      markers = {};
      places = (next || []).filter(function (p) { return isFinite(p.lng) && isFinite(p.lat); })
        .map(function (p, i) { return Object.assign({ id: i }, p); });
      places.forEach(function (place) {
        var pin = el('button', 'nm-pin');
        pin.type = 'button';
        pin.setAttribute('aria-label', place.name + (place.price ? ', ' + place.price : ''));
        pin.appendChild(el('span', 'nm-pin-label', place.label || place.price || place.name));
        pin.addEventListener('click', function (e) { e.stopPropagation(); select(place.id); });
        markers[String(place.id)] = new root.maplibregl.Marker({ element: pin, anchor: 'bottom' }).setLngLat([place.lng, place.lat]).addTo(map);
      });
      if (selectedId !== null) mark(selectedId);
      if (fit !== false && opts.fit && places.length > 1) {
        var bounds = new root.maplibregl.LngLatBounds();
        places.forEach(function (p) { bounds.extend([p.lng, p.lat]); });
        map.fitBounds(bounds, { padding: 70, maxZoom: 15, pitch: opts.pitch, bearing: opts.bearing, duration: 600 });
      }
    }

    function setTheme(name) {
      if (!THEMES[name]) return;
      theme = name;
      applyThemeVars(container, name);
      map.setStyle(buildStyle(name));
    }

    setPlaces(opts.places);

    return {
      map: map,
      setPlaces: setPlaces,
      setTheme: setTheme,
      select: select,
      highlight: mark,
      flyTo: function (center, zoom) { map.flyTo({ center: center, zoom: zoom || map.getZoom(), pitch: opts.pitch, bearing: opts.bearing, duration: 2200, essential: true }); },
      destroy: function () { popup.remove(); map.remove(); container.classList.remove('nm-root'); }
    };
  }

  root.NeonMap = { create: create, buildStyle: buildStyle, themes: Object.keys(THEMES) };
})(window);
