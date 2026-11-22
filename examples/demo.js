function runDemo(config) {
  var filters = document.getElementById('filters');
  var list = document.getElementById('list');
  var count = document.getElementById('count');
  var active = null;
  var items = {};
  config.places.forEach(function (p) {
    if (config.imagePrefix) p.image = 'img/' + config.imagePrefix + '-' + p.id + '.jpg';
  });

  function paintActive(id) {
    Object.keys(items).forEach(function (key) {
      items[key].classList.toggle('is-active', key === String(id));
    });
  }

  var neon = NeonMap.create('#map', {
    theme: config.theme,
    places: config.places,
    onSelect: function (place) {
      paintActive(place.id);
      if (items[place.id]) items[place.id].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });

  function render() {
    var shown = config.places.filter(function (p) { return !active || p.category === active; });
    list.textContent = '';
    items = {};
    shown.forEach(function (place) {
      var row = document.createElement('button');
      row.type = 'button';
      row.className = 'item';
      var name = document.createElement('strong');
      name.textContent = place.name;
      var price = document.createElement('b');
      price.textContent = place.price;
      var text = document.createElement('span');
      text.textContent = place.category + ' · ' + place.description;
      if (place.image) {
        var thumb = document.createElement('img');
        thumb.src = place.image;
        thumb.alt = '';
        thumb.loading = 'lazy';
        row.appendChild(thumb);
      }
      row.append(name, price, text);
      row.addEventListener('click', function () { neon.select(place.id); });
      row.addEventListener('mouseenter', function () { neon.highlight(place.id); });
      items[place.id] = row;
      list.appendChild(row);
    });
    count.textContent = shown.length + (shown.length === 1 ? ' place' : ' places');
    neon.setPlaces(shown);
  }

  var names = [null].concat(Array.from(new Set(config.places.map(function (p) { return p.category; }))));
  names.forEach(function (name) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = name || config.all;
    b.setAttribute('aria-pressed', String(name === active));
    b.addEventListener('click', function () {
      active = name;
      filters.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      render();
    });
    filters.appendChild(b);
  });
  render();
}
