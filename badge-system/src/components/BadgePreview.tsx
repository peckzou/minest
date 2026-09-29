import React, { useState, useEffect } from 'react';
import { BadgeModel, BadgeStyleType } from '../types/badge';
import { badgePreviewService } from '../services/BadgePreviewService';

interface BadgePreviewProps {
  badge: BadgeModel;
  className?: string;
  priority?: boolean;
}

/**
 * High-Fidelity SVG / CSS 2.5D Vector Fallback
 * Guarantees zero blank cards immediately on first frame render,
 * before the single shared 3D snapshot finishes generating.
 */
const BadgeVectorSilhouette: React.FC<{
  styleType: BadgeStyleType;
  primaryColor: string;
  bezel: 'silver' | 'gold' | 'space-gray';
  isLocked: boolean;
}> = ({ styleType, primaryColor, bezel, isLocked }) => {
  const bezelGradientId = `bezel-grad-${bezel}-${isLocked ? 'locked' : 'unlocked'}`;
  const enamelColor = isLocked ? '#2A2C32' : primaryColor;

  return (
    <svg
      viewBox="0 0 160 160"
      className="w-36 h-36 drop-shadow-2xl transition-transform duration-300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Silver Bezel Chamfer Gradient */}
        <linearGradient id="bezel-grad-silver-unlocked" x1="0" y1="0" x2="160" y2="160" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="25%" stopColor="#D5D9E0" />
          <stop offset="50%" stopColor="#8E939D" />
          <stop offset="75%" stopColor="#E2E6ED" />
          <stop offset="100%" stopColor="#9CA2AE" />
        </linearGradient>

        {/* Gold Bezel Chamfer Gradient */}
        <linearGradient id="bezel-grad-gold-unlocked" x1="0" y1="0" x2="160" y2="160" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF2B2" />
          <stop offset="30%" stopColor="#E5B94B" />
          <stop offset="60%" stopColor="#9E7624" />
          <stop offset="85%" stopColor="#FFDE7A" />
          <stop offset="100%" stopColor="#B38628" />
        </linearGradient>

        {/* Space Gray Bezel Chamfer Gradient */}
        <linearGradient id="bezel-grad-space-gray-unlocked" x1="0" y1="0" x2="160" y2="160" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7E8491" />
          <stop offset="35%" stopColor="#454952" />
          <stop offset="70%" stopColor="#2A2D34" />
          <stop offset="100%" stopColor="#5B606B" />
        </linearGradient>

        {/* Locked Muted Gradient */}
        <linearGradient id="bezel-grad-silver-locked" x1="0" y1="0" x2="160" y2="160" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#555861" />
          <stop offset="100%" stopColor="#25272E" />
        </linearGradient>
        <linearGradient id="bezel-grad-gold-locked" x1="0" y1="0" x2="160" y2="160" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#555861" />
          <stop offset="100%" stopColor="#25272E" />
        </linearGradient>
        <linearGradient id="bezel-grad-space-gray-locked" x1="0" y1="0" x2="160" y2="160" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#555861" />
          <stop offset="100%" stopColor="#25272E" />
        </linearGradient>

        {/* Specular Highlight Sheen */}
        <linearGradient id="specular-glint" x1="30" y1="20" x2="130" y2="140" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
          <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Geometry Routing */}
      {renderShapePath(styleType, bezelGradientId, enamelColor, isLocked)}
    </svg>
  );
};

