# Per-list word card preview

Adds a “词卡预览页” entry in the teacher home vocabulary toolbar and a per-list
“预览词卡” button beside the existing Edit buttons. Both open the same list page
and share the current Teaching Sets store. Original teacher/student launchers,
Learn Chinese, editor and cloud-sync code remain unchanged.

The native preview dialog mirrors the existing Learn Chinese cards: picture or
emoji, tone-mark pinyin, Chinese front, English subtitle and click-to-speak.
It reads the selected group's current cards, can switch to another group,
and supports the pinyin visibility switch. Empty and archived groups are supported.

Metadata priority: saved card fields, saved teaching assets, existing template
read metadata, then local pinyin/English fallbacks. `english.json` is the existing
347-entry editor glossary copied for read-only use. Browsing and speaking make no AI calls, store writes or progress changes, and
never replace the saved Learn Chinese course. Explicit toolbar actions delegate
to the existing teacher APIs: Teaching, Solo, editing, assignment and export.

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

## Integrated teaching actions

Teaching calls `MinestTeachingSets.open` with the current board and selected list;
Solo calls `MinestTeachingSets.arcade` with that same ID. Assignment calls
`MinestVocab3D.assign` with the selected list preselected, and export uses
`MinestTeachingExport.download`. Management uses the existing word-list manager.

Before switching into an activity the native preview and any parent library
dialog are closed, keeping the destination visible. Editor cancellation/save and
assignment closure return to the selected preview unless the editor itself
launched a teaching activity. Saved edits are read afresh and the teacher home
refreshes through its existing entry point on return. No duplicate vocabulary
store or game launcher is introduced.

Integration checks cover selected-list Teaching/Solo/export/assignment routing,
editor save/cancel return, refreshed title/count data, the home shortcut, empty
list guards, archived assignment guards and nested dialog handoffs.
