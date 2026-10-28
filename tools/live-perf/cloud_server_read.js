/* Read-only fallback for a Firestore server read masked by local pending writes.
   Uses the current Firebase user and the same security rules; never writes via REST. */
function minestCloudServerRead(docRef, user, projectId) {
  function decode(v) {
    if ('nullValue' in v) return null;
    if ('booleanValue' in v) return v.booleanValue;
    if ('integerValue' in v) return Number(v.integerValue);
    if ('doubleValue' in v) return v.doubleValue;
    if ('stringValue' in v) return v.stringValue;
    if ('timestampValue' in v) return v.timestampValue;
    if ('bytesValue' in v) return v.bytesValue;
    if ('referenceValue' in v) return v.referenceValue;
    if ('geoPointValue' in v) return v.geoPointValue;
    if ('arrayValue' in v) return (v.arrayValue.values || []).map(decode);
    if ('mapValue' in v) return fields(v.mapValue.fields || {});
    throw new Error('Unsupported cloud field type');
  }
  function fields(values) {
    var out = {}; Object.keys(values).forEach(function(k) { Object.defineProperty(out, k, {value:decode(values[k]), enumerable:true, configurable:true, writable:true}); }); return out;
  }
  function direct() {
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = controller ? setTimeout(function() { controller.abort(); }, 12000) : null;
    return minestCloudWait(user.getIdToken().then(function(token) {
      var url = 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(projectId) + '/databases/(default)/documents/users/' + encodeURIComponent(user.uid) + '/focusboard/data';
      return fetch(url, {method:'GET', headers:{Authorization:'Bearer ' + token}, cache:'no-store', signal:controller ? controller.signal : undefined});
    }).then(function(response) {
      if (response.status === 404) { var missing = new Error('Cloud document not found. Local data is retained.'); missing.code='sync/server-document-missing'; throw missing; }
      if (!response.ok) { var err = new Error('Cloud server returned HTTP ' + response.status + '. Local changes are retained.'); err.code='sync/http-' + response.status; throw err; }
      return response.json();
    }).then(function(body) {
      var data = fields(body.fields || {});
      return {exists:true, metadata:{fromCache:false, hasPendingWrites:false}, data:function() { return data; }};
    }), 14000).finally(function() { if (timer) clearTimeout(timer); });
  }
  return minestCloudWait(docRef.get({source:'server'}), 8000).then(function(doc) {
    if (doc.metadata && (doc.metadata.fromCache || doc.metadata.hasPendingWrites)) return direct();
    return doc;
  }, function(error) {
    if (error && /permission-denied|unauthenticated/.test(error.code || '')) throw error;
    return direct();
  });
}
