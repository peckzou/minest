import React, { useMemo } from 'react';

export interface KeyConfig {
  id: string;
  label: string;
  subLabel?: string;
  width?: number; // relative unit (1 = standard 1u keycap)
  finger: 'pinky-l' | 'ring-l' | 'middle-l' | 'index-l' | 'thumb' | 'index-r' | 'middle-r' | 'ring-r' | 'pinky-r';
  row: number;
  col: number;
  isAccent?: boolean;
  isHoming?: boolean;
  isVowel?: boolean;
}

export const KEYBOARD_ROWS: KeyConfig[][] = [
  [
    { id: 'q', label: 'Q', finger: 'pinky-l', row: 0, col: 0 },
    { id: 'w', label: 'W', finger: 'ring-l', row: 0, col: 1 },
    { id: 'e', label: 'E', finger: 'middle-l', row: 0, col: 2, isVowel: true },
    { id: 'r', label: 'R', finger: 'index-l', row: 0, col: 3 },
    { id: 't', label: 'T', finger: 'index-l', row: 0, col: 4 },
    { id: 'y', label: 'Y', finger: 'index-r', row: 0, col: 5 },
    { id: 'u', label: 'U', finger: 'index-r', row: 0, col: 6, isVowel: true },
    { id: 'i', label: 'I', finger: 'middle-r', row: 0, col: 7, isVowel: true },
    { id: 'o', label: 'O', finger: 'ring-r', row: 0, col: 8, isVowel: true },
    { id: 'p', label: 'P', finger: 'pinky-r', row: 0, col: 9 },
    { id: 'backspace', label: '⌫ 退格', subLabel: 'BS', width: 1.55, finger: 'pinky-r', row: 0, col: 10 },
  ],
  [
    { id: 'a', label: 'A', finger: 'pinky-l', row: 1, col: 0, isVowel: true },
    { id: 's', label: 'S', finger: 'ring-l', row: 1, col: 1 },
    { id: 'd', label: 'D', finger: 'middle-l', row: 1, col: 2 },
    { id: 'f', label: 'F', finger: 'index-l', row: 1, col: 3, isHoming: true },
    { id: 'g', label: 'G', finger: 'index-l', row: 1, col: 4 },
    { id: 'h', label: 'H', finger: 'index-r', row: 1, col: 5 },
    { id: 'j', label: 'J', finger: 'index-r', row: 1, col: 6, isHoming: true },
    { id: 'k', label: 'K', finger: 'middle-r', row: 1, col: 7 },
    { id: 'l', label: 'L', finger: 'ring-r', row: 1, col: 8 },
    { id: 'enter', label: '↵ 锻造入库', subLabel: 'ENTER', width: 1.85, finger: 'pinky-r', row: 1, col: 9, isAccent: true },
  ],
  [
    { id: 'tab', label: 'Tab 释义', subLabel: 'NOTE', width: 1.35, finger: 'pinky-l', row: 2, col: 0 },
    { id: 'z', label: 'Z', finger: 'pinky-l', row: 2, col: 1 },
    { id: 'x', label: 'X', finger: 'ring-l', row: 2, col: 2 },
    { id: 'c', label: 'C', finger: 'middle-l', row: 2, col: 3 },
    { id: 'v', label: 'V', finger: 'index-l', row: 2, col: 4 },
    { id: 'b', label: 'B', finger: 'index-l', row: 2, col: 5 },
    { id: 'n', label: 'N', finger: 'index-r', row: 2, col: 6 },
    { id: 'm', label: 'M', finger: 'index-r', row: 2, col: 7 },
    { id: '-', label: '-', finger: 'middle-r', row: 2, col: 8 },
    { id: 'speak', label: '🔊 朗读', subLabel: 'TTS', width: 1.45, finger: 'pinky-r', row: 2, col: 9 },
  ],
  [
    { id: 'clear', label: 'Esc 清空', width: 1.4, finger: 'pinky-l', row: 3, col: 0 },
    { id: 'morph', label: '✦ 字母变形', width: 1.6, finger: 'index-l', row: 3, col: 2 },
    { id: ' ', label: 'SPACE · 空格输入 (词组间隔)', width: 4.8, finger: 'thumb', row: 3, col: 5 },
    { id: 'random', label: '🎲 随机灵感词', width: 1.9, finger: 'pinky-r', row: 3, col: 9 },
  ],
];

// Helper to get normalized X (-1 to +1) and Y (0 to 1) for flying letter trajectories
export function getKeyNormalizedPosition(keyChar: string): { x: number; y: number } {
  const lower = keyChar.toLowerCase();
  for (const row of KEYBOARD_ROWS) {
    for (const k of row) {
      if (k.id === lower) {
        const normX = (k.col - 4.5) / 5; // -0.9 to +0.9
        const normY = k.row / 3;
        return { x: normX, y: normY };
      }
    }
  }
  return { x: (Math.random() - 0.5) * 0.8, y: 0.5 };
}

