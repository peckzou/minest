import{v as e}from"./three-BDxTcmk4.js";import{n as t}from"./letter-world-CqP4RFHt.js";import{t as n}from"./tools-C-Fa8w2q.js";function r(r){let i=r.THREE,a=new e;r.scene.add(a),r.scene.background=new i.Color(131587),r.scene.fog=new i.Fog(131587,14,45),r.camera.position.set(0,.4,11),r.camera.lookAt(0,.35,0);let o=new i.AmbientLight(2236968,.6);a.add(o);let s=new i.SpotLight(16777215,3.5,30,Math.PI/4,.4);s.position.set(0,14,8),s.castShadow=r.quality>0,a.add(s);let c=new i.Mesh(new i.CylinderGeometry(14,14,.4,48),new i.MeshStandardMaterial({color:526346,roughness:.8,metalness:.2}));c.position.set(0,-2.5,0),a.add(c);let l=new i.Group,u=new i.Mesh(new i.CylinderGeometry(.06,.08,1.4,8),new i.MeshStandardMaterial({color:15658734,metalness:.9,roughness:.2}));u.translateY(.7),u.rotateZ(Math.PI/4),l.add(u);let d=new i.Mesh(new i.ConeGeometry(.04,.2,8),new i.MeshBasicMaterial({color:16777215}));d.translateY(-.1),l.add(d),l.position.set(5,4,.5),a.add(l);function f(){return new i.ShaderMaterial({uniforms:{uProgress:{value:0},uOpacity:{value:1}},vertexShader:`
        attribute float aU;
        varying float vU;
        varying vec3 vNormal;
        void main() {
          vU = aU;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,fragmentShader:`
        uniform float uProgress;
        uniform float uOpacity;
        varying float vU;
        varying vec3 vNormal;
        void main() {
          if (vU > uProgress) discard;
          float fresnel = 1.0 - abs(vNormal.z);
          vec3 c = mix(vec3(0.95), vec3(1.0), fresnel);
          gl_FragColor = vec4(c, uOpacity);
        }
      `,side:i.DoubleSide})}let p=new Map,m=new n(r.glyphs,r.layout,{count:1,liftHeight:.35,maxQueue:2,approach:.16,rest:()=>new i.Vector3(5,4,.5),restDelay:1});return{onCharacterInput(e){if(e.char===` `||e.char===`
`)return;let t=r.slotOf(e.id);if(!t)return;let n=r.glyphs.get(e.char,`sans`),o=r.glyphs.tube(n,.08,10,!0),s=f(),c=new i.Mesh(o,s),l=new i.Group;r.layout.apply(l,t),l.add(c),a.add(l);let u={id:e.id,char:e.char,group:l,mesh:c,mat:s,progress:+!!e.restoring,erasing:!1,eraseK:0};if(s.uniforms.uProgress.value=u.progress,p.set(e.id,u),e.restoring)return;let d=r.tempo.duration(480,200);m.write({id:e.id,glyph:n,slot:t,duration:d,onProgress:(e,t)=>{u.progress=e.u,s.uniforms.uProgress.value=e.u,t&&e.down&&Math.random()<.2&&r.audio.play(`tick`,{pitch:1.8,gain:.25})},onDone:()=>{u.progress=1,s.uniforms.uProgress.value=1}}),r.audio.play(`hum`,{pitch:1.4,gain:.3}),r.keepAlive(1600)},onCharacterDelete(e){m.cancel(e.id);let t=p.get(e.id);t&&(t.erasing=!0,r.audio.play(`zap`,{pitch:1.5,gain:.4}),r.keepAlive(600))},onLayout(){for(let[e,t]of p.entries()){let n=r.slotOf(e);n&&r.layout.apply(t.group,n)}},onWordComplete(e,t,n){m.flush(),r.audio.play(`success`,{gain:.7}),n.then(e=>{e.ok||r.audio.play(`error`,{gain:.5})}),r.keepAlive(2e3)},onTextClear(){m.flush();for(let e of p.values())t(e.group);p.clear()},updateAnimation(e){let n=!1;m.update(e)&&(n=!0);let r=m.tools[0];r&&(l.position.copy(r.tip),(r.job||r.queue.length||r.idle<1)&&(n=!0));for(let[r,i]of p.entries())if(i.erasing){i.eraseK+=e*4;let a=i.eraseK;i.mat.uniforms.uOpacity.value=Math.max(0,1-a),a>=1&&(t(i.group),p.delete(r)),n=!0}return n},disposeWorld(){m.flush();for(let e of p.values())t(e.group);p.clear(),t(l),t(c),t(a)}}}var i={create:r};export{r as create,i as genesisLab};