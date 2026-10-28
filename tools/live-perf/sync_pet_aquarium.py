"""Sync the small fold-entry controller into the existing generated phone pages."""
from pathlib import Path
import re
root = Path(__file__).resolve().parents[2]
body = (root/'tools/live-perf/pet_aquarium_hinge.js').read_text()
block = '<script id="mn-pet-aquarium-hinge">\n'+body+'\n</script>'
for name in ['iPhone53.8241.html','iPhoneDuo.html','iphone.html','index.html','ios/Minest/Minest/iphone.html','ios/Minest/Minest/iphone18.0.html']:
    path = root/name
    text = path.read_text()
    updated, count = re.subn(r'<script id="mn-pet-aquarium-hinge">[\s\S]*?</script>', lambda _: block, text)
    if count != 1: raise ValueError(f'{name}: expected one controller, found {count}')
    if updated != text: path.write_text(updated)
