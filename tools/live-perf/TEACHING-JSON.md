# Teaching 词表 JSON 导入格式

入口：词表编辑界面 → `{ } JSON 导入`。粘贴 JSON 或选择 `.json` 文件 → 「导入为新词表」。
「📋 复制格式说明」会复制一段给 agent 的提示词（内容与本文件一致）。代码：`tools/live-perf/teach_json.js`
（`window.MinestTeachingJSON.importText(text)`）。

## 结构

```json
{
  "title": "水果 Fruits",
  "words": [
    {
      "word": "苹果",
      "pinyin": "píng guǒ",
      "en": "apple",
      "meaning": "背面释义，可省略（默认用 en；都没有时背面显示拼音）",
      "image": "https://upload.wikimedia.org/…/apple.jpg",
      "category": "水果",
      "hint": "红红的，圆圆的。",
      "related": ["香蕉"],
      "sentence": "我每天吃一个苹果。",
      "sentenceEn": "I eat an apple every day.",
      "parts": ["苹", "果"],
      "annotations": [{ "label": "果柄", "x": 0.5, "y": 0.1 }, { "label": "果皮", "x": 0.3, "y": 0.6 }]
    }
  ],
  "orders":      [{ "title": "从小到大", "words": ["苹果", "香蕉", "西瓜"] }],
  "comparisons": [{ "title": "苹果和香蕉", "concepts": ["苹果", "香蕉"],
                    "attributes": [{ "text": "红色", "members": ["苹果"] }, { "text": "是水果", "members": ["苹果", "香蕉"] }] }],
  "relations":   [{ "from": "种子", "to": "苹果", "type": "leads-to", "explanation": "种子长成果树，结出苹果。" }],
  "timelines":   [{ "title": "生长顺序", "events": [{ "word": "种子", "date": 1 }, { "word": "苹果", "date": 2 }] }],
  "matrices":    [{ "title": "颜色 × 类别", "rows": ["红色", "黄色"], "columns": ["水果", "蔬菜"],
                    "placements": [{ "word": "苹果", "row": 0, "column": 0 }, { "word": "香蕉", "row": 1, "column": 0 }] }],
  "questions":   [{ "word": "香蕉", "statement": "香蕉是蓝色的。", "incorrect": "蓝色", "correction": "黄色", "explanation": "成熟的香蕉是黄色的。" }]
}
```

一次导入多个词表：`{ "lists": [ {…}, {…} ] }` 或直接一个数组。

## 规则（不符合的条目会被跳过并计数，不会让整个导入失败）

| 字段 | 要求 | 点亮的游戏 |
|---|---|---|
| `word` | 必填，1–120 字，同一词表内不重复 | 全部基础游戏 |
| `en` / `meaning` | 与 word 不同 | 配对、真假、Bingo（≥4 个）、拼写类（英文 3–14 个字母） |
| `image` | `http(s)://` 或 `data:image/…` 图片网址；图里不要写出这个词 | 图词配对、翻牌记忆、躲猫猫猜图 |
| `category` | 至少 2 个分类，其中一类 ≥3 个词 | 归类、找不同 |
| `sentence` | 包含 word 且只出现一次 | 句子填空、连词成句、Missing Word |
| `annotations` | 有 `image` 时才保存；x、y 在 0–1，≥2 个、标签不同、相隔 ≥0.13 | Label the Diagram、Picture Recall |
| `parts` | 连起来等于 word，2–8 段 | Word Families |
| `orders` | 每组 2–40 个不同的词 | Build the Sequence |
| `comparisons` | 2–3 个 concepts，≥2 个 attributes，members 是 concepts 的子集 | Compare |
| `relations` | from ≠ to；type 为 causes / leads-to 时也点亮因果 | Concept Map、Cause & Effect |
| `timelines` | ≥2 个不同的词，date 为数字 | Timeline |
| `matrices` | 2–4 行、2–4 列，≥2 个不同词的 placement | Matrix |
| `questions` | incorrect 在 statement 中只出现一次，correction 与之不同 | Error Detective |

所有引用都写词语原文（不区分大小写），不用写 id。
