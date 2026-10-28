import json, os, re, csv

# Load all 143 specs
with open('/tmp/all_143_specs.json') as f:
    specs = json.load(f)

# Load existing 94 board for reference
with open('ec6_anchor_charts_94_board.json') as f:
    b94 = json.load(f)

# Map b94 cards
b94_map = {}
for col in b94.get('columns', []):
    for c in col.get('cards', []):
        cid = c['id'].replace('AC-', '')
        norm = re.sub(r'[^A-Z0-9]', '', cid)
        b94_map[norm] = c

# Map of zip files
zip_map = {}
import zipfile
zip_path = os.path.expanduser('~/Downloads/Texas_EC6_Random_Variety_143_Anchor_Charts_Seed777.zip')
with zipfile.ZipFile(zip_path, 'r') as z:
    for name in z.namelist():
        if name.endswith('.png'):
            base = os.path.splitext(os.path.basename(name))[0]
            sid = base.split('_')[0]
            zip_map[sid] = base

# Translation dictionary for the new 52 charts
NEW_ZH_TITLES = {
    'ELAR-19A': ('句子功能类型 (陈述/疑问/祈使/感叹)', '句子功能类型 · Sentence Types by Purpose'),
    'ELAR-19B': ('句子结构类型 (简单/并列/复合/并列复合)', '句子结构类型 · Sentence Structures by Clause Pattern'),
    'ELAR-24': ('斯卡伯勒阅读绳模型', '斯卡伯勒阅读绳模型 · Scarborough’s Reading Rope'),
    'ELAR-25': ('阅读教学五大核心支柱', '阅读教学五大核心支柱 · Five Essential Components of Reading'),
    'ELAR-26': ('阅读推论技巧 (先验知识+线索)', '阅读推论技巧 · Making Inferences'),
    'ELAR-27': ('阅读联结策略 (文本与自我/世界/其他文本)', '阅读联结策略 · Making Meaningful Connections'),
    'ELAR-28': ('精读教学规范 (三阶研读法)', '精读教学规范 · Close Reading Protocol'),
    'ELAR-29': ('说明文文本特征 (目录/标题/图表)', '说明文文本特征 · Informational Text Features'),
    'ELAR-30': ('词族与正字法拼写模式', '词族与正字法拼写模式 · Word Families & Spelling Patterns'),
    'ELAR-31': ('人物特质、情感与动机剖析', '人物特质与动机 · Character Traits, Feelings & Motivations'),
    'ELAR-32': ('对比双文本阅读分析法', '对比双文本阅读 · Compare and Contrast Paired Texts'),
    'ELAR-33': ('读写教学可视化图表工具箱', '读写可视化图表 · Literacy Graphic Organizers'),
    'ELAR-34': ('责任渐进释放教学模式 (GRR)', '责任渐进释放模式 · Gradual Release of Responsibility'),
    'ELAR-35': ('差异化读写分层教学指南', '差异化读写教学 · Differentiated Literacy Instruction'),
    'ELAR-36': ('词汇教学与弗雷耶模型 (Frayer Model)', '词汇教学与弗雷耶模型 · Vocabulary & Frayer Model'),
    'ELAR-37': ('写作六大特质评估框架 (6 Traits)', '写作六大特质 · Six Traits of Writing'),
    'ELAR-38': ('诗歌核心要素与体裁形式', '诗歌核心要素 · Poetry Elements and Forms'),
    'ELAR-39': ('写作修改符号与书写规范', '写作修改符号 · Editing Marks and Conventions'),
    'ELAR-40': ('多层级阅读评估与干预体系 (MTSS/RTI)', '阅读评估与干预 · Reading Assessment & Intervention'),
    'MATH-16': ('分数乘除法图解建模与算法', '分数乘除法建模 · Multiplying & Dividing Fractions'),
    'MATH-17': ('四则混合运算顺序 (同级运算规则 PEMDAS)', '运算顺序规则 · Order of Operations'),
    'MATH-18': ('应用题数学词汇与逻辑关系图谱', '应用题数学词汇 · Math Vocabulary in Word Problems'),
    'MATH-19': ('统计图表全景指南 (条形/折线/象形/点图)', '统计图表指南 · Data Displays and Graphs'),
    'MATH-20': ('钟表认读与经过时间计算法', '时间与经过时间 · Time and Elapsed Time'),
    'MATH-21': ('货币与个人财商启蒙 (储蓄/预算/信用)', '货币与财商启蒙 · Money & Financial Literacy'),
    'MATH-22': ('天平模型、等式与不等式求解', '等式与不等式 · Equations, Balance Scales & Inequalities'),
    'MATH-23': ('数字规律与输入输出函数表', '数字规律与函数表 · Numerical Patterns & Input-Output Tables'),
    'MATH-24': ('分数、小数与百分数等值互化基准表', '数之等值互化 · Fractions, Decimals & Percents Equivalence'),
    'MATH-25': ('小学与初中几何核心公式大全', '几何核心公式 · Geometry Formulas'),
    'MATH-26': ('小学高频数学易错点与视觉矫正', '高频易错点矫正 · Mathematical Misconceptions & Fixes'),
    'MATH-27': ('CRA 进阶教学框架 (具象-表征-抽象)', 'CRA 数学进阶框架 · Concrete–Representational–Abstract'),
    'MATH-28': ('波利亚数学四步解题法', '四步解题法 · Mathematical Problem-Solving Process'),
    'SCI-04A': ('被子植物完整生命周期 (种子-结实)', '植物生命周期 · Plant Life Cycle'),
    'SCI-04B': ('光合作用微观反应方程与能量转化', '光合作用反应 · Photosynthesis'),
    'SCI-16A': ('地球自转与公转对比 (昼夜交替 vs 四季)', '自转与公转 · Earth\'s Rotation and Revolution'),
    'SCI-16B': ('月相周期八大变化观察规律图', '月相周期变化 · Moon Phases'),
    'SCI-16C': ('地球地轴倾斜与四季成因解析', '四季成因解析 · Seasons and Axial Tilt'),
    'ART-06': ('四大基础艺术创作媒介 (素描/绘画/版画/雕塑)', '四大艺术创作媒介 · Drawing, Painting, Printmaking & Sculpture'),
    'ART-07': ('二维与三维艺术形态特征剖析', '二维与三维艺术 · 2D vs. 3D Art'),
    'ART-08': ('跨文化与不同历史时期的艺术风格赏析', '跨文化艺术风格 · Art Across Cultures & Historical Periods'),
    'MUS-07': ('音乐核心要素总览 (音高/节奏/音色/织体)', '音乐核心要素 · Musical Elements'),
    'MUS-08': ('童声合唱与歌唱发声技巧 (呼吸/共鸣)', '歌唱发声技巧 · Singing and Vocal Techniques'),
    'MUS-09': ('多元文化世界音乐与民间乐器探索', '多元文化音乐 · Music Across Cultures'),
    'HLT-06': ('生长发育与青春期身心健康指南', '生长发育与青春期 · Growth, Development and Puberty'),
    'HLT-07': ('传染病与慢性病预防及健康决策法', '疾病预防与决策 · Disease Prevention & Health Decisions'),
    'HLT-08': ('校园与户外意外伤害预防及应急急救', '伤害预防与急救 · Injury Prevention & Emergency Response'),
    'PE-06': ('运动热身、整理放松与运动安全守则', '热身放松与运动安全 · Warm-Up, Cool-Down & Safety'),
    'PE-07': ('动作概念分析框架 (空间/力量/关系)', '动作概念分析 · Movement Concepts'),
    'PE-08': ('终身体育与健康生活方式塑造', '终身体育与健康 · Physical Activity & Lifelong Fitness'),
    'THR-06': ('戏剧表演三要素 (台词/肢体/表情)', '戏剧表演三要素 · Voice, Movement & Facial Expression'),
    'THR-07': ('剧本研读与戏剧结构剖析 (对白/冲突)', '剧本研读与戏剧结构 · Script Reading & Play Structure'),
    'THR-08': ('剧场后台与幕后制作团队分工图谱', '剧场制作团队分工 · Theatre Production Roles')
}

