import React, { useState } from 'react';
import { triggerHaptic } from '../utils/haptics';
import { spatialAudio } from '../utils/spatialAudio';

interface ArchiveHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchiveHubModal: React.FC<ArchiveHubModalProps> = ({ isOpen, onClose }) => {
  const [selectedVersion, setSelectedVersion] = useState<'3.0' | '2.0'>('3.0');
  const [isPreviewActive, setIsPreviewActive] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentFile = selectedVersion === '3.0' ? 'badge3.0.html' : 'badge2.0.html';
  const currentUrl = `/${currentFile}`;

  const handleDownload = async () => {
    triggerHaptic('tap');
    spatialAudio.playClink('facet', 0);
    try {
      const response = await fetch(currentUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = currentFile;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback
      window.open(currentUrl, '_blank');
    }
  };

  const handleCopyLink = () => {
    triggerHaptic('tap');
    const fullUrl = window.location.origin + currentUrl;
    navigator.clipboard?.writeText?.(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#161618] border border-white/[0.14] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#1C1C1E]/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#00F0FF]/20 to-[#FA114F]/20 border border-white/[0.12] flex items-center justify-center">
              <svg className="w-5 h-5 text-[#00F0FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 8v13H3V8M1 3h22v5H1z" />
                <path d="M10 12h4" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">归档文件管理中心</h2>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
                  Version Archives
                </span>
              </div>
              <p className="text-xs text-[#8E8E93] mt-0.5">
                独立单文件完整离线归档 · 双击即可在任意浏览器直接预览
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic('tap');
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all active:scale-95"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Version Switcher Tabs */}
          <div className="flex items-center justify-between bg-[#1C1C1E] p-1.5 rounded-2xl border border-white/[0.08]">
            <div className="flex items-center gap-1.5 w-full">
              <button
                onClick={() => {
                  triggerHaptic('selection');
                  setSelectedVersion('3.0');
                  setIsPreviewActive(false);
                }}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  selectedVersion === '3.0'
                    ? 'bg-white text-black shadow-md'
                    : 'text-[#8E8E93] hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#00F0FF]"></span>
                <span>Badge 3.0 最新归档版 (badge3.0.html)</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-black/10">Latest</span>
              </button>
              <button
                onClick={() => {
                  triggerHaptic('selection');
                  setSelectedVersion('2.0');
                  setIsPreviewActive(false);
                }}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  selectedVersion === '2.0'
                    ? 'bg-white text-black shadow-md'
                    : 'text-[#8E8E93] hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#8E8E93]"></span>
                <span>Badge 2.0 历史归档 (badge2.0.html)</span>
              </button>
            </div>
          </div>

          {/* Action Bar (Download, Live Preview, Open New Tab) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Action 1: In-App Live Preview */}
            <button
              onClick={() => {
                triggerHaptic('tap');
                setIsPreviewActive(!isPreviewActive);
              }}
              className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between group active:scale-[0.98] ${
                isPreviewActive
                  ? 'bg-[#00F0FF]/15 border-[#00F0FF] text-white'
                  : 'bg-[#1C1C1E] border-white/[0.1] hover:border-white/[0.25]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#00F0FF]">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
                <span className="text-[11px] font-bold text-[#00F0FF]">
                  {isPreviewActive ? '正在内嵌预览' : '免弹窗预览'}
                </span>
              </div>
              <div>
                <div className="text-sm font-bold text-white">应用内实时预览</div>
                <div className="text-xs text-[#8E8E93] mt-0.5">直接在此窗口内交互体验，不受iframe拦截</div>
              </div>
            </button>

            {/* Action 2: Direct Local Download */}
            <button
              onClick={handleDownload}
              className="p-4 rounded-2xl bg-[#1C1C1E] border border-white/[0.1] hover:border-[#30D158]/50 transition-all text-left flex flex-col justify-between group active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-[#30D158]/15 flex items-center justify-center text-[#30D158]">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </div>
                <span className="text-[11px] font-bold text-[#30D158]">一键下载</span>
              </div>
              <div>
                <div className="text-sm font-bold text-white">下载单文件 HTML</div>
                <div className="text-xs text-[#8E8E93] mt-0.5">保存到本地电脑，离线即开即用</div>
              </div>
            </button>

            {/* Action 3: Open in New Window */}
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                triggerHaptic('tap');
                spatialAudio.playClink('facet', 0);
              }}
              className="p-4 rounded-2xl bg-[#1C1C1E] border border-white/[0.1] hover:border-white/[0.25] transition-all text-left flex flex-col justify-between group active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </div>
                <span className="text-[11px] font-bold text-[#8E8E93]">新窗口</span>
              </div>
              <div>
                <div className="text-sm font-bold text-white">新标签页打开</div>
                <div className="text-xs text-[#8E8E93] mt-0.5">在独立全屏浏览器标签页中开启</div>
              </div>
            </a>
          </div>

          {/* Embedded In-App Preview Container */}
          {isPreviewActive && (
            <div className="rounded-2xl border border-[#00F0FF]/30 overflow-hidden bg-black shadow-2xl space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="bg-[#1C1C1E] px-4 py-2 border-b border-white/[0.08] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FA114F]"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#A6FF00]"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00F0FF]"></span>
                  <span className="font-mono text-[#8E8E93] ml-2">{currentUrl}</span>
                </div>
                <button
                  onClick={() => setIsPreviewActive(false)}
                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white/80 hover:text-white"
                >
                  收起预览
                </button>
              </div>
              <iframe
                src={currentUrl}
                title={`Live Preview of ${currentFile}`}
                className="w-full h-[520px] border-none bg-black"
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            </div>
          )}

          {/* Version Details & Specifications */}
          <div className="rounded-2xl bg-[#1C1C1E]/60 border border-white/[0.08] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{selectedVersion === '3.0' ? 'Badge 3.0 版本特性' : 'Badge 2.0 版本特性'}</span>
                <span className="text-xs font-normal text-[#8E8E93]">
                  {selectedVersion === '3.0' ? '（2026 最新旗舰版）' : '（历史基线版）'}
                </span>
              </h3>
              <button
                onClick={handleCopyLink}
                className="text-xs text-[#00F0FF] hover:underline flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>{copied ? '已复制路径！' : '复制文件链接'}</span>
              </button>
            </div>

            {selectedVersion === '3.0' ? (
              <ul className="text-xs text-[#8E8E93] space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-[#30D158] font-bold">✓</span>
                  <span>
                    <strong className="text-white">58 款完整 3D 拟物奖章：</strong>
                    新加入 <strong className="text-[#00F0FF]">深渊潜思章鱼 & 量子织网章鱼 (2 款 Octopus)</strong>、<strong className="text-[#70D7FF]">心流澄明水母 & 星云游弋水母 (2 款 Jellyfish)</strong>、<strong className="text-[#FA114F]">苍穹金鹰 (Eagle)</strong> 与 <strong className="text-[#30D158]">阿基米德机械之枭 (Owl)</strong>。
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#30D158] font-bold">✓</span>
                  <span>
                    <strong className="text-white">Apple 级别首次解锁动画：</strong>
                    六阶段动态光影（暗态枪灰神秘入场 -&gt; 珐琅彩流转注色 -&gt; 苹果阻尼弹簧回弹 -&gt; 180°激光镭雕底壳反转检视 -&gt; 回正完成）。
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#30D158] font-bold">✓</span>
                  <span>
                    <strong className="text-white">物理声学与空间音效：</strong>
                    内置 Web Audio API 空间化结晶音阶、解锁号角与金属碰撞音，无需外部音频资源。
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#30D158] font-bold">✓</span>
                  <span>
                    <strong className="text-white">100% 独立离线单文件：</strong>
                    所有样式、几何模型算法与交互脚本均内联封装，随时双击离线预览。
                  </span>
                </li>
              </ul>
            ) : (
              <ul className="text-xs text-[#8E8E93] space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-[#8E8E93] font-bold">•</span>
                  <span>50 款基础奖章目录与三方向对比展示。</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#8E8E93] font-bold">•</span>
                  <span>基础 Three.js 材质与 3D 渲染框架。</span>
                </li>
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#1C1C1E] border-t border-white/[0.08] flex items-center justify-between text-xs text-[#8E8E93]">
          <div>
            本地文件路径: <code className="text-white/80 bg-black/40 px-1.5 py-0.5 rounded">public/{currentFile}</code>
          </div>
          <button
            onClick={() => {
              triggerHaptic('tap');
              onClose();
            }}
            className="px-4 py-1.5 rounded-full bg-white text-black font-semibold hover:bg-white/90 active:scale-95 transition-all"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
