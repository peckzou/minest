/* Minest · Spatial Home — block-style pixel icons (2026-11-13). Original 16×16 pixel art in a blocky voxel-game look,
   drawn as crisp SVG (one <rect> per run of pixels), so the room's buttons match the voxel room instead of emoji.
   Each icon: 16 rows × 16 characters, '.' = empty, other letters = colours from its palette (k = outline). */
(function (root) {
  'use strict';
  var P0 = { k: '#1b1b1f', w: '#f4f1e8', W: '#ffffff', g: '#7d7d84', G: '#4b4b52', d: '#2f2f35', s: '#b9b9bf',
    b: '#7a4a26', B: '#5a3418', o: '#c98a4a', y: '#f2c13d', Y: '#ffe27a', r: '#d0463a', R: '#8f2a22', p: '#f08cb0', P: '#c45b86',
    c: '#4fd2ff', C: '#1f8fc4', n: '#62c84a', N: '#2f7a2a', u: '#4a7fd6', U: '#2b4f9a', v: '#9a6bff', t: '#3a2a1a', a: '#e8d2a0' };
  var I = {
    typewriter: [
      '................', '................', '....kkkkkkkk....', '....kwwwwwwk....', '....kwkkkkwk....', '..kkkkkkkkkkkk..',
      '.kddddddddddddk.', '.kdGGGGGGGGGGdk.', '.kdGsGsGsGsGGdk.', '.kdGGGGGGGGGGdk.', '.kdGGsGsGsGsGdk.', '.kdGGGGGGGGGGdk.',
      '.kdGGGsssssGGdk.', '.kddddddddddddk.', '..kkkkkkkkkkkk..', '................'],
    planner: [
      '................', '...kkkkkkkkkk...', '..kUuuuuuuuuuk..', '..kUuwwwwwwwuk..', '.ksUuwkkkkkwuk..', '..kUuwwwwwwwuk..',
      '.ksUuwkkkkwwuk..', '..kUuwwwwwwwuk..', '.ksUuwkkkkkwuk..', '..kUuwwwwwwwuk..', '.ksUuwkkkwwwuk..', '..kUuwwwwwwwuk..',
      '..kUuuuuuuuuuk..', '..kUUUUUUUUUUk..', '...kkkkkkkkkk...', '................'],
    board: [
      '................', 'kkkkkkkkkkkkkkkk', 'kBBBBBBBBBBBBBBk', 'kBooooooooooooBk', 'kBoowwwoorooooBk', 'kBoowwwooaaaaoBk',
      'kBoowwwooaaaaoBk', 'kBooooooaaaaooBk', 'kBorooooooooooBk', 'kBoyyyyoowwwooBk', 'kBoyyyyoowwwooBk', 'kBoyyyyooooouoBk',
      'kBooooooooooooBk', 'kBBBBBBBBBBBBBBk', 'kkkkkkkkkkkkkkkk', '......kk.kk.....'],
    album: [
      '................', '..kkkkkkkkkkk...', '..kRrrrrrrrrrk..', '..kRrrrryrrrrk..', '..kRrrryyyrrrk..', '..kRryyyyyyyrk..',
      '..kRrryyyyyrrk..', '..kRrryyryyrrk..', '..kRrrrrrrrrrk..', '..kRrrrrrrrrrk..', '..kRaaaaaaaaak..', '..kRwwwwwwwwwk..',
      '..kRaaaaaaaaak..', '..kkkkkkkkkkkk..', '................', '................'],
    projector: [
      '................', '.......cc.......', '......cWWc......', '.....cWccWc.....', '......cWWc......', '.......cc.......',
      '......c..c......', '.....c....c.....', '....c......c....', '...kkkkkkkkkk...', '..kgggggggggggk.', '..kgsscccccssgk.',
      '..kGGGGGGGGGGGk.', '..kdddddddddddk.', '...kk.......kk..', '................'],
    ornament: [
      '................', '.....kkkkkk.....', '...kkcWccccckk..', '..kcWcccccccck..', '..kcWcnnncccck..', '.kccccnnnnccccck',
      '.kcccnnnnnncccck', '.kccNNnnnnNNccck', '..kcNNNNNNNNcck.', '..kccccccccccck.', '...kkkkkkkkkkk..', '....kyyyyyyyk...',
      '...kyYyyyyyYyk..', '...kkkkkkkkkkk..', '................', '................'],
    backpack: [
      '................', '.....kkkkkk.....', '....kBk..kBk....', '...kkkkkkkkkk...', '..kbbbbbbbbbbk..', '..kbooooooooBk..',
      '..kbooooooooBk..', '..kbkkkkkkkkBk..', '..kbbbbyybbbBk..', '..kbbbbyybbbBk..', '..kbooooooooBk..', '..kbobbbbbboBk..',
      '..kbobbbbbboBk..', '..kBBBBBBBBBBk..', '...kkkkkkkkkk...', '................'],
    gramophone: [
      '..........kkkk..', '........kkyyyk..', '.......kyyYYyk..', '......kyyYYyk...', '.....kyyyyk.....', '....kyyyk.......',
      '...kyyk.........', '...kk...........', '...k............', '.kkkkkkkkkkkk...', '.kdddddddddddk..', '.kbbbbbbbbbbbk..',
      '.kbooooyoooobk..', '.kbbbbbbbbbbbk..', '.kkkkkkkkkkkkk..', '................'],
    film: [
      '................', '..kkkk....kkkk..', '.kGggGk..kGggGk.', '.kgkkgk..kgkkgk.', '.kGggGk..kGggGk.', '..kkkk....kkkk..',
      '....k......k....', '..kkkkkkkkkkkk..', '..kddddddddddkkk', '..kdGGGGGGGGdkck', '..kdGGGGGGGGdkck', '..kddddddddddkkk',
      '..kkkkkkkkkkkk..', '.....k....k.....', '....kk....kk....', '................'],
    portal: [
      '.....kkkkkk.....', '...kkrrrrrrkk...', '..krrkkkkkkrrk..', '.krrkuuuuuukrrk.', '.krkuucccpuukrk.', 'krrkuccccppukrrk',
      'krkuuyyuuppuukrk', 'krkuuyyunnuuukrk', 'krkuuuuunnuuukrk', 'krkuurruuuuuukrk', 'krkuurruuucccukr', 'krkuuuuuuucccukr',
      'krkyyyyyyyyyyykr', 'krkdddddddddddkr', 'kkkkkkkkkkkkkkkk', '................'],
    holo: [
      '................', '....cc....cc....', '...c..cccc..c...', '..c..cWWWWc..c..', '...cccWccWccc...', '..c..cWWWWc..c..',
      '...c..cccc..c...', '....cc....cc....', '.......cc.......', '..kkkkkkkkkkkk..', '.kssssssssssssk.', '.kgggggggggggggk',
      '..kkkkkggkkkkk..', '......kggk......', '....kkkkkkkk....', '................'],
    aquarium: [
      '................', '.kkkkkkkkkkkkkk.', '.kccccccccccccck', '.kcCCCCCCCCCCCck', '.kcCCCCppppCCCck', '.kcCCCpPpPppCCck',
      '.kcCCCppppppCCck', '.kcCnCCpCpCpCCck', '.kcnnCpCpCpCpCck', '.kcnnCCCCCCCCCck', '.kcyyyyyyyyyyyck', '.kkkkkkkkkkkkkkk',
      '..kbbbbbbbbbbbk.', '..kBBBBBBBBBBBk.', '..k.k.......k.k.', '................'],
    quill: [
      '.............kk.', '............kWWk', '...........kWwwk', '..........kWwwk.', '.........kWwwk..', '........kWwwk...',
      '.......kWwwk....', '......kWwwk.....', '.....kWwwk......', '....kWwwk.......', '...kwwwk........', '...kwwk.........',
      '..kkkk..........', '..kk............', '.kk.............', '.k..............'],
    mochi: [
      '................', '................', '.....kkkkkk.....', '...kkwwwwwwkk...', '..kwwwwwwwwwwk..', '.kwwwwwwwwwwwwk.',
      '.kwwkkwwwwkkwwk.', '.kwwkkwwwwkkwwk.', '.kwpwwwwwwwwpwk.', '.kwwwwwkkwwwwwk.', '.kwwwwwwwwwwwwk.', '..kwwwwwwwwwwk..',
      '...kkkkkkkkkk...', '................', '................', '................'],
    key: [
      '................', '................', '..kkkk..........', '.kyyyyk.........', 'kyykkyyk........', 'kykkkkykkkkkkkk.',
      'kykkkkyyyyyyyyyk', 'kyykkyykkkykkykk', '.kyyyyk...kk.kk.', '..kkkk..........', '................', '................',
      '................', '................', '................', '................'],
    medal: [
      '................', '...kkk....kkk...', '...kuuk..kurk...', '....kuukkurk....', '.....kuurrk.....', '......kurk......',
      '.....kkkkkk.....', '....kyyyyyyk....', '...kyYYyyyyyk...', '...kyYyykyyyk...', '...kyyyykkyyk...', '...kyyykyyyyk...',
      '...kyyyyyyyyk...', '....kyyyyyyk....', '.....kkkkkk.....', '................'],
    bookstand: [
      '................', '................', '.kkkkkkk.kkkkkkk', 'kwwwwwwkkwwwwwwk', 'kwkkkkwkkwkkkkwk', 'kwwwwwwkkwwwwwwk',
      'kwkkkwwkkwkkkkwk', 'kwwwwwwkkwwwwwwk', 'kkkkkkkkkkkkkkkk', '.....kbbbbk.....', '......kbbk......', '......kbbk......',
      '......kbbk......', '....kkbbbbkk....', '...kBBBBBBBBk...', '...kkkkkkkkkk...'],
    car: [
      '................', '................', '................', '.....kkkkkk.....', '....kRrrrrRk....', '...kRkcckcckRk..',
      '..kRrkcckcckrRk.', '.kkrrrrrrrrrrrkk', 'kRrrrrrrrrrrrrrk', 'kryrrrrrrrrrrryk', 'kRrrrrrrrrrrrrRk', 'kkkkkkkkkkkkkkkk',
      '..kddk....kddk..', '..kGGk....kGGk..', '...kk......kk...', '................'],
    globe: [
      '................', '.....kkkkkk.....', '...kkuuuuuukk...', '..kuunnnuuuuuk..', '.kunnnnnuuuuuuk.', '.kunnnnuuuunnuk.',
      'kuuunnuuuunnnnuk', 'kuuuuuuuuunnnuuk', 'kuunnuuuuuunuuuk', 'kunnnnnuuuuuuuuk', '.kunnnnnuuuuuuk.', '.kuunnnuuuunnuk.',
      '..kuuuuuuunnuk..', '...kkuuuuuukk...', '.....kkkkkk.....', '................'],
    window: [
      '................', 'kkkkkkkkkkkkkkkk', 'kbbbbbbbbbbbbbbk', 'kbccccccbcccccbk', 'kbccWcccbcccccbk', 'kbcWWcccbcccccbk',
      'kbccccccbcccccbk', 'kbbbbbbbbbbbbbbk', 'kbnnccccbcccnnbk', 'kbnnnnccbccnnnbk', 'kbNnnnnnbnnnnNbk', 'kbNNnnnnbnnnNNbk',
      'kbbbbbbbbbbbbbbk', 'kkkkkkkkkkkkkkkk', '................', '................'],
    chair: [
      '................', '...kkkkkkkkk....', '...kbbbbbbbk....', '...kboooooBk....', '...kboooooBk....', '...kboooooBk....',
      '...kbbbbbbbk....', '...kbk...kbk....', '..kkkkkkkkkkkk..', '..kbbbbbbbbbbk..', '..kBBBBBBBBBBk..', '..kkkkkkkkkkkk..',
      '...kbk....kbk...', '...kbk....kbk...', '...kkk....kkk...', '................'],
    person: [
      '................', '.....kkkkkk.....', '.....kttttk.....', '.....kaaaak.....', '.....kakkak.....', '.....kaaaak.....',
      '.....kkkkkk.....', '...kkuuuuuukk...', '...kauuuuuuak...', '...kauuuuuuak...', '...kkuuuuuukk...', '.....kUUUUk.....',
      '.....kUkkUk.....', '.....kUkkUk.....', '.....kkkkkk.....', '................'],
    gear: [
      '................', '......kkkk......', '...kk.kggk.kk...', '..kggkkggkkggk..', '..kgggggggggggk.', '...kggGkkGggk...',
      '.kkggGk..kGggkk.', '.kgggk....kgggk.', '.kgggk....kgggk.', '.kkggGk..kGggkk.', '...kggGkkGggk...', '..kgggggggggggk.',
      '..kggkkggkkggk..', '...kk.kggk.kk...', '......kkkk......', '................'],
    menu: [
      '................', '................', '................', '..kkkkkkkkkkkk..', '..kWWWWWWWWWWk..', '..kkkkkkkkkkkk..',
      '................', '..kkkkkkkkkkkk..', '..kWWWWWWWWWWk..', '..kkkkkkkkkkkk..', '................', '..kkkkkkkkkkkk..',
      '..kWWWWWWWWWWk..', '..kkkkkkkkkkkk..', '................', '................'],
    close: [
      '................', '................', '..kkk......kkk..', '..kWWk....kWWk..', '...kWWk..kWWk...', '....kWWkkWWk....',
      '.....kWWWWk.....', '......kWWk......', '.....kWWWWk.....', '....kWWkkWWk....', '...kWWk..kWWk...', '..kWWk....kWWk..',
      '..kkk......kkk..', '................', '................', '................'],
    rotate: [
      '................', '.....kkkkkk.....', '...kkWWWWWWkk...', '..kWWkkkkkkWWk..', '.kWWk......kWk..', '.kWk........k...',
      '.kWk......kkkkk.', '.kWk.......kWWk.', '.kWk......kWWWk.', '.kWWk....kWWWk..', '..kWWkkkkWWk....', '...kkWWWWkk.....',
      '.....kkkk.......', '................', '................', '................'],
  };
  var ALIAS = { projector16: 'film', tsqPortal: 'portal', holoDesk: 'holo', carkey: 'key', medals: 'medal', carmodel: 'car', pack: 'backpack',
    env: 'globe', views: 'window', sit: 'chair', view: 'person', set: 'gear', exit: 'close' };
  var cache = {};
  function svg(name) {
    name = ALIAS[name] || name; if (cache[name]) return cache[name];
    var rows = I[name]; if (!rows) return '';
    var out = '';
    rows.forEach(function (row, y) {
      row = (row + '................').slice(0, 16);
      for (var x = 0; x < 16;) { var ch = row[x]; if (ch === '.') { x++; continue; } var x0 = x; while (x < 16 && row[x] === ch) x++;
        out += '<rect x="' + x0 + '" y="' + y + '" width="' + (x - x0) + '" height="1" fill="' + (P0[ch] || '#f0f') + '"/>'; }
    });
    return (cache[name] = '<svg class="px" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">' + out + '</svg>');
  }
  root.SpatialPixIcons = { svg: svg, has: function (n) { return !!I[ALIAS[n] || n]; }, names: function () { return Object.keys(I); } };
})(window);
