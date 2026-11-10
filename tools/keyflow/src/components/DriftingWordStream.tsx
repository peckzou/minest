import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Volume2, RotateCcw } from 'lucide-react';
import { ForgedWordRecord } from '../data/vocabularyData';

interface DriftingWordStreamProps {
  forgedWords: ForgedWordRecord[];
  onReplayWord: (record: ForgedWordRecord) => void;
  onSpeakWord: (word: string) => void;
  isImmersive?: boolean;
}

export const DriftingWordStream: React.FC<DriftingWordStreamProps> = ({
  forgedWords,
  onReplayWord,
  onSpeakWord,
  isImmersive = false,
}) => {
  // Show the 5 most recently forged words/phrases; when a 6th arrives, the oldest slowly drifts off the right edge
  const recentFive = forgedWords.slice(0, 5);

  return (
    <div
      className={`relative w-full rounded-xl border border-[#E2DDD3] dark:border-zinc-800 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xs px-4 py-2.5 overflow-hidden transition-colors ${
        isImmersive ? 'max-w-6xl mx-auto my-2' : ''
      }`}
    >
      {/* Right-Edge Atmospheric Fade Mask so outgoing words dissolve into the horizon as they drift out */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white dark:from-zinc-900 to-transparent z-20"
      />

      <div className="flex items-center gap-3">
        {/* Stream Label Kicker */}
        <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 dark:text-zinc-400 shrink-0 pr-2 border-r border-zinc-200 dark:border-zinc-800">
          <Sparkles className="w-3.5 h-3.5 text-[#D94625]" />
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
            记忆漂流带
          </span>
          <span aria-hidden="true">·</span>
          <span>最近 {recentFive.length}/5 词</span>
        </div>

        {/* Horizontal Streaming Track */}
        <div className="relative flex-1 flex items-center gap-2.5 overflow-hidden py-0.5">
          <AnimatePresence mode="popLayout" initial={false}>
            {recentFive.map((item, idx) => (
              <motion.div
                key={item.id}
                layout
                initial={{
                  opacity: 0,
                  x: -120,
                  scale: 0.88,
                  filter: 'blur(4px)',
                }}
                animate={{
                  opacity: 1 - idx * 0.11,
                  x: 0,
                  scale: 1,
                  filter: 'blur(0px)',
                }}
                exit={{
                  opacity: 0,
                  x: 220,
                  scale: 0.9,
                  filter: 'blur(5px)',
                  transition: {
                    duration: 1.15,
                    ease: [0.22, 1, 0.36, 1],
                  },
                }}
                transition={{
                  layout: {
                    type: 'spring',
                    stiffness: 170,
                    damping: 24,
                    mass: 0.9,
                  },
                  opacity: { duration: 0.55 },
                  x: { type: 'spring', stiffness: 180, damping: 22 },
                }}
                onClick={() => onReplayWord(item)}
                title={`点击重演 "${item.word}" 的打字轨迹 · ${item.meaning}`}
                className={`group relative shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer select-none transition-colors ${
                  idx === 0
                    ? 'border-[#D94625]/60 bg-amber-50/50 dark:bg-amber-950/25 text-zinc-900 dark:text-zinc-100'
                    : 'border-zinc-200/90 dark:border-zinc-800 bg-[#FAF9F5] dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 hover:border-[#D94625]/50'
                }`}
              >
                <span className="font-display text-sm font-bold tracking-tight whitespace-nowrap">
                  {item.word}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSpeakWord(item.word);
                  }}
                  className="opacity-60 group-hover:opacity-100 text-zinc-400 hover:text-[#D94625] transition-opacity ml-0.5 cursor-pointer"
                  title="朗读发音"
                >
                  <Volume2 className="w-3 h-3" />
                </button>
                <RotateCcw className="w-3 h-3 opacity-0 group-hover:opacity-80 text-[#D94625] transition-opacity" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
