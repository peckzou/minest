/**
 * Text Input Engine — the single source of truth.
 *
 * Binds to a real <input> so every native editing behaviour keeps working:
 * caret movement, selection, paste, cut, undo/redo, autocorrect and IME composition.
 * After each change we diff old → new text and emit precise insert/delete events
 * with stable letter ids. Visual worlds can never block or lose input: the DOM
 * value is updated by the browser before we even look at it.
 */
import type { LetterRef } from './types';

export interface TextChange {
  deletes: LetterRef[];
  inserts: LetterRef[];
  /** text after the change */
  text: string;
}

type Listener<T> = (v: T) => void;

let nextId = 1;

export class TextInputEngine {
  private letters: LetterRef[] = [];
  private composing = false;
  private changeListeners: Listener<TextChange>[] = [];
  private submitListeners: Listener<string>[] = [];
  readonly maxLength: number;

  constructor(public el: HTMLInputElement, opts: { maxLength?: number } = {}) {
    this.maxLength = opts.maxLength ?? 40;
    el.maxLength = this.maxLength;
    el.autocomplete = 'off';
    el.spellcheck = false;
    el.setAttribute('autocapitalize', 'off');
    el.setAttribute('autocorrect', 'off');
    el.setAttribute('enterkeyhint', 'done');

    el.addEventListener('compositionstart', () => (this.composing = true));
    el.addEventListener('compositionend', () => {
      this.composing = false;
      this.sync();
    });
    el.addEventListener('input', (e) => {
      if (this.composing || (e as InputEvent).isComposing) return;
      this.sync();
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) {
        e.preventDefault();
        this.submit();
      }
    });
  }

  get text() {
    return this.letters.map((l) => l.char).join('');
  }

  get refs(): readonly LetterRef[] {
    return this.letters;
  }

  onChange(fn: Listener<TextChange>) {
    this.changeListeners.push(fn);
  }

  onSubmit(fn: Listener<string>) {
    this.submitListeners.push(fn);
  }

  submit() {
    this.sync();
    const t = this.text;
    this.submitListeners.forEach((f) => f(t));
  }

  /** programmatic replace (restore after failed save, clear after Enter) */
  setText(value: string, opts: { silent?: boolean } = {}) {
    value = value.slice(0, this.maxLength);
    this.el.value = value;
    if (opts.silent) {
      this.letters = [...value].map((char, index) => ({ id: nextId++, char, index }));
      return;
    }
    this.sync();
  }

  /** Detach the current letters (Enter): returns them and resets the model without emitting deletes. */
  takeAll(): LetterRef[] {
    const out = this.letters;
    this.letters = [];
    this.el.value = '';
    return out;
  }

  focus() {
    try {
      this.el.focus({ preventScroll: true });
    } catch {
      /* noop */
    }
  }

  /** Diff DOM value against the model. */
  sync() {
    const next = [...this.el.value];
    const prev = this.letters;
    let start = 0;
    while (start < prev.length && start < next.length && prev[start].char === next[start]) start++;
    let endPrev = prev.length;
    let endNext = next.length;
    while (endPrev > start && endNext > start && prev[endPrev - 1].char === next[endNext - 1]) {
      endPrev--;
      endNext--;
    }
    // Inside runs of identical characters ("ll") the diff is ambiguous; use the caret so the
    // visual insert/delete happens exactly where the user typed.
    const caret = this.el.selectionStart ?? endNext;
    if (endPrev === start && endNext > start) {
      while (endNext > caret && start > 0 && next[start - 1] === next[endNext - 1]) start--, endNext--, endPrev--;
      while (endNext < caret && endNext < next.length && next[start] === next[endNext]) start++, endNext++, endPrev++;
    } else if (endNext === start && endPrev > start) {
      while (start > caret && start > 0 && prev[start - 1].char === prev[endPrev - 1].char) start--, endNext--, endPrev--;
    }
    if (start === endPrev && start === endNext) return;
    const deletes = prev.slice(start, endPrev).map((l) => ({ ...l }));
    const inserts: LetterRef[] = next.slice(start, endNext).map((char, k) => ({ id: nextId++, char, index: start + k }));
    this.letters = [...prev.slice(0, start), ...inserts, ...prev.slice(endPrev)];
    this.letters.forEach((l, i) => (l.index = i));
    const change: TextChange = { deletes, inserts, text: this.text };
    this.changeListeners.forEach((f) => f(change));
  }
}
