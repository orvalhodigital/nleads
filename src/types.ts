/**
 * Fases do funil de vendas do Lead.
 */
export enum LeadPhase {
  NEW = 'Novo Lead',
  VISIT = 'Visita / Test Drive',
  SIMULATION = 'Simulação',
  FOLLOW_UP = 'Follow-up',
  STAND_BY = 'Stand-By',
  WAITING_PAYMENT = 'Aguardando Pagamento',
  DOCUMENTATION = 'Documentação',
  DELIVERY = 'Entrega',
  COMPLETED = 'Compradores',
  DISQUALIFIED = 'Desqualificados'
}

/**
 * Temperatura comercial do Lead.
 */
export enum LeadTemperature {
  HOT = 'Quente',
  WARM = 'Morna',
  COLD = 'Fria'
}

export type VisitStatus = 'pending' | 'show' | 'noshow';

/**
 * Tipos de veículos suportados, abrangendo Carros, Motos e Caminhões.
 */
export type VehicleType = 
  // Carros
  'SUV' | 'Sedan' | 'Hatch' | 'Picape' | 'Esportivo' | 'Conversível' | 'Van' |
  // Motos
  'Naked' | 'Sport' | 'Trail' | 'Custom' | 'Scooter' | 'Touring' | 'Elétrica' | 'Street' | 
  'Qualquer Um(a)';

/**
 * Tipos de transmissão.
 */
export type TransmissionType = 'Manual' | 'Automático' | 'Automatizado' | 'CVT' | 'Semi-Automático' | 'Qualquer Um(a)';

/**
 * Motorizações agrupadas para todos os tipos de veículos.
 */
export type EngineType = 
  // Carros
  '1.0' | '1.3' | '1.4' | '1.5' | '1.6' | '1.8' | '2.0' | '2.0+' | 'Elétrico' | 'Híbrido' | 
  // Motos
  '110cc' | '125cc' | '150cc' | '160cc' | '190cc' | '250cc' | '300cc' | '400cc' | '600cc' | '750cc' | '1000cc' | '1200cc+' |
  'Qualquer Um(a)';

export type FuelType = 'Gasolina' | 'Álcool' | 'Flex' | 'Diesel' | 'GNV' | 'Elétrico' | 'Híbrido';

export type VehicleKanbanPhase = 'em_transito' | 'disponivel' | 'reservado' | 'entregando' | 'vendido';

/**
 * Detalhes da venda de um veículo.
 */
export interface SaleDetails {
  salePrice: number;
  saleDate: string;
  buyerLeadId?: string;
  buyerName: string;
  isFollowUpSale?: boolean;
  refurbishmentCosts?: number;
}

export interface OperationalCostItem {
  id: string;
  description: string;
  amount: number;
  date?: string;
}

/**
 * Interface principal de Veículo (Foco em Carros e Veículos Gerais).
 */
export interface Vehicle {
  id: string;
  model: string;
  brand: string;
  year: number;
  modelYear?: number;
  plate?: string;
  fipePrice?: number;
  price: number;
  type: VehicleType;
  transmission: TransmissionType;
  engine: EngineType;
  fuelType?: FuelType;
  doors?: 2 | 4;
  hasSpareKey?: boolean;
  hasOwnerManual?: boolean;
  mileage: number;
  color: string;
  isSingleOwner: boolean;
  isServiceHistoryComplete: boolean;
  isIpvaPaid: boolean;
  hasWarranty: boolean;
  optionals: string[];
  imageUrl: string;
  galleryImages: string[];
  shortDescription?: string;
  description?: string;
  status: 'available' | 'sold';
  sale_phase?: VehicleKanbanPhase;
  saleDetails?: SaleDetails;
  showOnWebsite?: boolean;

  // Unificação de Veículos (Novos campos)
  vehicleCategory?: 'carro' | 'moto' | 'caminhao' | 'outros';
  motoCategory?: MotorcycleCategory;
  startType?: MotoStartType;
  brakeType?: MotoBrakeType;
  fuelSystem?: MotoFuelSystem;
  cooling?: MotoCooling;
  
  // SEO
  seoHeadline?: string;
  seoDescription?: string;

  // Custos e Financeiro
  operationalCosts?: OperationalCostItem[];
  purchasePrice?: number;
  suggestedSalePrice?: number;

  /** Data de criação do registro (mapeada de `created_at`). Usada em métricas
   * como "Tempo Médio de Venda" e "Veículos Parados". */
  createdAt?: string;
}

