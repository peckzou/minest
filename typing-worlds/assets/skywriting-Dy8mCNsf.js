import{v as e,y as t}from"./three-BDxTcmk4.js";import{n}from"./letter-world-CqP4RFHt.js";import{t as r}from"./particles-DjSZaIji.js";import{t as i}from"./tools-C-Fa8w2q.js";function a(a){let o=a.THREE,s=new e;a.scene.add(s),a.scene.background=new o.Color(5744370),a.scene.fog=new o.Fog(5744370,25,75),a.camera.position.set(0,.4,11),a.camera.lookAt(0,.35,0);let c=new o.AmbientLight(16777215,1.2);s.add(c);let l=new o.DirectionalLight(16775406,1.4);l.position.set(8,16,10),s.add(l);let u=new r({capacity:1200,gravity:[0,.1,0],drag:.6,size:.08,shape:`flake`,opacity:.6});s.add(u.points);let d=new o.Group,f=[];function p(e){let t=new o.Group,n=new o.Mesh(new o.ConeGeometry(.08,.5,6),new o.MeshStandardMaterial({color:e}));n.rotation.x=Math.PI/2,t.add(n);let r=new o.Mesh(new o.BoxGeometry(.7,.02,.14),new o.MeshStandardMaterial({color:16777215}));r.position.set(0,0,.05),t.add(r);let i=new o.Mesh(new o.BoxGeometry(.24,.02,.08),new o.MeshStandardMaterial({color:e}));i.position.set(0,0,-.2),t.add(i);let a=new o.Mesh(new o.BoxGeometry(.02,.12,.08),new o.MeshStandardMaterial({color:e}));return a.position.set(0,.06,-.2),t.add(a),t}let m=[16726832,16763904,31487];for(let e=0;e<3;e++){let t=p(m[e]);t.position.set((e-1)*3,6,-2),d.add(t),f.push(t)}s.add(d);function h(){return new o.ShaderMaterial({uniforms:{uProgress:{value:0},uOpacity:{value:.85}},vertexShader:`
        attribute float aU;
        varying float vU;
        varying vec2 vPos;
        void main() {
          vU = aU;
          vPos = position.xy;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,fragmentShader:`
        uniform float uProgress;
        uniform float uOpacity;
        varying float vU;
        varying vec2 vPos;
        void main() {
          if (vU > uProgress) discard;
          float n = fract(sin(dot(vPos ,vec2(12.9898,78.233))) * 43758.5453);
          float alpha = smoothstep(0.0, 0.1, uProgress - vU) * (0.8 + n * 0.2);
          gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * uOpacity);
        }
      `,transparent:!0,depthWrite:!1,side:o.DoubleSide})}let g=new Map,_=new i(a.glyphs,a.layout,{count:3,liftHeight:.4,maxQueue:2,approach:.2,rest:e=>new o.Vector3((e-1)*4,5,.5),restDelay:1.2});return{onCharacterInput(e){if(e.char===` `||e.char===`
`)return;let t=a.slotOf(e.id);if(!t)return;let n=a.glyphs.get(e.char,`sans`),r=a.glyphs.ribbon(n,.12),i=h(),c=new o.Mesh(r,i),l=new o.Group;a.layout.apply(l,t),l.add(c),s.add(l);let d={id:e.id,char:e.char,group:l,mesh:c,mat:i,drawn:+!!e.restoring,erasing:!1,eraseK:0};if(i.uniforms.uProgress.value=d.drawn,g.set(e.id,d),e.restoring)return;let f=a.tempo.duration(480,200);_.write({id:e.id,glyph:n,slot:t,duration:f,onProgress:(e,t)=>{d.drawn=e.u,i.uniforms.uProgress.value=e.u,t&&e.down&&Math.random()<.6&&u.emit({x:t.x,y:t.y,z:t.z,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,vz:(Math.random()-.5)*.2,life:1.5,size:1.2,color:16777215})},onDone:()=>{d.drawn=1,i.uniforms.uProgress.value=1}}),a.audio.play(`whoosh`,{pitch:1.4,gain:.4}),a.keepAlive(1600)},onCharacterDelete(e){_.cancel(e.id);let t=g.get(e.id);t&&(t.erasing=!0,a.audio.play(`whoosh`,{pitch:.8,gain:.4}),a.keepAlive(700))},onLayout(){for(let[e,t]of g.entries()){let n=a.slotOf(e);n&&a.layout.apply(t.group,n)}},onWordComplete(e,t,n){_.flush(),a.audio.play(`success`,{gain:.8}),f.forEach((e,t)=>{e.position.set(-14+t*2,.4+t*.6,1)}),n.then(e=>{e.ok||a.audio.play(`error`,{gain:.5})}),a.keepAlive(2500)},onTextClear(){_.flush();for(let e of g.values())n(e.group);g.clear()},updateAnimation(e,r){let i=!1;u.update(e,r)&&(i=!0),_.update(e)&&(i=!0),_.tools.forEach((e,n)=>{let r=f[n];if(!r)return;r.position.copy(e.tip);let a=t.clamp(e.vel.x*.15,-.6,.6);r.rotation.z=-a,r.rotation.y=Math.atan2(e.vel.x,e.vel.y||.01)*.3,(e.job||e.queue.length||e.idle<1)&&(i=!0)});for(let[t,r]of g.entries())if(r.erasing){r.eraseK+=e*3.5;let a=r.eraseK;r.mat.uniforms.uOpacity.value=Math.max(0,.85*(1-a)),a>=1&&(n(r.group),g.delete(t)),i=!0}return i},disposeWorld(){_.flush();for(let e of g.values())n(e.group);g.clear(),u.dispose(),n(d),n(s)}}}var o={create:a};export{a as create,o as skywriting};