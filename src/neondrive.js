/*! NeonDrive | MIT License | A small driving environment for AI agents on NeonMap. */
(function (root) {
  'use strict';

  var ROADS = ['road-small', 'road-mid', 'road-big'];
  var RAYS = [-90, -45, -20, 0, 20, 45, 90];
  var RANGE = 60;
  var STEP = 2;
  var DT = 0.1;
  var R = 6371000;

  function rad(d) { return d * Math.PI / 180; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, Number(v) || 0)); }
  function move(lng, lat, heading, meters) {
    var h = rad(heading);
    return [
      lng + (meters * Math.sin(h)) / (R * Math.cos(rad(lat))) * 180 / Math.PI,
      lat + (meters * Math.cos(h)) / R * 180 / Math.PI
    ];
  }
  function distance(a, b) {
    var x = rad(b[0] - a[0]) * Math.cos(rad((a[1] + b[1]) / 2));
    var y = rad(b[1] - a[1]);
    return Math.sqrt(x * x + y * y) * R;
  }
  function bearing(a, b) {
    var x = rad(b[0] - a[0]) * Math.cos(rad((a[1] + b[1]) / 2));
    return (Math.atan2(x, rad(b[1] - a[1])) * 180 / Math.PI + 360) % 360;
  }
  function angle(d) { return ((d + 540) % 360) - 180; }

  function create(neon, options) {
    var opts = Object.assign({ start: [-80.13281, 25.781], heading: 2, goal: [-80.13187, 25.78825], maxSteps: 3000, maxOffRoad: 20 }, options || {});
    var map = neon.map;
    var state;
    var car = document.createElement('div');
    car.className = 'nd-car';
    car.setAttribute('aria-label', 'AI car');
    var goal = document.createElement('div');
    goal.className = 'nd-goal';
    var carMarker = new root.maplibregl.Marker({ element: car, rotationAlignment: 'map', pitchAlignment: 'map' }).setLngLat(opts.start).addTo(map);
    new root.maplibregl.Marker({ element: goal }).setLngLat(opts.goal).addTo(map);

    function onRoad(point) {
      var p = map.project(point);
      return map.queryRenderedFeatures([[p.x - 1, p.y - 1], [p.x + 1, p.y + 1]], { layers: ROADS }).length > 0;
    }
    function ray(offset) {
      for (var m = STEP; m <= RANGE; m += STEP) {
        if (!onRoad(move(state.lng, state.lat, state.heading + offset, m))) return m - STEP;
      }
      return RANGE;
    }
    function follow() {
      map.jumpTo({ center: [state.lng, state.lat], zoom: 17, pitch: 0, bearing: state.heading });
      carMarker.setLngLat([state.lng, state.lat]).setRotation(state.heading);
    }
    function observe() {
      var here = [state.lng, state.lat];
      return {
        position: { lng: state.lng, lat: state.lat },
        headingDeg: state.heading,
        speedMps: state.speed,
        onRoad: onRoad(here),
        rayAnglesDeg: RAYS.slice(),
        rayMeters: RAYS.map(ray),
        goalDistanceM: distance(here, opts.goal),
        goalAngleDeg: angle(bearing(here, opts.goal) - state.heading)
      };
    }
    function reset() {
      state = { lng: opts.start[0], lat: opts.start[1], heading: opts.heading, speed: 0, steps: 0, offRoad: 0, total: 0, done: false };
      follow();
      return observe();
    }
    function step(action) {
      if (!state) reset();
      if (state.done) throw new Error('Episode finished. Call reset().');
      var a = action || {};
      var before = distance([state.lng, state.lat], opts.goal);
      var throttle = clamp(a.throttle, -1, 1);
      var steer = clamp(a.steer, -1, 1);
      state.speed = clamp(state.speed + throttle * 4 * DT - state.speed * 0.08 * DT, -3, 14);
      state.heading = (state.heading + steer * 55 * DT * Math.min(1, Math.abs(state.speed) / 3) * (state.speed < 0 ? -1 : 1) + 360) % 360;
      var next = move(state.lng, state.lat, state.heading, state.speed * DT);
      state.lng = next[0];
      state.lat = next[1];
      state.steps += 1;
      follow();
      var obs = observe();
      state.offRoad = obs.onRoad ? 0 : state.offRoad + 1;
      var reached = obs.goalDistanceM < 15;
      var crashed = state.offRoad >= opts.maxOffRoad;
      var timedOut = state.steps >= opts.maxSteps;
      var reward = (before - obs.goalDistanceM) * 0.1 - 0.01 - (obs.onRoad ? 0 : 0.2) + (reached ? 10 : 0) - (crashed ? 5 : 0);
      state.total += reward;
      state.done = reached || crashed || timedOut;
      return { observation: obs, reward: reward, done: state.done, info: { steps: state.steps, totalReward: state.total, reached: reached, crashed: crashed, timedOut: timedOut } };
    }
    function baseline(o) {
      var r = o.rayMeters.map(function (m) { return Math.min(m, 16); });
      var center = (r[4] - r[2]) / 12 + (r[5] - r[1]) / 24 + (r[6] - r[0]) / 60;
      return { steer: clamp(center + o.goalAngleDeg / 90, -1, 1), throttle: o.speedMps < 4 ? 0.6 : 0 };
    }

    var env = { reset: reset, step: step, baseline: baseline, spec: { actions: { steer: [-1, 1], throttle: [-1, 1] }, stepSeconds: DT, maxSteps: opts.maxSteps } };

    root.addEventListener('message', function (event) {
      var m = event.data;
      if (!m || m.type !== 'neondrive' || !event.source || !['reset', 'step', 'spec'].includes(m.method)) return;
      var reply = { type: 'neondrive:result', id: m.id };
      try { reply.result = m.method === 'spec' ? env.spec : env[m.method](m.action); }
      catch (e) { reply.error = e.message; }
      event.source.postMessage(reply, event.origin === 'null' ? '*' : event.origin);
    });
    return env;
  }

  root.NeonDrive = { create: create };
})(window);
