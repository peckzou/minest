import React from 'react';

interface AppleWatchDeviceFrameProps {
  children: React.ReactNode;
  caseColor?: 'midnight' | 'starlight';
  hasBand?: boolean;
  bandColor?: 'black' | 'lightGreen';
  screenSubtitle?: string;
  width?: number;
  height?: number;
  onClick?: () => void;
}

export const AppleWatchDeviceFrame: React.FC<AppleWatchDeviceFrameProps> = ({
  children,
  caseColor = 'midnight',
  hasBand = true,
  bandColor = 'black',
  screenSubtitle,
  width = 290,
  height = 360,
  onClick,
}) => {
  const isMidnight = caseColor === 'midnight';
  const isGreenBand = bandColor === 'lightGreen';

  return (
    <div
      onClick={onClick}
      className="relative flex flex-col items-center select-none"
      style={{ width: `${width}px` }}
    >
      {/* Top Watch Band (Sport Band silhouette from screenshot) */}
      {hasBand && (
        <div
          className="w-28 sm:w-32 h-10 sm:h-12 rounded-t-3xl relative overflow-hidden transition-colors shadow-lg"
          style={{
            backgroundColor: isGreenBand ? '#d1e3d3' : '#1b1d22',
            backgroundImage: isGreenBand
              ? 'linear-gradient(to bottom, #d9ebd9 0%, #b8ceba 100%)'
              : 'linear-gradient(to bottom, #2a2e36 0%, #15181e 100%)',
          }}
        >
          <div className="absolute inset-x-3 top-2 h-full rounded-t-xl opacity-20 border-t border-x border-white" />
        </div>
      )}

      {/* Main Watch Case */}
      <div
        className="relative w-full rounded-[48px] sm:rounded-[56px] p-[8px] sm:p-[10px] shadow-2xl transition-all"
        style={{
          height: `${height}px`,
          backgroundColor: isMidnight ? '#0d1014' : '#d8dade',
          backgroundImage: isMidnight
            ? 'radial-gradient(ellipse at 30% 10%, #2a313d 0%, #0d1014 65%, #05070a 100%)'
            : 'radial-gradient(ellipse at 30% 10%, #ffffff 0%, #c4c8cf 65%, #92979e 100%)',
          boxShadow: isMidnight
            ? '0 25px 50px -12px rgba(0,0,0,0.9), inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -3px 6px rgba(0,0,0,0.8)'
            : '0 25px 50px -12px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.9), inset 0 -3px 6px rgba(0,0,0,0.3)',
        }}
      >
        {/* Right Digital Crown */}
        <div
          className="absolute -right-2.5 top-16 w-3 h-12 rounded-r-md shadow-md flex flex-col justify-between py-1 border-r border-white/20"
          style={{
            backgroundColor: isMidnight ? '#1c222b' : '#b0b5be',
            backgroundImage: isMidnight
              ? 'repeating-linear-gradient(to bottom, #11151a 0px, #11151a 2px, #364152 2px, #364152 4px)'
              : 'repeating-linear-gradient(to bottom, #8f959e 0px, #8f959e 2px, #ffffff 2px, #ffffff 4px)',
          }}
        />

        {/* Right Side Button */}
        <div
          className="absolute -right-1.5 top-32 w-2 h-10 rounded-r-sm"
          style={{
            backgroundColor: isMidnight ? '#161a20' : '#a0a6b0',
          }}
        />

        {/* Inner Curved Glass Bezel */}
        <div className="relative w-full h-full rounded-[42px] sm:rounded-[48px] bg-black p-[4px] sm:p-[6px] overflow-hidden shadow-inner flex flex-col">
          {/* OLED Display Container */}
          <div className="relative w-full h-full rounded-[38px] sm:rounded-[42px] bg-black overflow-hidden flex flex-col">
            {children}
          </div>
        </div>
      </div>

      {/* Bottom Watch Band */}
      {hasBand && (
        <div
          className="w-28 sm:w-32 h-10 sm:h-12 rounded-b-3xl relative overflow-hidden transition-colors shadow-lg"
          style={{
            backgroundColor: isGreenBand ? '#d1e3d3' : '#1b1d22',
            backgroundImage: isGreenBand
              ? 'linear-gradient(to bottom, #b8ceba 0%, #d9ebd9 100%)'
              : 'linear-gradient(to bottom, #15181e 0%, #2a2e36 100%)',
          }}
        >
          <div className="absolute inset-x-3 bottom-2 h-full rounded-b-xl opacity-20 border-b border-x border-white" />
        </div>
      )}

      {/* Subtitle Label */}
      {screenSubtitle && (
        <div className="mt-2 text-center max-w-xs">
          <div className="text-[11px] font-semibold text-white/90 tracking-wide">{screenSubtitle}</div>
        </div>
      )}
    </div>
  );
};
