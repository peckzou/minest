/* Minest Visual Library 1.4 · public API adapters. Uses the existing selection/save contract. */
(function(){
  'use strict';
  async function request(params,signal){var h=typeof minestAIHeaders==='function'?minestAIHeaders():{};delete h['Content-Type'];var r=await fetch('/api/library/entities?'+new URLSearchParams(params),{headers:h,signal:signal,credentials:'same-origin'}),d=await r.json();if(!r.ok||d.error)throw new Error(d.error||'Reference search unavailable ('+r.status+').');return d;}
  [['people','wikidata','Wikidata + Wikimedia Commons'],['history','wikidata','Wikidata + Wikimedia Commons'],['music','musicbrainz','MusicBrainz + Cover Art Archive'],['nature','inaturalist','iNaturalist']].forEach(function(spec){
    MinestVisualLibrary.registerProvider(spec[0],{name:spec[2],search:async function(q,page,signal){return request({provider:spec[1],action:'search',kind:spec[0],q:q,page:page},signal);},getDetails:async function(x,signal){var kind=spec[1]==='wikidata'?(x.metadata.category||spec[0]):x.entityType;var d=await request({provider:spec[1],action:'details',kind:kind,id:x.source.externalId},signal);return d.item;}});
  });
})();