# 9 target columns
COLUMN_DEFS = [
    ('col-ac-elar', '📚 英语语言艺术 · Language Arts', '01_ELAR_901', 'l-elar'),
    ('col-ac-mat', '🔢 数学思维模型 · Mathematics', '02_Math_902', 'l-mat'),
    ('col-ac-sci', '🔬 科学探究规律 · Science', '04_Science_904', 'l-sci'),
    ('col-ac-ss', '🗺️ 社会历史地理 · Social Studies', '03_Social_Studies_903', 'l-ss'),
    ('col-ac-art', '🎨 视觉艺术设计 · Visual Arts', 'ART', 'l-art'),
    ('col-ac-mus', '🎵 音乐乐理节奏 · Music', 'MUS', 'l-mus'),
    ('col-ac-hea', '🩺 健康生活安全 · Health', 'HLT', 'l-hea'),
    ('col-ac-pe', '🏃 体育运动技能 · Physical Education', 'PE', 'l-pe'),
    ('col-ac-the', '🎭 戏剧表演表达 · Theatre', 'THR', 'l-the'),
]

# Base CDN URL for static assets on Vercel
CDN_BASE = 'https://minest-app.vercel.app/anchor-charts'

# Build Minest Board
minest_columns = []
trello_lists = []
trello_cards = []
csv_rows = []

