/* Workspace names remain compatible with v1. Cloud records also retain deletion
   timestamps, so an older/offline device cannot resurrect a removed empty folder. */
(function () {
  'use strict';
  var namesKey = 'minest.customWorkspaces.v1';
  var recordsKey = 'minest.workspaceGroups.v2';
  var server = null;
  var memory = [];
  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (_) { return fallback; }
  }
  function valid(rows) {
    return Array.isArray(rows) ? rows.filter(function (r) {
      return r && typeof r.name === 'string' && r.name.trim() && Number.isSafeInteger(r.at) && r.at > 0;
    }).map(function (r) { return { name: r.name, at: r.at, deleted: !!r.deleted }; }) : [];
  }
  function combine(a, b) {
    var map = new Map();
    valid(a).concat(valid(b)).forEach(function (r) {
      var old = map.get(r.name);
      if (!old || r.at > old.at || (r.at === old.at && r.deleted)) map.set(r.name, r);
    });
    return Array.from(map.values()).sort(function (a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; });
  }
  function snapshot() {
    memory = combine(memory, read(recordsKey, []));
    // Recover legacy folders without overriding any versioned deletion.
    var legacy = read(namesKey, []);
    if (Array.isArray(legacy)) memory = combine(memory, legacy.filter(function (n) {
      return typeof n === 'string' && n.trim();
    }).map(function (name) { return { name: name, at: 1, deleted: false }; }));
    return memory.map(function (r) { return Object.assign({}, r); });
  }
  function names(rows) { return rows.filter(function (r) { return !r.deleted; }).map(function (r) { return r.name; }); }
  function persist(rows) {
    // Do not silently swallow Safari quota/private-storage failures on user edits.
    localStorage.setItem(recordsKey, JSON.stringify(rows));
    localStorage.setItem(namesKey, JSON.stringify(names(rows)));
    memory = rows;
  }
  function notify() { window.dispatchEvent(new Event('minest:workspaces-changed')); }
  function pending() {
    var rows = snapshot();
    if (!server) return rows.length > 0;
    var remote = new Map(server.map(function (r) { return [r.name, r]; }));
    return rows.some(function (r) { var s = remote.get(r.name); return !s || r.at > s.at || (r.at === s.at && r.deleted !== s.deleted); });
  }
  window.MinestWorkspaceCloud = {
    snapshot: snapshot,
    names: function () { return names(snapshot()); },
    pending: pending,
    resetServer: function () { server = null; },
    save: function (list) {
      var rows = snapshot(), wanted = new Set(list.filter(function (n) { return typeof n === 'string' && n.trim(); }));
      var at = Math.max(Date.now(), rows.reduce(function (n, r) { return Math.max(n, r.at + 1); }, 1));
      var known = new Set();
      rows = rows.map(function (r) {
        known.add(r.name);
        var deleted = !wanted.has(r.name);
        return r.deleted === deleted ? r : { name: r.name, at: at, deleted: deleted };
      });
      wanted.forEach(function (name) { if (!known.has(name)) rows.push({ name: name, at: at, deleted: false }); });
      persist(combine([], rows));
      notify();
    },
    merge: function (remote, confirmed) {
      var before = snapshot();
      if (confirmed) server = valid(remote); // cache snapshots never acknowledge uploads
      var merged = combine(before, remote);
      if (JSON.stringify(before) !== JSON.stringify(merged)) {
        persist(merged);
        notify();
      }
    }
  };
  window.addEventListener('storage', function (event) {
    if (event.key === namesKey || event.key === recordsKey) notify();
  });
}());
