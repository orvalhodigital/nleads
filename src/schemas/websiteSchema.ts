import { z } from 'zod';

// Schema para uploads de imagens
const imageUploadSchema = z.object({
  logo_primary: z.string().url().optional().nullable(),
  logo_dark: z.string().url().optional().nullable(),
  favicon: z.string().url().optional().nullable(),
});

// Schema para barra de anúncio
const announcementBarSchema = z.object({
  enabled: z.boolean().default(false),
  text: z.string().max(200).optional().nullable(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).default('#4165E8'),
});

// Schema para depoimentos de clientes
const testimonialSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nome é obrigatório'),
  role: z.string().min(1, 'Cargo é obrigatório'),
  text: z.string().min(10, 'Depoimento deve ter pelo menos 10 caracteres'),
  photo: z.string().url().optional().nullable(),
});

// Schema para redes sociais
const socialMediaSchema = z.object({
  instagram: z.string().url().optional().nullable(),
  facebook: z.string().url().optional().nullable(),
  tiktok: z.string().url().optional().nullable(),
  youtube: z.string().url().optional().nullable(),
});

// Schema para contato e localização
const contactSchema = z.object({
  whatsapp: z.string()
    .regex(/^(\+55)?\s?(\(?\d{2}\)?)?\s?9?\d{4}-?\d{4}$/, 'Formato de WhatsApp inválido')
    .optional()
    .nullable(),
  phone: z.string()
    .regex(/^(\+55)?\s?(\(?\d{2}\)?)?\s?\d{4}-?\d{4}$/, 'Formato de telefone fixo inválido')
    .optional()
    .nullable(),
  email: z.string().email('Email inválido').optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  google_maps_embed: z.string().max(2000).optional().nullable(),
});

// Schema para SEO
const seoSchema = z.object({
  meta_title: z.string().max(60, 'Título deve ter no máximo 60 caracteres').optional().nullable(),
  meta_description: z.string().max(160, 'Descrição deve ter no máximo 160 caracteres').optional().nullable(),
});

// Schema para scripts externos
const externalScriptsSchema = z.object({
  google_tag_manager: z.string().max(2000).optional().nullable(),
  meta_pixel: z.string().max(2000).optional().nullable(),
  custom_scripts: z.string().max(5000).optional().nullable(),
});

// Schema para seções de rodapé
const footerSchema = z.object({
  mission: z.string().max(500).optional().nullable(),
  vision: z.string().max(500).optional().nullable(),
  values: z.string().max(500).optional().nullable(),
});

