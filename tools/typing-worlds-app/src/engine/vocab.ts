/**
 * Vocabulary persistence adapter.
 *
 * Standalone build uses localStorage. Minest integration only needs to provide another
 * implementation of `VocabStore` (e.g. writing into the Minest word bank) — the stage
 * never assumes success just because an animation finished.
 */
import type { SaveOutcome } from './types';

export interface VocabEntry {
  word: string;
  world: string;
  createdAt: number;
}

export interface VocabStore {
  save(word: string, world: string): Promise<SaveOutcome>;
  list(): VocabEntry[];
  remove(word: string): void;
}

const KEY = 'tw.vocab.v1';

export class LocalVocabStore implements VocabStore {
  private inflight = new Map<string, Promise<SaveOutcome>>();
  /** testing hook: ?failSave=1 makes every save fail */
  failRate = Number(new URLSearchParams(location.search).get('failSave') ?? 0);

  list(): VocabEntry[] {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch {
      return [];
    }
  }

  remove(word: string) {
    const l = this.list().filter((e) => e.word.toLowerCase() !== word.toLowerCase());
    localStorage.setItem(KEY, JSON.stringify(l));
  }

  save(word: string, world: string): Promise<SaveOutcome> {
    const key = word.toLowerCase();
    // the same word submitted twice in a row shares one request
    const existing = this.inflight.get(key);
    if (existing) return existing.then((r) => (r.ok ? { ok: true, duplicate: true } : r));
    const p = new Promise<SaveOutcome>((resolve) => {
      // simulated network latency so the UI path matches a real backend
      setTimeout(() => {
        try {
          if (this.failRate && Math.random() < this.failRate) throw new Error('网络不可用');
          const l = this.list();
          if (l.some((e) => e.word.toLowerCase() === key)) return resolve({ ok: true, duplicate: true });
          l.unshift({ word, world, createdAt: Date.now() });
          localStorage.setItem(KEY, JSON.stringify(l.slice(0, 500)));
          resolve({ ok: true });
        } catch (e) {
          resolve({ ok: false, error: (e as Error).message || '保存失败' });
        }
      }, 220 + Math.random() * 180);
    });
    this.inflight.set(key, p);
    p.finally(() => this.inflight.delete(key));
    return p;
  }
}
