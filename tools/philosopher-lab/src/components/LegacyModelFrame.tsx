import React from 'react';
import { LegacyModel } from '../types/philosophy';

interface LegacyModelFrameProps {
  model: LegacyModel;
  onBack: () => void;
}

export const LegacyModelFrame: React.FC<LegacyModelFrameProps> = ({ model, onBack }) => {
  return (
    <div className="fixed inset-0 bg-[#141a22] flex flex-col overflow-hidden">
      <div className="h-[44px] bg-[#17212c] border-b border-[#2c3b4c] flex items-center justify-between px-3 shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="bg-[#f3a52b] hover:bg-[#e0931b] text-[#111] font-semibold rounded-[6px] px-3 py-1 text-[13px] cursor-pointer transition-colors"
          >
            ← 返回总目录
          </button>
          <span className="text-white font-bold text-[14px]">
            #{model.id} {model.title}
          </span>
          <span className="text-[#9fb0c3] text-[12px] hidden sm:inline">
            {model.source}
          </span>
        </div>
        <span className="text-[12px] text-[#7dffb0]">
          原版实时画布 · 原文 {model.quoteCount} 条
        </span>
      </div>
      <iframe
        src={model.htmlAssetPath}
        title={model.title}
        className="w-full flex-1 border-0 bg-black"
      />
    </div>
  );
};