export interface LeadPreference {
  tipos_veiculo: VehicleType[];
  marcas: string[];
  modelos: string[];
  carro_valor_min?: number;
  carro_valor_max?: number;
  carro_transmissao: TransmissionType[];
  carro_motorizacao: EngineType[];
  
  interesse_carro?: boolean;
  interesse_moto?: boolean;
  tipos_moto?: VehicleType[];
  marcas_moto?: string[];
  modelos_moto?: string[];
  moto_valor_min?: number;
  moto_valor_max?: number;
  moto_transmissao: TransmissionType[];
  moto_motorizacao: EngineType[];

  interesse_caminhao?: boolean;
  tipos_caminhao?: string[];
  marcas_caminhao?: string[];
  modelos_caminhao?: string[];
  caminhao_valor_min?: number;
  caminhao_valor_max?: number;
  caminhao_transmissao?: TransmissionType[];
  caminhao_motorizacao?: string[];

  observacoes_adicionais: string;
  possui_entrada: boolean;
  valor_entrada?: number;
  possui_troca: boolean;
  veiculo_troca?: string;
  troca_data?: TradeInVehicleData;

  // Legacy/fallback fields
  valor_minimo?: number;
  valor_maximo?: number;
  transmissao?: TransmissionType[];
  motorizacao?: EngineType[];
}

export interface TradeInVehicleData {
  placa?: string;
  categoria?: 'carro' | 'moto' | 'caminhao';
  marca?: string;
  modelo?: string;
  ano?: number;
  cor?: string;
  quilometragem?: number;
  valor_fipe?: number;
  situacao_financeira?: 'Quitado' | 'Financiado';
  valor_quitacao?: number;
  observacoes?: string;
}

export interface Appointment {
  id: string;
  date: string;
  vehicleOfInterest?: string;
  notes?: string;
  status: VisitStatus;
}

export interface SchedulingData {
  date?: string;
  time?: string;
  vehicleOfInterest?: string;
  notes?: string;
  appointments?: Appointment[];
}

export interface SimulationData {
  cpf?: string;
  cnh?: string;
  downPayment?: number;
  installments?: number;
  notes?: string;
}

export interface FollowUpData {
  nextContactDate?: string;
  notes?: string;
}

export interface Tag {
  id: string;
  label: string;
  color: string;
}

/**
 * Metadados de marketing para rastreamento de campanhas.
 */
export interface MarketingMetadata {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  fbclid?: string;
  gclid?: string;
}

/**
 * Histórico de interações com o Lead.
 */
export interface InteractionHistory {
  id: string;
  date: string;
  type: 'call' | 'email' | 'whatsapp' | 'meeting' | 'note';
  description: string;
  agentId?: string;
}

/**
 * Interface de Lead otimizada para suportar histórico e marketing.
 */
export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  phase: LeadPhase;
  temperature: LeadTemperature;
  preferences: LeadPreference;
  presentedVehicles: string[];
  source: string;
  createdAt: string;
  lastUpdate: string;
  notes: string;
  funnelHistory?: Record<string, string>;
  disqualificationReasons?: string[];
  disqualificationNotes?: string;

  // Campos de visita
  visit_date?: string;
  visit_status?: VisitStatus;

  // Tags
  tags?: string[];
  foto_url?: string;
  
  // Estruturas de suporte
  scheduling_data?: SchedulingData;
  simulation_data?: SimulationData;
  follow_up_data?: FollowUpData;

  // Novos campos profissionais adicionados para Marketing e Histórico
  marketing_metadata?: MarketingMetadata;
  interaction_history?: InteractionHistory[];

  is_buyer?: boolean;
  user_id?: string;
  admin_id?: string;
  user_name?: string;

  // Pós-venda e Garantia
  saleStatus?: SalePhase;
  saleDate?: string;
  deliveryDate?: string;
  guaranteeId?: string;
  guaranteeEndsAt?: string;
  postSaleNotes?: string;
  saleDetails?: SaleDetails;
}


export interface LeadCommunication {
  id: string;
  lead_id: string;
  vehicle_id: string;
  contact_name: string;
  contact_phone: string;
  message_body: string;
  is_sent: 'sim' | 'não';
  email_user?: string;
  created_at?: string;
}

/**
 * Configuração de Garantia — Multi-tenant por concessionária.
 */
