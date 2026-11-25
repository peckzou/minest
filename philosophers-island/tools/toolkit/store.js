/* Minest · Cognitive Toolkit — the shared knowledge store (window.MinestKS)
   One store for all five cards, so nothing is duplicated when the user moves between them.
     ko:<id>   KnowledgeObject  { id, title, original_input, content_type, root_concept, placement, concept_ids[],
                                  framework_instance_ids[], model_run_ids[], lab_run_ids[], sources[], notes[], created_at, updated_at, version }
     cc:<id>   Concept          { id, labels{en,zh}, aliases[], kind, definition, broader_ids[], origin, ref, review, provenance, created_at }
     kr:<id>   Relation         { id, from, to, type, note, provenance, source_ref, review, ko, created_at, updated_at }
     fwi:<id>  FrameworkInstance{ id, ko, template_id, title, nodes[{id, label, concept_id, parent, order, section, refs[]}], view, updated_at }
     mr:<id>   ModelRun         { id, ko, model_id, inputs, result, at, updated_at }
     mi:run:<id>                (written by MinestMicro — linked to the object by lab_run_ids)
   Node refs used by relations: 'cc:<id>' | 'ko:<id>' | 'note:<ko>:<n>' | 'mr:<id>' | 'mi:<id>'.
   provenance: user · rule (local engine suggestion) · ai-suggested · ai-accepted · library (Minest content).
   review: 'pending' marks Minest-written philosophy content that has not had a content review yet.
   Backend: anything with get / set / keys (MinestKnowledge's shape). Every write fires 'change' { kind, id, ko }. */
