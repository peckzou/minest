# Per-list word card preview

Adds one “预览词卡” button beside each existing word-list Edit button in the
Teaching Sets panel and word-list manager. All original teacher, student,
Learn Chinese, editor and cloud-sync code remains unchanged.

The native preview dialog mirrors the existing Learn Chinese cards: picture or
emoji, tone-mark pinyin, Chinese front, English subtitle and click-to-speak.
It reads the selected group's current cards, can switch to another group,
and supports the pinyin visibility switch. Empty and archived groups are supported.

Metadata priority: saved card fields, saved teaching assets, existing template
read metadata, then local pinyin/English fallbacks. `english.json` is the existing
347-entry editor glossary copied for read-only use. No AI calls, store writes,
progress changes or changes to the saved Learn Chinese course are made.

Image URLs are restricted to image data, blob and HTTP(S) resources; broken
images fall back to an emoji. Text and group names are escaped before rendering.
A native dialog keeps the preview above an already-open word-list manager;
closing restores focus and the previous body overflow setting.

Build and embed:

    node tools/wordlist-preview/build.mjs
    python3 tools/wordlist-preview/update_pages.py

The embed script appends exactly one isolated style/script block to seven
current iPhone/iPad entry pages. Removing that block reproduces each page's
original bytes. Existing scripts, styles, data stores and the desktop pages
are not rewritten. Tools are build-time source; the runtime is embedded.

Validation: DOM-emulation checks cover every fixture group, switching, pinyin,
English fallback, speech callbacks, empty groups, archived words, image failure,
long text, markup escaping, nested modal lifecycle and focus return, with no
store writes. Scope checks compare all seven pages with the production baseline
and parse the built JavaScript and CSS. A local preview uses isolated sample data.
