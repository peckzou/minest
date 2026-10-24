"""Muse's teacher-side upgrade v1 (2026-10-24, made on top of its My World v3 copy) merged into iPhone53.8241.html.
teach_v1.patch is its diff against Muse v3 (= 2743bc5:iphone.html + muse_v3.patch); teach_v1_CHANGES.md says what each
part does: ▶ 开始上课 on the home row, ⏹ 结束课堂 in the class dock, 完成 / 跳过 as two buttons, 44px dock buttons,
" · 轮到" and the reason in score toasts, "N 环节 · 会跳过 M 个" in the flow picker, and the prep panel's missing-only memory.
A 3-way merge (git merge-file) brings it over our later work; where both changed the same lines ours stays.
Applied in place, then copied to the other copies. Re-running does nothing once the merge is in.
"""
from pathlib import Path
import re, shutil, subprocess, tempfile

ROOT = Path('/Users/cece/Documents/minest'); HERE = ROOT / 'tools/live-perf'
SRC = ROOT / 'iPhone53.8241.html'
COPIES = ['iphone.html', 'index.html', 'ios/Minest/Minest/iphone.html', 'ios/MinestProject/MyApp/iphone.html', 'ios/Minest/Minest/iphone18.0.html']
s = SRC.read_text(encoding='utf-8')

if 'function flowComplete' not in s:
    with tempfile.TemporaryDirectory() as t:
        t = Path(t); orig, base, theirs, ours = t / 'orig.html', t / 'v3.html', t / 'teach.html', t / 'ours.html'
        orig.write_bytes(subprocess.run(['git', '-C', str(ROOT), 'show', '2743bc5:iphone.html'], check=True, capture_output=True).stdout)
        subprocess.run(['patch', '-s', '-o', str(base), str(orig), str(HERE / 'muse_v3.patch')], check=True)
        subprocess.run(['patch', '-s', '-o', str(theirs), str(base), str(HERE / 'teach_v1.patch')], check=True)
        ours.write_text(s, encoding='utf-8')
        m = subprocess.run(['git', 'merge-file', '-p', str(ours), str(base), str(theirs)], capture_output=True).stdout.decode('utf-8')
    m, n = re.subn(r'<<<<<<< [^\n]*\n(.*?)=======\n.*?>>>>>>> [^\n]*\n', r'\1', m, flags=re.S)   # both changed it: ours
    print('merged teaching v1 ·', n, 'overlap(s) kept as ours')
    s = m

SRC.write_text(s, encoding='utf-8')
for c in COPIES: shutil.copyfile(SRC, ROOT / c)
print('patched teaching v1')
