# gta6-map

**Free, open-source, open-world style maps for your website, plus a driving sandbox for AI agents.**

Neon 3D streets for any real city. No API key, no build step.

**[Live demo](https://wesomitsu.github.io/gta6-map/)** · [Stays site](https://wesomitsu.github.io/gta6-map/examples/stays.html) · [Food guide](https://wesomitsu.github.io/gta6-map/examples/food.html) · [AI driving sandbox](https://wesomitsu.github.io/gta6-map/examples/ai-drive.html)

> Unofficial fan project, not affiliated with or endorsed by Rockstar Games or Take-Two. It contains no game files, art, or map data. The streets are real-world OpenStreetMap data, and the style is original.

## Use it on your site

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/maplibre-gl@5.6.0/dist/maplibre-gl.css">
<link rel="stylesheet" href="https://wesomitsu.github.io/gta6-map/src/neonmap.css">
<div id="map" style="height:500px"></div>

<script src="https://cdn.jsdelivr.net/npm/maplibre-gl@5.6.0/dist/maplibre-gl.js"></script>
<script src="https://wesomitsu.github.io/gta6-map/src/neonmap.js"></script>
<script>
  NeonMap.create('#map', {
    theme: 'sunset', // sunset, midnight or daybreak
    places: [
      { name: 'Ocean Loft', lng: -80.13, lat: 25.785, price: '$189', category: 'Apartment', url: '/stays/ocean-loft', cta: 'Book' },
      { name: 'Palm Suites', lng: -80.134, lat: 25.792, price: '$142', category: 'Hotel', url: '/stays/palm-suites', cta: 'Book' }
    ],
    onSelect: (place) => console.log(place.name)
  });
</script>
```

For production, copy `src/` to your own hosting so your site doesn't depend on this demo.

Good fits: accommodation and booking sites, restaurant guides, real estate, events, tours, and store locators.

| Method | What it does |
|---|---|
| `setPlaces(places)` | Replace the pins |
| `select(id)` | Open a place and move to it |
| `setTheme(name)` | Switch style |
| `flyTo([lng, lat], zoom)` | Fly to a location |
| `map` | The underlying MapLibre map |

## Connect your AI

The [sandbox](https://wesomitsu.github.io/gta6-map/examples/ai-drive.html) exposes a simple reset and step loop:

```js
const env = window.NeonDriveEnv;
let obs = env.reset(), done = false;
while (!done) {
  const action = yourModel(obs); // { steer: -1..1, throttle: -1..1 }
  const result = env.step(action);
  obs = result.observation;
  done = result.done;
}
```

Each observation has position, heading, speed, whether the car is on the road, seven road-distance rays, and the distance and angle to the goal. The reward favors progress and penalizes leaving the road.

From Python with Playwright:

```python
obs = page.evaluate("NeonDriveEnv.reset()")
result = page.evaluate("a => NeonDriveEnv.step(a)", {"steer": 0, "throttle": 0.5})
```

From another site, embed the page in an iframe and use `postMessage`:

```js
frame.contentWindow.postMessage({ type: 'neondrive', id: 1, method: 'step', action: { steer: 0, throttle: 0.5 } }, 'https://wesomitsu.github.io');
```

This is a simple 2D driving model for prototypes, demos, and learning. It has no traffic or realistic physics, and it must not be used to train or validate real vehicles.

## Credits and license

Code is [MIT](LICENSE). Built with [MapLibre GL JS](https://maplibre.org/). Tiles from [OpenFreeMap](https://openfreemap.org/), using [OpenMapTiles](https://openmaptiles.org/) and data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors. Keep the map attribution visible.
