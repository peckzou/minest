# Unified teacher interface

The teacher dashboard, word list library, editor, sync manager and activity
library use the existing Chinese teaching interface's Blooket visual language:
purple navigation, white cards, chunky buttons and Nunito/Titan One typography.
Desktop uses two word-list columns; mobile uses a single column.

`teacher-blooket.css` is scoped to teacher surfaces. `.mlv-teacher` is assigned
only by the teacher entry; student overlays and the 13 default game modes retain
their code. The independent Teaching Sets store and cloud sync logic are unchanged.

The dashboard groups vocabulary preparation, activity entry points and live
classroom configuration. Destructive and less common operations remain behind
native `details` controls, with existing confirmations and event hooks retained.
Search matches list names and words and waits for Chinese IME composition.

Canonical components:
- `tools/live-perf/teacher_library.js`
- `tools/live-perf/wordlist_manager.js`
- `tools/web31/minest-live.js` (teacher marker and title)

After changing these components or the shared stylesheet, run
`python3 tools/teacher-ui/update_pages.py`. It replaces only teacher-specific
regions in the nine current page entry points; it does not rebuild their other
features. Duo 69 retains its older data handlers and receives the shared look.

Validation: isolated sample-data tests cover create, search, edit/save, JSON panel
opening, archive/restore, ordering and closing. Nine pages pass JavaScript parsing
comparisons and an allowlisted diff check. Browser checks cover the dashboard,
library and editor at phone and desktop breakpoints. No cloud or production
teaching data is modified by validation.