for col_id, col_title, matcher, label_id in COLUMN_DEFS:
    # Filter specs for this column
    col_specs = []
    for s in specs:
        grp = s.get('subjectGroup', '')
        sid = s.get('id', '')
        if matcher.startswith('0'):
            if grp == matcher:
                col_specs.append(s)
        else:
            if sid.startswith(matcher):
                col_specs.append(s)
    
    trello_list_id = f'list-{col_id.replace("col-ac-", "")}'
    trello_lists.append({
        'id': trello_list_id,
        'name': f'{col_title} ({len(col_specs)})',
        'closed': False,
        'pos': len(trello_lists) * 1000 + 1000
    })

    card_list = []
    for s in col_specs:
        sid = s.get('id', '')
        base_name = zip_map.get(sid, sid)
        thumb_url = f'{CDN_BASE}/thumbs/{base_name}.webp'
        full_url = f'{CDN_BASE}/full/{base_name}.webp'
        
        # Match Chinese title
        norm = re.sub(r'[^A-Z0-9]', '', sid)
        b94_match = None
        candidates = [norm]
        m = re.match(r'([A-Z]+)(\d+)([A-Z]*)', norm)
        if m:
            pfx, num, suf = m.groups()
            candidates.extend([f'{pfx}{int(num):03d}{suf}', f'{pfx}{int(num):02d}{suf}'])
            if pfx == 'MATH': candidates.append(f'MAT{int(num):03d}{suf}')
            if pfx == 'HLT': candidates.append(f'HEA{int(num):03d}{suf}')
            if pfx == 'THR': candidates.append(f'THE{int(num):03d}{suf}')
        for cand in candidates:
            if cand in b94_map:
                b94_match = b94_map[cand]
                break

        if sid in NEW_ZH_TITLES:
            title_zh, title_bi = NEW_ZH_TITLES[sid]
        elif b94_match:
            title_zh = b94_match.get('titleZh', s.get('title', ''))
            title_bi = b94_match.get('titleBilingual', f"{title_zh} · {s.get('title', '')}")
        else:
            title_zh = s.get('title', '')
            title_bi = f"{title_zh} · {s.get('title', '')}"

        # Markdown Description
        desc_lines = [
            f"[![{s.get('title')}]({thumb_url})]({full_url})",
            "",
            f"🔍 **[点击全屏查看 1800×2400 高清原图 / Open High-Res Poster]({full_url})**",
            "",
            "---",
            "",
            f"### 🎯 学习目标 / Learning Objective",
            f"{s.get('learningObjective', 'Master core concept and visual anchor.')}",
            "",
            f"### 💡 核心考点概念 / Essential Concepts"
        ]

        # Concepts
        concepts = s.get('essentialConcepts', [])
        checklist_items = []
        for i, c in enumerate(concepts, 1):
            if isinstance(c, dict):
                term = c.get('term', '')
                detail = c.get('detail', '')
                desc_lines.append(f"- **{term}**: {detail}")
                checklist_items.append({
                    'id': f'chk-{i}',
                    'text': f"{term}: {detail[:60]}...",
                    'done': False
                })
            elif isinstance(c, str):
                desc_lines.append(f"- {c}")
                checklist_items.append({
                    'id': f'chk-{i}',
                    'text': c[:80],
                    'done': False
                })

        # Misconception
        misc = s.get('misconceptionAlert')
        if misc and isinstance(misc, dict):
            desc_lines.extend([
                "",
                "### ⚠️ 易错点与概念纠偏 / Misconception Alert",
                f"- **常见误区**: {misc.get('wrong', '')}",
                f"- **正确理解**: {misc.get('fix', '')}"
            ])

        # Teacher check
        tchk = s.get('teacherCheck')
        if tchk and isinstance(tchk, dict):
            desc_lines.extend([
                "",
                "### 👩‍🏫 课堂提问与检验 / Teacher Check",
                f"- **提问**: {tchk.get('question', '')}",
                f"- **要点**: {tchk.get('answer', '')}"
            ])

        desc_text = "\n".join(desc_lines)
        
        # Labels
        tier = s.get('tier', 'P0')
        tier_label = 'l-p0' if tier == 'P0' else 'l-p1'
        card_labels = [label_id, tier_label]

        # Minest Card Object
        minest_card = {
            'id': f'AC-{sid}',
            'title': s.get('title', ''),
            'titleZh': title_zh,
            'titleBilingual': title_bi,
            'term': title_bi,
            'meaning': s.get('learningObjective', '')[:120],
            'desc': desc_text,
            'cover': {
                'type': 'image',
                'value': thumb_url,
                'originalUrl': full_url,
                'size': 'banner'
            },
            'labels': card_labels,
            'complete': False,
            'mastery': 0,
            'checklistItems': checklist_items
        }
        card_list.append(minest_card)

        # Trello Card Object
        trello_card_id = f'card-{sid.lower()}'
        trello_cards.append({
            'id': trello_card_id,
            'idList': trello_list_id,
            'name': f"[{sid}] {title_zh} ({s.get('title')})",
            'desc': desc_text,
            'pos': len(trello_cards) * 1000 + 1000,
            'closed': False,
            'idLabels': [label_id.replace('l-', 'lbl-'), tier_label.replace('l-', 'lbl-')],
            'attachments': [
                {
                    'id': f'att-{sid.lower()}',
                    'name': f"{sid} High-Res Chart (1800x2400)",
                    'url': full_url,
                    'isUpload': False
                }
            ],
            'checklists': [
                {
                    'id': f'chk-list-{sid.lower()}',
                    'name': 'Core Concept Mastery Checklist',
                    'checkItems': [
                        {'id': f'{trello_card_id}-c{idx}', 'name': ci['text'], 'state': 'incomplete'}
                        for idx, ci in enumerate(checklist_items, 1)
                    ]
                }
            ] if checklist_items else []
        })

        # CSV row
        csv_rows.append([
            f"[{sid}] {title_zh} ({s.get('title')})",
            f'{col_title} ({len(col_specs)})',
            desc_text.replace('\n', ' | '),
            f"{label_id.replace('l-', '').upper()}, {tier}",
            full_url
        ])

    minest_columns.append({
        'id': col_id,
        'title': f'{col_title} ({len(col_specs)})',
        'color': '#7b2ff7',
        'cards': card_list
    })

