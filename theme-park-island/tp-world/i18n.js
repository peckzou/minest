/* Minest theme park — Chinese / English for the rides (2026-11-24).
 * A 中 / EN switch (kept in localStorage 'tp.lang'). In English: ride names, the ride bar, the prompts and the rides'
 * spoken lines that are in the dictionary below are shown and spoken in English (speech through the device's English
 * voice); anything not in the dictionary stays in Chinese. Phrases are replaced longest first, so a line made of
 * known parts (the Falcon's status line) comes out whole. */
(function (root) {
  'use strict';
  var lang = 'zh'; try { lang = localStorage.getItem('tp.lang') === 'en' ? 'en' : 'zh'; } catch (e) {}
  var D = [
    ['杭多·奥纳卡：“啊哈，新船员！欢迎来到奥纳卡运输公司——完全合法的那种。楚巴卡把千年隼号借给了我……”', 'Hondo Ohnaka: "Aha, a new crew! Welcome to Ohnaka Transport Solutions — entirely legitimate. Chewbacca has lent me the Millennium Falcon…"'],
    ['杭多：“我需要飞行员、炮手和工程师，去科雷利亚‘取回’一批同轴燃料。干得好，酬金大大的有！上船吧！”', 'Hondo: "I need pilots, gunners and engineers to \'recover\' some coaxium from Corellia. Do well and the pay is handsome! All aboard!"'],
    ['船体受损！注意躲避障碍与敌方火力——船体越完整，杭多给的酬金越高', 'Hull damaged! Dodge the obstacles and enemy fire — the more ship you bring back, the more Hondo pays'],
    ['船体严重受损！驾驶舱警报响起', 'Hull critical! The cockpit alarm is sounding'],
    ['四联激光炮测试完毕！到了科雷利亚，准星变红即表示已锁定 TIE 战机', 'Quad laser cannons tested! Over Corellia, a red reticle means a TIE fighter is locked'],
    ['对准了！保持在燃料罐上方，等锁定环收拢……', 'Lined up! Hold over the fuel car until the lock ring closes…'],
    ['穿过登船通道，走进千年隼号的主舱', 'Through the boarding ramp, into the Falcon\'s main hold'],
    ['主舱：全息棋桌（Dejarik）上的怪兽正在对弈——记住，让伍基人赢', 'The main hold: creatures are fighting on the Dejarik holochess table — remember, let the Wookiee win'],
    ['经过工程师控制台，沿环形走廊前往驾驶舱', 'Past the engineers\' stations, along the ring corridor to the cockpit'],
    ['入座驾驶舱！系统启动中：A/D 左右 · W/S 升降 · 空格 开火 · H 超空间跃迁杆', 'Take your seat! Systems starting: A/D left-right · W/S up-down · arrows aim · Space fire · H hyperdrive lever'],
    ['歼星舰就在头顶！压低高度，贴着它的腹部机库冲过去！', 'A Star Destroyer right overhead! Stay low and run under its hangar bay!'],
    ['黑尖塔前哨站就在下方——收起速度，对准 5 号停机坪', 'Black Spire Outpost is below — ease off and line up on Docking Bay 5'],
    ['超空间跃迁中……下一站：科雷利亚', 'In hyperspace… next stop: Corellia'], ['再次进入超空间——带着同轴燃料全速返航', 'Into hyperspace again — home at full speed with the coaxium'],
    ['启航！沿着花园运河驶向微笑时钟立面——留意每隔一分钟的报时娃娃游行', 'Off we go! Along the garden canal to the smiling clock face — watch for the parade of dolls that marks the time'],
    ['再见！Goodbye', 'Goodbye'], ['游船已靠岸，欢迎再次乘坐「小小世界」！', 'The boat is back at the dock — come and ride "it\'s a small world" again!'],
    ['林肯先生起身演讲：“八十七年前，我们的先辈在这片大陆上创立了一个新国家，它孕育于自由之中，奉行人人生而平等的信念。”', 'Mr. Lincoln rises to speak: "Four score and seven years ago our fathers brought forth on this continent a new nation, conceived in liberty, and dedicated to the proposition that all men are created equal."'],
    ['前秀开始：先听世界智脑讲故事；按 H 可跳过前秀，直接登上逃生舱', 'The pre-show begins: hear Worldmind tell the story; press H to skip it and board the escape pod'],
    ['星爵按下播放键——劲爆混音带', 'Star-Lord hits play — the Awesome Mix'], ['「宇宙倒带」完成！你和银河护卫队一起把时间拨回了现在。再次启动可以听到另一首混音带曲目。', 'Cosmic Rewind complete! You and the Guardians have wound time back to now. Ride again to hear another track from the mix.'],
    ['星图号 · 逃生舱发射湾', 'Starcharter · escape-pod launch bay'], ['桑达星奇观 · 星系厅', 'Wonders of Xandar · Galaxarium'], ['星图号 · 观景甲板', 'Starcharter · observation deck'], ['星图号 · 回收湾', 'Starcharter · recovery bay'],
    ['倒退弹射 · 冲入跃迁点', 'Reverse launch · into the jump point'], ['跃迁航道 · 追击伊森', 'Jump lane · chasing Eson'], ['时间原点 · 大爆炸', 'The beginning of time · the Big Bang'], ['快进 · 回到现在', 'Fast forward · back to now'],
    ['登上逃生舱', 'Board the escape pod'], ['相位舱', 'Phase chamber'], ['发射导轨', 'Launch rail'], ['跃迁点前', 'At the jump point'], ['环绕桑达星环', 'Around Xandar\'s rings'], ['时间开始倒流', 'Time begins to run backwards'], ['小行星带', 'Asteroid belt'], ['时间隧道', 'Time tunnel'], ['银河倒带', 'Galactic rewind'], ['掠过月球', 'Past the Moon'], ['返回特拉星', 'Returning to Terra'],
    ['机器人工坊 · 造一个自己的机器人', 'Droid Depot · build a droid of your own'], ['光剑工坊 · 造一把自己的光剑', 'Savi\'s Workshop · build a lightsaber of your own'], ['你的机器人造好了！它会跟着你走', 'Your droid is built! It will follow you'], ['光剑点亮了！按 L 收起或点亮', 'Your lightsaber is lit! Press L to switch it off and on'],
    ['千年隼号：走私者逃亡（Smugglers Run）', 'Millennium Falcon: Smugglers Run'], ['小小世界 · it’s a small world（含林肯先生）', 'it\'s a small world (with Mr. Lincoln)'],
    ['迪士尼蒸汽火车 4 站环园游（Disneyland Railroad）', 'Disneyland Railroad — grand circle tour'], ['亚瑟王皇家旋转木马（King Arthur Carrousel）', 'King Arthur Carrousel'],
    ['加勒比海盗室内游船（Pirates of the Caribbean）', 'Pirates of the Caribbean'], ['太空山室内星际过山车（Space Mountain）', 'Space Mountain'], ['星际轨道飞行器（Astro Orbiter）', 'Astro Orbiter'],
    ['丛林河流探险船（Jungle Cruise）', 'Jungle Cruise'], ['测试赛道 · Test Track（EPCOT）', 'Test Track (EPCOT)'], ['友谊号游船 · 世界橱窗环湖巡游', 'Friendship Boats · World Showcase Lagoon'],
    ['迪士尼天际缆车（EPCOT ⇄ 好莱坞影城）', 'Disney Skyliner (EPCOT ⇄ Hollywood Studios)'], ['迪士尼高空缆车（EPCOT ↔ 好莱坞影城）', 'Disney Skyliner (EPCOT ↔ Hollywood Studios)'], ['暮光之城恐怖魔塔 · Tower of Terror', 'The Twilight Zone Tower of Terror'],
    ['弹簧狗冲刺 · Slinky Dog Dash', 'Slinky Dog Dash'], ['珠峰探险过山车（动物王国）', 'Expedition Everest (Animal Kingdom)'], ['珠峰探险 · Expedition Everest', 'Expedition Everest'], ['乞力马扎罗野生动物园 · Kilimanjaro Safaris', 'Kilimanjaro Safaris'],
    ['巨雷山铁路 · Big Thunder Mountain Railroad', 'Big Thunder Mountain Railroad'], ['巨雷山 · Big Thunder Mountain', 'Big Thunder Mountain'], ['迪士尼乐园单轨列车 · Disneyland Monorail', 'Disneyland Monorail'],
    ['巴黎迪士尼铁路 · Disneyland Railroad', 'Disneyland Paris Railroad'], ['印第安纳琼斯与危险神殿 · Temple du Péril', 'Indiana Jones and the Temple of Peril'], ['太空山 · Space Mountain: De la Terre à la Lune', 'Space Mountain: From the Earth to the Moon'],
    ['诺瓦至尊 · 伊拉妮·蕾尔', 'Nova Prime Irani Rael'], ['星爵 · 彼得·奎尔', 'Star-Lord · Peter Quill'], ['天神族 · 伊森', 'Eson the Celestial'], ['世界智脑', 'Worldmind'], ['卡魔拉', 'Gamora'], ['德拉克斯', 'Drax'], ['格鲁特', 'Groot'], ['火箭', 'Rocket'],
    ['按 E 或点击', 'Press E or tap'], ['按 E 乘坐游乐设施', 'Press E to ride'], ['正在乘坐：', 'Now riding: '], ['正在乘坐', 'Now riding'], ['乘坐「', 'Ride "'], ['触发「', 'Use "'], ['」对话', '"'], ['与「', 'Talk to "'], ['」', '"'],
    ['激光炮射击 (Space)', 'Fire lasers (Space)'], ['超空间跃迁 (H)', 'Hyperspace (H)'], ['第三人称视角', 'Third person'], ['第一人称视角', 'First person'], ['离开设施', 'Leave the ride'], ['暂停', 'Pause'], ['启动', 'Start'],
    ['巴图星升空', 'Lift-off from Batuu'], ['等待跃迁', 'Ready to jump'], ['超空间跃迁', 'Hyperspace'], ['科雷利亚造船厂', 'Corellia shipyards'], ['同轴燃料列车', 'Coaxium train'], ['歼星舰追击', 'Star Destroyer chase'], ['返航巴图', 'Returning to Batuu'], ['任务完成', 'Mission complete'],
    ['登船中', 'Boarding'], ['待命', 'Standing by'], ['同轴燃料', 'Coaxium'], ['击落', 'Kills'], ['船体', 'Hull'], ['杭多', 'Hondo']
  ].sort(function (a, b) { return b[0].length - a[0].length; });
  function t(s) { if (lang !== 'en' || s == null) return s; s = String(s); for (var i = 0; i < D.length; i++) if (s.indexOf(D[i][0]) >= 0) s = s.split(D[i][0]).join(D[i][1]); return s; }
  /* speech: a line that has an English version is spoken in English */
  try {
    var ss = root.speechSynthesis, speak0 = ss && ss.speak.bind(ss);
    if (speak0) ss.speak = function (u) {
      try { if (lang === 'en' && u && u.text) { var e = t(u.text); if (e !== u.text && !/[\u4e00-\u9fff]/.test(e)) { u.text = e; u.lang = 'en-US'; var v = (ss.getVoices() || []).filter(function (q) { return /^en/i.test(q.lang); })[0]; if (v) u.voice = v; } } } catch (er) {}
      return speak0(u);
    };
  } catch (e) {}
  /* what is on screen: the toast, the prompt and the ride bar are rewritten as they change */
  function sweep(el) { if (!el || lang !== 'en') return; var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), n; while ((n = w.nextNode())) { var e = t(n.nodeValue); if (e !== n.nodeValue) n.nodeValue = e; } }
  function watch() {
    ['toast', 'tp-action-prompt', 'tp-ride-bar', 'cr-ui'].forEach(function (id) { var el = document.getElementById(id); if (!el || el._i18n) return; el._i18n = 1; sweep(el); new MutationObserver(function () { sweep(el); }).observe(el, { childList: true, characterData: true, subtree: true }); });
    var row = document.getElementById('mn-pav-btns');
    if (row && !document.getElementById('tp-lang-btn')) { var b = document.createElement('button'); b.type = 'button'; b.id = 'tp-lang-btn'; b.textContent = lang === 'en' ? 'EN → 中' : '中 → EN'; b.title = '游乐设施的语言 / Ride language'; b.style.cssText = 'padding:5px 12px;border-radius:999px;border:none;background:#0f172a;color:#fde68a;font-weight:900;font-size:11.5px;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.35)'; b.onclick = function (e) { e.stopPropagation(); try { localStorage.setItem('tp.lang', lang === 'en' ? 'zh' : 'en'); } catch (er) {} location.reload(); }; row.appendChild(b); }
  }
  watch(); new MutationObserver(watch).observe(document.documentElement, { childList: true, subtree: true });
  root.TPI18N = { t: t, lang: function () { return lang; } };
})(window);
