import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AvatarThemeId,
  OctopusAvatarView,
  AVATAR_THEMES,
  SpeechLipSyncEngine,
} from './octopus';
import {
  AvatarStateType,
  AvatarActionType,
  AvatarExpressionType,
  IAvatarActionAPI,
} from './avatar';
import {
  Smile,
  Heart,
  HelpCircle,
  Zap,
  Moon,
  Flame,
  Coffee,
  Mic,
  MicOff,
  Sparkles,
  Sliders,
  Settings,
  ChevronUp,
  X,
  Radio,
  Play,
  RotateCcw,
} from 'lucide-react';

/**
 * --------------------------------------------------------------------------------
 * 任务 4：全新全屏 Companion UI
 * --------------------------------------------------------------------------------
 * 1. Avatar 为绝对视觉主体（全屏居中沉浸式舞台）
 * 2. 底部轻盈 Floating Glass Control Bar
 * 3. 一级分类：Expression | Action | Voice | More
 * 4. Route A / Route B 规范收纳进 More -> Voice Engine
 * 5. Debug Panel 默认折叠隐藏，仅在 Debug Mode 下以抽屉形式唤出
 * 6. 100% 响应式（Desktop / iPad / iPhone）
 * 7. 严格通过统一 Avatar Action API 驱动，绝不越权访问底层骨骼
 */

