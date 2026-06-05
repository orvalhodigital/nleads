import React from 'react';

interface OtimizzaBrandLogoProps {
  variant?: 'horizontal' | 'vertical' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  colorScheme?: 'light' | 'dark';
  className?: string;
  onClick?: () => void;
  showText?: boolean;
}

const SIZE_MAP = {
  sm: { icon: 24, horizontal: 'h-6', vertical: 'h-12' },
  md: { icon: 32, horizontal: 'h-10', vertical: 'h-16' },
  lg: { icon: 48, horizontal: 'h-16', vertical: 'h-24' },
  xl: { icon: 64, horizontal: 'h-20', vertical: 'h-32' }
};

export const OtimizzaBrandLogo: React.FC<OtimizzaBrandLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  colorScheme = 'light',
  className = '',
  onClick,
  showText = true
}) => {
  const primaryColor = '#F79F1B'; // Amarelo Otimizza
  const textColor = colorScheme === 'light' ? '#373435' : '#FFFFFF';
  const sizes = SIZE_MAP[size];

  const renderIcon = () => (
    <svg
      width={sizes.icon}
      height={sizes.icon}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="otimizza-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor="#F39C12" />
        </linearGradient>
      </defs>
      <path
        d="M16 4C9.37258 4 4 9.37258 4 16C4 22.6274 9.37258 28 16 28C22.6274 28 28 22.6274 28 16"
        stroke="url(#otimizza-grad)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M12 20L20 12M20 12H15M20 12V17"
        stroke="url(#otimizza-grad)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div
        className={`inline-flex items-center justify-center ${className}`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {renderIcon()}
      </div>
    );
  }

  if (variant === 'vertical') {
    return (
      <div
        className={`inline-flex flex-col items-center text-center gap-3 ${className}`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {renderIcon()}
        {showText && (
          <div className="flex flex-col items-center">
            <span
              style={{ color: textColor }}
              className="font-black tracking-tight select-none"
            >
              Otimizza
            </span>
            <span
              style={{ color: primaryColor }}
              className="text-xs font-extrabold tracking-widest uppercase mt-0.5 select-none"
            >
              CRM
            </span>
          </div>
        )}
      </div>
    );
  }

  // Default: horizontal
  return (
    <div
      className={`inline-flex items-center gap-2 ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {renderIcon()}
      {showText && (
        <div className="flex flex-col items-start leading-none">
          <span
            style={{ color: textColor }}
            className="font-black tracking-tight select-none flex items-center text-sm md:text-base"
          >
            Otimizza
            <span
              style={{ backgroundColor: primaryColor }}
              className="ml-1.5 px-1.5 py-0.5 text-[9px] font-black text-white rounded-md tracking-wider uppercase"
            >
              CRM
            </span>
          </span>
        </div>
      )}
    </div>
  );
};

export default OtimizzaBrandLogo;
