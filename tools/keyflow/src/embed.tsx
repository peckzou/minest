import React from 'react';
import {createRoot,Root} from 'react-dom/client';
import App from './App';
import css from './compiled.css';
let root:Root|null=null;
(window as any).MinestKeyflowApp={mount(host:HTMLElement,bridge:any){const shadow=host.shadowRoot||host.attachShadow({mode:'open'});shadow.replaceChildren();const style=document.createElement('style');style.textContent=css;const el=document.createElement('div');shadow.append(style,el);root=createRoot(el);root.render(<App bridge={bridge}/>);},unmount(){root?.unmount();root=null;}};
