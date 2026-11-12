import{v as e}from"./three-BDxTcmk4.js";import{n as t,t as n}from"./letter-world-CqP4RFHt.js";function r(r){let i=r.THREE,a=new e;r.scene.add(a),r.scene.background=new i.Color(1708555),r.scene.fog=new i.Fog(1708555,14,45),r.camera.position.set(0,.4,11),r.camera.lookAt(0,.35,0);let o=new i.AmbientLight(16772568,1);a.add(o);let s=new i.PointLight(16754740,2.5,20);s.position.set(-6,2,4),a.add(s);let c=n(512,512,(e,t,n)=>{e.fillStyle=`#edd7b6`,e.fillRect(0,0,t,n);for(let r=0;r<25e3;r++)e.fillStyle=`rgba(130,90,50,${Math.random()*.04})`,e.fillRect(Math.random()*t,Math.random()*n,2,2)}),l=new i.Mesh(new i.PlaneGeometry(16,9.5),new i.MeshStandardMaterial({map:c,roughness:.9}));l.position.set(0,.35,-.05),a.add(l);let u=new i.Group,d=new i.Mesh(new i.CylinderGeometry(.2,.2,1.2,12),new i.MeshStandardMaterial({color:16446174,roughness:.5}));d.translateY(.6);let f=new i.Mesh(new i.OctahedronGeometry(.12,0),new i.MeshBasicMaterial({color:16754740}));f.position.set(0,1.3,0),u.add(d),u.add(f),u.position.set(-6.5,-3.2,.5),a.add(u);function p(){return new i.ShaderMaterial({uniforms:{uProgress:{value:0},uHeatColor:{value:new i.Color(16761415)},uInkColor:{value:new i.Color(4860436)},uOpacity:{value:.95}},vertexShader:`
        attribute float aU;
        varying float vU;
        void main() {
          vU = aU;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,fragmentShader:`
        uniform float uProgress;
        uniform vec3 uHeatColor;
        uniform vec3 uInkColor;
        uniform float uOpacity;
        varying float vU;
        void main() {
          if (vU > uProgress) discard;
          float heatK = smoothstep(0.0, 0.25, uProgress - vU);
          vec3 c = mix(uHeatColor, uInkColor, heatK);
          gl_FragColor = vec4(c, uOpacity);
        }
      `,transparent:!0,side:i.DoubleSide})}let m=new Map;return{onCharacterInput(e){if(e.char===` `||e.char===`
`)return;let t=r.slotOf(e.id);if(!t)return;let n=r.glyphs.get(e.char,`script`),o=r.glyphs.ribbon(n,.08),s=p(),c=new i.Mesh(o,s),l=new i.Group;r.layout.apply(l,t),l.add(c),a.add(l);let u={id:e.id,char:e.char,group:l,mesh:c,mat:s,heat:+!!e.restoring,erasing:!1,eraseK:0};s.uniforms.uProgress.value=u.heat,m.set(e.id,u),e.restoring||r.audio.play(`sparkle`,{pitch:1.4,gain:.4}),r.keepAlive(1400)},onCharacterDelete(e){let t=m.get(e.id);t&&(t.erasing=!0,r.audio.play(`pop`,{pitch:.8,gain:.4}),r.keepAlive(600))},onLayout(){for(let[e,t]of m.entries()){let n=r.slotOf(e);n&&r.layout.apply(t.group,n)}},onWordComplete(e,t,n){r.audio.play(`success`,{gain:.7}),t.forEach((e,t)=>{let n=m.get(e.id);n&&r.setTimeout(()=>{n.mat.uniforms.uHeatColor.value.set(16773290)},t*70)}),n.then(e=>{e.ok||r.audio.play(`error`,{gain:.5})}),r.keepAlive(2e3)},onTextClear(){for(let e of m.values())t(e.group);m.clear()},updateAnimation(e,n){let r=!1;f.scale.set(1+Math.sin(n*12)*.15,1+Math.cos(n*10)*.2,1),s.intensity=2.4+Math.sin(n*14)*.2,r=!0;for(let[n,i]of m.entries())if(i.erasing){i.eraseK+=e*4;let a=i.eraseK;i.mat.uniforms.uOpacity.value=Math.max(0,.95*(1-a)),a>=1&&(t(i.group),m.delete(n)),r=!0}else i.heat<1&&(i.heat=Math.min(1,i.heat+e*3.4),i.mat.uniforms.uProgress.value=i.heat,r=!0);return r},disposeWorld(){for(let e of m.values())t(e.group);m.clear(),c.dispose(),t(u),t(l),t(a)}}}var i={create:r};export{r as create,i as invisibleInk};