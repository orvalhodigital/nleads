import React from 'react';

interface OtimizzaLogoProps {
    variant?: 'horizontal' | 'vertical' | 'icon';
    className?: string;
    light?: boolean;
}

const OtimizzaLogo: React.FC<OtimizzaLogoProps> = ({ variant = 'horizontal', className = '', light = false }) => {
    // Colors
    const primaryColor = '#F79F1B'; // Amarelo Otimizza
    const textColor = light ? '#FFFFFF' : '#373435'; // Escuro Otimizza or White
    const secondaryTextColor = light ? '#E2E8F0' : '#64748B'; // Muted color

    // SVG Icon (Otimizza "O" with trend arrow)
    const renderIcon = (size: number = 32) => (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
        >
            {/* Gradient definition */}
            <defs>
                <linearGradient id="otimizza-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F79F1B" />
                    <stop offset="100%" stopColor="#F39C12" />
                </linearGradient>
            </defs>
            {/* Outer Circle Ring */}
            <path
                d="M16 4C9.37258 4 4 9.37258 4 16C4 22.6274 9.37258 28 16 28C22.6274 28 28 22.6274 28 16"
                stroke="url(#otimizza-grad)"
                strokeWidth="4"
                strokeLinecap="round"
            />
            {/* Inner upward trend arrow */}
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
            <div className={`inline-flex items-center justify-center ${className}`}>
                {renderIcon(32)}
            </div>
        );
    }

    if (variant === 'vertical') {
        return (
            <div className={`inline-flex flex-col items-center text-center gap-3 ${className}`}>
                {renderIcon(48)}
                <div className="flex flex-col items-center">
                    <span 
                        style={{ color: textColor }} 
                        className="text-2xl font-black tracking-tight font-sans select-none flex items-center gap-1"
                    >
                        Otimizza
                    </span>
                    <span 
                        style={{ color: primaryColor }} 
                        className="text-xs font-extrabold tracking-widest uppercase mt-0.5 select-none"
                    >
                        CRM VEÍCULOS
                    </span>
                </div>
            </div>
        );
    }

    // Default: 'horizontal'
    return (
        <div className={`inline-flex items-center gap-2.5 ${className}`}>
            {renderIcon(32)}
            <div className="flex flex-col items-start leading-none">
                <span 
                    style={{ color: textColor }} 
                    className="text-xl font-black tracking-tight font-sans select-none flex items-center"
                >
                    Otimizza
                    <span 
                        style={{ backgroundColor: primaryColor }} 
                        className="ml-1.5 px-1.5 py-0.5 text-[9px] font-black text-white rounded-md tracking-wider uppercase"
                    >
                        CRM
                    </span>
                </span>
                <span 
                    style={{ color: secondaryTextColor }} 
                    className="text-[9px] font-black tracking-widest uppercase mt-1 select-none"
                >
                    Veículos
                </span>
            </div>
        </div>
    );
};

export const LogoRenderer: React.FC<{
    src?: string | null;
    variant?: 'horizontal' | 'vertical' | 'icon';
    className?: string;
    light?: boolean;
}> = ({ src, variant = 'horizontal', className = '', light = false }) => {
    const isCustom = src && !src.includes('docs.otimizza.pro') && !src.includes('docs.nleads.pro') && !src.includes('nleads-logo');
    if (isCustom) {
        return <img src={src} alt="Logo" className={`${className} object-contain`} />;
    }
    return <OtimizzaLogo variant={variant} className={className} light={light} />;
};

export default OtimizzaLogo;
