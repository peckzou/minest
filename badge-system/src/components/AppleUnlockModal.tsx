import React, { useState, useRef } from 'react';
import { BadgeModel, BadgePrototypeId, getBadgePrototypeId } from '../types/badge';
import { BadgeCanvas } from './BadgeCanvas';
import { AppleBadgeSceneController } from '../three/BadgeScene';
import { triggerHaptic } from '../utils/haptics';
import { spatialAudio } from '../utils/spatialAudio';

interface AppleUnlockModalProps {
  badge: BadgeModel | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmUnlock?: (badgeId: string) => void;
}

export const AppleUnlockModal: React.FC<AppleUnlockModalProps> = ({
  badge,
  isOpen,
  onClose,
  onConfirmUnlock,
}) => {
  if (!isOpen || !badge) return null;

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [stepName, setStepName] = useState<string>('0. Award earned');
  const controllerRef = useRef<AppleBadgeSceneController | null>(null);

  const protoId: BadgePrototypeId = getBadgePrototypeId(badge.badgeStyle);

  const parsedColor = badge.colorTheme?.primary
    ? parseInt(badge.colorTheme.primary.replace('#', '0x'), 16)
    : undefined;

  const handleReplay = () => {
    triggerHaptic('tap');
    spatialAudio.playClink('facet', 0);
    setIsPlaying(true);
    controllerRef.current?.triggerUnlockSequence();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] text-white flex flex-col items-center justify-between p-6 select-none animate-in fade-in duration-300">
      {/* Top Bar with Done Button */}
      <div className="w-full max-w-lg flex items-center justify-between z-20">
        <div className="text-xs font-semibold uppercase tracking-widest text-[#FA114F]">
          New Award Earned
        </div>
        <button
          onClick={() => {
            triggerHaptic('tap');
            if (badge.id) {
              onConfirmUnlock?.(badge.id);
            }
            onClose();
          }}
          className="px-4 py-1.5 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white text-xs font-semibold transition-all active:scale-95"
        >
          Done
        </button>
      </div>

      {/* 3D Stage */}
      <div className="relative w-full max-w-md h-[400px] flex items-center justify-center my-auto">
        <BadgeCanvas
          prototypeId={protoId}
          state="unlocked"
          viewAngle="front"
          earnedDate={badge.earnedDate}
          badgeTitle={badge.name}
          colorHex={parsedColor}
          className="w-full h-full"
          onSceneReady={(controller) => {
            controllerRef.current = controller;
            controller.triggerUnlockSequence();
          }}
          onUnlockStepChange={(step, name) => {
            triggerHaptic('unlock_step', step);
            setStepName(name);
          }}
          onUnlockComplete={() => {
            triggerHaptic('unlock_complete');
            setIsPlaying(false);
            if (badge.id) {
              onConfirmUnlock?.(badge.id);
            }
          }}
        />
      </div>

      {/* Bottom Info & Replay */}
      <div className="w-full max-w-sm text-center space-y-4 z-10 pb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {badge.name}
          </h2>
          <p className="text-sm text-[#8E8E93] mt-1">
            {badge.description}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleReplay}
            disabled={isPlaying}
            className="px-5 py-2 rounded-full bg-[#1C1C1E] hover:bg-[#2C2C2E] border border-white/[0.08] text-xs font-medium text-white transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>{isPlaying ? 'Sequencing...' : 'Replay Animation'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
