  /* 2026-11-26 · watch checklist sync (patch_board_sync.py): a checklist tick or a new checklist item on the watch
     changes the card here, so it is saved and synced like any edit. Before, the phone ignored both. */
  (0, _.useEffect)(function() {
    var onNative = function(e) {
      var d = (e && e.detail) || {}, p = d.payload || {}, ev = d.event;
      if ((ev !== 'checklistToggled' && ev !== 'checklistItemAdded') || !p.cardId) return;
      setBoards(function(prev) {
        var hit = false;
        var next = prev.map(function(board) {
          var touched = false;
          var cols = (board.columns || []).map(function(col) {
            var cards = (col.cards || []).map(function(card) {
              if (!card || card.id !== p.cardId) return card;
              var items = Array.isArray(card.checklistItems) ? card.checklistItems : [];
              if (ev === 'checklistItemAdded') {
                if (!p.text || items.some(function(it) { return it && it.id === p.id; })) return card;
                touched = true;
                return Object.assign({}, card, { checklistItems: items.concat([{ id: p.id || ('chk-' + Date.now()), text: String(p.text), done: false }]) });
              }
              var at = items.findIndex(function(it) { return it && (it.id === p.id || (it.text || it.title) === p.id); });
              if (at < 0) return card;
              var done = typeof p.isDone === 'boolean' ? p.isDone : !items[at].done;
              if (!!items[at].done === done) return card;
              touched = true;
              var nextItems = items.slice(); nextItems[at] = Object.assign({}, items[at], { done: done });
              var patch = { checklistItems: nextItems };
              /* as on the watch: every item ticked marks the card done */
              if (done && nextItems.every(function(it) { return it && it.done; })) patch.complete = true;
              return Object.assign({}, card, patch);
            });
            return touched ? Object.assign({}, col, { cards: cards }) : col;
          });
          if (touched) hit = true;
          return touched ? Object.assign({}, board, { columns: cols }) : board;
        });
        return hit ? next : prev;
      });
    };
    window.addEventListener('minestNativeEvent', onNative);
    return function() { window.removeEventListener('minestNativeEvent', onNative); };
  }, []);
