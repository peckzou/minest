import{k as e}from"./three-C_Sr3VD5.js";import{i as t}from"./letter-world-DYNBrlqm.js";import{t as n}from"./tools-rjYQ4lAp.js";function r(r){let i=r.THREE,a=new e;r.scene.add(a),r.scene.background=new i.Color(131587),r.scene.fog=new i.FogExp2(131587,.05),r.camera.position.set(0,.4,11),r.camera.lookAt(0,.35,0),a.add(new i.HemisphereLight(7308968,461068,.35));let o=new i.DirectionalLight(9085128,.5);o.position.set(-7,10,6),a.add(o);let s=new i.Mesh(new i.PlaneGeometry(80,40),new i.MeshStandardMaterial({color:460811,roughness:.55,metalness:.3}));s.rotation.x=-Math.PI/2,s.position.y=-1.6,a.add(s);let c=new i.Mesh(new i.PlaneGeometry(80,.025),new i.MeshBasicMaterial({color:1711912}));c.rotation.x=-Math.PI/2,c.position.set(0,-1.596,0),a.add(c);let l=new i.Group,u=new i.Mesh(new i.CylinderGeometry(.04,.04,.4,10),new i.MeshStandardMaterial({color:3355448,metalness:.9,roughness:.2}));u.translateY(.2),u.rotateZ(-Math.PI/4),l.add(u);let d=new i.Mesh(new i.CylinderGeometry(.035,.035,1.4,12),new i.MeshBasicMaterial({color:5818367}));d.translateY(1),d.rotateZ(-Math.PI/4),l.add(d),l.position.set(5,4,.5),a.add(l);function f(){return new i.ShaderMaterial({uniforms:{uProgress:{value:0},uCore:{value:new i.Color(16777215)},uGlow:{value:new i.Color(3715327)},uPulse:{value:1}},vertexShader:`
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
          vec3 c = mix(uCore, uGlow, 0.35 + 0.65 * pow(fresnel, 0.55)) * (1.0 * uPulse);
          gl_FragColor = vec4(c, 1.0);
        }
      `,side:i.DoubleSide})}let p=new Map,m=new n(r.glyphs,r.layout,{count:1,liftHeight:.35,maxQueue:2,approach:.14,rest:()=>new i.Vector3(5,4,.5),restDelay:1});return{onCharacterInput(e){if(e.char===` `||e.char===`
`)return;let t=r.slotOf(e.id);if(!t)return;let n=r.glyphs.get(e.char,`sans`),o=r.glyphs.tube(n,.07,8,!0),s=f(),c=new i.Mesh(o,s),l=new i.Group;r.layout.apply(l,t),l.add(c),a.add(l);let u={id:e.id,char:e.char,group:l,mesh:c,mat:s,drawn:+!!e.restoring,pulse:1,erasing:!1,eraseK:0};if(s.uniforms.uProgress.value=u.drawn,p.set(e.id,u),e.restoring)return;let d=r.tempo.duration(420,160);m.write({id:e.id,glyph:n,slot:t,duration:d,onProgress:e=>{u.drawn=e.u,s.uniforms.uProgress.value=e.u},onDone:()=>{u.drawn=1,s.uniforms.uProgress.value=1}}),r.audio.play(`hum`,{pitch:1.6,gain:.4}),r.keepAlive(1400)},onCharacterDelete(e){m.cancel(e.id);let t=p.get(e.id);t&&(t.erasing=!0,r.audio.play(`zap`,{pitch:1.2,gain:.4}),r.keepAlive(600))},onLayout(){for(let[e,t]of p.entries()){let n=r.slotOf(e);n&&r.layout.apply(t.group,n)}},onWordComplete(e,t,n){m.flush(),r.audio.play(`zap`,{pitch:1.6,gain:.8});for(let e of p.values())e.pulse=2.5;n.then(e=>{e.ok||r.audio.play(`error`,{gain:.5})}),r.keepAlive(2e3)},onTextClear(){m.flush();for(let e of p.values())t(e.group);p.clear()},updateAnimation(e){let n=!1;m.update(e)&&(n=!0);let r=m.tools[0];r&&(l.position.copy(r.tip),(r.job||r.queue.length||r.idle<1)&&(n=!0));for(let[r,i]of p.entries())if(i.pulse>1&&(i.pulse=Math.max(1,i.pulse-e*3),i.mat.uniforms.uPulse.value=i.pulse,n=!0),i.erasing){i.eraseK+=e*4;let a=i.eraseK;i.group.scale.set(1-a,1-a,1-a),a>=1&&(t(i.group),p.delete(r)),n=!0}return n},disposeWorld(){m.flush();for(let e of p.values())t(e.group);p.clear(),t(l),t(a)}}}var i={create:r};export{r as create,i as lightsaber};