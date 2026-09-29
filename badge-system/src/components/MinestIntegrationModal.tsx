import React, { useState } from 'react';
import { triggerHaptic } from '../utils/haptics';

interface MinestIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MinestIntegrationModal: React.FC<MinestIntegrationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'iframe' | 'react' | 'postmessage' | 'url'>('iframe');

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-iy5etp3ruh7et6mk4yggge-867932209015.us-east1.run.app';

  const iframeSnippet = `<!-- 1. 在你的 Minest 仓库的 Award 模态框或弹窗中直接嵌入 -->
<div class="minest-award-modal">
  <iframe
    src="${currentUrl}?embed=true"
    title="Minest 3D Awards"
    style="width: 100%; height: 100vh; border: none; background: #000000;"
    allow="accelerometer; gyroscope"
  />
</div>`;

  const reactSnippet = `// 在 Minest 项目的 勋章/Award 按钮组件中：
import React, { useState } from 'react';

export function MinestAwardButton() {
  const [showAwards, setShowAwards] = useState(false);

  return (
    <>
      {/* Minest 原有勋章按钮 */}
      <button 
        onClick={() => setShowAwards(true)}
        className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40 hover:bg-amber-500/30 transition-all"
      >
        🏅 查看成就勋章 (Award)
      </button>

      {/* 沉浸式 3D 勋章弹窗 */}
      {showAwards && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col">
          <div className="flex justify-end p-4">
            <button 
              onClick={() => setShowAwards(false)}
              className="px-3 py-1.5 rounded-full bg-white/10 text-white text-sm hover:bg-white/20"
            >
              关闭
            </button>
          </div>
          <iframe
            src="${currentUrl}?embed=true"
            className="w-full flex-1 border-none"
            allow="accelerometer; gyroscope"
          />
        </div>
      )}
    </>
  );
}`;

  const postMessageSnippet = `// 父子窗口双向事件通信（Minest 与 3D 徽章系统互通）
// 1. 父应用 (Minest) 监听徽章系统发出的事件
window.addEventListener('message', (event) => {
  const { type, badgeId, title } = event.data || {};
  
  if (type === 'MINEST_AWARD_SELECTED') {
    console.log('用户查看了勋章:', badgeId, title);
  }
  if (type === 'MINEST_AWARD_UNLOCKED') {
    console.log('用户成功解锁了勋章:', badgeId);
    // 可以在 Minest 后端同步记录该成就
  }
  if (type === 'MINEST_REQUEST_CLOSE') {
    // 关闭 Minest 中的模态框
  }
});

// 2. 父应用 (Minest) 向徽章系统发送指令（如直接打开特定勋章）
const iframe = document.querySelector('iframe');
iframe.contentWindow.postMessage({
  type: 'MINEST_OPEN_AWARD',
  badgeId: 'steve' // 支持如 'steve', 'alex', 'creeper', 'quantum-octopus' 等
}, '*');`;

  const urlParamsSnippet = `# URL 参数支持说明：
# 1. 嵌入模式（隐藏外层导航，极简适合弹窗）：
${currentUrl}?embed=true

# 2. 直接打开指定勋章的 3D 详情弹窗（例如 Steve）：
${currentUrl}?embed=true&award=steve

# 3. 指定默认打开的分类 Tab：
${currentUrl}?embed=true&tab=awards     # 勋章墙
${currentUrl}?embed=true&tab=summary    # 数据总览
${currentUrl}?embed=true&tab=decks      # 勋章流转展柜`;

  const copyToClipboard = (text: string, index: number) => {
    triggerHaptic('selection');
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#1C1C1E] border border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#2C2C2E]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-base">
              🔗
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                链接至 Minest 仓库 Award 按钮
              </h2>
              <p className="text-xs text-[#8E8E93]">
                集成说明与即插即用代码片段
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('tap');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex px-6 pt-3 border-b border-white/[0.06] bg-[#161618] gap-2 overflow-x-auto scrollbar-none">
          {[
            { id: 'iframe', label: 'Iframe 嵌入 (推荐)' },
            { id: 'react', label: 'React 组件' },
            { id: 'postmessage', label: 'postMessage 通信' },
            { id: 'url', label: 'URL 参数' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('selection');
                setActiveTab(tab.id as any);
              }}
              className={`px-3 py-2 text-xs font-medium rounded-t-lg transition-all border-b-2 -mb-px whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#00F0FF] text-[#00F0FF] bg-white/[0.04]'
                  : 'border-transparent text-[#8E8E93] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-sm space-y-4 font-sans scrollbar-none">
          {activeTab === 'iframe' && (
            <div className="space-y-3">
              <p className="text-xs text-[#A1A1A6] leading-relaxed">
                无需修改复杂逻辑，在你的 Minest 前端页面的勋章按钮或 Award 弹窗中加入以下 Iframe，即可秒级接入本套完整 Apple 物理工艺 3D 勋章系统：
              </p>
              <div className="relative">
                <pre className="p-3.5 bg-black/60 rounded-xl border border-white/[0.08] text-xs text-white/90 overflow-x-auto font-mono">
                  {iframeSnippet}
                </pre>
                <button
                  onClick={() => copyToClipboard(iframeSnippet, 1)}
                  className="absolute top-2.5 right-2.5 px-2.5 py-1 text-xs rounded-md bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
                >
                  {copiedIndex === 1 ? '已复制 ✓' : '复制代码'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'react' && (
            <div className="space-y-3">
              <p className="text-xs text-[#A1A1A6] leading-relaxed">
                如果在 Minest 项目中你使用 React / Next.js / Vite，可以直接将下面的按钮与弹窗模态封装为组件：
              </p>
              <div className="relative">
                <pre className="p-3.5 bg-black/60 rounded-xl border border-white/[0.08] text-xs text-white/90 overflow-x-auto font-mono max-h-[300px]">
                  {reactSnippet}
                </pre>
                <button
                  onClick={() => copyToClipboard(reactSnippet, 2)}
                  className="absolute top-2.5 right-2.5 px-2.5 py-1 text-xs rounded-md bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
                >
                  {copiedIndex === 2 ? '已复制 ✓' : '复制代码'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'postmessage' && (
            <div className="space-y-3">
              <p className="text-xs text-[#A1A1A6] leading-relaxed">
                当前 3D 勋章系统已原生内置 <code className="text-[#00F0FF]">window.postMessage</code> 双向通信通道，Minest 宿主可以通过消息指令远程触发勋章展示或接收解锁通知：
              </p>
              <div className="relative">
                <pre className="p-3.5 bg-black/60 rounded-xl border border-white/[0.08] text-xs text-white/90 overflow-x-auto font-mono max-h-[300px]">
                  {postMessageSnippet}
                </pre>
                <button
                  onClick={() => copyToClipboard(postMessageSnippet, 3)}
                  className="absolute top-2.5 right-2.5 px-2.5 py-1 text-xs rounded-md bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
                >
                  {copiedIndex === 3 ? '已复制 ✓' : '复制代码'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'url' && (
            <div className="space-y-3">
              <p className="text-xs text-[#A1A1A6] leading-relaxed">
                通过在 URL 中附加参数，可以直接在启动时定位到特定勋章或视图模式：
              </p>
              <div className="relative">
                <pre className="p-3.5 bg-black/60 rounded-xl border border-white/[0.08] text-xs text-white/90 overflow-x-auto font-mono max-h-[300px]">
                  {urlParamsSnippet}
                </pre>
                <button
                  onClick={() => copyToClipboard(urlParamsSnippet, 4)}
                  className="absolute top-2.5 right-2.5 px-2.5 py-1 text-xs rounded-md bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
                >
                  {copiedIndex === 4 ? '已复制 ✓' : '复制代码'}
                </button>
              </div>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-[#8E8E93] space-y-1">
            <div className="font-semibold text-white/80">💡 为什么 AI 无法自动直接修改你的私有 GitHub 仓库？</div>
            <div>
              因为 AI 处于安全的沙盒运行环境，未持有你 GitHub 的私有写入 Token 或 SSH 密钥，GitHub 的安全防护机制禁止未授权的外部访问。
              通过上述提供的三种接入方案（Iframe 嵌入、组件集成、双向 PostMessage），你可以 1 分钟内在 Minest 中完美唤起 3D 勋章！
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/[0.08] bg-[#161618] flex items-center justify-between">
          <span className="text-xs text-[#8E8E93]">
            当前部署链接：<span className="text-white font-mono">{currentUrl}</span>
          </span>
          <button
            onClick={() => {
              triggerHaptic('tap');
              onClose();
            }}
            className="px-4 py-1.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-white/90 transition-all active:scale-95"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