(function (root) {
  'use strict';
  var REL = [
    { id: 'belongs-to', label: 'Belongs to', inverse: 'Contains', color: '#6b4ce6' },
    { id: 'related', label: 'Related to', inverse: 'Related to', color: '#8c87a8', sym: true },
    { id: 'supports', label: 'Supports', inverse: 'Supported by', color: '#1f9d55' },
    { id: 'refutes', label: 'Refutes', inverse: 'Refuted by', color: '#d1435b' },
    { id: 'influences', label: 'Influences', inverse: 'Influenced by', color: '#f08c3a' },
    { id: 'applies-to', label: 'Applies to', inverse: 'Applied by', color: '#00a6a6' },
    { id: 'illustrates', label: 'Illustrates', inverse: 'Illustrated by', color: '#c9a227' },
    { id: 'leads-to', label: 'Leads to (my judgment)', inverse: 'Follows from (my judgment)', color: '#5e9cff' }
  ];
  var RELBY = {}; REL.forEach(function (r) { RELBY[r.id] = r; });
  var KINDS = { concept: 'Concept', philosopher: 'Philosopher', theory: 'Theory', question: 'Question', case: 'Case', note: 'Note', 'model-run': 'Model analysis', 'lab-run': 'Experiment' };
  var PROV = { user: 'You', rule: 'Suggested (local rules)', 'ai-suggested': 'Suggested by AI', 'ai-accepted': 'AI suggestion you accepted', library: 'Minest library' };
  // what kind of content a record is — kept apart so a quotation, a scholar's reading, AI output and your own view never blur
  var CONTENT = { quote: 'Quotation (with source)', interpretation: 'Scholarly interpretation', summary: 'Minest summary', ai: 'AI / engine suggestion', view: 'My view', evidence: 'Evidence', question: 'My question' };
  function contentKind(rec) { if (!rec) return null; if (rec.content_kind) return rec.content_kind; return { user: 'view', library: 'summary', rule: 'ai', 'ai-suggested': 'ai', 'ai-accepted': 'ai' }[rec.provenance] || null; }

  function rid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function norm(s) { return String(s || '').toLowerCase().replace(/[\s　·,.;:!?？！。，、"“”'’]+/g, ' ').trim(); }
  function now() { return Date.now(); }

  function create(back) {
    var subs = [];
    function emit(kind, id, ko) { var e = { kind: kind, id: id, ko: ko }; subs.slice().forEach(function (f) { try { f(e); } catch (x) { if (root.console) console.error(x); } }); }
    function get(k) { return back.get(k); }
    function put(k, v, kind, ko) { back.set(k, v); emit(kind, k, ko); return v; }
    function all(p) { return back.keys(p).map(function (k) { return back.get(k); }).filter(Boolean); }

    // ---------------------------------------------------------------- knowledge objects
    function createObject(input, o) {
      o = o || {};
      var id = rid(), t = now();
      var ko = { id: id, title: o.title || String(input || '').trim().slice(0, 120), original_input: String(input || ''), content_type: o.content_type || null,
        root_concept: null, placement: null, concept_ids: [], framework_instance_ids: [], model_run_ids: [], lab_run_ids: [], sources: [], notes: [],
        created_at: t, updated_at: t, version: 1 };
      back.set('ko:' + id, ko);
      if (o.topic) { var c = concept(o.topic, { kind: 'concept', provenance: o.topicProvenance || 'rule' }); ko = get('ko:' + id); ko.root_concept = c; if (ko.concept_ids.indexOf(c) < 0) ko.concept_ids.push(c); back.set('ko:' + id, ko); }
      emit('ko', id, id);
      return get('ko:' + id);
    }
    function object(id) { return get('ko:' + id); }
    function objects() { return all('ko:').sort(function (a, b) { return b.updated_at - a.updated_at; }); }
    function updateObject(id, patch) {
      var ko = object(id); if (!ko) return null;
      Object.keys(patch).forEach(function (k) { ko[k] = patch[k]; });
      ko.updated_at = now(); ko.version = (ko.version || 1) + 1;
      return put('ko:' + id, ko, 'ko', id);
    }
    function attach(koId, field, value) {
      var ko = object(koId); if (!ko || ko[field].indexOf(value) >= 0) return;
      var p = {}; p[field] = ko[field].concat([value]); updateObject(koId, p);
    }
    function deleteObject(id) {
      var ko = object(id); if (!ko) return;
      ko.framework_instance_ids.forEach(function (f) { back.set('fwi:' + f, null); });
      ko.model_run_ids.forEach(function (m) { back.set('mr:' + m, null); });
      relations({ ko: id }).forEach(function (r) { back.set('kr:' + r.id, null); });
      back.set('ko:' + id, null); emit('ko', id, id);
    }

    // ---------------------------------------------------------------- concepts (one record per concept, found by label / alias)
    function findConcept(label) {
      var n = norm(label); if (!n) return null;
      return all('cc:').filter(function (c) {
        return [c.labels.en, c.labels.zh].concat(c.aliases || []).some(function (x) { return x && norm(x) === n; });
      })[0] || null;
    }
    function concept(label, o) {
      o = o || {};
      var labels = typeof label === 'object' ? label : (/[㐀-鿿]/.test(label) ? { zh: label } : { en: label });
      var hit = findConcept(labels.en) || findConcept(labels.zh) || (o.ref && all('cc:').filter(function (c) { return c.ref === o.ref; })[0]);
      if (hit) {
        var changed = false;
        ['en', 'zh'].forEach(function (l) { if (labels[l] && !hit.labels[l]) { hit.labels[l] = labels[l]; changed = true; } });
        if (o.kind && hit.kind === 'concept' && o.kind !== 'concept') { hit.kind = o.kind; changed = true; }
        if (changed) put('cc:' + hit.id, hit, 'cc');
        return hit.id;
      }
      var id = rid(), c = { id: id, labels: { en: labels.en || '', zh: labels.zh || '' }, aliases: o.aliases || [], kind: o.kind || 'concept', definition: o.definition || '',
        broader_ids: [], origin: o.origin || (o.provenance === 'user' ? 'user' : 'library'), ref: o.ref || null, review: o.review || null, provenance: o.provenance || 'user', created_at: now() };
      put('cc:' + id, c, 'cc');
      return id;
    }
    function getConcept(id) { return get('cc:' + id); }
    function label(c) {   // in Chinese mode a concept shows its Chinese name when it has one
      if (typeof c === 'string') c = getConcept(c); if (!c) return '—';
      var zh = root.MinestI18n && root.MinestI18n.lang() === 'zh';
      return (zh ? c.labels.zh || c.labels.en : c.labels.en || c.labels.zh) || 'Untitled';
    }
    function updateConcept(id, patch) { var c = getConcept(id); if (!c) return null; Object.keys(patch).forEach(function (k) { c[k] = patch[k]; }); return put('cc:' + id, c, 'cc'); }
    function addToObject(koId, conceptId) { var ko = object(koId); if (ko && ko.concept_ids.indexOf(conceptId) < 0) { ko.concept_ids.push(conceptId); updateObject(koId, { concept_ids: ko.concept_ids }); } }
    function conceptsOf(koId) { var ko = object(koId); return ko ? ko.concept_ids.map(getConcept).filter(Boolean) : []; }
    // a concept stays in the object while anything in the object still uses it
    function maybeDrop(koId, conceptId) {
      var ko = object(koId); if (!ko || ko.root_concept === conceptId) return;
      var used = relations({ ko: koId }).some(function (r) { return r.from === 'cc:' + conceptId || r.to === 'cc:' + conceptId; }) ||
        ko.framework_instance_ids.some(function (f) { var fi = get('fwi:' + f); return fi && fi.nodes.some(function (n) { return n.concept_id === conceptId; }); });
      if (!used) updateObject(koId, { concept_ids: ko.concept_ids.filter(function (x) { return x !== conceptId; }) });
    }

    // ---------------------------------------------------------------- relations (typed, with provenance)
    function relate(from, to, type, o) {
      o = o || {};
      if (type === 'contains') { var t = from; from = to; to = t; type = 'belongs-to'; }
      if (!RELBY[type]) throw new Error('Unknown relation type ' + type);
      if (from === to) return null;
      var same = all('kr:').filter(function (r) { return r.type === type && ((r.from === from && r.to === to) || (RELBY[type].sym && r.from === to && r.to === from)); })[0];
      if (same) { if (o.note) same.note = o.note; if (o.provenance === 'user' && same.provenance !== 'user') same.provenance = 'user'; same.updated_at = now(); return put('kr:' + same.id, same, 'kr', same.ko); }
      var id = rid(), r = { id: id, from: from, to: to, type: type, note: o.note || '', provenance: o.provenance || 'user', source_ref: o.source_ref || null, review: o.review || null, ko: o.ko || null, created_at: now(), updated_at: now() };
      return put('kr:' + id, r, 'kr', r.ko);
    }
    function relations(f) {
      f = f || {};
      return all('kr:').filter(function (r) {
        if (f.ko && r.ko !== f.ko) return false;
        if (f.node && r.from !== f.node && r.to !== f.node) return false;
        if (f.source && (r.source_ref || '').indexOf(f.source) !== 0) return false;
        return true;
      });
    }
    function updateRelation(id, patch) { var r = get('kr:' + id); if (!r) return null; Object.keys(patch).forEach(function (k) { r[k] = patch[k]; }); if (patch.provenance == null && r.provenance !== 'user') r.provenance = 'user'; r.updated_at = now(); return put('kr:' + id, r, 'kr', r.ko); }
    function unrelate(id) { var r = get('kr:' + id); if (!r) return; back.set('kr:' + id, null); emit('kr', id, r.ko); }

    // ---------------------------------------------------------------- notes (the user's understanding, from any card)
    function addNote(koId, text, o) {
      o = o || {}; var ko = object(koId); if (!ko || !String(text || '').trim()) return null;
      var n = { id: rid(), text: String(text).trim(), from: o.from || 'user', ref: o.ref || null, provenance: 'user', content_kind: CONTENT[o.kind] ? o.kind : 'view', source: o.source || '', at: now() };
      ko.notes.push(n); updateObject(koId, { notes: ko.notes });
      if (o.about) relate('note:' + koId + ':' + n.id, o.about, 'illustrates', { ko: koId, provenance: 'user', source_ref: o.ref || ('note:' + n.id) });
      return n;
    }
    function removeNote(koId, nid) { var ko = object(koId); if (!ko) return; updateObject(koId, { notes: ko.notes.filter(function (n) { return n.id !== nid; }) }); relations({ node: 'note:' + koId + ':' + nid }).forEach(function (r) { unrelate(r.id); }); }

    // ---------------------------------------------------------------- frameworks / model runs / lab runs
    function saveFramework(fi) { fi.updated_at = now(); if (!fi.id) fi.id = rid(); put('fwi:' + fi.id, fi, 'fwi', fi.ko); attach(fi.ko, 'framework_instance_ids', fi.id); return fi; }
    function framework(id) { return get('fwi:' + id); }
    function frameworksOf(koId) { var ko = object(koId); return ko ? ko.framework_instance_ids.map(framework).filter(Boolean) : []; }
    function removeFramework(id) {
      var fi = framework(id); if (!fi) return;
      relations({ source: 'fwi:' + id }).forEach(function (r) { unrelate(r.id); });
      back.set('fwi:' + id, null);
      var ko = object(fi.ko); if (ko) updateObject(fi.ko, { framework_instance_ids: ko.framework_instance_ids.filter(function (x) { return x !== id; }) });
      (fi.nodes || []).forEach(function (n) { if (n.concept_id) maybeDrop(fi.ko, n.concept_id); });
    }
    function saveModelRun(m) { m.updated_at = now(); if (!m.id) { m.id = rid(); m.at = now(); } put('mr:' + m.id, m, 'mr', m.ko); attach(m.ko, 'model_run_ids', m.id); return m; }
    function modelRun(id) { return get('mr:' + id); }
    function modelRunsOf(koId) { var ko = object(koId); return ko ? ko.model_run_ids.map(modelRun).filter(Boolean) : []; }
    function removeModelRun(id) { var m = modelRun(id); if (!m) return; back.set('mr:' + id, null); var ko = object(m.ko); if (ko) updateObject(m.ko, { model_run_ids: ko.model_run_ids.filter(function (x) { return x !== id; }) }); relations({ node: 'mr:' + id }).forEach(function (r) { unrelate(r.id); }); }
    function labRun(id) { return get('mi:run:' + id); }
    function labRunsOf(koId) { var ko = object(koId); return ko ? ko.lab_run_ids.map(labRun).filter(Boolean) : []; }
    function linkLabRun(koId, rec) { attach(koId, 'lab_run_ids', rec.id); emit('mi', rec.id, koId); }

    // ---------------------------------------------------------------- export / import (structured, one object with everything it uses)
    function exportObject(koId) {
      var ko = object(koId); if (!ko) return null;
      var rels = relations({ ko: koId }), ids = {};
      ko.concept_ids.forEach(function (c) { ids[c] = 1; });
      rels.forEach(function (r) { [r.from, r.to].forEach(function (x) { if (x.indexOf('cc:') === 0) ids[x.slice(3)] = 1; }); });
      return { format: 'minest.knowledge-object/1', exported_at: new Date().toISOString(), object: ko,
        concepts: Object.keys(ids).map(getConcept).filter(Boolean), relations: rels,
        frameworks: frameworksOf(koId), model_runs: modelRunsOf(koId), lab_runs: labRunsOf(koId) };
    }
    function importObject(data) {
      if (!data || data.format !== 'minest.knowledge-object/1') throw new Error('Not a minest.knowledge-object/1 file');
      var map = {};   // concepts merge into existing ones by label
      (data.concepts || []).forEach(function (c) { map[c.id] = concept({ en: c.labels.en, zh: c.labels.zh }, { kind: c.kind, provenance: c.provenance, ref: c.ref, review: c.review, definition: c.definition, aliases: c.aliases }); });
      var mc = function (x) { return x && x.indexOf('cc:') === 0 && map[x.slice(3)] ? 'cc:' + map[x.slice(3)] : x; };
      var o = data.object, ko = createObject(o.original_input, { title: o.title, content_type: o.content_type }), id = ko.id;
      var fix = function (x) { return String(x).replace('ko:' + o.id, 'ko:' + id).replace('note:' + o.id + ':', 'note:' + id + ':'); };
      var fwIds = [], mrIds = [];
      (data.frameworks || []).forEach(function (f) { var nf = JSON.parse(JSON.stringify(f)); nf.id = null; nf.ko = id; nf.nodes.forEach(function (n) { if (n.concept_id) n.concept_id = map[n.concept_id] || n.concept_id; n.refs = (n.refs || []).map(function (r) { return map[r] || r; }); }); fwIds.push([f.id, saveFramework(nf).id]); });
      (data.model_runs || []).forEach(function (m) { var nm = JSON.parse(JSON.stringify(m)); var old = nm.id; nm.id = null; nm.ko = id; mrIds.push([old, saveModelRun(nm).id]); });
      (data.lab_runs || []).forEach(function (l) { back.set('mi:run:' + l.id, l); });
      updateObject(id, { root_concept: map[o.root_concept] || null, placement: o.placement, notes: o.notes || [], sources: o.sources || [], lab_run_ids: (o.lab_run_ids || []).slice(),
        concept_ids: (o.concept_ids || []).map(function (c) { return map[c] || c; }).filter(function (c, i, a) { return a.indexOf(c) === i; }) });
      (data.relations || []).forEach(function (r) {
        var src = r.source_ref || ''; fwIds.forEach(function (p) { src = src.replace('fwi:' + p[0], 'fwi:' + p[1]); });
        var from = fix(mc(r.from)), to = fix(mc(r.to)); mrIds.forEach(function (p) { if (from === 'mr:' + p[0]) from = 'mr:' + p[1]; if (to === 'mr:' + p[0]) to = 'mr:' + p[1]; });
        relate(from, to, r.type, { note: r.note, provenance: r.provenance, source_ref: src, review: r.review, ko: id });
      });
      return object(id);
    }

    // content review: Minest's status in the data, overridden by the reviewer's own decision ('rv:<kind>:<id>')
    function reviewStatus(kind, id, dflt) { var v = get('rv:' + kind + ':' + id); return v && v.status ? v.status : (dflt || null); }
    function setReview(kind, id, status) { return put('rv:' + kind + ':' + id, { status: status, at: now() }, 'rv'); }
    return {
      REL: REL, RELBY: RELBY, KINDS: KINDS, PROV: PROV, CONTENT: CONTENT, contentKind: contentKind, reviewStatus: reviewStatus, setReview: setReview, norm: norm,
      on: function (f) { subs.push(f); return function () { subs = subs.filter(function (x) { return x !== f; }); }; },
      createObject: createObject, object: object, objects: objects, updateObject: updateObject, deleteObject: deleteObject,
      concept: concept, findConcept: findConcept, getConcept: getConcept, updateConcept: updateConcept, label: label, addToObject: addToObject, conceptsOf: conceptsOf, maybeDrop: maybeDrop,
      relate: relate, relations: relations, updateRelation: updateRelation, unrelate: unrelate,
      addNote: addNote, removeNote: removeNote,
      saveFramework: saveFramework, framework: framework, frameworksOf: frameworksOf, removeFramework: removeFramework,
      saveModelRun: saveModelRun, modelRun: modelRun, modelRunsOf: modelRunsOf, removeModelRun: removeModelRun,
      labRun: labRun, labRunsOf: labRunsOf, linkLabRun: linkLabRun,
      exportObject: exportObject, importObject: importObject, backend: back
    };
  }
  var api = { create: create };
  root.MinestKS = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
