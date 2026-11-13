import{B as e,P as t,U as n,Z as r,ft as i,k as a,u as o,y as s,z as c}from"./three-ya0QNlXk.js";import{c as l,f as u,h as d,l as f,o as p,t as m}from"./letter-world-BCGpD-0E.js";import{t as h}from"./index-B_9KKqLz.js";import{t as g}from"./particles-B5uQt35O.js";var _=-.62,v=5.9,y=-.85,b=.085,x=24,S=8,C=1.3,w=`
attribute float aU; attribute float aV;
uniform float uProg; uniform float uCollapse; uniform float uTime; uniform float uR; uniform float uLen; uniform float uFlow;
varying float vU; varying float vV;`,T=`
vec3 transformed;
{
  vec3 c = position - objectNormal * uR;
  float age = clamp((uProg - aU) * 6.0, 0.0, 1.0);
  float form = age * age * (3.0 - 2.0 * age);
  float flow = sin(aU * uLen * 13.0 - uTime * 2.6 + aV * 12.566) * 0.09 + sin(aU * uLen * 29.0 + uTime * 1.9) * 0.05;
  float rad = uR * form * (1.0 + flow * uFlow) * (1.0 - 0.55 * uCollapse);
  vec3 n = objectNormal;
  transformed = c + vec3(n.xy * rad, n.z * rad * (1.0 - 0.5 * uCollapse));
  transformed.y -= (1.0 - form) * 0.22;
  float melt = uCollapse * uCollapse;
  transformed.y = mix(transformed.y, -0.2 + transformed.y * 0.12, melt);
  transformed.z *= 1.0 + melt * 1.4;
  vU = aU; vV = aV;
}`,E=`
uniform float uProg; uniform float uTime; uniform float uLen; uniform float uFlow;
varying float vU; varying float vV;`,D=`
#include <normal_fragment_maps>
normal = normalize(normal + vec3(sin(vU * uLen * 60.0 - uTime * 3.0 + vV * 25.0), cos(vU * uLen * 47.0 + uTime * 2.2 - vV * 19.0), 0.0) * 0.1 * uFlow);`,O=`uniform float uTime;`,k=`
#include <begin_vertex>
{
#ifdef USE_INSTANCING
  float ph = instanceMatrix[3].x * 9.0 + instanceMatrix[3].y * 7.0;
#else
  float ph = 0.0;
#endif
  float sw = transformed.y * transformed.y;
  transformed.x += sin(uTime * 2.1 + ph) * 0.4 * sw;
  transformed.z += cos(uTime * 1.7 + ph * 1.3) * 0.4 * sw;
}`,A=`
uniform vec4 uBump[${x}]; uniform vec4 uRip[${S}]; uniform float uTime;
float ffH(vec2 p) {
  float h = 0.0;
  for (int i = 0; i < ${x}; i++) {
    vec4 b = uBump[i];
    if (b.z <= 0.0) continue;
    float dx = max(0.0, abs(p.x - b.x) - b.y) / 0.25;
    float dz = (p.y - b.w) / 0.3;
    h = max(h, b.z * 0.16 * exp(-dx * dx - dz * dz));
  }
  for (int i = 0; i < ${S}; i++) {
    vec4 r = uRip[i];
    if (r.w <= 0.0) continue;
    float d = length(p - r.xy);
    float f = r.z * 2.3;
    float env = exp(-(d - f) * (d - f) * 4.0) * exp(-r.z * 1.3);
    h += r.w * 0.05 * sin((d - f) * 13.0) * env;
  }
  h += 0.006 * sin(p.x * 1.3 + uTime * 0.5) * sin(p.y * 3.7 - uTime * 0.4);
  return h;
}`,j=`
float ffh0 = ffH(position.xz);
float ffhx = ffH(position.xz + vec2(0.03, 0.0));
float ffhz = ffH(position.xz + vec2(0.0, 0.03));
vec3 objectNormal = normalize(vec3(-(ffhx - ffh0) / 0.03, 1.0, -(ffhz - ffh0) / 0.03));`,M=`
vec3 transformed = vec3(position);
transformed.y += ffh0;`,N=class extends m{timeU={value:0};spikeMat;coneGeo;sets=new Map;drops;bumpU=[];ripU=[];ripHead=0;coilMats=[];field=0;yShift=0;camTarget=new i(0,.05,0);camDir=new i(0,1.6,10).normalize();camDist=10.1;m4=new c;q=new r;p3=new i;s3=new i;dropColor=new s(789520);constructor(e){super(e);let t=o;e.layout.setOptions({...h,metric:`sans`,size:1.3,tracking:.14,maxWidth:9.4,maxLines:1,origin:[0,0,0],plane:`xy`,minScale:.3}),e.scene.background=new t.Color(16053231),e.scene.fog=new t.Fog(16053231,20,60),e.scene.environment=e.renderer.environment(),this.root.add(p(15329507,14605526,{horizon:16250610,exponent:.9})),this.placeCamera(!0),this.root.add(new t.HemisphereLight(16777215,14276303,.9));let n=new t.DirectionalLight(16777215,1.6);n.position.set(4,10,7),this.root.add(n);let r=new t.DirectionalLight(14674175,.8);r.position.set(-6,4,-6),this.root.add(r);for(let e=0;e<x;e++)this.bumpU.push(new t.Vector4(0,0,0,0));for(let e=0;e<S;e++)this.ripU.push(new t.Vector4(0,0,0,0));this.buildLab(),this.coneGeo=new t.ConeGeometry(1,1,8,1),this.coneGeo.translate(0,.5,0),this.coneGeo.userData.shared=!0,this.spikeMat=this.ferroMaterial(),this.spikeMat.userData.shared=!0,this.spikeMat.onBeforeCompile=e=>{e.uniforms.uTime=this.timeU,e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>
`+O).replace(`#include <begin_vertex>`,k)},this.drops=new g({capacity:700,gravity:[0,0,0],drag:0,shape:`dot`,size:.06,blending:t.NormalBlending,opacity:.95,depthWrite:!1}),this.root.add(this.drops.points)}ferroMaterial(){return new n({color:328966,roughness:.14,metalness:.85,clearcoat:1,clearcoatRoughness:.06,envMapIntensity:1.5})}buildLab(){let e=o,t=new e.MeshStandardMaterial({color:16513783,roughness:.28,metalness:.02}),n=new e.Mesh(new e.BoxGeometry(40,1,14),new e.MeshStandardMaterial({color:15526629,roughness:.55}));n.position.set(0,-1.48,-1),this.root.add(n);let r=new e.Mesh(new e.PlaneGeometry(60,30),new e.MeshStandardMaterial({color:15921645,roughness:.9}));r.position.set(0,8,-8),this.root.add(r);let i=.42,a=.16,s=(n,r,a,o)=>{let s=new e.Mesh(new e.BoxGeometry(n,i,r),t);s.position.set(a,-.56-i/2,o),this.root.add(s)},c=v*2,l=1.7;s(12.120000000000001,a,0,y-a/2),s(12.120000000000001,a,0,.9299999999999999),s(a,l,-5.9-a/2,0),s(a,l,5.98,0);let u=new e.Mesh(new e.BoxGeometry(12.22,.04,.24),t);u.position.set(0,-.54,.9299999999999999),this.root.add(u);let d=this.ctx.quality,f=d===2?300:d===1?210:130,p=d===0?16:26,m=new e.PlaneGeometry(c,l,f,p);m.rotateX(-Math.PI/2),m.translate(0,0,0);let h=new e.MeshPhysicalMaterial({color:263173,roughness:.1,metalness:.7,clearcoat:1,clearcoatRoughness:.04,envMapIntensity:1.3});h.onBeforeCompile=e=>{e.uniforms.uBump={value:this.bumpU},e.uniforms.uRip={value:this.ripU},e.uniforms.uTime=this.timeU,e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>
`+A).replace(`#include <beginnormal_vertex>`,j).replace(`#include <begin_vertex>`,M)};let g=new e.Mesh(m,h);g.position.y=_,g.frustumCulled=!1,this.root.add(g);let b=new e.MeshStandardMaterial({color:13136956,roughness:.3,metalness:.9}),x=new e.MeshStandardMaterial({color:9146521,roughness:.25,metalness:.9});for(let t of[-1,1]){let n=new e.Group,r=new e.Mesh(new e.CylinderGeometry(.42,.42,.7,28),b);r.rotation.z=Math.PI/2,n.add(r);for(let t=-2;t<=2;t++){let r=new e.Mesh(new e.TorusGeometry(.43,.025,6,28),b);r.rotation.y=Math.PI/2,r.position.x=t*.14,n.add(r)}let i=new e.Mesh(new e.CylinderGeometry(.16,.16,1.1,18),x);i.rotation.z=Math.PI/2,n.add(i);let a=new e.MeshStandardMaterial({color:10138879,emissive:6129407,emissiveIntensity:0,roughness:.4});this.coilMats.push(a);let o=new e.Mesh(new e.TorusGeometry(.2,.03,8,24),a);o.rotation.y=Math.PI/2,o.position.x=-t*.56,n.add(o);let s=new e.Mesh(new e.BoxGeometry(.5,.5,.7),x);s.position.y=-.55,n.add(s),n.position.set(t*6.65,-.4,0),this.root.add(n)}}placeCamera(e,t=0){let n=this.ctx.camera,r=this.ctx.renderer.size.aspect||1.6,i=Math.tan(n.fov*Math.PI/360),a=this.ctx.layout.bounds,o=Math.max(3,a.isEmpty()?0:Math.max(Math.abs(a.min.x),Math.abs(a.max.x)))+.8,s=Math.max(2.6/i,o/(i*r)),c=Math.min(30,Math.max(10.1,s));return this.camDist=e?c:f(this.camDist,c,3,t),n.position.copy(this.camTarget).addScaledVector(this.camDir,this.camDist),n.lookAt(this.camTarget),Math.abs(this.camDist-c)>.01}spikeSet(e){let t=this.sets.get(e);if(t)return t;let n=this.ctx.glyphs.get(e,`sans`),a=this.ctx.glyphs.evenPoints(n,.06),o=[],s=new i(0,1,0),c=new i,u=new r;a.forEach((e,t)=>{let n=-e.ty,r=e.tx,i=t%2==0?[-1.15,0,1.15]:[-.6,.6];for(let t of i){let i=t+d(-.12,.12);c.set(n*Math.sin(i),r*Math.sin(i),Math.cos(i)).normalize(),u.setFromUnitVectors(s,c);let a=(Math.abs(t)<.1?.17:Math.abs(t)>1?.09:.13)*d(.8,1.15),f=l(a*.3,.024,.048);o.push(e.x+c.x*b*.7,e.y+c.y*b*.7,c.z*b*.7,u.x,u.y,u.z,u.w,f,a,e.u)}});let f={data:new Float32Array(o),count:o.length/10,pts:a,length:n.length};return this.sets.set(e,f),f}writeSpikes(e){let t=e.set.data,n=1-l(e.collapse*2.2);for(let r=0;r<e.set.count;r++){let i=r*10,a=t[i+9],o=Math.max(0,u(l((e.T-.35-a*.65)/.3),2.2)*n*e.pulse),s=t[i+7]*(.5+.5*Math.min(1,o));this.p3.set(t[i],t[i+1],t[i+2]),this.q.set(t[i+3],t[i+4],t[i+5],t[i+6]),o<.001?this.s3.set(0,0,0):this.s3.set(s,t[i+8]*o,s),this.m4.compose(this.p3,this.q,this.s3),e.spikes.setMatrixAt(r,this.m4)}e.spikes.instanceMatrix.needsUpdate=!0}createLetter(n,r){if(!n.char.trim())return null;let i=this.ctx;this.onLayout();let o=i.glyphs.get(n.char,`sans`),s=i.glyphs.tube(o,b,14,!0),c={uProg:{value:+!!n.restoring},uCollapse:{value:0},uFlow:{value:n.restoring?.6:1}},l=this.ferroMaterial();l.onBeforeCompile=e=>{Object.assign(e.uniforms,c,{uTime:this.timeU,uR:{value:b},uLen:{value:o.length}}),e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>
`+w).replace(`#include <begin_vertex>`,T),e.fragmentShader=e.fragmentShader.replace(`#include <common>`,`#include <common>
`+E).replace(`void main() {`,`void main() {
  if (vU > uProg + 0.002) discard;`).replace(`#include <normal_fragment_maps>`,D)},l.customProgramCacheKey=()=>`ferro-body`;let u=new e(s,l);u.frustumCulled=!1;let d=this.spikeSet(n.char),f=new t(this.coneGeo,this.spikeMat,Math.max(1,d.count));f.count=d.count,f.frustumCulled=!1;let p=new a;p.add(u,f),this.root.add(p);let m={ref:n,slot:r,object:p,state:n.restoring?`alive`:`creating`,age:0,body:u,mat:l,u:c,spikes:f,set:d,T:n.restoring?C:0,dur:i.tempo.duration(1e3,420),collapse:0,collapsing:!1,pulse:1,finaleT:-1,collapseAt:-1,yShift:this.yShift,dirty:!0,emitAcc:0};return this.place(m,!0,0),this.writeSpikes(m),n.restoring||(i.audio.play(`hum`,{pitch:.7+Math.random()*.1,gain:.3,minGap:40}),this.field=1,this.ripple(r.origin.x+r.advance/2,0,.5)),i.keepAlive(1500),m}removeLetter(e,t){e.collapsing=!0,e.state=`removing`,this.ctx.audio.play(`squish`,{pitch:.7,gain:.45,minGap:30}),this.ripple(e.slot.origin.x+e.slot.advance/2,0,1),this.ctx.keepAlive(1200)}playFinale(e,t,n){let r=this.ctx;t.slice().sort((e,t)=>e.slot.index-t.slot.index).forEach((e,t)=>{e.finaleT=0,e.collapseAt=.95+t*.06}),this.field=1.6,r.audio.play(`success`,{gain:.7}),r.audio.play(`hum`,{pitch:1.2,gain:.35}),n.then(e=>{e.ok||r.audio.play(`error`,{gain:.5})}),r.keepAlive(2200+t.length*80)}ripple(e,t,n){let r=this.ripU[this.ripHead];this.ripHead=(this.ripHead+1)%S,r.set(e,t,0,n)}place(e,t,n){let r=e.slot;e.state!==`finale`&&e.state!==`removing`&&(e.yShift=t?this.yShift:f(e.yShift,this.yShift,10,n));let i=e.object,a=r.origin.x,o=r.origin.y+e.yShift;return t?(i.position.set(a,o,r.origin.z),i.scale.setScalar(r.size),!1):(i.position.x=f(i.position.x,a,12,n),i.position.y=f(i.position.y,o,12,n),i.scale.setScalar(f(i.scale.x,r.size,12,n)),Math.abs(i.position.x-a)+Math.abs(i.position.y-o)+Math.abs(i.scale.x-r.size)>.001)}onLayout(){let e=this.ctx.layout.all();if(!e.length)return;let t=1/0;for(let n of e)t=Math.min(t,n.origin.y);this.yShift=-.59-t}updateLetter(e,t,n){this.place(e,!1,t);let r=!1;if(e.T<C&&!e.collapsing&&(e.T=Math.min(C,e.T+t/Math.max(.05,e.dur)),e.u.uProg.value=l(e.T/.7),this.emitDrops(e,t),r=!0,e.T>=C&&e.state===`creating`&&(e.state=`alive`)),e.u.uFlow.value=f(e.u.uFlow.value,e.state===`creating`?1:.6,2,t),e.finaleT>=0){e.finaleT+=t;let n=e.finaleT;e.pulse=1+.6*Math.sin(Math.PI*l(n/.8)),r=!0,n>=e.collapseAt&&!e.collapsing&&(e.collapsing=!0,e.u.uProg.value=1,this.ripple(e.slot.origin.x+e.slot.advance/2,0,.8),this.ctx.audio.play(`squish`,{pitch:.8+Math.random()*.2,gain:.25,minGap:30}))}return e.collapsing&&(e.collapse=Math.min(1,e.collapse+t/.65),e.u.uCollapse.value=e.collapse,r=!0,e.collapse>=1)?(this.release(e),!0):((r||e.dirty)&&(this.writeSpikes(e),e.dirty=r),r)}emitDrops(e,t){let n=e.set.pts;if(!n.length)return;let r=e.u.uProg.value;if(r>=1)return;e.emitAcc+=t*70*this.ctx.tempo.detail;let i=e.slot,a=n[Math.min(n.length-1,Math.floor(r*(n.length-1)))],o=i.origin.x+a.x*i.size,s=i.origin.y+e.yShift+a.y*i.size;for(;e.emitAcc>=1;){--e.emitAcc;let t=o+d(-.35,.35),n=d(-.4,.4),r=d(.18,.32);this.drops.emit({x:t,y:-.6,z:n,vx:(o-t)/r,vy:(s-_)/r,vz:(0-n)/r,life:r,size:d(.6,1.3),color:this.dropColor,hold:.7})}}updateWorld(e,t){this.timeU.value=t;let n=this.placeCamera(!1,e);this.drops.update(e)&&(n=!0);let r=0,i=[...this.letters.values(),...this.detached];for(let e of i){if(r>=x)break;let t=l(e.T/.7)*(1-e.collapse)*(.85+.15*e.pulse),n=e.object,i=e.slot.advance/2*(n.scale.x/Math.max(.001,e.slot.size));this.bumpU[r++].set(n.position.x+i,Math.max(.05,i*.75),t,0)}for(;r<x;r++)this.bumpU[r].z=0;for(let t of this.ripU)t.w<=0||(t.z+=e,t.z>3?t.w=0:n=!0);this.field>.01&&(this.field*=Math.exp(-2.5*e),n=!0);let a=i.some(e=>e.state===`creating`||e.finaleT>=0),o=Math.max(this.field,a?.6:0)+.12*(this.letters.size>0);for(let e of this.coilMats)e.emissiveIntensity=o*(.9+.1*Math.sin(t*14));return i.length&&(n=!0),n}disposeWorld(){this.drops.dispose(),super.disposeWorld(),this.spikeMat.dispose(),this.coneGeo.dispose(),this.sets.clear(),this.ctx.scene.environment=null}};function P(e){return new N(e)}var F={create:P};export{P as create,F as ferrofluid};