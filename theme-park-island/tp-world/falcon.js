/* Minest My World · "Millennium Falcon: Smugglers Run" — full attraction rebuild (`falcon.js`)
 * One continuous experience staged in a private show volume high above Batuu:
 *   briefing with Hondo Ohnaka -> boarding tunnel -> main hold (Dejarik table) -> ring corridor -> cockpit ->
 *   lift-off through the Black Spire -> hyperspace -> Corellia shipyard run -> coaxium train harpoon heist ->
 *   Star Destroyer escape -> hyperspace -> landing on Docking Bay 5 and Hondo's payout.
 * Pilots steer (WASD / arrows), gunners fire (Space, auto-assisted aim), the lever is H. An autopilot takes over
 * when nobody steers, so the ride also works hands-off. Sets: falcon-sets.js. Audio: falcon-audio.js. */
(function (root) {
  'use strict';

  function build(T, group, o) {
    const S = root.TPFalconSets.create(T);
    const audio = root.TPFalconAudio ? root.TPFalconAudio.create() : null;
    const PI = Math.PI, MX = o.x, MY = 900, MZ = o.z;
    const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const sm = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
    const bump = (t, a, b) => sm((t - a) / 1.2) * (1 - sm((t - b + 1.2) / 1.2));
    const rand = Math.random;

    const mission = new T.Group(); mission.position.set(MX, MY, MZ); mission.visible = false; group.add(mission);
    const ship = S.buildInterior(), E = S.buildEnv();
    mission.add(E.grp); mission.add(ship.grp);
    const EXT = S.EXT, INT = S.INT;

    /* ---------------------------------------------------------------- sky / lighting presets */
    const SKY = {
      batuu:    { top: [0.16, 0.2, 0.42], hor: [0.98, 0.56, 0.26], bot: [0.36, 0.22, 0.15], sun: [1, 0.72, 0.38], fogC: [0.86, 0.5, 0.28], key: [1, 0.82, 0.62], amb: [0.42, 0.37, 0.4], gnd: [0.42, 0.33, 0.24], fog: 0.0036, stars: 0.08 },
      corellia: { top: [0.1, 0.14, 0.2], hor: [0.5, 0.47, 0.43], bot: [0.1, 0.13, 0.16], sun: [0.6, 0.36, 0.2], fogC: [0.38, 0.38, 0.38], key: [0.9, 0.86, 0.8], amb: [0.3, 0.33, 0.38], gnd: [0.12, 0.16, 0.19], fog: 0.0046, stars: 0 },
      space:    { top: [0.008, 0.012, 0.035], hor: [0.012, 0.018, 0.05], bot: [0.008, 0.012, 0.035], sun: [0, 0, 0], fogC: [0.01, 0.015, 0.04], key: [1, 1, 0.98], amb: [0.2, 0.22, 0.28], gnd: [0.02, 0.02, 0.03], fog: 0, stars: 1 },
      veil:     { top: [0.008, 0.012, 0.035], hor: [0.012, 0.018, 0.05], bot: [0.008, 0.012, 0.035], sun: [0, 0, 0], fogC: [0.01, 0.015, 0.04], key: [1, 1, 0.98], amb: [0.2, 0.22, 0.28], gnd: [0.02, 0.02, 0.03], fog: 0.02, stars: 0.7 }
    };
    const SKEYS = ['top', 'hor', 'bot', 'sun', 'fogC', 'key', 'amb', 'gnd'];
    const cur = JSON.parse(JSON.stringify(SKY.batuu));
    let skyTarget = 'batuu', skyRate = 2;
    function skyTo(name, rate, snap) {
      skyTarget = name; skyRate = rate || 2;
      if (snap) { const t = SKY[name]; SKEYS.forEach((k) => { cur[k] = t[k].slice(); }); cur.fog = t.fog; cur.stars = t.stars; }
    }
    function skyStep(dt) {
      const t = SKY[skyTarget], k = 1 - Math.exp(-dt * skyRate);
      SKEYS.forEach((key) => { for (let i = 0; i < 3; i++) cur[key][i] += (t[key][i] - cur[key][i]) * k; });
      cur.fog += (t.fog - cur.fog) * k; cur.stars += (t.stars - cur.stars) * k;
      E.domeU.uTop.value.fromArray(cur.top); E.domeU.uHor.value.fromArray(cur.hor); E.domeU.uBot.value.fromArray(cur.bot); E.domeU.uSun.value.fromArray(cur.sun);
      EXT.uFogCol.value.fromArray(cur.fogC); EXT.uKeyCol.value.fromArray(cur.key); EXT.uAmb.value.fromArray(cur.amb); EXT.uFog.value = cur.fog;
      E.groundU.uCol.value.fromArray(cur.gnd); E.stars.material.opacity = cur.stars;
    }

    /* ---------------------------------------------------------------- state */
    const st = {
      active: false, running: false, ph: 'idle', pt: 0, sx: 0, sy: 0, tx: 0, ty: 0, roll: 0, idle: 9, shake: 0, inv: 0,
      hull: 100, kills: 0, coax: 0, D: 0, speed: 0, gy: -3.6, padZ: 0, cool: 0, side: 1, lock: 0, flash: 0, add: [0, 0, 0],
      said: {}, target: null, lastV: -1, warnT: 0, tieMax: 0, sdShot: 0, el: 0, veiled: false
    };
    const FLY = { launch: 1, lever1: 1, jump1: 1, hyper1: 1, corellia: 1, train: 1, escape: 1, lever2: 1, jump2: 1, hyper2: 1, approach: 1, descent: 1, landed: 1, done: 1 };
    const NAMES = { idle: '待命', board: '登船中', launch: '巴图星升空', lever1: '等待跃迁', jump1: '超空间跃迁', hyper1: '超空间跃迁', corellia: '科雷利亚造船厂',
                    train: '同轴燃料列车', escape: '歼星舰追击', lever2: '等待跃迁', jump2: '超空间跃迁', hyper2: '超空间跃迁', approach: '返航巴图', descent: '返航巴图', landed: '任务完成', done: '任务完成' };
    const C = (u) => 5 * Math.sin(u * 0.014) + 1.5 * Math.sin(u * 0.031 + 1.3);
    const dC = (u) => 0.07 * Math.cos(u * 0.014) + 0.0465 * Math.cos(u * 0.031 + 1.3);
    const RY = -9;
    const tmpA = new T.Vector3(), tmpB = new T.Vector3(), ZAX = new T.Vector3(0, 0, 1);
    const aim = (m, dx, dy, dz) => m.quaternion.setFromUnitVectors(ZAX, tmpA.set(dx, dy, dz).normalize());

    function say(key, msg, onEvent) { if (!st.said[key]) { st.said[key] = 1; if (onEvent) onEvent(msg); } }
    function placeSpire(s, canCollide, i) {
      s.col = canCollide && (i % 3 === 0);
      s.s = 0.8 + rand() * 0.5;
      s.x = s.col ? (rand() - 0.5) * 14 : (rand() < 0.5 ? -1 : 1) * (19 + rand() * 75);
      s.m.geometry = E.spireGeos[(rand() * 3) | 0]; s.m.scale.setScalar(s.s); s.m.rotation.y = rand() * 6;
      s.m.position.set(s.x, st.gy, s.z); // meshes otherwise stay at the origin (around the ship) until the first flight step
    }
    function setYard(y, v) { y.v = v; y.m.geometry = E.yardDefs[v].geo; }
    function nextVariant() { let v; do { v = (rand() * 5) | 0; } while (v === st.lastV); st.lastV = v; return v; }
    function show(list, on) { for (const it of list) (it.m || it).visible = on; }

    function setPhase(p, onEvent) {
      st.ph = p; st.pt = 0;
      const batuu = p === 'board' || p === 'launch' || p === 'descent' || p === 'landed';
      const yard = p === 'corellia' || p === 'train' || p === 'escape';
      const train = p === 'train' || p === 'escape';
      const hyper = p === 'hyper1' || p === 'hyper2';
      ship.board.visible = p === 'board';
      show(E.spires, batuu); E.pad.visible = batuu;
      show(E.yard, yard); E.ground.visible = batuu || yard;
      E.rail.visible = train; show(E.cars, train); show(E.pylons, train);
      E.conts.forEach((c) => { c.m.visible = train && c.state !== 'got'; });
      E.cable.visible = false; E.lockRing.visible = false;
      E.tunnel.visible = E.tunEnd.visible = hyper;
      E.streaks.visible = p === 'jump1' || p === 'jump2';
      E.stars.visible = !hyper;
      E.planet.visible = p === 'lever2' || p === 'jump2' || p === 'approach';
      E.sd.visible = p === 'corellia';
      E.grp.rotation.x = 0;
      st.tieMax = p === 'escape' ? 6 : (p === 'corellia' || p === 'train' ? 3 : 0);
      if (!st.tieMax) for (const t of E.ties) { t.on = false; t.m.visible = false; t.wait = rand() * 2; }
      if (audio) {
        audio.setMode({ board: 'mystery', launch: 'hero', lever1: 'calm', lever2: 'calm', jump1: 'calm', jump2: 'calm', hyper1: 'shimmer', hyper2: 'shimmer',
                        corellia: 'combat', train: 'combat', escape: 'combat', approach: 'calm', descent: 'hero', landed: 'hero', done: 'calm' }[p] || 'off');
      }

      if (p === 'board') {
        skyTo('batuu', 2, true); st.gy = -3.6; st.padZ = 0; st.speed = 0;
        E.pad.position.set(0, st.gy, st.padZ); E.ground.position.y = st.gy;
        E.spires.forEach((s, i) => { s.z = -70 - i * 45; placeSpire(s, false, i); });
      } else if (p === 'launch') {
        if (onEvent) onEvent('🚀 起飞！从黑尖塔 5 号停机坪升空——A/D 左右、W/S 升降躲开石化尖塔，空格开火');
      } else if (p === 'lever1' || p === 'lever2') {
        skyTo('space', 3);
        if (onEvent) onEvent(p === 'lever1' ? '⚡ 已脱离大气层！拉下超空间跃迁杆（按 H）——目的地：科雷利亚' : '⚡ 甩掉它们了！快拉跃迁杆（按 H）带着同轴燃料返回巴图！');
      } else if (p === 'jump1' || p === 'jump2') {
        if (audio) { audio.lever(); audio.hyperIn(); }
      } else if (hyper) {
        st.flash = 1;
      } else if (p === 'corellia') {
        st.flash = 1; if (audio) audio.hyperOut();
        skyTo('corellia', 2, true); st.gy = -70; st.speed = 62; st.lastV = -1;
        E.yard.forEach((y, i) => { y.z = -170 - i * 110; setYard(y, nextVariant()); });
        E.sd.scale.setScalar(1.5); E.sd.rotation.set(0, PI / 2 + 0.3, 0);
        if (onEvent) onEvent('🏭 抵达科雷利亚造船厂！对照橙色警示灯穿过龙门吊架——TIE 战机来袭，空格开火！');
      } else if (p === 'train') {
        E.conts.forEach((c) => { c.state = 'on'; c.t = 0; c.m.visible = true; });
        E.pylons.forEach((py, i) => { py.z = -400 + i * 50; });
        st.lock = 0;
        if (onEvent) onEvent('🚆 发现同轴燃料列车！飞到发光燃料罐正上方并保持对准，鱼叉锁定后会自动发射');
      } else if (p === 'escape') {
        skyTo('veil', 1.6); st.veiled = false; st.sdShot = 1;
        if (onEvent) onEvent('🚨 警报！第一秩序歼星舰出动了——拉升冲出大气层，从它腹部下方钻过去！');
      } else if (p === 'approach') {
        st.flash = 1; if (audio) audio.hyperOut();
        skyTo('space', 3, true);
        E.planetU.uA.value.set(0.08, 0.26, 0.3); E.planetU.uB.value.set(0.45, 0.4, 0.24); E.planetU.uAtm.value.set(0.5, 0.72, 0.95); E.planetU.uCity.value = 0;
        if (onEvent) onEvent('🪐 巴图星就在前方……准备进入大气层，返回黑尖塔前哨站');
      } else if (p === 'descent') {
        st.flash = 1; skyTo('batuu', 2, true); st.gy = -150; st.padZ = -285;
        E.spires.forEach((s, i) => { s.z = -40 - i * 45; placeSpire(s, false, i); });
      } else if (p === 'landed') {
        st.speed = 0;
        const credits = Math.max(500, st.coax * 4000 + st.kills * 300 - (100 - st.hull) * 45);
        const rank = st.coax === 2 && st.hull >= 70 ? '传奇走私者' : st.coax >= 1 ? '合格船员' : '实习船员（下次别空手回来）';
        const line = `干得漂亮！同轴燃料 ${st.coax} 罐，击落 ${st.kills} 架，船体还剩百分之 ${Math.round(st.hull)}。你的分成是 ${credits} 信用点。`;
        if (onEvent) onEvent(`🏆 千年隼号已降落 5 号停机坪！杭多评级：${rank} · 同轴燃料 ${st.coax}/2 · 击落 TIE ${st.kills} 架 · 船体 ${Math.round(st.hull)}% · 酬金 ${credits} 信用点`);
        if (audio) { audio.setAlarm(false); audio.speak(line); }
      }
    }

    function reset() {
      Object.assign(st, { sx: 0, sy: 0, tx: 0, ty: 0, roll: 0, idle: 9, shake: 0, inv: 0, hull: 100, kills: 0, coax: 0, D: 0, speed: 0, cool: 0, lock: 0, flash: 0, add: [0, 0, 0], said: {}, target: null });
      E.conts.forEach((c) => { c.state = 'on'; });
      for (const b of E.pBolts.concat(E.eBolts)) { b.on = false; b.m.visible = false; }
      for (const b of E.booms) { b.age = 9; b.m.visible = false; }
      ship.grp.position.set(0, 0, 0); ship.grp.rotation.z = 0;
      ship.PUc.uPow.value = 0; ship.PUc.uAlarm.value = ship.PUh.uAlarm.value = 0;
      if (audio) audio.setAlarm(false);
      setPhase('board');
    }

    /* ---------------------------------------------------------------- combat helpers */
    function hit(dmg, onEvent) {
      if (st.inv > 0) return;
      st.inv = 0.45; st.hull = Math.max(10, st.hull - dmg); st.shake = 1; st.add = [0.9, 0.22, 0.08];
      if (audio) audio.hit();
      say('hit', '💢 船体受损！注意躲避障碍与敌方火力——船体越完整，杭多给的酬金越高', onEvent);
      if (st.hull <= 40) { ship.PUc.uAlarm.value = ship.PUh.uAlarm.value = 1; if (audio) audio.setAlarm(true); say('alarm', '🔥 船体严重受损！驾驶舱警报响起', onEvent); }
    }
    function free(pool) { for (const b of pool) if (!b.on) return b; return null; }
    function launchBolt(b, ox, oy, oz, dx, dy, dz, speed) {
      const l = Math.hypot(dx, dy, dz) || 1;
      b.on = true; b.age = 0; b.vx = dx / l * speed; b.vy = dy / l * speed; b.vz = dz / l * speed;
      b.m.position.set(ox, oy, oz); b.m.visible = true;
      aim(b.m, dx, dy, dz);
    }
    function boom(x, y, z) {
      let b = E.booms[0]; for (const k of E.booms) if (k.age > b.age) b = k;
      b.age = 0; b.m.position.set(x, y, z); b.m.visible = true;
    }
    function fire(onEvent) {
      const p = st.ph;
      if (!st.active || !st.running || st.cool > 0 || !FLY[p] || p === 'jump1' || p === 'jump2' || p === 'hyper1' || p === 'hyper2' || p === 'landed' || p === 'done') return;
      const b = free(E.pBolts); if (!b) return;
      st.cool = 0.15; st.side = -st.side;
      const ox = st.sx + st.side * 1.3, oy = st.sy - 0.7, oz = -3, t = st.target;
      if (t) { const tt = Math.abs(t.z) / 280; launchBolt(b, ox, oy, oz, t.x - ox, t.y - oy, t.z + 95 * tt - oz, 280); }
      else launchBolt(b, ox, oy, oz, 0, 0, -1, 280);
      if (audio) audio.laser();
      if (p === 'launch') say('gun', '🔫 四联激光炮测试完毕！到了科雷利亚，准星变红即表示已锁定 TIE 战机', onEvent);
    }
    function hyperjump(onEvent) {
      if (!st.active || !st.running) return;
      if (st.ph === 'lever1') setPhase('jump1', onEvent);
      else if (st.ph === 'lever2') setPhase('jump2', onEvent);
      else if (FLY[st.ph] && st.warnT <= 0 && st.ph !== 'landed' && st.ph !== 'done') { st.warnT = 3; if (onEvent) onEvent('⚠️ 超空间引擎尚未充能——等杭多下令再拉跃迁杆！'); }
    }

    function stepTies(dt, onEvent) {
      st.target = null; let best = 0.42;
      E.ties.forEach((t, i) => {
        if (i >= st.tieMax) { t.on = false; t.m.visible = false; return; }
        if (!t.on) {
          t.m.visible = false;
          if ((t.wait -= dt) <= 0) {
            t.on = true; t.pass = false; t.z = -380 - rand() * 60; t.bx = (rand() - 0.5) * 70; t.by = (rand() - 0.3) * 26;
            t.ox = (rand() < 0.5 ? -1 : 1) * (4 + rand() * 4); t.oy = 1.5 + rand() * 3; t.cd = 0.5 + rand(); t.ph = rand() * 6;
          }
          return;
        }
        t.z += dt * 95;
        const k = clamp((t.z + 380) / 345, 0, 1), w = 1 - k * 0.65;
        t.x = lerp(t.bx, st.sx + t.ox, k) + Math.sin(st.el * 1.7 + t.ph) * 5 * w;
        t.y = lerp(t.by, st.sy + t.oy, k) + Math.cos(st.el * 1.3 + t.ph) * 3 * w;
        t.m.visible = true; t.m.position.set(t.x, t.y, t.z); t.m.rotation.z = Math.sin(st.el * 1.7 + t.ph) * 0.5;
        if (t.z < -12 && t.z > -330) { const ang = Math.hypot(t.x - st.sx, t.y - st.sy) / -t.z; if (ang < best) { best = ang; st.target = t; } }
        if ((t.cd -= dt) <= 0 && t.z < -80 && t.z > -320) {
          t.cd = 1.3 + rand() * 1.3;
          const b = free(E.eBolts);
          if (b) launchBolt(b, t.x, t.y - 0.7, t.z + 2, st.sx + (rand() - 0.5) * 3 - t.x, st.sy + (rand() - 0.5) * 3 - t.y, -t.z, 170);
        }
        if (!t.pass && t.z > -32) { t.pass = true; if (audio) audio.tie(); }
        if (t.z > 30) { t.on = false; t.wait = 0.8 + rand() * 2; }
      });
    }
    function stepBolts(dt, onEvent) {
      for (const b of E.pBolts) {
        if (!b.on) continue;
        b.age += dt; const p = b.m.position; p.x += b.vx * dt; p.y += b.vy * dt; p.z += b.vz * dt;
        for (const t of E.ties) {
          if (!t.on || !t.m.visible) continue;
          const dx = p.x - t.x, dy = p.y - t.y, dz = p.z - t.z;
          if (dx * dx + dy * dy + dz * dz < 16) {
            t.on = false; t.m.visible = false; t.wait = 1.5 + rand() * 2; b.age = 9; st.kills++;
            boom(t.x, t.y, t.z); if (audio) audio.boom();
            if (onEvent && (st.kills === 1 || st.kills % 3 === 0)) onEvent(`💥 命中！已击落 ${st.kills} 架第一秩序 TIE 战机`);
            break;
          }
        }
        if (b.age > 1.5) { b.on = false; b.m.visible = false; }
      }
      for (const b of E.eBolts) {
        if (!b.on) continue;
        b.age += dt; const p = b.m.position; p.x += b.vx * dt; p.y += b.vy * dt; p.z += b.vz * dt;
        if (Math.abs(p.z) < 3 && Math.hypot(p.x - st.sx, p.y - st.sy) < 1.7) { hit(5, onEvent); b.age = 9; }
        if (b.age > 4 || p.z > 25) { b.on = false; b.m.visible = false; }
      }
      for (const b of E.booms) {
        if (b.age > 0.6) { b.m.visible = false; continue; }
        b.age += dt; b.m.scale.setScalar(1 + b.age * 16); b.m.material.opacity = Math.max(0, 1 - b.age / 0.6);
      }
    }

    /* ---------------------------------------------------------------- scrolling sets */
    function stepSpires(dz, onEvent) {
      const canCol = st.ph === 'launch' && st.pt < 10.5;
      E.spires.forEach((s, i) => {
        const pz = s.z; s.z += dz;
        if (s.z > 40) { s.z -= 14 * 45; placeSpire(s, canCol, i); }
        if (s.col && pz < -2 && s.z >= -2) {
          const hrel = clamp((st.sy - st.gy) / (100 * s.s), 0, 1), r = 7 * s.s * (1 - 0.8 * hrel);
          if (st.sy - 1 < st.gy + 100 * s.s && Math.abs(st.sx - s.x) < r + 1.2) hit(10, onEvent);
        }
        s.m.position.set(s.x, st.gy, s.z);
      });
      st.padZ += dz; E.pad.position.set(0, st.gy, st.padZ); E.pad.visible = st.padZ < 120;
    }
    function stepYard(dz, onEvent) {
      const obstacles = st.ph === 'corellia' && st.pt < 11;
      for (const y of E.yard) {
        const pz = y.z; y.z += dz;
        if (y.z > 40) { y.z -= 5 * 110; setYard(y, obstacles ? nextVariant() : 5); }
        if (pz < -2 && y.z >= -2) {
          for (const c of E.yardDefs[y.v].col) if (st.sx + 1.2 > c[0] && st.sx - 1.2 < c[1] && st.sy + 0.9 > c[2] && st.sy - 0.9 < c[3]) hit(12, onEvent);
        }
        y.m.position.set(0, st.ph === 'escape' ? st.gy + 70 : 0, y.z);
      }
    }
    function stepTrain(dt, dz, onEvent) {
      const lift = st.ph === 'escape' ? st.gy + 70 : 0, ry = RY + lift;
      const tz = st.ph === 'train' ? lerp(-280, -32, sm(st.pt / 6)) : -32 - st.pt * 30;
      const rp = E.rp;
      for (let i = 0; i < E.NR; i++) {
        const z = -405 + i * 5, cx = C(z - st.D), a = i * 12;
        rp[a] = cx - 1.9; rp[a + 3] = cx - 1.4; rp[a + 6] = cx + 1.4; rp[a + 9] = cx + 1.9;
        rp[a + 1] = rp[a + 4] = rp[a + 7] = rp[a + 10] = ry; rp[a + 2] = rp[a + 5] = rp[a + 8] = rp[a + 11] = z;
      }
      E.rail.geometry.attributes.position.needsUpdate = true;
      for (const p of E.pylons) { p.z += dz; if (p.z > 40) p.z -= 450; p.m.position.set(C(p.z - st.D), ry, p.z); }
      E.cars.forEach((m, k) => { const z = tz - k * 12.5; m.position.set(C(z - st.D), ry, z); m.rotation.y = Math.atan(dC(z - st.D)); });
      let active = null;
      for (const c of E.conts) {
        const car = E.cars[c.car];
        if (c.state === 'on') {
          c.m.position.set(car.position.x, car.position.y + 3.9, car.position.z); c.m.rotation.y = car.rotation.y;
          if (!active) active = c;
        } else if (c.state === 'reel') {
          active = c; c.t += dt / 1.7;
          const k = sm(c.t);
          c.m.position.set(lerp(c.fx, st.sx, k), lerp(c.fy, st.sy - 1.9, k), lerp(c.fz, -1.5, k)); c.m.rotation.y += dt * 2;
          tmpA.set(st.sx, st.sy - 1.1, -1.4); tmpB.copy(c.m.position);
          E.cable.visible = true; E.cable.position.copy(tmpA).add(tmpB).multiplyScalar(0.5); E.cable.scale.z = Math.max(0.1, tmpA.distanceTo(tmpB));
          aim(E.cable, tmpB.x - st.sx, tmpB.y - st.sy + 1.1, tmpB.z + 1.4);
          if (c.t >= 1) {
            c.state = 'got'; c.m.visible = false; E.cable.visible = false; st.coax++; st.lock = 0; st.add = [0.1, 0.7, 0.9]; st.flash = Math.max(st.flash, 0.25);
            if (audio) audio.pickup();
            if (onEvent) onEvent(st.coax === 1 ? '⚡ 鱼叉命中！第 1 罐同轴燃料已收入货舱——再对准下一节车厢！' : '💎 第 2 罐同轴燃料到手！满载而归，准备撤离！');
          }
        }
      }
      const ring = E.lockRing;
      if (st.ph === 'train' && active && active.state === 'on' && st.pt > 4.5) {
        const p = active.m.position, aligned = Math.abs(st.sx - p.x) < 2.6;
        st.lock = clamp(st.lock + (aligned ? dt / 1.1 : -dt * 0.6), 0, 1);
        ring.visible = true; ring.position.set(p.x, p.y + 1.2, p.z); ring.scale.setScalar(2.3 - 1.4 * st.lock); ring.rotation.z = st.el * 1.5;
        if (aligned) say('lock', '🎯 对准了！保持在燃料罐上方，等锁定环收拢……', onEvent);
        if (st.lock >= 1) {
          active.state = 'reel'; active.t = 0; active.fx = p.x; active.fy = p.y; active.fz = p.z; ring.visible = false;
          if (audio) audio.harpoon();
        }
        return p.x;
      }
      ring.visible = false;
      return null;
    }

    /* ---------------------------------------------------------------- walk-through camera */
    const KEYS = [[0, 0.9, 30.9], [5, 0.3, 29.7], [10, 0.4, 27.6], [13, 0.4, 23.8], [15.5, 0, 20.3], [18, 0.7, 17], [21, 0.9, 13.4], [23.5, 0, 10.4], [26, 0, 6.8], [28.5, 0, 3.4], [30, 0, 1.4], [31.5, 0, 0.45]];
    const BOARD_T = 31.5;
    function pathAt(t) {
      t = clamp(t, 0, BOARD_T);
      let i = 0; while (i < KEYS.length - 2 && KEYS[i + 1][0] <= t) i++;
      const a = KEYS[Math.max(0, i - 1)], b = KEYS[i], c = KEYS[i + 1], d = KEYS[Math.min(KEYS.length - 1, i + 2)], u = (t - b[0]) / (c[0] - b[0]);
      const cr = (p0, p1, p2, p3) => 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
      const z = cr(a[2], b[2], c[2], d[2]);
      return { x: cr(a[1], b[1], c[1], d[1]), y: lerp(0.3, 0.55, sm((z - 0.45) / 3)), z };
    }
    function boardPose(t) {
      const p = pathAt(t), q = pathAt(t + 1.3);
      let tx = q.x, ty = p.y - 0.08, tz = q.z;
      const mix = (w, x, y, z) => { tx += (x - tx) * w; ty += (y - ty) * w; tz += (z - tz) * w; };
      mix(sm((t - 0.2) / 1.2) * (1 - sm((t - 9.5) / 3)) * 0.92, -3.6, 1.6, 26);
      mix(bump(t, 15.5, 20.5) * 0.7, ship.table[0], ship.table[1], ship.table[2]);
      mix(bump(t, 20.5, 23.5) * 0.5, 5.3, 0.5, 12.6);
      mix(sm((t - 25) / 5), 0, 0.32, -40);
      return { px: MX + p.x, py: MY + p.y, pz: MZ + p.z, tx: MX + tx, ty: MY + ty, tz: MZ + tz };
    }

    /* ---------------------------------------------------------------- ride interface */
    const ride = {
      id: 'falcon_flight', name: '千年隼号：走私者逃亡（Smugglers Run）', land: "Star Wars: Galaxy's Edge",
      boardPos: { x: o.x, y: o.y, z: o.z + 13.5 },
      exitPos: { x: o.x, y: o.y, z: o.z + 23.0, yaw: 0 },
      start() {
        if (!st.active || st.ph === 'done' || st.ph === 'idle') reset();
        st.active = true; st.running = true; mission.visible = true;
        if (audio) audio.start();
      },
      stop() { st.running = false; if (audio) audio.stop(); },
      onExit() {
        st.active = false; st.running = false; st.ph = 'idle'; mission.visible = false;
        if (audio) audio.stop();
        o.park();
      },
      isRunning: () => st.running,
      fire, hyperjump,
      steer(dx, dy) {
        if (!FLY[st.ph] || st.ph === 'landed' || st.ph === 'done') return;
        st.tx = clamp(st.tx + dx, -8, 8); st.ty = clamp(st.ty + dy, -4, 4.5); st.idle = 0;
      },
      getHudInfo: () => `${NAMES[st.ph]} · 同轴燃料 ${st.coax}/2 · 击落 ${st.kills} · 船体 ${Math.round(st.hull)}%`,
      getCameraPose(third) {
        if (!FLY[st.ph]) { ship.grp.visible = true; o.falcon.visible = false; return boardPose(st.pt); }
        ship.grp.visible = !third; o.falcon.visible = !!third;
        if (third) {
          o.falcon.position.set(MX + st.sx, MY + st.sy - 0.6, MZ - 1.5); o.falcon.rotation.set(0, PI, -st.roll); o.gear.visible = false;
          return { px: MX + st.sx * 0.55, py: MY + st.sy * 0.5 + 6, pz: MZ + 21, tx: MX + st.sx, ty: MY + st.sy + 0.5, tz: MZ - 25 };
        }
        const g = ship.grp.position, ex = g.x - Math.sin(st.roll) * 0.3, ey = g.y + Math.cos(st.roll) * 0.3;
        return { px: MX + ex, py: MY + ey, pz: MZ + 0.45, tx: MX + ex, ty: MY + ey + 0.02, tz: MZ - 40, roll: st.roll };
      }
    };

    /* ---------------------------------------------------------------- per-frame */
    function animateInterior(el, talking) {
      const h = ship.hondo, tk = talking ? 1 : 0;
      h.head.rotation.set(Math.sin(el * 1.9) * 0.06, Math.sin(el * 0.7) * 0.35, 0);
      h.jaw.scale.y = 1 + tk * Math.abs(Math.sin(el * 11)) * 2.4;
      for (const a of h.arms) {
        a.up.rotation.z = a.sd * (0.3 + tk * (0.45 + 0.4 * Math.sin(el * 1.6 + a.sd)));
        a.up.rotation.x = -tk * (0.5 + 0.3 * Math.sin(el * 2.1 + a.sd * 2));
        a.fo.rotation.x = -0.4 - tk * 0.7 * (0.5 + 0.5 * Math.sin(el * 2.7 + a.sd));
      }
      ship.r5Head.rotation.y = Math.sin(el * 1.1) * 1.2;
      ship.holo.forEach((c, i) => {
        const lunge = i % 3 === 0 ? Math.max(0, Math.sin(el * 1.3 + i)) * 0.3 : 0, r = 0.56 - lunge;
        c.m.position.set(ship.table[0] + Math.cos(c.a) * r, -0.24 + Math.abs(Math.sin(el * 2.2 + c.a)) * 0.03, ship.table[2] + Math.sin(c.a) * r);
        c.m.rotation.y = -c.a + PI / 2 + Math.sin(el + c.a) * 0.4;
        c.m.material.opacity = 0.62 + 0.2 * Math.sin(el * 17 + i * 2);
      });
    }

    function update(dt, elapsed, onEvent) {
      if (!st.active) return;
      if (audio) audio.update(dt);
      st.el = elapsed;
      ship.PUc.uT.value = ship.PUh.uT.value = elapsed; E.tunU.uT.value = elapsed;
      if (!st.running) return;
      st.pt += dt;
      const p = st.ph, t = st.pt;
      if (st.cool > 0) st.cool -= dt;
      if (st.inv > 0) st.inv -= dt;
      if (st.warnT > 0) st.warnT -= dt;
      st.shake = Math.max(0, st.shake - dt * 2.2);
      let engine = 0.5, roar = 0, auto = null;

      if (p === 'board') {
        animateInterior(elapsed, t > 0.6 && t < 12);
        ship.PUc.uPow.value = sm((t - 27.5) / 3);
        engine = t > 27.5 ? 0.22 : 0;
        if (t > 0.6 && !st.said.h1) {
          say('h1', '🏴‍☠️ 杭多·奥纳卡：“啊哈，新船员！欢迎来到奥纳卡运输公司——完全合法的那种。楚巴卡把千年隼号借给了我……”', onEvent);
          if (audio) audio.speak('啊哈，新船员！欢迎来到奥纳卡运输公司，完全合法的那种。');
        }
        if (t > 6 && !st.said.h2) {
          say('h2', '🏴‍☠️ 杭多：“我需要飞行员、炮手和工程师，去科雷利亚‘取回’一批同轴燃料。干得好，酬金大大的有！上船吧！”', onEvent);
          if (audio) audio.speak('楚巴卡把千年隼借给了我。去科雷利亚取回一批同轴燃料，酬金大大的有！上船吧！');
        }
        if (t > 12.5) say('b1', '🚪 穿过登船通道，走进千年隼号的主舱', onEvent);
        if (t > 17) say('b2', '♟️ 主舱：全息棋桌（Dejarik）上的怪兽正在对弈——记住，让伍基人赢', onEvent);
        if (t > 22.5) say('b3', '🔧 经过工程师控制台，沿环形走廊前往驾驶舱', onEvent);
        if (t > 27.5 && !st.said.b4) { say('b4', '💺 入座驾驶舱！系统启动中：A/D 左右 · W/S 升降 · 空格 开火 · H 超空间跃迁杆', onEvent); if (audio) audio.powerUp(); }
        if (t >= BOARD_T + 1.2) setPhase('launch', onEvent);
      } else {
        ship.PUc.uPow.value = 1;
        // Steering, autopilot, banking
        st.idle += dt;
        const px = st.sx, k = 1 - Math.exp(-dt * 5);
        st.sx += (st.tx - st.sx) * k; st.sy += (st.ty - st.sy) * k;
        st.roll += (clamp(-(st.sx - px) / Math.max(dt, 0.001) * 0.035, -0.4, 0.4) - st.roll) * Math.min(1, dt * 5);

        if (p === 'launch') {
          st.speed = 58 * sm(t / 4); engine = 0.4 + 0.6 * sm(t / 4);
          st.gy -= dt * 10 * clamp((t - 4) / 3, 0, 1);
          E.grp.rotation.x = -0.12 * sm((t - 3) / 3) * (1 - sm((t - 14) / 3));
          if (t > 11) skyTo('veil', 0.8);
          for (const s of E.spires) if (s.col && s.z < -2 && s.z > -170 && (!auto || s.z > auto.z)) auto = s;
          if (auto) { const r = 7 * auto.s; auto = Math.abs(st.tx - auto.x) < r + 3.5 ? [clamp(auto.x + (auto.x > 0 ? -1 : 1) * (r + 4.5), -8, 8), st.ty] : null; }
          if (t >= 17) setPhase('lever1', onEvent);
        } else if (p === 'lever1' || p === 'lever2') {
          st.speed = 40; auto = [0, 0];
          if (p === 'lever2') { E.planet.position.z += dt * 6; }
          if (t > 7) setPhase(p === 'lever1' ? 'jump1' : 'jump2', onEvent);
        } else if (p === 'jump1' || p === 'jump2') {
          engine = 1; auto = [0, 0]; st.idle = 9;
          const j = sm(t / 1.2);
          E.streakU.uLen.value = 320 * j * j; E.streakU.uOp.value = 0.35 + 0.65 * j; st.shake = Math.max(st.shake, j * 0.35);
          if (t >= 1.25) setPhase(p === 'jump1' ? 'hyper1' : 'hyper2', onEvent);
        } else if (p === 'hyper1' || p === 'hyper2') {
          engine = 0.8; roar = 1; auto = [0, 0]; st.idle = 9;
          const f = 0.55 + 0.25 * Math.sin(elapsed * 9) + 0.15 * Math.sin(elapsed * 23);
          st.add = [0.05 * f, 0.22 * f, 0.6 * f];
          if (t > 0.5) say(p, p === 'hyper1' ? '🌌 超空间跃迁中……下一站：科雷利亚' : '🌌 再次进入超空间——带着同轴燃料全速返航', onEvent);
          if (t >= 6.5) setPhase(p === 'hyper1' ? 'corellia' : 'approach', onEvent);
        } else if (p === 'corellia') {
          engine = 0.75;
          E.sd.position.set(-150, 95, -420 + t * 28);
          for (const y of E.yard) if (y.v < 5 && y.z < -2 && y.z > -200 && (!auto || y.z > auto.z)) auto = y;
          if (auto) auto = E.yardDefs[auto.v].safe;
          if (t >= 20) setPhase('train', onEvent);
        } else if (p === 'train') {
          engine = 0.7; st.speed = 60;
          if (t >= 30 || (st.coax === 2 && t > 10)) { if (!E.conts.some((c) => c.state === 'reel')) setPhase('escape', onEvent); }
        } else if (p === 'escape') {
          engine = 0.9; st.speed = 70; auto = [0, -2.5];
          if (!st.veiled) {
            st.gy -= dt * 34;
            if (t >= 2.8) {
              st.veiled = true; skyTo('space', 2.5);
              show(E.yard, false); show(E.cars, false); show(E.pylons, false); show(E.conts, false); E.rail.visible = E.ground.visible = E.cable.visible = false;
              E.planetU.uA.value.set(0.1, 0.16, 0.22); E.planetU.uB.value.set(0.3, 0.3, 0.3); E.planetU.uAtm.value.set(0.55, 0.6, 0.7); E.planetU.uCity.value = 1;
              E.planet.visible = true; E.planet.scale.setScalar(240); E.planet.position.set(70, -275, -130);
              E.sd.visible = true; E.sd.scale.setScalar(2.2); E.sd.rotation.set(0, PI, 0);
            }
          } else {
            const sz = -560 + (t - 2.8) * 48;
            E.sd.position.set(0, 46, sz); E.planet.rotation.y += dt * 0.01;
            if ((st.sdShot -= dt) <= 0 && sz < 40) {
              st.sdShot = 0.45;
              const b = free(E.eBolts), ox = (rand() - 0.5) * 80, oz = sz + 60 + rand() * 60;
              if (b) launchBolt(b, ox, 36, oz, st.sx + (rand() - 0.5) * 5 - ox, st.sy + (rand() - 0.5) * 5 - 36, -oz, 190);
            }
            if (sz > -120) say('belly', '😱 歼星舰就在头顶！压低高度，贴着它的腹部机库冲过去！', onEvent);
          }
          if (t >= 21) setPhase('lever2', onEvent);
        } else if (p === 'approach') {
          st.speed = 50; engine = 0.6; auto = [0, 0];
          const k2 = sm(t / 5); E.planet.position.set(0, -20, -420); E.planet.scale.setScalar(lerp(50, 360, k2 * k2)); E.planet.rotation.y = 2 + t * 0.02;
          if (t >= 5) setPhase('descent', onEvent);
        } else if (p === 'descent') {
          st.speed = 60 * (1 - sm(t / 9.5)); engine = 0.3 + 0.4 * (1 - sm(t / 9.5)); auto = [0, 0]; st.idle = 9;
          st.gy = lerp(-150, -3.6, sm(t / 9));
          E.grp.rotation.x = 0.1 * (1 - sm(t / 6));
          if (t > 5) say('land', '🛬 黑尖塔前哨站就在下方——收起速度，对准 5 号停机坪', onEvent);
          if (t >= 10) setPhase('landed', onEvent);
        } else if (p === 'landed') {
          engine = 0.15; auto = [0, 0]; st.idle = 9;
          if (t > 9) { st.ph = 'done'; st.running = false; if (audio) audio.stop(); }
        }

        const dz = st.speed * dt; st.D += dz;
        E.groundU.uScroll.value = st.D; E.ground.position.y = st.ph === 'escape' ? st.gy : (E.spires[0].m.visible ? st.gy : -70);
        if (E.spires[0].m.visible) stepSpires(dz, onEvent);
        if (E.yard[0].m.visible) stepYard(dz, onEvent);
        if (E.rail.visible) { const cx = stepTrain(dt, dz, onEvent); if (cx !== null) auto = [clamp(cx, -8, 8), -1]; else if (st.ph === 'train') auto = [clamp(C(-45 - st.D), -8, 8), -1]; }
        stepTies(dt, onEvent); stepBolts(dt, onEvent);
        if (auto && st.idle > 1.6) {
          st.tx += clamp(auto[0] - st.tx, -dt * 7, dt * 7); st.ty += clamp(auto[1] - st.ty, -dt * 5, dt * 5);
        }

        // Cockpit: shake, yokes, lever, reticle
        const jx = (rand() - 0.5) * st.shake * 0.35, jy = (rand() - 0.5) * st.shake * 0.35;
        ship.grp.position.set(st.sx + jx, st.sy + jy, 0); ship.grp.rotation.z = st.roll;
        for (const y of ship.yokes) y.rotation.z = st.roll * 1.6;
        const pulled = st.ph === 'jump1' || st.ph === 'jump2' || st.ph === 'hyper1' || st.ph === 'hyper2';
        ship.lever.rotation.x += ((pulled ? -0.6 : 0.35) - ship.lever.rotation.x) * Math.min(1, dt * 8);
        const tg = st.target, rt = ship.reticle;
        if (tg) {
          const f = -2.75 / (tg.z - 0.45); let rx = (tg.x - st.sx) * f, ry = (tg.y - st.sy - 0.3) * f; const rl = Math.hypot(rx, ry);
          if (rl > 1.25) { rx *= 1.25 / rl; ry *= 1.25 / rl; }
          rt.position.set(rx, 0.3 + ry, -2.3); rt.scale.setScalar(1.25 + 0.2 * Math.sin(elapsed * 14)); ship.reticleMat.color.setHex(0xff4433);
        } else {
          rt.position.set(0, 0.3, -2.3); rt.scale.setScalar(st.ph === 'train' ? 1 + st.lock * 1.4 : 1); ship.reticleMat.color.setHex(st.ph === 'train' && st.lock > 0.05 ? 0x35e0ff : 0x4ade80);
        }
        rt.visible = !pulled && st.ph !== 'landed';
        E.flash.position.set(st.sx, st.sy, 0);
      }

      // Shared: sky, flashes, cockpit light spill, audio
      skyStep(dt);
      st.flash = Math.max(0, st.flash - dt * 1.5); E.flashMat.opacity = st.flash;
      const dk = Math.exp(-dt * 4);
      st.add[0] *= dk; st.add[1] *= dk; st.add[2] *= dk; INT.uAdd.value.fromArray(st.add);
      if (audio) audio.setEngine(engine, roar);
    }

    return { ride, update };
  }

  root.TPFalcon = { build };
})(window);
