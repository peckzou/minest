// Draws the portrait card and the diagram "artwork" for every District VII hall (pi-world/expansion.js) and writes
// assets/portraits/<id>.jpg and assets/artworks/<id>.jpg. They are schematic emblems, not likenesses or historical paintings.
// Needs a Chrome started with --remote-debugging-port=9333.  Usage: node tools/make-hall-art.mjs
import fs from 'fs';
const src = fs.readFileSync('pi-world/expansion.js', 'utf8') + ';' + fs.readFileSync('pi-world/annex.js', 'utf8');
const list = await (await fetch('http://127.0.0.1:9333/json/new?about:blank', { method: 'PUT' })).json();
const ws = new WebSocket(list.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pend = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (x) => { const r = await send('Runtime.evaluate', { expression: x, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description); return r.result.result.value; };
await ev(src);
const draw = `(function(){
  const F='"Songti SC","Noto Serif CJK SC",serif', S='"PingFang SC","Helvetica Neue",sans-serif', TAU=Math.PI*2;
  const hex=(n)=>'#'+n.toString(16).padStart(6,'0');
  function portrait(p){const c=document.createElement('canvas');c.width=660;c.height=862;const x=c.getContext('2d');
    const g=x.createLinearGradient(0,0,0,862);g.addColorStop(0,'#2a2622');g.addColorStop(1,hex(p.robe));x.fillStyle=g;x.fillRect(0,0,660,862);
    x.strokeStyle='#c9a45a';x.lineWidth=6;x.strokeRect(22,22,616,818);x.lineWidth=1.5;x.strokeRect(36,36,588,790);
    x.beginPath();x.arc(330,330,190,0,TAU);x.fillStyle='rgba(255,255,255,.06)';x.fill();x.lineWidth=4;x.stroke();
    for(let i=0;i<40;i++){const a=i/40*TAU;x.save();x.translate(330+Math.cos(a)*214,330+Math.sin(a)*214);x.rotate(a+1.2);x.fillStyle='#c9a45a';x.beginPath();x.ellipse(0,0,16,6,0,0,TAU);x.fill();x.restore();}
    x.fillStyle='#f4ead2';x.textAlign='center';x.textBaseline='middle';x.font='900 230px '+F;x.fillText(p.name[0],330,340);
    x.font='700 62px '+F;x.fillText(p.name,330,640);x.font='400 25px '+S;x.fillStyle='#d8c9a3';x.fillText(p.en,330,706);
    x.font='600 22px '+S;x.fillStyle='#c9a45a';x.fillText('№ '+p.num+' · '+p.district.replace(/^.*· /,''),330,766);return c.toDataURL('image/jpeg',0.9);}
  const A={
    bacon(x){['种族','洞穴','市场','剧场'].forEach((n,i)=>{const cx=100+i*153;x.beginPath();x.moveTo(cx-52,400);x.lineTo(cx-52,210);x.arc(cx,210,52,Math.PI,0);x.lineTo(cx+52,400);x.closePath();x.stroke();x.save();x.clip();for(let k=0;k<7;k++){x.beginPath();x.moveTo(cx-60,190+k*36);x.bezierCurveTo(cx-20,170+k*36+i*8,cx+20,215+k*36-i*8,cx+60,190+k*36);x.stroke();}x.restore();x.fillText(n+'假相',cx,440);});},
    mill(x){x.beginPath();x.arc(220,290,120,0,TAU);x.stroke();x.fillText('只关乎自己',220,290);x.beginPath();x.arc(480,290,90,0,TAU);x.stroke();x.fillText('他人',480,290);x.setLineDash([10,8]);x.beginPath();x.moveTo(368,150);x.lineTo(368,430);x.stroke();x.setLineDash([]);x.fillText('伤害原则',368,460);x.beginPath();x.moveTo(300,330);x.lineTo(392,330);x.lineTo(380,320);x.moveTo(392,330);x.lineTo(380,340);x.stroke();},
    frege(x){[[150,180,'晨星'],[510,180,'暮星']].forEach(d=>{x.fillText(d[2],d[0],d[1]-30);x.beginPath();x.moveTo(d[0],d[1]);x.lineTo(330,380);x.stroke();});x.beginPath();x.arc(330,400,34,0,TAU);x.fill();x.fillText('意义不同 · 指称相同',330,470);x.fillText('金星',330,345);},
    russell(x){x.setLineDash([8,8]);x.beginPath();x.moveTo(230,330);x.lineTo(250,220);x.lineTo(290,290);x.lineTo(330,200);x.lineTo(370,290);x.lineTo(410,220);x.lineTo(430,330);x.closePath();x.stroke();x.setLineDash([]);x.font='600 30px serif';x.fillText('∃x ( Kx ∧ ∀y ( Ky → y = x ) ∧ Bx )',330,400);x.font='600 24px sans-serif';x.fillText('存在 · 唯一 · 是秃头',330,450);},
    peirce_dewey(x){['疑难','溯因','演绎','试验','信念'].forEach((n,i)=>{const a=i/5*TAU-Math.PI/2,cx=330+Math.cos(a)*150,cy=300+Math.sin(a)*130;x.beginPath();x.arc(cx,cy,44,0,TAU);x.stroke();x.fillText(n,cx,cy);});x.beginPath();x.arc(330,300,96,0,TAU);x.setLineDash([6,8]);x.stroke();x.setLineDash([]);x.fillText('探究',330,300);},
    popper(x){for(let i=0;i<6;i++){const cx=90+i*96,bk=i===5;x.beginPath();x.ellipse(cx,330,36,22,0,0,TAU);bk?x.fill():x.stroke();x.beginPath();x.moveTo(cx+24,318);x.quadraticCurveTo(cx+44,270,cx+26,250);x.lineWidth=bk?9:3;x.stroke();x.lineWidth=3;}x.fillText('再多白天鹅也证明不了；一只黑天鹅足以反驳',330,430);},
    kuhn(x){['常规科学','反常','危机','革命','新范式'].forEach((n,i)=>{const cx=90+i*120,cy=360-[0,20,70,150,170][i];x.beginPath();x.arc(cx,cy,10,0,TAU);x.fill();x.fillText(n,cx,cy+38);if(i){const px=90+(i-1)*120,py=360-[0,20,70,150,170][i-1];x.beginPath();x.moveTo(px,py);x.lineTo(cx,cy);x.stroke();}});},
    rawls(x){for(let i=0;i<9;i++){x.beginPath();x.moveTo(60+i*68,150);x.bezierCurveTo(40+i*68,250,90+i*68,330,60+i*68,440);x.stroke();}x.globalAlpha=.45;for(let i=0;i<5;i++){const cx=140+i*95;x.beginPath();x.arc(cx,280,22,0,TAU);x.fill();x.fillRect(cx-22,306,44,90);}x.globalAlpha=1;x.fillText('无知之幕：你不知道自己是其中哪一个',330,475);},
    foucault(x){for(let i=0;i<16;i++){const a=i/16*TAU;x.beginPath();x.arc(330,300,170,a+.05,a+TAU/16-.05);x.arc(330,300,120,a+TAU/16-.05,a+.05,true);x.closePath();x.stroke();x.beginPath();x.moveTo(330,300);x.lineTo(330+Math.cos(a+.2)*120,300+Math.sin(a+.2)*120);x.globalAlpha=.25;x.stroke();x.globalAlpha=1;}x.beginPath();x.arc(330,300,34,0,TAU);x.fill();},
    habermas(x){x.beginPath();x.ellipse(330,310,170,90,0,0,TAU);x.stroke();for(let i=0;i<8;i++){const a=i/8*TAU,cx=330+Math.cos(a)*215,cy=310+Math.sin(a)*125;x.beginPath();x.arc(cx,cy,20,0,TAU);x.fill();x.beginPath();x.moveTo(cx,cy);x.quadraticCurveTo(330,310,330+Math.cos(a+2.4)*215,310+Math.sin(a+2.4)*125);x.globalAlpha=.3;x.stroke();x.globalAlpha=1;}x.fillText('真实 · 正当 · 真诚',330,310);}
  };
  function art(p){const c=document.createElement('canvas');c.width=660;c.height=520;const x=c.getContext('2d');x.fillStyle='#f3ecd9';x.fillRect(0,0,660,520);x.strokeStyle='#8a6d3b';x.lineWidth=5;x.strokeRect(14,14,632,492);
    x.fillStyle='#3b2f24';x.textAlign='center';x.textBaseline='middle';x.font='700 30px '+F;x.fillText(p.artTitle.replace(/[《》]/g,'').replace('示意图',''),330,70);x.font='400 17px '+S;x.fillText(p.portalName.replace(/^.*\\(|\\)$/g,''),330,108);
    x.strokeStyle='#3b2f24';x.lineWidth=3;x.font='600 22px '+S;(A[p.id]||function(x){const cs=(PIExpansion.wiki[p.id].concepts||[]).slice(0,4),n=cs.length;cs.forEach((c,i)=>{const a=i/n*TAU-Math.PI/2,cx=330+Math.cos(a)*190,cy=310+Math.sin(a)*120;x.beginPath();x.ellipse(cx,cy,100,40,0,0,TAU);x.stroke();x.fillText(c.term.length>9?c.term.slice(0,9):c.term,cx,cy);x.beginPath();x.moveTo(330,310);x.lineTo(cx-Math.cos(a)*100,cy-Math.sin(a)*40);x.globalAlpha=.4;x.stroke();x.globalAlpha=1;});x.beginPath();x.arc(330,310,10,0,TAU);x.fill();})(x);return c.toDataURL('image/jpeg',0.9);}
  return PIExpansion.philosophers.map(p=>({id:p.id,portrait:portrait(p),art:art(p)}));})()`;
const out = await ev(draw);
for (const o of out) { fs.writeFileSync('assets/portraits/' + o.id + '.jpg', Buffer.from(o.portrait.split(',')[1], 'base64')); fs.writeFileSync('assets/artworks/' + o.id + '.jpg', Buffer.from(o.art.split(',')[1], 'base64')); }
console.log('wrote', out.length * 2, 'images');
await send('Page.close'); ws.close();
