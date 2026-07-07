import React from 'react';
import logoOrvalho from '../assets/branding/logos/logo-orvalho.png';
import logoOrvalhoBranca from '../assets/branding/logos/logo-orvalho-branca.png';
import simboloOrvalho from '../assets/branding/logos/simbolo-orvalho.png';

interface OtimizzaLogoProps {
    variant?: 'horizontal' | 'vertical' | 'icon';
    className?: string;
    light?: boolean;
}

const OtimizzaLogo: React.FC<OtimizzaLogoProps> = ({ variant = 'horizontal', className = '', light = false }) => {
    // Select the correct image source based on variant and light/dark theme
    // light=true means we want the light/white version (e.g. logo-orvalho-branca) for dark backgrounds.
    // light=false means we want the default colored version (logo-orvalho) for light backgrounds.
    
    if (variant === 'icon') {
        return (
            <img 
                src={simboloOrvalho} 
                alt="Orvalho Digital" 
                className={`h-8 w-auto shrink-0 object-contain ${className}`}
            />
        );
    }

    if (variant === 'vertical') {
        return (
            <div className={`flex flex-col items-center gap-2 ${className}`}>
                <img 
                    src={light ? logoOrvalhoBranca : logoOrvalho} 
                    alt="Orvalho Digital" 
                    className="h-16 w-auto object-contain shrink-0"
                />
            </div>
        );
    }

    // Default: 'horizontal'
    return (
        <img 
            src={light ? logoOrvalhoBranca : logoOrvalho} 
            alt="Orvalho Digital" 
            className={`h-10 w-auto object-contain shrink-0 ${className}`}
        />
    );
};

export const LogoRenderer: React.FC<{
    src?: string | null;
    variant?: 'horizontal' | 'vertical' | 'icon';
    className?: string;
    light?: boolean;
}> = ({ src, variant = 'horizontal', className = '', light = false }) => {
    // Check if the logo is a custom user-uploaded logo
    // If it's not custom, we render our default Orvalho Digital logo
    const isCustom = src && 
                     !src.includes('docs.otimizza.pro') && 
                     !src.includes('docs.nleads.pro') && 
                     !src.includes('nleads-logo') &&
                     !src.includes('otimizza-logo') &&
                     !src.includes('logo-orvalho');

    if (isCustom) {
        return <img src={src} alt="Logo" className={`${className} object-contain`} />;
    }
    return <OtimizzaLogo variant={variant} className={className} light={light} />;
};

export default OtimizzaLogo;
