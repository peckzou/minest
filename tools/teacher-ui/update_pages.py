"""Re-embed teacher components and shared styles without reassembling the app."""
from pathlib import Path
import re
ROOT = Path(__file__).resolve().parents[2]
PAGES = ['iphone.html', 'index.html', 'ipad.html', 'iPhone53.8241.html', 'iPhoneDuo.html', 'iPhoneDuo69.html', 'iPhoneDuo70.html', 'web31.0.html', 'web31.1.html']
css = (ROOT/'tools/teacher-ui/teacher-blooket.css').read_text()
teacher = (ROOT/'tools/live-perf/teacher_library.js').read_text()
teacher = teacher[teacher.index('function teacher(body)'):].strip()
manager = (ROOT/'tools/live-perf/wordlist_manager.js').read_text().strip()
for name in PAGES:
    page = ROOT/name
    html = page.read_text()
    if name not in ['iPhoneDuo69.html', 'web31.0.html', 'web31.1.html']:
        start = html.index('function teacher(body)')
        end = html.index('window.MinestTeachingSets=', start)
        html = html[:start]+teacher+'\n\n'+html[end:]
    pattern = r'(<script\b[^>]*id="minest-wordlist-manager-v1"[^>]*>)([\s\S]*?)(</script>)'
    html = re.sub(pattern, lambda m:m[0] if m[2].strip()==manager else m[1]+'\n'+manager+'\n'+m[3], html)
    marker = r'<style id="minest-teacher-blooket-ui">[\s\S]*?</style>\n?'
    html = re.sub(marker, '', html)
    assert html.count('</body>') == 1, name
    html = html.replace('</body>', '<style id="minest-teacher-blooket-ui">\n'+css+'\n</style>\n</body>')
    base = "var o = overlay('Minest Live · Teacher');"
    decorated = base+" o.el.classList.add('mlv-teacher'); o.el.querySelector('.mlv-brand span').textContent='教师工作台';"
    if decorated not in html:
        assert html.count(base) == 1, name
        html = html.replace(base, decorated)
    html = html.replace('保存并 Teaching →', '保存并上课 →').replace('▦ Teaching 活动', '▦ 课堂活动')
    page.write_text(html)
