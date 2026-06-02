import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Menu, X, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { PublicProfile } from '../services/websiteService';

interface PublicNavbarProps {
    profile: PublicProfile;
    slug: string;
    tc: any;
    theme: string;
    primary: string;
    mainWaUrl: string;
}

const MobileMenu: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    profile: PublicProfile;
    primary: string;
    theme: string;
    slug: string;
}> = ({ isOpen, onClose, profile, primary, theme, slug }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: isOpen ? 1 : 0, x: isOpen ? 0 : '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-white text-slate-900 flex flex-col md:hidden"
            style={theme === 'glass' || theme === 'premium' || theme === 'bold' || theme === 'luxury'
                ? { backgroundColor: theme === 'luxury' ? '#0f0e0c' : '#050508', color: 'white' }
                : {}}
        >
            <div className="p-6 flex items-center justify-between border-b border-white/5">
                <span className="font-black tracking-tight">{profile?.company_name}</span>
                <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                    <X size={24} />
                </button>
            </div>
            <div className="flex-1 p-8 flex flex-col gap-6 overflow-y-auto text-left">
                <Link to={`/site/${slug}`} onClick={onClose} className="text-2xl font-black tracking-tighter uppercase italic">Estoque</Link>
                {profile?.website_about_text && <Link to={`/site/${slug}#sobre`} onClick={onClose} className="text-2xl font-black tracking-tighter uppercase italic">Sobre Nós</Link>}
                <Link to={`/site/${slug}#contato`} onClick={onClose} className="text-2xl font-black tracking-tighter uppercase italic">Contato</Link>

                {profile?.website_whatsapp && (
                    <button
                        onClick={() => {
                            const mainWaMsg = profile?.preset_messages?.[0] ? profile.preset_messages[0].replace(/\[NOME\]/gi, profile.company_name) : `Olá! Vim pelo site ${profile.company_name}.`;
                            window.open(`https://wa.me/${profile.website_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(mainWaMsg)}`, '_blank');
                            onClose();
                        }}
                        className="mt-4 w-full py-4 rounded-xl font-black text-white text-center shadow-xl"
                        style={{ backgroundColor: primary }}
                    >
                        WhatsApp
                    </button>
                )}
            </div>
            <div className="p-8 border-t border-white/5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                    © {new Date().getFullYear()} {profile?.company_name}
                </p>
            </div>
        </motion.div>
    );
};

export const PublicNavbar: React.FC<PublicNavbarProps> = ({
    profile,
    slug,
    tc,
    theme,
    primary,
    mainWaUrl,
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const displayLogo = useMemo(() => {
        if (profile?.website_branding?.enabled) {
            const isDarkTheme = ['glass', 'premium', 'bold', 'luxury'].includes(theme);
            return isDarkTheme
                ? (profile.website_branding.logo_dark || profile.website_branding.logo_primary || profile.company_logo)
                : (profile.website_branding.logo_primary || profile.company_logo);
        }
        return profile?.company_logo;
    }, [profile, theme]);

    const handleLogoClick = (e: React.MouseEvent) => {
        const currentPath = `/site/${slug}`;
        if (window.location.pathname === currentPath) {
            e.preventDefault();
            window.location.reload();
        }
    };

    if (theme === 'classic') {
        return (
            <>
                <MobileMenu
                    isOpen={isMenuOpen}
                    onClose={() => setIsMenuOpen(false)}
                    profile={profile}
                    primary={primary}
                    theme={theme}
                    slug={slug}
                />
                <nav className={tc.nav}>
                    <div className="max-w-[1250px] mx-auto px-4 h-20 flex items-center justify-between">
                        <Link to={`/site/${slug}`} onClick={handleLogoClick} className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity">
                            {displayLogo
                                ? <img src={displayLogo} alt={profile.company_name} className="h-16 w-auto object-contain" />
                                : <span className="text-3xl font-black tracking-tight">{profile.company_name}</span>
                            }
                            {profile.website_city && (
                                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-bold bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200 ml-2">
                                    <MapPin size={12} className="text-slate-400" /> {profile.website_city}
                                </div>
                            )}
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-8">
                                <a href="#estoque" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">Estoque</a>
                                {profile.website_about_text && <a href="#sobre" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">Sobre Nós</a>}
                                <a href="#contato" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">Contato</a>
                            </div>
                            {profile.website_whatsapp && (
                                <a href={mainWaUrl} target="_blank" rel="noopener noreferrer"
                                    className={`hidden sm:flex items-center gap-2 text-white text-sm font-bold px-6 py-3 transition-all hover:-translate-y-0.5 hover:shadow-lg ${profile?.website_card_style === 'square' ? 'rounded-none' : 'rounded-xl'}`}
                                    style={{ backgroundColor: primary }}>
                                    <MessageCircle size={16} />
                                    <span>WhatsApp</span>
                                </a>
                            )}
                            <button onClick={() => setIsMenuOpen(true)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                <Menu size={24} />
                            </button>
                        </div>
                    </div>
                </nav>
            </>
        );
    }

    return (
        <>
            <MobileMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                profile={profile}
                primary={primary}
                theme={theme}
                slug={slug}
            />
            <nav className={tc.nav}>
                <div className="max-w-[1250px] mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to={`/site/${slug}`} onClick={handleLogoClick} className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                        {displayLogo
                            ? <img src={displayLogo} alt={profile.company_name} className="h-14 w-auto object-contain" />
                            : <span className="text-2xl font-extrabold">{profile.company_name}</span>
                        }
                        {profile.website_city && (
                            <span className="hidden sm:flex items-center gap-1 text-xs opacity-50">
                                <MapPin size={12} />{profile.website_city}
                            </span>
                        )}
                    </Link>
                    {profile.website_whatsapp && (
                        <div className="flex items-center gap-3">
                            <a href={mainWaUrl} target="_blank" rel="noopener noreferrer"
                                className="hidden sm:flex items-center gap-2 bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-green-400 transition-colors">
                                <MessageCircle size={16} />
                                <span>WhatsApp</span>
                            </a>
                            <button onClick={() => setIsMenuOpen(true)} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                                <Menu size={24} />
                            </button>
                        </div>
                    )}
                </div>
            </nav>
        </>
    );
};
