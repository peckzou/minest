import{k as e}from"./three-ya0QNlXk.js";import{i as t}from"./letter-world-BCGpD-0E.js";import{t as n}from"./tools-DdrFYiLM.js";function r(r){let i=r.THREE,a=new e;r.scene.add(a),r.scene.background=new i.Color(263693),r.scene.fog=new i.Fog(263693,14,45),r.camera.position.set(0,.4,11),r.camera.lookAt(0,.35,0);let o=new i.AmbientLight(1451584,1.2);a.add(o);let s=new i.DirectionalLight(5417727,1.8);s.position.set(6,12,8),a.add(s);let c=new i.Group,l=new i.Mesh(new i.CylinderGeometry(.04,.04,.4,10),new i.MeshStandardMaterial({color:3355448,metalness:.9,roughness:.2}));l.translateY(.2),l.rotateZ(-Math.PI/4),c.add(l);let u=new i.Mesh(new i.CylinderGeometry(.035,.035,1.4,12),new i.MeshBasicMaterial({color:5818367}));u.translateY(1),u.rotateZ(-Math.PI/4),c.add(u),c.position.set(5,4,.5),a.add(c);function d(){return new i.ShaderMaterial({uniforms:{uProgress:{value:0},uCore:{value:new i.Color(16777215)},uGlow:{value:new i.Color(3715327)},uPulse:{value:1}},vertexShader:`
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
        uniform vec3 uCore;
        uniform vec3 uGlow;
        uniform float uPulse;
        varying float vU;
        varying vec3 vNormal;
        void main() {
          if (vU > uProgress) discard;
          float fresnel = 1.0 - abs(vNormal.z);
          vec3 c = mix(uCore, uGlow, pow(fresnel, 0.9)) * (1.5 * uPulse);
          gl_FragColor = vec4(c, 1.0);
        }
      `,side:i.DoubleSide})}let f=new Map,p=new n(r.glyphs,r.layout,{count:1,liftHeight:.35,maxQueue:2,approach:.14,rest:()=>new i.Vector3(5,4,.5),restDelay:1});return{onCharacterInput(e){if(e.char===` `||e.char===`
`)return;let t=r.slotOf(e.id);if(!t)return;let n=r.glyphs.get(e.char,`sans`),o=r.glyphs.tube(n,.07,8,!0),s=d(),c=new i.Mesh(o,s),l=new i.Group;r.layout.apply(l,t),l.add(c),a.add(l);let u={id:e.id,char:e.char,group:l,mesh:c,mat:s,drawn:+!!e.restoring,pulse:1,erasing:!1,eraseK:0};if(s.uniforms.uProgress.value=u.drawn,f.set(e.id,u),e.restoring)return;let m=r.tempo.duration(420,160);p.write({id:e.id,glyph:n,slot:t,duration:m,onProgress:e=>{u.drawn=e.u,s.uniforms.uProgress.value=e.u},onDone:()=>{u.drawn=1,s.uniforms.uProgress.value=1}}),r.audio.play(`hum`,{pitch:1.6,gain:.4}),r.keepAlive(1400)},onCharacterDelete(e){p.cancel(e.id);let t=f.get(e.id);t&&(t.erasing=!0,r.audio.play(`zap`,{pitch:1.2,gain:.4}),r.keepAlive(600))},onLayout(){for(let[e,t]of f.entries()){let n=r.slotOf(e);n&&r.layout.apply(t.group,n)}},onWordComplete(e,t,n){p.flush(),r.audio.play(`zap`,{pitch:1.6,gain:.8});for(let e of f.values())e.pulse=2.5;n.then(e=>{e.ok||r.audio.play(`error`,{gain:.5})}),r.keepAlive(2e3)},onTextClear(){p.flush();for(let e of f.values())t(e.group);f.clear()},updateAnimation(e){let n=!1;p.update(e)&&(n=!0);let r=p.tools[0];r&&(c.position.copy(r.tip),(r.job||r.queue.length||r.idle<1)&&(n=!0));for(let[r,i]of f.entries())if(i.pulse>1&&(i.pulse=Math.max(1,i.pulse-e*3),i.mat.uniforms.uPulse.value=i.pulse,n=!0),i.erasing){i.eraseK+=e*4;let a=i.eraseK;i.group.scale.set(1-a,1-a,1-a),a>=1&&(t(i.group),f.delete(r)),n=!0}return n},disposeWorld(){p.flush();for(let e of f.values())t(e.group);f.clear(),t(c),t(a)}}}var i={create:r};export{r as create,i as lightsaber};