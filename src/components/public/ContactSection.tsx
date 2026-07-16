import React, { useState } from 'react';
import { MapPin, Send, MessageCircle } from 'lucide-react';
import { PublicProfile } from '../../services/websiteService';

interface ContactSectionProps {
    profile: PublicProfile;
    tc: any;
}

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const buildWaUrl = (phone: string, message: string) => {
    const clean = phone.replace(/\D/g, '');
    const number = clean.startsWith('55') ? clean : `55${clean}`;
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
};

const ContactForm: React.FC<{ profile: PublicProfile; tc: any }> = ({ profile, tc }) => {
    const [form, setForm] = useState({ name: '', phone: '', message: '' });
    const [sent, setSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile.website_whatsapp || !form.name || !form.phone) return;
        const msg = `Olá, *${profile.company_name}*! Me chamo *${form.name}*, telefone: ${form.phone}.${form.message ? ` ${form.message}` : ''}`;
        window.open(buildWaUrl(profile.website_whatsapp, msg), '_blank');
        setSent(true);
        setForm({ name: '', phone: '', message: '' });
        setTimeout(() => setSent(false), 4000);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className={tc.formLabel}>Seu nome *</label>
                    <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Como podemos te chamar?" className={tc.inputField} />
                </div>
                <div>
                    <label className={tc.formLabel}>Telefone *</label>
                    <input required type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="(11) 99999-9999" className={tc.inputField} />
                </div>
            </div>
            <div>
                <label className={tc.formLabel}>Mensagem</label>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Qual veículo te interessa? Tem alguma dúvida?" rows={3} className={tc.textarea} />
            </div>
            <button type="submit"
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-colors shadow-lg"
                style={{ backgroundColor: sent ? '#16a34a' : profile.website_primary_color || '#10b981' }}>
                {sent ? <><Send size={16} /> Mensagem enviada!</> : <><MessageCircle size={16} /> Enviar via WhatsApp</>}
            </button>
        </form>
    );
};

export const ContactSection: React.FC<ContactSectionProps> = ({ profile, tc }) => {
    return (
        <section id="contato" className="max-w-[1250px] mx-auto px-4 pb-8">
            <div className={tc.formCard}>
                <h2 className={tc.formTitle}>Entre em Contato</h2>
                {profile.website_city && (
                    <p className="flex items-center gap-1 text-sm opacity-50 mb-5">
                        <MapPin size={13} /> {profile.website_city}
                    </p>
                )}
                <div className={`grid grid-cols-1 ${profile.website_sections?.show_maps && profile.website_google_maps ? 'md:grid-cols-2' : ''} gap-8`}>
                    {profile.website_sections?.show_contact_form && profile.website_whatsapp && (
                        <div>
                            <p className="text-sm opacity-60 mb-4">Preencha o formulário e entraremos em contato pelo WhatsApp.</p>
                            <ContactForm profile={profile} tc={tc} />
                        </div>
                    )}
                    {profile.website_sections?.show_maps && profile.website_google_maps && (
                        <div>
                            <p className={`text-sm font-semibold mb-3 ${tc.formLabel}`}>Como chegar</p>
                            <iframe src={profile.website_google_maps} width="100%" height="320"
                                className="rounded-xl border-0 w-full" loading="lazy"
                                allowFullScreen referrerPolicy="no-referrer-when-downgrade" />
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ContactSection;
