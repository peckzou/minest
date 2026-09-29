import React, { useState, useRef, useEffect } from 'react';
import { BadgeModel, ViewAngle, BadgePrototypeId, getBadgePrototypeId } from '../types/badge';
import { BadgeCanvas } from './BadgeCanvas';
import { AppleBadgeSceneController } from '../three/BadgeScene';
import { kelvinToRGBColor } from '../three/materials';
import { triggerHaptic } from '../utils/haptics';
import { spatialAudio } from '../utils/spatialAudio';
import { calculateBadgeRarity, getRarityColor } from '../utils/rarity';

interface AppleAwardDetailViewProps {
  badge: BadgeModel;
  onBack: () => void;
  onTriggerUnlock: (badgeId: string) => void;
}

export const AppleAwardDetailView: React.FC<AppleAwardDetailViewProps> = ({
  badge,
  onBack,
  onTriggerUnlock,
}) => {
  const [viewAngle, setViewAngle] = useState<ViewAngle>('front');
  const [isSpinning, setIsSpinning] = useState<boolean>(true);
  const [isBackView, setIsBackView] = useState<boolean>(false);
  const [explodedFactor, setExplodedFactor] = useState<number>(0);
  const controllerRef = useRef<AppleBadgeSceneController | null>(null);

  // Studio Lighting & Liquid Glass Reflection sliders
  const [ambientIntensity, setAmbientIntensity] = useState<number>(0.72);
  const [colorTemperature, setColorTemperature] = useState<number>(5800); // Kelvin (2700K - 8500K)
  const [specularGloss, setSpecularGloss] = useState<number>(1.0); // 0.5x - 2.0x
  const [showLightingPanel, setShowLightingPanel] = useState<boolean>(false);
  const [activeInspectorTab, setActiveInspectorTab] = useState<'lighting' | 'audio'>('lighting');

  // Spatial Audio State
  const [audioState, setAudioState] = useState(() => spatialAudio.getState());

  useEffect(() => {
    spatialAudio.playChime('celestial');
    return spatialAudio.subscribe((s) => setAudioState(s));
  }, []);

  // Swipe-to-dismiss gesture state
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isDismissing, setIsDismissing] = useState<boolean>(false);
  const [dismissType, setDismissType] = useState<'down' | 'right' | null>(null);

  const gestureStartRef = useRef<{
    x: number;
    y: number;
    time: number;
    isEligible: boolean;
    direction: 'vertical' | 'horizontal' | null;
  }>({
    x: 0,
    y: 0,
    time: 0,
    isEligible: false,
    direction: null,
  });

  // Dynamic light source coordinates tracking mouse over badge
  const [lightCoords, setLightCoords] = useState<{ x: number; y: number; opacity: number }>({
    x: 52,
    y: 38,
    opacity: 0.85,
  });

  const protoId: BadgePrototypeId = getBadgePrototypeId(badge.badgeStyle);

  const rarityInfo = calculateBadgeRarity(badge);
  const effectiveRarity = badge.rarity || rarityInfo.tier;
  const rarityColor = getRarityColor(effectiveRarity);
  const isRareOrMythic = effectiveRarity === 'Legendary' || effectiveRarity === 'Mythic';

  const parsedColor = badge.colorTheme?.primary
    ? parseInt(badge.colorTheme.primary.replace('#', '0x'), 16)
    : undefined;

  // Planckian locus light tint calculated from Color Temperature slider
  const lightRgb = kelvinToRGBColor(colorTemperature);
  const tintR = Math.round(lightRgb.r * 255);
  const tintG = Math.round(lightRgb.g * 255);
  const tintB = Math.round(lightRgb.b * 255);

  const getColorTempDescriptor = (kelvin: number) => {
    if (kelvin <= 3200) return 'Warm Sunset / Tungsten';
    if (kelvin <= 4500) return 'Warm Studio Softbox';
    if (kelvin <= 6500) return 'Neutral Studio Daylight';
    return 'Cool Nordic / Glacial Sky';
  };

  const applyLightingPreset = (ambient: number, kelvin: number, gloss: number) => {
    triggerHaptic('selection');
    spatialAudio.playClink('facet', 0);
    setAmbientIntensity(ambient);
    setColorTemperature(kelvin);
    setSpecularGloss(gloss);
  };

  const resetLightingToDefault = () => {
    triggerHaptic('selection');
    spatialAudio.playClink('facet', 0);
    setAmbientIntensity(0.72);
    setColorTemperature(5800);
    setSpecularGloss(1.0);
  };

  // Keyboard accessibility: ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        triggerHaptic('tap');
        spatialAudio.playClink('tap', 0);
        handleDismiss('down');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDismiss = (type: 'down' | 'right' = 'down') => {
    setIsDismissing(true);
    setDismissType(type);
    triggerHaptic('tap');
    spatialAudio.playClink('tap', 0);
    setTimeout(() => {
      onBack();
    }, 240);
  };

  const handleFlip = () => {
    triggerHaptic('flip');
    controllerRef.current?.flipBadge();
    setIsBackView((prev) => !prev);
  };

  const handleShare = () => {
    triggerHaptic('selection');
    spatialAudio.playClink('facet', 0);
    if (navigator.share) {
      navigator.share({
        title: badge.name,
        text: badge.longDescription,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText?.(badge.name + ' - ' + badge.longDescription);
    }
  };

  const handleBadgePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setLightCoords({ x, y, opacity: 1.0 });
    }
  };

  const handleBadgePointerLeave = () => {
    setLightCoords({ x: 52, y: 38, opacity: 0.75 });
  };

  /**
   * iOS Gesture Handlers for Swipe-to-Dismiss
   */
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // If target is inside canvas or interactive button, don't hijack unless starting from top header, grabber, or edge
    const target = e.target as HTMLElement;
    const isInteractiveButton = target.closest('button');
    if (isInteractiveButton) return;

    const isInsideCanvas = target.closest('.BadgeCanvas');
    const isEdgeSwipe = e.clientX <= 44; // Left screen edge gesture
    const isTopHeaderOrGrabber = e.clientY <= 120 || !!target.closest('.DismissGrabber');
    const isBottomInfo = !!target.closest('.DismissBottomZone');

    if (!isInsideCanvas || isEdgeSwipe || isTopHeaderOrGrabber || isBottomInfo) {
      gestureStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        time: performance.now(),
        isEligible: true,
        direction: null,
      };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!gestureStartRef.current.isEligible || isDismissing) return;

    const deltaX = e.clientX - gestureStartRef.current.x;
    const deltaY = e.clientY - gestureStartRef.current.y;

    // Detect gesture direction
    if (!gestureStartRef.current.direction) {
      if (gestureStartRef.current.x <= 44 && deltaX > 10 && deltaX > Math.abs(deltaY)) {
        gestureStartRef.current.direction = 'horizontal';
        setIsDragging(true);
      } else if (deltaY > 8 && deltaY > Math.abs(deltaX)) {
        gestureStartRef.current.direction = 'vertical';
        setIsDragging(true);
      } else if (deltaX < -15 || deltaY < -15) {
        // Not a dismiss gesture
        gestureStartRef.current.isEligible = false;
        return;
      }
    }

    if (gestureStartRef.current.direction === 'vertical') {
      const positiveY = Math.max(0, deltaY);
      // Soft iOS rubber-band resistance
      const resistedY = positiveY < 180 ? positiveY : 180 + Math.pow(positiveY - 180, 0.82);
      setDragOffset({ x: 0, y: resistedY });
    } else if (gestureStartRef.current.direction === 'horizontal') {
      const positiveX = Math.max(0, deltaX);
      setDragOffset({ x: positiveX, y: 0 });
    }
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!gestureStartRef.current.isEligible || isDismissing) return;

    const elapsed = Math.max(1, performance.now() - gestureStartRef.current.time);
    const deltaX = e.clientX - gestureStartRef.current.x;
    const deltaY = e.clientY - gestureStartRef.current.y;
    const velocityY = deltaY / elapsed;
    const velocityX = deltaX / elapsed;

    const isVerticalDismiss =
      gestureStartRef.current.direction === 'vertical' &&
      (dragOffset.y > 115 || (dragOffset.y > 45 && velocityY > 0.42));

    const isHorizontalDismiss =
      gestureStartRef.current.direction === 'horizontal' &&
      (dragOffset.x > 95 || (dragOffset.x > 40 && velocityX > 0.42));

    if (isVerticalDismiss) {
      handleDismiss('down');
    } else if (isHorizontalDismiss) {
      handleDismiss('right');
    } else {
      // Smooth iOS spring rebound
      setIsDragging(false);
      setDragOffset({ x: 0, y: 0 });
    }

    gestureStartRef.current.isEligible = false;
    gestureStartRef.current.direction = null;
  };

  // Compute interactive spring transforms
  const dragYProgress = Math.min(1, dragOffset.y / 300);
  const dragXProgress = Math.min(1, dragOffset.x / 300);
  const scale = isDismissing
    ? 0.88
    : 1 - dragYProgress * 0.12 - dragXProgress * 0.08;
  const borderRadius = Math.min(48, Math.max(0, dragYProgress * 42 + dragXProgress * 32));
  const backdropOpacity = isDismissing
    ? 0
    : Math.max(0.3, 1 - dragYProgress * 0.55 - dragXProgress * 0.45);

  let transformStyle = '';
  if (isDismissing) {
    transformStyle =
      dismissType === 'right'
        ? `translate3d(100vw, 0, 0)`
        : `translate3d(0, 100vh, 0)`;
  } else {
    transformStyle = `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) scale(${scale})`;
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUpOrCancel}
      onPointerCancel={handlePointerUpOrCancel}
      className="AppleAwardDetailView fixed inset-0 z-50 flex flex-col justify-between overflow-y-auto pb-32 select-none touch-pan-y"
      style={{
        backgroundColor: `rgba(0, 0, 0, ${backdropOpacity})`,
        transition: isDragging ? 'none' : 'background-color 0.28s ease',
      }}
    >
      {/* Interactive Sheet Container with physics transform */}
      <div
        className="w-full flex-1 flex flex-col justify-between overflow-hidden bg-black text-white relative shadow-2xl border-t border-white/[0.08]"
        style={{
          transform: transformStyle,
          borderRadius: `${borderRadius}px`,
          transition: isDragging
            ? 'none'
            : isDismissing
              ? 'transform 0.25s cubic-bezier(0.32, 0, 0.67, 0), border-radius 0.25s ease'
              : 'transform 0.38s cubic-bezier(0.2, 0.9, 0.3, 1), border-radius 0.3s ease',
        }}
      >
        {/* Legendary & Mythic Premium Edge-Light & Background Shimmer */}
        {isRareOrMythic && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 rounded-[inherit]">
            {/* Ambient Rotational Shimmer Rays */}
            <div
              className="absolute -inset-[120%] opacity-25 animate-[spin_24s_linear_infinite]"
              style={{
                background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, ${rarityColor} 45deg, transparent 90deg, ${rarityColor} 180deg, transparent 270deg, ${rarityColor} 315deg, transparent 360deg)`,
                filter: 'blur(90px)',
              }}
            />
            {/* Soft Radial Ambient Backlight */}
            <div
              className="absolute inset-0 opacity-30 animate-pulse"
              style={{
                background: `radial-gradient(circle at 50% 35%, ${rarityColor} 0%, transparent 68%)`,
                animationDuration: '3.5s',
              }}
            />
            {/* Glowing Edge Light Inner Border Frame */}
            <div
              className="absolute inset-0 rounded-[inherit] pointer-events-none transition-all duration-500"
              style={{
                border: `1.5px solid ${rarityColor}65`,
                boxShadow: `inset 0 0 32px ${rarityColor}25, 0 0 45px ${rarityColor}35`,
              }}
            />
          </div>
        )}
        {/* 1. iOS Sheet Top Grabber Handle Bar */}
        <div className="DismissGrabber w-full flex flex-col items-center justify-center pt-2.5 pb-1 cursor-grab active:cursor-grabbing touch-none z-30 group">
          <div
            className={`w-10 h-1.2 rounded-full transition-all duration-200 ${
              isDragging ? 'bg-white/70 w-12 h-1.5' : 'bg-white/30 group-hover:bg-white/50'
            }`}
          />
          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-[#8E8E93]/70 font-medium tracking-wide">
            <svg className="w-3 h-3 text-[#8E8E93]/60 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
            <span>Swipe down to close</span>
          </div>
        </div>

        {/* 2. Authentic Apple Top Header (IMG_2949 & IMG_2950) */}
        <div className="w-full max-w-2xl mx-auto px-5 pt-1 flex items-center justify-between z-20">
          {/* Circular Back Button */}
          <button
            onClick={() => handleDismiss('down')}
            className="w-10 h-10 rounded-full bg-[#1C1C1E]/90 hover:bg-[#2C2C2E] border border-white/[0.08] flex items-center justify-center text-white transition-all active:scale-95 shadow-md"
            title="Back to Awards (ESC)"
          >
            <svg className="w-5 h-5 -ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Center Subdued Title */}
          <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#8E8E93]">
            Minest Awards
          </div>

          {/* Header Action Buttons (Spatial Audio Mute + Share) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic('selection');
                spatialAudio.toggleMute();
              }}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all active:scale-95 shadow-md ${
                audioState.isMuted
                  ? 'bg-[#1C1C1E]/80 text-[#8E8E93] border-white/[0.08]'
                  : 'bg-[#1C1C1E]/95 text-[#00F0FF] border-[#00F0FF]/30 shadow-[#00F0FF]/10'
              }`}
              title={audioState.isMuted ? 'Unmute Spatial Audio & Soundscape' : 'Mute Spatial Audio'}
            >
              {audioState.isMuted ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <div className="relative flex items-center justify-center">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </svg>
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#00F0FF]" />
                </div>
              )}
            </button>

            {/* Circular Share Button */}
            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-[#1C1C1E]/90 hover:bg-[#2C2C2E] border border-white/[0.08] flex items-center justify-center text-white transition-all active:scale-95 shadow-md"
              title="Share Award"
            >
              <svg className="w-4 h-4 -mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </button>
          </div>
        </div>

        {/* 3. Interactive 3D Suspended Medal Stage */}
        <div className="relative w-full max-w-lg mx-auto flex-1 min-h-[380px] sm:min-h-[440px] flex items-center justify-center px-4 my-auto">
          {/* Soft background ambient floor glow */}
          <div className="absolute inset-0 bg-radial from-white/[0.03] via-transparent to-transparent pointer-events-none" />

          {/* BadgeCanvas Container */}
          <div
            onPointerMove={handleBadgePointerMove}
            onPointerLeave={handleBadgePointerLeave}
            className={`BadgeCanvas relative w-full h-full min-h-[380px] sm:min-h-[440px] flex items-center justify-center overflow-hidden rounded-[42px] border transition-all duration-500 ${
              isRareOrMythic ? 'border-transparent' : 'border-white/[0.06]'
            }`}
            style={{
              borderColor: isRareOrMythic ? `${rarityColor}55` : undefined,
              boxShadow: isRareOrMythic
                ? `0 0 32px ${rarityColor}28, inset 0 0 28px ${rarityColor}20, inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.2), inset 0 0 80px 20px rgba(0, 0, 0, 0.88)`
                : 'inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.18), inset 0 0 22px 2px rgba(0, 0, 0, 0.45), inset 0 0 80px 20px rgba(0, 0, 0, 0.88), inset 0 14px 32px -8px rgba(255, 255, 255, 0.05), inset 0 -36px 52px -12px rgba(0, 0, 0, 0.95)',
            }}
          >
            {/* Parabolic dish central shadow ring */}
            <div
              className="absolute w-[300px] h-[300px] rounded-full pointer-events-none opacity-35 blur-3xl"
              style={{
                background: 'radial-gradient(circle, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.45) 55%, transparent 75%)',
              }}
            />

            {/* Subtle Dynamic Radial Gradient Light Source reflecting physical light */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-10"
              style={{
                opacity: lightCoords.opacity,
                background: `radial-gradient(circle 260px at ${lightCoords.x}% ${lightCoords.y}%, rgba(${tintR}, ${tintG}, ${tintB}, ${0.25 * ambientIntensity}) 0%, rgba(${tintR}, ${tintG}, ${tintB}, ${0.08 * ambientIntensity}) 38%, rgba(${tintR}, ${tintG}, ${tintB}, 0) 70%)`,
                mixBlendMode: 'screen',
              }}
            />

            {/* Secondary micro specular glint */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-200 z-10"
              style={{
                opacity: lightCoords.opacity * 0.75,
                background: `radial-gradient(circle 120px at ${lightCoords.x}% ${lightCoords.y}%, rgba(${tintR}, ${tintG}, ${tintB}, ${0.32 * specularGloss}) 0%, rgba(${tintR}, ${tintG}, ${tintB}, 0) 65%)`,
                mixBlendMode: 'overlay',
              }}
            />

            {/* 3D WebGL Canvas */}
            <BadgeCanvas
              prototypeId={protoId}
              state={badge.state}
              viewAngle={viewAngle}
              earnedDate={badge.earnedDate}
              badgeTitle={badge.name}
              colorHex={parsedColor}
              explodedFactor={explodedFactor}
              ambientIntensity={ambientIntensity}
              colorTemperature={colorTemperature}
              specularGloss={specularGloss}
              autoEntranceSpin={true}
              onEntranceSpinStateChange={(spinning) => setIsSpinning(spinning)}
              className="w-full h-full"
              onSceneReady={(controller) => {
                controllerRef.current = controller;
              }}
            />

            {/* Top-Right Stage Controls: Zoom In, Zoom Out, Reset */}
            <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('selection');
                  controllerRef.current?.zoomIn();
                }}
                className="w-8 h-8 rounded-full bg-[#1C1C1E]/80 hover:bg-[#2C2C2E] border border-white/[0.1] flex items-center justify-center text-white/90 hover:text-white transition-all active:scale-95 shadow-md backdrop-blur-sm"
                title="Zoom In (or mouse wheel / pinch)"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('selection');
                  controllerRef.current?.zoomOut();
                }}
                className="w-8 h-8 rounded-full bg-[#1C1C1E]/80 hover:bg-[#2C2C2E] border border-white/[0.1] flex items-center justify-center text-white/90 hover:text-white transition-all active:scale-95 shadow-md backdrop-blur-sm"
                title="Zoom Out"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('selection');
                  controllerRef.current?.resetOrientation();
                }}
                className="w-8 h-8 rounded-full bg-[#1C1C1E]/80 hover:bg-[#2C2C2E] border border-white/[0.1] flex items-center justify-center text-white/90 hover:text-white transition-all active:scale-95 shadow-md backdrop-blur-sm"
                title="Reset Orientation"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              </button>
            </div>

            {/* Top-Left Stage Hint: Entrance Spin or Ready for 360° Hand Drag */}
            <div
              className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md text-[10px] transition-all duration-300 z-20 pointer-events-none ${
                isSpinning
                  ? 'bg-black/80 border border-[#00F0FF]/40 text-[#00F0FF] shadow-sm shadow-[#00F0FF]/20'
                  : 'bg-black/60 border border-white/[0.08] text-[#8E8E93]'
              }`}
            >
              <svg
                className={`w-3 h-3 text-[#00F0FF] ${isSpinning ? 'animate-spin' : ''}`}
                style={isSpinning ? { animationDuration: '1.2s' } : undefined}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                {isSpinning ? (
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                ) : (
                  <>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </>
                )}
              </svg>
              <span className="font-medium tracking-wide">
                {isSpinning ? 'Apple Award • Auto 2× 360° Spin' : 'Ready • Drag 360° to rotate with hand'}
              </span>
            </div>
          </div>

          {/* Floating Quick Action Toolbar: Flip, Preset Angles, Replay */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 flex-wrap justify-center max-w-full px-2">
            {/* Apple 2-Turn Spin Replay Button */}
            <button
              onClick={() => {
                triggerHaptic('selection');
                setIsBackView(false);
                setIsSpinning(true);
                controllerRef.current?.playEntranceSpin(2.1, () => {
                  setIsSpinning(false);
                });
              }}
              disabled={isSpinning}
              className={`px-2.5 py-1 rounded-full border text-[11px] font-medium shadow-md backdrop-blur-md flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 ${
                isSpinning
                  ? 'bg-[#00F0FF]/15 border-[#00F0FF]/40 text-[#00F0FF]'
                  : 'bg-[#1C1C1E]/90 hover:bg-[#2C2C2E] border-white/[0.1] text-white/90 hover:text-white'
              }`}
              title="Play Apple 2-turn entrance spin animation (720°)"
            >
              <svg className={`w-3 h-3 text-[#00F0FF] ${isSpinning ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>{isSpinning ? 'Spinning...' : 'Spin 2×'}</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('selection');
                controllerRef.current?.applyViewAngle('front', false);
                setIsBackView(false);
              }}
              className="px-2.5 py-1 rounded-full bg-[#1C1C1E]/90 hover:bg-[#2C2C2E] border border-white/[0.1] text-[11px] font-medium text-white/80 hover:text-white shadow-md backdrop-blur-md transition-all active:scale-95"
            >
              Front
            </button>

            <button
              onClick={() => {
                triggerHaptic('selection');
                controllerRef.current?.applyViewAngle('angled', false);
                setIsBackView(false);
              }}
              className="px-2.5 py-1 rounded-full bg-[#1C1C1E]/90 hover:bg-[#2C2C2E] border border-white/[0.1] text-[11px] font-medium text-white/80 hover:text-white shadow-md backdrop-blur-md transition-all active:scale-95"
            >
              Angled
            </button>

            <button
              onClick={() => {
                triggerHaptic('selection');
                controllerRef.current?.applyViewAngle('profile', false);
                setIsBackView(false);
              }}
              className="px-2.5 py-1 rounded-full bg-[#1C1C1E]/90 hover:bg-[#2C2C2E] border border-white/[0.1] text-[11px] font-medium text-white/80 hover:text-white shadow-md backdrop-blur-md transition-all active:scale-95"
            >
              Edge
            </button>

            <button
              onClick={handleFlip}
              className="px-3 py-1 rounded-full bg-[#1C1C1E]/95 hover:bg-[#2C2C2E] border border-white/[0.14] text-[11px] font-medium text-white shadow-lg backdrop-blur-md flex items-center gap-1 transition-all active:scale-95"
            >
              <svg className="w-3 h-3 text-[#8E8E93]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 21h5v-5" />
              </svg>
              <span>{isBackView ? 'Front Face' : 'Laser Back'}</span>
            </button>

            {/* Studio Lighting Toggle */}
            <button
              onClick={() => {
                triggerHaptic('selection');
                spatialAudio.playClink('facet', 0);
                if (showLightingPanel && activeInspectorTab === 'lighting') {
                  setShowLightingPanel(false);
                } else {
                  setActiveInspectorTab('lighting');
                  setShowLightingPanel(true);
                }
              }}
              className={`px-3 py-1 rounded-full border text-[11px] font-medium shadow-md backdrop-blur-md flex items-center gap-1.5 transition-all active:scale-95 ${
                showLightingPanel && activeInspectorTab === 'lighting'
                  ? 'bg-amber-400 text-black border-amber-300 font-semibold'
                  : 'bg-[#1C1C1E]/95 hover:bg-[#2C2C2E] border-white/[0.14] text-white/90 hover:text-white'
              }`}
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              <span>Lighting</span>
            </button>

            {/* Spatial Soundscape Audio Toggle */}
            <button
              onClick={() => {
                triggerHaptic('selection');
                spatialAudio.playClink('facet', 0);
                if (showLightingPanel && activeInspectorTab === 'audio') {
                  setShowLightingPanel(false);
                } else {
                  setActiveInspectorTab('audio');
                  setShowLightingPanel(true);
                }
              }}
              className={`px-3 py-1 rounded-full border text-[11px] font-medium shadow-md backdrop-blur-md flex items-center gap-1.5 transition-all active:scale-95 ${
                showLightingPanel && activeInspectorTab === 'audio'
                  ? 'bg-[#00F0FF] text-black border-[#00F0FF] font-semibold'
                  : audioState.isMuted
                    ? 'bg-[#1C1C1E]/95 border-red-500/30 text-[#8E8E93]'
                    : 'bg-[#1C1C1E]/95 hover:bg-[#2C2C2E] border-white/[0.14] text-white/90 hover:text-white'
              }`}
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
              <span>Audio</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('tap');
                spatialAudio.playClink('tap', 0);
                onTriggerUnlock(badge.id);
              }}
              className="px-3 py-1 rounded-full bg-[#FA114F]/20 hover:bg-[#FA114F]/30 border border-[#FA114F]/40 text-[11px] font-medium text-[#FA114F] shadow-lg backdrop-blur-md transition-all active:scale-95"
            >
              Replay
            </button>
          </div>

          {/* Studio Lighting & Spatial Audio Control Sheet */}
          {showLightingPanel && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-x-2 bottom-12 sm:inset-x-4 z-30 bg-[#161618]/95 border border-white/[0.14] rounded-[26px] p-4 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-3 duration-200 select-none max-w-md mx-auto"
            >
              {/* Sheet Header with Segmented Tabs */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/[0.08]">
                <div className="flex items-center gap-1.5 p-0.5 rounded-full bg-white/[0.06] border border-white/[0.06]">
                  <button
                    onClick={() => {
                      triggerHaptic('selection');
                      spatialAudio.playClink('facet', -0.2);
                      setActiveInspectorTab('lighting');
                    }}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-all flex items-center gap-1 ${
                      activeInspectorTab === 'lighting'
                        ? 'bg-amber-400 text-black font-semibold shadow'
                        : 'text-[#8E8E93] hover:text-white'
                    }`}
                  >
                    <span>💡</span>
                    <span>Lighting</span>
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic('selection');
                      spatialAudio.playClink('facet', 0.2);
                      setActiveInspectorTab('audio');
                    }}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-all flex items-center gap-1 ${
                      activeInspectorTab === 'audio'
                        ? 'bg-[#00F0FF] text-black font-semibold shadow'
                        : 'text-[#8E8E93] hover:text-white'
                    }`}
                  >
                    <span>🎧</span>
                    <span>Spatial Sound</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {activeInspectorTab === 'lighting' ? (
                    <button
                      onClick={resetLightingToDefault}
                      className="text-[10px] text-[#8E8E93] hover:text-white px-2 py-0.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] transition-all"
                      title="Reset Lighting to Studio Default"
                    >
                      Reset
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        triggerHaptic('selection');
                        spatialAudio.toggleMute();
                      }}
                      className="text-[10px] text-[#8E8E93] hover:text-white px-2 py-0.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] transition-all"
                    >
                      {audioState.isMuted ? 'Unmute' : 'Mute'}
                    </button>
                  )}
                  <button
                    onClick={() => setShowLightingPanel(false)}
                    className="w-5 h-5 rounded-full bg-white/[0.08] hover:bg-white/20 flex items-center justify-center text-[#8E8E93] hover:text-white text-xs transition-all"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* TAB 1: STUDIO LIGHTING & LIQUID GLASS */}
              {activeInspectorTab === 'lighting' ? (
                <div className="space-y-3">
                  {/* Slider 1: Color Temperature */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#8E8E93] font-medium flex items-center gap-1.5">
                        <span>Color Temperature</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/[0.08] text-white/90">
                          {getColorTempDescriptor(colorTemperature)}
                        </span>
                      </span>
                      <span className="font-semibold text-white font-mono">{colorTemperature}K</span>
                    </div>
                    <input
                      type="range"
                      min="2700"
                      max="8500"
                      step="50"
                      value={colorTemperature}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setColorTemperature(val);
                        spatialAudio.playClink('slider');
                      }}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer focus:outline-none"
                      style={{
                        background: 'linear-gradient(to right, #FF9F0A 0%, #FFE5C4 25%, #FFFFFF 52%, #D4EEFF 75%, #00F0FF 100%)',
                      }}
                    />
                    <div className="flex justify-between text-[9px] text-[#636366]">
                      <span>2700K Warm Sunset</span>
                      <span>5800K Daylight</span>
                      <span>8500K Glacial Blue</span>
                    </div>
                  </div>

                  {/* Slider 2: Ambient Softbox Intensity */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#8E8E93] font-medium">Ambient Light Softbox</span>
                      <span className="font-semibold text-white font-mono">{Math.round(ambientIntensity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.20"
                      max="1.80"
                      step="0.02"
                      value={ambientIntensity}
                      onChange={(e) => {
                        setAmbientIntensity(Number(e.target.value));
                        spatialAudio.playClink('slider');
                      }}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer focus:outline-none"
                      style={{
                        background: 'linear-gradient(to right, #2C2C2E 0%, #8E8E93 50%, #FFFFFF 100%)',
                      }}
                    />
                    <div className="flex justify-between text-[9px] text-[#636366]">
                      <span>20% Deep Contrast</span>
                      <span>72% Studio Default</span>
                      <span>180% High Key</span>
                    </div>
                  </div>

                  {/* Slider 3: Liquid Glass Specular Reflection Gloss */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#8E8E93] font-medium">Liquid Glass Specular Gloss</span>
                      <span className="font-semibold text-white font-mono">{specularGloss.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.50"
                      max="2.00"
                      step="0.05"
                      value={specularGloss}
                      onChange={(e) => {
                        setSpecularGloss(Number(e.target.value));
                        spatialAudio.playClink('slider');
                      }}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer focus:outline-none"
                      style={{
                        background: 'linear-gradient(to right, #5E5CE6 0%, #30D158 50%, #00F0FF 100%)',
                      }}
                    />
                    <div className="flex justify-between text-[9px] text-[#636366]">
                      <span>0.50x Matte Satin</span>
                      <span>1.00x Vitreous Glass</span>
                      <span>2.00x Mirror Glint</span>
                    </div>
                  </div>

                  {/* Quick Studio Presets */}
                  <div className="pt-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                    <button
                      onClick={() => applyLightingPreset(0.85, 3000, 1.2)}
                      className="px-2.5 py-1 rounded-full bg-[#1C1C1E] hover:bg-[#252528] border border-white/[0.08] text-[10px] text-white/90 whitespace-nowrap active:scale-95 transition-all flex items-center gap-1"
                    >
                      <span>☀️</span>
                      <span>Sunset (3000K)</span>
                    </button>
                    <button
                      onClick={() => applyLightingPreset(0.72, 5800, 1.0)}
                      className="px-2.5 py-1 rounded-full bg-[#1C1C1E] hover:bg-[#252528] border border-white/[0.08] text-[10px] text-white/90 whitespace-nowrap active:scale-95 transition-all flex items-center gap-1"
                    >
                      <span>💡</span>
                      <span>Daylight (5800K)</span>
                    </button>
                    <button
                      onClick={() => applyLightingPreset(0.65, 7800, 1.35)}
                      className="px-2.5 py-1 rounded-full bg-[#1C1C1E] hover:bg-[#252528] border border-white/[0.08] text-[10px] text-white/90 whitespace-nowrap active:scale-95 transition-all flex items-center gap-1"
                    >
                      <span>❄️</span>
                      <span>Nordic (7800K)</span>
                    </button>
                    <button
                      onClick={() => applyLightingPreset(0.35, 8500, 1.8)}
                      className="px-2.5 py-1 rounded-full bg-[#1C1C1E] hover:bg-[#252528] border border-white/[0.08] text-[10px] text-white/90 whitespace-nowrap active:scale-95 transition-all flex items-center gap-1"
                    >
                      <span>🌙</span>
                      <span>Void (8500K)</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* TAB 2: SPATIAL AUDIO SOUNDSCAPE & CHIME/CLINK SYNTHESIS */
                <div className="space-y-3">
                  {/* Soundscape Ambient Presence Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#8E8E93] font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
                        <span>Ambient Soundscape Presence</span>
                      </span>
                      <span className="font-semibold text-white font-mono">
                        {Math.round(audioState.soundscapeVolume * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="0.4"
                      step="0.01"
                      value={audioState.soundscapeVolume}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        spatialAudio.setSoundscapeVolume(val);
                        spatialAudio.playClink('slider');
                      }}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer focus:outline-none"
                      style={{
                        background: 'linear-gradient(to right, #1C1C1E 0%, #00F0FF 50%, #5E5CE6 100%)',
                      }}
                    />
                    <div className="flex justify-between text-[9px] text-[#636366]">
                      <span>0% Silent</span>
                      <span>12% Subtle Studio Resonance</span>
                      <span>40% Enveloping Air</span>
                    </div>
                  </div>

                  {/* Acoustic Temperature Coupling Info Card */}
                  <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[10px] space-y-1.5">
                    <div className="flex items-center justify-between text-white/90 font-medium">
                      <span className="flex items-center gap-1.5">
                        <span>Acoustic Temperature Sync</span>
                      </span>
                      <span className="font-mono text-[#00F0FF]">{colorTemperature}K</span>
                    </div>
                    <p className="text-[#8E8E93] leading-relaxed text-[9.5px]">
                      The Web Audio filter dynamically tracks light color temperature: warm amber tones roll off high frequencies (~{Math.round(800 + (colorTemperature - 2700) * 0.35)}Hz lowpass) while cool daylight opens shimmering crystalline overtones.
                    </p>
                  </div>

                  {/* High-Fidelity Audio Triggers */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] uppercase font-semibold text-[#8E8E93] tracking-wider">
                      Interactive High-Fidelity Triggers
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          triggerHaptic('tap');
                          spatialAudio.playClink('tap', -0.3);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-[11px] text-white/90 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        <span>🪙</span>
                        <span>Medal Clink</span>
                      </button>

                      <button
                        onClick={() => {
                          triggerHaptic('flip');
                          spatialAudio.playClink('flip', 0.3);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-[11px] text-white/90 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        <span>🛡️</span>
                        <span>Backplate Clink</span>
                      </button>

                      <button
                        onClick={() => {
                          triggerHaptic('unlock_step', 4);
                          spatialAudio.playChime('unlock_step', 5);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-[11px] text-white/90 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        <span>🔔</span>
                        <span>Facet Chime</span>
                      </button>

                      <button
                        onClick={() => {
                          triggerHaptic('unlock_complete');
                          spatialAudio.playChime('unlock_fanfare');
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/30 text-[11px] text-[#00F0FF] font-medium active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        <span>✨</span>
                        <span>Unlock Fanfare</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. Authentic Apple Award Description (Strictly matching IMG_2949 & IMG_2950) */}
        <div className="DismissBottomZone w-full max-w-md mx-auto px-6 text-center space-y-2.5 z-10 pt-2 pb-6 cursor-grab">
          {/* Color-Coded Rarity Badge */}
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <span
              className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border shadow-md backdrop-blur-md transition-all"
              style={{
                backgroundColor: `${rarityColor}1A`,
                color: rarityColor,
                borderColor: `${rarityColor}45`,
                boxShadow: `0 0 16px ${rarityColor}20`,
              }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: rarityColor, boxShadow: `0 0 8px ${rarityColor}` }}
              />
              <span>{effectiveRarity} AWARD</span>
              <span className="text-[10px] opacity-75 font-mono font-medium border-l border-current/30 pl-2">
                {rarityInfo.rankBadgeText}
              </span>
            </span>
          </div>

          <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight text-white leading-tight">
            {badge.name}
          </h1>

          <p className="text-[15px] text-[#8E8E93] leading-relaxed max-w-sm mx-auto">
            {badge.longDescription}
          </p>

          {/* Physical Craftsmanship Spec Strip */}
          <div className="pt-3 flex items-center justify-center gap-3 text-[11px] text-[#636366] font-medium border-t border-white/[0.06] mt-3 flex-wrap">
            <span>{badge.depthMetrics.thickness}</span>
            <span>•</span>
            <span>{badge.depthMetrics.curvature}</span>
            <span>•</span>
            <span>Bezel: Mirror {badge.colorTheme.bezel.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
