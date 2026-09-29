import React, { useState, useMemo } from 'react';
import { BadgeModel, BadgeRarity } from '../types/badge';
import { BadgePreview } from './BadgePreview';
import { triggerHaptic } from '../utils/haptics';
import { spatialAudio } from '../utils/spatialAudio';
import { getRarityColor } from '../utils/rarity';

interface BadgeWallProps {
  awards: BadgeModel[];
  onSelectAward: (award: BadgeModel) => void;
  onToggleUnlockAll?: () => void;
  challengeMode?: boolean;
  activeIndex?: number;
  onLockedSelect?: (slotNumber: number) => void;
  initialFilter?: 'all' | 'unlocked';
}

export const BadgeWall: React.FC<BadgeWallProps> = ({ awards, onSelectAward, onToggleUnlockAll, challengeMode = false, activeIndex = 0, onLockedSelect, initialFilter = 'all' }) => {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked' | 'mythic'>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredBadge, setHoveredBadge] = useState<{ badge: BadgeModel; index: number } | null>(null);

  // Guarantee exactly 150 slots (#001 to #150)
  const padded150Awards = useMemo(() => {
    const list: { badge: BadgeModel; slotNumber: number }[] = [];
    const targetCount = 150;

    for (let i = 0; i < targetCount; i++) {
      if (i < awards.length) {
        list.push({ badge: awards[i], slotNumber: i + 1 });
      } else {
        // Procedural fallback placeholder badge for slot i+1
        const fallbackStyle = (i % 2 === 0 ? 'challenge-hex' : 'circular-coin') as any;
        const fallbackBadge: BadgeModel = {
          id: `slot-pad-${i + 1}`,
          name: `Milestone Badge #${String(i + 1).padStart(3, '0')}`,
          category: 'Learning Milestones',
          rarity: (i % 10 === 0 ? 'Mythic' : i % 5 === 0 ? 'Legendary' : i % 3 === 0 ? 'Rare' : 'Common') as BadgeRarity,
          state: 'locked',
          colorTheme: {
            primary: '#00F0FF',
            bezel: 'silver',
          },
          description: `Unlock Milestone #${String(i + 1).padStart(3, '0')} by completing study streaks.`,
          longDescription: `Official Apple Study Award Slot #${String(i + 1).padStart(3, '0')}.`,
          badgeStyle: fallbackStyle,
          depthMetrics: {
            thickness: '2.4 mm',
            curvature: 'Convex Dome',
            layers: 5,
            enamelFinish: 'Vitreous Enamel & Silver Bezel',
          },
        };
        list.push({ badge: fallbackBadge, slotNumber: i + 1 });
      }
    }
    return list;
  }, [awards]);

  // Statistics
  const totalSlots = 150;
  const unlockedCount = useMemo(() => {
    return padded150Awards.filter((item) => item.badge.state === 'unlocked').length;
  }, [padded150Awards]);
  const progressPercent = Math.round((unlockedCount / (challengeMode ? Math.max(1, awards.length) : totalSlots)) * 100);

  // Filtered List
  const filteredSlots = useMemo(() => {
    return padded150Awards.filter(({ badge, slotNumber }) => {
      const slotStr = `#${String(slotNumber).padStart(3, '0')}`;
      const matchesSearch =
        searchQuery.trim() === '' ||
        (badge.state === 'unlocked' && badge.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        slotStr.includes(searchQuery) ||
        (!challengeMode && badge.id.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (filter === 'unlocked') return badge.state === 'unlocked';
      if (filter === 'locked') return badge.state !== 'unlocked';
      if (filter === 'mythic') return badge.state === 'unlocked' && (badge.rarity === 'Mythic' || badge.rarity === 'Legendary');
      return true;
    });
  }, [padded150Awards, filter, searchQuery, challengeMode]);

  const handleCardClick = (item: { badge: BadgeModel; slotNumber: number }) => {
    triggerHaptic('selection');
    spatialAudio.playClink('rotate_tick');
    if (challengeMode && item.badge.state !== 'unlocked') onLockedSelect?.(item.slotNumber);
    else onSelectAward(item.badge);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 pb-32 select-none transition-colors duration-300">
      {/* ========================================================================= */}
      {/* POKEMON GO STYLE COLLECTION HEADER BAR (SYSTEM LIGHT / DARK ADAPTIVE) */}
      {/* ========================================================================= */}
      <div className="relative rounded-3xl bg-white/80 dark:bg-[#121318]/90 backdrop-blur-3xl border border-slate-200/80 dark:border-white/[0.08] p-5 sm:p-7 shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden mb-6 transition-colors">
        {/* Background Subtle Gradient Ray */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#FA114F]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#00F0FF]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          {/* Title & Pokedex Progress */}
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[#FA114F]/10 dark:bg-[#FA114F]/20 text-[#FA114F] border border-[#FA114F]/30 text-sm font-extrabold">
                150
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-sans">
                {challengeMode ? 'BADGE CHALLENGE WALL' : 'BADGE COLLECTION WALL'}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#8E8E93] font-medium">
              {challengeMode ? `${awards.length} 枚真实勋章随机掉落与 Strike 里程碑 · ${totalSlots - awards.length} 个未来槽位 · 未领取前隐藏身份` : 'Pokémon GO style 150-slot collection • All initial badges in grey shadow mode'}
            </p>
          </div>

          {/* Unlocked Meter */}
          <div className="flex items-center gap-4 w-full md:w-auto bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 sm:px-5">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#8E8E93] tracking-wider">
                UNLOCKED
              </span>
              <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                {unlockedCount} <span className="text-slate-400 dark:text-[#8E8E93] text-sm font-normal">/ {challengeMode ? awards.length : totalSlots}</span>
              </span>
            </div>

            {/* Apple Ring Progress Bar */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-12 h-12 transform -rotate-90">
                <circle cx="24" cy="24" r="20" stroke="rgba(120,120,128,0.2)" strokeWidth="4" fill="none" />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="#FA114F"
                  strokeWidth="4"
                  strokeDasharray={2 * Math.PI * 20}
                  strokeDashoffset={2 * Math.PI * 20 * (1 - progressPercent / 100)}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <span className="absolute text-[10px] font-extrabold text-slate-900 dark:text-white">{progressPercent}%</span>
            </div>
          </div>
        </div>

        {/* Filter Pills & Search Bar */}
        <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6 pt-5 border-t border-slate-200/80 dark:border-white/[0.08]">
          {/* Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-md'
                  : 'bg-slate-200/60 dark:bg-white/5 text-slate-600 dark:text-[#8E8E93] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Slots (150)
            </button>
            <button
              onClick={() => setFilter('unlocked')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filter === 'unlocked'
                  ? 'bg-[#A6FF00] text-black shadow-md shadow-[#A6FF00]/20'
                  : 'bg-slate-200/60 dark:bg-white/5 text-slate-600 dark:text-[#8E8E93] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Unlocked ({unlockedCount})
            </button>
            <button
              onClick={() => setFilter('locked')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filter === 'locked'
                  ? 'bg-[#FA114F] text-white shadow-md shadow-[#FA114F]/20'
                  : 'bg-slate-200/60 dark:bg-white/5 text-slate-600 dark:text-[#8E8E93] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Shadow Mode ({totalSlots - unlockedCount})
            </button>
            {!challengeMode && <button
              onClick={() => setFilter('mythic')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filter === 'mythic'
                  ? 'bg-[#FFD60A] text-black shadow-md shadow-[#FFD60A]/20'
                  : 'bg-slate-200/60 dark:bg-white/5 text-slate-600 dark:text-[#8E8E93] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ✨ Mythic & Legendary
            </button>}

            {!challengeMode && onToggleUnlockAll && (
              <button
                onClick={onToggleUnlockAll}
                className="ml-auto px-3 py-1.5 rounded-xl text-xs font-bold bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/25 transition-all whitespace-nowrap active:scale-95"
                title="Toggle Unlock Simulation Mode"
              >
                ⚡ {unlockedCount === 0 ? 'Unlock All (点亮全部)' : 'Reset All Shadow (恢复暗影)'}
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={challengeMode ? '搜索槽位 #001–#150' : 'Search #001 - #150 or name...'}
              className="w-full bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#636366] focus:outline-none focus:border-[#FA114F] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#8E8E93] hover:text-slate-900 dark:hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* COMPACT 150-SLOT BADGE GRID (POKEMON GO STYLE - NO LOCKS, SYSTEM ADAPTIVE) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2 sm:gap-2.5">
        {filteredSlots.map((item) => {
          const { badge, slotNumber } = item;
          const isUnlocked = badge.state === 'unlocked';
          const rarityColor = getRarityColor(badge.rarity || 'Common');
          const slotTag = `#${String(slotNumber).padStart(3, '0')}`;
          const isFuture = challengeMode && slotNumber > awards.length;
          const isNext = challengeMode && activeIndex >= 0 && !isFuture && slotNumber === activeIndex + 1;

          return (
            <div
              key={badge.id}
              data-badge-id={badge.id}
              onClick={() => handleCardClick(item)}
              onMouseEnter={() => setHoveredBadge({ badge, index: slotNumber })}
              onMouseLeave={() => setHoveredBadge(null)}
              className={`group relative aspect-square rounded-2xl flex items-center justify-center p-1.5 cursor-pointer transition-all duration-300 transform active:scale-95 ${
                isUnlocked
                  ? 'bg-white dark:bg-[#181920]/90 border border-slate-200 dark:border-white/[0.12] hover:border-slate-300 dark:hover:border-white/40 hover:scale-105 shadow-md dark:shadow-[0_0_20px_rgba(255,255,255,0.15)]'
                  : isNext ? 'bg-[#18242a] border border-[#00cfe8]/50 shadow-[0_0_18px_rgba(0,207,232,0.12)]' : 'bg-slate-100/90 dark:bg-[#0E0F14]/80 border border-slate-200/80 dark:border-white/[0.04] hover:border-slate-300 dark:hover:border-white/20 hover:scale-102'
              }`}
            >
              {/* Slot Index Number (#001 - #150) */}
              <span
                className={`absolute top-1 left-1.5 text-[9px] font-mono font-bold tracking-tighter z-10 select-none ${
                  isUnlocked ? 'text-slate-500 dark:text-[#8E8E93]' : 'text-slate-400/60 dark:text-white/20'
                }`}
              >
                {slotTag}
              </span>

              {/* Rarity Indicator Dot for Unlocked Badges */}
              {isUnlocked && (
                <span
                  className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full z-10 shadow-sm"
                  style={{ backgroundColor: rarityColor }}
                  title={badge.rarity}
                />
              )}

              {/* UNLOCKED BADGE: Full Bright Vibrant 3D / SVG Graphics */}
              {isUnlocked ? (
                <div className="relative w-full h-full flex items-center justify-center p-1">
                  {/* Subtle Background Glow */}
                  <div
                    className="absolute inset-2 rounded-full opacity-20 group-hover:opacity-40 transition-opacity blur-md pointer-events-none"
                    style={{ backgroundColor: badge.colorTheme?.primary || '#FA114F' }}
                  />
                  <BadgePreview badge={badge} className="w-full h-full max-w-[68px] max-h-[68px] object-contain drop-shadow-lg" />
                </div>
              ) : challengeMode ? (
                <div className={`relative flex h-[66%] w-[66%] items-center justify-center ${isFuture ? 'opacity-25' : 'opacity-65'}`} aria-label={isFuture ? '即将推出' : '未解锁'}>
                  <div className="absolute inset-0 bg-gradient-to-br from-[#6b7280] via-[#292d36] to-[#0f1118] shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_5px_12px_rgba(0,0,0,0.4)]" style={{ clipPath: 'polygon(25% 4%,75% 4%,98% 50%,75% 96%,25% 96%,2% 50%)' }} />
                  <div className="absolute inset-[7%] bg-gradient-to-br from-[#313740] to-[#14171d]" style={{ clipPath: 'polygon(25% 4%,75% 4%,98% 50%,75% 96%,25% 96%,2% 50%)' }} />
                  <span className="relative z-10 text-lg font-light text-white/35">{isFuture ? '·' : '?'}</span>
                </div>
              ) : (
                /* LOCKED BADGE: NO LOCK ICON - Sleek Gray Shadow Silhouette (Pokémon GO Style) */
                <div className="relative w-full h-full flex items-center justify-center p-1 opacity-25 dark:opacity-30 grayscale brightness-50 contrast-125 group-hover:opacity-50 dark:group-hover:opacity-60 transition-all duration-300">
                  <BadgePreview badge={badge} className="w-full h-full max-w-[64px] max-h-[64px] object-contain filter drop-shadow-none" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Hover Tooltip Detail Box */}
      {hoveredBadge && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none px-4 py-2.5 rounded-2xl bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl border border-slate-200 dark:border-white/15 shadow-2xl flex items-center gap-3 animate-in fade-in duration-200">
          <span className="text-xs font-mono font-bold text-slate-400 dark:text-[#8E8E93]">
            #{String(hoveredBadge.index).padStart(3, '0')}
          </span>
          <span className="text-xs font-bold text-slate-900 dark:text-white max-w-[200px] truncate">
            {challengeMode && hoveredBadge.badge.state !== 'unlocked' ? hoveredBadge.index > awards.length ? '即将推出' : '神秘勋章' : hoveredBadge.badge.name}
          </span>
          {(!challengeMode || hoveredBadge.badge.state === 'unlocked') && <span
            className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${getRarityColor(hoveredBadge.badge.rarity || 'Common')}20`,
              color: getRarityColor(hoveredBadge.badge.rarity || 'Common'),
              border: `1px solid ${getRarityColor(hoveredBadge.badge.rarity || 'Common')}40`,
            }}
          >
            {hoveredBadge.badge.rarity || 'Common'}
          </span>}
          {!challengeMode && hoveredBadge.badge.state !== 'unlocked' && (
            <span className="text-[10px] font-bold text-slate-400 dark:text-white/40">
              (Shadow Mode • Click to inspect)
            </span>
          )}
        </div>
      )}
    </div>
  );
};
