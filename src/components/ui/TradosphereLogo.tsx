import React from 'react';
import Image from 'next/image';
import { Shield } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  variant?: 'light' | 'dark' | 'brand';
}

export function TradosphereLogo({
  size = 'md',
  showSubtitle = true,
  className = '',
  variant = 'brand',
}: LogoProps) {
  const iconDimensions = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-14 h-14 text-xl',
  }[size];

  const pixelDimensions = {
    sm: 28,
    md: 36,
    lg: 44,
    xl: 56,
  }[size];

  const titleSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-xl',
  }[size];

  const subSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-[11px]',
    xl: 'text-xs',
  }[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Official Tradosphere Logo Icon */}
      <Image
        src="/logo.svg"
        alt="Tradosphere"
        width={pixelDimensions}
        height={pixelDimensions}
        unoptimized
        priority
        className={`${iconDimensions} object-contain shrink-0`}
      />

      {/* Typography & Regulatory Partnership Attribution */}
      <div className="flex flex-col justify-center">
        <div className={`font-bold tracking-tight text-white leading-tight ${titleSizes}`}>
          Tradosphere
        </div>
        {showSubtitle && (
          <div
            className={`text-amber-400/90 font-medium tracking-wide flex items-center gap-1 ${subSizes}`}
          >
            <Shield className="w-2.5 h-2.5 inline shrink-0 text-amber-400" />
            <span>AP • SMC Global</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default TradosphereLogo;
