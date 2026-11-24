# 施陶巴赫瀑布 Pocket City：资料来源

用 Pocket City skill（April Zhu，PolyForm Noncommercial 1.0.0，仅限非商业用途）生成；skill 在 `.claude/skills/pocket-city/`。

- 地图数据：OpenStreetMap（© OpenStreetMap contributors，ODbL），2026-11-24 取回。地块中心 46.589569, 7.906634，250 m 见方，旋转 76°，使岩壁落在地块后缘。
- 落差 297 m、“瑞士最高的自由下落瀑布”、春季和初夏融雪时水势最盛、通往瀑布脚下的步道只在夏季开放：Lauterbrunnen Tourismus，https://lauterbrunnen.swiss/de/sommer/sehen-und-erleben/ausfluege/ausflugsziele/staubbach-wasserfall/
- 7 月降水最多（144 mm）、10 月最干（78 mm，9.5 天），1981–2010：Wikipedia 引 MeteoSwiss 气候常值，https://en.wikipedia.org/wiki/Lauterbrunnen#Climate
- 水在到达谷底前几乎散成水雾、干燥夏季水量减少、歌德 1779 年到访：https://en.wikipedia.org/wiki/Staubbach_Falls
- 岩壁与瀑布的样子：Wikimedia Commons 照片，https://commons.wikimedia.org/wiki/Category:Staubbachfall

示意（没有来源支撑，凭眼画）：建筑高度与木屋样式、林地每棵树的位置和树种、岩壁的起伏与岩色、岩壁只画到 80 m、各季水带宽窄、冬季积雪、行人车辆。

对 skill 的改动：`scripts/prep.py` 加了一处判断，宽水面完全落在地块外时不再因空几何崩溃。