export interface GuaranteeConfig {
  id: string;
  user_id: string;
  type: '7dias' | '90dias' | '180dias' | '1ano' | 'custom';
  name: string;
  days_warranty: number;
  description?: string;
  conditions?: {
    refundPolicy?: string;
    returnDays?: number;
    notes?: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

/**
 * Status do fluxo de pós-venda.
 */
export type SalePhase = 'documentacao' | 'entrega' | 'em_garantia' | 'apos_garantia';

/**
 * Fluxo de Pós-Venda (Funil Inverso).
 */
export interface SaleFlow {
  leadId: string;
  saleStatus: SalePhase;
  saleDate: string;
  deliveryDate?: string;
  guaranteeId?: string;
  guaranteeEndsAt?: string;
  postSaleNotes?: string;
}


/**
 * Perfil do usuário e Configurações da Loja.
 */
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  plan: 'free' | 'pro' | 'trial';
  planStatus: 'active' | 'expired' | 'overdue' | 'canceled';
  trialEndsAt: string;
  overdueSince?: string | null; // quando o webhook marcou a assinatura em atraso
  created_at?: string;
  webhook_url?: string;
  avatar_url?: string;
  company_name?: string;
  company_logo?: string;
  role?: 'empresa' | 'vendedor' | 'super_admin' | 'admin';
  parent_id?: string;
  phone?: string;
  cpf_cnpj?: string; // CPF/CNPJ do lojista — exigido pelo Asaas para cobrança (A48)
  // Vehicle Source Settings
  enable_manual_vehicles?: boolean;
  monthly_sales_goal?: number;
  monthly_leads_goal?: number;
  monthly_visits_goal?: number;
  monthly_revenue_goal?: number;
  enable_cars?: boolean;
  enable_motorcycles?: boolean;
  preset_messages?: string[];
  // Website settings
  website_active?: boolean;
  website_theme?: 'classic';
  website_primary_color?: string;
  website_secondary_color?: string;
  website_text_color?: string;
  website_title_color?: string;
  website_use_gradient?: boolean;
  website_hero_image?: string;
  website_hero_text?: string;
  website_hero_subtitle?: string;
  website_whatsapp?: string;
  website_cta_text?: string;
  website_slug?: string;
  website_city?: string;
  website_google_maps?: string;
  custom_domain?: string;
  website_background_color?: string;
  website_bg_color2?: string;
  website_bg_gradient?: boolean;
  website_hero_button_text?: string;
  website_about_text?: string;
  website_typography?: string;
  website_card_style?: string;
  website_hero_images?: string[];
  website_video_url?: string;
  website_privacy_policy?: string;
  website_terms_of_use?: string;
  website_instagram?: string;
  website_facebook?: string;
  website_youtube?: string;
  website_tiktok?: string;
  website_business_hours?: string;
  website_show_sold?: boolean;
  website_show_filters?: boolean;
  website_sections?: {
    show_mission_vision_values?: boolean;
    mission?: string;
    vision?: string;
    values?: string;
    show_vehicle_categories?: boolean;
    show_maps?: boolean;
    show_contact_form?: boolean;
    show_testimonials?: boolean;
    show_announcement_bar?: boolean;
    show_social_media?: boolean;
    show_floating_whatsapp?: boolean;
    show_financing_form?: boolean;
    show_exit_popup?: boolean;
    show_differentials?: boolean;
  };
  website_branding?: {
    logo_primary?: string;
    logo_dark?: string;
    favicon?: string;
    enabled?: boolean;
    text?: string;
    color?: string;
  };
  website_content?: {
    hero_title?: string;
    hero_subtitle?: string;
    mission?: string;
    vision?: string;
    values?: string;
    testimonials?: Array<{
      id?: string;
      name: string;
      role: string;
      text: string;
      photo?: string;
    }>;
  };
  website_contact?: {
    whatsapp?: string;
    phone?: string;
    email?: string;
    address?: string;
    google_maps_embed?: string;
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
  };
  website_optimization?: {
    meta_title?: string;
    meta_description?: string;
    google_tag_manager?: string;
    meta_pixel?: string;
    custom_scripts?: string;
  };
  // Differentials (legacy)
  website_diff1_active?: boolean;
  website_diff1_title?: string;
  website_diff1_sub?: string;
  website_diff1_icon?: string;
  website_diff2_active?: boolean;
  website_diff2_title?: string;
  website_diff2_sub?: string;
  website_diff2_icon?: string;
  website_diff3_active?: boolean;
  website_diff3_title?: string;
  website_diff3_sub?: string;
  website_diff3_icon?: string;
  website_diff4_active?: boolean;
  website_diff4_title?: string;
  website_diff4_sub?: string;
  website_diff4_icon?: string;
  // WhatsApp settings
  use_company_number?: boolean;
  whatsapp_webhook_url?: string;
  // Business hours
  business_hours?: any[];
  // Onboarding
  onboarding_completed?: boolean;
  // Ads Connections
  meta_pixel_id?: string;
  meta_access_token?: string;
  google_ads_client_id?: string;
  google_ads_developer_token?: string;
}


export type MotorcycleCategory = 'Naked' | 'Sport' | 'Trail' | 'Custom' | 'Scooter' | 'Touring' | 'Elétrica' | 'Street' | 'Qualquer Um(a)';

export type MotoStartType = 'Elétrica' | 'Pedal' | 'Ambos';
export type MotoFuelSystem = 'Carburador' | 'Injeção Eletrônica';
export type MotoCooling = 'Ar' | 'Líquida' | 'Ar e Óleo';
export type MotoBrakeType = 'Disco' | 'Tambor' | 'ABS' | 'CBS' | 'Disco + ABS' | 'Disco + CBS';

/**
 * Interface dedicada para Motocicletas.
 */
export interface Motorcycle {
  id: string;
  brand: string;
  model: string;
  year: number;
  modelYear?: number;
  plate?: string;
  fipePrice?: number;
  price: number;
  category: MotorcycleCategory;
  engine: EngineType;
  mileage: number;
  color: string;
  isSingleOwner: boolean;
  hasWarranty: boolean;
  isIpvaPaid: boolean;
  optionals: string[];
  imageUrl: string;
  galleryImages: string[];
  shortDescription?: string;
  description?: string;
  startType?: MotoStartType;
  brakeType?: MotoBrakeType;
  fuelSystem?: MotoFuelSystem;
  cooling?: MotoCooling;
  hasSpareKey?: boolean;
  hasOwnerManual?: boolean;
  status: 'available' | 'sold';
  saleDetails?: SaleDetails;
  showOnWebsite?: boolean;

