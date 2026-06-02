
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            vehicles: {
                Row: {
                    id: string
                    created_at: string | null
                    user_id: string | null
                    brand: string
                    model: string
                    year: number
                    model_year: number | null
                    plate: string | null
                    fipe_price: number | null
                    price: number
                    type: string
                    transmission: string
                    engine: string
                    fuel_type: string | null
                    doors: number | null
                    has_spare_key: boolean | null
                    has_owner_manual: boolean | null
                    mileage: number
                    color: string
                    is_single_owner: boolean | null
                    is_service_history_complete: boolean | null
                    is_ipva_paid: boolean | null
                    has_warranty: boolean | null
                    optionals: string[] | null
                    image_url: string | null
                    gallery_images: string[] | null
                    status: string | null
                    sale_details: Json | null
                    sale_phase: string | null
                    admin_id: string | null
                    chassis: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string | null
                    user_id?: string | null
                    brand: string
                    model: string
                    year: number
                    model_year?: number | null
                    plate?: string | null
                    fipe_price?: number | null
                    price: number
                    type: string
                    transmission: string
                    engine: string
                    fuel_type?: string | null
                    doors?: number | null
                    has_spare_key?: boolean | null
                    has_owner_manual?: boolean | null
                    mileage: number
                    color: string
                    is_single_owner?: boolean | null
                    is_service_history_complete?: boolean | null
                    is_ipva_paid?: boolean | null
                    has_warranty?: boolean | null
                    optionals?: string[] | null
                    image_url?: string | null
                    status?: string | null
                    sale_details?: Json | null
                    sale_phase?: string | null
                    admin_id?: string | null
                    chassis?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string | null
                    user_id?: string | null
                    brand?: string
                    model?: string
                    year?: number
                    model_year?: number | null
                    plate?: string | null
                    fipe_price?: number | null
                    price?: number
                    type?: string
                    transmission?: string
                    engine?: string
                    fuel_type?: string | null
                    doors?: number | null
                    has_spare_key?: boolean | null
                    has_owner_manual?: boolean | null
                    mileage?: number
                    color?: string
                    is_single_owner?: boolean | null
                    is_service_history_complete?: boolean | null
                    is_ipva_paid?: boolean | null
                    has_warranty?: boolean | null
                    optionals?: string[] | null
                    image_url?: string | null
                    gallery_images?: string[] | null
                    status?: string | null
                    sale_details?: Json | null
                    sale_phase?: string | null
                    admin_id?: string | null
                    chassis?: string | null
                }
            },
            leads: {
                Row: {
                    id: string
                    created_at: string
                    user_id: string | null
                    name: string
                    phone: string | null
                    email: string | null
                    phase: string
                    temperature: string
                    tipos_veiculo: string[] | null
                    valor_minimo: number | null
                    valor_maximo: number | null
                    marcas: string[] | null
                    modelos: string[] | null
                    transmissao: string[] | null
                    motorizacao: string[] | null
                    observacoes_adicionais: string | null
                    possui_entrada: boolean | null
                    valor_entrada: number | null
                    possui_troca: boolean | null
                    veiculo_troca: string | null
                    presented_vehicles: string[] | null
                    source: string | null
                    last_update: string | null
                    notes: string | null
                    funnel_history: Json | null
                    disqualification_reasons: string[] | null
                    disqualification_notes: string | null
                    foto_url: string | null
                    visit_date: string | null
                    visit_status: string | null
                    tags: string[] | null
                    scheduling_data: Json | null
                    simulation_data: Json | null
                    follow_up_data: Json | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    user_id?: string | null
                    name: string
                    phone?: string | null
                    email?: string | null
                    phase: string
                    temperature: string
                    tipos_veiculo?: string[] | null
                    valor_minimo?: number | null
                    valor_maximo?: number | null
                    marcas?: string[] | null
                    modelos?: string[] | null
                    transmissao?: string[] | null
                    motorizacao?: string[] | null
                    observacoes_adicionais?: string | null
                    possui_entrada?: boolean | null
                    valor_entrada?: number | null
                    possui_troca?: boolean | null
                    veiculo_troca?: string | null
                    presented_vehicles?: string[] | null
                    source?: string | null
                    last_update?: string | null
                    notes?: string | null
                    funnel_history?: Json | null
                    disqualification_reasons?: string[] | null
                    disqualification_notes?: string | null
                    foto_url?: string | null
                    visit_date?: string | null
                    visit_status?: string | null
                    tags?: string[] | null
                    scheduling_data?: Json | null
                    simulation_data?: Json | null
                    follow_up_data?: Json | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    user_id?: string | null
                    name?: string
                    phone?: string | null
                    email?: string | null
                    phase?: string
                    temperature?: string
                    tipos_veiculo?: string[] | null
                    valor_minimo?: number | null
                    valor_maximo?: number | null
                    marcas?: string[] | null
                    modelos?: string[] | null
                    transmissao?: string[] | null
                    motorizacao?: string[] | null
                    observacoes_adicionais?: string | null
                    possui_entrada?: boolean | null
                    valor_entrada?: number | null
                    possui_troca?: boolean | null
                    veiculo_troca?: string | null
                    presented_vehicles?: string[] | null
                    source?: string | null
                    last_update?: string | null
                    notes?: string | null
                    funnel_history?: Json | null
                    disqualification_reasons?: string[] | null
                    disqualification_notes?: string | null
                    foto_url?: string | null
                    visit_date?: string | null
                    visit_status?: string | null
                    tags?: string[] | null
                    scheduling_data?: Json | null
                    simulation_data?: Json | null
                    follow_up_data?: Json | null
                }
            },
            profiles: {
                Row: {
                    id: string
                    created_at: string | null
                    email: string
                    full_name: string | null
                    plan: string | null
                    plan_status: string | null
                    trial_ends_at: string | null
                    webhook_url: string | null
                    avatar_url: string | null
                    company_name: string | null
                    company_logo: string | null
                    monthly_sales_goal: number | null
                    monthly_leads_goal: number | null
                    monthly_visits_goal: number | null
                    monthly_revenue_goal: number | null
                    preset_messages: string[] | null
                    website_active: boolean | null
                    website_theme: string | null
                    website_primary_color: string | null
                    website_secondary_color: string | null
                    website_text_color: string | null
                    website_title_color: string | null
                    website_use_gradient: boolean | null
                    website_hero_image: string | null
                    website_hero_text: string | null
                    website_hero_subtitle: string | null
                    website_whatsapp: string | null
                    website_cta_text: string | null
                    website_slug: string | null
                    website_city: string | null
                    website_google_maps: string | null
                    custom_domain: string | null
                    use_company_number: boolean | null
                    whatsapp_webhook_url: string | null
                    business_hours: Json | null
                    parent_id: string | null
                    role: string | null
                    phone: string | null
                }
                Insert: {
                    id: string
                    created_at?: string | null
                    email: string
                    full_name?: string | null
                    plan?: string | null
                    plan_status?: string | null
                    trial_ends_at?: string | null
                    webhook_url?: string | null
                    avatar_url?: string | null
                    company_name?: string | null
                    company_logo?: string | null
                    monthly_sales_goal?: number | null
                    monthly_leads_goal?: number | null
                    monthly_visits_goal?: number | null
                    monthly_revenue_goal?: number | null
                    preset_messages?: string[] | null
                    website_active?: boolean | null
                    website_theme?: string | null
                    website_primary_color?: string | null
                    website_secondary_color?: string | null
                    website_text_color?: string | null
                    website_title_color?: string | null
                    website_use_gradient?: boolean | null
                    website_hero_image?: string | null
                    website_hero_text?: string | null
                    website_hero_subtitle?: string | null
                    website_whatsapp?: string | null
                    website_cta_text?: string | null
                    website_slug?: string | null
                    website_city?: string | null
                    website_google_maps?: string | null
                    custom_domain?: string | null
                    use_company_number?: boolean | null
                    whatsapp_webhook_url?: string | null
                    business_hours?: Json | null
                    parent_id?: string | null
                    role?: string | null
                    phone?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string | null
                    email?: string
                    full_name?: string | null
                    plan?: string | null
                    plan_status?: string | null
                    trial_ends_at?: string | null
                    webhook_url?: string | null
                    avatar_url?: string | null
                    company_name?: string | null
                    company_logo?: string | null
                    monthly_sales_goal?: number | null
                    monthly_leads_goal?: number | null
                    monthly_visits_goal?: number | null
                    monthly_revenue_goal?: number | null
                    preset_messages?: string[] | null
                    website_active?: boolean | null
                    website_theme?: string | null
                    website_primary_color?: string | null
                    website_secondary_color?: string | null
                    website_text_color?: string | null
                    website_title_color?: string | null
                    website_use_gradient?: boolean | null
                    website_hero_image?: string | null
                    website_hero_text?: string | null
                    website_hero_subtitle?: string | null
                    website_whatsapp?: string | null
                    website_cta_text?: string | null
                    website_slug?: string | null
                    website_city?: string | null
                    website_google_maps?: string | null
                    custom_domain?: string | null
                    use_company_number?: boolean | null
                    whatsapp_webhook_url?: string | null
                    business_hours?: Json | null
                    parent_id?: string | null
                    role?: string | null
                    phone?: string | null
                }
            }
        }
    }
}
