let start = Date(timeIntervalSince1970: 1000)
var p = CarFlashPlaylist(words: ["one", "two", "three"], listName: "QA", interval: 5, start: start, paused: false, pausedIndex: 0)
func expect(_ ok: Bool, _ label: String) { precondition(ok, label); print("PASS: \(label)") }
expect(p.word(at: start) == "one", "initial word")
expect(p.word(at: start.addingTimeInterval(5)) == "two", "automatic next word")
expect(p.word(at: start.addingTimeInterval(15)) == "one", "automatic wrap")
p.paused = true; p.pausedIndex = 2
expect(p.word(at: start.addingTimeInterval(100)) == "three", "paused timeline stays on current card")
p.paused = false; p.durations = [2, 7, 3]
expect(p.word(at: start.addingTimeInterval(2)) == "two", "reading duration boundary")
expect(p.nextChange(after: start.addingTimeInterval(3)) == start.addingTimeInterval(9), "widget next timeline date")
p.mode = "gpt"; p.position = 1; p.cardIds = ["a", "b", "c"]; p.starred = ["b"]; p.tags = ["", "pron", ""]
expect(p.word(at: start.addingTimeInterval(100)) == "two", "GPT card remains stable in background")
expect(p.cardId() == "b", "stable item ID")
expect(p.starredCard(), "widget favorite")
expect(p.tag() == "pron", "widget pronunciation tag")
expect(!p.isTimed, "manual GPT has no automatic timer")
p.auto = true
expect(p.isTimed, "GPT auto mode timer")
let saved = try JSONEncoder().encode(p)
expect(try JSONDecoder().decode(CarFlashPlaylist.self, from: saved) == p, "app to widget JSON roundtrip")
var legacy = try JSONSerialization.jsonObject(with: saved) as! [String:Any]
for key in ["mode","listId","cardIds","position","seq","events","durations","auto","shownAt","starred","tags"] { legacy.removeValue(forKey: key) }
let decoded = try JSONDecoder().decode(CarFlashPlaylist.self, from: JSONSerialization.data(withJSONObject: legacy))
expect(!decoded.isGPT && decoded.words.count == 3, "old saved playlist still loads")