  /** Data de criação do registro (mapeada de `created_at`). Usada em métricas
   * como "Tempo Médio de Venda" e "Veículos Parados". */
  createdAt?: string;

  /** Motos ainda não têm rastreamento de preço de compra (sem coluna no banco
   * nem campo no formulário). Declarado aqui só para compatibilidade de tipo
   * com o "estoque unificado" (carros+motos tratados juntos nas métricas). */
  purchasePrice?: number;
}

export type View = 'home' | 'dashboard' | 'inventory' | 'leads' | 'agenda' | 'sales-flow' | 'sales-closed' | 'plans' | 'settings' | 'motorcycles' | 'onboarding' | 'support' | 'admin-tickets' | 'website';

export type TicketStatus = 'open' | 'in_progress' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'bug' | 'feature' | 'billing' | 'support';

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_name?: string;
  sender_role: 'user' | 'admin';
  message: string;
  attachments: string[];
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  attachments: string[];
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  messages?: TicketMessage[];
}

export interface OnboardingSession {
  id: string;
  user_id: string;
  step_welcome_meeting: boolean;
  step_educational_materials: boolean;
  step_technical_setup: boolean;
  step_traffic_setup: boolean;
  step_pixel_configured: boolean;
  step_first_activation: boolean;
  step_followup_success: boolean;
  step_referral_request: boolean;
  welcome_meeting_date?: string;
  followup_date?: string;
  review_30d_date?: string;
  notes?: string;
  satisfaction_score?: number;
  created_at?: string;
  updated_at?: string;
  profiles?: Profile; 
}

export interface Plan {
  id: string;
  slug: string;
  name: string;
  price: number;
  interval: string;
  duration_days: number;
  description: string;
  features: string[];
  is_active?: boolean;
  stripe_url?: string;
  style: {
    icon?: string;
    // Opcional como os demais campos: o formulário do admin edita `style`
    // parcialmente, e os consumidores já leem com `style?.color` + fallback.
    color?: string;
    highlight?: boolean;
    cta?: string;
  };
}

export interface Campaign {
  id: string;
  name: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  promo_price: number;
  promo_text: string;
  is_active: boolean;
  created_at?: string;
}
