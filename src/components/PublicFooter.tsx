import React from 'react';
import { MapPin, MessageCircle } from 'lucide-react';
import { PublicProfile } from '../services/websiteService';

interface PublicFooterProps {
    profile: PublicProfile;
    mainWaUrl: string;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({ profile, mainWaUrl }) => {
    const year = new Date().getFullYear();

    return (
        <footer className="bg-white border-t border-slate-100 mt-16">
            <div className="max-w-[1250px] mx-auto px-4 py-10">
                <div className="flex flex-col md:flex-row md:items-start gap-10 md:gap-16">

                    {/* Brand */}
                    <div className="flex-1 min-w-0">
                        {profile.company_logo
                            ? <img src={profile.company_logo} alt={profile.company_name} className="h-10 w-auto object-contain mb-3" />
                            : <p className="text-xl font-black text-slate-900 mb-3 tracking-tight">{profile.company_name}</p>
                        }
                        {profile.website_city && (
                            <p className="flex items-center gap-1.5 text-sm text-slate-400 font-medium">
                                <MapPin size={13} className="shrink-0" /> {profile.website_city}
                            </p>
                        )}
                        {/* Socials */}
                        {(profile.website_instagram || profile.website_facebook || profile.website_youtube || profile.website_tiktok) && (
                            <div className="flex items-center gap-2 mt-4">
                                {profile.website_instagram && (
                                    <a href={`https://instagram.com/${profile.website_instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 hover:text-slate-700 transition-all">
                                        IG
                                    </a>
                                )}
                                {profile.website_facebook && (
                                    <a href={profile.website_facebook} target="_blank" rel="noopener noreferrer"
                                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 hover:text-slate-700 transition-all">
                                        FB
                                    </a>
                                )}
                                {profile.website_youtube && (
                                    <a href={profile.website_youtube} target="_blank" rel="noopener noreferrer"
                                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 hover:text-slate-700 transition-all">
                                        YT
                                    </a>
                                )}
                                {profile.website_tiktok && (
                                    <a href={profile.website_tiktok} target="_blank" rel="noopener noreferrer"
                                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 hover:text-slate-700 transition-all">
                                        TK
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Nav links */}
                    <div className="shrink-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Navegar</p>
                        <div className="space-y-3">
                            <a href="#estoque" className="block text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">Ver Estoque</a>
                            {profile.website_about_text && (
                                <a href="#sobre" className="block text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">Sobre Nós</a>
                            )}
                            <a href="#contato" className="block text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">Contato</a>
                        </div>
                    </div>

                    {/* Contact */}
                    {profile.website_whatsapp && (
                        <div className="shrink-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Fale Conosco</p>
                            <a href={mainWaUrl} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">
                                <MessageCircle size={14} /> WhatsApp
                            </a>
                        </div>
                    )}
                </div>

                {/* Bottom bar */}
                <div className="border-t border-slate-100 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p className="text-xs text-slate-400 font-medium">
                        © {year} {profile.company_name}. Todos os direitos reservados.
                    </p>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        POWERED BY NLEADS
                    </p>
                </div>
            </div>
        </footer>
    );
};
