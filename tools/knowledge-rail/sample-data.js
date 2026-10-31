/* Knowledge Drive prototype: sample boards in Minest's own shape (board → columns → cards, stacks in card.stack).
   Pictures are drawn here (emoji art), so the prototype works offline. */
(function () {
  function art(emoji, a, b, sq) {
    var c = document.createElement('canvas'); c.width = sq ? 400 : 480; c.height = sq ? 400 : 320; var x = c.getContext('2d');
    var g = x.createLinearGradient(0, 0, c.width, c.height); g.addColorStop(0, a); g.addColorStop(1, b); x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = 'rgba(255,255,255,.12)'; for (var i = 0; i < 6; i++) { x.beginPath(); x.arc(Math.random() * c.width, Math.random() * c.height, 30 + Math.random() * 90, 0, 7); x.fill(); }
    x.font = (sq ? 210 : 190) + 'px "Apple Color Emoji", "Segoe UI Emoji", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(emoji, c.width / 2, c.height / 2 + 10);
    return c.toDataURL('image/jpeg', .85);
  }
  var n = 0;
  function card(title, o) { o = o || {}; var c = { id: 'kd-c' + (++n), title: title, createdAt: Date.now() - n * 6e4 }; if (o.img) c.cover = { type: 'image', value: o.img }; ['titleZh', 'back', 'desc', 'notes', 'type', 'emoji'].forEach(function (k) { if (o[k]) c[k] = o[k]; }); if (o.check) c.checklistItems = o.check.map(function (t, i) { return { id: c.id + '-k' + i, text: t[0], done: !!t[1] }; }); if (o.labels) c.labels = o.labels.map(function (l) { return { name: l }; }); if (o.stack) c.stack = o.stack; return c; }
  var eco = [
    card('Ecosystem', { titleZh: '生态系统', back: 'A community of living things together with their physical environment, interacting as a system.', img: art('🌍', '#2f7d4f', '#9bd17a'), labels: ['Core'], check: [['Define biotic / abiotic', 1], ['Give 2 examples', 0]] }),
    card('Producer', { titleZh: '生产者', back: 'An organism that makes its own food, usually by photosynthesis — plants, algae.', emoji: '🌱' }),
    card('Food Chain', { titleZh: '食物链', back: 'The order in which energy passes from one living thing to the next.', img: art('🦊', '#c0602e', '#f2b46a'), stack: [
      card('Primary Consumer', { titleZh: '初级消费者', back: 'An herbivore that eats producers.', img: art('🐇', '#7c8f5a', '#d8e3b0') }),
      card('Secondary Consumer', { titleZh: '次级消费者', back: 'Eats primary consumers.', img: art('🐍', '#4a6b3a', '#b8cf8a') }),
      card('Apex Predator', { titleZh: '顶级捕食者', back: 'At the top of the food chain; no natural predators.', img: art('🦅', '#4b5f86', '#a9c1e6') })] }),
    card('Decomposer', { titleZh: '分解者', back: 'Breaks down dead matter and returns nutrients to the soil — fungi, bacteria.', img: art('🍄', '#6b4a7a', '#d6a6c9') }),
    card('Habitat', { titleZh: '栖息地', back: 'The natural home of an organism.', emoji: '🏡' }),
    card('Biodiversity', { titleZh: '生物多样性', back: 'The variety of life in a place.', img: art('🦋', '#2d6a9f', '#9fd3f0') }),
    card('Niche', { titleZh: '生态位', back: 'The role a species plays in its ecosystem.' }),
    card('Symbiosis', { titleZh: '共生', back: 'A close, long-term relationship between two species.', img: art('🐝', '#c79a1c', '#f7e08a') }),
    card('Carrying Capacity', { titleZh: '环境承载力', back: 'The largest population an environment can support.' }),
    card('Water Cycle', { titleZh: '水循环', back: 'Evaporation → condensation → precipitation → collection.', img: art('🌧', '#356d9c', '#9fc8e8'), check: [['Evaporation', 1], ['Condensation', 1], ['Precipitation', 0]] })
  ];
  var photo = [
    card('Photosynthesis', { titleZh: '光合作用', back: '6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂', img: art('☀️', '#e08a1c', '#ffe08a'), notes: 'Happens in the chloroplast.' }),
    card('Chlorophyll', { titleZh: '叶绿素', back: 'The green pigment that absorbs light.', img: art('🍃', '#2f8a3c', '#a6e08a') }),
    card('Stomata', { titleZh: '气孔', back: 'Tiny pores on leaves for gas exchange.' }),
    card('Glucose', { titleZh: '葡萄糖', back: 'The sugar a plant makes and stores as energy.' }),
    card('Light Reaction', { titleZh: '光反应', back: 'Uses light to split water and make ATP and NADPH.', emoji: '⚡' })
  ];
  var books = [
    card('The Hidden Life of Trees', { type: 'book', back: 'Peter Wohlleben', img: art('🌳', '#3e5a34', '#9fbf6a') }),
    card('Silent Spring', { type: 'book', back: 'Rachel Carson, 1962' }),
    card('Charlotte\'s Web', { type: 'book', back: 'E. B. White', img: art('🕸', '#6d6a55', '#d8d0a8') }),
    card('The Very Hungry Caterpillar', { type: 'book', back: 'Eric Carle', img: art('🐛', '#4f8a3c', '#e0d060') })
  ];
  var movies = [
    card('My Neighbor Totoro', { type: 'movie', back: 'Studio Ghibli, 1988', img: art('🌰', '#2f5d7a', '#8fc0a0') }),
    card('Finding Nemo', { type: 'movie', back: 'Pixar, 2003', img: art('🐠', '#1f6fa8', '#7fd3f0') }),
    card('WALL·E', { type: 'movie', back: 'Pixar, 2008', img: art('🤖', '#8a6a3a', '#e0c08a') })
  ];
  var albums = [
    card('Four Seasons', { type: 'album', back: 'Vivaldi', img: art('🎻', '#5a3a2a', '#d8a070', 1) }),
    card('Songs of the Humpback Whale', { type: 'album', back: 'Roger Payne, 1970', img: art('🐋', '#1f3f6a', '#6fa8d8', 1) }),
    card('Rainforest Sounds', { type: 'album', back: 'Nature recordings', img: art('🦜', '#1f6a3a', '#8fd890', 1) })
  ];
  var people = [
    card('Jane Goodall', { type: 'person', back: 'Primatologist; studied chimpanzees at Gombe.', img: art('🐒', '#6a4a2a', '#d8b080', 1) }),
    card('Charles Darwin', { type: 'person', back: 'On the Origin of Species, 1859.', img: art('🐢', '#4a5a3a', '#b0c890', 1) }),
    card('Wangari Maathai', { type: 'person', back: 'Green Belt Movement; Nobel Peace Prize 2004.' })
  ];
  var boards = [
    { id: 'kd-b1', title: 'Biology', columns: [
      { id: 'kd-l1', title: 'Ecology', cards: eco },
      { id: 'kd-l2', title: 'Photosynthesis', cards: photo },
      { id: 'kd-l3', title: 'Books', cards: books },
      { id: 'kd-l4', title: 'Movies', cards: movies },
      { id: 'kd-l5', title: 'Albums', cards: albums },
      { id: 'kd-l6', title: 'People', cards: people }] },
    { id: 'kd-b2', title: '中文词汇', columns: [
      { id: 'kd-l7', title: '天气', cards: [card('晴天', { back: 'sunny day', emoji: '☀️' }), card('下雨', { back: 'to rain', img: art('☔', '#355c8a', '#9fc0e0') }), card('彩虹', { back: 'rainbow', img: art('🌈', '#7a5ab0', '#f0c0e0') }), card('雷电', { back: 'thunder and lightning' })] }] }
  ];
  window.KD_SAMPLE = {
    boards: boards,
    provider: { boards: function () { return boards; } }
  };
})();
