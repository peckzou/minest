/**
 * Typing Worlds · 词表 (Word List)
 *
 * 列出所有已收录的词汇（最新在前），支持逐个删除与一键复制（每行一个词）。
 */
import type { VocabStore } from '../engine/vocab';

export interface WordListCallbacks {
  onClose: () => void;
  onChange: () => void;
  toast: (msg: string) => void;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 非安全上下文 / 旧 WebView：退回到隐藏文本域 + execCommand
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

export class WordListModal {
  element: HTMLDivElement;
  private onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.callbacks.onClose();
  };

  constructor(private vocab: VocabStore, private callbacks: WordListCallbacks) {
    this.element = document.createElement('div');
    this.element.className = 'tw-gallery tw-wordlist';
    this.element.setAttribute('role', 'dialog');
    this.element.setAttribute('aria-label', '词表');
    this.render();
    window.addEventListener('keydown', this.onKey);
  }

  destroy() {
    window.removeEventListener('keydown', this.onKey);
    this.element.remove();
  }

  private render() {
    const list = this.vocab.list();
    this.element.innerHTML = `
      <div class="tw-gallery-head">
        <div><b>词表</b><span>已输入 ${list.length} 个词汇</span></div>
        <div class="tw-gallery-filters">
          <button type="button" class="tw-wl-copy" ${list.length ? '' : 'disabled'}>📋 复制全部</button>
          <button type="button" class="tw-gallery-close" aria-label="关闭词表">×</button>
        </div>
      </div>
      <ul class="tw-wl-list"></ul>
    `;
    const ul = this.element.querySelector('.tw-wl-list') as HTMLUListElement;
    if (!list.length) {
      const li = document.createElement('li');
      li.className = 'tw-wl-empty';
      li.textContent = '还没有词汇。输入一个单词并按 Enter，它就会出现在这里。';
      ul.appendChild(li);
    }
    for (const e of list) {
      const li = document.createElement('li');
      li.className = 'tw-wl-item';
      const w = document.createElement('span');
      w.className = 'tw-wl-word';
      w.textContent = e.word;
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'tw-wl-del';
      del.textContent = '×';
      del.setAttribute('aria-label', `删除 ${e.word}`);
      del.onclick = () => {
        this.vocab.remove(e.word);
        this.render();
        this.callbacks.onChange();
      };
      li.append(w, del);
      ul.appendChild(li);
    }
    (this.element.querySelector('.tw-gallery-close') as HTMLButtonElement).onclick = () => this.callbacks.onClose();
    (this.element.querySelector('.tw-wl-copy') as HTMLButtonElement).onclick = async () => {
      const ok = await copyText(this.vocab.list().map((e) => e.word).join('\n'));
      this.callbacks.toast(ok ? `已复制 ${list.length} 个词汇` : '复制失败，请长按词表手动选择');
    };
  }
}
