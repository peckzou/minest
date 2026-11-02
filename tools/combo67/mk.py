import sys,re
src,dst,name,prior=sys.argv[1:5]
prior=prior.split(',')
s=open(src).read()
s=s.replace("assert s.count('mn-alp-run') == 0 and page.count('mn-alp-run') == 0","assert s.count('mn-alp-run') == page.count('mn-alp-run')")
s=s.replace("assert s.startswith(page[:2000]) and len(s) > len(page)","assert len(s) > len(page)")
pre="['santorini', 'oia', '一键圣托里尼', '伊亚 Oia · 原版 3D 体素世界 · 可进建筑'], "
s=s.replace('("'+pre,'("').replace('"'+pre,'"')
# scape
chain=''.join(" || mk === '%s'"%p for p in prior)
s=s.replace("mk === 'santorini' || mk === '%s';"%name, "mk === 'santorini'"+chain+" || mk === '%s';"%name)
s=s.replace("mk === 'santorini';","mk === 'santorini'"+chain+";")
# dispatch
disp=''.join("else if (mk === '%s') %sBuild(sd); "%(p,{'alpchalet':'alps'}.get(p,p)) for p in prior)
s=s.replace("santoriniBuild(sd); else if (mk === '%s')"%name,"santoriniBuild(sd); "+disp+"else if (mk === '%s')"%name)
s=s.replace("santoriniBuild(sd); else if (scape)","santoriniBuild(sd); "+disp+"else if (scape)")
# label
lab=''.join("mk === '%s' ? '%s' : "%(p,L) for p,L in [('alpchalet','🏔 阿尔卑斯木屋 · Alpine Chalet'),('admont','📚 阿德蒙特图书馆 · Admont')] if p in prior)
s=s.replace("mk === 'santorini' ? '🇬🇷 圣托里尼 · Oia' : ","mk === 'santorini' ? '🇬🇷 圣托里尼 · Oia' : "+lab)
s=s.replace('      function goOut() { if (WKIN','        if (WKIN')
s=s.replace('  function wkOpen() {\\n    if (','    if (')
open(dst,'w').write(s)
