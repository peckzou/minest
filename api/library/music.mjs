// iTunes is the primary discovery source. No MusicBrainz requests are made here.
import {authorize} from '../_minest/auth.mjs';
import { withCors } from '../_minest/cors.mjs';
const safe=x=>{try{const u=new URL(x);if(u.protocol==='http:'&&/\.apple\.com$/.test(u.hostname))u.protocol='https:';return u.protocol==='https:'?u.href:'';}catch{return '';}};
const store=(x,type)=>{const s=safe(x);if(!s)return '';const u=new URL(s);if(type==='album')u.searchParams.delete('i');if(/(^|\.)(apple\.com)$/.test(u.hostname))u.searchParams.set('app','itunes');return u.href;};
export function normalizeITunes(x,forcedType){
 const type=forcedType||(x.wrapperType==='artist'?'artist':x.wrapperType==='collection'?'album':x.kind==='song'?'song':'');
 const id=type==='artist'?x.artistId:type==='album'?x.collectionId:x.trackId,title=type==='artist'?x.artistName:type==='album'?x.collectionName:x.trackName;
 if(!['song','album','artist'].includes(type)||!Number.isSafeInteger(Number(id))||Number(id)<1||!title)return null;
 const sourceURL=store(type==='artist'?x.artistViewUrl:type==='album'?x.collectionViewUrl:x.trackViewUrl,type),derived=!!forcedType&&forcedType!=='song'&&x.wrapperType==='track';
 // Artists do not inherit album covers. Album art remains promotional, never a generic image fallback.
 const art=type==='artist'?'':safe(x.artworkUrl100||x.artworkUrl60);
 return {entityId:'itunes:'+type+':'+id,entityType:type,title:String(title),subtitle:type==='artist'?'Artist · iTunes Store':[x.artistName,type==='song'?x.collectionName:''].filter(Boolean).join(' · '),source:{provider:'itunes',externalId:String(id),url:sourceURL},image:{url:sourceURL?art:'',sourceUrl:sourceURL,attribution:art?'Album artwork via iTunes Store · rights belong to the respective owners.':'No verified artist portrait supplied by iTunes.',license:null,promoOnly:!!art,usage:art?'Promotional artwork for the linked iTunes Store content; not licensed for general image reuse.':''},metadata:{category:'music',artist:x.artistName,artistId:x.artistId?String(x.artistId):null,album:type==='artist'?null:x.collectionName,albumId:type==='artist'?null:x.collectionId?String(x.collectionId):null,year:derived||type==='artist'?null:(x.releaseDate||'').slice(0,4)||null,genre:type==='artist'&&derived?'':x.primaryGenreName||'',durationMillis:type==='song'?x.trackTimeMillis||null:null,trackCount:type==='album'&&!derived?x.trackCount||null:null,storefront:x.country||'USA',derivedFromTrack:derived}};
}
let recentCalls=[];
export function createMusicHandler({env=process.env,fetchFn=fetch,authorizeFn=authorize,now=Date.now}={}){
 return async(req,res)=>{const send=(status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(data));};if(req.method!=='GET')return send(405,{error:'GET only.'});const a=await authorizeFn(req,env.MINEST_AI_TOKEN);if(!a.ok)return send(a.status,{error:a.error});const p=req.query||{},provider=p.provider||'itunes',q=String(p.q||'').trim(),kind=p.kind||'all';if(Object.values(p).some(Array.isArray)||q.length<2||q.length>180||!['itunes','deezer'].includes(provider)||!['all','song','album','artist'].includes(kind))return send(400,{error:'Invalid music search.'});
 // Deezer is a one-request assessment endpoint, not an enabled enrichment service.
 if(provider==='deezer'&&p.action!=='assess')return send(503,{error:'Deezer image enrichment is pending confirmation of developer terms and usage eligibility.'});
 if(provider==='itunes'){const time=now();recentCalls=recentCalls.filter(t=>time-t<60000);if(recentCalls.length>=18){res.setHeader('Retry-After','60');return send(429,{error:'iTunes search is busy. Wait one minute before searching again.'});}recentCalls.push(time);}
 const params=provider==='itunes'?{term:q,media:'music',entity:kind==='artist'?'musicArtist':kind==='album'?'album':'song',country:'US',limit:60,explicit:'No'}:{q:'artist:"'+q.replace(/["\\]/g,' ')+'"',limit:1};
 const target=(provider==='itunes'?'https://itunes.apple.com/search':'https://api.deezer.com/search')+'?'+new URLSearchParams(params);
 try{const r=await fetchFn(target,{headers:{Accept:'application/json','User-Agent':'MinestVisualLibrary/1.6 (+https://minest-app.vercel.app/)'},signal:AbortSignal.timeout(8000)});if(!r.ok)return send(r.status===429?429:502,{error:provider+' returned HTTP '+r.status+'. No automatic retry.',upstreamStatus:r.status});const d=await r.json();if(d.error)return send(502,{error:'Deezer returned an API error; enrichment remains disabled.',upstreamErrorCode:d.error.code||null});
 if(provider==='deezer'){const x=d.data?.[0];return send(200,{available:!!x,enabled:false,status:'Pending Terms / Approval',sample:x?{trackId:x.id,title:x.title,artist:{id:x.artist?.id,name:x.artist?.name,image:safe(x.artist?.picture_medium),url:safe(x.artist?.link)},album:{id:x.album?.id,title:x.album?.title,image:safe(x.album?.cover_medium)},sourceUrl:safe(x.link)}:null});}
 const results=(d.results||[]),unique=new Map();for(const x of results){const item=normalizeITunes(x);if(item)unique.set(item.entityId,item);if(kind==='all'&&x.kind==='song')for(const type of ['album','artist']){const ref=normalizeITunes(x,type);if(ref&&!unique.has(ref.entityId))unique.set(ref.entityId,ref);}}
 return send(200,{items:Array.from(unique.values()).slice(0,180),more:false,storefront:'US',relatedEntities:kind==='all',notice:'Artists have placeholders unless a verified portrait source is available.'});
 }catch{return send(502,{error:provider+' was unavailable or timed out. No automatic retry.'});}}
}
export default withCors(createMusicHandler());
