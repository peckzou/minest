/* Knowledge Skyscraper prototype: a Science board in Minest's own shape (board → columns → cards, a stack in card.stack).
   Pictures are drawn here (emoji art) so the prototype works offline. */
(function () {
  function art(emoji, a, b, sq) {
    var c = document.createElement('canvas'); c.width = sq ? 360 : 440; c.height = sq ? 360 : 300; var x = c.getContext('2d');
    var g = x.createLinearGradient(0, 0, c.width, c.height); g.addColorStop(0, a); g.addColorStop(1, b); x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = 'rgba(255,255,255,.12)'; for (var i = 0; i < 5; i++) { x.beginPath(); x.arc((i * 97) % c.width, (i * 61) % c.height, 40 + i * 14, 0, 7); x.fill(); }
    x.font = (sq ? 180 : 170) + 'px "Apple Color Emoji", "Segoe UI Emoji", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(emoji, c.width / 2, c.height / 2 + 8);
    return c.toDataURL('image/jpeg', .85);
  }
  var n = 0;
  function card(title, zh, back, o) { o = o || {}; var c = { id: 'ks-c' + (++n), title: title, titleZh: zh, back: back }; if (o.e) c.cover = { type: 'image', value: art(o.e, o.a || '#2f6f9f', o.b || '#9fd3f0', o.sq) }; if (o.type) c.type = o.type; if (o.stack) c.stack = o.stack; if (o.check) c.checklistItems = o.check.map(function (t, i) { return { id: c.id + 'k' + i, text: t, done: i === 0 }; }); return c; }
  var cols = [
    { id: 'ks-l1', title: 'Ecology', cards: [
      card('Ecosystem', '生态系统', 'Living things and their environment working as one system.', { e: '🌍', a: '#2f7d4f', b: '#9bd17a', check: ['Biotic vs abiotic', 'Two examples'] }),
      card('Food Web', '食物网', 'Many food chains linked together.', { e: '🕸', a: '#6b5a3a', b: '#d8c08a' }),
      card('Producer', '生产者', 'Makes its own food, usually by photosynthesis.'),
      card('Decomposer', '分解者', 'Breaks down dead matter and returns nutrients.', { e: '🍄', a: '#6b4a7a', b: '#d6a6c9' }),
      card('Habitat', '栖息地', 'The natural home of an organism.', { e: '🏞', a: '#3a7a5a', b: '#a8d8b0' }),
      card('Biodiversity', '生物多样性', 'The variety of life in a place.', { e: '🦋', a: '#2d6a9f', b: '#9fd3f0' }),
      card('Symbiosis', '共生', 'A close, long-term relationship between species.'),
      card('Adaptation', '适应', 'A trait that helps a living thing survive.', { e: '🦎', a: '#4a7a3a', b: '#c8e08a' })] },
    { id: 'ks-l2', title: 'Energy', cards: [
      card('Kinetic Energy', '动能', 'The energy of motion.', { e: '🎢', a: '#c0602e', b: '#f2b46a' }),
      card('Potential Energy', '势能', 'Stored energy, waiting to be used.'),
      card('Solar Power', '太阳能', 'Energy from sunlight.', { e: '☀️', a: '#e08a1c', b: '#ffe08a' }),
      card('Wind Turbine', '风力涡轮机', 'Turns moving air into electricity.', { e: '🌬', a: '#4f8fb0', b: '#cfe8f0' }),
      card('Conductor', '导体', 'A material that lets electricity flow.'),
      card('Circuit', '电路', 'A closed path for electric current.', { e: '💡', a: '#c79a1c', b: '#f7e08a' }),
      card('Heat Transfer', '热传递', 'Conduction, convection and radiation.')] },
    { id: 'ks-l3', title: 'Earth Science', cards: [
      card('Volcano', '火山', 'An opening where magma reaches the surface.', { e: '🌋', a: '#8a2f1f', b: '#f0906a' }),
      card('Plate Tectonics', '板块构造', 'Earth\'s crust moves in giant plates.'),
      card('Rock Cycle', '岩石循环', 'Igneous → sedimentary → metamorphic.', { e: '🪨', a: '#5a5a62', b: '#c0c0c8' }),
      card('Erosion', '侵蚀', 'Wind and water wear land away.'),
      card('Water Cycle', '水循环', 'Evaporation, condensation, precipitation.', { e: '🌧', a: '#356d9c', b: '#9fc8e8' }),
      card('Weather', '天气', 'The state of the air at a place and time.', { e: '⛅', a: '#4a7fbf', b: '#cfe0f0' }),
      card('Fossil', '化石', 'Remains of ancient life kept in rock.', { e: '🦴', a: '#8a7a5a', b: '#e0d0a8' }),
      card('Earthquake', '地震', 'Sudden shaking when plates slip.'),
      card('Mineral', '矿物', 'A natural, solid crystal.', { e: '💎', a: '#4a3a8a', b: '#b8a8f0' })] },
    { id: 'ks-l4', title: 'Space', cards: [
      card('Solar System', '太阳系', 'The Sun and everything that orbits it.', { e: '🪐', a: '#1d2550', b: '#7a6ab0' }),
      card('Moon Phases', '月相', 'New, crescent, quarter, gibbous, full.', { e: '🌗', a: '#1f2a44', b: '#8a94b8' }),
      card('Gravity', '重力', 'The pull between masses.'),
      card('Star', '恒星', 'A ball of hot gas making its own light.', { e: '⭐', a: '#2a2a5a', b: '#c8b860' }),
      card('Galaxy', '星系', 'Billions of stars held by gravity.', { e: '🌌', a: '#1a1440', b: '#6a4ab0' }),
      card('Orbit', '轨道', 'The curved path around a planet or star.'),
      card('Comet', '彗星', 'Ice and dust with a glowing tail.', { e: '☄️', a: '#20305a', b: '#9ab8e0' }),
      card('Astronaut', '宇航员', 'A person trained to travel in space.', { e: '🧑‍🚀', a: '#2a3a6a', b: '#a8b8e0' })] },
    { id: 'ks-l5', title: 'Human Body', cards: [
      card('Heart', '心脏', 'Pumps blood around the body.', { e: '🫀', a: '#8a1f2f', b: '#f08a9a' }),
      card('Lungs', '肺', 'Take in oxygen, let out carbon dioxide.', { e: '🫁', a: '#8a4a5a', b: '#f0b8c0' }),
      card('Skeleton', '骨骼', '206 bones support and protect you.', { e: '🦴', a: '#6a6a72', b: '#e0e0e8' }),
      card('Brain', '大脑', 'Controls thinking, feeling and movement.', { e: '🧠', a: '#8a4a7a', b: '#f0b0d8' }),
      card('Digestion', '消化', 'Breaking food into nutrients.'),
      card('Muscles', '肌肉', 'Contract to move the body.')] },
    { id: 'ks-l6', title: 'Great Scientists', cards: [
      card('Marie Curie', '居里夫人', 'Radioactivity; two Nobel Prizes.', { type: 'person', e: '⚗️', a: '#4a3a6a', b: '#c0a8e0', sq: 1 }),
      card('Isaac Newton', '牛顿', 'Laws of motion and gravity.', { type: 'person', e: '🍎', a: '#6a2a2a', b: '#e0a0a0', sq: 1 }),
      card('Jane Goodall', '珍·古道尔', 'Studied chimpanzees at Gombe.', { type: 'person', e: '🐒', a: '#6a4a2a', b: '#d8b080', sq: 1 }),
      card('Albert Einstein', '爱因斯坦', 'Relativity: E = mc².', { type: 'person', e: '💫', a: '#2a3a5a', b: '#a8c0e0', sq: 1 }),
      card('Rachel Carson', '蕾切尔·卡森', 'Silent Spring, 1962.', { type: 'person', e: '🌿', a: '#2a5a3a', b: '#a0d8b0', sq: 1 }),
      card('Galileo Galilei', '伽利略', 'Telescopes and the moons of Jupiter.', { type: 'person', e: '🔭', a: '#3a2a5a', b: '#b0a0e0', sq: 1 })] }
  ];
  var boards = [{ id: 'ks-b1', title: 'Science Tower', columns: cols }];
  window.KS_SAMPLE = { boards: boards, provider: { boards: function () { return boards; } } };
})();