# 1. Output Minest Board JSON
minest_board = {
    'format': 'minest.board/1',
    'id': 'board-ec6-anchor-charts-143',
    'title': 'Texas EC-6 Anchor Charts (143 核心课堂锚定图)',
    'deadline': '2026-12-31',
    'background': '#0f172a',
    'showLabelNames': True,
    'labelDefinitions': [
        { 'id': 'l-elar', 'name': 'ELAR 语言艺术', 'color': 'purple' },
        { 'id': 'l-mat', 'name': 'Math 数学思维', 'color': 'blue' },
        { 'id': 'l-sci', 'name': 'Science 科学探究', 'color': 'green' },
        { 'id': 'l-ss', 'name': 'Social Studies 历史地理', 'color': 'amber' },
        { 'id': 'l-art', 'name': 'Visual Arts 视觉艺术', 'color': 'pink' },
        { 'id': 'l-mus', 'name': 'Music 音乐乐理', 'color': 'cyan' },
        { 'id': 'l-hea', 'name': 'Health 健康安全', 'color': 'red' },
        { 'id': 'l-pe', 'name': 'PE 体育体适能', 'color': 'emerald' },
        { 'id': 'l-the', 'name': 'Theatre 戏剧表演', 'color': 'indigo' },
        { 'id': 'l-p0', 'name': 'P0 高频核心', 'color': 'rose' },
        { 'id': 'l-p1', 'name': 'P1 进阶强化', 'color': 'sky' }
    ],
    'columns': minest_columns,
    'metadata': {
        'totalCards': 143,
        'version': '2.0.0',
        'seed': 777,
        'source': 'Texas Educator Certification EC-6 Comprehensive Anchor Chart Studio'
    }
}