interface InteractiveKeyboardProps {
  activeKeys: Set<string>;
  lastPressedKey: { key: string; timestamp: number } | null;
  targetNextChar: string | null;
  keyCounts: Record<string, number>;
  showHeatmap: boolean;
  onVirtualKeyPress: (keyId: string) => void;
  keyboardTheme: 'braun' | 'cyber-slate' | 'matcha';
  combo: number;
}

export const InteractiveKeyboard: React.FC<InteractiveKeyboardProps> = ({
  activeKeys,
  lastPressedKey,
  targetNextChar,
  keyCounts,
  showHeatmap,
  onVirtualKeyPress,
  keyboardTheme,
  combo,
}) => {
  // Find row & col of the most recently pressed key to calculate sympathetic plate flex on neighboring keys
  const activeCoord = useMemo(() => {
    if (!lastPressedKey) return null;
    const kId = lastPressedKey.key.toLowerCase();
    for (const row of KEYBOARD_ROWS) {
      for (const k of row) {
        if (k.id === kId) {
          return { row: k.row, col: k.col, timestamp: lastPressedKey.timestamp };
        }
      }
    }
    return null;
  }, [lastPressedKey]);

  const isHeavyKeyActive =
    activeKeys.has(' ') || activeKeys.has('enter') || activeKeys.has('backspace');

  const chassisClass =
    keyboardTheme === 'braun'
      ? 'bg-[#E6E2D8] dark:bg-zinc-900 border-[#D0CBBF] dark:border-zinc-800 shadow-[0_10px_0_#C2BDB0,0_18px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_10px_0_#18181b,0_18px_32px_rgba(0,0,0,0.45)]'
      : keyboardTheme === 'matcha'
      ? 'bg-[#DFE6DD] dark:bg-emerald-950/90 border-[#C5D1C2] dark:border-emerald-900 shadow-[0_10px_0_#B4C2B0,0_18px_32px_rgba(0,0,0,0.12)]'
      : 'bg-slate-800 dark:bg-zinc-950 border-slate-700 dark:border-zinc-800 shadow-[0_10px_0_#0f172a,0_18px_32px_rgba(0,0,0,0.35)]';

  return (
    <div className="w-full select-none">
      {/* Outer CNC Aluminum Mechanical Keyboard Case */}
      <div
        className={`relative rounded-2xl border-2 p-3.5 sm:p-5 transition-transform duration-75 ${chassisClass} ${
          isHeavyKeyActive ? 'translate-y-[2.5px] scale-[0.997]' : 'translate-y-0'
        }`}
      >
        {/* Top Machined Screw & Plate Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-2.5 mb-2 border-b border-black/10 dark:border-white/10 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full border border-zinc-400 dark:border-zinc-600" />
            <span>GASKET MOUNT · 十字波纹共振定位板</span>
            <span aria-hidden="true">·</span>
            <span>右上角橙点 = 元音键 (A/E/I/O/U)</span>
          </div>
          <div className="flex items-center gap-3">
            {targetNextChar && (
              <span className="text-[#D94625] dark:text-amber-400 font-semibold">
                下一键引导: [{targetNextChar === ' ' ? 'SPACE' : targetNextChar.toUpperCase()}]
              </span>
            )}
            <span>连击能量 ×{combo}</span>
          </div>
        </div>

        {/* Recessed Switch Plate */}
        <div className="flex flex-col gap-2 sm:gap-2.5 bg-black/[0.06] dark:bg-black/40 p-2.5 sm:p-3 rounded-xl">
          {KEYBOARD_ROWS.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="flex items-center justify-center gap-1.5 sm:gap-2 w-full"
            >
              {row.map((keyCfg) => {
                const isPressed = activeKeys.has(keyCfg.id);
                const isTarget =
                  targetNextChar !== null &&
                  targetNextChar.toLowerCase() === keyCfg.id;
                const hitCount = keyCounts[keyCfg.id] || 0;

                // Sympathetic neighbor key flex when an adjacent key is struck
                let neighborDist = 99;
                let neighborTiltX = 0;
                if (activeCoord && !isPressed && activeKeys.size > 0) {
                  neighborDist =
                    Math.abs(activeCoord.row - keyCfg.row) +
                    Math.abs(activeCoord.col - keyCfg.col);
                  neighborTiltX = (keyCfg.col - activeCoord.col) * 3.5;
                }

                const flexWidth = keyCfg.width ? `${keyCfg.width * 62}px` : '62px';

                // Keycap surface styling based on theme & state
                let keycapColors =
                  keyboardTheme === 'cyber-slate'
                    ? 'bg-slate-700 text-slate-100 border-slate-600 shadow-[0_4px_0_#1e293b]'
                    : keyboardTheme === 'matcha'
                    ? 'bg-[#F6F8F5] dark:bg-zinc-800 text-emerald-950 dark:text-emerald-100 border-[#D5DFD2] dark:border-zinc-700 shadow-[0_4px_0_#B8C7B4] dark:shadow-[0_4px_0_#18181b]'
                    : 'bg-[#FAF8F5] dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-[#DFDBD2] dark:border-zinc-700 shadow-[0_4px_0_#C7C2B6] dark:shadow-[0_4px_0_#18181b]';

                if (keyCfg.isAccent) {
                  keycapColors =
                    'bg-[#D94625] text-white border-[#B8371B] shadow-[0_4px_0_#8F2811]';
                } else if (keyCfg.id === 'morph') {
                  keycapColors =
                    'bg-zinc-800 dark:bg-zinc-700 text-amber-300 border-zinc-700 shadow-[0_4px_0_#18181b]';
                }

                if (isPressed) {
                  keycapColors =
                    'bg-[#D94625] text-white border-[#B8371B] shadow-[0_0px_0_#8F2811] ring-2 ring-[#D94625]/45';
                } else if (neighborDist === 1) {
                  keycapColors =
                    'bg-amber-50/90 dark:bg-zinc-700 text-zinc-900 dark:text-white border-[#D94625]/50 shadow-[0_2px_0_#C7C2B6] dark:shadow-[0_2px_0_#18181b]';
                } else if (isTarget) {
                  keycapColors =
                    'bg-amber-50 dark:bg-amber-950/70 text-[#D94625] dark:text-amber-300 border-[#D94625] dark:border-amber-400 shadow-[0_4px_0_#D94625] ring-2 ring-[#D94625]/30';
                }

                return (
                  <button
                    key={keyCfg.id}
                    type="button"
                    onClick={() => onVirtualKeyPress(keyCfg.id)}
                    style={{
                      flexGrow: keyCfg.width || 1,
                      maxWidth: flexWidth,
                      transform: isPressed
                        ? 'translateY(4px) scale(0.95)'
                        : neighborDist === 1
                        ? `translateY(2px) rotate(${neighborTiltX}deg) scale(0.985)`
                        : neighborDist === 2
                        ? 'translateY(0.8px)'
                        : undefined,
                    }}
                    className={`group relative h-11 sm:h-13 rounded-lg border font-mono select-none cursor-pointer flex flex-col items-center justify-center transition-all duration-75 focus:outline-none ${keycapColors} ${
                      !isPressed && neighborDist > 2
                        ? 'hover:-translate-y-[1px] active:translate-y-[4px]'
                        : ''
                    }`}
                  >
                    {/* Ripple Shockwave when key is pressed */}
                    {isPressed && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-lg border-2 border-[#D94625] dark:border-amber-400 animate-key-ripple"
                      />
                    )}

                    {/* Subtle Vowel Dot Indicator on A, E, I, O, U */}
                    {keyCfg.isVowel && (
                      <span
                        aria-hidden="true"
                        className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
                          isPressed ? 'bg-white' : 'bg-[#D94625]/75 dark:bg-amber-400/80'
                        }`}
                      />
                    )}

                    {/* Inner sculpted keycap dish */}
                    <div className="w-[84%] h-[78%] rounded-[5px] bg-gradient-to-b from-black/[0.02] to-transparent dark:from-white/[0.03] flex flex-col items-center justify-center px-1">
                      <span
                        className={`leading-none font-semibold tracking-tight whitespace-nowrap ${
                          keyCfg.id.length > 1 ? 'text-[11px] sm:text-xs' : 'text-sm sm:text-base'
                        }`}
                      >
                        {keyCfg.label}
                      </span>

                      {/* Optional keystroke frequency heat indicator */}
                      {showHeatmap && hitCount > 0 && keyCfg.id.length === 1 && (
                        <span
                          className={`mt-0.5 text-[9px] leading-none font-mono ${
                            isPressed
                              ? 'text-white/90'
                              : 'text-[#D94625] dark:text-amber-400'
                          }`}
                        >
                          ×{hitCount}
                        </span>
                      )}

                      {/* Tactile homing bar on F and J */}
                      {keyCfg.isHoming && !showHeatmap && (
                        <span
                          className={`mt-1 w-3 h-[2px] rounded-full ${
                            isPressed
                              ? 'bg-white'
                              : 'bg-zinc-400 dark:bg-zinc-500'
                          }`}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
