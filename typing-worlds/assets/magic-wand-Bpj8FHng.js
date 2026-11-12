import{v as e}from"./three-BDxTcmk4.js";import{n as t}from"./letter-world-CqP4RFHt.js";import{t as n}from"./particles-DjSZaIji.js";import{t as r}from"./tools-C-Fa8w2q.js";var i=[{id:`fairy`,label:`蓝精灵魔法`,color:6469375,glow:10409471,star:14085887},{id:`gold`,label:`金色咒语`,color:16765286,glow:16771743,star:16774863},{id:`rainbow`,label:`彩虹魔棒`,color:16743129,glow:8060159,star:16773370}];function a(a){let o=a.THREE,s=new e;a.scene.add(s);let c=i.find(e=>e.id===a.theme)??i[0];a.scene.background=new o.Color(791076),a.scene.fog=new o.Fog(791076,16,50),a.camera.position.set(0,.4,11),a.camera.lookAt(0,.35,0);let l=new o.AmbientLight(2635866,.9);s.add(l);let u=new o.DirectionalLight(11194623,1.1);u.position.set(4,8,6),s.add(u);let d=new n({capacity:900,gravity:[0,-.4,0],drag:1,size:.045,shape:`spark`,opacity:.95});s.add(d.points);let f=new o.Group,p=new o.CylinderGeometry(.04,.025,1.4,12);p.translate(0,.7,0),p.rotateZ(Math.PI/4);let m=new o.MeshStandardMaterial({color:4010058,roughness:.3,metalness:.7}),h=new o.Mesh(p,m);f.add(h);let g=new o.OctahedronGeometry(.09,0),_=new o.MeshBasicMaterial({color:c.glow}),v=new o.Mesh(g,_);v.position.set(0,0,0),f.add(v),f.position.set(5,3,.5),s.add(f);function y(e){return new o.ShaderMaterial({uniforms:{uProgress:{value:0},uGlow:{value:1},uColor:{value:new o.Color(e.color)},uCore:{value:new o.Color(e.glow)},uTime:{value:0}},vertexShader:`
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
        uniform float uGlow;
        uniform vec3 uColor;
        uniform vec3 uCore;
        uniform float uTime;
        varying float vU;
        varying vec3 vNormal;
        void main() {
          if (vU > uProgress) discard;
          float fresnel = 1.0 - abs(vNormal.z);
          float shimmer = 0.85 + 0.15 * sin(uTime * 8.0 + vU * 20.0);
          vec3 c = mix(uColor, uCore, pow(fresnel, 1.4)) * shimmer * uGlow;
          gl_FragColor = vec4(c, 1.0);
        }
      `,side:o.DoubleSide})}let b=new Map,x=new r(a.glyphs,a.layout,{count:1,liftHeight:.35,maxQueue:2,approach:.15,rest:()=>new o.Vector3(5,3,.5),restDelay:1});return{onCharacterInput(e){if(e.char===` `||e.char===`
`)return;let t=a.slotOf(e.id);if(!t)return;let n=a.glyphs.get(e.char,`sans`),r=a.glyphs.tube(n,.055,8,!0),i=y(c),l=new o.Mesh(r,i),u=new o.Group;a.layout.apply(u,t),u.add(l),s.add(u);let f={id:e.id,char:e.char,group:u,mesh:l,mat:i,drawn:+!!e.restoring,glow:1,erasing:!1,eraseProgress:0};if(i.uniforms.uProgress.value=f.drawn,b.set(e.id,f),e.restoring)return;let p=a.tempo.duration(420,160);x.write({id:e.id,glyph:n,slot:t,duration:p,onProgress:(e,t)=>{f.drawn=e.u,i.uniforms.uProgress.value=e.u,t&&e.down&&(d.emit({x:t.x,y:t.y,z:t.z+.05,vx:(Math.random()-.5)*.8,vy:.2+(Math.random()-.5)*.6,vz:.2+Math.random()*.4,life:.7+Math.random()*.3,size:1.2,color:c.star}),Math.random()<.35&&a.audio.play(`sparkle`,{pitch:1+Math.random()*.3,gain:.35}))},onDone:()=>{f.drawn=1,i.uniforms.uProgress.value=1}}),a.audio.play(`chime`,{pitch:1.1+Math.random()*.2,gain:.45}),a.keepAlive(1200)},onCharacterDelete(e){x.cancel(e.id);let t=b.get(e.id);if(!t)return;t.erasing=!0;let n=a.slotOf(e.id);if(n)for(let e=0;e<30;e++)d.emit({x:n.center.x+(Math.random()-.5)*.5,y:n.center.y+(Math.random()-.5)*.5,z:.1,vx:(Math.random()-.5)*2,vy:(Math.random()-.5)*2,vz:.5+Math.random()*1.5,life:.8,color:c.glow});a.audio.play(`pop`,{pitch:1.5,gain:.4}),a.keepAlive(600)},onLayout(){for(let[e,t]of b.entries()){let n=a.slotOf(e);n&&a.layout.apply(t.group,n)}},onWordComplete(e,t,n){x.flush(),a.audio.play(`success`,{gain:.8});for(let e of b.values())e.glow=2.4;n.then(e=>{e.ok||a.audio.play(`error`,{gain:.5})}),a.keepAlive(2e3)},onTextClear(){x.flush();for(let e of b.values())t(e.group);b.clear()},setTheme(e){c=i.find(t=>t.id===e)??i[0],_.color.set(c.glow);for(let e of b.values())e.mat.uniforms.uColor.value.set(c.color),e.mat.uniforms.uCore.value.set(c.glow)},updateAnimation(e,n){let r=!1;d.update(e,n)&&(r=!0),x.update(e)&&(r=!0);let i=x.tools[0];i&&(f.position.copy(i.tip),(i.job||i.queue.length||i.idle<1)&&(r=!0));for(let[i,a]of b.entries())if(a.mat.uniforms.uTime.value=n,a.glow>1&&(a.glow=Math.max(1,a.glow-e*2),a.mat.uniforms.uGlow.value=a.glow,r=!0),a.erasing){a.eraseProgress+=e*4.5;let n=a.eraseProgress;a.glow=Math.max(0,1-n),a.mat.uniforms.uGlow.value=a.glow,n>=1&&(t(a.group),b.delete(i)),r=!0}return r},disposeWorld(){x.flush();for(let e of b.values())t(e.group);b.clear(),d.dispose(),p.dispose(),m.dispose(),g.dispose(),_.dispose(),t(f),t(s)}}}var o={create:a};export{a as create,o as magicWand};