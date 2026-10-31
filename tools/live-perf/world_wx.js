/* Minest Weather — My World's sky follows the real one: the local weather (Open-Meteo, no key) and the time of day from
   the local sunrise / sunset. window.MinestWX
   - state() → { phase: dawn|day|dusk|night, light 0–1, cond: clear|cloudy|fog|rain|storm|snow, rain 0–1, snow 0–1,
                 wind 0–1, cloud 0–1, temp °C, place, mode, live }
   - on(fn) → off()      called whenever it changes (the 3D walk re-lights its scene)
   - mode(m) / cycle()    auto (live) · sunny · dusk · night · rain · storm · snow · windy · fog   (remembered)
   Where: the device's location when it allows (rounded to ~10 km, asked only once My World opens), otherwise a city
   for the phone's time zone. Weather is fetched at most every 20 minutes; nothing else leaves the device.
   On the island (2D) it lays a tint (dusk / night / overcast), rain, snow and lightning over the scene, with a chip
   (bottom left) to switch the weather, and plays the outdoor sound (breeze, birds, rain, crickets, thunder). */
(function () {
  if (window.MinestWX) return;
  var KEY = 'minest.wx', LOC = 'minest.wx.loc', MODE = 'minest.wx.mode', subs = [], S = null, data = null, asked = false, fetching = false;
  var MODES = [['auto', '📍', 'Live'], ['sunny', '☀️', 'Sunny'], ['dusk', '🌇', 'Dusk'], ['night', '🌙', 'Night'], ['rain', '🌧', 'Rain'], ['storm', '⛈', 'Storm'], ['snow', '❄️', 'Snow'], ['windy', '🌬', 'Windy'], ['fog', '🌫', 'Fog']];
  var TZ = { 'America/Chicago': [32.8, -96.8, 'Dallas'], 'America/New_York': [40.7, -74, 'New York'], 'America/Los_Angeles': [34.1, -118.2, 'Los Angeles'], 'America/Denver': [39.7, -105, 'Denver'],
    'America/Phoenix': [33.4, -112.1, 'Phoenix'], 'America/Toronto': [43.7, -79.4, 'Toronto'], 'America/Vancouver': [49.3, -123.1, 'Vancouver'], 'Asia/Shanghai': [31.2, 121.5, 'Shanghai'],
    'Asia/Taipei': [25, 121.5, 'Taipei'], 'Asia/Hong_Kong': [22.3, 114.2, 'Hong Kong'], 'Asia/Tokyo': [35.7, 139.7, 'Tokyo'], 'Asia/Seoul': [37.6, 127, 'Seoul'], 'Asia/Singapore': [1.35, 103.8, 'Singapore'],
    'Europe/London': [51.5, -.1, 'London'], 'Europe/Paris': [48.9, 2.35, 'Paris'], 'Europe/Berlin': [52.5, 13.4, 'Berlin'], 'Australia/Sydney': [-33.9, 151.2, 'Sydney'] };
  function get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function mode() { return get(MODE) || 'auto'; }
  function loc() {
    var l = get(LOC); if (l && l.la != null) return l;
    var tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    var t = TZ[tz] || TZ['America/Chicago']; return { la: t[0], lo: t[1], place: t[2], guess: true };
  }
  function askLoc() {   // once: the device's own place (rounded), when it lets us
    if (asked || !navigator.geolocation) return; asked = true; var l = get(LOC); if (l && !l.guess && Date.now() - (l.t || 0) < 6 * 3600e3) return;
    try { navigator.geolocation.getCurrentPosition(function (p) { var la = Math.round(p.coords.latitude * 10) / 10, lo = Math.round(p.coords.longitude * 10) / 10, o = get(LOC);
      put(LOC, { la: la, lo: lo, place: (o && Math.abs(o.la - la) < .2 && Math.abs(o.lo - lo) < .2 && o.place) || 'Here', t: Date.now() }); data = null; put(KEY, null); refresh(); }, function () {}, { timeout: 9000, maximumAge: 3 * 3600e3 }); } catch (e) {}
  }
  function refresh() {
    var c = get(KEY), l = loc(); if (c && Date.now() - c.t < 20 * 60e3 && Math.abs(c.la - l.la) < .05 && Math.abs(c.lo - l.lo) < .05) { data = c; return compute(); }
    if (fetching || !window.fetch) return compute(); fetching = true;
    fetch('https://api.open-meteo.com/v1/forecast?latitude=' + l.la + '&longitude=' + l.lo + '&current=temperature_2m,weather_code,wind_speed_10m,cloud_cover,is_day&daily=sunrise,sunset&timezone=auto&forecast_days=1&wind_speed_unit=ms')
      .then(function (r) { return r.json(); }).then(function (j) { fetching = false; if (!j || !j.current) return compute(); data = { t: Date.now(), la: l.la, lo: l.lo, cur: j.current, off: j.utc_offset_seconds || 0, rise: j.daily && j.daily.sunrise && j.daily.sunrise[0], set: j.daily && j.daily.sunset && j.daily.sunset[0] }; put(KEY, data); compute(); })
      .catch(function () { fetching = false; compute(); });
  }
  function localEpoch(s, off) { var m = /^(\d+)-(\d+)-(\d+)T(\d+):(\d+)/.exec(s || ''); return m ? Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5]) - off * 1000 : null; }
  function compute() {
    var now = Date.now(), d = data, rise = d && localEpoch(d.rise, d.off), set = d && localEpoch(d.set, d.off);
    if (!rise || !set || Math.abs(now - rise) > 36 * 3600e3) { var t0 = new Date(); t0.setHours(6, 45, 0, 0); rise = +t0; t0.setHours(18, 30, 0, 0); set = +t0; }
    var M = 60e3, phase = now < rise - 30 * M || now > set + 45 * M ? 'night' : now < rise + 45 * M ? 'dawn' : now > set - 60 * M ? 'dusk' : 'day';
    var code = d && d.cur ? d.cur.weather_code : 1, cloud = d && d.cur ? (d.cur.cloud_cover || 0) / 100 : .2, wind = d && d.cur ? Math.min(1, (d.cur.wind_speed_10m || 0) / 12) : .2;
    var cond = code >= 95 ? 'storm' : (code >= 71 && code <= 77) || code === 85 || code === 86 ? 'snow' : (code >= 51 && code <= 67) || (code >= 80 && code <= 82) ? 'rain' : code === 45 || code === 48 ? 'fog' : code === 3 ? 'cloudy' : 'clear';
    var rain = cond === 'storm' ? 1 : cond === 'rain' ? (code === 65 || code === 82 ? 1 : code >= 61 || code >= 80 ? .65 : .35) : 0, snow = cond === 'snow' ? (code === 75 || code === 86 ? 1 : .6) : 0;
    var st = { phase: phase, cond: cond, rain: rain, snow: snow, wind: wind, cloud: Math.max(cloud, rain ? .8 : 0), temp: d && d.cur ? Math.round(d.cur.temperature_2m) : null, place: loc().place, live: !!d, mode: mode() };
    var m = st.mode;   // a chosen weather wins over the live one
    if (m === 'sunny') Object.assign(st, { phase: 'day', cond: 'clear', rain: 0, snow: 0, cloud: .1 }); else if (m === 'dusk') Object.assign(st, { phase: 'dusk' }); else if (m === 'night') Object.assign(st, { phase: 'night' });
    else if (m === 'rain') Object.assign(st, { cond: 'rain', rain: .7, snow: 0, cloud: .9 }); else if (m === 'storm') Object.assign(st, { cond: 'storm', rain: 1, snow: 0, cloud: 1, wind: Math.max(st.wind, .75) });
    else if (m === 'snow') Object.assign(st, { cond: 'snow', snow: .8, rain: 0, cloud: .8 }); else if (m === 'windy') Object.assign(st, { wind: 1, cond: st.cond === 'storm' ? 'cloudy' : st.cond, rain: 0 }); else if (m === 'fog') Object.assign(st, { cond: 'fog', rain: 0, snow: 0, cloud: .9 });
    st.light = { day: 1, dawn: .62, dusk: .55, night: .14 }[st.phase] * (1 - st.cloud * .3);
    var key = JSON.stringify(st); if (S && JSON.stringify(S) === key) return S; S = st; subs.slice().forEach(function (f) { try { f(S); } catch (e) {} }); return S;
  }
  function icon(s) { s = s || S || {}; return s.cond === 'storm' ? '⛈' : s.cond === 'snow' ? '❄️' : s.cond === 'rain' ? '🌧' : s.cond === 'fog' ? '🌫' : s.phase === 'night' ? '🌙' : s.phase === 'dusk' ? '🌇' : s.phase === 'dawn' ? '🌅' : s.cond === 'cloudy' ? '☁️' : s.wind > .7 ? '🌬' : '☀️'; }
  setInterval(function () { if (subs.length || document.querySelector('.mn-dsp')) refresh(); }, 60e3);

  // ---------------------------------------------------------------- the island (2D): tint, rain, snow, lightning, the chip, the sound
  var amb = null;
  function paint(st, host) {
    var o = host.querySelector(':scope > .mn-wx'); if (!o) { host.insertAdjacentHTML('beforeend', '<div class="mn-wx"><i class="t"></i><i class="r"></i><i class="s"></i><i class="f"></i></div><button type="button" class="mn-wx-chip"></button>'); o = host.querySelector(':scope > .mn-wx');
      host.querySelector(':scope > .mn-wx-chip').addEventListener('click', function (e) { e.stopPropagation(); var n = MinestWX.cycle(); if (window.MinestSfx) MinestSfx.play('click'); }); }
    var cls = 'mn-wx ph-' + st.phase + ' c-' + st.cond + (st.rain > .8 ? ' heavy' : '') + (st.wind > .6 ? ' windy' : ''); if (o.className !== cls) o.className = cls;
    var chip = host.querySelector(':scope > .mn-wx-chip'), M = MODES.filter(function (x) { return x[0] === st.mode; })[0] || MODES[0], txt = icon(st) + (st.temp != null && st.mode === 'auto' ? ' ' + st.temp + '°' : '') + ' · ' + (st.mode === 'auto' ? st.place : M[2]);
    if (chip.textContent !== txt) chip.textContent = txt; chip.title = 'Weather: ' + M[2] + ' — tap to change';
  }
  function sound(st, on) {
    if (!window.MinestSfx) return; if (!on) { if (amb) { amb.stop(); amb = null; } return; }
    if (!amb) amb = MinestSfx.loop('outdoor'); amb.set(.45, st);
  }
  setInterval(function () {
    var host = document.querySelector('.mn-dsp .mn-dsp-stage'), walking = !!document.querySelector('.mn-dsp .mn-walk');
    if (!host) { sound(null, false); return; } askLoc(); var st = S || refresh() || S; if (!st) return;
    paint(st, host); sound(st, !walking && !document.hidden);   // the walk plays its own
  }, 1000);

  var flashers = [];   // lightning: the island's white flash, and whoever else lights up (the 3D walk)
  window.MinestWXFlash = function () { var f = document.querySelector('.mn-dsp .mn-wx .f'); if (f && f.animate) f.animate([{ opacity: .85 }, { opacity: 0 }, { opacity: .55 }, { opacity: 0 }], { duration: 650 }); flashers.forEach(function (fn) { try { fn(); } catch (e) {} }); };
  window.MinestWX = {
    onFlash: function (f) { flashers.push(f); return function () { flashers = flashers.filter(function (x) { return x !== f; }); }; },
    state: function () { return S || refresh() || S; },
    on: function (f) { subs.push(f); askLoc(); if (!S) refresh(); return function () { subs = subs.filter(function (x) { return x !== f; }); }; },
    mode: function (m) { put(MODE, m || 'auto'); return compute(); },
    cycle: function () { var i = MODES.map(function (x) { return x[0]; }).indexOf(mode()); var m = MODES[(i + 1) % MODES.length]; put(MODE, m[0]); compute(); if (typeof window.minestToast === 'function') window.minestToast(m[1] + ' ' + m[2]); return m[0]; },
    modes: MODES, icon: icon, refresh: refresh
  };
})();
