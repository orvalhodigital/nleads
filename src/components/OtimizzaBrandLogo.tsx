import React from 'react';
import logoOrvalho from '../assets/branding/logos/logo-orvalho.png';
import logoOrvalhoBranca from '../assets/branding/logos/logo-orvalho-branca.png';
import simboloOrvalho from '../assets/branding/logos/simbolo-orvalho.png';

interface OtimizzaBrandLogoProps {
  variant?: 'horizontal' | 'vertical' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  colorScheme?: 'light' | 'dark';
  className?: string;
  onClick?: () => void;
  showText?: boolean;
}

const SIZE_MAP = {
  sm: { icon: 'h-6', horizontal: 'h-6', vertical: 'h-12' },
  md: { icon: 'h-8', horizontal: 'h-10', vertical: 'h-16' },
  lg: { icon: 'h-12', horizontal: 'h-16', vertical: 'h-24' },
  xl: { icon: 'h-16', horizontal: 'h-20', vertical: 'h-32' }
};

export const OtimizzaBrandLogo: React.FC<OtimizzaBrandLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  colorScheme = 'light',
  className = '',
  onClick,
  showText = true
}) => {
  const sizes = SIZE_MAP[size];
  const isDark = colorScheme === 'dark';

  const handleClickProps = onClick ? {
    onClick,
    role: 'button',
    tabIndex: 0,
    className: `cursor-pointer ${className}`
  } : {
    className
  };

  if (variant === 'icon') {
    return (
      <img
        src={simboloOrvalho}
        alt="Orvalho Digital Icon"
        className={`${sizes.icon} w-auto object-contain shrink-0`}
        {...handleClickProps}
      />
    );
  }

  if (variant === 'vertical') {
    return (
      <div 
        className="flex flex-col items-center gap-2"
        {...handleClickProps}
      >
        <img
          src={isDark ? logoOrvalhoBranca : logoOrvalho}
          alt="Orvalho Digital Vertical"
          className={`${sizes.vertical} w-auto object-contain shrink-0`}
        />
      </div>
    );
  }

  // Default: horizontal
  return (
    <img
      src={isDark ? logoOrvalhoBranca : logoOrvalho}
      alt="Orvalho Digital Horizontal"
      className={`${sizes.horizontal} w-auto object-contain shrink-0`}
      {...handleClickProps}
    />
  );
};

export default OtimizzaBrandLogo;
