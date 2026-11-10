import React,{useEffect,useRef,useState} from 'react';
import {KineticWordStage,KINETIC_MODE_CATALOG,TypedCharItem,KineticVisualMode} from './components/KineticWordStage';
import {soundEngine,speakWord,SoundProfile} from './utils/soundEngine';
import {getKeyNormalizedPosition} from './components/InteractiveKeyboard';

type Bridge={draft():string;saveDraft(s:string):void;commit(v:{id:string;word:string;createdAt:number}):void;close():void};
export default function App({bridge}:{bridge:Bridge}){
 const [text,setText]=useState(()=>bridge.draft()),[mode,setMode]=useState<KineticVisualMode>('gummy'),[sound,setSound]=useState<SoundProfile>('mute'),[awake,setAwake]=useState(true),[status,setStatus]=useState(''),[banner,setBanner]=useState<any>(null),[pressed,setPressed]=useState<{key:string;timestamp:number}|null>(null),[chars,setChars]=useState<TypedCharItem[]>([]);
 const idle=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),bannerTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),input=useRef<HTMLTextAreaElement>(null),seq=useRef(0);
 function wake(){setAwake(true);clearTimeout(idle.current);idle.current=setTimeout(()=>setAwake(false),2400);}
 useEffect(()=>{wake();input.current?.focus();return()=>{clearTimeout(idle.current);clearTimeout(bannerTimer.current);};},[]);
 useEffect(()=>{setChars(old=>Array.from(text).slice(-64).map((char,i)=>{if(old[i]?.char===char)return old[i];const p=getKeyNormalizedPosition(char);return{id:'kf-'+(++seq.current),char,sourceX:p.x,sourceY:p.y,tilt:(Math.random()-.5)*8,velocityScore:1,variantSeed:Math.random()};}));},[text]);
 function change(v:string){setText(v);try{bridge.saveDraft(v);setStatus('');}catch(e){setStatus('草稿未保存，请保留页面并复制内容。');}setPressed({key:v.slice(-1),timestamp:Date.now()});if(sound!=='mute')soundEngine.playKeystroke(v.slice(-1),sound,0);setAwake(false);}
 function submit(){const word=text.trim();if(!word)return;try{bridge.commit({id:crypto.randomUUID(),word,createdAt:Date.now()});bridge.saveDraft('');setText('');setStatus('已保存到 Minest');setBanner({word,meaning:'',wpm:0});clearTimeout(bannerTimer.current);bannerTimer.current=setTimeout(()=>setBanner(null),1500);if(sound!=='mute')soundEngine.playWordForged(sound);input.current?.focus();}catch(e){setStatus('保存失败，内容仍保留，请重试或复制备份。');wake();}}
 return <main className={'kf-app '+(awake?'is-awake':'')} onPointerMove={wake} onPointerDown={wake}>
  <header className="kf-toolbar" onFocus={wake}><div><span className="kf-mark">KEYFLOW</span><span className="kf-title">律动录入</span></div><div className="kf-actions">
   <select aria-label="字母动态效果" value={mode} onChange={e=>setMode(e.target.value as KineticVisualMode)}>{KINETIC_MODE_CATALOG.map(m=><option key={m.id} value={m.id}>{m.label}</option>)}</select>
   <button aria-label={sound==='mute'?'开启录入声音':'关闭录入声音'} onClick={()=>setSound(s=>s==='mute'?'thock':'mute')}>{sound==='mute'?'静音':'声音'}</button>
   <button aria-label="关闭录入" onClick={bridge.close}>×</button></div></header>
  <div className="kf-canvas" onClick={e=>{if(!(e.target as HTMLElement).closest('button,input,textarea,select'))input.current?.focus();}}>
   <KineticWordStage workspaceMode="free" visualMode={mode} soundProfile={sound} typedChars={chars} targetVocab={null} customMeaning="" isEditingMeaning={false} onCustomMeaningChange={()=>{}} onToggleEditMeaning={()=>{}} onForgeCurrentWord={submit} onSpeakCurrent={()=>speakWord(text)} onPickRandomWord={()=>{}} onMorphAllLetters={()=>{}} onToggleSingleLetterSuper={id=>setChars(c=>c.map(v=>v.id===id?{...v,isSuper:!v.isSuper}:v))} onPluckLetter={id=>setChars(c=>c.map(v=>v.id===id?{...v,pluckedAt:Date.now()}:v))} errorShake={false} forgedBanner={banner} particles={[]} laserArcs={[]} wpm={0} combo={0} lastPressedKey={pressed}/>
   {!text&&!banner&&<div className="kf-empty" aria-hidden="true"><b>editing</b></div>}
  </div>
  <section className="kf-composer"><label className="sr-only" htmlFor="kf-input">录入内容</label><textarea ref={input} id="kf-input" value={text} placeholder="在这里输入…" rows={2} onChange={e=>change(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();submit();}if(e.key==='Escape'){e.preventDefault();wake();}}}/><button className="kf-submit" onClick={submit} disabled={!text.trim()} aria-label="保存录入内容">↵</button><p role="status">{status||'Enter 收录 · Shift + Enter 换行'}</p></section>
  <button className="kf-reveal" aria-label="显示录入工具栏" onClick={wake}>···</button>
 </main>;
}
