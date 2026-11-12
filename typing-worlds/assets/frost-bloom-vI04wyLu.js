import{v as e}from"./three-BDxTcmk4.js";import{n as t}from"./letter-world-CqP4RFHt.js";import{t as n}from"./particles-DjSZaIji.js";function r(r){let i=r.THREE,a=new e;r.scene.add(a),r.scene.background=new i.Color(924457),r.scene.fog=new i.Fog(924457,14,48),r.camera.position.set(0,.4,11),r.camera.lookAt(0,.35,0);let o=new i.AmbientLight(7582425,.9);a.add(o);let s=new i.DirectionalLight(14480639,1.6);s.position.set(6,12,8),a.add(s);let c=new n({capacity:600,gravity:[0,-.8,0],drag:.8,size:.04,shape:`flake`,opacity:.85});a.add(c.points);function l(){return new i.ShaderMaterial({uniforms:{uProgress:{value:0},uColor:{value:new i.Color(11725055)},uIceColor:{value:new i.Color(16777215)},uOpacity:{value:.95}},vertexShader:`
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
        uniform vec3 uColor;
        uniform vec3 uIceColor;
        uniform float uOpacity;
        varying float vU;
        varying vec3 vNormal;
        void main() {
          if (vU > uProgress) discard;
          float fresnel = 1.0 - abs(vNormal.z);
          vec3 c = mix(uColor, uIceColor, pow(fresnel, 1.2));
          gl_FragColor = vec4(c, uOpacity);
        }
      `,transparent:!0,side:i.DoubleSide})}let u=new Map;return{onCharacterInput(e){if(e.char===` `||e.char===`
`)return;let t=r.slotOf(e.id);if(!t)return;let n=r.glyphs.get(e.char,`sans`),o=r.glyphs.tube(n,.075,8,!0),s=l(),d=new i.Mesh(o,s),f=new i.Group;r.layout.apply(f,t),f.add(d),a.add(f);let p={id:e.id,char:e.char,group:f,mesh:d,mat:s,growth:+!!e.restoring,erasing:!1,eraseK:0};if(s.uniforms.uProgress.value=p.growth,u.set(e.id,p),!e.restoring){r.audio.play(`crack`,{pitch:1.3+Math.random()*.2,gain:.45});let e=t.center.x,n=t.center.y;for(let t=0;t<14;t++)c.emit({x:e+(Math.random()-.5)*.4,y:n+(Math.random()-.5)*.4,z:.1,vx:(Math.random()-.5)*.8,vy:(Math.random()-.5)*.8,vz:.2+Math.random()*.4,life:.8,color:14677759})}r.keepAlive(1400)},onCharacterDelete(e){let t=u.get(e.id);t&&(t.erasing=!0,r.audio.play(`pop`,{pitch:1.4,gain:.4}),r.keepAlive(600))},onLayout(){for(let[e,t]of u.entries()){let n=r.slotOf(e);n&&r.layout.apply(t.group,n)}},onWordComplete(e,t,n){r.audio.play(`sparkle`,{pitch:1.1,gain:.7});for(let e of u.values())e.mat.uniforms.uIceColor.value.set(16777215);n.then(e=>{e.ok||r.audio.play(`error`,{gain:.5})}),r.keepAlive(2e3)},onTextClear(){for(let e of u.values())t(e.group);u.clear()},updateAnimation(e,n){let r=!1;c.update(e,n)&&(r=!0);for(let[n,i]of u.entries())if(i.erasing){i.eraseK+=e*4;let a=i.eraseK;i.mat.uniforms.uOpacity.value=Math.max(0,.95*(1-a)),a>=1&&(t(i.group),u.delete(n)),r=!0}else i.growth<1&&(i.growth=Math.min(1,i.growth+e*3.8),i.mat.uniforms.uProgress.value=i.growth,r=!0);return r},disposeWorld(){for(let e of u.values())t(e.group);u.clear(),c.dispose(),t(a)}}}var i={create:r};export{r as create,i as frostBloom};