function renderShapePath(
  styleType: BadgeStyleType,
  bezelId: string,
  enamelColor: string,
  isLocked: boolean
): React.ReactNode {
  const bezelStroke = `url(#${bezelId})`;

  switch (styleType) {
    case 'faceted-shield':
      return (
        <g>
          <path
            d="M80 18 C115 18 138 28 138 65 C138 105 106 135 80 148 C54 135 22 105 22 65 C22 28 45 18 80 18 Z"
            fill={enamelColor}
            stroke={bezelStroke}
            strokeWidth="7"
          />
          <path
            d="M80 30 C108 30 126 38 126 68 C126 100 100 124 80 135 C60 124 34 100 34 68 C34 38 52 30 80 30 Z"
            fill="url(#specular-glint)"
            opacity="0.6"
          />
          <path d="M80 20 L80 146" stroke={bezelStroke} strokeWidth="2.5" strokeDasharray="4 3" />
        </g>
      );

    case 'concentric-rings':
      return (
        <g>
          {/* Apple 3 Tricentric Rings */}
          <circle cx="80" cy="80" r="58" stroke={isLocked ? '#3A3C42' : '#FA114F'} strokeWidth="10" />
          <circle cx="80" cy="80" r="42" stroke={isLocked ? '#2F3138' : '#A6FF00'} strokeWidth="10" />
          <circle cx="80" cy="80" r="26" stroke={isLocked ? '#24262C' : '#00F0FF'} strokeWidth="10" />
          <circle cx="80" cy="80" r="66" stroke={bezelStroke} strokeWidth="3" />
        </g>
      );

    case 'challenge-hex':
      return (
        <g>
          <polygon
            points="80,18 138,48 138,112 80,142 22,112 22,48"
            fill={enamelColor}
            stroke={bezelStroke}
            strokeWidth="7"
          />
          <polygon
            points="80,32 126,56 126,104 80,128 34,104 34,56"
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="2.5"
          />
          <polygon
            points="80,48 110,65 110,95 80,112 50,95 50,65"
            fill="url(#specular-glint)"
          />
        </g>
      );

    case 'teardrop-flame':
      return (
        <g>
          <path
            d="M80 16 C95 46 136 78 136 108 C136 138 111 148 80 148 C49 148 24 138 24 108 C24 78 65 46 80 16 Z"
            fill={enamelColor}
            stroke={bezelStroke}
            strokeWidth="7"
          />
          <path
            d="M80 40 C90 62 118 86 118 108 C118 130 101 136 80 136 C59 136 42 130 42 108 C42 86 70 62 80 40 Z"
            fill="url(#specular-glint)"
          />
        </g>
      );

    case 'faceted-octagon':
      return (
        <g>
          <polygon
            points="55,20 105,20 140,55 140,105 105,140 55,140 20,105 20,55"
            fill={enamelColor}
            stroke={bezelStroke}
            strokeWidth="7"
          />
          <line x1="20" y1="55" x2="140" y2="105" stroke={bezelStroke} strokeWidth="1.5" opacity="0.4" />
          <line x1="20" y1="105" x2="140" y2="55" stroke={bezelStroke} strokeWidth="1.5" opacity="0.4" />
        </g>
      );

    case 'infinity-loop':
      return (
        <g>
          <path
            d="M52 60 C38 60 26 70 26 80 C26 90 38 100 52 100 C68 100 78 88 80 80 C82 88 92 100 108 100 C122 100 134 90 134 80 C134 70 122 60 108 60 C92 60 82 72 80 80 C78 72 68 60 52 60 Z"
            fill="none"
            stroke={bezelStroke}
            strokeWidth="14"
          />
          <path
            d="M52 60 C38 60 26 70 26 80 C26 90 38 100 52 100 C68 100 78 88 80 80 C82 88 92 100 108 100 C122 100 134 90 134 80 C134 70 122 60 108 60 C92 60 82 72 80 80 C78 72 68 60 52 60 Z"
            fill="none"
            stroke={enamelColor}
            strokeWidth="7"
          />
        </g>
      );

    case 'circular-coin':
      return (
        <g>
          <circle cx="80" cy="80" r="62" fill={enamelColor} stroke={bezelStroke} strokeWidth="8" />
          <circle cx="80" cy="80" r="48" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeDasharray="3 3" />
          <circle cx="80" cy="80" r="32" fill="url(#specular-glint)" />
        </g>
      );

    case 'shield-crested':
      return (
        <g>
          <path
            d="M30 35 L50 20 L80 35 L110 20 L130 35 L130 80 C130 115 105 138 80 148 C55 138 30 115 30 80 Z"
            fill={enamelColor}
            stroke={bezelStroke}
            strokeWidth="7"
          />
          <path
            d="M40 45 L80 58 L120 45 L120 80 C120 108 98 128 80 136 C62 128 40 108 40 80 Z"
            fill="url(#specular-glint)"
          />
        </g>
      );

    case 'rhombus-diamond':
      return (
        <g>
          <polygon points="80,16 142,80 80,144 18,80" fill={enamelColor} stroke={bezelStroke} strokeWidth="7" />
          <polygon points="80,36 122,80 80,124 38,80" fill="url(#specular-glint)" />
          <line x1="18" y1="80" x2="142" y2="80" stroke={bezelStroke} strokeWidth="2" opacity="0.5" />
          <line x1="80" y1="16" x2="80" y2="144" stroke={bezelStroke} strokeWidth="2" opacity="0.5" />
        </g>
      );

    case 'pentagon-star':
      return (
        <g>
          <polygon points="80,18 140,58 118,136 42,136 20,58" fill={enamelColor} stroke={bezelStroke} strokeWidth="7" />
          <polygon points="80,36 94,68 128,70 102,92 110,124 80,104 50,124 58,92 32,70 66,68" fill={bezelStroke} />
        </g>
      );

    case 'rounded-squircle':
      return (
        <g>
          <rect x="24" y="24" width="112" height="112" rx="36" fill={enamelColor} stroke={bezelStroke} strokeWidth="8" />
          <rect x="36" y="36" width="88" height="88" rx="24" fill="url(#specular-glint)" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
        </g>
      );

    case 'clover-quatrefoil':
      return (
        <g>
          <path
            d="M80 44 C80 26 64 16 50 26 C36 36 42 56 56 64 C42 66 32 78 36 94 C40 108 58 110 68 98 C66 112 78 124 94 120 C108 116 110 98 98 88 C112 90 124 78 120 62 C116 48 98 46 88 58 C90 44 78 32 64 36 Z"
            fill={enamelColor}
            stroke={bezelStroke}
            strokeWidth="6"
          />
        </g>
      );

    case 'triangle-prism':
      return (
        <g>
          <path
            d="M80 20 C85 20 138 115 135 125 C132 135 28 135 25 125 C22 115 75 20 80 20 Z"
            fill={enamelColor}
            stroke={bezelStroke}
            strokeWidth="7"
          />
          <circle cx="80" cy="90" r="22" fill="url(#specular-glint)" />
        </g>
      );

    case 'sunburst-radiant':
      return (
        <g>
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <line
              key={deg}
              x1="80"
              y1="80"
              x2={80 + 58 * Math.cos((deg * Math.PI) / 180)}
              y2={80 + 58 * Math.sin((deg * Math.PI) / 180)}
              stroke={bezelStroke}
              strokeWidth="5"
            />
          ))}
          <circle cx="80" cy="80" r="38" fill={enamelColor} stroke={bezelStroke} strokeWidth="6" />
        </g>
      );

    case 'owl-wisdom':
    case 'owl-clockwork':
      return (
        <g>
          <path
            d="M80 22 C110 22 130 45 130 85 C130 125 105 145 80 145 C55 145 30 125 30 85 C30 45 50 22 80 22 Z"
            fill={enamelColor}
            stroke={bezelStroke}
            strokeWidth="6"
          />
          {/* Owl Eyes */}
          <circle cx="60" cy="65" r="16" fill="#1C1C1E" stroke={bezelStroke} strokeWidth="4" />
          <circle cx="100" cy="65" r="16" fill="#1C1C1E" stroke={bezelStroke} strokeWidth="4" />
          <circle cx="60" cy="65" r="6" fill="#00F0FF" />
          <circle cx="100" cy="65" r="6" fill="#00F0FF" />
          <polygon points="80,78 74,92 86,92" fill={bezelStroke} />
        </g>
      );

    case 'octopus-polymath':
    case 'octopus-abyss':
    case 'octopus-quantum':
      return (
        <g>
          <ellipse cx="80" cy="60" rx="38" ry="32" fill={enamelColor} stroke={bezelStroke} strokeWidth="6" />
          <circle cx="65" cy="60" r="6" fill="#00F0FF" />
          <circle cx="95" cy="60" r="6" fill="#00F0FF" />
          <path
            d="M50 85 Q35 110 40 135 M65 90 Q60 115 65 140 M95 90 Q100 115 95 140 M110 85 Q125 110 120 135"
            stroke={bezelStroke}
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
      );

    case 'jellyfish-flow':
    case 'jellyfish-nebula':
      return (
        <g>
          <path
            d="M36 78 C36 40 124 40 124 78 C124 88 36 88 36 78 Z"
            fill={enamelColor}
            stroke={bezelStroke}
            strokeWidth="6"
          />
          <path
            d="M50 88 Q45 115 50 140 M70 88 Q65 115 72 142 M90 88 Q95 115 88 142 M110 88 Q115 115 110 140"
            stroke={bezelStroke}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      );

    case 'eagle-sovereign':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill={enamelColor} stroke={bezelStroke} strokeWidth="6" />
          {/* Wing blades */}
          <path d="M40 70 L25 45 L55 58 Z" fill={bezelStroke} />
          <path d="M120 70 L135 45 L105 58 Z" fill={bezelStroke} />
          {/* Beak */}
          <polygon points="80,95 72,75 88,75" fill={bezelStroke} />
        </g>
      );

    // --- 10 Cute Animals ---
    case 'cute-panda':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#FFFFFF" stroke={bezelStroke} strokeWidth="8" />
          <circle cx="48" cy="42" r="16" fill="#18181B" />
          <circle cx="112" cy="42" r="16" fill="#18181B" />
          <ellipse cx="60" cy="74" rx="12" ry="16" fill="#18181B" transform="rotate(-15 60 74)" />
          <ellipse cx="100" cy="74" rx="12" ry="16" fill="#18181B" transform="rotate(15 100 74)" />
          <circle cx="58" cy="72" r="4" fill="#FFFFFF" />
          <circle cx="98" cy="72" r="4" fill="#FFFFFF" />
          <ellipse cx="80" cy="94" rx="10" ry="7" fill="#18181B" />
          <path d="M72 102 Q80 108 88 102" stroke="#18181B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </g>
      );

    case 'cute-shiba':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#F5A623" stroke={bezelStroke} strokeWidth="8" />
          <polygon points="46,55 35,26 64,40" fill="#F5A623" stroke={bezelStroke} strokeWidth="2" />
          <polygon points="114,55 125,26 96,40" fill="#F5A623" stroke={bezelStroke} strokeWidth="2" />
          <polygon points="46,50 38,32 58,40" fill="#FFFFFF" />
          <polygon points="114,50 122,32 102,40" fill="#FFFFFF" />
          <ellipse cx="62" cy="88" rx="18" ry="15" fill="#FFFFFF" />
          <ellipse cx="98" cy="88" rx="18" ry="15" fill="#FFFFFF" />
          <circle cx="62" cy="72" r="5" fill="#18181B" />
          <circle cx="98" cy="72" r="5" fill="#18181B" />
          <circle cx="60" cy="56" r="4" fill="#FFFFFF" />
          <circle cx="100" cy="56" r="4" fill="#FFFFFF" />
          <polygon points="80,88 74,80 86,80" fill="#18181B" />
        </g>
      );

    case 'cute-red-panda':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#D35400" stroke={bezelStroke} strokeWidth="8" />
          <circle cx="44" cy="40" r="16" fill="#FFFFFF" stroke="#D35400" strokeWidth="3" />
          <circle cx="116" cy="40" r="16" fill="#FFFFFF" stroke="#D35400" strokeWidth="3" />
          <ellipse cx="56" cy="84" rx="14" ry="12" fill="#FFFFFF" />
          <ellipse cx="104" cy="84" rx="14" ry="12" fill="#FFFFFF" />
          <circle cx="60" cy="72" r="5" fill="#18181B" />
          <circle cx="100" cy="72" r="5" fill="#18181B" />
          <polygon points="80,88 74,80 86,80" fill="#18181B" />
          <path d="M40 115 Q80 135 120 115" stroke="#F39C12" strokeWidth="10" strokeLinecap="round" fill="none" />
        </g>
      );

    case 'cute-koala':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#52B788" stroke={bezelStroke} strokeWidth="8" />
          <circle cx="36" cy="52" r="22" fill="#95A5A6" stroke="#FFFFFF" strokeWidth="4" />
          <circle cx="124" cy="52" r="22" fill="#95A5A6" stroke="#FFFFFF" strokeWidth="4" />
          <circle cx="80" cy="84" r="40" fill="#95A5A6" />
          <ellipse cx="80" cy="88" rx="15" ry="24" fill="#18181B" />
          <circle cx="58" cy="76" r="4.5" fill="#18181B" />
          <circle cx="102" cy="76" r="4.5" fill="#18181B" />
        </g>
      );

    case 'cute-hamster':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#F39C12" stroke={bezelStroke} strokeWidth="8" />
          <circle cx="80" cy="80" r="48" stroke="url(#bezel-grad-gold-unlocked)" strokeWidth="3" strokeDasharray="6 4" fill="none" />
          <circle cx="46" cy="38" r="10" fill="#FFA8BA" />
          <circle cx="114" cy="38" r="10" fill="#FFA8BA" />
          <ellipse cx="60" cy="90" rx="16" ry="14" fill="#FFFFFF" />
          <ellipse cx="100" cy="90" rx="16" ry="14" fill="#FFFFFF" />
          <circle cx="62" cy="72" r="4" fill="#18181B" />
          <circle cx="98" cy="72" r="4" fill="#18181B" />
          <circle cx="80" cy="84" r="4" fill="#FFA8BA" />
        </g>
      );

    case 'cute-fennec-fox':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#FAD02C" stroke={bezelStroke} strokeWidth="8" />
          {/* Huge Fennec Ears */}
          <polygon points="40,56 16,14 62,38" fill="#FAD02C" />
          <polygon points="40,52 24,22 56,38" fill="#FF85A2" />
          <polygon points="120,56 144,14 98,38" fill="#FAD02C" />
          <polygon points="120,52 136,22 104,38" fill="#FF85A2" />
          <polygon points="80,105 60,70 100,70" fill="#FFFFFF" />
          <circle cx="64" cy="68" r="5" fill="#18181B" />
          <circle cx="96" cy="68" r="5" fill="#18181B" />
          <circle cx="80" cy="100" r="4" fill="#18181B" />
        </g>
      );

    case 'cute-penguin':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#70D7FF" stroke={bezelStroke} strokeWidth="8" />
          {/* Black Tux Hood */}
          <ellipse cx="80" cy="80" rx="38" ry="46" fill="#18181B" />
          {/* White Belly */}
          <ellipse cx="80" cy="92" rx="26" ry="32" fill="#FFFFFF" />
          {/* Yellow Plumes */}
          <path d="M52 64 Q60 54 72 62" stroke="#FFD60A" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M108 64 Q100 54 88 62" stroke="#FFD60A" strokeWidth="4" strokeLinecap="round" fill="none" />
          <circle cx="66" cy="68" r="3.5" fill="#18181B" />
          <circle cx="94" cy="68" r="3.5" fill="#18181B" />
          <polygon points="80,82 72,74 88,74" fill="#FF9500" />
        </g>
      );

    case 'cute-bunny':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#FFB7B2" stroke={bezelStroke} strokeWidth="8" />
          {/* Long Ears */}
          <ellipse cx="62" cy="35" rx="9" ry="26" fill="#FFFFFF" transform="rotate(-8 62 35)" />
          <ellipse cx="62" cy="35" rx="5" ry="20" fill="#FFB7B2" transform="rotate(-8 62 35)" />
          <ellipse cx="98" cy="35" rx="9" ry="26" fill="#FFFFFF" transform="rotate(8 98 35)" />
          <ellipse cx="98" cy="35" rx="5" ry="20" fill="#FFB7B2" transform="rotate(8 98 35)" />
          {/* Face */}
          <circle cx="80" cy="88" r="36" fill="#FFFFFF" />
          <circle cx="66" cy="82" r="4.5" fill="#18181B" />
          <circle cx="94" cy="82" r="4.5" fill="#18181B" />
          <polygon points="80,94 76,88 84,88" fill="#FF85A2" />
        </g>
      );

    case 'cute-otter':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#00B4D8" stroke={bezelStroke} strokeWidth="8" />
          {/* Otter Head */}
          <circle cx="80" cy="68" r="34" fill="#795548" />
          <ellipse cx="80" cy="74" rx="20" ry="14" fill="#FFFFFF" />
          <circle cx="64" cy="64" r="4" fill="#18181B" />
          <circle cx="96" cy="64" r="4" fill="#18181B" />
          <ellipse cx="80" cy="72" rx="6" ry="4" fill="#18181B" />
          {/* Pearl gem held by paws */}
          <circle cx="80" cy="110" r="15" fill="#00F0FF" stroke="#FFFFFF" strokeWidth="2.5" />
          <circle cx="65" cy="110" r="8" fill="#795548" />
          <circle cx="95" cy="110" r="8" fill="#795548" />
        </g>
      );

    case 'cute-alpaca':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#B388FF" stroke={bezelStroke} strokeWidth="8" />
          {/* Cloud Puffs */}
          <circle cx="55" cy="45" r="14" fill="#FFFFFF" />
          <circle cx="80" cy="38" r="16" fill="#FFFFFF" />
          <circle cx="105" cy="45" r="14" fill="#FFFFFF" />
          {/* Head & Neck */}
          <rect x="68" y="70" width="24" height="48" rx="8" fill="#FFFFFF" />
          <circle cx="80" cy="68" r="22" fill="#FFFFFF" />
          {/* Golden Glasses */}
          <circle cx="70" cy="68" r="10" stroke="url(#bezel-grad-gold-unlocked)" strokeWidth="2.5" fill="none" />
          <circle cx="90" cy="68" r="10" stroke="url(#bezel-grad-gold-unlocked)" strokeWidth="2.5" fill="none" />
          <line x1="78" y1="68" x2="82" y2="68" stroke="url(#bezel-grad-gold-unlocked)" strokeWidth="2.5" />
          <circle cx="70" cy="68" r="3" fill="#18181B" />
          <circle cx="90" cy="68" r="3" fill="#18181B" />
        </g>
      );

    // --- 10 Ocean Animals ---
    case 'ocean-whale':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#03045E" stroke={bezelStroke} strokeWidth="8" />
          {/* Water Spout */}
          <path d="M80 40 C75 22 60 26 62 38" stroke="#00F0FF" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M80 40 C85 22 100 26 98 38" stroke="#00F0FF" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Whale Fuselage */}
          <path d="M30 76 Q60 52 110 65 Q135 75 140 92 Q105 115 50 96 Z" fill="#0077B6" />
          {/* Tail fluke */}
          <polygon points="32,76 18,62 25,85" fill="#0077B6" />
          <polygon points="32,76 18,90 25,85" fill="#0077B6" />
          <circle cx="118" cy="78" r="3.5" fill="#FFFFFF" />
        </g>
      );

    case 'ocean-manta':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#0D1B2A" stroke={bezelStroke} strokeWidth="8" />
          {/* Diamond Wings */}
          <polygon points="80,38 142,75 80,105 18,75" fill="#1B263B" stroke={bezelStroke} strokeWidth="2" />
          <polygon points="80,50 115,75 80,95 45,75" fill="#FFFFFF" opacity="0.85" />
          {/* Cephalic Horns */}
          <polygon points="72,38 68,26 78,35" fill={bezelStroke} />
          <polygon points="88,38 92,26 82,35" fill={bezelStroke} />
          {/* Tail */}
          <line x1="80" y1="105" x2="80" y2="138" stroke={bezelStroke} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );

    case 'ocean-turtle':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#0096C7" stroke={bezelStroke} strokeWidth="8" />
          {/* Flippers */}
          <ellipse cx="45" cy="58" rx="20" ry="8" fill="url(#bezel-grad-gold-unlocked)" transform="rotate(-30 45 58)" />
          <ellipse cx="115" cy="58" rx="20" ry="8" fill="url(#bezel-grad-gold-unlocked)" transform="rotate(30 115 58)" />
          <ellipse cx="50" cy="105" rx="14" ry="6" fill="url(#bezel-grad-gold-unlocked)" transform="rotate(35 50 105)" />
          <ellipse cx="110" cy="105" rx="14" ry="6" fill="url(#bezel-grad-gold-unlocked)" transform="rotate(-35 110 105)" />
          {/* Carapace Dome */}
          <circle cx="80" cy="82" r="32" fill="#2EC4B6" stroke="url(#bezel-grad-gold-unlocked)" strokeWidth="4" />
          <polygon points="80,68 90,75 90,89 80,96 70,89 70,75" fill="none" stroke="url(#bezel-grad-gold-unlocked)" strokeWidth="2.5" />
          {/* Head */}
          <circle cx="80" cy="45" r="10" fill="url(#bezel-grad-gold-unlocked)" />
        </g>
      );

    case 'ocean-dolphin':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#023E8A" stroke={bezelStroke} strokeWidth="8" />
          {/* Sonar Rings */}
          <path d="M45 45 A 25 25 0 0 1 70 30" stroke="#FFD60A" strokeWidth="2.5" fill="none" />
          <path d="M40 50 A 35 35 0 0 1 75 25" stroke="#FFD60A" strokeWidth="2.5" fill="none" />
          {/* Leaping Dolphin */}
          <path d="M30 105 Q70 35 125 65 Q110 95 65 110 Z" fill="#00F0FF" />
          <polygon points="85,55 95,38 98,58" fill="#00F0FF" />
          <circle cx="115" cy="68" r="3" fill="#18181B" />
        </g>
      );

    case 'ocean-hammerhead':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#14213D" stroke={bezelStroke} strokeWidth="8" />
          {/* Fuselage */}
          <path d="M80 40 Q85 85 80 135 Q75 85 80 40 Z" fill="#4A4E69" />
          {/* T-bar Hammerhead */}
          <rect x="36" y="38" width="88" height="18" rx="6" fill="#7E8491" stroke={bezelStroke} strokeWidth="2" />
          <circle cx="42" cy="47" r="4" fill="#FFD60A" />
          <circle cx="118" cy="47" r="4" fill="#FFD60A" />
          <polygon points="80,75 80,95 95,85" fill="#7E8491" />
        </g>
      );

    case 'ocean-seahorse':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#FF6B6B" stroke={bezelStroke} strokeWidth="8" />
          {/* Coronet */}
          <polygon points="78,35 84,26 88,36 94,28 96,38" fill="url(#bezel-grad-gold-unlocked)" />
          {/* Head & Body S-Curve */}
          <path d="M78 40 Q95 48 85 68 Q72 85 86 100 Q95 115 80 128 Q65 120 72 108" stroke="url(#bezel-grad-gold-unlocked)" strokeWidth="12" fill="none" strokeLinecap="round" />
          {/* Snout */}
          <line x1="78" y1="46" x2="62" y2="44" stroke="url(#bezel-grad-gold-unlocked)" strokeWidth="4" strokeLinecap="round" />
          <circle cx="82" cy="42" r="3" fill="#18181B" />
        </g>
      );

    case 'ocean-narwhal':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#005F73" stroke={bezelStroke} strokeWidth="8" />
          {/* Body */}
          <path d="M35 115 Q65 65 115 75 Q125 105 65 125 Z" fill="#94D2BD" />
          {/* Helical Golden Horn */}
          <polygon points="112,75 148,42 118,72" fill="url(#bezel-grad-gold-unlocked)" stroke="#FFFFFF" strokeWidth="1" />
          <circle cx="102" cy="82" r="3.5" fill="#18181B" />
          <circle cx="148" cy="42" r="5" fill="#FFFFFF" opacity="0.8" />
        </g>
      );

    case 'ocean-octopus':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#0A1128" stroke={bezelStroke} strokeWidth="8" />
          {/* Coiling Tentacles */}
          <circle cx="80" cy="95" r="32" stroke="#9D0208" strokeWidth="8" fill="none" strokeDasharray="18 10" />
          {/* Mantle */}
          <ellipse cx="80" cy="65" rx="30" ry="26" fill="#9D0208" />
          {/* Golden Eyes */}
          <ellipse cx="68" cy="72" rx="6" ry="4" fill="#FFD60A" />
          <ellipse cx="92" cy="72" rx="6" ry="4" fill="#FFD60A" />
          <line x1="64" y1="72" x2="72" y2="72" stroke="#18181B" strokeWidth="2" />
          <line x1="88" y1="72" x2="96" y2="72" stroke="#18181B" strokeWidth="2" />
        </g>
      );

    case 'ocean-jellyfish':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#10002B" stroke={bezelStroke} strokeWidth="8" />
          {/* Scalloped Bell Dome */}
          <path d="M42 70 C42 40 118 40 118 70 Q80 85 42 70 Z" fill="#7209B7" />
          <ellipse cx="80" cy="65" rx="18" ry="12" fill="#4CC9F0" opacity="0.85" />
          {/* Flowing Tendril Ribbons */}
          <path d="M55 75 Q50 95 58 125" stroke="#4CC9F0" strokeWidth="2.5" fill="none" />
          <path d="M72 78 Q78 100 70 128" stroke="#4CC9F0" strokeWidth="3" fill="none" />
          <path d="M88 78 Q82 100 90 128" stroke="#4CC9F0" strokeWidth="3" fill="none" />
          <path d="M105 75 Q110 95 102 125" stroke="#4CC9F0" strokeWidth="2.5" fill="none" />
        </g>
      );

    case 'ocean-flying-fish':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#3A0CA3" stroke={bezelStroke} strokeWidth="8" />
          {/* Wave Crest */}
          <path d="M30 110 Q80 85 130 110" stroke="#00F0FF" strokeWidth="4" fill="none" />
          {/* Airplane-like Pectoral Wings */}
          <polygon points="80,75 140,55 95,85" fill={bezelStroke} />
          <polygon points="80,75 20,55 65,85" fill={bezelStroke} />
          {/* Fuselage */}
          <ellipse cx="80" cy="80" rx="42" ry="10" fill="#00F0FF" transform="rotate(-15 80 80)" />
          <circle cx="112" cy="72" r="3.5" fill="#18181B" />
        </g>
      );

    // --- 10 Cartoon Characters ---
    case 'cartoon-wizard':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#3A0CA3" stroke={bezelStroke} strokeWidth="8" />
          {/* Wizard Hat */}
          <polygon points="80,24 50,65 110,65" fill="#240046" stroke={bezelStroke} strokeWidth="2" />
          <ellipse cx="80" cy="65" rx="35" ry="8" fill="url(#bezel-grad-gold-unlocked)" />
          <circle cx="80" cy="24" r="5" fill="#00F0FF" />
          {/* Glasses */}
          <circle cx="68" cy="85" r="9" stroke="url(#bezel-grad-gold-unlocked)" strokeWidth="2.5" fill="none" />
          <circle cx="92" cy="85" r="9" stroke="url(#bezel-grad-gold-unlocked)" strokeWidth="2.5" fill="none" />
          <line x1="77" y1="85" x2="83" y2="85" stroke="url(#bezel-grad-gold-unlocked)" strokeWidth="2.5" />
          {/* Magic Wand */}
          <line x1="105" y1="125" x2="135" y2="95" stroke="url(#bezel-grad-gold-unlocked)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="136" cy="94" r="4" fill="#00F0FF" />
        </g>
      );

    case 'cartoon-astronaut':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#050510" stroke={bezelStroke} strokeWidth="8" />
          {/* White Helmet */}
          <circle cx="80" cy="80" r="42" fill="#FFFFFF" stroke={bezelStroke} strokeWidth="3" />
          {/* Gold Visor */}
          <ellipse cx="80" cy="78" rx="28" ry="20" fill="url(#bezel-grad-gold-unlocked)" />
          <ellipse cx="80" cy="75" rx="22" ry="12" fill="url(#specular-glint)" />
          {/* Side Earpads */}
          <rect x="34" y="72" width="6" height="16" rx="3" fill="#00F0FF" />
          <rect x="120" y="72" width="6" height="16" rx="3" fill="#00F0FF" />
        </g>
      );

    case 'cartoon-mecha':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#0F172A" stroke={bezelStroke} strokeWidth="8" />
          {/* V-Fin Crest */}
          <polygon points="80,55 50,30 65,58" fill="url(#bezel-grad-gold-unlocked)" />
          <polygon points="80,55 110,30 95,58" fill="url(#bezel-grad-gold-unlocked)" />
          <rect x="74" y="52" width="12" height="12" fill="#FA114F" />
          {/* Chiseled Face Mask */}
          <polygon points="80,120 52,80 108,80" fill="#A6FF00" />
          {/* Cyan Sensor Visor */}
          <rect x="56" y="74" width="48" height="10" rx="2" fill="#00F0FF" />
        </g>
      );

    case 'cartoon-knight':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#1D3557" stroke={bezelStroke} strokeWidth="8" />
          {/* Crimson Plume */}
          <path d="M72 45 C65 25 90 20 105 38" stroke="#FA114F" strokeWidth="12" strokeLinecap="round" fill="none" />
          {/* Knight Helmet */}
          <ellipse cx="80" cy="82" rx="36" ry="40" fill={bezelStroke} />
          {/* Golden Visor Slot */}
          <rect x="52" y="78" width="56" height="14" rx="4" fill="url(#bezel-grad-gold-unlocked)" />
          <line x1="56" y1="85" x2="104" y2="85" stroke="#1D3557" strokeWidth="2.5" />
        </g>
      );

    case 'cartoon-prince':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#0F2027" stroke={bezelStroke} strokeWidth="8" />
          {/* Golden Hair Spikes */}
          <polygon points="55,58 45,40 68,52" fill="url(#bezel-grad-gold-unlocked)" />
          <polygon points="72,52 80,32 88,52" fill="url(#bezel-grad-gold-unlocked)" />
          <polygon points="92,52 115,40 105,58" fill="url(#bezel-grad-gold-unlocked)" />
          {/* Face */}
          <circle cx="80" cy="78" r="28" fill="#FFFFFF" />
          <circle cx="70" cy="75" r="3.5" fill="#18181B" />
          <circle cx="90" cy="75" r="3.5" fill="#18181B" />
          {/* Emerald Scarf */}
          <path d="M56 95 Q80 115 104 95 Q120 120 135 110" stroke="#2EC4B6" strokeWidth="8" strokeLinecap="round" fill="none" />
          <circle cx="48" cy="118" r="7" fill="#FF0054" />
        </g>
      );

    case 'cartoon-pirate':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#0077B6" stroke={bezelStroke} strokeWidth="8" />
          {/* Tricorn Hat */}
          <polygon points="80,35 32,68 128,68" fill="#18181B" stroke="url(#bezel-grad-gold-unlocked)" strokeWidth="3" />
          <circle cx="80" cy="56" r="6" fill="url(#bezel-grad-gold-unlocked)" />
          {/* Eye Patch Face */}
          <circle cx="80" cy="88" r="28" fill="#FFFFFF" />
          <circle cx="70" cy="85" r="7" fill="#18181B" />
          <line x1="58" y1="80" x2="102" y2="92" stroke="#18181B" strokeWidth="2" />
          <circle cx="90" cy="85" r="4" fill="#18181B" />
          <circle cx="108" cy="94" r="5" stroke="url(#bezel-grad-gold-unlocked)" strokeWidth="2.5" fill="none" />
        </g>
      );

    case 'cartoon-pixel-hero':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#38B000" stroke={bezelStroke} strokeWidth="8" />
          {/* Pixelated Helmet */}
          <rect x="62" y="32" width="36" height="12" fill="url(#bezel-grad-gold-unlocked)" />
          <rect x="52" y="44" width="56" height="14" fill="url(#bezel-grad-gold-unlocked)" />
          <rect x="44" y="58" width="72" height="16" fill="url(#bezel-grad-gold-unlocked)" />
          {/* Face Block */}
          <rect x="50" y="74" width="60" height="32" fill="#FFFFFF" />
          <rect x="58" y="80" width="10" height="10" fill="#18181B" />
          <rect x="92" y="80" width="10" height="10" fill="#18181B" />
          {/* Pixel Sword */}
          <rect x="105" y="105" width="8" height="8" fill="#00F0FF" />
          <rect x="113" y="97" width="8" height="8" fill="#00F0FF" />
          <rect x="121" y="89" width="8" height="8" fill="#00F0FF" />
        </g>
      );

    case 'cartoon-aviator':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#5C4033" stroke={bezelStroke} strokeWidth="8" />
          {/* Leather Cap */}
          <ellipse cx="80" cy="75" rx="38" ry="32" fill="#8B4513" />
          {/* Brass Goggles */}
          <circle cx="64" cy="72" r="14" stroke="url(#bezel-grad-gold-unlocked)" strokeWidth="3" fill="#00F0FF" />
          <circle cx="96" cy="72" r="14" stroke="url(#bezel-grad-gold-unlocked)" strokeWidth="3" fill="#00F0FF" />
          <line x1="78" y1="72" x2="82" y2="72" stroke="url(#bezel-grad-gold-unlocked)" strokeWidth="3" />
          {/* Wing Propeller at Base */}
          <circle cx="80" cy="118" r="6" fill="url(#bezel-grad-gold-unlocked)" />
          <ellipse cx="62" cy="118" rx="14" ry="4" fill="url(#bezel-grad-gold-unlocked)" />
          <ellipse cx="98" cy="118" rx="14" ry="4" fill="url(#bezel-grad-gold-unlocked)" />
        </g>
      );

    case 'cartoon-elf':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#2D6A4F" stroke={bezelStroke} strokeWidth="8" />
          {/* Pointed Elf Ears */}
          <polygon points="45,72 20,55 48,85" fill="#FFFFFF" />
          <polygon points="115,72 140,55 112,85" fill="#FFFFFF" />
          {/* Leaf Crown */}
          <circle cx="80" cy="78" r="30" fill="#FFFFFF" />
          <path d="M55 60 Q80 45 105 60" stroke="#52B788" strokeWidth="6" strokeLinecap="round" fill="none" />
          <polygon points="80,50 74,60 86,60" fill="#00F0FF" />
          <circle cx="70" cy="78" r="3.5" fill="#2D6A4F" />
          <circle cx="90" cy="78" r="3.5" fill="#2D6A4F" />
        </g>
      );

    case 'cartoon-ninja':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#18181B" stroke={bezelStroke} strokeWidth="8" />
          {/* Headband with Clan Plate */}
          <rect x="36" y="55" width="88" height="14" rx="2" fill="#FA114F" />
          <rect x="62" y="55" width="36" height="14" rx="2" fill="url(#bezel-grad-gold-unlocked)" />
          {/* Mask & Eye Opening */}
          <rect x="48" y="72" width="64" height="14" rx="3" fill="#FFFFFF" />
          <ellipse cx="62" cy="79" rx="6" ry="2.5" fill="#18181B" />
          <ellipse cx="98" cy="79" rx="6" ry="2.5" fill="#18181B" />
          {/* 4-Point Shuriken */}
          <polygon points="80,105 84,115 94,118 84,122 80,132 76,122 66,118 76,115" fill={bezelStroke} />
        </g>
      );

    // 10 Minecraft Characters
    case 'mc-steve':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#00BCD4" stroke={bezelStroke} strokeWidth="8" />
          {/* Steve Face Block */}
          <rect x="52" y="44" width="56" height="54" fill="#D7A17C" />
          {/* Steve Brown Hair */}
          <rect x="52" y="44" width="56" height="18" fill="#4A2E18" />
          <rect x="52" y="62" width="10" height="20" fill="#4A2E18" />
          <rect x="98" y="62" width="10" height="20" fill="#4A2E18" />
          {/* Eyes (White + Indigo pupil) */}
          <rect x="64" y="66" width="10" height="6" fill="#FFFFFF" />
          <rect x="68" y="66" width="6" height="6" fill="#3F51B5" />
          <rect x="86" y="66" width="10" height="6" fill="#FFFFFF" />
          <rect x="86" y="66" width="6" height="6" fill="#3F51B5" />
          {/* Nose & Beard */}
          <rect x="74" y="76" width="12" height="7" fill="#B5734C" />
          <rect x="70" y="86" width="20" height="6" fill="#4A2E18" />
          {/* Diamond Pickaxe Icon */}
          <g transform="translate(86, 92) rotate(-35)">
            <rect x="0" y="0" width="4" height="28" fill="#8D6E63" />
            <path d="M-8 -2 L12 -2 L6 -8 Z" fill="#00F0FF" />
          </g>
        </g>
      );

    case 'mc-alex':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#4CAF50" stroke={bezelStroke} strokeWidth="8" />
          {/* Alex Face Block */}
          <rect x="52" y="44" width="56" height="54" fill="#F5CBA7" />
          {/* Ginger Hair */}
          <rect x="52" y="44" width="56" height="20" fill="#E65100" />
          <rect x="44" y="58" width="12" height="34" fill="#E65100" />
          {/* Green Eyes */}
          <rect x="64" y="66" width="10" height="6" fill="#FFFFFF" />
          <rect x="68" y="66" width="6" height="6" fill="#2E7D32" />
          <rect x="86" y="66" width="10" height="6" fill="#FFFFFF" />
          <rect x="86" y="66" width="6" height="6" fill="#2E7D32" />
          {/* Recurve Bow at bottom */}
          <path d="M96 90 Q112 108 96 126" stroke="#795548" strokeWidth="4" fill="none" />
          <line x1="96" y1="90" x2="96" y2="126" stroke="#FFFFFF" strokeWidth="1.5" />
        </g>
      );

    case 'mc-creeper':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#43A047" stroke={bezelStroke} strokeWidth="8" />
          {/* Lime Green Creeper Head */}
          <rect x="46" y="38" width="68" height="68" fill="#A6FF00" />
          {/* Eyes */}
          <rect x="54" y="50" width="16" height="16" fill="#18181B" />
          <rect x="90" y="50" width="16" height="16" fill="#18181B" />
          {/* Nose */}
          <rect x="72" y="66" width="16" height="20" fill="#18181B" />
          {/* Mouth */}
          <rect x="64" y="86" width="32" height="16" fill="#18181B" />
          <rect x="58" y="86" width="10" height="20" fill="#18181B" />
          <rect x="92" y="86" width="10" height="20" fill="#18181B" />
          {/* TNT Block Accent */}
          <rect x="100" y="102" width="22" height="22" fill="#D32F2F" rx="2" />
          <rect x="100" y="108" width="22" height="8" fill="#FFFFFF" />
          <text x="102" y="115" fontSize="6" fontWeight="bold" fill="#18181B">TNT</text>
        </g>
      );

    case 'mc-enderman':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#0A0A0F" stroke={bezelStroke} strokeWidth="8" />
          {/* Slender Obsidian Head */}
          <rect x="54" y="42" width="52" height="52" fill="#18181B" />
          {/* Glowing Horizontal Magenta Eyes */}
          <rect x="56" y="64" width="18" height="7" fill="#C026D3" />
          <rect x="62" y="64" width="6" height="7" fill="#FFFFFF" />
          <rect x="86" y="64" width="18" height="7" fill="#C026D3" />
          <rect x="92" y="64" width="6" height="7" fill="#FFFFFF" />
          {/* Jaw */}
          <rect x="58" y="86" width="44" height="14" fill="#121216" />
          {/* Ender Pearl Accent */}
          <circle cx="80" cy="118" r="12" fill="#00F0FF" />
          <circle cx="80" cy="118" r="14" stroke="#C026D3" strokeWidth="2.5" fill="none" />
        </g>
      );

    case 'mc-skeleton':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#374151" stroke={bezelStroke} strokeWidth="8" />
          {/* Bone Skull Block */}
          <rect x="50" y="42" width="60" height="60" fill="#FAF9F6" />
          {/* Dark Eye Sockets */}
          <rect x="58" y="54" width="16" height="14" fill="#111827" />
          <rect x="86" y="54" width="16" height="14" fill="#111827" />
          {/* Nose Cavity */}
          <rect x="76" y="70" width="8" height="10" fill="#111827" />
          {/* Tooth Slots */}
          <rect x="64" y="86" width="4" height="12" fill="#111827" />
          <rect x="72" y="86" width="4" height="12" fill="#111827" />
          <rect x="80" y="86" width="4" height="12" fill="#111827" />
          <rect x="88" y="86" width="4" height="12" fill="#111827" />
          <rect x="94" y="86" width="2" height="12" fill="#111827" />
          {/* Wooden Arrow */}
          <line x1="95" y1="102" x2="125" y2="128" stroke="#8D6E63" strokeWidth="3" />
          <polygon points="125,128 120,123 128,122" fill="#D1D5DB" />
        </g>
      );

    case 'mc-zombie':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#1E293B" stroke={bezelStroke} strokeWidth="8" />
          {/* Rotting Green Head Block */}
          <rect x="50" y="42" width="60" height="60" fill="#2E7D32" />
          {/* Dark Moss Hair */}
          <rect x="50" y="42" width="60" height="18" fill="#1B5E20" />
          {/* Sunken Black Eyes */}
          <rect x="58" y="62" width="12" height="8" fill="#0F172A" />
          <rect x="90" y="62" width="12" height="8" fill="#0F172A" />
          {/* Nose & Frown Mouth */}
          <rect x="74" y="72" width="12" height="6" fill="#1B5E20" />
          <rect x="68" y="82" width="24" height="8" fill="#0F172A" />
          {/* Iron Ingot Accent */}
          <rect x="66" y="112" width="28" height="12" rx="2" fill="url(#bezel-grad-silver-unlocked)" stroke="#64748B" strokeWidth="1.5" />
        </g>
      );

    case 'mc-iron-golem':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#475569" stroke={bezelStroke} strokeWidth="8" />
          {/* Heavy Weathered Iron Head */}
          <rect x="48" y="34" width="64" height="74" fill="#E2E8F0" />
          {/* Moss Vines */}
          <rect x="52" y="44" width="16" height="34" fill="#15803D" />
          {/* Heavy Brow */}
          <rect x="46" y="46" width="68" height="12" fill="#CBD5E1" />
          {/* Long Nose */}
          <rect x="73" y="58" width="14" height="34" fill="#B45309" />
          {/* Glowing Red Eyes */}
          <rect x="58" y="58" width="10" height="8" fill="#EF4444" />
          <rect x="92" y="58" width="10" height="8" fill="#EF4444" />
          {/* Red Poppy */}
          <circle cx="106" cy="112" r="9" fill="#FA114F" />
          <line x1="106" y1="121" x2="106" y2="136" stroke="#15803D" strokeWidth="3" />
        </g>
      );

    case 'mc-pig':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#16A34A" stroke={bezelStroke} strokeWidth="8" />
          {/* Pink Pig Head */}
          <rect x="48" y="44" width="64" height="54" fill="#F472B6" />
          {/* Snout */}
          <rect x="64" y="66" width="32" height="18" fill="#DB2777" />
          <rect x="70" y="72" width="6" height="6" fill="#9D174D" />
          <rect x="84" y="72" width="6" height="6" fill="#9D174D" />
          {/* Side Eyes */}
          <rect x="50" y="62" width="12" height="8" fill="#FFFFFF" />
          <rect x="54" y="62" width="6" height="8" fill="#18181B" />
          <rect x="98" y="62" width="12" height="8" fill="#FFFFFF" />
          <rect x="100" y="62" width="6" height="8" fill="#18181B" />
          {/* Golden Carrot */}
          <polygon points="106,128 116,104 122,110" fill="url(#bezel-grad-gold-unlocked)" />
          <rect x="118" y="100" width="8" height="6" fill="#22C55E" />
        </g>
      );

    case 'mc-ender-dragon':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#0F0E17" stroke={bezelStroke} strokeWidth="8" />
          {/* Dragon Skull Block */}
          <rect x="52" y="46" width="56" height="46" fill="#18181B" />
          {/* Twin Horns */}
          <polygon points="56,46 44,24 50,46" fill="#64748B" />
          <polygon points="104,46 116,24 110,46" fill="#64748B" />
          {/* Snout */}
          <rect x="58" y="76" width="44" height="26" fill="#18181B" />
          <rect x="68" y="94" width="24" height="6" fill="#09090B" />
          {/* Glowing Magenta Eyes */}
          <rect x="58" y="58" width="12" height="7" fill="#D946EF" />
          <rect x="90" y="58" width="12" height="7" fill="#D946EF" />
          {/* Dragon Egg Accent */}
          <ellipse cx="80" cy="122" rx="10" ry="14" fill="#18181B" stroke="#D946EF" strokeWidth="2.5" />
        </g>
      );

    case 'mc-axolotl':
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill="#0284C7" stroke={bezelStroke} strokeWidth="8" />
          {/* External Gills (Left & Right 3 Tiers) */}
          <rect x="28" y="52" width="20" height="6" rx="2" fill="#EC4899" />
          <rect x="26" y="62" width="22" height="6" rx="2" fill="#EC4899" />
          <rect x="30" y="72" width="18" height="6" rx="2" fill="#EC4899" />
          <rect x="112" y="52" width="20" height="6" rx="2" fill="#EC4899" />
          <rect x="112" y="62" width="22" height="6" rx="2" fill="#EC4899" />
          <rect x="112" y="72" width="18" height="6" rx="2" fill="#EC4899" />
          {/* Pink Axolotl Head */}
          <rect x="46" y="50" width="68" height="46" rx="4" fill="#FBCFE8" />
          {/* Wide Black Bead Eyes */}
          <rect x="56" y="64" width="8" height="8" fill="#18181B" />
          <rect x="96" y="64" width="8" height="8" fill="#18181B" />
          {/* Axolotl Smile */}
          <rect x="68" y="78" width="24" height="4" rx="2" fill="#EC4899" />
          {/* Water Bucket */}
          <ellipse cx="80" cy="116" rx="12" ry="4" fill="#00F0FF" />
          <path d="M68 116 L72 130 L88 130 L92 116 Z" fill="url(#bezel-grad-silver-unlocked)" />
        </g>
      );

    // 10 Liquid Glass Strike Badges
    case 'strike-3-days':
      return (
        <g>
          <polygon points="80,18 138,48 138,112 80,142 22,112 22,48" fill="#0A2540" stroke={bezelStroke} strokeWidth="7" />
          <polygon points="80,26 130,52 130,108 80,134 30,108 30,52" fill="#00F0FF" opacity="0.8" />
          <path d="M80 40 Q95 65 92 82 Q90 100 80 115 Q70 100 68 82 Q65 65 80 40 Z" fill="#00F0FF" />
          <text x="80" y="82" textAnchor="middle" dominantBaseline="central" fontSize="36" fontWeight="900" fill="#FFFFFF" fontFamily="sans-serif">3</text>
          <rect x="36" y="112" width="88" height="16" rx="4" fill="url(#bezel-grad-gold-unlocked)" />
          <text x="80" y="121" textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="bold" fill="#000000" fontFamily="sans-serif">3 DAYS STRIKE</text>
        </g>
      );

    case 'strike-7-days':
      return (
        <g>
          <polygon points="80,18 138,48 138,112 80,142 22,112 22,48" fill="#7B2CBF" stroke={bezelStroke} strokeWidth="7" />
          <polygon points="80,26 130,52 130,108 80,134 30,108 30,52" fill="#00F0FF" opacity="0.6" />
          <circle cx="80" cy="74" r="32" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeDasharray="6 4" />
          <text x="80" y="74" textAnchor="middle" dominantBaseline="central" fontSize="38" fontWeight="900" fill="#FFFFFF" fontFamily="sans-serif">7</text>
          <rect x="36" y="112" width="88" height="16" rx="4" fill="url(#bezel-grad-gold-unlocked)" />
          <text x="80" y="121" textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="bold" fill="#000000" fontFamily="sans-serif">7 DAYS STRIKE</text>
        </g>
      );

    case 'strike-14-days':
      return (
        <g>
          <polygon points="80,18 138,48 138,112 80,142 22,112 22,48" fill="#0A3A22" stroke={bezelStroke} strokeWidth="7" />
          <polygon points="80,26 130,52 130,108 80,134 30,108 30,52" fill="#00E676" opacity="0.85" />
          <line x1="42" y1="42" x2="118" y2="118" stroke="#FFFFFF" strokeWidth="5" />
          <line x1="118" y1="42" x2="42" y2="118" stroke="#FFFFFF" strokeWidth="5" />
          <text x="80" y="74" textAnchor="middle" dominantBaseline="central" fontSize="34" fontWeight="900" fill="#FFFFFF" fontFamily="sans-serif">14</text>
          <rect x="34" y="112" width="92" height="16" rx="4" fill="url(#bezel-grad-gold-unlocked)" />
          <text x="80" y="121" textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="bold" fill="#000000" fontFamily="sans-serif">14 DAYS STRIKE</text>
        </g>
      );

    case 'strike-30-days':
      return (
        <g>
          <polygon points="80,18 138,48 138,112 80,142 22,112 22,48" fill="#FF6B00" stroke="url(#bezel-grad-gold-unlocked)" strokeWidth="8" />
          <circle cx="80" cy="72" r="36" fill="#FFD60A" opacity="0.9" />
          <text x="80" y="72" textAnchor="middle" dominantBaseline="central" fontSize="34" fontWeight="900" fill="#000000" fontFamily="sans-serif">30</text>
          <rect x="34" y="112" width="92" height="16" rx="4" fill="url(#bezel-grad-gold-unlocked)" />
          <text x="80" y="121" textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="bold" fill="#000000" fontFamily="sans-serif">30 DAYS STRIKE</text>
        </g>
      );

    case 'strike-40-days':
      return (
        <g>
          <polygon points="80,18 138,48 138,112 80,142 22,112 22,48" fill="#3D000F" stroke="url(#bezel-grad-space-gray-unlocked)" strokeWidth="8" />
          <polygon points="80,26 130,52 130,108 80,134 30,108 30,52" fill="#FA114F" opacity="0.85" />
          <ellipse cx="80" cy="72" rx="38" ry="16" stroke="#FFFFFF" strokeWidth="4" fill="none" transform="rotate(-25 80 72)" />
          <text x="80" y="72" textAnchor="middle" dominantBaseline="central" fontSize="34" fontWeight="900" fill="#FFFFFF" fontFamily="sans-serif">40</text>
          <rect x="34" y="112" width="92" height="16" rx="4" fill="url(#bezel-grad-gold-unlocked)" />
          <text x="80" y="121" textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="bold" fill="#000000" fontFamily="sans-serif">40 DAYS STRIKE</text>
        </g>
      );

    case 'strike-50-days':
      return (
        <g>
          <polygon points="80,18 138,48 138,112 80,142 22,112 22,48" fill="#10002B" stroke="url(#bezel-grad-space-gray-unlocked)" strokeWidth="8" />
          <polygon points="80,26 130,52 130,108 80,134 30,108 30,52" fill="#9D4EDD" opacity="0.85" />
          <polygon points="80,36 108,72 80,108 52,72" fill="#E0AAFF" opacity="0.6" />
          <text x="80" y="72" textAnchor="middle" dominantBaseline="central" fontSize="34" fontWeight="900" fill="#FFFFFF" fontFamily="sans-serif">50</text>
          <rect x="34" y="112" width="92" height="16" rx="4" fill="url(#bezel-grad-gold-unlocked)" />
          <text x="80" y="121" textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="bold" fill="#000000" fontFamily="sans-serif">50 DAYS STRIKE</text>
        </g>
      );

    case 'strike-60-days':
      return (
        <g>
          <polygon points="80,18 138,48 138,112 80,142 22,112 22,48" fill="#03045E" stroke={bezelStroke} strokeWidth="8" />
          <polygon points="80,26 130,52 130,108 80,134 30,108 30,52" fill="#48CAE4" opacity="0.85" />
          <polygon points="80,38 114,58 114,94 80,114 46,94 46,58" stroke="#FFFFFF" strokeWidth="3" fill="none" />
          <text x="80" y="72" textAnchor="middle" dominantBaseline="central" fontSize="34" fontWeight="900" fill="#FFFFFF" fontFamily="sans-serif">60</text>
          <rect x="34" y="112" width="92" height="16" rx="4" fill="url(#bezel-grad-gold-unlocked)" />
          <text x="80" y="121" textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="bold" fill="#000000" fontFamily="sans-serif">60 DAYS STRIKE</text>
        </g>
      );

    case 'strike-80-days':
      return (
        <g>
          <polygon points="80,18 138,48 138,112 80,142 22,112 22,48" fill="#240046" stroke={bezelStroke} strokeWidth="8" />
          <polygon points="80,26 130,52 130,108 80,134 30,108 30,52" fill="#FF007F" opacity="0.85" />
          <polygon points="80,32 102,72 80,112 58,72" fill="#FFFFFF" opacity="0.4" />
          <text x="80" y="72" textAnchor="middle" dominantBaseline="central" fontSize="34" fontWeight="900" fill="#FFFFFF" fontFamily="sans-serif">80</text>
          <rect x="34" y="112" width="92" height="16" rx="4" fill="url(#bezel-grad-gold-unlocked)" />
          <text x="80" y="121" textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="bold" fill="#000000" fontFamily="sans-serif">80 DAYS STRIKE</text>
        </g>
      );

    case 'strike-90-days':
      return (
        <g>
          <polygon points="80,18 138,48 138,112 80,142 22,112 22,48" fill="#121212" stroke="url(#bezel-grad-gold-unlocked)" strokeWidth="8" />
          <polygon points="80,26 130,52 130,108 80,134 30,108 30,52" fill="#FFB703" opacity="0.9" />
          {/* Wings */}
          <path d="M40 70 Q15 45 35 30 Q50 50 60 70 Z" fill="url(#bezel-grad-gold-unlocked)" />
          <path d="M120 70 Q145 45 125 30 Q110 50 100 70 Z" fill="url(#bezel-grad-gold-unlocked)" />
          <text x="80" y="72" textAnchor="middle" dominantBaseline="central" fontSize="34" fontWeight="900" fill="#000000" fontFamily="sans-serif">90</text>
          <rect x="34" y="112" width="92" height="16" rx="4" fill="url(#bezel-grad-gold-unlocked)" />
          <text x="80" y="121" textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="bold" fill="#000000" fontFamily="sans-serif">90 DAYS STRIKE</text>
        </g>
      );

    case 'strike-100-days':
      return (
        <g>
          <polygon points="80,18 138,48 138,112 80,142 22,112 22,48" fill="#800080" stroke="url(#bezel-grad-gold-unlocked)" strokeWidth="9" />
          <polygon points="80,26 130,52 130,108 80,134 30,108 30,52" fill="#FFD700" opacity="0.95" />
          {/* Crown */}
          <polygon points="52,42 62,28 72,38 80,22 88,38 98,28 108,42" fill="url(#bezel-grad-gold-unlocked)" stroke="#FFFFFF" strokeWidth="1" />
          <circle cx="80" cy="22" r="3" fill="#00F0FF" />
          <text x="80" y="72" textAnchor="middle" dominantBaseline="central" fontSize="32" fontWeight="900" fill="#000000" fontFamily="sans-serif">100</text>
          <rect x="30" y="112" width="100" height="18" rx="4" fill="url(#bezel-grad-gold-unlocked)" stroke="#FFFFFF" strokeWidth="1" />
          <text x="80" y="121" textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="900" fill="#000000" fontFamily="sans-serif">100 DAYS APEX</text>
        </g>
      );

    default:
      // Generic circular medallion
      return (
        <g>
          <circle cx="80" cy="80" r="58" fill={enamelColor} stroke={bezelStroke} strokeWidth="8" />
          <circle cx="80" cy="80" r="42" fill="url(#specular-glint)" />
        </g>
      );
  }
}

