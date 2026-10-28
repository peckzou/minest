const vm = require('node:vm');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const listeners = {}, timers = new Map();
let pet = null, water = false, opens = 0, restores = 0, observer, seq = 0;
const document = {
  body: {}, hidden: false,
  getElementById: () => pet,
  documentElement: {classList: {remove() {}}},
  addEventListener() {}
};
const window = {
  THREE: {},
  MinestAquarium: {
    open() { water = true; opens++; }, isOpen: () => water,
    close() { water = false; listeners['minest:aquarium-closed'](); }
  },
  MinestPetRaising: {open() { mount(); restores++; }}
};
function mount() { pet = { remove() { pet = null; } }; }
function fold(status, angle) {
  window.__minestHinge = {status, angle};
  listeners['minest:hinge']({detail: window.__minestHinge});
}
function flush() { const f = [...timers.values()]; timers.clear(); f.forEach(fn => fn()); }
vm.runInNewContext(fs.readFileSync('tools/live-perf/pet_aquarium_hinge.js','utf8'), {
  window, document, console,
  addEventListener(name, fn) { listeners[name] = fn; },
  MutationObserver: class { constructor(fn) { observer = fn; } observe() {} },
  setTimeout(fn) { timers.set(++seq, fn); return seq; }, clearTimeout(id) { timers.delete(id); },
  CustomEvent: class {}
});
fold('partial',2.9); flush(); assert.equal(opens,0,'board fold never opens aquarium');
mount(); fold('partial',2.9); fold('partial',2.91); assert.equal(timers.size,1,'hinge jitter debounced');
flush(); assert.equal(opens,1); assert.equal(pet,null,'Pet WebGL frame released');
fold('partial',2.85); flush(); assert.equal(opens,1,'no duplicate scene');
fold('open',Math.PI); assert.equal(water,false); assert.equal(restores,1,'unfold restores Pet');
fold('partial',2.9); flush(); window.MinestAquarium.close();
observer(); flush(); assert.equal(opens,2,'manual close does not immediately reopen');
fold('open',Math.PI); window.MinestPetAquarium.open();
fold('open',Math.PI); assert.equal(water,true,'manual aquarium survives unfolding');
window.MinestAquarium.close(); fold('open',Math.PI);
mount(); document.hidden=true; fold('partial',2.9); flush(); assert.equal(water,false,'background never opens');
document.hidden=false; fold('open',Math.PI); fold('partial',2.9); fold('open',Math.PI); flush();
assert.equal(water,false,'quick accidental fold cancels pending entry');
mount(); fold('partial',0.2); flush(); assert.equal(water,false,'closed fold excluded');
window.THREE=null; fold('partial',2.9); flush(); assert.ok(pet,'unavailable renderer keeps Pet visible');
console.log('PASS: Pet-only entry, debounce, duplicates, unfold, close suppression, manual mode, background, cancel, missing renderer');