export function App() {
  // 当前高层状态
  const [avatarState, setAvatarState] = useState<AvatarStateType>('idle');
  const [currentExpression, setCurrentExpression] = useState<AvatarExpressionType>('neutral');
  const [currentTheme, setCurrentTheme] = useState<AvatarThemeId>('lilac_muse');
  const [activeMenu, setActiveMenu] = useState<'expression' | 'action' | 'more' | null>(null);

  // 语音引擎与路由状态
  const [voiceRoute, setVoiceRoute] = useState<'A' | 'B'>('B');
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [isMicListening, setIsMicListening] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [fps, setFps] = useState(60);

  // 对话历史
  const [transcripts, setTranscripts] = useState<Array<{ role: 'user' | 'ai' | 'sys'; text: string }>>([
    { role: 'sys', text: 'Hi! 我是 Minest AI Companion，随时可以开口和我说话。' }
  ]);
  const [textInput, setTextInput] = useState('');

  // 引用控制器
  const avatarViewRef = useRef<any>(null);
  const speechEngineRef = useRef<SpeechLipSyncEngine | null>(null);

  // 统一 Avatar Action API 适配器桥接
  const getAvatarActionAPI = useCallback((): IAvatarActionAPI | null => {
    const raw = avatarViewRef.current;
    if (!raw) return null;

    // 封装标准 IAvatarActionAPI 接口，隔离下层具体实现
    return {
      setState: (s, dur) => {
        setAvatarState(s);
        raw.setState?.(s as any, dur);
      },
      getState: () => (raw.getState ? (raw.getState() as AvatarStateType) : avatarState),
      playAction: (act) => {
        raw.triggerMicroAction?.(act as any);
      },
      setExpression: (expr, intensity) => {
        setCurrentExpression(expr);
        raw.setEmotion?.(expr as any, intensity);
      },
      getExpression: () => ({ type: currentExpression, intensity: 1.0 }),
      blink: (dbl) => raw.triggerBlink?.(dbl),
      setLookAt: (t) => raw.setLookAt?.(t.x, t.y),
      setAudioAmplitude: (amp) => raw.setAudioAmplitude?.(amp),
      setViseme: (v, w) => raw.setViseme?.(v as any, w),
      poke: (f) => raw.triggerPoke?.(f),
      reset: () => raw.setState?.('idle'),
      dispose: () => raw.dispose?.(),
    };
  }, [avatarState, currentExpression]);

  // 初始化 Speech LipSync 引擎
  useEffect(() => {
    const engine = new SpeechLipSyncEngine({
      onViseme: (code, weight, amplitude) => {
        const api = getAvatarActionAPI();
        if (api) {
          api.setViseme(code as any, weight);
          api.setAudioAmplitude(amplitude);
        }
      },
      onSpeechStart: () => {
        const api = getAvatarActionAPI();
        api?.setState('talking');
      },
      onSpeechEnd: () => {
        const api = getAvatarActionAPI();
        api?.setState('idle');
      },
      onInterrupted: () => {
        const api = getAvatarActionAPI();
        api?.setState('listening');
      },
    });
    speechEngineRef.current = engine;

    return () => {
      engine.stopMicrophone();
      engine.interrupt();
    };
  }, [getAvatarActionAPI]);

  // FPS 计数器
  useEffect(() => {
    let frames = 0;
    let lastTime = performance.now();
    const loop = () => {
      frames++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(Math.round((frames * 1000) / (now - lastTime)));
        frames = 0;
        lastTime = now;
      }
      requestAnimationFrame(loop);
    };
    const req = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(req);
  }, []);

  // --- 操作处理器 (统一由 API 分发) ---
  const handleSetState = (state: AvatarStateType) => {
    const api = getAvatarActionAPI();
    api?.setState(state);
  };

  const handlePlayAction = (action: AvatarActionType) => {
    const api = getAvatarActionAPI();
    api?.playAction(action);
    setActiveMenu(null);
  };

  const handleSetExpression = (expr: AvatarExpressionType) => {
    const api = getAvatarActionAPI();
    api?.setExpression(expr, 1.0);
    setActiveMenu(null);
  };

  const handlePoke = () => {
    const api = getAvatarActionAPI();
    api?.poke(0.4);
  };

  const handleBlink = () => {
    const api = getAvatarActionAPI();
    api?.blink(true);
  };

  // 语音触发
  const handleToggleVoice = async () => {
    const engine = speechEngineRef.current;
    if (!engine) return;

    if (!isVoiceConnected) {
      setIsVoiceConnected(true);
      const success = await engine.startMicrophone();
      if (success) {
        setIsMicListening(true);
        handleSetState('listening');
        setTranscripts((prev) => [...prev, { role: 'sys', text: `已连接 (Route ${voiceRoute} 模式) - 麦克风已就绪` }]);
      } else {
        handleSetState('idle');
      }
    } else {
      engine.stopMicrophone();
      engine.interrupt();
      setIsMicListening(false);
      setIsVoiceConnected(false);
      handleSetState('idle');
      setTranscripts((prev) => [...prev, { role: 'sys', text: '会话已断开。' }]);
    }
  };

  const handleSendText = () => {
    if (!textInput.trim()) return;
    const txt = textInput.trim();
    setTextInput('');
    setTranscripts((prev) => [...prev, { role: 'user', text: txt }]);

    handleSetState('thinking');
    setTimeout(() => {
      handleSetState('talking');
      setTranscripts((prev) => [...prev, { role: 'ai', text: `收到: "${txt}"。我正在以自然姿态陪着你呢！` }]);
      speechEngineRef.current?.speak(txt, 'zh-CN');
    }, 600);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#07060c] text-neutral-100 font-sans select-none flex flex-col justify-between">
      {/* 1. 3D AVATAR 舞台 (绝对视觉主体) */}
      <div 
        className="absolute inset-0 z-0 flex items-center justify-center cursor-grab active:cursor-grabbing"
        onClick={handlePoke}
        title="点击角色体验 Q 弹果冻物理反馈 (Poke)"
      >
        <OctopusAvatarView
          ref={avatarViewRef}
          theme={currentTheme}
          initialState="idle"
          interactive={true}
          cameraDistance={4.6}
          onStateChange={(s) => setAvatarState(s as any)}
          className="w-full h-full"
        />
      </div>

      {/* 2. 顶部精致 HUD (Minimalist Floating Glass Pill) */}
      <header className="relative z-10 w-full px-5 py-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 bg-neutral-900/60 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 shadow-2xl pointer-events-auto">
          <span className={`w-2.5 h-2.5 rounded-full ${isVoiceConnected ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'}`} />
          <span className="text-xs font-semibold tracking-wide text-neutral-200">Minest Pet Companion</span>
          <span className="text-[10px] bg-purple-500/20 text-purple-300 font-mono px-2 py-0.5 rounded-full border border-purple-500/30">
            {avatarState.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setDebugMode(!debugMode)}
            className={`p-2 rounded-full border transition-all ${
              debugMode
                ? 'bg-purple-600/30 border-purple-400/50 text-purple-300'
                : 'bg-neutral-900/60 border-white/10 text-neutral-400 hover:text-white'
            } backdrop-blur-xl`}
            title="切换 Debug 模式"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 3. 展开抽屉菜单 (Expression / Action / More) */}
      {activeMenu && (
        <div className="relative z-20 mx-auto w-[92%] max-w-lg mb-3 bg-neutral-950/85 backdrop-blur-2xl border border-white/15 rounded-3xl p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-300">
              {activeMenu === 'expression' ? '🎭 Expression (表情图层)' : activeMenu === 'action' ? '✨ Actions (程序化动作)' : '⚙️ More Options'}
            </span>
            <button 
              onClick={() => setActiveMenu(null)}
              className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 表情网格 */}
          {activeMenu === 'expression' && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'happy', label: '开心', icon: Smile },
                { id: 'excited', label: '兴奋', icon: Flame },
                { id: 'curious', label: '好奇', icon: HelpCircle },
                { id: 'surprised', label: '惊讶', icon: Zap },
                { id: 'shy', label: '害羞', icon: Coffee },
                { id: 'sleepy', label: '困倦', icon: Moon },
                { id: 'neutral', label: '自然', icon: Sparkles },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSetExpression(item.id as any)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border text-xs transition-all ${
                    currentExpression === item.id
                      ? 'bg-purple-600/30 border-purple-400 text-white'
                      : 'bg-white/5 border-white/5 text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  <item.icon className="w-5 h-5 text-purple-300" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* 动作网格 */}
          {activeMenu === 'action' && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'wave', label: '挥手打招呼' },
                { id: 'scratch_head', label: '挠头思考' },
                { id: 'curl_tip', label: '螺旋卷尖尖' },
                { id: 'tentacle_touch', label: '对对指' },
                { id: 'happy_pop', label: '原地弹跃' },
                { id: 'spiral_dance', label: '海葵舞蹈' },
                { id: 'drum_tap', label: '鼓点轻敲' },
                { id: 'cute_tilt', label: '萌感侧倾' },
                { id: 'shy_cover', label: '触手遮脸' },
              ].map((act) => (
                <button
                  key={act.id}
                  onClick={() => handlePlayAction(act.id as any)}
                  className="p-2.5 rounded-2xl bg-white/5 border border-white/5 hover:bg-purple-600/20 hover:border-purple-400/40 text-xs font-medium text-neutral-200 transition-all text-center"
                >
                  {act.label}
                </button>
              ))}
            </div>
          )}

          {/* 更多设置 (包含 Route A/B 收纳) */}
          {activeMenu === 'more' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-neutral-400 block mb-2 font-medium">Voice Engine 架构切换</label>
                <div className="grid grid-cols-2 gap-2 bg-neutral-900/80 p-1.5 rounded-2xl border border-white/10">
                  <button
                    onClick={() => setVoiceRoute('A')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      voiceRoute === 'A'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5" />
                    Route A (Kwami LiveKit)
                  </button>

                  <button
                    onClick={() => setVoiceRoute('B')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      voiceRoute === 'B'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    Route B (Open LLM Direct)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-2 font-medium">主题色切换</label>
                <div className="flex gap-2">
                  {Object.keys(AVATAR_THEMES).map((th) => (
                    <button
                      key={th}
                      onClick={() => setCurrentTheme(th as any)}
                      className={`flex-1 py-1.5 rounded-xl border text-[11px] font-medium transition-all ${
                        currentTheme === th ? 'border-purple-400 bg-purple-500/20 text-white' : 'border-white/10 text-neutral-400'
                      }`}
                    >
                      {th.split('_')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. 底部轻盈 Floating Glass Control Bar */}
      <footer className="relative z-10 w-full px-5 pb-6 flex flex-col items-center gap-3">
        {/* 文字降级发送条 */}
        <div className="w-full max-w-md flex items-center bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-1.5 shadow-xl">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
            placeholder="和章鱼小宠物说点什么 (中英文均可)..."
            className="flex-1 bg-transparent text-xs text-white placeholder-neutral-500 outline-none px-2"
          />
          <button
            onClick={handleSendText}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-xl transition-all"
          >
            发送
          </button>
        </div>

        {/* 核心主控胶囊 */}
        <nav className="flex items-center gap-1.5 bg-neutral-950/80 backdrop-blur-2xl border border-white/15 px-3 py-2 rounded-full shadow-2xl">
          {/* 麦克风主按钮 */}
          <button
            onClick={handleToggleVoice}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              isVoiceConnected
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
            }`}
          >
            {isVoiceConnected ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isVoiceConnected ? '挂断 Voice' : '开始通话'}</span>
          </button>

          <div className="w-px h-5 bg-white/15 mx-1" />

          {/* 表情切换 */}
          <button
            onClick={() => setActiveMenu(activeMenu === 'expression' ? null : 'expression')}
            className={`px-3.5 py-2 rounded-full text-xs font-medium transition-all ${
              activeMenu === 'expression' ? 'bg-white/20 text-white' : 'text-neutral-300 hover:bg-white/10'
            }`}
          >
            🎭 Expression
          </button>

          {/* 动作切换 */}
          <button
            onClick={() => setActiveMenu(activeMenu === 'action' ? null : 'action')}
            className={`px-3.5 py-2 rounded-full text-xs font-medium transition-all ${
              activeMenu === 'action' ? 'bg-white/20 text-white' : 'text-neutral-300 hover:bg-white/10'
            }`}
          >
            ✨ Action
          </button>

          {/* 快捷自发眨眼 */}
          <button
            onClick={handleBlink}
            className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
            title="触发眨眼 (Blink)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* 更多 */}
          <button
            onClick={() => setActiveMenu(activeMenu === 'more' ? null : 'more')}
            className={`p-2 rounded-full transition-all ${
              activeMenu === 'more' ? 'bg-white/20 text-white' : 'text-neutral-400 hover:text-white hover:bg-white/10'
            }`}
            title="系统设置与引擎路由"
          >
            <Settings className="w-4 h-4" />
          </button>
        </nav>
      </footer>

      {/* 5. DEBUG PANEL (默认隐藏抽屉) */}
      {debugMode && (
        <aside className="absolute top-16 right-5 z-30 w-80 max-h-[70vh] bg-neutral-950/90 backdrop-blur-2xl border border-white/15 rounded-3xl p-4 shadow-2xl flex flex-col gap-3 overflow-y-auto animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-xs font-bold text-amber-400 font-mono">DEBUG TELEMETRY</span>
            <span className="text-[10px] text-neutral-400 font-mono">{fps} FPS</span>
          </div>

          <div className="text-[11px] font-mono space-y-1.5 text-neutral-300">
            <div>Current State: <b className="text-purple-300">{avatarState}</b></div>
            <div>Expression: <b className="text-pink-300">{currentExpression}</b></div>
            <div>Voice Route: <b className="text-blue-300">Route {voiceRoute}</b></div>
            <div>Architecture: <span className="text-emerald-400">Decoupled Action API</span></div>
          </div>

          <div className="pt-2 border-t border-white/10">
            <div className="text-[10px] text-neutral-400 font-semibold mb-1">EVENT LOG:</div>
            <div className="max-h-32 overflow-y-auto text-[10px] font-mono space-y-1 text-neutral-400">
              {transcripts.map((t, idx) => (
                <div key={idx} className={t.role === 'ai' ? 'text-purple-300' : t.role === 'user' ? 'text-sky-300' : 'text-neutral-500'}>
                  [{t.role.toUpperCase()}] {t.text}
                </div>
              ))}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}

export default App;
