import React, { useEffect, useRef } from 'react';
import { AppleBadgeSceneController } from '../three/BadgeScene';
import { BadgePrototypeId, BadgeState, ViewAngle } from '../types/badge';
import { triggerHaptic } from '../utils/haptics';
import { spatialAudio } from '../utils/spatialAudio';

interface BadgeCanvasProps {
  prototypeId: BadgePrototypeId;
  state?: BadgeState;
  viewAngle?: ViewAngle;
  earnedDate?: string;
  badgeTitle?: string;
  colorHex?: number;
  explodedFactor?: number;
  ambientIntensity?: number;
  colorTemperature?: number;
  specularGloss?: number;
  autoEntranceSpin?: boolean;
  onEntranceSpinStateChange?: (isSpinning: boolean) => void;
  className?: string;
  onSceneReady?: (controller: AppleBadgeSceneController) => void;
  onUnlockStepChange?: (step: number, stepName: string) => void;
  onUnlockComplete?: () => void;
}

export const BadgeCanvas: React.FC<BadgeCanvasProps> = ({
  prototypeId,
  state = 'unlocked',
  viewAngle = 'front',
  earnedDate = 'OCTOBER 20, 2019',
  badgeTitle = 'PERFECT WEEK',
  colorHex,
  explodedFactor = 0,
  ambientIntensity,
  colorTemperature,
  specularGloss,
  autoEntranceSpin = true,
  onEntranceSpinStateChange,
  className = '',
  onSceneReady,
  onUnlockStepChange,
  onUnlockComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AppleBadgeSceneController | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const controller = new AppleBadgeSceneController(containerRef.current, {
      prototypeId,
      state,
      viewAngle,
      earnedDate,
      badgeTitle,
      colorHex,
      ambientIntensity,
      colorTemperature,
      specularGloss,
      autoEntranceSpin,
      onEntranceSpinStateChange,
      onUnlockStepChange,
      onUnlockComplete,
    });

    controllerRef.current = controller;
    onSceneReady?.(controller);

    const resizeObserver = new ResizeObserver(() => {
      controller.handleResize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      controller.dispose();
      controllerRef.current = null;
    };
  }, [prototypeId]);

  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.updateOptions({
        state,
        viewAngle,
        earnedDate,
        badgeTitle,
        colorHex,
        ambientIntensity,
        colorTemperature,
        specularGloss,
      });
    }
  }, [state, viewAngle, earnedDate, badgeTitle, colorHex, ambientIntensity, colorTemperature, specularGloss]);

  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.setExplodedView(explodedFactor);
    }
  }, [explodedFactor]);

  return (
    <div
      ref={containerRef}
      onPointerDown={(e) => {
        triggerHaptic('tap');
        const rect = e.currentTarget.getBoundingClientRect();
        const pan = rect.width > 0 ? ((e.clientX - rect.left) / rect.width) * 2 - 1 : 0;
        spatialAudio.playClink('tap', pan);
      }}
      className={`relative select-none overflow-hidden touch-none cursor-grab active:cursor-grabbing ${className}`}
      style={{ minHeight: '200px' }}
    />
  );
};
