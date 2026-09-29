import React, { useState, useMemo } from 'react';
import { BadgeModel, BadgePrototypeId, getBadgePrototypeId } from '../types/badge';
import { BadgeCanvas } from './BadgeCanvas';
import { calculateCollectionSummary, BadgeRarityInfo } from '../utils/rarity';
import { triggerHaptic } from '../utils/haptics';
import { spatialAudio } from '../utils/spatialAudio';

interface CollectionSummaryProps {
  awards: BadgeModel[];
  onSelectAward: (award: BadgeModel) => void;
  onTriggerUnlock?: (badgeId: string) => void;
  onViewAllAwards?: () => void;
}

export const CollectionSummary: React.FC<CollectionSummaryProps> = ({
  awards,
  onSelectAward,
  onTriggerUnlock,
  onViewAllAwards,
}) => {
  const summary = useMemo(() => calculateCollectionSummary(awards), [awards]);

  // Allow user to toggle between top rarest badges to inspect
  const [selectedRarestId, setSelectedRarestId] = useState<string>(summary.rarestBadge.id);

  const activeRarest = useMemo(() => {
    return (
      summary.topRarestBadges.find((item) => item.badge.id === selectedRarestId) ||
      summary.topRarestBadges[0] || {
        badge: summary.rarestBadge,
        rarity: summary.rarestBadgeRarity,
      }
    );
  }, [selectedRarestId, summary]);

  // Find the in-progress badge if any
  const inProgressBadge = useMemo(() => {
    return awards.find((b) => b.state === 'progress');
  }, [awards]);

  const protoId: BadgePrototypeId = getBadgePrototypeId(activeRarest.badge.badgeStyle);
  const parsedColor = activeRarest.badge.colorTheme?.primary
    ? parseInt(activeRarest.badge.colorTheme.primary.replace('#', '0x'), 16)
    : undefined;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-28 select-none space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Section with Editorial Proportions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <div className="text-xs font-semibold text-[#FA114F] uppercase tracking-wider mb-1">
            Activity & Honors
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Collection Summary
          </h1>
          <p className="text-sm text-[#8E8E93] mt-1 font-normal">
            Scholarly Archive · Lifetime Knowledge Portfolio
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onViewAllAwards && (
            <button
              onClick={() => {
                triggerHaptic('selection');
                spatialAudio.playClink('facet', 0);
                onViewAllAwards();
              }}
              className="px-4 py-2 rounded-full text-xs font-medium bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-white/[0.08] text-white transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>View All {awards.length} Awards</span>
              <svg className="w-3.5 h-3.5 text-[#8E8E93]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 2. Primary Summary Cards: Total Earned, Catalog Completion, Rarest Award */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Total Earned */}
        <div className="rounded-[24px] bg-[#1C1C1E] p-6 border border-white/[0.05] flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93]">
                Total Earned
              </span>
              <div className="w-2 h-2 rounded-full bg-[#30D158]" />
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                {summary.unlockedCount}
              </span>
              <span className="text-base text-[#8E8E93] font-medium">
                / {summary.totalCatalog} Distinct
              </span>
            </div>

            <div className="mt-4 space-y-1.5 pt-4 border-t border-white/[0.06] text-xs text-[#8E8E93]">
              <div className="flex justify-between">
                <span>Cumulative Medals Awarded:</span>
                <span className="font-semibold text-white">{summary.totalMedalsAwarded}</span>
              </div>
              <div className="flex justify-between">
                <span>In Progress:</span>
                <span className="font-semibold text-[#FFD60A]">{summary.inProgressCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Locked:</span>
                <span className="font-semibold text-[#8E8E93]">{summary.lockedCount}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 text-[11px] text-[#8E8E93]">
            Recognizes repeat ring closures, streak achievements, and milestones.
          </div>
        </div>

        {/* Card 2: Percentage of Completion */}
        <div className="rounded-[24px] bg-[#1C1C1E] p-6 border border-white/[0.05] flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93]">
                Catalog Completion
              </span>
              <span className="text-xs font-semibold text-[#00F0FF]">
                {summary.completionPercentage}%
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-4">
              <div>
                <div className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                  {summary.completionPercentage}%
                </div>
                <div className="text-xs text-[#8E8E93] mt-1 font-normal">
                  {summary.unlockedCount} of {summary.totalCatalog} awards unlocked
                </div>
              </div>

              {/* Apple-style circular progress gauge */}
              <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  {/* Background track */}
                  <path
                    className="text-[#2C2C2E]"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Dynamic Progress track */}
                  <path
                    className="text-[#00F0FF] transition-all duration-1000 ease-out"
                    strokeDasharray={`${summary.completionPercentage}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                  {Math.round(summary.completionPercentage)}%
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/[0.06] text-xs text-[#8E8E93] space-y-1.5">
              <div className="flex justify-between">
                <span>Active Pursuit:</span>
                <span className="font-semibold text-white">
                  {inProgressBadge ? inProgressBadge.name : 'All Complete'}
                </span>
              </div>
              {inProgressBadge && (
                <div className="w-full bg-[#2C2C2E] h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-[#A6FF00] rounded-full transition-all duration-500"
                    style={{
                      width: `${((inProgressBadge.progressCurrent || 0) / (inProgressBadge.progressTotal || 1)) * 100}%`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 text-[11px] text-[#8E8E93]">
            1 award remains in progress to reach 100% catalog perfection.
          </div>
        </div>

        {/* Card 3: Rarest Badge Overview */}
        <div className="rounded-[24px] bg-[#1C1C1E] p-6 border border-white/[0.05] flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93]">
                Rarest Distinction
              </span>
              <span
                className="text-xs font-bold"
                style={{ color: summary.rarestBadgeRarity.tierColor }}
              >
                {summary.rarestBadgeRarity.tier}
              </span>
            </div>

            <div className="mt-3">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight line-clamp-1">
                {summary.rarestBadge.name}
              </h2>
              <div className="text-xs text-[#8E8E93] mt-1 flex items-center gap-1.5">
                <span>{summary.rarestBadge.category}</span>
                <span aria-hidden="true">·</span>
                <span>{summary.rarestBadge.earnedDate}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-1.5 text-xs text-[#8E8E93]">
              <div className="flex justify-between">
                <span>Global Scarcity:</span>
                <span className="font-semibold text-white">
                  Top {summary.rarestBadgeRarity.unlockRate}% Worldwide
                </span>
              </div>
              <div className="flex justify-between">
                <span>Rarity Index:</span>
                <span className="font-semibold text-[#FFD60A]">
                  {summary.rarestBadgeRarity.score} / 100
                </span>
              </div>
              <div className="flex justify-between">
                <span>Crafting Bezel:</span>
                <span className="font-semibold text-white capitalize">
                  {summary.rarestBadge.colorTheme.bezel}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={() => {
                triggerHaptic('tap');
                spatialAudio.playChime('celestial');
                onSelectAward(summary.rarestBadge);
              }}
              className="w-full py-2 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all active:scale-98 flex items-center justify-center gap-1.5"
            >
              <span>Inspect Rarest Award in 3D</span>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Featured 3D Showcase: Rarest Unlocked Badges */}
      <div className="rounded-[28px] bg-[#1C1C1E] border border-white/[0.06] p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
          <div>
            <div className="text-xs font-semibold text-[#FFD60A] uppercase tracking-wider">
              Pinnacle Honors
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5">
              Rarest Badges Showcase
            </h2>
            <p className="text-xs text-[#8E8E93] mt-0.5">
              Highest difficulty milestones, multi-year streaks, and historical challenges.
            </p>
          </div>

          {/* Segmented Top 5 Switcher */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {summary.topRarestBadges.map(({ badge, rarity }, index) => {
              const isSelected = badge.id === activeRarest.badge.id;
              return (
                <button
                  key={badge.id}
                  onClick={() => {
                    triggerHaptic('selection');
                    spatialAudio.playClink('facet', index * 0.1 - 0.2);
                    setSelectedRarestId(badge.id);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'bg-[#2C2C2E] text-[#8E8E93] hover:text-white'
                  }`}
                >
                  #{index + 1} {badge.name.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3D Showcase Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-6">
          {/* Left: Interactive 3D Canvas Stage */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative w-full h-[280px] sm:h-[320px] flex items-center justify-center">
              <BadgeCanvas
                prototypeId={protoId}
                state="unlocked"
                viewAngle="angled"
                earnedDate={activeRarest.badge.earnedDate}
                badgeTitle={activeRarest.badge.name}
                colorHex={parsedColor}
                className="w-full h-full cursor-grab active:cursor-grabbing"
              />
            </div>
            <div className="text-[11px] text-[#8E8E93] flex items-center gap-1.5 mt-2">
              <svg className="w-3.5 h-3.5 text-[#00F0FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
              </svg>
              <span>Drag to rotate 3D badge · Double click to inspect</span>
            </div>
          </div>

          {/* Right: Badge Lore & Physical Depth Metrics */}
          <div className="lg:col-span-7 space-y-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-[#8E8E93]">
                <span
                  className="font-bold"
                  style={{ color: activeRarest.rarity.tierColor }}
                >
                  {activeRarest.rarity.tier} Tier
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-white font-medium">
                  {activeRarest.rarity.rankBadgeText}
                </span>
                <span aria-hidden="true">·</span>
                <span>{activeRarest.badge.category}</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {activeRarest.badge.name}
              </h3>

              <p className="text-xs sm:text-sm text-[#8E8E93] leading-relaxed pt-1">
                {activeRarest.badge.longDescription || activeRarest.badge.description}
              </p>
            </div>

            {/* Depth & Craftsmanship Specifications */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/[0.06]">
              <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.04]">
                <div className="text-[10px] uppercase font-semibold text-[#8E8E93]">Thickness</div>
                <div className="text-xs font-semibold text-white mt-0.5 truncate">
                  {activeRarest.badge.depthMetrics.thickness.split(' ')[0]} {activeRarest.badge.depthMetrics.thickness.split(' ')[1] || 'mm'}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.04]">
                <div className="text-[10px] uppercase font-semibold text-[#8E8E93]">Layers</div>
                <div className="text-xs font-semibold text-white mt-0.5">
                  {activeRarest.badge.depthMetrics.layers} Physical Layers
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.04]">
                <div className="text-[10px] uppercase font-semibold text-[#8E8E93]">Bezel Finish</div>
                <div className="text-xs font-semibold text-white mt-0.5 capitalize">
                  {activeRarest.badge.colorTheme.bezel}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.04]">
                <div className="text-[10px] uppercase font-semibold text-[#8E8E93]">Earned Date</div>
                <div className="text-xs font-semibold text-white mt-0.5 truncate">
                  {activeRarest.badge.earnedDate || 'Earned'}
                </div>
              </div>
            </div>

            <div className="text-xs text-[#8E8E93] leading-relaxed">
              <span className="font-semibold text-white">Enamel Finish: </span>
              {activeRarest.badge.depthMetrics.enamelFinish}
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  triggerHaptic('tap');
                  spatialAudio.playChime('celestial');
                  onSelectAward(activeRarest.badge);
                }}
                className="px-5 py-2.5 rounded-full text-xs font-bold bg-white text-black hover:bg-white/90 transition-all active:scale-95 shadow-md flex items-center gap-2"
              >
                <span>Full Screen 3D Inspection</span>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
              </button>

              {onTriggerUnlock && (
                <button
                  onClick={() => {
                    triggerHaptic('selection');
                    spatialAudio.playChime('unlock_fanfare');
                    onTriggerUnlock(activeRarest.badge.id);
                  }}
                  className="px-4 py-2.5 rounded-full text-xs font-medium bg-[#2C2C2E] hover:bg-[#3A3A3C] text-white transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <span>Replay Unlock Experience</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Category Breakdown Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Curriculum & Discipline Progress
            </h2>
            <p className="text-xs text-[#8E8E93] mt-0.5">
              Completion distribution across learning domains and thematic series.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {summary.categoryBreakdown.map((cat) => {
            const isFullyCompleted = cat.unlocked === cat.total;
            return (
              <div
                key={cat.category}
                className="rounded-[22px] bg-[#1C1C1E] p-5 border border-white/[0.05] space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-white tracking-tight">
                      {cat.category}
                    </h3>
                    <div className="text-xs text-[#8E8E93] mt-0.5">
                      {cat.unlocked} of {cat.total} Completed
                    </div>
                  </div>

                  <span
                    className={`text-xs font-bold ${
                      isFullyCompleted ? 'text-[#30D158]' : 'text-[#FFD60A]'
                    }`}
                  >
                    {cat.completionPercentage}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#2C2C2E] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isFullyCompleted ? 'bg-[#30D158]' : 'bg-[#FF9F0A]'
                    }`}
                    style={{ width: `${cat.completionPercentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#8E8E93]">
                  <span>
                    {isFullyCompleted
                      ? 'All honors unlocked in domain'
                      : `${cat.inProgress} award currently in progress`}
                  </span>
                  {isFullyCompleted && (
                    <span className="text-[#30D158] font-semibold flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Mastered
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. In-Progress Goal Spotlight & Next Honor */}
      {inProgressBadge && (
        <div className="rounded-[24px] bg-gradient-to-r from-[#1C1C1E] to-[#252528] border border-white/[0.08] p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-xl">
              <div className="text-xs font-semibold text-[#A6FF00] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A6FF00] animate-pulse" />
                <span>Next Milestone to Unlock</span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {inProgressBadge.name}
              </h3>
              <p className="text-xs text-[#8E8E93] leading-relaxed">
                {inProgressBadge.longDescription || inProgressBadge.description}
              </p>
              <div className="flex items-center gap-2 pt-2 text-xs text-white">
                <span className="font-semibold text-[#A6FF00]">
                  {inProgressBadge.progressCurrent} of {inProgressBadge.progressTotal} days
                </span>
                <span className="text-[#8E8E93]">·</span>
                <span className="text-[#8E8E93]">
                  {(inProgressBadge.progressTotal || 365) - (inProgressBadge.progressCurrent || 309)} days remaining to reach 100% catalog
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  triggerHaptic('tap');
                  spatialAudio.playClink('facet', 0);
                  onSelectAward(inProgressBadge);
                }}
                className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[#2C2C2E] hover:bg-[#3A3A3C] text-white border border-white/[0.08] transition-all active:scale-95 flex items-center gap-2"
              >
                <span>View Progress in 3D</span>
                <svg className="w-3.5 h-3.5 text-[#8E8E93]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              {onTriggerUnlock && (
                <button
                  onClick={() => {
                    triggerHaptic('selection');
                    spatialAudio.playChime('unlock_fanfare');
                    onTriggerUnlock(inProgressBadge.id);
                  }}
                  className="text-xs text-[#A6FF00] hover:underline font-medium"
                >
                  Simulate Milestone Unlock →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. Craftsmanship & Chronology Footer Metrics */}
      <div className="rounded-[22px] bg-[#1C1C1E] border border-white/[0.05] p-5 text-xs text-[#8E8E93]">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="font-semibold text-white mb-1">Bezel Metallurgies</div>
            <div>
              24K Mirror Gold: <span className="text-white font-medium">{summary.bezelDistribution.gold}</span>
            </div>
            <div>
              Space Silver: <span className="text-white font-medium">{summary.bezelDistribution.silver}</span>
            </div>
            <div>
              Space Gray Titanium: <span className="text-white font-medium">{summary.bezelDistribution.spaceGray}</span>
            </div>
          </div>

          <div>
            <div className="font-semibold text-white mb-1">Scholarship Chronology</div>
            <div>
              First Award: <span className="text-white font-medium">{summary.earliestEarnedDate || '11/9/2017'}</span>
            </div>
            <div>
              Latest Award: <span className="text-white font-medium">{summary.latestEarnedDate || '9/26/2026'}</span>
            </div>
            <div>
              Active Tenure: <span className="text-white font-medium">8.9 Years of Active Recall</span>
            </div>
          </div>

          <div>
            <div className="font-semibold text-white mb-1">Spatial Audio Synthesis</div>
            <div>
              Acoustic Physics: <span className="text-white font-medium">Modal Resonant Vitreous</span>
            </div>
            <div>
              Headphone Soundstage: <span className="text-white font-medium">Full Binaural Pan & Tilt</span>
            </div>
            <div>
              Tactile Engines: <span className="text-white font-medium">Sub-bass Haptic Synced</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