with open('ec6_anchor_charts_143_board.json', 'w', encoding='utf-8') as f:
    json.dump(minest_board, f, ensure_ascii=False, indent=2)

print('Successfully created ec6_anchor_charts_143_board.json (Minest format)!')

# 2. Output Trello Board JSON
trello_board = {
    'name': 'Texas EC-6 Anchor Charts (143 核心课堂锚定图)',
    'desc': 'Texas Educator Certification (EC-6) Complete 143 Visual Anchor Charts Collection with Science of Reading, Math Models, TEKS Standards, and Classroom Pedagogy.\n\nHosted on Minest High-Speed CDN.',
    'closed': False,
    'lists': trello_lists,
    'labels': [
        { 'id': 'lbl-elar', 'name': 'ELAR 语言艺术', 'color': 'purple' },
        { 'id': 'lbl-mat', 'name': 'Math 数学思维', 'color': 'blue' },
        { 'id': 'lbl-sci', 'name': 'Science 科学探究', 'color': 'green' },
        { 'id': 'lbl-ss', 'name': 'Social Studies 历史地理', 'color': 'yellow' },
        { 'id': 'lbl-art', 'name': 'Visual Arts 视觉艺术', 'color': 'pink' },
        { 'id': 'lbl-mus', 'name': 'Music 音乐乐理', 'color': 'sky' },
        { 'id': 'lbl-hea', 'name': 'Health 健康安全', 'color': 'red' },
        { 'id': 'lbl-pe', 'name': 'PE 体育技能', 'color': 'lime' },
        { 'id': 'lbl-the', 'name': 'Theatre 戏剧表演', 'color': 'black' },
        { 'id': 'lbl-p0', 'name': 'P0 高频核心', 'color': 'red' },
        { 'id': 'lbl-p1', 'name': 'P1 进阶强化', 'color': 'blue' }
    ],
    'cards': trello_cards
}

with open('trello_ec6_anchor_charts_143.json', 'w', encoding='utf-8') as f:
    json.dump(trello_board, f, ensure_ascii=False, indent=2)

print('Successfully created trello_ec6_anchor_charts_143.json (Trello format)!')

# 3. Output Trello CSV
with open('trello_ec6_anchor_charts_143.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['Card Name', 'List Name', 'Card Description', 'Labels', 'Attachment URL'])
    writer.writerows(csv_rows)

print('Successfully created trello_ec6_anchor_charts_143.csv (CSV format)!')
