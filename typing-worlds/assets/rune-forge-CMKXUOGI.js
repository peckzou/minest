import{v as e}from"./three-BDxTcmk4.js";import{n as t}from"./letter-world-CqP4RFHt.js";function n(n){let r=n.THREE,i=new e;n.scene.add(i),n.scene.background=new r.Color(659479),n.scene.fog=new r.Fog(659479,14,48),n.camera.position.set(0,.4,11),n.camera.lookAt(0,.35,0);let a=new r.AmbientLight(2637909,1);i.add(a);let o=new r.DirectionalLight(7000319,1.6);o.position.set(6,12,8),i.add(o);let s=new r.MeshStandardMaterial({color:2239027,roughness:.8,metalness:.2});function c(){return new r.ShaderMaterial({uniforms:{uProgress:{value:0},uColor:{value:new r.Color(5425663)},uGlow:{value:1}},vertexShader:`
        attribute float aU;
        varying float vU;
        void main() {
          vU = aU;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,fragmentShader:`
        uniform float uProgress;
        uniform vec3 uColor;
        uniform float uGlow;
        varying float vU;
        void main() {
          if (vU > uProgress) discard;
          gl_FragColor = vec4(uColor * (1.8 * uGlow), 1.0);
        }
      `,side:r.DoubleSide})}let l=new Map;return{onCharacterInput(e){if(e.char===` `||e.char===`
`)return;let t=n.slotOf(e.id);if(!t)return;let a=n.glyphs.get(e.char,`sans`),o=n.glyphs.tube(a,.065,8,!0),u=new r.Mesh(new r.BoxGeometry(1.2,1.5,.16),s);u.position.set(t.advance/t.size/2,.5,-.1);let d=c(),f=new r.Mesh(o,d),p=new r.Group;n.layout.apply(p,t),p.add(u),p.add(f),i.add(p);let m={id:e.id,char:e.char,group:p,slabMesh:u,glowMesh:f,mat:d,charge:+!!e.restoring,erasing:!1,eraseK:0};d.uniforms.uProgress.value=m.charge,l.set(e.id,m),e.restoring||n.audio.play(`zap`,{pitch:1.4,gain:.5}),n.keepAlive(1400)},onCharacterDelete(e){let t=l.get(e.id);t&&(t.erasing=!0,n.audio.play(`pop`,{pitch:.9,gain:.5}),n.keepAlive(600))},onLayout(){for(let[e,t]of l.entries()){let r=n.slotOf(e);r&&n.layout.apply(t.group,r)}},onWordComplete(e,t,r){n.audio.play(`chime`,{pitch:1.2,gain:.9});for(let e of l.values())e.mat.uniforms.uGlow.value=2.8;r.then(e=>{e.ok||n.audio.play(`error`,{gain:.5})}),n.keepAlive(2e3)},onTextClear(){for(let e of l.values())t(e.group);l.clear()},updateAnimation(e,n){let r=!1;for(let[i,a]of l.entries())if(a.erasing){a.eraseK+=e*4;let n=a.eraseK;a.group.scale.set(1-n,1-n,1-n),n>=1&&(t(a.group),l.delete(i)),r=!0}else a.charge<1&&(a.charge=Math.min(1,a.charge+e*4),a.mat.uniforms.uProgress.value=a.charge,r=!0),a.mat.uniforms.uGlow.value>1&&(a.mat.uniforms.uGlow.value=Math.max(1,a.mat.uniforms.uGlow.value-e*2),r=!0),a.group.position.y=Math.sin(n*2+a.id)*.03,r=!0;return r},disposeWorld(){for(let e of l.values())t(e.group);l.clear(),s.dispose(),t(i)}}}var r={create:n};export{n as create,r as runeForge};