import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', showTagline = false }) => {
  const iconSize = size === 'sm' ? 24 : size === 'lg' ? 42 : 32;
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <div className="flex items-center gap-2.5 select-none" id="brand-logo-container">
      <div 
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-rose-500 to-amber-400 p-[2px] shadow-lg shadow-rose-500/20"
        style={{ width: iconSize + 6, height: iconSize + 6 }}
        id="brand-logo-icon"
      >
        <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center overflow-hidden relative">
          {/* Abstract Connection Symbol: Two intersecting orbital loops meeting at center */}
          <svg width={iconSize} height={iconSize} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="16" r="7" stroke="url(#logo_grad_1)" strokeWidth="2.5" />
            <circle cx="21" cy="16" r="7" stroke="url(#logo_grad_2)" strokeWidth="2.5" />
            <circle cx="16" cy="16" r="2.5" fill="#f43f5e" />
            <defs>
              <linearGradient id="logo_grad_1" x1="4" y1="9" x2="18" y2="23" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#f43f5e" />
              </linearGradient>
              <linearGradient id="logo_grad_2" x1="14" y1="9" x2="28" y2="23" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f43f5e" />
                <stop offset="1" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <div className="flex flex-col">
        <div className={`font-extrabold tracking-tight font-sans ${textSize} leading-tight text-white flex items-center gap-1`}>
          <span>TO-GET-HER</span>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block animate-pulse"></span>
        </div>
        {showTagline && (
          <span className="text-[11px] font-medium tracking-widest uppercase text-slate-400 -mt-0.5">
            Meet. Talk. Connect.
          </span>
        )}
      </div>
    </div>
  );
};