// Schema principal para website
export const websiteSettingsSchema = z.object({
  // Status e URL básicos
  website_active: z.boolean().default(false),
  website_slug: z.string()
    .min(3, 'URL deve ter pelo menos 3 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífens')
    .optional()
    .nullable(),
  custom_domain: z.string().url().optional().nullable(),
  
  // Tema e cores
  website_theme: z.enum(['modern', 'classic', 'bold', 'luxury']).default('classic'),
  website_primary_color: z.string().regex(/^#[0-9A-F]{6}$/i).default('#088253'),
  website_secondary_color: z.string().regex(/^#[0-9A-F]{6}$/i).default('#4165E8'),
  website_text_color: z.string().regex(/^#[0-9A-F]{6}$/i).default('#374151'),
  website_title_color: z.string().regex(/^#[0-9A-F]{6}$/i).default('#111827'),
  website_use_gradient: z.boolean().default(false),
  
  // Conteúdo principal
  website_hero_image: z.string().url().optional().nullable(),
  website_hero_text: z.string().max(100).optional().nullable(),
  website_hero_subtitle: z.string().max(200).optional().nullable(),
  website_city: z.string().max(100).optional().nullable(),
  website_cta_text: z.string().default('Tenho Interesse'),
  
  // Seções do website (mantendo compatibilidade)
  website_sections: z.object({
    show_mission_vision_values: z.boolean().default(true),
    mission: z.string().optional().nullable(),
    vision: z.string().optional().nullable(),
    values: z.string().optional().nullable(),
    show_vehicle_categories: z.boolean().default(true),
    show_maps: z.boolean().default(true),
    show_contact_form: z.boolean().default(true),
    // Novas seções
    show_testimonials: z.boolean().default(true),
    show_announcement_bar: z.boolean().default(false),
    show_social_media: z.boolean().default(true),
  }).default({
    show_mission_vision_values: true,
    mission: '',
    vision: '',
    values: '',
    show_vehicle_categories: true,
    show_maps: true,
    show_contact_form: true,
    show_testimonials: true,
    show_announcement_bar: false,
    show_social_media: true,
  }),
  
  // Novos campos (agrupados por funcionalidade)
  website_branding: z.object({
    ...imageUploadSchema.shape,
    ...announcementBarSchema.shape,
  }).default({
    logo_primary: null,
    logo_dark: null,
    favicon: null,
    enabled: false,
    text: '',
    color: '#4165E8',
  }),
  
  website_content: z.object({
    hero_title: z.string().max(100).optional().nullable(),
    hero_subtitle: z.string().max(200).optional().nullable(),
    ...footerSchema.shape,
    testimonials: z.array(testimonialSchema).default([]),
  }).default({
    hero_title: '',
    hero_subtitle: '',
    mission: '',
    vision: '',
    values: '',
    testimonials: [],
  }),
  
  website_contact: z.object({
    ...contactSchema.shape,
    ...socialMediaSchema.shape,
  }).default({
    whatsapp: '',
    phone: '',
    email: '',
    address: '',
    google_maps_embed: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    youtube: '',
  }),
  
  website_optimization: z.object({
    ...seoSchema.shape,
    ...externalScriptsSchema.shape,
  }).default({
    meta_title: '',
    meta_description: '',
    google_tag_manager: '',
    meta_pixel: '',
    custom_scripts: '',
  }),
});

// Tipo derivado do schema
export type WebsiteSettings = z.infer<typeof websiteSettingsSchema>;
export type WebsiteBranding = WebsiteSettings['website_branding'];
export type WebsiteContent = WebsiteSettings['website_content'];
export type WebsiteContact = WebsiteSettings['website_contact'];
export type WebsiteOptimization = WebsiteSettings['website_optimization'];
export type Testimonial = z.infer<typeof testimonialSchema>;

// Função para criar valores padrão
export const defaultWebsiteSettings: WebsiteSettings = {
  website_active: false,
  website_slug: '',
  custom_domain: null,
  website_theme: 'classic',
  website_primary_color: '#088253',
  website_secondary_color: '#4165E8',
  website_text_color: '#374151',
  website_title_color: '#111827',
  website_use_gradient: false,
  website_hero_image: null,
  website_hero_text: '',
  website_hero_subtitle: '',
  website_city: '',
  website_cta_text: 'Tenho Interesse',
  website_sections: {
    show_mission_vision_values: true,
    mission: '',
    vision: '',
    values: '',
    show_vehicle_categories: true,
    show_maps: true,
    show_contact_form: true,
    show_testimonials: true,
    show_announcement_bar: false,
    show_social_media: true,
  },
  website_branding: {
    logo_primary: null,
    logo_dark: null,
    favicon: null,
    enabled: false,
    text: '',
    color: '#4165E8',
  },
  website_content: {
    hero_title: '',
    hero_subtitle: '',
    mission: '',
    vision: '',
    values: '',
    testimonials: [],
  },
  website_contact: {
    whatsapp: '',
    phone: '',
    email: '',
    address: '',
    google_maps_embed: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    youtube: '',
  },
  website_optimization: {
    meta_title: '',
    meta_description: '',
    google_tag_manager: '',
    meta_pixel: '',
    custom_scripts: '',
  },
};

// Função para mergear configurações existentes do perfil
export function mergeProfileWithWebsiteSettings(profile: any): WebsiteSettings {
  const base = defaultWebsiteSettings;
  
  // Mapear campos antigos para nova estrutura
  return {
    ...base,
    website_active: profile.website_active ?? base.website_active,
    website_slug: profile.website_slug ?? base.website_slug,
    custom_domain: profile.custom_domain ?? base.custom_domain,
    website_theme: profile.website_theme ?? base.website_theme,
    website_primary_color: profile.website_primary_color ?? base.website_primary_color,
    website_secondary_color: profile.website_secondary_color ?? base.website_secondary_color,
    website_text_color: profile.website_text_color ?? base.website_text_color,
    website_title_color: profile.website_title_color ?? base.website_title_color,
    website_use_gradient: profile.website_use_gradient ?? base.website_use_gradient,
    website_hero_image: profile.website_hero_image ?? base.website_hero_image,
    website_hero_text: profile.website_hero_text ?? base.website_hero_text,
    website_hero_subtitle: profile.website_hero_subtitle ?? base.website_hero_subtitle,
    website_city: profile.website_city ?? base.website_city,
    website_cta_text: profile.website_cta_text ?? base.website_cta_text,
    website_sections: {
      ...base.website_sections,
      ...(profile.website_sections || {}),
    },
    // Preencher novos campos com valores existentes se disponíveis
    website_contact: {
      ...base.website_contact,
      whatsapp: profile.website_whatsapp ?? base.website_contact.whatsapp,
      google_maps_embed: profile.website_google_maps ?? base.website_contact.google_maps_embed,
    },
  };
}

// Função para preparar dados para salvar no perfil
export function prepareWebsiteSettingsForProfile(data: WebsiteSettings): any {
  return {
    website_active: data.website_active,
    website_slug: data.website_slug,
    custom_domain: data.custom_domain,
    website_theme: data.website_theme,
    website_primary_color: data.website_primary_color,
    website_secondary_color: data.website_secondary_color,
    website_text_color: data.website_text_color,
    website_title_color: data.website_title_color,
    website_use_gradient: data.website_use_gradient,
    website_hero_image: data.website_hero_image,
    website_hero_text: data.website_hero_text,
    website_hero_subtitle: data.website_hero_subtitle,
    website_city: data.website_city,
    website_cta_text: data.website_cta_text,
    website_whatsapp: data.website_contact.whatsapp,
    website_google_maps: data.website_contact.google_maps_embed,
    website_sections: {
      ...data.website_sections,
      // Incluir novos dados estruturados
      website_branding: data.website_branding,
      website_content: data.website_content,
      website_contact: data.website_contact,
      website_optimization: data.website_optimization,
    },
  };
}
