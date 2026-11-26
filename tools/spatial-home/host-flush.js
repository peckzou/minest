  function hostFlush(h) {
    /* 2026-11-26 · Spatial Home sync repair (tools/spatial-home/patch_home_sync.py): on Minest's own page the keys go up
       with Minest's own cloud save (the sync transport, compressed, merged per key with what the cloud has). Before,
       they were written straight to the doc as a plain `knowledge` field with the Firestore SDK: on the iPhone and the
       iPad that write often never arrived, and the next full save dropped keys only that plain field had. A key leaves
       the outbox once Minest's save has taken everything up to the moment it was handed over. */
    if (!pending()) return;
    var x = h.K._cloud().x || {}, newest = 0;
    Object.keys(outbox).forEach(function (k) { if (!x[k]) delete outbox[k]; else newest = Math.max(newest, outbox[k] || 0); });
    var un = hostUnsynced(h);
    if (hostAsk && un === false) Object.keys(outbox).forEach(function (k) { if ((outbox[k] || 0) <= hostAsk) delete outbox[k]; });
    if (pending() && (!hostAsk || newest > hostAsk || un === false || un === null) && !(root.navigator && root.navigator.onLine === false)) {
      hostAsk = Math.max(Date.now(), newest);
      try { h.w.dispatchEvent(new h.w.CustomEvent('minest:cloud-dirty', { detail: { immediate: true, domain: 'spatialHome' } })); } catch (e) {}
      if (un === null) Object.keys(outbox).forEach(function (k) { if ((outbox[k] || 0) <= hostAsk) delete outbox[k]; });   // an older Minest: nothing to wait on
      clearTimeout(hostT); hostT = setTimeout(flush, 4000);
    }
    if (!pending()) { st.synced = Date.now(); st.error = ''; }
    outSave(); emit(null);
  }
  var hostAsk = 0, hostT = 0;
  /* Minest's own record of edits the cloud has not taken yet (its dirtyAt > ackAt); null when it has none */
  function hostUnsynced(h) {
    try {
      var S = h.w.MinestDurableStorage || h.w.localStorage, d = Number(S.getItem('minest.cloud.dirtyAt')), a = Number(S.getItem('minest.cloud.ackAt'));
      if (!d && !a && S.getItem('minest.cloud.dirtyAt') == null) return null;
      return (d || 0) > (a || 0);
    } catch (e) { return null; }
  }
