"""Lighter island SVG (My World display): a box face without decoration is one <rect transform> instead of a <g> + <rect>,
and a thin face (narrower than THIN blocks: lane dashes, kerbs, trims) is filled with its texture's average colour instead
of the texture pattern. Same look at island scale, a third fewer nodes and far fewer pattern fills — big cities stay
smooth on the phone. Patched in place in every copy; safe to re-run."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FILES = ['iPhone53.8241.html', 'iphone.html', 'index.html', 'ipad.html', 'iPhoneDuo.html', 'ios/Minest/Minest/iphone.html',
         'ios/Minest/Minest/iphone18.0.html', 'ios/Minest/Minest/ipad.html', 'ios/MinestProject/MyApp/iphone.html']

EDITS = [
    ("var DEFS = null, TEXURL = {};",
     "var DEFS = null, TEXURL = {}, TEXAVG = {}, THIN = .14;   // TEXAVG: each texture's average colour, for thin faces"),
    ("var url = cv.toDataURL(); TEXURL[name + '-' + sh] = url;",
     "var url = cv.toDataURL(); TEXURL[name + '-' + sh] = url; var sr = 0, sg = 0, sb = 0, sn = 0; px.forEach(function (q) { if (q[3] > .2) { sr += q[0]; sg += q[1]; sb += q[2]; sn++; } }); sn = sn || 1; TEXAVG[name + '-' + sh] = 'rgb(' + Math.round(sr / sn * f) + ',' + Math.round(sg / sn * f) + ',' + Math.round(sb / sn * f) + ')';"),
    ("function face(m, w, h, tex, sh, d) { return '<g transform=\"' + m + '\"><rect width=\"' + (+w.toFixed(3)) + '\" height=\"' + (+h.toFixed(3)) + '\" fill=\"url(#tx-' + tex + '-' + sh + ')\"/>' + (d || '') + '</g>'; }",
     "function face(m, w, h, tex, sh, d) { var fl = Math.min(w, h) < THIN && TEXAVG[tex + '-' + sh] ? TEXAVG[tex + '-' + sh] : 'url(#tx-' + tex + '-' + sh + ')', r = '<rect' + (d ? '' : ' transform=\"' + m + '\"') + ' width=\"' + (+w.toFixed(3)) + '\" height=\"' + (+h.toFixed(3)) + '\" fill=\"' + fl + '\"/>'; return d ? '<g transform=\"' + m + '\">' + r + d + '</g>' : r; }"),
]

for f in FILES:
    p = ROOT / f
    s = p.read_text(encoding='utf-8')
    for a, b in EDITS:
        if b in s: continue
        assert s.count(a) == 1, (f, a[:60])
        s = s.replace(a, b)
    p.write_text(s, encoding='utf-8')
    print('patched', f)
