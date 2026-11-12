/**
 * Typing Worlds · 可视化世界画廊 (Gallery)
 *
 * 规格需求 (PART 5):
 * - 可视化选择器，卡片展示名称、循环预览、字母生成机制说明、启用按钮、主题材质设置
 * - 按系列组织 (10 个系列)
 * - 收藏常用世界与最近使用
 * - 切换世界时保留当前输入
 */
import { SERIES, WORLDS, type Prefs, savePrefs } from '../engine/registry';
import type { WorldDefinition } from '../engine/types';
import { drawPreview } from './preview';

export interface GalleryCallbacks {
  onSelectWorld: (id: string) => void;
  onClose: () => void;
}

export class GalleryModal {
  element: HTMLDivElement;
  private canvasList: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; world: WorldDefinition }[] = [];
  private raf = 0;
  private filter: 'all' | 'favorites' | 'recent' = 'all';

  constructor(
    private prefs: Prefs,
    private currentWorldId: string,
    private callbacks: GalleryCallbacks
  ) {
    this.element = document.createElement('div');
    this.element.className = 'tw-gallery';
    this.element.setAttribute('role', 'dialog');
    this.element.setAttribute('aria-label', 'Typing Worlds 选择器');
    this.render();
    this.startAnimation();
  }

  private startAnimation() {
    let start = performance.now();
    const tick = (now: number) => {
      this.raf = requestAnimationFrame(tick);
      const t = (now - start) / 1000;
      for (const item of this.canvasList) {
        drawPreview(item.ctx, item.canvas.width, item.canvas.height, item.world, t);
      }
    };
    this.raf = requestAnimationFrame(tick);
  }

  private stopAnimation() {
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  setFilter(filter: 'all' | 'favorites' | 'recent') {
    this.filter = filter;
    this.render();
  }

  toggleFavorite(id: string) {
    const idx = this.prefs.favorites.indexOf(id);
    if (idx >= 0) this.prefs.favorites.splice(idx, 1);
    else this.prefs.favorites.push(id);
    savePrefs(this.prefs);
    this.render();
  }

  render() {
    this.canvasList = [];
    this.element.innerHTML = '';

    // 1. 顶栏
    const head = document.createElement('header');
    head.className = 'tw-gallery-head';

    const titleGroup = document.createElement('div');
    titleGroup.innerHTML = `<b>Typing Worlds</b><span>Every Word Has a World · 每一个单词都有一个世界</span>`;
    head.appendChild(titleGroup);

    const filterGroup = document.createElement('div');
    filterGroup.className = 'tw-gallery-filters';

    const filters: { id: 'all' | 'favorites' | 'recent'; label: string }[] = [
      { id: 'all', label: '全部世界' },
      { id: 'favorites', label: `收藏 (${this.prefs.favorites.length})` },
      { id: 'recent', label: '最近使用' },
    ];

    for (const f of filters) {
      const btn = document.createElement('button');
      btn.className = this.filter === f.id ? 'is-on' : '';
      btn.textContent = f.label;
      btn.onclick = () => this.setFilter(f.id);
      filterGroup.appendChild(btn);
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'tw-gallery-close';
    closeBtn.textContent = '×';
    closeBtn.onclick = () => this.callbacks.onClose();
    filterGroup.appendChild(closeBtn);

    head.appendChild(filterGroup);
    this.element.appendChild(head);

    // 2. 内容列表
    const body = document.createElement('div');
    body.className = 'tw-gallery-body';

    let displayWorlds = WORLDS;
    if (this.filter === 'favorites') {
      displayWorlds = WORLDS.filter((w) => this.prefs.favorites.includes(w.id));
    } else if (this.filter === 'recent') {
      const recentIds = this.prefs.recent;
      displayWorlds = recentIds
        .map((id) => WORLDS.find((w) => w.id === id))
        .filter(Boolean) as WorldDefinition[];
    }

    if (displayWorlds.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'tw-gallery-empty';
      empty.textContent = this.filter === 'favorites' ? '暂无收藏的世界。可在卡片右上角点击星标收藏。' : '暂无最近使用的世界。';
      body.appendChild(empty);
    } else {
      for (const s of SERIES) {
        const seriesItems = displayWorlds.filter((w) => w.series === s.id);
        if (seriesItems.length === 0) continue;

        const section = document.createElement('section');
        const h3 = document.createElement('h3');
        h3.textContent = `${s.label} · ${s.en}`;
        section.appendChild(h3);

        const grid = document.createElement('div');
        grid.className = 'tw-gallery-grid';

        for (const world of seriesItems) {
          const card = this.createCard(world);
          grid.appendChild(card);
        }

        section.appendChild(grid);
        body.appendChild(section);
      }
    }

    this.element.appendChild(body);
  }

  private createCard(world: WorldDefinition): HTMLElement {
    const card = document.createElement('article');
    const isActive = world.id === this.currentWorldId;
    const isReady = world.status === 'ready';
    const isStarred = this.prefs.favorites.includes(world.id);

    card.className = `tw-card ${isActive ? 'is-active' : ''}`;

    // 预览区域
    const previewBox = document.createElement('div');
    previewBox.className = 'tw-card-preview';
    previewBox.style.background = world.poster;

    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      this.canvasList.push({ canvas, ctx, world });
    }
    previewBox.appendChild(canvas);

    // 收藏星标
    const starBtn = document.createElement('button');
    starBtn.className = 'tw-card-star';
    starBtn.textContent = isStarred ? '★' : '☆';
    starBtn.onclick = (e) => {
      e.stopPropagation();
      this.toggleFavorite(world.id);
    };
    previewBox.appendChild(starBtn);

    // 批次/就绪标签
    const badge = document.createElement('span');
    badge.className = `tw-card-badge ${isReady ? 'is-ready' : 'is-planned'}`;
    badge.textContent = isReady ? `Batch ${world.batch} · 就绪` : `Batch ${world.batch} · 规划中`;
    previewBox.appendChild(badge);

    card.appendChild(previewBox);

    // 详情区域
    const cardBody = document.createElement('div');
    cardBody.className = 'tw-card-body';

    const title = document.createElement('b');
    title.textContent = `${world.number < 10 ? '0' + world.number : world.number}. ${world.nameZh} (${world.name})`;
    cardBody.appendChild(title);

    const desc = document.createElement('p');
    desc.textContent = world.mechanism;
    cardBody.appendChild(desc);

    const actionBtn = document.createElement('button');
    actionBtn.className = 'tw-card-go';
    actionBtn.textContent = isActive ? '当前世界' : isReady ? '开启世界' : '暂未开放';
    actionBtn.disabled = !isReady && !isActive;
    actionBtn.onclick = () => {
      if (isReady || isActive) {
        this.callbacks.onSelectWorld(world.id);
      }
    };
    cardBody.appendChild(actionBtn);

    card.appendChild(cardBody);
    return card;
  }

  destroy() {
    this.stopAnimation();
    this.element.remove();
  }
}
