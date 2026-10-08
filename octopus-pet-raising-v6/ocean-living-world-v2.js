(function () {
  'use strict';

  var bootAttempts = 0;
  var debugMode = new URLSearchParams(window.location.search).get('debug') === '1' || localStorage.getItem('minest.oceanV2.debug') === '1';

  function boot() {
    var stage = document.querySelector('.avatar-stage');
    var ocean = document.querySelector('.ocean-backdrop');
    var controls = document.querySelector('.utility-toggle-bar');
    var canvas = document.querySelector('.avatar-canvas canvas');
    if (!stage || !ocean || !controls || !canvas) {
      if (bootAttempts++ < 60) window.setTimeout(boot, 100);
      return;
    }
    if (stage.dataset.oceanLivingWorldV2 === 'ready') return;
    stage.dataset.oceanLivingWorldV2 = 'ready';

    // Publish a stable shell immediately. The rest of the world state is
    // filled in below after the scene entities have been discovered.
    var worldApi = window.OceanWorldV2 = {
      version: '2.0',
      entities: [],
      perception: { visibleTargets: [], nearestFish: null, nearestInterestingObject: null, userAttention: 0, currentScene: 'ocean', availableSpace: null },
      behavior: { state: 'idle', lastEvent: null, queue: [] },
      emit: function () {},
      on: function () { return function () {}; },
      refresh: function () {},
      debug: debugMode
    };

    var style = document.createElement('style');
    style.dataset.oceanLivingWorldV2 = 'style';
    style.textContent = [
      '.ocean-v2-controls-hidden .utility-toggle-bar{opacity:0;transform:translateY(10px);pointer-events:none}',
      '.ocean-v2-controls-visible .utility-toggle-bar{opacity:1;transform:translateY(0);pointer-events:auto}',
      '.ocean-v2-controls-hidden .utility-toggle-bar,.ocean-v2-controls-visible .utility-toggle-bar{transition:opacity .28s ease,transform .28s ease}',
      '.ocean-v2-world-status{position:absolute;left:16px;bottom:calc(52px + env(safe-area-inset-bottom));top:auto;z-index:8;transform:translateY(8px);padding:7px 12px;border:1px solid rgba(191,239,247,.24);border-radius:999px;background:rgba(5,35,49,.54);backdrop-filter:blur(14px);color:rgba(232,252,255,.9);font:600 11px/1.1 -apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif;letter-spacing:.02em;opacity:0;pointer-events:none;transition:opacity .22s ease,transform .22s ease;white-space:nowrap}',
      '.ocean-v2-world-status.is-visible{opacity:1;transform:translateY(0)}',
      '.ocean-v2-world-status[data-kind="attention"]{border-color:rgba(255,224,155,.46);color:#fff4cf}',
      '.ocean-v2-world-status[data-kind="settle"]{border-color:rgba(159,231,213,.34)}',
      '.ocean-v2-caustics{position:absolute;inset:0;z-index:1;pointer-events:none;opacity:.12;background:repeating-linear-gradient(116deg,transparent 0 13%,rgba(179,244,255,.12) 15%,transparent 18% 31%);mix-blend-mode:screen;animation:ocean-v2-caustics 16s ease-in-out infinite alternate}',
      '@keyframes ocean-v2-caustics{from{transform:translate3d(-2%,0,0) scale(1.02)}to{transform:translate3d(3%,1%,0) scale(1.08)}}',
      '.ocean-v2-particles{position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden}',
      '.ocean-v2-particle{position:absolute;width:2px;height:2px;border-radius:50%;background:rgba(207,248,255,.42);box-shadow:0 0 7px rgba(165,237,255,.42);animation:ocean-v2-drift var(--drift,12s) linear infinite;opacity:var(--alpha,.35)}',
      '@keyframes ocean-v2-drift{0%{transform:translate3d(0,12px,0);opacity:0}14%{opacity:var(--alpha,.35)}86%{opacity:var(--alpha,.35)}100%{transform:translate3d(var(--dx,12px),-42px,0);opacity:0}}',
      '.ocean-v2-entity-interest{filter:drop-shadow(0 0 8px rgba(255,229,157,.78));}',
      '.ocean-v2-debug .ocean-v2-world-status{opacity:1;left:16px;top:auto;bottom:calc(52px + env(safe-area-inset-bottom));transform:none}',
      '.ocean-v2-avatar-motion{will-change:transform;transform-origin:50% 50%;transition:filter .35s ease;touch-action:none;border:0!important;outline:0!important;box-shadow:none!important;background:transparent!important;backface-visibility:hidden;-webkit-backface-visibility:hidden}',
      '.avatar-stage.has-controls .avatar-canvas{transform:none!important}',
      '.avatar-stage .avatar-canvas{transform:none!important;translate:none!important;scale:none!important;rotate:none!important;transform-origin:50% 50%!important}',
      '.ocean-v2-current{position:absolute;z-index:1;width:170px;height:42px;border-top:1px solid rgba(165,238,246,.2);border-radius:50%;opacity:.42;filter:blur(.2px);pointer-events:none;transform:rotate(-12deg);animation:ocean-v2-current-drift 8s ease-in-out infinite alternate}',
      '.ocean-v2-current:after{content:"";position:absolute;inset:8px 18px;border-top:1px solid rgba(165,238,246,.12);border-radius:50%}',
      '.ocean-v2-current-a{left:9%;top:39%}.ocean-v2-current-b{right:8%;top:53%;animation-delay:-2.5s;transform:rotate(14deg)scale(.72)}.ocean-v2-current-c{left:37%;top:23%;animation-delay:-5s;transform:rotate(5deg)scale(.55)}',
      '@keyframes ocean-v2-current-drift{from{translate:-16px 3px;opacity:.2}to{translate:22px -8px;opacity:.5}}',
      '.ocean-v2-plankton{position:absolute;z-index:1;width:74px;height:74px;border-radius:50%;background:radial-gradient(circle,rgba(184,245,221,.17),rgba(90,204,214,.05) 48%,transparent 72%);filter:blur(1px);pointer-events:none;animation:ocean-v2-plankton-pulse 7s ease-in-out infinite alternate}',
      '.ocean-v2-plankton-a{left:18%;top:26%}.ocean-v2-plankton-b{right:19%;top:31%;animation-delay:-3s;transform:scale(.7)}',
      '@keyframes ocean-v2-plankton-pulse{from{opacity:.24;transform:scale(.88)}to{opacity:.65;transform:scale(1.1)}}',
      '.ocean-v2-feeding-spot{position:absolute;z-index:1;width:22px;height:22px;border:1px solid rgba(255,224,155,.34);border-radius:50%;opacity:.5;pointer-events:none;animation:ocean-v2-feeding-pulse 3.5s ease-in-out infinite}',
      '.ocean-v2-feeding-spot-a{left:38%;top:47%}.ocean-v2-feeding-spot-b{right:29%;top:38%;animation-delay:-1.8s}',
      '@keyframes ocean-v2-feeding-pulse{0%,100%{box-shadow:0 0 0 rgba(255,224,155,0);transform:scale(.8)}50%{box-shadow:0 0 16px rgba(255,224,155,.28);transform:scale(1.1)}}',
      '.ocean-v2-bubble-layer{position:absolute;inset:0;z-index:4;pointer-events:none;overflow:hidden}',
      '.ocean-v2-reactive-bubble{position:absolute;width:var(--bubble-size,7px);height:var(--bubble-size,7px);border:1px solid rgba(219,253,255,.82);border-radius:50%;background:radial-gradient(circle at 34% 28%,rgba(255,255,255,.9),rgba(156,239,255,.2) 35%,rgba(92,189,224,.08) 70%);box-shadow:0 0 10px rgba(145,239,255,.5),inset 0 0 4px rgba(255,255,255,.56);animation:ocean-v2-reactive-rise var(--bubble-life,2.4s) ease-out forwards}',
      '@keyframes ocean-v2-reactive-rise{0%{opacity:0;transform:translate3d(0,8px,0)scale(.5)}14%{opacity:.82}70%{opacity:.58}100%{opacity:0;transform:translate3d(var(--bubble-drift,12px),var(--bubble-rise,-92px),0)scale(1.12)}}',
      '.puffer-fish{position:absolute;z-index:2;width:49px;height:41px;border-radius:48% 54% 50% 52%;background:radial-gradient(circle at 34% 30%,#fff7c8 0 3px,transparent 4px),radial-gradient(circle at 68% 34%,#18263a 0 3px,transparent 4px),repeating-linear-gradient(108deg,transparent 0 8px,rgba(255,211,104,.18) 9px 11px),radial-gradient(circle at 52% 62%,#f6a846 0 42%,#df633d 76%,#a83b54 100%);filter:drop-shadow(0 4px 5px rgba(0,20,38,.48));animation:ocean-puffer-drift 26s ease-in-out infinite alternate,ocean-puffer-inflate 10s ease-in-out infinite}',
      '.puffer-fish:before{content:"";position:absolute;inset:-7px -5px -6px -5px;border-radius:50%;background:repeating-conic-gradient(from 4deg,rgba(255,222,137,.82) 0 5deg,transparent 5deg 16deg);clip-path:polygon(0 50%,12% 38%,8% 21%,26% 28%,31% 8%,44% 23%,59% 5%,65% 25%,84% 17%,78% 37%,100% 50%,78% 63%,84% 83%,64% 74%,58% 95%,43% 77%,28% 92%,25% 73%,7% 80%,12% 61%);z-index:-1;animation:ocean-puffer-spines 10s ease-in-out infinite}',
      '.puffer-fish:after{content:"";position:absolute;right:-11px;top:14px;border-top:6px solid transparent;border-bottom:6px solid transparent;border-left:12px solid #d65e46;transform:rotate(7deg)}',
      '.puffer-fish-a{top:51%;left:-9%;transform:translateZ(-70px)scale(.82)}',
      '@keyframes ocean-puffer-drift{0%{translate:-2vw 5px;rotate:-4deg}45%{translate:34vw -18px;rotate:4deg}100%{translate:91vw 9px;rotate:-2deg}}',
      '@keyframes ocean-puffer-inflate{0%,100%{scale:1}50%{scale:1.34}}',
      '@keyframes ocean-puffer-spines{0%,100%{scale:.92;opacity:.72}50%{scale:1.14;opacity:1}}',
      '.sea-turtle{position:absolute;z-index:1;width:86px;height:48px;border-radius:52% 48% 50% 50%;background:radial-gradient(ellipse at 45% 45%,#a4c97b 0 18%,#4e806b 19% 42%,#285767 70%);filter:drop-shadow(0 5px 7px rgba(0,21,37,.52));animation:ocean-turtle-cruise 34s ease-in-out infinite alternate}',
      '.sea-turtle:before{content:"";position:absolute;left:-22px;top:16px;width:24px;height:19px;border-radius:55% 45% 48% 52%;background:#7daf78;box-shadow:80px 3px 0 -3px #78a873,-3px -18px 0 -5px #75a875,66px 30px 0 -4px #6da06f}',
      '.sea-turtle:after{content:"";position:absolute;right:-15px;top:17px;border-top:7px solid transparent;border-bottom:7px solid transparent;border-left:15px solid #70a16f;transform:rotate(-5deg)}',
      '.sea-turtle-a{right:-16%;bottom:31%;transform:translateZ(-110px)scale(.9)}',
      '@keyframes ocean-turtle-cruise{0%{translate:0 6px;rotate:-3deg}48%{translate:-39vw -12px;rotate:4deg}100%{translate:-84vw 5px;rotate:-2deg}}',
      '.crab{position:absolute;z-index:2;width:48px;height:25px;border-radius:52% 48% 45% 55%;background:radial-gradient(circle at 31% 34%,#ffd5a5 0 2px,transparent 3px),radial-gradient(circle at 68% 34%,#ffd5a5 0 2px,transparent 3px),linear-gradient(#e87967,#b84358);filter:drop-shadow(0 4px 4px rgba(0,20,35,.52));animation:ocean-crab-crawl 11s ease-in-out infinite alternate}',
      '.crab:before{content:"";position:absolute;left:-14px;top:-4px;width:17px;height:14px;border-radius:70% 30% 60% 40%;background:#d85a59;box-shadow:59px 1px 0 -1px #d85a59;transform:rotate(-18deg)}',
      '.crab:after{content:"";position:absolute;left:7px;right:7px;bottom:-8px;height:12px;border-top:2px solid #d85a59;border-bottom:2px solid #d85a59;border-radius:50%;box-shadow:0 4px 0 -1px #d85a59,25px 4px 0 -1px #d85a59}',
      '.crab-a{left:25%;bottom:13%;transform:translateZ(38px)scale(.82)}',
      '.crab-b{right:27%;bottom:18%;opacity:.72;animation-delay:-5s;transform:translateZ(-30px)scale(.64)}',
      '@keyframes ocean-crab-crawl{0%{translate:-9px 0;rotate:-3deg}50%{translate:18px -3px;rotate:3deg}100%{translate:42px 0;rotate:-2deg}}',
      /* Detailed silhouette overrides keep the small CSS actors readable at
         aquarium scale while preserving their existing motion paths. */
      '.sea-turtle{background:radial-gradient(ellipse at 48% 43%,#c5d993 0 10%,transparent 11%),repeating-conic-gradient(from 8deg at 48% 44%,#6c9a69 0 13deg,#315e60 13deg 28deg);border:2px solid rgba(180,220,143,.48);box-shadow:inset 0 5px 9px rgba(224,245,177,.28),inset 0 -8px 12px rgba(9,43,55,.52),0 5px 7px rgba(0,21,37,.52)}',
      '.sea-turtle:before{left:-24px;top:13px;width:27px;height:22px;background:radial-gradient(circle at 65% 35%,#183942 0 2px,transparent 3px),linear-gradient(145deg,#9bc67d,#4e806b);box-shadow:82px 6px 0 -3px #79a970,-5px -18px 0 -4px #76a877,66px 31px 0 -4px #6b9d70}',
      '.sea-turtle:after{right:-19px;top:16px;border-left-width:18px;border-top-width:8px;border-bottom-width:8px;background:#72a46e;filter:drop-shadow(-74px 25px 0 #72a46e)}',
      '.crab{background:radial-gradient(circle at 28% 27%,#ffd8ad 0 2px,transparent 3px),radial-gradient(circle at 72% 27%,#ffd8ad 0 2px,transparent 3px),radial-gradient(ellipse at 50% 18%,#ffad81 0 8%,transparent 9%),linear-gradient(165deg,#f08a70 0%,#cf4e5e 58%,#8d3555 100%);border:1px solid rgba(255,188,147,.48);box-shadow:inset 0 4px 7px rgba(255,227,188,.24),inset 0 -5px 8px rgba(79,21,45,.38),0 4px 5px rgba(0,20,35,.52)}',
      '.crab:before{left:-16px;top:-8px;width:19px;height:16px;background:linear-gradient(145deg,#ff9b7a,#c9475b);box-shadow:64px 3px 0 -1px #cb4b5b;transform:rotate(-25deg);clip-path:polygon(0 45%,62% 0,100% 22%,72% 48%,100% 70%,54% 100%,26% 72%)}',
      '.crab:after{left:4px;right:4px;bottom:-10px;height:13px;border-top:2px solid #e56863;border-bottom:2px solid #c44b5d;border-radius:50%;box-shadow:0 4px 0 -1px #d45a5d,24px 4px 0 -1px #d45a5d,10px 7px 0 -1px #ad3f57,34px 7px 0 -1px #ad3f57}',
      '.eagle-fish{width:122px;height:60px;filter:drop-shadow(0 5px 6px rgba(0,21,38,.46));opacity:.86}',
      '.eagle-fish:before{background:linear-gradient(160deg,#d3e4dc 0%,#7699a0 34%,#365f75 72%,#1d4059 100%);clip-path:polygon(0 52%,18% 42%,36% 12%,46% 36%,50% 0,57% 35%,76% 12%,84% 42%,100% 52%,80% 63%,65% 85%,54% 65%,47% 100%,39% 65%,20% 86%);inset:2px 0 6px;border-radius:42% 58% 46% 54%}',
      '.eagle-fish:after{background:radial-gradient(circle at 72% 32%,#142d3f 0 2px,transparent 3px),linear-gradient(160deg,#d4e5df,#5c8792 58%,#2b5269);border-radius:65% 45% 60% 55%;width:32%;height:43%;top:23%;left:36%;box-shadow:inset 4px 2px 6px rgba(245,255,249,.25)}',
      '.lionfish{background:repeating-linear-gradient(90deg,#ffb08b 0 5px,#a64c69 6px 11px,#6b3c61 12px 15px);border:1px solid rgba(255,190,153,.38);box-shadow:inset 0 4px 6px rgba(255,237,198,.18),0 4px 5px rgba(0,20,35,.45);filter:drop-shadow(0 4px 5px rgba(0,21,38,.5))}',
      '.lionfish:before{background:repeating-conic-gradient(from 8deg,#ffcf9d 0 4deg,transparent 4deg 12deg);opacity:.9;filter:drop-shadow(0 2px 3px rgba(255,172,132,.32));clip-path:polygon(50% 0,58% 35%,100% 9%,68% 50%,100% 91%,58% 65%,50% 100%,42% 65%,0 91%,32% 50%,0 9%,42% 35%);width:102px;height:68px;top:-22px;left:-24px}',
      '.lionfish:after{background:radial-gradient(circle at 68% 32%,#172a3d 0 2px,transparent 3px),#5d355c;border-radius:65% 45% 58% 56%;box-shadow:inset 4px 3px 5px rgba(255,231,196,.18)}',
      '[data-depth-layer="far"]{filter:saturate(.78) brightness(.86);opacity:.78;translate:0 0 var(--ocean-depth-z);scale:var(--ocean-depth-scale);z-index:1}',
      '[data-depth-layer="mid"]{filter:saturate(.98) brightness(.98);translate:0 0 var(--ocean-depth-z);scale:var(--ocean-depth-scale);z-index:2}',
      '[data-depth-layer="foreground"]{filter:saturate(1.12) brightness(1.04);translate:0 0 var(--ocean-depth-z);scale:var(--ocean-depth-scale);z-index:3}',
      '.ocean-backdrop [data-depth-layer]{transform-style:preserve-3d;will-change:transform,translate,scale;}'
    ].join('');
    document.head.appendChild(style);
    // The V3 AvatarView already owns the WebGL canvas and has its own
    // orbit/pinch controller. Never CSS-transform the full canvas: its
    // rectangular render target would clip the model and create a hard line.

    stage.classList.add(debugMode ? 'ocean-v2-debug' : 'ocean-v2-controls-hidden');
    var status = document.createElement('div');
    status.className = 'ocean-v2-world-status';
    status.setAttribute('aria-live', 'polite');
    status.textContent = 'Ocean world ready';
    stage.appendChild(status);
    var caustics = document.createElement('div');
    caustics.className = 'ocean-v2-caustics';
    ocean.appendChild(caustics);
    var particles = document.createElement('div');
    particles.className = 'ocean-v2-particles';
    for (var particleIndex = 0; particleIndex < 22; particleIndex++) {
      var particle = document.createElement('i');
      particle.className = 'ocean-v2-particle';
      particle.style.left = (4 + Math.random() * 92).toFixed(2) + '%';
      particle.style.top = (8 + Math.random() * 88).toFixed(2) + '%';
      particle.style.setProperty('--dx', ((Math.random() - .5) * 28).toFixed(1) + 'px');
      particle.style.setProperty('--drift', (10 + Math.random() * 12).toFixed(1) + 's');
      particle.style.setProperty('--alpha', (.16 + Math.random() * .28).toFixed(2));
      particle.style.animationDelay = (-Math.random() * 12).toFixed(1) + 's';
      particles.appendChild(particle);
    }
    ocean.appendChild(particles);
    var bubbleLayer = document.createElement('div');
    bubbleLayer.className = 'ocean-v2-bubble-layer';
    stage.appendChild(bubbleLayer);

    // Lightweight world affordances: they give the behavior system stable
    // targets without adding another heavy renderer or asset dependency.
    ['a', 'b', 'c'].forEach(function (suffix) {
      var current = document.createElement('span'); current.className = 'ocean-v2-current ocean-v2-current-' + suffix; ocean.appendChild(current);
    });
    ['a', 'b'].forEach(function (suffix) {
      var plankton = document.createElement('span'); plankton.className = 'ocean-v2-plankton ocean-v2-plankton-' + suffix; ocean.appendChild(plankton);
      var feedingSpot = document.createElement('span'); feedingSpot.className = 'ocean-v2-feeding-spot ocean-v2-feeding-spot-' + suffix; ocean.appendChild(feedingSpot);
    });
    // Additional living-world actors are DOM entities so they remain light,
    // independently animated, and available to the perception system.
    [
      ['puffer-fish puffer-fish-a', 'Puffer fish'],
      ['sea-turtle sea-turtle-a', 'Sea turtle'],
      ['crab crab-a', 'Crab'],
      ['crab crab-b', 'Crab']
    ].forEach(function (spec) {
      var actor = document.createElement('span');
      actor.className = spec[0];
      actor.setAttribute('role', 'img');
      actor.setAttribute('aria-label', spec[1]);
      ocean.appendChild(actor);
    });

    var entitySelectors = [
      ['fish', '.fish, .clownfish, .eagle-fish, .lionfish, .puffer-fish', .65, .12, 'mid'],
      ['jellyfish', '.jellyfish', .9, .16, 'mid'],
      ['rock', '.rock', .25, .18, 'far'],
      ['plant', '.seaweed, .coral, .coral-garden, .branch-coral', .35, .14, 'foreground'],
      ['rest_spot', '.rock-center, .rock-left, .rock-right', .45, .22, 'far'],
      ['curiosity_target', '.jellyfish, .clownfish, .eagle-fish, .lionfish, .puffer-fish, .sea-turtle, .crab, .sea-star', .8, .14, 'mid'],
      ['water_current', '.ocean-v2-current', .55, .08, 'mid'],
      ['light_field', '.light-ray', .3, .04, 'far'],
      ['bubble_field', '.bubble, .ocean-v2-plankton', .42, .05, 'foreground'],
      ['shelter', '.reef', .5, .24, 'far'],
      ['feeding_spot', '.ocean-v2-feeding-spot, .sea-star', .72, .1, 'mid']
    ];
    var entities = [];
    var depthProfile = { far: { z: '-120px', scale: '.84' }, mid: { z: '0px', scale: '1' }, foreground: { z: '76px', scale: '1.08' } };
    entitySelectors.forEach(function (entry) {
      var type = entry[0], selector = entry[1], interest = entry[2], avoidance = entry[3], depthLayer = entry[4];
      ocean.querySelectorAll(selector).forEach(function (node, index) {
        var entity = { id: 'ocean-' + type + '-' + index, node: node, semanticType: type, depthLayer: depthLayer, position: { x: 0, y: 0, z: 0 }, velocity: { x: 0, y: 0, z: 0 }, interestLevel: interest, interactionRadius: type === 'fish' ? .22 : .18, avoidanceRadius: avoidance };
        node.dataset.semanticType = type;
        node.dataset.depthLayer = depthLayer;
        node.style.setProperty('--ocean-depth-z', (depthProfile[depthLayer] || depthProfile.mid).z);
        node.style.setProperty('--ocean-depth-scale', (depthProfile[depthLayer] || depthProfile.mid).scale);
        node.dataset.interestLevel = String(interest);
        node.dataset.interactionRadius = String(entity.interactionRadius);
        node.dataset.avoidanceRadius = String(avoidance);
        entities.push(entity);
      });
    });

    var listeners = {};
    var cooldowns = {};
    var perception = { visibleTargets: [], nearestFish: null, nearestInterestingObject: null, userAttention: 0, currentScene: 'ocean', availableSpace: null };
    var behavior = { state: 'idle', lastEvent: null, queue: [] };
    var avatarMotion = { x: 0, y: 0, scale: .52, rotation: 0 };
    window.__oceanAvatarMotion = avatarMotion;
    var motionTarget = { x: 0, y: 0, scale: .52, rotation: 0 };
    var userScale = .52;
    var userRotation = 0;
    var userPitch = 0;
    var lastBubbleAt = 0;
    var lastAvatarPosition = { x: 0, y: 0 };
    var activePointers = new Map();
    var gesture = { mode: null, moved: false, targetAvatar: false, startX: 0, startY: 0, startRotation: 0, startPitch: 0, startScale: .52, startDistance: 1 };
    var gazeTarget = { x: 0, y: 0 };
    var gazeCurrent = { x: 0, y: 0 };
    var pointerGaze = { x: 0, y: 0 };
    var lastPointerGazeAt = 0;
    var lifeMotion = { head: null, body: null, headBaseScale: null, bodyBaseScale: null, lastHeadYaw: 0, lastHeadPitch: 0, lastBreath: 0 };
    var motionFrame = 0;
    function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
    function pointNearOcto(clientX, clientY, padding) {
      var avatar = window.__octopusAvatar;
      var rect = canvas.getBoundingClientRect();
      if (!avatar || !avatar.importedModel || !avatar.camera || rect.width < 1 || rect.height < 1) {
        return Math.hypot(clientX - (rect.left + rect.width * .5), clientY - (rect.top + rect.height * .5)) < Math.min(rect.width, rect.height) * (.18 + (padding || 0));
      }
      try {
        var Vector3 = avatar.camera.position.constructor;
        var projected = avatar.importedModel.getWorldPosition(new Vector3()).project(avatar.camera);
        var centerX = rect.left + (projected.x * .5 + .5) * rect.width;
        var centerY = rect.top + (-projected.y * .5 + .5) * rect.height;
        // Forgiving enough for tentacle edges, while keeping nearby ocean
        // clicks independent from the avatar surface.
        var radius = Math.min(rect.width, rect.height) * (.26 + (padding || 0));
        radius = clamp(radius * (Number(avatar.avatarGestureScale) || 1), 88, 260);
        return Math.hypot(clientX - centerX, clientY - centerY) <= radius;
      } catch (error) {
        return Math.hypot(clientX - (rect.left + rect.width * .5), clientY - (rect.top + rect.height * .5)) < Math.min(rect.width, rect.height) * (.18 + (padding || 0));
      }
    }
    function applyAvatarGestureScale() {
      var avatar = window.__octopusAvatar;
      if (!avatar || !avatar.avatarGestureGroup) return false;
      // Keep all gesture state on the Three.js avatar group. Scaling the canvas
      // or its wrapper changes the render target and creates a hard clipping line.
      avatar.avatarGestureScale = clamp(userScale, .22, 1.7);
      avatar.avatarGestureYaw = clamp(userRotation * Math.PI / 180, -Math.PI, Math.PI);
      avatar.avatarGesturePitch = clamp(userPitch, -.72, .72);
      if (typeof avatar.applyAvatarGesture === 'function') avatar.applyAvatarGesture();
      return true;
    }
    function renderAvatarMotion() {
      canvas.style.transform = 'none';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.left = '0';
      canvas.style.top = '0';
      applyAvatarGestureScale();
    }
    function applyAvatarLifeMotion() {
      var avatar = window.__octopusAvatar;
      var model = avatar && avatar.importedModel;
      if (!model) return;
      if (!lifeMotion.head || !lifeMotion.body) {
        model.traverse(function (node) {
          if (!lifeMotion.head && node.name === 'head') lifeMotion.head = node;
          if (!lifeMotion.body && node.name === 'body') lifeMotion.body = node;
        });
        if (lifeMotion.head && !lifeMotion.headBaseScale) lifeMotion.headBaseScale = lifeMotion.head.scale.clone();
        if (lifeMotion.body && !lifeMotion.bodyBaseScale) lifeMotion.bodyBaseScale = lifeMotion.body.scale.clone();
      }
      var now = performance.now();
      var swimPhase = Number(avatar.freeSwimPhase) || 0;
      var autoGazeX = avatar.freeSwimActive ? clamp(Math.sin(swimPhase + .55) * .34 + Math.sin(swimPhase * 1.7) * .1, -.48, .48) : Math.sin(now * .00042) * .16;
      var autoGazeY = avatar.freeSwimActive ? clamp(Math.cos(swimPhase * .82 + .4) * .13, -.24, .24) : Math.sin(now * .00031 + 1.4) * .1;
      var pointerFresh = now - lastPointerGazeAt < 2600;
      gazeTarget.x = pointerFresh ? pointerGaze.x : autoGazeX;
      gazeTarget.y = pointerFresh ? pointerGaze.y : autoGazeY;
      gazeCurrent.x += (gazeTarget.x - gazeCurrent.x) * .075;
      gazeCurrent.y += (gazeTarget.y - gazeCurrent.y) * .075;
      if (lifeMotion.head) {
        // Add the look offset on top of the active clip, then remove only our
        // previous offset so animation-authored head motion remains intact.
        lifeMotion.head.rotation.y -= lifeMotion.lastHeadYaw;
        lifeMotion.head.rotation.x -= lifeMotion.lastHeadPitch;
        lifeMotion.lastHeadYaw = clamp(gazeCurrent.x * .16, -.16, .16);
        lifeMotion.lastHeadPitch = clamp(-gazeCurrent.y * .1, -.1, .1);
        lifeMotion.head.rotation.y += lifeMotion.lastHeadYaw;
        lifeMotion.head.rotation.x += lifeMotion.lastHeadPitch;
      }
      var time = performance.now() * .001;
      var breath = Math.sin(time * 1.35) * .65 + Math.sin(time * .57 + 1.1) * .35;
      var breathScale = 1 + breath * .014;
      if (lifeMotion.body && lifeMotion.bodyBaseScale) {
        lifeMotion.body.scale.x = lifeMotion.bodyBaseScale.x * breathScale;
        lifeMotion.body.scale.z = lifeMotion.bodyBaseScale.z * breathScale;
      }
      if (lifeMotion.head && lifeMotion.headBaseScale) {
        lifeMotion.head.scale.x = lifeMotion.headBaseScale.x * (1 + breath * .009);
        lifeMotion.head.scale.z = lifeMotion.headBaseScale.z * (1 + breath * .009);
      }
    }
    function spawnBubbleBurst(count, intensity) {
      var now = performance.now();
      if (now - lastBubbleAt < 90) return;
      lastBubbleAt = now;
      var width = Math.max(stage.clientWidth, 1), height = Math.max(stage.clientHeight, 1);
      for (var i = 0; i < count; i++) {
        var bubble = document.createElement('i');
        bubble.className = 'ocean-v2-reactive-bubble';
        bubble.style.left = (width * .5 + avatarMotion.x + (Math.random() - .5) * 110 * intensity).toFixed(1) + 'px';
        bubble.style.top = (height * .54 + avatarMotion.y + (Math.random() - .5) * 65 * intensity).toFixed(1) + 'px';
        bubble.style.setProperty('--bubble-size', (4 + Math.random() * 8 * intensity).toFixed(1) + 'px');
        bubble.style.setProperty('--bubble-life', (1.8 + Math.random() * 1.8).toFixed(2) + 's');
        bubble.style.setProperty('--bubble-rise', (-58 - Math.random() * 85 * intensity).toFixed(1) + 'px');
        bubble.style.setProperty('--bubble-drift', ((Math.random() - .5) * 42 * intensity).toFixed(1) + 'px');
        bubble.addEventListener('animationend', function () { this.remove(); }, { once: true });
        bubbleLayer.appendChild(bubble);
      }
    }
    function tickAvatarMotion() {
      avatarMotion.x += (motionTarget.x - avatarMotion.x) * .055;
      avatarMotion.y += (motionTarget.y - avatarMotion.y) * .055;
      avatarMotion.scale += (motionTarget.scale - avatarMotion.scale) * .045;
      avatarMotion.rotation += (motionTarget.rotation - avatarMotion.rotation) * .06;
      var displacement = Math.hypot(avatarMotion.x - lastAvatarPosition.x, avatarMotion.y - lastAvatarPosition.y);
      if (displacement > 1.1 && performance.now() - lastBubbleAt > 260) spawnBubbleBurst(2, 0.55);
      lastAvatarPosition.x = avatarMotion.x; lastAvatarPosition.y = avatarMotion.y;
      renderAvatarMotion();
      applyAvatarLifeMotion();
      motionFrame = window.requestAnimationFrame(tickAvatarMotion);
    }
    function movePetTo(point, mode) {
      var width = Math.max(perception.availableSpace && perception.availableSpace.width || stage.clientWidth, 1);
      var height = Math.max(perception.availableSpace && perception.availableSpace.height || stage.clientHeight, 1);
      var x = clamp(point.x * width * .1, -width * .08, width * .08);
      var y = clamp(-point.y * height * .08, -height * .075, height * .075);
      var depth = mode === 'approach' ? .56 : mode === 'settle' ? .52 : clamp(.52 + point.y * .03, .49, .56);
      motionTarget.x = x; motionTarget.y = y; motionTarget.scale = depth;
      motionTarget.rotation = clamp((x - avatarMotion.x) / Math.max(width, 1) * 8, -7, 7);
    }
    function returnPetHome() { motionTarget = { x: 0, y: 0, scale: .52, rotation: 0 }; }
    function resetUserPose() {
      // AvatarView owns the actual orbit group. Reloading the local preview
      // is the only stable reset path without reaching into its private ref.
      window.location.reload();
    }
    function applyDefaultAvatarScale() {
      // Set the initial size directly on the avatar group. Synthetic pinch
      // events can leave browser pointer capture active on mobile Safari.
      renderAvatarMotion();
    }
    var freeSwimReturnTimer = 0;
    function cancelFreeSwimReturn() {
      if (freeSwimReturnTimer) {
        window.clearTimeout(freeSwimReturnTimer);
        freeSwimReturnTimer = 0;
      }
    }
    function returnToFreeSwim() {
      freeSwimReturnTimer = 0;
      var params = new URLSearchParams(window.location.search);
      if (params.get('motion') === 'static') return;
      var avatar = window.__octopusAvatar;
      if (!avatar || typeof avatar.playAnimation !== 'function') return;
      perception.userAttention = 0;
      behavior.state = 'idle';
      returnPetHome();
      if (!avatar.freeSwimActive) avatar.playAnimation('free_swim_aquarium');
    }
    function scheduleFreeSwimReturn(delay) {
      cancelFreeSwimReturn();
      freeSwimReturnTimer = window.setTimeout(returnToFreeSwim, delay || 2800);
    }
    function requestAction(name) {
      cancelFreeSwimReturn();
      window.dispatchEvent(new CustomEvent('ocean-action-request', { detail: { action: name, source: 'OceanWorldV2' } }));
      if (window.__octopusAvatar && typeof window.__octopusAvatar.playAnimation === 'function') window.__octopusAvatar.playAnimation(name);
      if (name !== 'free_swim_aquarium' && name !== 'free_swim') scheduleFreeSwimReturn(3000);
    }
    function ensureDefaultFreeSwim() {
      var params = new URLSearchParams(window.location.search);
      if (params.get('motion') === 'static') return;
      var avatar = window.__octopusAvatar;
      if (!avatar || typeof avatar.playAnimation !== 'function') {
        window.setTimeout(ensureDefaultFreeSwim, 250);
        return;
      }
      // Keep the existing V3 aquarium motion as the default. This is a
      // one-time boot handoff; user-selected actions remain in control after it.
      if (!avatar.freeSwimActive) avatar.playAnimation('free_swim_aquarium');
    }
    motionFrame = window.requestAnimationFrame(tickAvatarMotion);
    function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
    function scenePoint(node, rect) {
      var bounds = node.getBoundingClientRect();
      return { x: ((bounds.left + bounds.width / 2) - (rect.left + rect.width / 2)) / Math.max(rect.width, 1) * 2, y: ((bounds.top + bounds.height / 2) - (rect.top + rect.height / 2)) / Math.max(rect.height, 1) * -2, z: 0 };
    }
    function emit(type, detail) {
      var now = performance.now();
      if (cooldowns[type] && now - cooldowns[type] < (type === 'FISH_ENTERED_NEARBY' ? 6500 : 550)) return;
      cooldowns[type] = now;
      var event = { type: type, timestamp: Date.now(), detail: detail || {}, perception: perception };
      behavior.lastEvent = event; behavior.queue.push(event); behavior.queue = behavior.queue.slice(-8);
      window.dispatchEvent(new CustomEvent('ocean-world-event', { detail: event }));
      (listeners[type] || []).slice().forEach(function (listener) { listener(event); });
      return event;
    }
    function on(type, listener) { (listeners[type] || (listeners[type] = [])).push(listener); return function () { listeners[type] = (listeners[type] || []).filter(function (item) { return item !== listener; }); }; }
    function refreshPerception() {
      var rect = ocean.getBoundingClientRect();
      perception.availableSpace = { width: rect.width, height: rect.height };
      entities.forEach(function (entity) {
        var nextPosition = scenePoint(entity.node, rect);
        if (entity._previousPosition) {
          entity.velocity = { x: nextPosition.x - entity._previousPosition.x, y: nextPosition.y - entity._previousPosition.y, z: nextPosition.z - entity._previousPosition.z };
          if (entity.semanticType === 'fish' && entity._previousPosition.x * nextPosition.x < 0 && Math.abs(nextPosition.y) < .5) emit('FISH_PASSED_FRONT', { entity: entity });
        }
        entity._previousPosition = nextPosition;
        entity.position = nextPosition;
      });
      perception.visibleTargets = entities.filter(function (entity) { return entity.node.offsetParent !== null; });
      var petPoint = { x: 0, y: .12 };
      var fish = perception.visibleTargets.filter(function (entity) { return entity.semanticType === 'fish'; }).sort(function (a, b) { return distance(a.position, petPoint) - distance(b.position, petPoint); });
      var interesting = perception.visibleTargets.filter(function (entity) { return entity.semanticType === 'curiosity_target'; }).sort(function (a, b) { return distance(a.position, petPoint) - distance(b.position, petPoint); });
      perception.nearestFish = fish[0] || null;
      perception.nearestInterestingObject = interesting[0] || null;
      if (perception.nearestFish && distance(perception.nearestFish.position, petPoint) < perception.nearestFish.interactionRadius) emit('FISH_ENTERED_NEARBY', { entity: perception.nearestFish });
      var jellyfish = perception.visibleTargets.filter(function (entity) { return entity.semanticType === 'jellyfish'; }).sort(function (a, b) { return distance(a.position, petPoint) - distance(b.position, petPoint); })[0];
      if (jellyfish && distance(jellyfish.position, petPoint) < jellyfish.interactionRadius) emit('JELLYFISH_NEARBY', { entity: jellyfish });
      if (perception.nearestInterestingObject && distance(perception.nearestInterestingObject.position, petPoint) < perception.nearestInterestingObject.interactionRadius) emit('INTERESTING_OBJECT_NEARBY', { entity: perception.nearestInterestingObject });
    }
    function showStatus(text, kind, duration) {
      status.textContent = text; status.dataset.kind = kind || 'attention'; status.classList.add('is-visible');
      window.clearTimeout(showStatus.timer); showStatus.timer = window.setTimeout(function () { status.classList.remove('is-visible'); }, duration || 1800);
    }
    on('FISH_ENTERED_NEARBY', function (event) {
      if (event.detail.entity && event.detail.entity.node) event.detail.entity.node.classList.add('ocean-v2-entity-interest');
      spawnBubbleBurst(7, 1.15);
      // A passing fish should enrich the default aquarium swim, not replace
      // it with a short look/settle sequence. Explicit user interactions can
      // still interrupt the swim through their own handlers.
      if (window.__octopusAvatar && window.__octopusAvatar.freeSwimActive) {
        showStatus('Fish nearby · free swim', 'attention', 1100);
        return;
      }
      behavior.state = 'attentive'; requestAction('look'); showStatus('Fish nearby · attentive', 'attention', 1500);
      var target = event.detail.targetPosition || (event.detail.entity && event.detail.entity.position);
      window.setTimeout(function () { behavior.state = 'approach'; requestAction('free_swim_aquarium'); if (target) movePetTo(target, 'approach'); showStatus('Exploring nearby water', 'attention', 1600); }, 1200);
      window.setTimeout(function () { behavior.state = 'settle'; requestAction('settle'); if (target) movePetTo(target, 'settle'); showStatus('Settling', 'settle', 1200); }, 4100);
      window.setTimeout(function () { behavior.state = 'idle'; returnPetHome(); if (event.detail.entity && event.detail.entity.node) event.detail.entity.node.classList.remove('ocean-v2-entity-interest'); scheduleFreeSwimReturn(1200); }, 5600);
    });
    on('INTERESTING_OBJECT_NEARBY', function (event) { showStatus('Something interesting', 'attention', 1200); if (event.detail.entity && event.detail.entity.node) event.detail.entity.node.classList.add('ocean-v2-entity-interest'); });
    on('JELLYFISH_NEARBY', function (event) { showStatus('Jellyfish drifting nearby', 'attention', 1200); if (event.detail.entity && event.detail.entity.node) event.detail.entity.node.classList.add('ocean-v2-entity-interest'); });
    on('FISH_PASSED_FRONT', function () { showStatus('A fish passed close by', 'attention', 900); });
    on('USER_TAPPED_WORLD', function (event) {
      perception.userAttention = 1; behavior.state = 'attentive'; requestAction('look'); spawnBubbleBurst(5, .9);
      showStatus('Ocean noticed you', 'attention', 1200);
      if (event.detail && event.detail.normalizedPoint) movePetTo({ x: event.detail.normalizedPoint.x, y: -event.detail.normalizedPoint.y }, 'approach');
      window.setTimeout(function () { behavior.state = 'settle'; requestAction('settle'); showStatus('Settling', 'settle', 900); }, 2200);
      window.setTimeout(function () { perception.userAttention = 0; behavior.state = 'idle'; returnPetHome(); scheduleFreeSwimReturn(1200); }, 3600);
    });
    on('USER_TAPPED_PET', function () { perception.userAttention = 1; behavior.state = 'attentive'; requestAction('p0:petted'); spawnBubbleBurst(8, 1.2); showStatus('Pet attention', 'attention', 1200); window.setTimeout(function () { perception.userAttention = 0; behavior.state = 'idle'; scheduleFreeSwimReturn(5200); }, 1800); });
    on('REWARD_EVENT_RECEIVED', function (event) { behavior.state = 'attentive'; requestAction('p0:happy'); showStatus('A little celebration', 'settle', 1400); window.setTimeout(function () { behavior.state = 'idle'; scheduleFreeSwimReturn(900); }, 1800); });
    window.addEventListener('reward-event-received', function (event) { emit('REWARD_EVENT_RECEIVED', event.detail || {}); });

    var hideTimer = 0;
    function showControls() {
      if (debugMode) return;
      stage.classList.remove('ocean-v2-controls-hidden'); stage.classList.add('ocean-v2-controls-visible');
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(function () { if (!controls.querySelector('[aria-expanded="true"]')) { stage.classList.remove('ocean-v2-controls-visible'); stage.classList.add('ocean-v2-controls-hidden'); } }, 3500);
    }
    var pointerStart = null;
    var lastTapAt = 0;
    function pointerDistance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
    stage.addEventListener('pointerdown', function (event) {
      showControls();
      if (event.target.closest && event.target.closest('.utility-toggle-bar')) return;
      var avatarSurface = event.target.closest && event.target.closest('.avatar-canvas');
      if (!avatarSurface) return;
      // AvatarView also listens on .avatar-canvas. Capture the event here so
      // its camera/legacy pointer state cannot compete with the model gesture.
      event.stopPropagation();
      event.preventDefault();
      try { stage.setPointerCapture(event.pointerId); } catch (error) {}
      pointerStart = { x: event.clientX, y: event.clientY, target: event.target, time: performance.now() };
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (activePointers.size === 1) {
        gesture.targetAvatar = pointNearOcto(event.clientX, event.clientY, .06);
        gesture.mode = gesture.targetAvatar ? 'rotate' : 'world';
        gesture.moved = false;
        gesture.startX = event.clientX;
        gesture.startY = event.clientY;
        gesture.startRotation = userRotation;
        gesture.startPitch = userPitch;
      } else if (activePointers.size === 2) {
        var points = Array.from(activePointers.values());
        // Promote a pinch only when a contact lands on Octo's projected bounds.
        gesture.targetAvatar = gesture.targetAvatar || points.some(function (point) { return pointNearOcto(point.x, point.y, .06); });
        if (gesture.targetAvatar) {
          gesture.mode = 'pinch';
          gesture.moved = true;
          gesture.startScale = userScale;
          gesture.startDistance = Math.max(pointerDistance(points[0], points[1]), 1);
        }
      }
    }, { passive: false, capture: true });
    stage.addEventListener('pointermove', function (event) {
      var stageRect = stage.getBoundingClientRect();
      pointerGaze.x = clamp((event.clientX - stageRect.left) / Math.max(stageRect.width, 1) * 2 - 1, -1, 1);
      pointerGaze.y = clamp(-((event.clientY - stageRect.top) / Math.max(stageRect.height, 1) * 2 - 1), -1, 1);
      lastPointerGazeAt = performance.now();
      if (!activePointers.has(event.pointerId)) { applyAvatarLifeMotion(); return; }
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (activePointers.size >= 2 && gesture.targetAvatar) {
        var points = Array.from(activePointers.values());
        var distanceNow = pointerDistance(points[0], points[1]);
        userScale = clamp(gesture.startScale * (distanceNow / gesture.startDistance), .22, 1.7);
        gesture.moved = true;
      } else if (gesture.mode === 'rotate' && gesture.targetAvatar) {
        var deltaX = event.clientX - gesture.startX;
        var deltaY = event.clientY - gesture.startY;
        if (Math.hypot(deltaX, deltaY) > 6) gesture.moved = true;
        userRotation = clamp(gesture.startRotation + deltaX * .45, -180, 180);
        userPitch = clamp(gesture.startPitch + deltaY * .006, -.72, .72);
      } else if (gesture.mode === 'world' && Math.hypot(event.clientX - (pointerStart && pointerStart.x || event.clientX), event.clientY - (pointerStart && pointerStart.y || event.clientY)) > 6) {
        gesture.moved = true;
      }
      event.stopPropagation();
      event.preventDefault();
      renderAvatarMotion();
    }, { passive: false, capture: true });
    stage.addEventListener('pointerup', function (event) {
      if (event.target.closest && event.target.closest('.avatar-canvas')) event.stopPropagation();
      activePointers.delete(event.pointerId);
      try { stage.releasePointerCapture(event.pointerId); } catch (error) {}
      if (activePointers.size > 0) return;
      if (!pointerStart) { gesture.mode = null; gesture.targetAvatar = false; return; }
      var start = pointerStart; pointerStart = null;
      var moved = gesture.moved || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10;
      gesture.mode = null;
      gesture.targetAvatar = false;
      if (moved) { gesture.moved = false; return; }
      var tapNow = performance.now();
      if (tapNow - lastTapAt < 360) {
        lastTapAt = 0;
        resetUserPose();
        return;
      }
      lastTapAt = tapNow;
      window.setTimeout(function () { if (performance.now() - lastTapAt > 340) lastTapAt = 0; }, 380);
      var rect = stage.getBoundingClientRect();
      var point = { x: (event.clientX - rect.left) / Math.max(rect.width, 1) * 2 - 1, y: (event.clientY - rect.top) / Math.max(rect.height, 1) * 2 - 1 };
      emit(pointNearOcto(event.clientX, event.clientY, .03) ? 'USER_TAPPED_PET' : 'USER_TAPPED_WORLD', { normalizedPoint: point });
      gesture.moved = false;
    }, { passive: false, capture: true });
    stage.addEventListener('dblclick', function (event) {
      if (event.target.closest && event.target.closest('.utility-toggle-bar')) return;
      event.preventDefault();
      event.stopPropagation();
      resetUserPose();
    }, { passive: false, capture: true });
    stage.addEventListener('pointercancel', function (event) {
      if (event.target.closest && event.target.closest('.avatar-canvas')) event.stopPropagation();
      activePointers.delete(event.pointerId);
      try { stage.releasePointerCapture(event.pointerId); } catch (error) {}
      if (activePointers.size === 0) { pointerStart = null; gesture.mode = null; gesture.targetAvatar = false; gesture.moved = false; }
    }, { passive: false, capture: true });
    stage.addEventListener('wheel', function (event) {
      if (event.target.closest && event.target.closest('.utility-toggle-bar')) return;
      if (!(event.target.closest && event.target.closest('.avatar-canvas'))) return;
      if (!pointNearOcto(event.clientX, event.clientY, .03)) return;
      event.preventDefault();
      event.stopPropagation();
      userScale = clamp(userScale * Math.exp(-event.deltaY * .001), .22, 1.7);
      gesture.moved = true;
      showControls();
      renderAvatarMotion();
    }, { passive: false, capture: true });
    controls.addEventListener('click', showControls, true);
    // The React motion console can call the avatar directly, so those actions
    // do not pass through requestAction(). Give a direct control action the
    // same eventual return-to-swim behavior without interrupting long chains.
    controls.addEventListener('click', function (event) {
      if (event.target.closest && event.target.closest('button')) scheduleFreeSwimReturn(12500);
    }, true);
    new MutationObserver(showControls).observe(controls, { subtree: true, attributes: true, attributeFilter: ['aria-expanded'] });
    worldApi.entities = entities;
    worldApi.perception = perception;
    worldApi.behavior = behavior;
    worldApi.emit = emit;
    worldApi.on = on;
    worldApi.refresh = refreshPerception;
    refreshPerception();
    window.setTimeout(applyDefaultAvatarScale, 900);
    window.setTimeout(ensureDefaultFreeSwim, 1400);
    window.setInterval(refreshPerception, 180);
    // Keep the world alive even when CSS fish do not cross the exact center
    // point during a short preview. The nearest semantic fish becomes a real
    // perception target, then the same notice/approach/settle chain runs.
    function sampleWorldInterest() {
      refreshPerception();
      if (behavior.state === 'idle' && perception.nearestFish) {
        var fish = perception.nearestFish;
        var targetPosition = { x: Math.abs(fish.position.x) > .28 ? fish.position.x : (Date.now() / 18000 % 2 < 1 ? -.62 : .62), y: clamp(fish.position.y, -.55, .55), z: fish.position.z };
        emit('FISH_ENTERED_NEARBY', { entity: fish, targetPosition: targetPosition, source: 'world-cycle' });
      }
    }
    window.setTimeout(sampleWorldInterest, 3200);
    window.setInterval(sampleWorldInterest, 18000);
  }

  boot();
}());
