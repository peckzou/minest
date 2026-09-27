/**
 * Minest Native Bridge Client (JS ↔ Swift)
 * Communicates with WKWebView window.webkit.messageHandlers.minestBridge (or focusboardBridge)
 */
(function() {
  var getBridgeHandler = function() {
    if (typeof window === 'undefined' || !window.webkit || !window.webkit.messageHandlers) return null;
    return window.webkit.messageHandlers.minestBridge || window.webkit.messageHandlers.focusboardBridge || null;
  };

  var MinestNative = {
    /**
     * Checks if running inside the Minest iOS Native Wrapper
     */
    isNative: function() {
      return !!getBridgeHandler() || !!window.__isMinestNative || !!window.__isFocusboardNative;
    },

    /**
     * Sends action payload to Swift WKScriptMessageHandler
     */
    send: function(action, payload) {
      var handler = getBridgeHandler();
      if (handler) {
        try {
          var msg = Object.assign({ action: action }, payload || {});
          handler.postMessage(msg);
        } catch (err) {
          console.warn('[MinestNative] postMessage failed:', err);
        }
      } else {
        // Fallback / log for regular browser
        // console.log('[MinestNative (Web Simulated)]', action, payload);
      }
    },

    /**
     * Start a Study Session on Dynamic Island / Live Activity
     * @param {Object} options
     * @param {string} options.boardTitle e.g. "English / EC-6 Engine"
     * @param {number} options.totalCards e.g. 20
     * @param {number} options.completedCards e.g. 0
     * @param {number} options.remainingMinutes e.g. 15
     * @param {string} options.currentCardTitle e.g. "Connected Text"
     */
    startStudy: function(options) {
      options = options || {};
      this.send('studyStarted', {
        boardTitle: options.boardTitle || 'Active Recall Drill',
        totalCards: typeof options.totalCards === 'number' ? options.totalCards : 20,
        completedCards: typeof options.completedCards === 'number' ? options.completedCards : 0,
        remainingMinutes: typeof options.remainingMinutes === 'number' ? options.remainingMinutes : 15,
        currentCardTitle: options.currentCardTitle || ''
      });
    },

    /**
     * Update Live Progress to Dynamic Island
     * @param {number} completedCards e.g. 7
     * @param {number} totalCards e.g. 20
     * @param {number} remainingMinutes e.g. 12
     * @param {string} currentCardTitle e.g. "Syntax & Grammar Scaffolds"
     */
    updateProgress: function(completedCards, totalCards, remainingMinutes, currentCardTitle) {
      this.send('progressUpdated', {
        completedCards: completedCards,
        totalCards: totalCards,
        remainingMinutes: remainingMinutes,
        currentCardTitle: currentCardTitle || ''
      });
    },

    /**
     * Finish or close the Live Activity
     */
    endStudy: function() {
      this.send('studyFinished', {});
    },

    /**
     * Trigger native iOS Taptic Engine feedback
     * @param {'light'|'medium'|'heavy'|'selection'|'success'} style
     */
    haptic: function(style) {
      this.send('triggerHaptic', { style: style || 'light' });
    }
  };

  // Mount to global window
  window.MinestNative = MinestNative;
  window.FocusboardNative = MinestNative; // backward compatibility alias
})();
