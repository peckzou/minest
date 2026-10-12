// Public reference providers. Fixed upstream hosts; existing Minest authorization is reused unchanged.
import { authorize } from '../_minest/auth.mjs';
import { withCors } from '../_minest/cors.mjs';
const UA = 'MinestVisualLibrary/1.4 (+https://minest-app.vercel.app/)';
const blank = () => ({url:'', attribution:'No verified image available.', license:null});
const plain = x => String(x || '').replace(/<[^>]*>/g,' ').replace(/&quot;/g,'"').replace(/&#0?39;/g,"'").replace(/&amp;/g,'&').replace(/\s+/g,' ').trim().slice(0,1600);
const https = x => {try {const u=new URL(x);return u.protocol==='https:'?u.href:'';}catch{return '';}};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let musicQueue=Promise.resolve(), lastMusic=0;
function musicSlot() {
  const slot=musicQueue.then(async()=>{const wait=Math.max(0,1100-(Date.now()-lastMusic));if(wait)await new Promise(r=>setTimeout(r,wait));lastMusic=Date.now();});
  musicQueue=slot.catch(()=>{});return slot;
}
class UpstreamError extends Error {constructor(provider,status){super(`${provider} could not respond (${status}). No automatic retry was made.`);this.status=status===429?429:502;}}
function url(base,params) {return base+'?'+new URLSearchParams(params);}
export function createEntitiesHandler({env=process.env,fetchFn=fetch,authorizeFn=authorize}={}) {
  async function get(link,provider,optional=false) {
    if(link.startsWith('https://musicbrainz.org/ws/2/'))await musicSlot();
    const r=await fetchFn(link,{headers:{'User-Agent':UA,Accept:'application/json'},signal:AbortSignal.timeout(6500)});
    if(optional&&r.status===404)return null;
    if(!r.ok)throw new UpstreamError(provider,r.status);
    const d=await r.json();if(d.error)throw new UpstreamError(provider,d.error.code||'API error');return d;
  }
  const wd = params => get(url('https://www.wikidata.org/w/api.php',{format:'json',maxlag:5,...params}),'Wikidata');
  const vals=(e,p)=>(e.claims?.[p]||[]).filter(c=>c.rank!=='deprecated').map(c=>c.mainsnak?.datavalue?.value).filter(v=>v!=null);
  async function wiki(kind,q,page,id) {
    let ids, more=false;
    if(id)ids=[id];else {
      const d=await wd({action:'wbsearchentities',search:q,language:/[\u3400-\u9fff]/.test(q)?'zh':'en',uselang:'en',type:'item',limit:20,continue:(page-1)*20});
      ids=(d.search||[]).map(x=>x.id).filter(x=>/^Q\d+$/.test(x));more=d['search-continue']!=null;
    }
    if(!ids.length)return {items:[],more};
    const d=await wd({action:'wbgetentities',ids:ids.join('|'),props:'labels|descriptions|claims',languages:'en|zh',languagefallback:1});
    const entities=ids.map(id=>d.entities?.[id]).filter(e=>e&&!e.missing&&(kind!=='people'||vals(e,'P31').some(v=>v.id==='Q5')));
    const filenames=Array.from(new Set(entities.map(e=>vals(e,'P18')[0]).filter(v=>typeof v==='string')));
    let pages=[],warning='';
    if(filenames.length)try{
      const c=await get(url('https://commons.wikimedia.org/w/api.php',{action:'query',format:'json',formatversion:2,prop:'imageinfo',titles:filenames.map(f=>'File:'+f).join('|'),iiprop:'url|extmetadata',iiurlwidth:240,maxlag:5}),'Wikimedia Commons');pages=c.query?.pages||[];
    }catch(e){warning=e instanceof UpstreamError?e.message:'Commons thumbnails are temporarily unavailable.';}
    const pictures=new Map();
    pages.forEach(p=>{const info=p.imageinfo?.[0],m=info?.extmetadata||{},license=plain(m.LicenseShortName?.value),author=plain(m.Artist?.value),credit=plain(m.Credit?.value);if(!info)return;
      pictures.set(p.title.replace(/^File:/,'').replace(/_/g,' '),{url:license?https(info.thumburl):'',sourceUrl:https(info.descriptionurl),attribution:[author,credit,'Wikimedia Commons',license].filter(Boolean).join(' · '),license:license||null,licenseUrl:https(m.LicenseUrl?.value)});
    });
    const items=entities.map(e=>{const title=e.labels?.en?.value||e.labels?.zh?.value||e.id,description=e.descriptions?.en?.value||e.descriptions?.zh?.value||'',date=p=>String(vals(e,p)[0]?.time||'').replace(/^\+/,'').slice(0,10),file=vals(e,'P18')[0];
      return {entityId:'wikidata:entity:'+e.id,entityType:vals(e,'P31').some(v=>v.id==='Q5')?'person':'historical',title,subtitle:description,description,source:{provider:'wikidata',externalId:e.id,url:'https://www.wikidata.org/wiki/'+e.id},image:pictures.get(String(file).replace(/_/g,' '))||blank(),metadata:{birth:date('P569'),death:date('P570'),eventDate:date('P585'),occupations:vals(e,'P106').map(v=>v.id).filter(Boolean),dataLicense:'CC0',category:kind,warning}};});
    return {items,more,warning};
  }
  function artist(a){return {entityId:'musicbrainz:artist:'+a.id,entityType:'artist',title:a.name,subtitle:[a.type,a.country,a.disambiguation].filter(Boolean).join(' · '),source:{provider:'musicbrainz',externalId:a.id,url:'https://musicbrainz.org/artist/'+a.id},image:{...blank(),attribution:'MusicBrainz has no verified artist portrait source in this integration.'},metadata:{type:a.type,country:a.country,area:a.area?.name,begin:a['life-span']?.begin,end:a['life-span']?.end,disambiguation:a.disambiguation}};}
  function album(a){const credits=(a['artist-credit']||[]).map(c=>c.name||c.artist?.name).filter(Boolean),id=a.id;return {entityId:'musicbrainz:album:'+id,entityType:'album',title:a.title,subtitle:credits.join(', '),source:{provider:'musicbrainz',externalId:id,url:'https://musicbrainz.org/release-group/'+id},image:{url:'https://coverartarchive.org/release-group/'+id+'/front-250',sourceUrl:'https://coverartarchive.org/release-group/'+id,attribution:'Cover Art Archive · cover copyright belongs to the respective owners. Availability varies.',license:null},metadata:{year:(a['first-release-date']||'').slice(0,4)||null,artists:credits,type:a['primary-type']||'',coverStatus:'unverified'}};}
  async function music(q,page,id,kind) {
    if(id){const type=kind==='artist'?'artist':'release-group',d=await get(url('https://musicbrainz.org/ws/2/'+type+'/'+id,{fmt:'json',inc:kind==='artist'?'aliases':'artist-credits'}),'MusicBrainz');const item=kind==='artist'?artist(d):album(d);
      if(kind==='album')try{const c=await get('https://coverartarchive.org/release-group/'+id,'Cover Art Archive',true),front=c?.images?.find(x=>x.front);item.image.url=https(front?.thumbnails?.['250']||front?.thumbnails?.small);item.metadata.coverStatus=front?'available':'missing';}catch(e){item.image.url='';item.metadata.coverStatus='unavailable';item.metadata.warning=e instanceof UpstreamError?e.message:'Cover Art Archive is temporarily unavailable.';}
      return {item};
    }
    // Two small searches, globally spaced by >=1.1s. No portrait lookup or cover prefetch per tile.
    const term='"'+q.replace(/["\\]/g,' ').trim()+'"',offset=(page-1)*10;
    const a=await get(url('https://musicbrainz.org/ws/2/artist/',{query:'artist:'+term,fmt:'json',limit:10,offset}),'MusicBrainz');
    const b=await get(url('https://musicbrainz.org/ws/2/release-group/',{query:'releasegroup:'+term+' OR artist:'+term,fmt:'json',limit:10,offset}),'MusicBrainz');
    return {items:[...(b['release-groups']||[]).filter(x=>uuid.test(x.id)).map(album),...(a.artists||[]).filter(x=>uuid.test(x.id)).map(artist)],more:page*10<Math.max(a.count||0,b.count||0)};
  }
  const licenses={'cc0':'https://creativecommons.org/publicdomain/zero/1.0/','cc-by':'https://creativecommons.org/licenses/by/4.0/','cc-by-sa':'https://creativecommons.org/licenses/by-sa/4.0/','cc-by-nc':'https://creativecommons.org/licenses/by-nc/4.0/','cc-by-nc-sa':'https://creativecommons.org/licenses/by-nc-sa/4.0/','cc-by-nd':'https://creativecommons.org/licenses/by-nd/4.0/','cc-by-nc-nd':'https://creativecommons.org/licenses/by-nc-nd/4.0/'};
  function taxon(t) {
    const p=t.default_photo||{},license=String(p.license_code||'').toLowerCase(),photoId=Number(p.id),sourceUrl=photoId?'https://www.inaturalist.org/photos/'+photoId:https(p.url),allowed=!!licenses[license];
    return {entityId:'inaturalist:taxon:'+t.id,entityType:'species',title:t.preferred_common_name||t.name,subtitle:[t.name,t.rank,t.iconic_taxon_name].filter(Boolean).join(' · '),source:{provider:'inaturalist',externalId:String(t.id),url:'https://www.inaturalist.org/taxa/'+t.id},image:{url:allowed?https(p.medium_url||p.square_url):'',sourceUrl,attribution:plain(p.attribution)||'iNaturalist · photo credits unavailable; image withheld.',license:license||null,licenseUrl:licenses[license]||'',usage:license.includes('-nc')?'Non-commercial use only.':''},metadata:{scientificName:t.name,rank:t.rank,iconicTaxon:t.iconic_taxon_name,ancestors:(t.ancestors||[]).map(a=>({name:a.name,rank:a.rank})),photoId:photoId||null,photoWithheld:!allowed}};
  }
  async function nature(q,page,id) {const d=await get(id?'https://api.inaturalist.org/v1/taxa/'+id:url('https://api.inaturalist.org/v1/taxa',{q,page,per_page:20,is_active:true}),'iNaturalist');const items=(d.results||[]).filter(x=>Number(x.id)>0&&x.name).map(taxon);return id?{item:items[0]}:{items,more:page*20<Number(d.total_results||0)};}
  return async(req,res)=>{
    const send=(status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(data));};
    if(req.method!=='GET')return send(405,{error:'GET only.'});
    const auth=await authorizeFn(req,env.MINEST_AI_TOKEN);if(!auth.ok)return send(auth.status,{error:auth.error});
    const p=req.query||{},provider=p.provider,action=p.action||'search',q=String(p.q||'').trim(),page=Number(p.page||1),id=String(p.id||''),kind=p.kind;
    if(Object.values(p).some(Array.isArray)||!['wikidata','musicbrainz','inaturalist'].includes(provider)||!['search','details'].includes(action)||!Number.isInteger(page)||page<1||page>10)return send(400,{error:'Invalid provider request.'});
    if(action==='search'&&(q.length<2||q.length>180))return send(400,{error:'Search must contain 2–180 characters.'});
    if(provider==='wikidata'&&!['people','history'].includes(kind))return send(400,{error:'Choose People or History.'});
    if(action==='details'&&!(provider==='wikidata'?/^Q\d+$/.test(id):provider==='musicbrainz'?uuid.test(id)&&['artist','album'].includes(kind):/^\d{1,10}$/.test(id)))return send(400,{error:'Invalid reference ID.'});
    try {let d;if(provider==='wikidata'){d=await wiki(kind,q,page,action==='details'?id:'');if(action==='details')d={item:d.items[0],warning:d.warning};}else if(provider==='musicbrainz')d=await music(q,page,action==='details'?id:'',kind);else d=await nature(q,page,action==='details'?id:'');if(action==='details'&&!d.item)return send(404,{error:'Reference not found.'});return send(200,d);}
    catch(e){return send(e instanceof UpstreamError?e.status:502,{error:e instanceof UpstreamError?e.message:'The reference provider timed out or is unavailable. No automatic retry was made.'});}
  };
}
export default withCors(createEntitiesHandler());
