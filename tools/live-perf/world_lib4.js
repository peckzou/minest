  /* ── 53.84 · Studio library 4 on the island: 🔨 Build gets the new buildings (signature · museums) and a ✨ Studio tab —
     outdoor decor, expo sets, indoor decor, museum stands & vitrines, expo facilities, museum decor, museum interiors.
     Objects are obj:<id> pieces (a picture, no plinth), expo sets and museum interiors dio:<id> (a big picture on its
     own base); indoors only what belongs inside is offered. Saved islands find their Studio pieces again on load. */
  function ensureDio(k) { if (!/^dio:/.test(k) || BUILD[k]) return; var id = k.slice(4), AS = window.MinestAssets3D, info = AS && AS.info(id);
    K[k] = { n: (info && info.name) || 'Studio set', decor: 1, model: 1, studio: 1, outside: /^diorama_expo_/.test(id) ? 1 : 0 };
    BUILD[k] = function (p, its, B) { var W = clamp(Math.round(4 * (p.s || 1)), 2, 9); B.img(0, W, 0, W, 0, W * .8, id); return { W: W, D: W }; }; }
  function lib4Name(k) {   // Studio's own name for a piece (ensureObj only knows the first 20 objects by name)
    var AS = window.MinestAssets3D, info = AS && AS.info(k.slice(4)); if (info && info.name && K[k] && K[k].studio) K[k].n = info.name;
    if (/^obj:OB-(30[1-9]|3[1-4]\d|350)$/.test(k) && K[k]) K[k].outside = 1;   // OB-301…350: outdoor decor
  }
  function lib4Kind(k) { if (/^obj:/.test(k)) { ensureObj(k); lib4Name(k); } else if (/^dio:/.test(k)) ensureDio(k); else if (/^bld:/.test(k)) ensureBld(k); return !!BUILD[k]; }
  (function () {   // outdoor Studio pieces stay outside like every other outdoor thing
    var o0 = isOutdoor; isOutdoor = function (k) { return !!(k && K[k] && K[k].outside) || o0(k); };
    var i0 = icon; icon = function (kind, sz) { if (/^(obj|dio):/.test(kind)) { lib4Kind(kind); return bldIcon(kind, sz); } return i0(kind, sz); };
    var r0 = render; render = function () { try { if (V && V.d) (V.d.pc || []).forEach(function (p) { if (!BUILD[p.k] && /^(obj|dio|bld):/.test(p.k)) lib4Kind(p.k); }); } catch (e) {} return r0.apply(null, arguments); };
    var t0 = pkTabs; pkTabs = function () {
      var T = t0(), AS = window.MinestAssets3D, L = AS && AS.lib4; if (!L) return T;
      var ins = indoor(), keep = function (ks) { return ks.filter(function (k) { return lib4Kind(k) && (!ins || !isOutdoor(k)); }); };
      var newB = {}; L.buildings.forEach(function (id) { newB['bld:' + id] = 1; });
      T.forEach(function (t) { if (t.id !== 'bld' || !t.groups) return; var out = [];
        t.groups.forEach(function (g) { if (g.n !== 'Studio buildings') { out.push(g); return; }
          out.push({ n: 'Studio buildings', kinds: g.kinds.filter(function (k) { return !newB[k]; }) });
          out.push({ n: 'Signature buildings', kinds: keep(L.buildings.filter(function (id) { return !/^BD-1(0[1-9]|1\d|20)$/.test(id); }).map(function (id) { return 'bld:' + id; })) });
          out.push({ n: 'Museums', kinds: keep(L.buildings.filter(function (id) { return /^BD-1(0[1-9]|1\d|20)$/.test(id); }).map(function (id) { return 'bld:' + id; })) }); });
        t.groups = out.filter(function (g) { return g.kinds.length; }); });
      var G = [['Outdoor decor', L.objects.outdoor, 'obj:'], ['Expo sets', L.expoSets, 'dio:'], ['Indoor decor', L.objects.indoor, 'obj:'], ['Museum stands & vitrines', L.objects.museum, 'obj:'],
        ['Expo facilities & racks', L.objects.expo, 'obj:'], ['Museum decor & artifacts', L.objects.decor, 'obj:'], ['Museum interiors', L.museumRooms, 'dio:']]
        .map(function (g) { return { n: g[0], kinds: keep(g[1].map(function (id) { return g[2] + id; })) }; }).filter(function (g) { return g.kinds.length; });
      if (G.length) { if (ins) G.sort(function (a, b) { return /Indoor|Museum/.test(b.n) - /Indoor|Museum/.test(a.n); }); T.splice(Math.min(T.length, ins ? 1 : 2), 0, { id: 'studio', ic: '✨', n: 'Studio', groups: G }); }
      return T;
    };
  })();

