/* Minest · My World 3.0 — Spatial Personal World (window.MinestUniverse)
   Collect → Organize → Explore → Grow.
   Level 0 My Universe (a modular archipelago: centre island + the user's own worlds)
   → Level 1 World (Studio floating island) → Level 2 Category = a board list/area (Studio miniature diorama)
   → Level 3 List = a list card (Studio low-poly object) → Level 4 Item = the real card (existing details).
   Spatial for discovery, 2D for productivity: every level also has an Outline view; Kanban, Portal, Contents and the card
   details stay the existing ones. Visual assets are skins, never data — kept apart in MinestKnowledge:
     'uv:center' centre style · 'uv:slot:<bid>' a world's fixed place in the archipelago (never reshuffled)
     'uv:skin:w:<bid>' / 'uv:skin:c:<bid>:<col>' / 'uv:skin:l:<card>' chosen assets · 'uv:hide:<bid>' hidden from the archipelago
   Navigation state (path, scroll, query, view per level) is kept on this device: localStorage 'minest.uv.v1'.
   Assets come from window.MinestAssets3D (Studio library + three.js, loaded on first use from #mn-assets3d-src). */
(function () {
  if (window.MinestUniverse) return;
  var KN = function () { return window.MinestKnowledge; };
  var A = function () { return window.MinestAI || {}; };
  var W = function () { return window.MinestWorld; };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(m, o) { try { if (window.GlassUI && GlassUI.toast) return GlassUI.toast(m, o); } catch (e) {} return null; }
  function hap(k) { try { if (window.MinestNative && MinestNative.haptic) MinestNative.haptic(k || 'light'); } catch (e) {} }
  function boards() { try { return (A().boards && A().boards()) || []; } catch (e) { return []; } }
  function boardById(id) { return boards().filter(function (b) { return b.id === id; })[0] || null; }
  function isHead(id) { return !!(KN() && KN().isHeading && KN().isHeading(id)); }
  function hashOf(s) { var h = 0; s = String(s); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }

  // ================================================================== assets (lazy)
  var AS = null, asWait = null;
  function assets() {
    if (AS) return Promise.resolve(AS); if (asWait) return asWait;
    asWait = new Promise(function (res) {
      if (window.MinestAssets3D) { AS = window.MinestAssets3D; return res(AS); }
      var src = document.getElementById('mn-assets3d-src');
      if (!src) return res(null);
      setTimeout(function () {   // parse the 3D library only now, off the first paint
        try { var s = document.createElement('script'); s.textContent = src.textContent; document.head.appendChild(s); AS = window.MinestAssets3D || null; } catch (e) { AS = null; }
        res(AS);
      }, 30);
    });
    return asWait;
  }
  // an <img> that fills itself in when the asset's thumbnail is ready (and falls back to a calm tile)
  function art(id, cls, label) {
    var u = AS && AS.cached(id);
    return '<span class="uv-art ' + (cls || '') + (u ? ' ready' : '') + '" data-art="' + esc(id) + '" data-label="' + esc(label || '') + '">' + (u ? '<img alt="" src="' + u + '">' : '<i class="ph"></i>') + '</span>';
  }
  function hydrate(root) {
    var els = (root || ui.el).querySelectorAll('.uv-art:not(.ready):not(.wait)');
    if (!els.length) return;
    assets().then(function (as) {
      Array.prototype.forEach.call(els, function (el) {
        var id = el.getAttribute('data-art'); el.classList.add('wait');
        if (!as) { el.classList.add('fallback'); return; }
        as.thumb(id).then(function (u) {
          el.classList.remove('wait');
          if (!u) { el.classList.add('fallback'); return; }
          el.innerHTML = '<img alt="" src="' + u + '">'; el.classList.add('ready');
          if (!reduce && el.animate) el.firstChild.animate([{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'ease-out' });
        });
      });
    });
  }

  // ---------------------------------------------------------------- automatic matching (stable ids → assets), overridable
  var TPL_WORLD = { 'everyday-cultural': 'world_05_cultural', 'everyday-food': 'world_03_everyday', 'everyday-nature': 'world_01_natural', 'everyday-memory': 'world_09_life_story',
    'everyday-places': 'world_11_leisure_play', 'everyday-creative': 'world_07_work_creation', 'everyday-maker': 'world_07_work_creation', 'everyday-family': 'world_04_social',
    'my-life': 'world_03_everyday', 'whole-earth': 'world_01_natural', 'my-museum': 'world_18_arts_aesthetics', britannica: 'world_02_knowledge', dewey: 'world_20_language_literature',
    encyclopedie: 'world_02_knowledge', bacon: 'world_15_philosophy_wisdom', 'my-academic-skills': 'world_06_learning_skills', 'my-life-skills': 'world_06_learning_skills',
    'philosophy-spinoza': 'world_15_philosophy_wisdom', 'philosophy-aristotle': 'world_15_philosophy_wisdom', 'philosophy-kant': 'world_15_philosophy_wisdom', 'philosophy-hegel': 'world_15_philosophy_wisdom',
    'philosophy-heidegger': 'world_08_inner', 'society-culture-leisure': 'world_05_cultural', 'society-industries': 'world_22_economy_commerce', 'society-activities': 'world_03_everyday', 'society-wellbeing': 'world_10_health_vitality' };
  var RULES = {
    diorama: [[/movie|film|cinema|screen|theat|show|tv/, 'diorama_06_cinema_theater'], [/book|read|librar|press|writ|literat|poem/, 'diorama_01_grand_library'], [/music|song|album|concert|band|sound/, 'diorama_07_music_hall'],
      [/sport|team|game|play|athlet|fitness/, 'diorama_08_sports_arena'], [/art|craft|design|museum|paint|creative/, 'diorama_05_art_museum'], [/food|recipe|cook|kitchen|meal|restaurant|bak/, 'diorama_11_food_market'],
      [/home|house|family|room|chore/, 'diorama_10_home_garden'], [/garden|plant|flower|botan/, 'diorama_15_botanical_garden'], [/ocean|sea|marine|beach|reef/, 'diorama_16_ocean_marine_life'],
      [/nature|forest|animal|wild|land|tree|hik/, 'diorama_14_forest_wildlife'], [/travel|trip|place|journey|visit|map/, 'diorama_17_travel_landmarks'], [/memor|moment|milestone|childhood|life story|time/, 'diorama_18_memory_time_garden'],
      [/philosoph|think|wisdom|value|mind|belief|reflect|inner|feeling/, 'diorama_19_philosophy_sanctuary'], [/future|tech|innovat|digital|invent|robot|dream/, 'diorama_20_future_innovation_lab'],
      [/science|space|star|universe|astronom|physic|chem|experiment/, 'diorama_02_science_observatory'], [/school|learn|skill|course|class|study|education/, 'diorama_03_school_academy'],
      [/history|ancient|heritage|civiliz|tradition/, 'diorama_04_ancient_civilization'], [/city|community|society|people|neighbo|friend|civic|public/, 'diorama_09_city_community'],
      [/shop|money|brand|market|buy|trade|bank/, 'diorama_12_shopping_street'], [/work|make|build|maker|tool|industr|project|job/, 'diorama_13_workshop_factory']],
    object: [[/movie|film|watch|cinema|show/, 'object_05_film_reel'], [/music|album|song|playlist|record|band/, 'object_06_vinyl_record'], [/book|read|novel|librar/, 'object_01_open_book'], [/game/, 'object_08_game_controller'],
      [/art|artist|design|creat|craft|paint|draw/, 'object_07_artist_palette'], [/sport|team|trophy|award|win|medal|best/, 'object_09_trophy'], [/recipe|cook|food|meal|dish|kitchen/, 'object_13_cooking_pot'],
      [/home|house|room|chore|family/, 'object_11_house'], [/shop|buy|wish|brand|gift|purchase/, 'object_12_shopping_bag'], [/plant|tree|garden|habit|grow|flower/, 'object_14_tree'],
      [/ocean|beach|sea|shell|coast/, 'object_15_seashell'], [/goal|travel|trip|route|bucket|plan|journey|way/, 'object_16_compass'], [/photo|picture|camera|snap|portrait/, 'object_17_camera'],
      [/people|friend|love|value|heart|gratitude|relationship|famil/, 'object_18_heart'], [/idea|question|note|insight|brainstorm|thought/, 'object_19_lightbulb'], [/dream|vision|future|hope|aspiration/, 'object_20_crystal'],
      [/science|experiment|lab|research/, 'object_03_microscope'], [/history|time|timeline|memor|moment/, 'object_04_hourglass'], [/geograph|place|countr|world|map/, 'object_02_globe'],
      [/favorite|favourite|collect|treasure|keepsake/, 'object_10_treasure_chest']],
    world: [[/cultur|movie|film|art/, 'world_05_cultural'], [/knowledge|encyclop|atlas/, 'world_02_knowledge'], [/nature|earth|wild|animal/, 'world_01_natural'], [/food|everyday|home|daily/, 'world_03_everyday'],
      [/famil|friend|social|people/, 'world_04_social'], [/skill|learn|school/, 'world_06_learning_skills'], [/work|make|create|maker/, 'world_07_work_creation'], [/inner|mind|feeling|self/, 'world_08_inner'],
      [/memor|life story|story/, 'world_09_life_story'], [/health|well|fitness/, 'world_10_health_vitality'], [/play|leisure|travel|place/, 'world_11_leisure_play'], [/dream|future|goal/, 'world_12_future_dreams'],
      [/science|explor/, 'world_13_science_exploration'], [/histor|civiliz/, 'world_14_history_civilizations'], [/philosoph|wisdom/, 'world_15_philosophy_wisdom'], [/math|logic/, 'world_16_mathematics_logic'],
      [/tech|digital|code/, 'world_17_technology_digital'], [/music|sound/, 'world_19_music_sound'], [/language|literat|book|librar/, 'world_20_language_literature'], [/societ|govern|civic/, 'world_21_society_governance'],
      [/econom|commerce|industr|money/, 'world_22_economy_commerce'], [/cosmos|space|star/, 'world_23_cosmos_space'], [/ocean|sea|ecolog/, 'world_24_ecology_oceans']]
  };
  var POOL = { world: ['world_05_cultural', 'world_02_knowledge', 'world_01_natural', 'world_03_everyday', 'world_04_social', 'world_06_learning_skills', 'world_07_work_creation', 'world_08_inner', 'world_09_life_story', 'world_10_health_vitality', 'world_11_leisure_play', 'world_12_future_dreams'],
    diorama: ['diorama_01_grand_library', 'diorama_09_city_community', 'diorama_10_home_garden', 'diorama_14_forest_wildlife', 'diorama_18_memory_time_garden', 'diorama_19_philosophy_sanctuary'],
    object: ['object_10_treasure_chest', 'object_19_lightbulb', 'object_16_compass', 'object_01_open_book', 'object_18_heart', 'object_04_hourglass'] };
  function rule(kind, text) { var t = String(text || '').toLowerCase().replace(/^my\s+/, ''); var r = RULES[kind].filter(function (x) { return x[0].test(t); })[0]; return r ? r[1] : null; }
  function worldTpl(bid) { var w = KN() && KN().get('lom:world:' + bid); return w && w.templates ? Object.keys(w.templates)[0] : null; }
  function worldSkin(bid) { var o = KN() && KN().get('uv:skin:w:' + bid); if (o) return o; var b = boardById(bid), t = worldTpl(bid); return (t && TPL_WORLD[t]) || rule('world', b && b.title) || POOL.world[hashOf(bid) % POOL.world.length]; }
  function catSkin(bid, col) { var o = KN() && KN().get('uv:skin:c:' + bid + ':' + col.id); if (o) return o; return rule('diorama', col.title) || POOL.diorama[hashOf(col.id) % POOL.diorama.length]; }
  function listSkin(card) { var o = KN() && KN().get('uv:skin:l:' + card.id); if (o) return o; return rule('object', card.title) || POOL.object[hashOf(card.id) % POOL.object.length]; }
  function centerSkin() { return (KN() && KN().get('uv:center')) || 'center_castle'; }
  function vlCategory(text) {
    var t = String(text || '').toLowerCase(), M = [[/movie|film|cinema|watch|show/, 'movies'], [/book|read|novel/, 'books'], [/music|song|album|artist|band/, 'music'], [/game/, 'games'], [/sport|team/, 'sports'],
      [/food|recipe|cook|dish/, 'food'], [/place|travel|trip|city/, 'places'], [/animal|plant|nature|bird|flower|tree/, 'nature'], [/people|person|hero|thinker|friend/, 'people'], [/history|ancient|war/, 'history'], [/art|paint/, 'art'], [/brand|shop/, 'brands']];
    var r = M.filter(function (x) { return x[0].test(t); })[0]; return r ? r[1] : null;
  }

  // ================================================================== my data, read through the board (nothing copied)
  function worlds() {
    return (W() ? W().worlds() : []).filter(function (x) { return !(KN() && KN().get('uv:hide:' + x.b.id)); }).map(function (x) {
      var look = (KN() && KN().get('wa:' + x.b.id)) || {}, lists = 0, items = 0;
      (x.b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { if (isHead(k.id)) return; lists++; items += (k.stack || []).length; }); });
      return { bid: x.b.id, title: x.b.title, subtitle: look.subtitle || '', b: x.b, lists: lists, items: items, cats: (x.b.columns || []).length };
    });
  }
  function colOf(b, colId) { return (b.columns || []).filter(function (c) { return c.id === colId; })[0] || null; }
  function cardOf(b, cardId) { var hit = null; (b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { if (k.id === cardId) hit = k; }); }); return hit; }
  function listsOf(col) { return (col.cards || []).filter(function (k) { return k && k.id && !isHead(k.id); }); }
  function picOf(s) { return s && s.cover && (s.cover.value || s.cover.url) && s.cover.type !== 'color' ? (s.cover.value || s.cover.url) : ''; }

  // stable archipelago slots: a world keeps its place; a new one takes the first free place (rings round the centre)
  var SLOTS = (function () {
    var out = [], rings = [[6, 1.0, .78, .38], [10, 1.92, 1.5, .1], [14, 2.84, 2.2, .3]];
    rings.forEach(function (r) { for (var i = 0; i < r[0]; i++) { var a = r[3] + i * 2 * Math.PI / r[0]; out.push({ x: Math.cos(a) * r[1], y: Math.sin(a) * r[2] }); } });
    return out;
  })();
  function slotsFor(ws) {
    var used = {}, m = {}, toSet = {};
    ws.forEach(function (w) { var s = KN() && KN().get('uv:slot:' + w.bid); if (typeof s === 'number' && !used[s]) { used[s] = 1; m[w.bid] = s; } });
    ws.forEach(function (w) { if (m[w.bid] != null) return; var i = 0; while (used[i]) i++; used[i] = 1; m[w.bid] = i; toSet['uv:slot:' + w.bid] = i; });
    if (Object.keys(toSet).length && KN()) KN().setMany(toSet);
    return m;
  }

  // ================================================================== shell & state
  var ST_KEY = 'minest.uv.v1';
  var S = (function () { try { return JSON.parse(localStorage.getItem(ST_KEY) || '{}') || {}; } catch (e) { return {}; } })();
  S.lv = S.lv || {};
  function stSave() { try { localStorage.setItem(ST_KEY, JSON.stringify({ path: S.path, mode: S.mode, lv: S.lv })); } catch (e) {} }
  function keyOf(n) { return n.t === 'home' ? 'home' : n.t === 'world' ? 'w:' + n.bid : n.t === 'cat' ? 'c:' + n.bid + ':' + n.col : 'l:' + n.bid + ':' + n.card; }
  function lv(n) { var k = keyOf(n || cur()); return S.lv[k] = S.lv[k] || {}; }
  var ui = { open: false };
  function cur() { return ui.path[ui.path.length - 1]; }

  var I = function (d, w) { return '<svg viewBox="0 0 24 24" width="' + (w || 20) + '" height="' + (w || 20) + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
  var ICON = { x: I('<path d="M6 6l12 12M18 6 6 18"/>'), back: I('<path d="m15 6-6 6 6 6"/>'), home: I('<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>', 18), plus: I('<path d="M12 5v14M5 12h14"/>', 22),
    outline: I('<path d="M4 6h16M8 12h12M8 18h12"/><circle cx="4" cy="12" r=".6"/><circle cx="4" cy="18" r=".6"/>', 19), spatial: I('<path d="M12 3 3 8l9 5 9-5-9-5z"/><path d="m3 13 9 5 9-5"/>', 19),
    more: I('<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>', 19), cube: I('<path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>', 17),
    brush: I('<path d="M18 3 9 12l3 3 9-9-3-3z"/><path d="M9 12c-3 0-4 2-4 4s-2 3-3 3c2 1 6 1 8-1s1-5-1-6z"/>', 17), chev: I('<path d="m9 6 6 6-6 6"/>', 15), search: I('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>', 17),
    spark: I('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>', 16) };
  var CSS = [
    '.uv{position:fixed;inset:0;z-index:2147482002;display:flex;flex-direction:column;color:var(--uv-ink);font:15px/1.4 -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden;',
    '--uv-ink:#f4f6fb;--uv-sub:rgba(244,246,251,.64);--uv-card:rgba(255,255,255,.07);--uv-line:rgba(255,255,255,.12);--uv-fill:rgba(255,255,255,.09);--uv-blue:#0a84ff;--uv-sheet:#1b2030;',
    'background:radial-gradient(120% 70% at 50% 18%,#3b5b8f 0%,#22325a 38%,#121a33 70%,#0b1022 100%)}',
    'html.kn-light .uv{--uv-ink:#14213d;--uv-sub:rgba(20,33,61,.62);--uv-card:rgba(255,255,255,.72);--uv-line:rgba(20,33,61,.1);--uv-fill:rgba(20,33,61,.06);--uv-blue:#007aff;--uv-sheet:#fff;',
    'background:radial-gradient(120% 70% at 50% 15%,#fdfbf5 0%,#e3eefb 40%,#c9dcf3 75%,#b3cbea 100%)}',
    '.uv-head{display:flex;align-items:center;gap:8px;padding:calc(env(safe-area-inset-top,0px) + 12px) 14px 4px;position:relative;z-index:3}',
    '.uv-b{flex:none;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;padding:0;cursor:pointer;color:inherit;background:var(--uv-fill);border:0;-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px)}',
    '.uv-ti{flex:1;min-width:0}.uv-ti h1{margin:0;font-size:28px;font-weight:800;letter-spacing:-.6px;line-height:1.05}.uv-ti p{margin:2px 0 0;font-size:13.5px;color:var(--uv-sub)}',
    '.uv-crumb{display:flex;align-items:center;gap:2px;overflow-x:auto;scrollbar-width:none;padding:0 14px 6px;white-space:nowrap;position:relative;z-index:3}.uv-crumb::-webkit-scrollbar{display:none}',
    '.uv-crumb button{border:0;background:none;color:var(--uv-sub);font:600 13px -apple-system,system-ui,sans-serif;padding:4px 6px;border-radius:8px;cursor:pointer}.uv-crumb button:last-child{color:var(--uv-ink)}.uv-crumb span{opacity:.4}',
    '.uv-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:4px 14px calc(env(safe-area-inset-bottom,0px) + 100px);position:relative}',
    '.uv-stage{will-change:transform,opacity}',
    // asset tiles
    '.uv-art{display:block;position:relative;aspect-ratio:1;width:100%}.uv-art img{width:100%;height:100%;object-fit:contain;display:block;filter:drop-shadow(0 14px 18px rgba(0,0,0,.28))}',
    '.uv-art .ph{position:absolute;inset:18%;border-radius:50%;background:radial-gradient(circle at 40% 35%,rgba(255,255,255,.35),rgba(255,255,255,.06));animation:uvPulse 1.4s ease-in-out infinite}',
    '.uv-art.fallback .ph{animation:none;inset:22%;border-radius:28%;background:linear-gradient(150deg,rgba(255,255,255,.28),rgba(255,255,255,.06))}',
    '.uv-art.fallback:after{content:attr(data-label);position:absolute;inset:0;display:grid;place-items:center;font-weight:800;font-size:26px;opacity:.7}',
    '@keyframes uvPulse{0%,100%{opacity:.5;transform:scale(.96)}50%{opacity:1;transform:scale(1)}}',
    // archipelago
    '.uv-sea{position:relative;margin:4px auto 6px;max-width:980px}',
    '.uv-isle{position:absolute;transform:translate(-50%,-50%);border:0;background:none;padding:0;color:inherit;cursor:pointer;text-align:center;-webkit-tap-highlight-color:transparent;transition:transform .2s}',
    '.uv-isle:active{transform:translate(-50%,-50%) scale(.96)}',
    '.uv-isle .uv-art{animation:uvFloat 6s ease-in-out infinite}.uv-isle:nth-child(2n) .uv-art{animation-delay:-2s}.uv-isle:nth-child(3n) .uv-art{animation-delay:-4s}',
    '@keyframes uvFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}',
    '.uv-isle b,.uv-isle small{max-width:100%;margin-left:auto;margin-right:auto}.uv-isle b{display:block;font-size:13px;font-weight:750;line-height:1.15;margin-top:-6px;text-shadow:0 1px 6px rgba(0,0,0,.35)}html.kn-light .uv-isle b{text-shadow:0 1px 6px rgba(255,255,255,.8)}',
    '.uv-isle small{display:block;font-size:11.5px;color:var(--uv-sub)}',
    '.uv-isle.center b{font-size:15px}',
    '.uv-empty{text-align:center;padding:4px 18px 16px}.uv-empty p{color:var(--uv-sub);margin:6px 0 14px}',
    // sections
    '.uv-hero{display:flex;align-items:center;gap:14px;margin:2px 0 10px}.uv-hero .uv-art{width:132px;flex:none}.uv-hero .tx{min-width:0;flex:1}',
    '.uv-hero h2{margin:0;font-size:24px;font-weight:800;letter-spacing:-.4px;line-height:1.15}.uv-hero p{margin:4px 0 0;color:var(--uv-sub);font-size:13.5px}',
    '.uv-tools{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.uv-pill{display:inline-flex;align-items:center;gap:5px;height:32px;padding:0 12px;border-radius:999px;border:1px solid var(--uv-line);background:var(--uv-fill);color:inherit;font:600 13px -apple-system,system-ui,sans-serif;cursor:pointer}',
    '.uv-pill.on{background:var(--uv-ink);color:#111;border-color:transparent}html.kn-light .uv-pill.on{color:#fff}',
    '.uv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}',
    '.uv-tile{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;padding:8px 8px 12px;border-radius:22px;border:1px solid var(--uv-line);background:var(--uv-card);color:inherit;font:inherit;cursor:pointer;-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px)}',
    '.uv-tile:active{transform:scale(.97)}.uv-tile .uv-art{width:82%}.uv-tile b{font-size:14.5px;line-height:1.2;margin-top:2px}.uv-tile small{font-size:12px;color:var(--uv-sub);margin-top:2px}',
    '.uv-tile .mini{display:flex;gap:4px;margin-top:7px;justify-content:center}.uv-tile .mini img,.uv-tile .mini i{width:26px;height:36px;border-radius:5px;object-fit:cover;background:var(--uv-fill)}',
    '.uv-tile.hit{box-shadow:0 0 0 2px var(--uv-blue)}',
    '.uv-sec{font-size:12px;font-weight:750;letter-spacing:.07em;text-transform:uppercase;color:var(--uv-sub);margin:16px 4px 8px}',
    '.uv-hint{display:flex;align-items:center;gap:10px;padding:10px 12px;margin:4px 0 12px;border-radius:16px;background:var(--uv-card);border:1px solid var(--uv-line);font-size:13.5px}',
    '.uv-hint b{flex:1;font-weight:600}.uv-hint button{border:0;background:none;color:var(--uv-sub);cursor:pointer;font-size:16px}.uv-hint .go{color:var(--uv-blue);font-weight:700;font-size:13.5px}',
    // list items
    '.uv-items{display:flex;flex-direction:column;gap:6px}.uv-it{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:8px 10px;border-radius:14px;border:1px solid var(--uv-line);background:var(--uv-card);color:inherit;font:inherit;cursor:pointer}',
    '.uv-it img,.uv-it .nb{flex:none;width:42px;height:58px;border-radius:8px;object-fit:cover;background:var(--uv-fill)}.uv-it div{min-width:0;flex:1}.uv-it b{display:block;font-size:15px}.uv-it small{color:var(--uv-sub);font-size:12px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.uv-gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:10px}.uv-gi{border:0;background:none;padding:0;color:inherit;font:inherit;cursor:pointer;text-align:left}',
    '.uv-gi img,.uv-gi .ph2{width:100%;aspect-ratio:2/3;border-radius:12px;object-fit:cover;display:grid;place-items:center;background:linear-gradient(150deg,hsl(var(--h),45%,48%),hsl(calc(var(--h) + 40),50%,32%));color:#fff;font-weight:700;font-size:13px;padding:8px;box-sizing:border-box;text-align:center;box-shadow:0 8px 20px rgba(0,0,0,.25)}',
    '.uv-gi b{display:block;font-size:12.5px;margin-top:5px;line-height:1.2}.uv-it.sel,.uv-gi.sel img,.uv-gi.sel .ph2{outline:2px solid var(--uv-blue);outline-offset:2px}',
    '.uv-seg{display:flex;padding:3px;border-radius:12px;background:var(--uv-fill);margin:4px 0 10px}.uv-seg button{flex:1;height:32px;border:0;border-radius:9px;background:none;color:inherit;font:600 13.5px -apple-system,system-ui,sans-serif;cursor:pointer}.uv-seg button.on{background:var(--uv-card);box-shadow:0 1px 4px rgba(0,0,0,.18)}',
    '.uv-search{display:flex;align-items:center;gap:8px;height:40px;padding:0 12px;border-radius:12px;background:var(--uv-fill);color:var(--uv-sub);margin:0 0 10px}.uv-search input{flex:1;min-width:0;border:0;background:none;outline:none;color:var(--uv-ink);font:16px -apple-system,system-ui,sans-serif}',
    // outline
    '.uv-ol{display:flex;flex-direction:column;gap:2px}.uv-or{display:flex;align-items:center;gap:8px;width:100%;text-align:left;border:0;background:none;color:inherit;font:inherit;padding:8px 8px;border-radius:10px;cursor:pointer}',
    '.uv-or:hover{background:var(--uv-fill)}.uv-or em{margin-left:auto;font-style:normal;font-size:12px;color:var(--uv-sub)}.uv-or.here{background:color-mix(in srgb,var(--uv-blue) 22%,transparent)}.uv-or .dt{width:8px;height:8px;border-radius:50%;flex:none}',
    // add button + sheets
    '.uv-add{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 16px);transform:translateX(-50%);z-index:4;display:flex;align-items:center;gap:8px;height:52px;padding:0 22px 0 18px;border-radius:999px;border:0;background:var(--uv-blue);color:#fff;font:700 16px -apple-system,system-ui,sans-serif;white-space:nowrap;box-shadow:0 12px 30px rgba(10,132,255,.4),0 2px 8px rgba(0,0,0,.2);cursor:pointer}',
    '.uv-add:active{transform:translateX(-50%) scale(.97)}',
    '@media (min-width:900px){.uv-head{padding-right:210px}.uv-add{left:auto;right:20px;top:calc(env(safe-area-inset-top,0px) + 12px);bottom:auto;transform:none;height:40px;font-size:14px}.uv-add:active{transform:scale(.97)}.uv-body{padding-bottom:40px}}',
    '.uv-dim{position:absolute;inset:0;z-index:8;background:rgba(5,8,18,.4)}',
    '.uv-sheet{position:absolute;left:0;right:0;bottom:0;z-index:9;max-height:86%;overflow-y:auto;padding:10px 16px calc(env(safe-area-inset-bottom,0px) + 18px);border-radius:26px 26px 0 0;background:var(--uv-sheet);box-shadow:0 -20px 50px rgba(0,0,0,.35)}',
    '@media (min-width:700px){.uv-sheet{left:50%;right:auto;bottom:auto;top:12%;width:520px;transform:translateX(-50%);border-radius:24px;max-height:76%}}',
    '.uv-sheet .grab{width:38px;height:5px;border-radius:3px;background:var(--uv-line);margin:0 auto 10px}.uv-sheet h3{margin:2px 2px 4px;font-size:20px;font-weight:800}.uv-sheet .sub{margin:0 2px 12px;color:var(--uv-sub);font-size:13.5px}',
    '.uv-acts{display:grid;grid-template-columns:1fr 1fr;gap:10px}.uv-act{display:flex;flex-direction:column;gap:4px;text-align:left;padding:14px;border-radius:18px;border:1px solid var(--uv-line);background:var(--uv-fill);color:inherit;font:inherit;cursor:pointer}',
    '.uv-act i{font-style:normal;font-size:24px}.uv-act b{font-size:15px}.uv-act small{font-size:12.5px;color:var(--uv-sub)}',
    '.uv-in{width:100%;box-sizing:border-box;height:46px;padding:0 14px;border-radius:14px;border:1px solid var(--uv-line);background:var(--uv-fill);color:inherit;font:16px -apple-system,system-ui,sans-serif;outline:none;margin-bottom:10px}',
    '.uv-go{height:46px;padding:0 18px;border-radius:14px;border:0;background:var(--uv-blue);color:#fff;font:700 15px -apple-system,system-ui,sans-serif;cursor:pointer;width:100%;margin-top:6px}.uv-go.sec{background:var(--uv-fill);color:inherit}',
    '.uv-pick{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px}.uv-pick button{border:1px solid var(--uv-line);border-radius:16px;background:var(--uv-fill);padding:4px 4px 8px;color:inherit;font:600 11.5px -apple-system,system-ui,sans-serif;cursor:pointer}',
    '.uv-pick button.on{border-color:var(--uv-blue);box-shadow:0 0 0 2px var(--uv-blue) inset}',
    '.uv-row{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:12px;border-radius:14px;border:0;background:none;color:inherit;font:inherit;cursor:pointer}.uv-row:hover{background:var(--uv-fill)}.uv-row i{font-style:normal;font-size:20px;width:26px;text-align:center}.uv-row small{display:block;color:var(--uv-sub);font-size:12.5px}',
    '.uv-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:6px 0 12px}.uv-stats div{text-align:center;padding:12px 4px;border-radius:16px;background:var(--uv-fill)}.uv-stats b{display:block;font-size:22px}.uv-stats span{font-size:12px;color:var(--uv-sub)}',
    '.uv-3d{position:relative;width:100%;aspect-ratio:1;max-width:520px;margin:0 auto;border-radius:22px;background:radial-gradient(circle at 50% 40%,rgba(255,255,255,.12),transparent 70%)}.uv-3d canvas{width:100%!important;height:100%!important;display:block;border-radius:22px}',
    '.uv-chipsel{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:0 0 10px}.uv-chipsel button{flex:none;height:32px;padding:0 12px;border-radius:999px;border:1px solid var(--uv-line);background:none;color:inherit;font:600 13px -apple-system,system-ui,sans-serif;cursor:pointer}.uv-chipsel button.on{background:var(--uv-blue);color:#fff;border-color:transparent}',
    // Explore Mode (live archipelago)
    '.uv-explore{position:relative;height:min(68vh,620px);margin:0 -14px;overflow:hidden}.uv-explore canvas{display:block;cursor:grab}.uv-x-tag{position:absolute;left:0;top:0;pointer-events:none;font:750 12.5px -apple-system,system-ui,sans-serif;white-space:nowrap;padding:2px 8px;border-radius:999px;background:rgba(0,0,0,.35);color:#fff}',
    '.uv-xbar{display:flex;gap:6px;justify-content:center;margin:6px 0}',
    // asset browser
    '.uv-seg2{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;margin:0 0 10px}.uv-seg2 button{flex:none;height:32px;padding:0 12px;border-radius:999px;border:1px solid var(--uv-line);background:none;color:inherit;font:600 13px -apple-system,system-ui,sans-serif;cursor:pointer}.uv-seg2 button.on{background:var(--uv-ink);color:#111;border-color:transparent}html.kn-light .uv-seg2 button.on{color:#fff}',
    '.uv-pick button small{display:block;font-weight:500;font-size:10.5px;color:var(--uv-sub);margin-top:1px}',
    // desktop: sidebar + explorer
    '.uv.wide{flex-direction:row}.uv.wide .uv-main{flex:1;min-width:0;display:flex;flex-direction:column;position:relative}.uv-main{display:contents}',
    '.uv-side{display:none}.uv.wide .uv-side{display:block;width:280px;flex:none;overflow-y:auto;padding:calc(env(safe-area-inset-top,0px) + 16px) 10px 20px;border-right:1px solid var(--uv-line);background:rgba(0,0,0,.12)}html.kn-light .uv.wide .uv-side{background:rgba(255,255,255,.35)}',
    '.uv-side h4{margin:4px 8px 10px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--uv-sub)}',
    '.uv-tile:focus-visible,.uv-isle:focus-visible,.uv-it:focus-visible,.uv-gi:focus-visible{outline:3px solid var(--uv-blue);outline-offset:3px}',
    '@media (min-width:900px){.uv-grid{grid-template-columns:repeat(auto-fill,minmax(190px,1fr))}.uv-hero .uv-art{width:180px}.uv-body{padding-left:28px;padding-right:28px}}',
    '@media (prefers-reduced-motion: reduce){.uv *{animation:none!important;transition:none!important}}'
  ].join('\n');
  function css() { if (document.getElementById('uv-css')) return; var s = document.createElement('style'); s.id = 'uv-css'; s.textContent = CSS; document.head.appendChild(s); }

  function shell() {
    if (ui.open) return; css(); if (KN() && KN().applyLook) KN().applyLook();
    var el = document.createElement('div'); el.className = 'uv'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'My World');
    el.innerHTML = '<aside class="uv-side" aria-label="My worlds"></aside><div class="uv-main"><div class="uv-head"></div><div class="uv-crumb" role="navigation" aria-label="Where you are"></div><div class="uv-body"><div class="uv-stage"></div></div><button type="button" class="uv-add" data-add>' + ICON.plus + 'Add to My World</button></div>';
    ['pointerdown', 'touchstart', 'touchmove', 'wheel', 'keydown'].forEach(function (ev) { el.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: ev !== 'keydown' }); });
    ui.side = el.querySelector('.uv-side'); ui.el = el; ui.head = el.querySelector('.uv-head'); ui.crumb = el.querySelector('.uv-crumb'); ui.body = el.querySelector('.uv-body'); ui.stage = el.querySelector('.uv-stage'); ui.open = true;
    document.body.appendChild(el); document.documentElement.classList.add('kn-open');
    if (el.animate && !reduce) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220 });
    el.addEventListener('click', onClick);
    el.addEventListener('input', onInput);
    el.addEventListener('keydown', onKey);
    ui.onResize = function () { var w = window.innerWidth >= 1100; if (ui.el && w !== ui.el.classList.contains('wide')) { ui.el.classList.toggle('wide', w); render(); } };
    window.addEventListener('resize', ui.onResize); el.classList.toggle('wide', window.innerWidth >= 1100);
    assets();
  }
  function close() {
    if (!ui.open) return; saveState(); stop3D(); closeSheet(true);
    var el = ui.el; ui.open = false; ui.el = null; stopX(); window.removeEventListener('resize', ui.onResize);
    if (!document.querySelector('.mw,.lw,.sk,.wk,.pk,.wc,.dv,.bd,.st,.fw')) document.documentElement.classList.remove('kn-open');
    if (el.animate && !reduce) { var an = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }); an.onfinish = function () { el.remove(); }; } else el.remove();
  }
  function saveState() { if (!ui.open || !ui.path) return; lv().y = ui.body.scrollTop; S.path = ui.path; stSave(); }

  // ================================================================== navigation (tap to enter = zoom in · back = zoom out)
  function go(path, origin, dir) {
    if (ui.open && ui.path) saveState();
    if (path.length > 1) ui.explore = false;
    stop3D(); closeSheet(true);
    var from = origin && origin.getBoundingClientRect ? origin.getBoundingClientRect() : null;
    ui.path = path; S.path = path; stSave();
    render();
    var st = lv();
    ui.body.scrollTop = dir === 'in' ? 0 : (st.y || 0);
    animate(from, dir);
  }
  function animate(from, dir) {
    var stg = ui.stage; if (!stg.animate) return;
    if (ui.anim) { try { ui.anim.cancel(); } catch (e) {} }
    if (reduce || !dir) { ui.anim = stg.animate([{ opacity: .4 }, { opacity: 1 }], { duration: 180 }); return; }
    var br = ui.body.getBoundingClientRect(), ox = from ? from.left + from.width / 2 - br.left : br.width / 2, oy = from ? from.top + from.height / 2 - br.top + ui.body.scrollTop : 160;
    stg.style.transformOrigin = ox + 'px ' + oy + 'px';
    ui.anim = dir === 'in' ? stg.animate([{ transform: 'scale(.55)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.2,.85,.25,1)' })
      : stg.animate([{ transform: 'scale(1.35)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 280, easing: 'cubic-bezier(.2,.85,.25,1)' });
  }
  function back() { if (ui.sheet) return closeSheet(); if (ui.path.length <= 1) return close(); var leaving = cur(); go(ui.path.slice(0, -1), null, 'out'); flashBack(leaving); }
  function home() { go([{ t: 'home' }], null, 'out'); }
  // returning: light the place you came from
  function flashBack(n) {
    var sel = n.t === 'world' ? '[data-world="' + n.bid + '"]' : n.t === 'cat' ? '[data-cat="' + n.col + '"]' : n.t === 'list' ? '[data-list="' + n.card + '"]' : null;
    var el = sel && ui.stage.querySelector(sel); if (!el) return;
    if (el.getBoundingClientRect().top < 60 || el.getBoundingClientRect().bottom > window.innerHeight - 80) el.scrollIntoView({ block: 'center' });
    el.classList.add('hit'); setTimeout(function () { el.classList.remove('hit'); }, 1200);
  }

  // ================================================================== rendering
  function render() {
    var n = cur(), b = n.bid ? boardById(n.bid) : null;
    if (n.t !== 'home' && !b) { ui.path = [{ t: 'home' }]; n = cur(); }
    head(); crumbs();
    var outline = S.mode === 'outline';
    var h = outline ? outlineHtml(n) : n.t === 'home' ? homeHtml() : n.t === 'world' ? worldHtml(b) : n.t === 'cat' ? catHtml(b, colOf(b, n.col)) : listHtml(b, cardOf(b, n.card));
    stopX();
    ui.stage.innerHTML = h;
    hydrate(ui.stage);
    if (ui.el.classList.contains('wide')) { ui.side.innerHTML = '<h4>My Universe</h4>' + outlineHtml(n, true); }
    if (ui.explore && n.t === 'home' && !outline) startX();
    ui.el.querySelector('.uv-add').hidden = false;
  }
  function head() {
    var n = cur(), outline = S.mode === 'outline';
    var left = n.t === 'home' ? '<button type="button" class="uv-b" data-x aria-label="Close">' + ICON.x + '</button>' : '<button type="button" class="uv-b" data-back aria-label="Back">' + ICON.back + '</button>';
    var title = n.t === 'home' ? '<div class="uv-ti"><h1>My World</h1><p>A little universe of mine.</p></div>' : '<div class="uv-ti"></div>';
    ui.head.innerHTML = left + title + (n.t !== 'home' ? '<button type="button" class="uv-b" data-home aria-label="My Universe">' + ICON.home + '</button>' : '') +
      '<button type="button" class="uv-b" data-mode aria-label="' + (outline ? 'Spatial view' : 'Outline view') + '" title="' + (outline ? 'Spatial view' : 'Outline view') + '">' + (outline ? ICON.spatial : ICON.outline) + '</button>' +
      '<button type="button" class="uv-b" data-more aria-label="More">' + ICON.more + '</button>';
  }
  function crumbs() {
    var parts = ui.path.map(function (n, i) {
      var b = n.bid ? boardById(n.bid) : null, t = n.t === 'home' ? 'My Universe' : n.t === 'world' ? (b && b.title) : n.t === 'cat' ? ((b && colOf(b, n.col)) || {}).title : ((b && cardOf(b, n.card)) || {}).title;
      return '<button type="button" data-crumb="' + i + '">' + esc(t || '…') + '</button>';
    });
    ui.crumb.innerHTML = ui.path.length > 1 ? parts.join('<span>›</span>') : '';
    ui.crumb.style.display = ui.path.length > 1 ? '' : 'none';
  }

  // ---- Level 0: the archipelago
  function homeHtml() {
    var ws = worlds(), slot = slotsFor(ws), cs = centerSkin(), info = AS && AS.info(cs);
    var vw = Math.min((ui.body.clientWidth || window.innerWidth) - (window.innerWidth >= 900 ? 56 : 28), 980), maxR = { x: 0, y: 0 };
    ws.forEach(function (w) { var p = SLOTS[slot[w.bid] % SLOTS.length]; maxR.x = Math.max(maxR.x, Math.abs(p.x)); maxR.y = Math.max(maxR.y, Math.abs(p.y)); });
    if (!ws.length) { maxR.x = 1; maxR.y = .78; }
    var isle = Math.min(170, vw * .34), cen = Math.min(isle * 1.55, vw * .5), sx = (vw - isle) / 2 / Math.max(1, maxR.x), sy = sx * .92;
    var H = Math.max(cen + 60, (maxR.y * 2) * sy + isle + 40, (window.innerHeight || 700) * .56), cx = vw / 2, cy = H / 2;
    var h = '<div class="uv-sea" style="width:' + vw + 'px;height:' + H.toFixed(0) + 'px">';
    h += '<button type="button" class="uv-isle center" style="left:' + cx + 'px;top:' + (cy - 8) + 'px;width:' + cen.toFixed(0) + 'px" data-center aria-label="My World overview">' + art(cs, '', '✦') + '<b>My World</b><small>' + ws.length + ' world' + (ws.length === 1 ? '' : 's') + '</small></button>';
    ws.forEach(function (w) {
      var p = SLOTS[slot[w.bid] % SLOTS.length];
      h += '<button type="button" class="uv-isle" style="left:' + (cx + p.x * sx).toFixed(0) + 'px;top:' + (cy + p.y * sy).toFixed(0) + 'px;width:' + isle.toFixed(0) + 'px" data-world="' + esc(w.bid) + '" title="' + esc(w.title + ' — ' + w.cats + ' areas · ' + w.lists + ' lists · ' + w.items + ' things') + '">' + art(worldSkin(w.bid), '', (w.title || '?').replace(/^my\s+/i, '').charAt(0)) +
        '<b>' + esc(w.title) + '</b><small>' + w.items + ' thing' + (w.items === 1 ? '' : 's') + ' · ' + w.lists + ' lists</small></button>';
    });
    h += '</div>';
    if (ui.explore) h = '<div class="uv-explore" data-x3></div><div class="uv-xbar"><span style="color:var(--uv-sub);font-size:12.5px">Drag to turn · tap an island to enter</span></div>';
    if (ws.length) h += '<div class="uv-xbar"><button type="button" class="uv-pill' + (ui.explore ? ' on' : '') + '" data-explore>' + ICON.cube + (ui.explore ? 'Back to the map' : 'Explore in 3D') + '</button></div>';
    if (!ws.length) h += '<div class="uv-empty"><b style="font-size:18px">Your universe is waiting</b><p>Start with a small world — you can always grow it later.</p><button type="button" class="uv-go" data-templates style="max-width:320px">Choose a starter world</button></div>';
    if (window.MinestInspire && !ui.explore) h += MinestInspire.cardHtml();   // one light Daily Inspiration (Discovery Engine)
    var ib = inboxCount();
    if (ib) h += '<div class="uv-hint"><span>📥</span><b>' + ib + ' thing' + (ib === 1 ? '' : 's') + ' waiting in your Inbox</b><button type="button" class="go" data-inbox>Sort</button></div>';
    return h;
  }
  function inboxCount() { var n = 0; worlds().forEach(function (w) { (w.b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { if (k.id === w.bid + '-l-mine-inbox' || /^my inbox$/i.test(k.title || '')) n += (k.stack || []).length; }); }); }); return n; }

  // ---- Level 1: a world — its categories as dioramas
  function worldHtml(b) {
    var cols = (b.columns || []), look = (KN() && KN().get('wa:' + b.id)) || {}, w = worlds().filter(function (x) { return x.bid === b.id; })[0] || { items: 0, lists: 0 };
    var h = '<div class="uv-hero">' + art(worldSkin(b.id), '', (b.title || '?').replace(/^my\s+/i, '').charAt(0)) + '<div class="tx"><h2>' + esc(b.title) + '</h2><p>' + esc(look.subtitle || '') + (look.subtitle ? ' · ' : '') + cols.length + ' areas · ' + w.lists + ' lists · ' + w.items + ' things</p>' +
      '<div class="uv-tools"><button type="button" class="uv-pill" data-inspect="' + esc(worldSkin(b.id)) + '">' + ICON.cube + 'Inspect 3D</button><button type="button" class="uv-pill" data-skin="w">' + ICON.brush + 'Island</button><button type="button" class="uv-pill" data-hideworld>Hide</button></div></div></div>';
    h += hint('world', b);
    h += '<div class="uv-grid">' + cols.map(function (c) {
      var ls = listsOf(c), items = ls.reduce(function (a, k) { return a + (k.stack || []).length; }, 0);
      return '<button type="button" class="uv-tile" data-cat="' + esc(c.id) + '">' + art(catSkin(b.id, c), '', (c.title || '?').replace(/^my\s+/i, '').charAt(0)) + '<b>' + esc(c.title) + '</b><small>' + ls.length + ' list' + (ls.length === 1 ? '' : 's') + ' · ' + items + ' thing' + (items === 1 ? '' : 's') + '</small></button>';
    }).join('') + '</div>';
    if (!cols.length) h += '<div class="uv-empty"><p>No areas yet.</p></div>';
    return h;
  }
  // ---- Level 2: a category — its lists as objects (section headings stay as quiet labels)
  function catHtml(b, col) {
    if (!col) return '<div class="uv-empty"><p>This area is not here any more.</p></div>';
    var ls = listsOf(col), items = ls.reduce(function (a, k) { return a + (k.stack || []).length; }, 0);
    var h = '<div class="uv-hero">' + art(catSkin(b.id, col), '', (col.title || '?').replace(/^my\s+/i, '').charAt(0)) + '<div class="tx"><h2>' + esc(col.title) + '</h2><p>' + ls.length + ' lists · ' + items + ' things</p>' +
      '<div class="uv-tools"><button type="button" class="uv-pill" data-inspect="' + esc(catSkin(b.id, col)) + '">' + ICON.cube + 'Inspect 3D</button><button type="button" class="uv-pill" data-skin="c">' + ICON.brush + 'Scene</button></div></div></div>';
    h += hint('cat', b, col);
    var groups = [], curg = { title: '', lists: [] };
    (col.cards || []).forEach(function (k) { if (!k || !k.id) return; if (isHead(k.id)) { if (curg.lists.length || curg.title) groups.push(curg); curg = { title: k.title, lists: [] }; } else curg.lists.push(k); });
    groups.push(curg);
    groups.forEach(function (g) {
      if (!g.lists.length && !g.title) return;
      if (g.title) h += '<div class="uv-sec">' + esc(g.title) + '</div>';
      h += '<div class="uv-grid">' + g.lists.map(function (k) {
        var st = k.stack || [], pics = st.map(picOf).filter(Boolean).slice(0, 3);
        return '<button type="button" class="uv-tile" data-list="' + esc(k.id) + '" title="' + esc(k.title + (st.length ? ' — ' + st.slice(0, 5).map(function (x) { return x.title; }).join(', ') + (st.length > 5 ? '…' : '') : ' — empty')) + '">' + art(listSkin(k), '', (k.title || '?').replace(/^my\s+/i, '').charAt(0)) + '<b>' + esc(k.title) + '</b><small>' + st.length + ' thing' + (st.length === 1 ? '' : 's') + '</small>' +
          (pics.length ? '<span class="mini">' + pics.map(function (p) { return '<img alt="" loading="lazy" src="' + esc(p) + '">'; }).join('') + '</span>' : '') + '</button>';
      }).join('') + '</div>';
    });
    if (!ls.length) h += '<div class="uv-empty"><p>No lists here yet — tap Add to make one.</p></div>';
    return h;
  }
  // ---- Level 3: a list — the real things (List / Gallery); Level 4 = the existing details
  function listHtml(b, k) {
    if (!k) return '<div class="uv-empty"><p>This list is not here any more.</p></div>';
    var st = lv(), view = st.view || ((k.stack || []).some(picOf) ? 'gallery' : 'list'), q = String(st.q || '').toLowerCase();
    var its = (k.stack || []).filter(function (s) { return s && s.id && (!q || String(s.title + ' ' + (s.desc || '')).toLowerCase().indexOf(q) >= 0); });
    var h = '<div class="uv-hero">' + art(listSkin(k), '', (k.title || '?').replace(/^my\s+/i, '').charAt(0)) + '<div class="tx"><h2>' + esc(k.title) + '</h2><p>' + (k.stack || []).length + ' thing' + ((k.stack || []).length === 1 ? '' : 's') + '</p>' +
      '<div class="uv-tools"><button type="button" class="uv-pill" data-inspect="' + esc(listSkin(k)) + '">' + ICON.cube + 'Inspect 3D</button><button type="button" class="uv-pill" data-skin="l">' + ICON.brush + 'Object</button><button type="button" class="uv-pill" data-kanban>Kanban</button></div></div></div>';
    h += hint('list', b, null, k);
    h += '<div class="uv-seg"><button type="button" data-view="list"' + (view === 'list' ? ' class="on"' : '') + '>List</button><button type="button" data-view="gallery"' + (view === 'gallery' ? ' class="on"' : '') + '>Gallery</button></div>';
    if ((k.stack || []).length > 6) h += '<label class="uv-search">' + ICON.search + '<input data-q placeholder="Search in ' + esc(k.title) + '" value="' + esc(st.q || '') + '" autocomplete="off"></label>';
    if (!its.length) return h + '<div class="uv-empty"><p>' + (q ? 'Nothing matches.' : 'Nothing here yet — tap Add to My World.') + '</p></div>';
    if (view === 'gallery') h += '<div class="uv-gal">' + its.map(function (s) { var p = picOf(s); return '<button type="button" class="uv-gi' + (st.sel === s.id ? ' sel' : '') + '" data-item="' + esc(s.id) + '">' + (p ? '<img alt="" loading="lazy" src="' + esc(p) + '">' : '<span class="ph2" style="--h:' + (hashOf(s.title) % 360) + '">' + esc(s.title) + '</span>') + '<b>' + esc(s.title) + '</b></button>'; }).join('') + '</div>';
    else h += '<div class="uv-items">' + its.map(function (s) { var p = picOf(s); return '<button type="button" class="uv-it' + (st.sel === s.id ? ' sel' : '') + '" data-item="' + esc(s.id) + '">' + (p ? '<img alt="" loading="lazy" src="' + esc(p) + '">' : '<span class="nb"></span>') + '<div><b>' + esc(s.title) + '</b><small>' + esc(String(s.desc || '').split('\n')[0]) + '</small></div>' + ICON.chev + '</button>'; }).join('') + '</div>';
    return h;
  }
  // one gentle, skippable suggestion per place
  function hint(kind, b, col, k) {
    var key = kind + ':' + (k ? k.id : col ? col.id : b.id); if (KN() && KN().get('uv:nohint:' + key)) return '';
    var t = null, act = null;
    if (kind === 'list' && (k.stack || []).length >= 2 && window.MinestDiscover) { t = 'Play This or That with ' + k.title; act = 'discover'; }
    else if (kind === 'list' && vlCategory(k.title) && window.MinestVisualLibrary) { t = 'Find ' + k.title.replace(/^my\s+/i, '').toLowerCase() + ' in the Visual Library'; act = 'vl'; }
    else if (kind === 'cat' && vlCategory(col.title) && window.MinestVisualLibrary) { t = 'Discover ' + col.title.replace(/^my\s+/i, '').toLowerCase() + ' to collect'; act = 'vl'; }
    else if (kind === 'world' && window.MinestFrameworks) { t = 'See ' + b.title + ' through a framework'; act = 'fw'; }
    if (!t) return '';
    return '<div class="uv-hint"><span>' + ICON.spark + '</span><b>' + esc(t) + '</b><button type="button" class="go" data-hint="' + act + '">Go</button><button type="button" data-nohint="' + esc(key) + '" aria-label="Skip">×</button></div>';
  }
  // ---- Outline (2D): the same place as a tree; tapping keeps you in Outline
  function outlineHtml(n, side) {
    var ws = worlds(), here = keyOf(n), h = '<div class="uv-ol">';
    function row(nn, depth, label, count, dot) { var k = keyOf(nn); return '<button type="button" class="uv-or' + (k === here ? ' here' : '') + '" style="padding-left:' + (8 + depth * 18) + 'px" data-ol="' + esc(JSON.stringify(nn)) + '">' + (dot ? '<i class="dt" style="background:' + esc(dot) + '"></i>' : '') + esc(label) + '<em>' + count + '</em></button>'; }
    ws.forEach(function (w) {
      var wn = { t: 'world', bid: w.bid }, open = n.t !== 'home' && n.bid === w.bid;
      h += row(wn, 0, w.title, w.items);
      if (!open) return;
      (w.b.columns || []).forEach(function (c) {
        var cn = { t: 'cat', bid: w.bid, col: c.id }, ls = listsOf(c);
        h += row(cn, 1, c.title, ls.length + ' lists', c.color);
        if (!(n.col === c.id || n.t === 'world')) return;
        ls.forEach(function (k) { h += row({ t: 'list', bid: w.bid, col: c.id, card: k.id }, 2, k.title, (k.stack || []).length); });
      });
    });
    h += '</div>';
    if (side) return h;
    if (n.t === 'list') { var b = boardById(n.bid), k = b && cardOf(b, n.card); if (k) h += '<div class="uv-sec">' + esc(k.title) + '</div><div class="uv-items">' + (k.stack || []).map(function (s) { return '<button type="button" class="uv-it" data-item="' + esc(s.id) + '"><div><b>' + esc(s.title) + '</b></div>' + ICON.chev + '</button>'; }).join('') + '</div>'; }
    if (!ws.length) h += '<div class="uv-empty"><p>No worlds yet.</p></div>';
    return h;
  }

  // ================================================================== sheets (overview · add · skins · inspect · more)
  function sheet(html, opts) {
    closeSheet(true);
    var dim = document.createElement('div'); dim.className = 'uv-dim';
    var sh = document.createElement('div'); sh.className = 'uv-sheet'; sh.setAttribute('role', 'dialog'); sh.innerHTML = '<div class="grab"></div>' + html;
    ui.el.appendChild(dim); ui.el.appendChild(sh); ui.sheet = { dim: dim, el: sh, opts: opts || {} };
    dim.addEventListener('click', function () { closeSheet(); });
    if (!reduce && sh.animate) sh.animate([{ transform: (window.innerWidth >= 700 ? 'translateX(-50%) ' : '') + 'translateY(30px)', opacity: 0 }, { transform: (window.innerWidth >= 700 ? 'translateX(-50%) ' : '') + 'none', opacity: 1 }], { duration: 240, easing: 'cubic-bezier(.2,.85,.25,1)' });
    hydrate(sh);
    return sh;
  }
  function closeSheet(quiet) { if (!ui.sheet) return; stop3D(); var s = ui.sheet; ui.sheet = null; s.dim.remove(); s.el.remove(); if (s.opts.onClose && !quiet) s.opts.onClose(); }
  function overview() {
    var ws = worlds(), lists = ws.reduce(function (a, w) { return a + w.lists; }, 0), items = ws.reduce(function (a, w) { return a + w.items; }, 0);
    sheet('<h3>My World</h3><p class="sub">Everything I collect, in one universe.</p><div class="uv-stats"><div><b>' + ws.length + '</b><span>Worlds</span></div><div><b>' + lists + '</b><span>Lists</span></div><div><b>' + items + '</b><span>Things</span></div></div>' +
      hiddenHtml() + '<button type="button" class="uv-row" data-centerstyle><i>🏰</i><div><b>Centre island style</b><small>' + esc(((AS && AS.info(centerSkin())) || {}).name || 'Castle World') + ' — only the look changes</small></div></button>' +
      secondary());
  }
  function secondary() {
    return [['📥', 'Inbox', 'Things waiting to be sorted', 'inbox'], ['✨', 'Discover My World', 'This or That, Tier List, Desert Island…', 'discover'], ['🧭', 'Frameworks', 'Ways of seeing the world', 'frameworks'],
      ['🗺️', 'Worldview Templates', 'Start or grow a world from a template', 'templates'], ['💡', 'Inspiration Library', 'Prompts to spark curiosity — answer any, skip any', 'inspiration'], ['🌱', 'Grow My World', 'Small ideas from what you already have', 'grow'], ['🧩', 'Visual Assets', 'All 72 islands, scenes, objects and centres', 'assets'], ['🕘', 'Activity', 'Recently added and organized', 'activity'], ['🪐', 'My World 2.0 view', 'The classic lists page', 'classic']]
      .map(function (x) { return '<button type="button" class="uv-row" data-sec="' + x[3] + '"><i>' + x[0] + '</i><div><b>' + x[1] + '</b><small>' + x[2] + '</small></div></button>'; }).join('');
  }
  function centerPicker() {
    if (!AS) return;
    var cs = AS.catalog.center, on = centerSkin();
    sheet('<h3>Centre island</h3><p class="sub">Choose the heart of your universe. Your worlds and things stay exactly as they are.</p><div class="uv-pick">' + cs.map(function (c) { return '<button type="button" data-setcenter="' + c.id + '"' + (c.id === on ? ' class="on"' : '') + '>' + art(c.id, '', '✦') + esc(c.name) + '</button>'; }).join('') + '</div>');
  }
  function skinPicker(kind) {
    var n = cur(), b = boardById(n.bid); if (!AS || !b) return;
    var cat = kind === 'w' ? AS.catalog.world : kind === 'c' ? AS.catalog.diorama : AS.catalog.object, on = kind === 'w' ? worldSkin(b.id) : kind === 'c' ? catSkin(b.id, colOf(b, n.col)) : listSkin(cardOf(b, n.card));
    var key = kind === 'w' ? 'uv:skin:w:' + b.id : kind === 'c' ? 'uv:skin:c:' + b.id + ':' + n.col : 'uv:skin:l:' + n.card;
    var title = kind === 'w' ? b.title : kind === 'c' ? (colOf(b, n.col) || {}).title : (cardOf(b, n.card) || {}).title, sug = suggest(kind, title), q = String(ui.skinQ || '').toLowerCase();
    ui.skinKind = kind;
    if (q) cat = cat.filter(function (a) { return (a.name + ' ' + a.subcategories.join(' ') + ' ' + a.theme).toLowerCase().indexOf(q) >= 0; });
    sheet('<h3>' + (kind === 'w' ? 'Choose an island' : kind === 'c' ? 'Choose a scene' : 'Choose an object') + '</h3><p class="sub">Only the look changes — nothing inside is moved or renamed.</p>' +
      '<label class="uv-search">' + ICON.search + '<input data-skinq placeholder="Search assets" value="' + esc(ui.skinQ || '') + '" autocomplete="off"></label>' +
      (sug.length && !q ? '<div class="uv-sec" style="margin-top:0">Suggested for ' + esc(title) + '</div><div class="uv-pick">' + sug.map(function (a) { return '<button type="button" data-setskin="' + esc(key + '|' + a.id) + '"' + (a.id === on ? ' class="on"' : '') + '>' + art(a.id, '', '·') + esc(a.name) + '</button>'; }).join('') + '</div><div class="uv-sec">All</div>' : '') +
      '<div class="uv-pick">' +
      cat.map(function (a) { return '<button type="button" data-setskin="' + esc(key + '|' + a.id) + '"' + (a.id === on ? ' class="on"' : '') + '>' + art(a.id, '', '·') + esc(a.name) + '</button>'; }).join('') + '</div>' +
      (KN().get(key) ? '<button type="button" class="uv-go sec" data-setskin="' + esc(key + '|') + '">Back to the automatic match</button>' : ''));
  }
  var live = null;
  function stop3D() { if (live) { try { live.dispose(); } catch (e) {} live = null; } }
  function inspect(id) {
    var info = AS && AS.info(id);
    var sh = sheet('<h3>' + esc((info && info.name) || 'Inspect') + '</h3><p class="sub">' + esc((info && (info.subtitle || info.theme)) || '') + ' — drag to turn.</p><div class="uv-3d" data-live></div>');
    assets().then(function (as) {
      var box = sh.querySelector('[data-live]'); if (!as || !box) return;
      live = as.mount(box, id);
      if (!live) box.innerHTML = '<div class="uv-empty" style="padding-top:40%"><p>3D isn’t available on this device — the picture is all you need.</p></div>';
    });
  }
  // ---- Explore Mode: the archipelago as a live scene (built only on request; the map stays the default)
  var liveX = null;
  function stopX() { if (liveX) { try { liveX.dispose(); } catch (e) {} liveX = null; } }
  function startX() {
    var box = ui.stage.querySelector('[data-x3]'); if (!box) return;
    assets().then(function (as) {
      if (!as || !ui.open || !box.isConnected) return;
      var ws = worlds(), slot = slotsFor(ws);
      liveX = as.archipelago(box, { center: centerSkin(), centerLabel: 'My World', islands: ws.map(function (w) { var p = SLOTS[slot[w.bid] % SLOTS.length]; return { key: w.bid, id: worldSkin(w.bid), x: p.x, y: p.y, label: w.title }; }) },
        function (key) { if (key === '@center') return overview(); go([{ t: 'home' }, { t: 'world', bid: key }], null, 'in'); });
      if (!liveX) { ui.explore = false; toast('3D isn’t available on this device — here is the map.'); render(); }
    });
  }
  // ---- every asset, browsable (and inspectable): islands · scenes · objects · centres
  function assetLibrary(tab) {
    if (!AS) return assets().then(function () { if (AS) assetLibrary(tab); });
    ui.libTab = tab || ui.libTab || 'world';
    var T = [['world', 'Islands', 'Level 1'], ['diorama', 'Scenes', 'Level 2'], ['object', 'Objects', 'Level 3'], ['center', 'Centres', 'Level 0']];
    sheet('<h3>Visual Assets</h3><p class="sub">Studio’s library — skins for your worlds, areas and lists. Tap one to look closer.</p><div class="uv-seg2">' + T.map(function (t) { return '<button type="button" data-libtab="' + t[0] + '"' + (ui.libTab === t[0] ? ' class="on"' : '') + '>' + t[1] + ' · ' + AS.catalog[t[0]].length + '</button>'; }).join('') + '</div>' +
      '<div class="uv-pick">' + AS.catalog[ui.libTab].map(function (a) { return '<button type="button" data-libinspect="' + a.id + '">' + art(a.id, '', '·') + esc(a.name) + '<small>' + esc(a.category || a.theme || '') + '</small></button>'; }).join('') + '</div>');
  }
  // suggestions for a title: assets whose name / subcategories / theme share words with it
  function suggest(kind, title) {
    var words = String(title || '').toLowerCase().replace(/^my\s+/, '').match(/[a-z]{3,}/g) || [], cat = AS.catalog[kind === 'w' ? 'world' : kind === 'c' ? 'diorama' : 'object'], first = rule(kind === 'w' ? 'world' : kind === 'c' ? 'diorama' : 'object', title);
    var scored = cat.map(function (a) { var hay = (a.name + ' ' + a.subcategories.join(' ') + ' ' + a.theme + ' ' + a.category).toLowerCase(), sc = 0; words.forEach(function (w) { if (hay.indexOf(w.replace(/s$/, '')) >= 0) sc += 1; }); if (a.id === first) sc += 3; return [a, sc]; })
      .filter(function (x) { return x[1] > 0; }).sort(function (a, b) { return b[1] - a[1]; });
    return scored.slice(0, 4).map(function (x) { return x[0]; });
  }
  function hiddenHtml() {
    var hid = (W() ? W().worlds() : []).filter(function (x) { return KN() && KN().get('uv:hide:' + x.b.id); });
    if (!hid.length) return '';
    return '<div class="uv-sec">Hidden from the archipelago</div>' + hid.map(function (x) { return '<button type="button" class="uv-row" data-unhide="' + esc(x.b.id) + '"><i>👁</i><div><b>' + esc(x.b.title) + '</b><small>Tap to show it again — nothing inside was touched</small></div></button>'; }).join('');
  }
  // what changed on the boards while another tool was open → one "Saved → …" with Open · Change · Undo
  function snapshot() { var m = {}; worlds().forEach(function (w) { (w.b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { (k.stack || []).forEach(function (s) { m[s.id] = 1; }); }); }); }); return m; }
  function arrivals(before) {
    var out = [];
    worlds().forEach(function (w) { (w.b.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { (k.stack || []).forEach(function (s) { if (!before[s.id]) out.push({ bid: w.bid, col: c.id, card: k.id, list: k.title, world: w.title, sid: s.id, title: s.title }); }); }); }); });
    return out;
  }
  function savedFrom(news) {
    if (!news.length) return;
    var byList = {}; news.forEach(function (x) { (byList[x.card] = byList[x.card] || []).push(x); });
    var lists = Object.keys(byList), first = byList[lists[0]][0], n = news.length;
    var msg = 'Saved ' + (n === 1 ? '“' + first.title + '”' : n + ' things') + ' → ' + (lists.length === 1 ? first.list : lists.length + ' lists');
    saved(msg, [['Open', function () { go([{ t: 'home' }, { t: 'world', bid: first.bid }, { t: 'cat', bid: first.bid, col: first.col }, { t: 'list', bid: first.bid, col: first.col, card: first.card }], null, 'in'); }],
      ['Change', function () { moveSheet(news); }],
      ['Undo', function () { undoArrivals(news); }]]);
  }
  function undoArrivals(news) {
    var logs = window.MinestCapture && MinestCapture.logs ? MinestCapture.logs() : [], ids = {}; news.forEach(function (x) { ids[x.sid] = 1; });
    var log = logs.filter(function (l) { return !l.undone && (l.stacks || []).length && l.stacks.every(function (s) { return ids[s.id]; }); })[0];
    if (log) { MinestCapture.undo(log.id).then(function () { toast('Undone'); setTimeout(render, 250); }); return; }
    var by = {}; news.forEach(function (x) { (by[x.bid] = by[x.bid] || {})[x.sid] = 1; });
    Object.keys(by).forEach(function (bid) { A().updateBoard(bid, function (bd) { return Object.assign({}, bd, { columns: (bd.columns || []).map(function (c) { return Object.assign({}, c, { cards: (c.cards || []).map(function (k) { if (!(k.stack || []).some(function (s) { return by[bid][s.id]; })) return k; var st = k.stack.filter(function (s) { return !by[bid][s.id]; }); return Object.assign({}, k, { stack: st, hasStack: st.length > 0 }); }) }); }) }); }); });
    toast('Undone'); setTimeout(render, 250);
  }
  // Change: move what just arrived to another list of the same world (the same cards — nothing copied)
  function moveSheet(news) {
    var bid = news[0].bid, b = boardById(bid); if (!b) return;
    ui.moving = news;
    sheet('<h3>Move to…</h3><p class="sub">' + news.length + ' thing' + (news.length === 1 ? '' : 's') + ' from ' + esc(news[0].list) + '</p>' + (b.columns || []).map(function (c) {
      return '<div class="uv-sec">' + esc(c.title) + '</div>' + listsOf(c).filter(function (k) { return k.id !== news[0].card; }).map(function (k) { return '<button type="button" class="uv-row" data-moveto="' + esc(c.id + '|' + k.id) + '"><i>' + '•' + '</i><div><b>' + esc(k.title) + '</b><small>' + (k.stack || []).length + ' things</small></div></button>'; }).join('');
    }).join(''));
  }
  function moveTo(col, card) {
    var news = ui.moving || [], ids = {}; news.forEach(function (x) { ids[x.sid] = 1; }); var bid = news[0].bid, moved = [];
    A().updateBoard(bid, function (bd) {
      var take = []; bd = JSON.parse(JSON.stringify(bd));
      (bd.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { if (!k.stack) return; var keep = []; k.stack.forEach(function (s) { if (ids[s.id]) take.push(s); else keep.push(s); }); k.stack = keep; k.hasStack = keep.length > 0; }); });
      (bd.columns || []).forEach(function (c) { (c.cards || []).forEach(function (k) { if (k.id === card) { k.stack = (k.stack || []).concat(take); k.hasStack = true; } }); });
      moved = take; return bd;
    });
    closeSheet(true); var b = boardById(bid), k = b && cardOf(b, card);
    toast('Moved → ' + ((k && k.title) || 'the list')); setTimeout(render, 250);
  }

  // ---- Universal Add: Capture · Visual Library · New List · Templates
  function addSheet() {
    var n = cur(), b = n.bid ? boardById(n.bid) : null, k = n.t === 'list' && b ? cardOf(b, n.card) : null, col = (n.t === 'cat' || n.t === 'list') && b ? colOf(b, n.col) : null;
    var where = k ? 'Adding to <b>' + esc(k.title) + '</b>' : col ? 'In <b>' + esc(col.title) + '</b>' : b ? 'In <b>' + esc(b.title) + '</b>' : 'Saved to your Inbox first — sort it any time';
    sheet('<h3>Add to My World</h3><p class="sub">' + where + '</p><div class="uv-acts">' +
      '<button type="button" class="uv-act" data-a="capture"><i>✍️</i><b>Capture</b><small>' + (k ? 'Text, photo or link — into this list' : 'Text, photo, link or idea → Inbox') + '</small></button>' +
      (window.MinestVisualLibrary ? '<button type="button" class="uv-act" data-a="vl"><i>🖼️</i><b>Visual Library</b><small>Movies, books, music, people, places…</small></button>' : '') +
      '<button type="button" class="uv-act" data-a="list"><i>📋</i><b>New List</b><small>Just a name — the rest is suggested</small></button>' +
      '<button type="button" class="uv-act" data-a="tpl"><i>🗺️</i><b>Templates</b><small>A whole world or a few areas</small></button></div>');
  }
  function newListSheet() {
    var n = cur(), ws = worlds(); if (!ws.length) return toast('Make a world first — Templates is the quickest start.');
    var bid = n.bid || ws[0].bid, b = boardById(bid), colId = n.col || ((b.columns || [])[0] || {}).id;
    ui.nl = { bid: bid, col: colId, name: '', view: 'list' };
    drawNewList();
  }
  function drawNewList() {
    var nl = ui.nl, ws = worlds();
    sheet('<h3>New List</h3><p class="sub">Type a name — the place and look are suggested; change them now or later.</p>' +
      '<input class="uv-in" data-nlname placeholder="e.g. My Favorite Movies" maxlength="60" value="' + esc(nl.name) + '" autocomplete="off">' +
      (ws.length > 1 ? '<div class="uv-sec" style="margin-top:4px">World</div><div class="uv-chipsel">' + ws.map(function (w) { return '<button type="button" data-nlw="' + esc(w.bid) + '"' + (w.bid === nl.bid ? ' class="on"' : '') + '>' + esc(w.title) + '</button>'; }).join('') + '</div>' : '') +
      '<div data-nlsug>' + nlSug() + '</div>' +
      '<div class="uv-seg"><button type="button" data-nlv="list"' + (nl.view === 'list' ? ' class="on"' : '') + '>List</button><button type="button" data-nlv="gallery"' + (nl.view === 'gallery' ? ' class="on"' : '') + '>Gallery</button></div>' +
      '<button type="button" class="uv-go" data-nlsave>Create list</button>');
    setTimeout(function () { var i = ui.sheet && ui.sheet.el.querySelector('[data-nlname]'); if (i && !nl.name) i.focus(); }, 80);
  }
  // the part that follows the name as it is typed: 2–3 explained areas (Building Assist), every area, and the object
  function nlSug() {
    var nl = ui.nl, b = boardById(nl.bid), obj = rule('object', nl.name) || POOL.object[hashOf(nl.name || 'x') % POOL.object.length];
    var place = rule('diorama', nl.name), placeName = place && AS && (AS.info(place) || {}).name;
    var opts = window.MinestAssist && nl.name ? MinestAssist.areaOptions(nl.bid, nl.name, function (c) { return place && catSkin(b.id, c) === place ? { score: 2, why: 'Same kind of place · ' + placeName } : null; }) : [];
    if (opts.length && !nl.colTouched) nl.col = opts[0].col;
    return (opts.length ? '<div class="uv-sec" style="margin-top:4px">Suggested area</div><div class="as-chips">' + opts.map(function (o) { return '<button type="button" class="as-chip' + (o.col === nl.col ? ' on' : '') + '" data-nlc="' + esc(o.col) + '">' + esc(o.title) + '<small>' + esc(o.why) + '</small></button>'; }).join('') + '</div>' : '') +
      '<div class="uv-sec" style="margin-top:4px">' + (opts.length ? 'Or any area' : 'Area') + '</div><div class="uv-chipsel">' + (b.columns || []).map(function (c) { return '<button type="button" data-nlc="' + esc(c.id) + '"' + (c.id === nl.col ? ' class="on"' : '') + '>' + esc(c.title) + '</button>'; }).join('') + '</div>' +
      '<div style="display:flex;align-items:center;gap:12px;margin:6px 0"><span style="width:72px">' + art(obj, '', '·') + '</span><div><b style="font-size:14px">' + esc((AS && AS.info(obj) || {}).name || '') + '</b><div style="font-size:12.5px;color:var(--uv-sub)">Its object — change it any time</div></div></div>';
  }
  function redrawSug() { var box = ui.sheet && ui.sheet.el.querySelector('[data-nlsug]'); if (!box) return drawNewList(); box.innerHTML = nlSug(); hydrate(box); }
  function saveNewList() {
    var nl = ui.nl, name = String(nl.name || '').trim(); if (!name) return toast('Give the list a name.');
    var b = boardById(nl.bid); if (!b || !colOf(b, nl.col)) return toast('✗ That area is not there any more.');
    if (listsOf(colOf(b, nl.col)).some(function (k) { return String(k.title).toLowerCase() === name.toLowerCase(); })) return toast('There is already a list called “' + name + '” here.');
    var id = nl.bid + '-l-uv-' + Date.now().toString(36);
    var card = { id: id, title: /^my\s/i.test(name) ? name : 'My ' + name.charAt(0).toUpperCase() + name.slice(1), desc: '', labels: [], complete: false, createdAt: Date.now(), mastery: 1, checklistItems: [], stack: [] };
    try { A().updateBoard(nl.bid, function (bd) { return Object.assign({}, bd, { columns: (bd.columns || []).map(function (c) { return c.id === nl.col ? Object.assign({}, c, { cards: (c.cards || []).concat([card]) }) : c; }) }); }); }
    catch (e) { return toast('✗ The list could not be saved — please try again.'); }
    S.lv['l:' + nl.bid + ':' + id] = { view: nl.view };
    var where = { t: 'list', bid: nl.bid, col: nl.col, card: id }, colT = colOf(b, nl.col).title;
    closeSheet(true); hap('success');
    setTimeout(function () {
      if (!cardOf(boardById(nl.bid) || {}, id)) return toast('✗ The list could not be saved — please try again.');
      saved('Saved “' + card.title + '” → ' + colT, [['Open', function () { go(ui.path.slice(0, 1).concat([{ t: 'world', bid: nl.bid }, { t: 'cat', bid: nl.bid, col: nl.col }, where]), null, 'in'); }],
        ['Undo', function () { A().updateBoard(nl.bid, function (bd) { return Object.assign({}, bd, { columns: (bd.columns || []).map(function (c) { return Object.assign({}, c, { cards: (c.cards || []).filter(function (x) { return x.id !== id || (x.stack || []).length; }) }); }) }); }); setTimeout(render, 200); toast('List removed'); }]]);
      render();
    }, 220);
  }
  // Saved → destination · Open / Undo (one feedback for every add made here)
  function saved(msg, acts) {
    var el = toast(msg, { duration: 7000 }); if (!el || !el.appendChild) return;
    acts.forEach(function (a) { var u = document.createElement('button'); u.type = 'button'; u.textContent = a[0]; u.style.cssText = 'margin-left:10px;font-weight:700;color:#5ac8fa;background:none;border:0;padding:0 2px;cursor:pointer;white-space:nowrap;flex:none'; u.addEventListener('click', function (e) { e.stopPropagation(); el.click(); a[1](); }); el.appendChild(u); });
  }
  function moreSheet() { sheet('<h3>My World</h3><p class="sub">Everything else lives here — your worlds stay front and centre.</p>' + secondary()); }

  // ================================================================== actions
  // open another Minest tool on top; come back to the same place when it closes
  function onTop(fn, quiet) { closeSheet(true); var before = quiet ? null : snapshot(); try { fn(); } catch (e) { toast('✗ That could not open.'); } watchReturn(before); }
  var watchT = 0;
  function watchReturn(before) {
    clearTimeout(watchT); var seen = false, t0 = Date.now();
    (function poll() {
      if (!ui.open) return;
      var top = !!document.querySelector('.mw,.wc,.st,.pk,.dv,.fw,.bd,.lw,.wk,.sk,.ins');
      if (top) seen = true;
      if (seen && !top) { var y = ui.body.scrollTop; render(); ui.body.scrollTop = y; if (before) setTimeout(function () { savedFrom(arrivals(before)); }, 350); return; }
      if (!seen && Date.now() - t0 > 5000) return;
      watchT = setTimeout(poll, 300);
    })();
  }
  function openItem(sid) {
    var n = cur(), b = boardById(n.bid); lv().sel = sid; saveState();
    if (window.MinestStarter && MinestStarter.openItem) return onTop(function () { MinestStarter.openItem(n.bid, sid); }, true);
    var k = cardOf(b, n.card); close(); setTimeout(function () { try { A().openCardIn(n.bid, n.col, k.id); } catch (e) {} }, 200);
  }
  function secAction(what) {
    closeSheet(true);
    var n = cur(), bid = n.bid || (worlds()[0] || {}).bid;
    if (what === 'inbox' && window.MinestMyWorld) return onTop(function () { MinestMyWorld.open(); setTimeout(function () { var b = document.querySelector('.mw [data-inbox]'); if (b) b.click(); }, 120); });
    if (what === 'discover' && window.MinestDiscover) return onTop(function () { MinestDiscover.open(); }, true);
    if (what === 'frameworks' && window.MinestFrameworks) return onTop(function () { MinestFrameworks.open(); }, true);
    if (what === 'assets') return assetLibrary();
    if (what === 'inspiration' && window.MinestInspire) return onTop(function () { MinestInspire.library(); });
    if (what === 'grow' && window.MinestInspire) return onTop(function () { MinestInspire.grow(); });
    if (what === 'templates' && window.MinestMyWorld) return onTop(function () { MinestMyWorld.gallery(); });
    if (what === 'activity' && window.MinestMyWorld) return onTop(function () { MinestMyWorld.open(); setTimeout(function () { var b = document.querySelector('.mw [data-recent]'); if (b) b.click(); }, 120); });
    if (what === 'classic' && window.MinestMyWorld) { close(); setTimeout(function () { MinestMyWorld.open(); }, 180); }
  }
  function addAction(a) {
    var n = cur(), b = n.bid ? boardById(n.bid) : null, k = n.t === 'list' && b ? cardOf(b, n.card) : null, col = n.col && b ? colOf(b, n.col) : null;
    if (a === 'capture') {
      if (k && window.MinestStarter && MinestStarter.addTo) return onTop(function () { MinestStarter.addTo(n.bid, k.id); });
      if (window.MinestCapture) return onTop(function () { MinestCapture.open(b ? { wbid: b.id } : {}); });
    }
    if (a === 'vl' && window.MinestVisualLibrary) { var cat = vlCategory((k && k.title) || (col && col.title) || ''); return onTop(function () { MinestVisualLibrary.open(Object.assign({}, b ? { bid: b.id } : {}, cat ? { category: cat } : {})); }); }
    if (a === 'list') return newListSheet();
    if (a === 'tpl' && window.MinestMyWorld) return onTop(function () { MinestMyWorld.gallery(); });
  }
  function onInput(e) {
    var t = e.target;
    if (t.matches('[data-q]')) { lv().q = t.value; var pos = t.selectionStart; render(); var i = ui.stage.querySelector('[data-q]'); if (i) { i.focus(); try { i.setSelectionRange(pos, pos); } catch (x) {} } return; }
    if (t.matches('[data-skinq]')) { ui.skinQ = t.value; var p0 = t.selectionStart; clearTimeout(ui.skT); ui.skT = setTimeout(function () { skinPicker(ui.skinKind); var i0 = ui.sheet && ui.sheet.el.querySelector('[data-skinq]'); if (i0) { i0.focus(); try { i0.setSelectionRange(p0, p0); } catch (x) {} } }, 200); return; }
    if (t.matches('[data-nlname]')) { ui.nl.name = t.value; clearTimeout(ui.nlT); ui.nlT = setTimeout(redrawSug, 250); }
  }
  function onClick(e) {
    var t = e.target, g;
    if (ui.sheet && ui.sheet.el.contains(t)) return sheetClick(t);
    if (t.closest('[data-x]')) return close();
    if (t.closest('[data-back]')) return back();
    if (t.closest('[data-home]')) return home();
    if (t.closest('[data-add]')) return addSheet();
    if (t.closest('[data-more]')) return moreSheet();
    if (t.closest('[data-mode]')) { S.mode = S.mode === 'outline' ? 'spatial' : 'outline'; stSave(); var y = ui.body.scrollTop; render(); animate(null, null); ui.body.scrollTop = S.mode === 'outline' ? 0 : (lv().y || y); return; }
    if ((g = t.closest('[data-crumb]'))) { var i = +g.getAttribute('data-crumb'); if (i < ui.path.length - 1) { var leaving = ui.path[i + 1]; go(ui.path.slice(0, i + 1), null, 'out'); flashBack(leaving); } return; }
    if (t.closest('[data-center]')) return overview();
    if ((g = t.closest('[data-world]'))) { hap(); return go([{ t: 'home' }, { t: 'world', bid: g.getAttribute('data-world') }], g, 'in'); }
    if ((g = t.closest('[data-cat]'))) { var n = cur(); hap(); return go(ui.path.concat([{ t: 'cat', bid: n.bid, col: g.getAttribute('data-cat') }]), g, 'in'); }
    if ((g = t.closest('[data-list]'))) { var n2 = cur(); hap(); return go(ui.path.concat([{ t: 'list', bid: n2.bid, col: n2.col, card: g.getAttribute('data-list') }]), g, 'in'); }
    if ((g = t.closest('[data-item]'))) return openItem(g.getAttribute('data-item'));
    if ((g = t.closest('[data-ol]'))) { var nn = JSON.parse(g.getAttribute('data-ol')), p = [{ t: 'home' }]; if (nn.bid) p.push({ t: 'world', bid: nn.bid }); if (nn.col) p.push({ t: 'cat', bid: nn.bid, col: nn.col }); if (nn.card) p.push(nn); return go(p, null, null); }
    if ((g = t.closest('[data-view]'))) { lv().view = g.getAttribute('data-view'); stSave(); var y2 = ui.body.scrollTop; render(); ui.body.scrollTop = y2; return; }
    if ((g = t.closest('[data-inspect]'))) return inspect(g.getAttribute('data-inspect'));
    if ((g = t.closest('[data-skin]'))) { ui.skinQ = ''; return skinPicker(g.getAttribute('data-skin')); }
    if (t.closest('[data-explore]')) { ui.explore = !ui.explore; render(); return; }
    if (t.closest('[data-hideworld]')) { var nh = cur(), bh = boardById(nh.bid); KN().set('uv:hide:' + nh.bid, 1, true); home(); saved('“' + (bh && bh.title) + '” is hidden — its things are untouched', [['Undo', function () { KN().set('uv:hide:' + nh.bid, null, true); render(); }]]); return; }
    if (t.closest('[data-kanban]')) { var n3 = cur(); close(); setTimeout(function () { try { A().selectBoard(n3.bid); } catch (x) {} }, 180); return; }
    if (t.closest('[data-templates]')) return secAction('templates');
    if (t.closest('[data-inbox]')) return secAction('inbox');
    if ((g = t.closest('[data-nohint]'))) { KN().set('uv:nohint:' + g.getAttribute('data-nohint'), 1, true); g.closest('.uv-hint').remove(); return; }
    if ((g = t.closest('[data-hint]'))) {
      var h = g.getAttribute('data-hint'), n4 = cur(), b4 = boardById(n4.bid), k4 = n4.card && cardOf(b4, n4.card), c4 = n4.col && colOf(b4, n4.col);
      if (h === 'discover') return onTop(function () { MinestDiscover.open({ bid: n4.bid, cardId: k4.id }); });
      if (h === 'vl') return onTop(function () { MinestVisualLibrary.open({ bid: n4.bid, category: vlCategory((k4 && k4.title) || (c4 && c4.title)) }); });
      if (h === 'fw') return onTop(function () { MinestFrameworks.open(); });
    }
  }
  function sheetClick(t) {
    var g;
    if ((g = t.closest('[data-a]'))) return addAction(g.getAttribute('data-a'));
    if ((g = t.closest('[data-sec]'))) return secAction(g.getAttribute('data-sec'));
    if (t.closest('[data-centerstyle]')) return centerPicker();
    if ((g = t.closest('[data-setcenter]'))) { KN().set('uv:center', g.getAttribute('data-setcenter'), true); closeSheet(true); render(); toast('Centre island changed — nothing else moved'); return; }
    if ((g = t.closest('[data-libtab]'))) return assetLibrary(g.getAttribute('data-libtab'));
    if ((g = t.closest('[data-libinspect]'))) return inspect(g.getAttribute('data-libinspect'));
    if ((g = t.closest('[data-unhide]'))) { KN().set('uv:hide:' + g.getAttribute('data-unhide'), null, true); closeSheet(true); render(); toast('Back in your archipelago — in its old place'); return; }
    if ((g = t.closest('[data-moveto]'))) { var mv = g.getAttribute('data-moveto').split('|'); return moveTo(mv[0], mv[1]); }
    if ((g = t.closest('[data-setskin]'))) { var p = g.getAttribute('data-setskin').split('|'); KN().set(p[0], p[1] || null, true); closeSheet(true); render(); toast(p[1] ? 'Look changed — your things are untouched' : 'Back to the automatic match'); return; }
    if ((g = t.closest('[data-nlw]'))) { ui.nl.bid = g.getAttribute('data-nlw'); ui.nl.col = ((boardById(ui.nl.bid).columns || [])[0] || {}).id; ui.nl.colTouched = false; var nm = ui.sheet.el.querySelector('[data-nlname]'); if (nm) ui.nl.name = nm.value; return drawNewList(); }
    if ((g = t.closest('[data-nlc]'))) { ui.nl.col = g.getAttribute('data-nlc'); ui.nl.colTouched = true; return redrawSug(); }
    if ((g = t.closest('[data-nlv]'))) { ui.nl.view = g.getAttribute('data-nlv'); ui.sheet.el.querySelectorAll('[data-nlv]').forEach(function (x) { x.classList.toggle('on', x === g); }); return; }
    if (t.closest('[data-nlsave]')) { var i = ui.sheet.el.querySelector('[data-nlname]'); if (i) ui.nl.name = i.value; return saveNewList(); }
  }
  // keyboard: arrows move between places, Enter opens, Esc / Backspace / Alt+← back, H home, O outline, A add
  function onKey(e) {
    var tag = (e.target && e.target.tagName) || '', typing = /INPUT|TEXTAREA|SELECT/.test(tag);
    if (e.key === 'Escape') { if (ui.sheet) return closeSheet(); return back(); }
    if (typing || ui.sheet) return;
    if (e.key === 'Backspace' || (e.altKey && e.key === 'ArrowLeft')) { e.preventDefault(); return back(); }
    if (e.key === 'h' || e.key === 'H') return home();
    if (e.key === 'o' || e.key === 'O') { var m = ui.el.querySelector('[data-mode]'); if (m) m.click(); return; }
    if (e.key === 'a' || e.key === 'A') return addSheet();
    if (/^Arrow/.test(e.key)) {
      var els = Array.prototype.slice.call(ui.stage.querySelectorAll('.uv-isle,.uv-tile,.uv-it,.uv-gi')); if (!els.length) return;
      var i = els.indexOf(document.activeElement), d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { var cols = Math.max(1, Math.round(ui.stage.clientWidth / Math.max(1, (els[0].getBoundingClientRect().width + 10)))); d *= cols; }
      var nx = els[Math.max(0, Math.min(els.length - 1, i < 0 ? 0 : i + d))]; e.preventDefault(); nx.focus(); nx.scrollIntoView({ block: 'nearest' });
    }
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target && e.target.matches && e.target.matches('.uv [data-nlname]') && !e.isComposing) { e.preventDefault(); ui.nl.name = e.target.value; saveNewList(); } }, true);
  // the board changed (an add, a save elsewhere): draw the same place again
  window.addEventListener('minest:kedit', function () { if (ui.open && !ui.sheet) { var y = ui.body.scrollTop; render(); ui.body.scrollTop = y; } });

  function open(o) {
    o = o || {}; shell();
    var p = o.path || S.path;
    if (!Array.isArray(p) || !p.length || p[0].t !== 'home') p = [{ t: 'home' }];
    ui.path = p.filter(function (n) { return n.t === 'home' || boardById(n.bid); });
    render(); ui.body.scrollTop = lv().y || 0;
    assets().then(function () { if (ui.open) hydrate(); });
  }
  // the Dock's My World icon opens My World 3.0 (2.0 stays one tap away in ⋯)
  function takeDock() {
    var b = document.getElementById('mn-myworld-trigger'); if (!b || b.__uv) return; b.__uv = true;
    b.addEventListener('click', function (e) { e.stopImmediatePropagation(); e.preventDefault(); if (ui.open) close(); else open(); }, true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(takeDock, 400); }); else setTimeout(takeDock, 400);
  setTimeout(takeDock, 2500);
  window.MinestUniverse = { refresh: function () { if (!ui.open || ui.sheet) return; var y = ui.body.scrollTop; render(); ui.body.scrollTop = y; }, open: open, close: close, isOpen: function () { return ui.open; }, go: function (p) { if (!ui.open) open({ path: p }); else go(p, null, 'in'); }, path: function () { return ui.path; },
    skins: { world: worldSkin, cat: catSkin, list: listSkin, center: centerSkin }, assets: assets };
})();
