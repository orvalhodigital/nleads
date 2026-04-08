
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
                    brand: string
                    model: string
                    year: number
                    model_year: number | null
                    plate: string | null
                    price: number
                    type: string
                    transmission: string
                    engine: string
                    mileage: number
                    color: string
                    is_single_owner: boolean | null
                    is_service_history_complete: boolean | null
                    is_ipva_paid: boolean | null
                    has_warranty: boolean | null
                    optionals: string[] | null
                    image_url: string | null
                    status: string | null
                    sale_details: Json | null
                }
                Insert: {
                    id?: string
                    created_at?: string | null
                    brand: string
                    model: string
                    year: number
                    model_year?: number | null
                    plate?: string | null
                    price: number
                    type: string
                    transmission: string
                    engine: string
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
                }
                Update: {
                    id?: string
                    created_at?: string | null
                    brand?: string
                    model?: string
                    year?: number
                    model_year?: number | null
                    plate?: string | null
                    price?: number
                    type?: string
                    transmission?: string
                    engine?: string
                    mileage?: number
                    color?: string
                    is_single_owner?: boolean | null
                    is_service_history_complete?: boolean | null
                    is_ipva_paid?: boolean | null
                    has_warranty?: boolean | null
                    optionals?: string[] | null
                    image_url?: string | null
                    status?: string | null
                    sale_details?: Json | null
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
                }
            }
        }
    }
}