export const BadgePreview: React.FC<BadgePreviewProps> = ({
  badge,
  className = '',
  priority = false,
}) => {
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(() =>
    badgePreviewService.getCachedPreview(badge)
  );
  const [isImgLoaded, setIsImgLoaded] = useState<boolean>(Boolean(snapshotUrl));

  useEffect(() => {
    // Check initial cached snapshot
    const cached = badgePreviewService.getCachedPreview(badge);
    if (cached) {
      setSnapshotUrl(cached);
      setIsImgLoaded(true);
      return;
    }

    // Subscribe to snapshot generation updates
    const unsubscribe = badgePreviewService.subscribe(badge.id, (url) => {
      setSnapshotUrl(url);
    });

    // Enqueue request in the lightweight background generator
    badgePreviewService.requestPreview(badge, priority);

    return () => {
      unsubscribe();
    };
  }, [badge.id, badge.state, badge.colorTheme?.primary, priority]);

  const isLocked = badge.state === 'locked';
  const bezel = badge.colorTheme?.bezel || 'silver';
  const primaryColor = badge.colorTheme?.primary || '#FA114F';

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ minHeight: '160px' }}
    >
      {/* 1. High-Fidelity SVG Vector Silhouette (Immediate, 0ms, Zero Blank Frame) */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none ${
          isImgLoaded ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        <BadgeVectorSilhouette
          styleType={badge.badgeStyle}
          primaryColor={primaryColor}
          bezel={bezel}
          isLocked={isLocked}
        />
      </div>

      {/* 2. Real 3D PBR Studio WebGL Pre-Rendered Snapshot (Crisp WebP/PNG, 0 WebGL Context) */}
      {snapshotUrl && (
        <img
          src={snapshotUrl}
          alt={badge.name}
          onLoad={() => setIsImgLoaded(true)}
          className={`w-40 h-40 object-contain drop-shadow-2xl transition-all duration-500 ease-out pointer-events-none ${
            isImgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}
    </div>
  );
};
