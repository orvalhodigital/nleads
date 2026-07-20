import React from 'react';
import logoOrvalho from '../assets/branding/logos/logo-orvalho.png';
import logoOrvalhoBranca from '../assets/branding/logos/logo-orvalho-branca.png';
import simboloOrvalho from '../assets/branding/logos/simbolo-orvalho.png';

interface OrvalhoLogoProps {
    variant?: 'horizontal' | 'vertical' | 'icon';
    className?: string;
    light?: boolean;
}

const OrvalhoLogo: React.FC<OrvalhoLogoProps> = ({ variant = 'horizontal', className = '', light = false }) => {
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
    // Detecta se `src` é uma logo enviada pelo próprio lojista. Se não for,
    // renderiza a logo padrão da Orvalho Digital.
    //
    // ⚠️ NÃO REMOVA as verificações de `otimizza`/`nleads` abaixo. Elas são
    // guardas de legado: perfis de lojistas criados antes do rebrand ainda têm
    // `logo_url` apontando para as logos das marcas antigas. Sem esses testes,
    // `isCustom` viraria true e o sistema exibiria a marca antiga em vez da
    // Orvalho. Só podem sair depois que esses registros forem limpos no banco.
    const isCustom = src &&
                     !src.includes('docs.otimizza.pro') &&
                     !src.includes('docs.nleads.pro') &&
                     !src.includes('nleads-logo') &&
                     !src.includes('otimizza-logo') &&
                     !src.includes('logo-orvalho');

    if (isCustom) {
        return <img src={src} alt="Logo" className={`${className} object-contain`} />;
    }
    return <OrvalhoLogo variant={variant} className={className} light={light} />;
};

export default OrvalhoLogo;
