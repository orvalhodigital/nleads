
export enum LeadPhase {
  NEW = 'Novo Lead',
  VISIT = 'Visita / Test Drive',
  SIMULATION = 'Simulação',
  FOLLOW_UP = 'Follow-up',
  WAITING_PAYMENT = 'Aguardando Pagamento',
  DOCUMENTATION = 'Documentação',
  DELIVERY = 'Entrega',
  COMPLETED = 'Compradores',
  DISQUALIFIED = 'Desqualificados'
}

export enum LeadTemperature {
  HOT = 'Quente',
  WARM = 'Morna',
  COLD = 'Fria'
}

export type VisitStatus = 'pending' | 'show' | 'noshow';

export type VehicleType = 'SUV' | 'Sedan' | 'Hatch' | 'Picape' | 'Esportivo' | 'Conversível' | 'Van' |
  // Tipos de Moto
  'Naked' | 'Sport' | 'Trail' | 'Custom' | 'Scooter' | 'Touring' | 'Elétrica' | 'Street' | 'Qualquer Um(a)';
export type TransmissionType = 'Manual' | 'Automático' | 'Qualquer Um(a)';
export type EngineType = '1.0' | '1.4' | '1.6' | '2.0+' | 'Elétrico' | 'Híbrido' | 'Qualquer Um(a)' |
  // Motorizações de Moto
  '110cc' | '125cc' | '150cc' | '160cc' | '190cc' | '250cc' | '300cc' | '400cc' | '600cc' | '750cc' | '1000cc' | '1200cc+';

export interface SaleDetails {
  salePrice: number;
  saleDate: string;
  buyerLeadId?: string; // ID do Lead comprador para vínculo
  buyerName: string;
  isFollowUpSale: boolean;
}

export interface Vehicle {
  id: string;
  model: string;
  brand: string;
  year: number;
  modelYear?: number;
  plate?: string;
  price: number;
  type: VehicleType;
  transmission: TransmissionType;
  engine: EngineType;
  mileage: number;
  color: string;
  isSingleOwner: boolean;
  isServiceHistoryComplete: boolean;
  isIpvaPaid: boolean;
  hasWarranty: boolean;
  optionals: string[];
  imageUrl: string;
  galleryImages: string[];
  status: 'available' | 'sold';
  saleDetails?: SaleDetails;
}

export interface LeadPreference {
  tipos_veiculo: VehicleType[];
  valor_minimo?: number;
  valor_maximo?: number;
  marcas: string[];
  modelos: string[];
  transmissao: TransmissionType[];
  motorizacao: EngineType[];
  observacoes_adicionais: string;
  possui_entrada: boolean;
  valor_entrada?: number;
  possui_troca: boolean;
  veiculo_troca?: string;
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

  // Novos campos de visita
  visit_date?: string;
  visit_status?: VisitStatus;

  // Tags
  tags?: string[];
  foto_url?: string;
  scheduling_data?: SchedulingData;
  simulation_data?: SimulationData;
  follow_up_data?: FollowUpData;

  // Buyer flag — when true, the lead purchased a car and should appear
  // in the "Compradores" column on the Leads page regardless of their
  // current sales-funnel phase (WAITING_PAYMENT, DOCUMENTATION, etc.)
  is_buyer?: boolean;
}

export interface SaleRecord {
  id: string;
  leadId: string;
  vehicleId: string;
  salePrice: number;
  date: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  plan: 'trial' | 'pro';
  planStatus: 'active' | 'expired';
  trialEndsAt: string;
  created_at?: string;
  webhook_url?: string;
  avatar_url?: string;
  company_name?: string;
  company_logo?: string;
  role?: string;
  phone?: string;
  // Vehicle Source Settings
  enable_manual_vehicles?: boolean;
  monthly_sales_goal?: number;
  enable_cars?: boolean;
  enable_motorcycles?: boolean;
  enable_trucks?: boolean;
  preset_messages?: string[];
  // Website settings
  website_active?: boolean;
  website_theme?: 'classic' | 'glass' | 'premium';
  website_primary_color?: string;
  website_hero_text?: string;
  website_whatsapp?: string;
  website_cta_text?: string;
  website_slug?: string;
  custom_domain?: string;
}

export interface LeadCommunication {
  id: string;
  lead_id: string;
  vehicle_id?: string;
  contact_name: string;
  contact_phone: string;
  message_body: string;
  is_sent: string;
  created_at: string;
  email_user?: string;
}

export type MotorcycleCategory = 'Naked' | 'Sport' | 'Trail' | 'Custom' | 'Scooter' | 'Touring' | 'Elétrica' | 'Street' | 'Qualquer Um(a)';

export interface Motorcycle {
  id: string;
  brand: string;
  model: string;
  year: number;
  modelYear?: number;
  plate?: string;
  price: number;
  category: MotorcycleCategory;
  engine: string;      // ex: '150cc', '300cc'
  mileage: number;
  color: string;
  isSingleOwner: boolean;
  hasWarranty: boolean;
  isIpvaPaid: boolean;
  optionals: string[];
  imageUrl: string;
  status: 'available' | 'sold';
  saleDetails?: SaleDetails;
}

export type View = 'dashboard' | 'inventory' | 'leads' | 'agenda' | 'sales-closed' | 'plans' | 'settings' | 'motorcycles' | 'onboarding' | 'support' | 'admin-tickets';

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
  profiles?: Profile; // Para joins
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
    color: string;
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
