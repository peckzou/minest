import React, { useState } from 'react';
import { BadgeModel, BadgeCategory } from '../types/badge';
import { BadgePreview } from './BadgePreview';
import { triggerHaptic } from '../utils/haptics';
import { spatialAudio } from '../utils/spatialAudio';
import { calculateBadgeRarity, getRarityColor } from '../utils/rarity';

interface AppleAwardsGridProps {
  awards: BadgeModel[];
  onSelectAward: (award: BadgeModel) => void;
  onTriggerUnlock: (badgeId: string) => void;
  onViewSummary?: () => void;
}

export const AppleAwardsGrid: React.FC<AppleAwardsGridProps> = ({
  awards,
  onSelectAward,
  onTriggerUnlock,
  onViewSummary,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories: { key: string; label: string; count: number }[] = [
    { key: 'all', label: 'All Awards', count: awards.length },
    {
      key: 'Liquid Glass Strike',
      label: '💧 Liquid Glass Strike (10)',
      count: awards.filter((a) => a.category === 'Liquid Glass Strike').length,
    },
    {
      key: 'Hexagon Pop Challenge',
      label: '⬡ Hexagon Pop (15)',
      count: awards.filter((a) => a.category === 'Hexagon Pop Challenge').length,
    },
    {
      key: 'Minecraft Characters',
      label: '⛏️ Minecraft (10)',
      count: awards.filter((a) => a.category === 'Minecraft Characters').length,
    },
    {
      key: 'Cartoon Characters',
      label: '✨ Cartoon Characters (10)',
      count: awards.filter((a) => a.category === 'Cartoon Characters').length,
    },
    {
      key: 'Cute Animals',
      label: '🐾 Cute Animals (10)',
      count: awards.filter((a) => a.category === 'Cute Animals').length,
    },
    {
      key: 'Ocean Animals',
      label: '🌊 Ocean Animals (10)',
      count: awards.filter((a) => a.category === 'Ocean Animals').length,
    },
    {
      key: 'Close Your Study Rings',
      label: 'Study Rings',
      count: awards.filter((a) => a.category === 'Close Your Study Rings').length,
    },
    {
      key: 'Learning Milestones',
      label: 'Milestones',
      count: awards.filter((a) => a.category === 'Learning Milestones').length,
    },
    {
      key: 'Academic Disciplines & Mastery',
      label: 'Disciplines',
      count: awards.filter((a) => a.category === 'Academic Disciplines & Mastery').length,
    },
    {
      key: 'Limited Edition Challenges',
      label: 'Challenges',
      count: awards.filter((a) => a.category === 'Limited Edition Challenges').length,
    },
  ];

  const filteredAwards = awards.filter((award) => {
    const matchesCategory =
      selectedCategory === 'all' || award.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      award.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      award.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      award.badgeStyle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-32 select-none">
      {/* 1. Apple Top Header Bar */}
      <div className="flex items-center justify-between py-3 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Minest Learning Awards</h1>
          <p className="text-xs text-[#8E8E93] mt-0.5 font-medium">
            {awards.length} High-Prestige Awards • Minecraft, Cartoon Characters & Cute / Ocean Animals
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onViewSummary && (
            <button
              onClick={() => {
                triggerHaptic('selection');
                spatialAudio.playClink('facet', 0);
                onViewSummary();
              }}
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-white/[0.08] text-xs font-medium text-white transition-all active:scale-95"
              title="View Collection Summary"
            >
              <div className="flex items-center -space-x-1">
                <div className="w-2 h-2 rounded-full border border-black bg-[#FA114F]" />
                <div className="w-2 h-2 rounded-full border border-black bg-[#A6FF00]" />
                <div className="w-2 h-2 rounded-full border border-black bg-[#00F0FF]" />
              </div>
              <span className="hidden sm:inline">Summary</span>
              <span className="text-[#00F0FF] font-semibold">
                {Math.round((awards.filter((a) => a.state === 'unlocked').length / awards.length) * 100)}%
              </span>
            </button>
          )}
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#1C1C1E] text-white/80 border border-white/[0.08]">
            {filteredAwards.length} / {awards.length}
          </span>
        </div>
      </div>

      {/* 2. Search & Category Filter Strip */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search 50 awards or 20 styles (e.g. 'Octagon', 'Polyglot', 'Streak')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1C1C1E] text-white placeholder-[#636366] text-sm rounded-full pl-10 pr-4 py-2 border border-white/[0.08] focus:outline-none focus:border-white/20 transition-all"
          />
          <svg
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8E8E93] hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => {
                  triggerHaptic('selection');
                  spatialAudio.playClink('facet', 0);
                  setSelectedCategory(cat.key);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'bg-[#1C1C1E] text-[#8E8E93] hover:text-white border border-white/[0.06]'
                }`}
              >
                {cat.label} ({cat.count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Apple 2-Column Responsive Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAwards.map((award, index) => {
          const isProgress = award.state === 'progress';
          const rarityInfo = calculateBadgeRarity(award);
          const effectiveRarity = award.rarity || rarityInfo.tier;
          const rarityColor = getRarityColor(effectiveRarity);

          return (
            <div
              key={award.id}
              onClick={() => {
                triggerHaptic('tap');
                spatialAudio.playClink('tap', 0);
                onSelectAward(award);
              }}
              className="group relative rounded-[26px] bg-[#1C1C1E] hover:bg-[#252528] active:scale-[0.98] transition-all duration-200 p-5 flex flex-col justify-between cursor-pointer overflow-hidden border border-white/[0.04] hover:border-white/[0.12] shadow-lg"
              style={{ minHeight: '340px' }}
            >
              {/* Category & Rarity Badge Top */}
              <div className="flex items-center justify-between text-left">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-[#8E8E93]">
                  {award.category}
                </span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border shadow-sm"
                  style={{
                    backgroundColor: `${rarityColor}1A`,
                    color: rarityColor,
                    borderColor: `${rarityColor}40`,
                  }}
                >
                  {effectiveRarity}
                </span>
              </div>

              {/* 3D Floating Badge Thumbnail Stage */}
              <div className="relative w-full h-[180px] flex items-center justify-center my-2 group-hover:scale-105 transition-transform duration-300 ease-out">
                <BadgePreview
                  badge={award}
                  priority={index < 6}
                  className="w-full h-full pointer-events-none"
                />
              </div>

              {/* Award Metadata & Typography */}
              <div className="text-center space-y-1">
                <h3 className="text-[15px] font-semibold text-white tracking-tight leading-snug line-clamp-1">
                  {award.name}
                </h3>

                {/* Date or Progress Text */}
                {isProgress ? (
                  <div className="space-y-1 pt-1">
                    <div className="text-xs text-[#8E8E93] font-medium">
                      {award.progressCurrent} of {award.progressTotal}
                    </div>
                    {/* Apple Fitness Volt Neon Progress Bar */}
                    <div className="w-24 h-1 bg-[#2C2C2E] rounded-full mx-auto overflow-hidden">
                      <div
                        className="h-full bg-[#A6FF00] rounded-full transition-all duration-500"
                        style={{
                          width: `${((award.progressCurrent || 0) / (award.progressTotal || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-[#8E8E93]">
                    {award.earnedDate}
                  </div>
                )}

                {/* Overlapping Multi-Award Stack Badge */}
                {award.earnedCount && award.earnedCount > 1 && (
                  <div className="pt-2 flex flex-col items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-[#2C2C2E] text-[10px] font-bold text-[#8E8E93] flex items-center justify-center mb-1">
                      {award.earnedCount}
                    </div>
                    <div className="flex items-center -space-x-2">
                      <div className="w-3.5 h-3.5 rounded-full border border-white/20 bg-[#FA114F]/40" />
                      <div className="w-3.5 h-3.5 rounded-full border border-white/20 bg-[#A6FF00]/40" />
                      <div className="w-3.5 h-3.5 rounded-full border border-white/20 bg-[#00F0FF]/40" />
                      <div className="w-3.5 h-3.5 rounded-full border border-white/20 bg-[#F5C518]/40" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
