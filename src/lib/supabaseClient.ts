import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('🚨 SUPABASE CONFIGURATION ERROR: Missing Supabase credentials!')
  console.error('Please add these variables to your .env.local file:')
  console.error('VITE_SUPABASE_URL=your-project-url')
  console.error('VITE_SUPABASE_ANON_KEY=your-anon-key')
  console.error('Get these from your Supabase project dashboard: https://app.supabase.com')
}

/**
 * Cliente Supabase configurado com melhores práticas de segurança e persistência de sessão.
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'x-application-name': 'n-leads-veiculos',
      },
    },
  }
)

/**
 * Interceptor/Helper para tratamento global de erros da API do Supabase.
 * Pode ser utilizado como wrapper nas chamadas ao banco (Ex: await handleSupabaseError(supabase.from(...).select(...))).
 * Intercepta erros de autenticação (como JWT expirado) para forçar o logoff e não quebrar o app silenciosamente.
 * 
 * @param response A resposta estruturada do supabase, ex: { data, error }
 * @returns Retorna os dados se não houver erro, caso contrário lida com o erro
 */
export const handleSupabaseResponse = <T>(response: { data: T | null; error: any }): T | null => {
  const { data, error } = response

  if (error) {
    console.error('[Supabase Error]:', error)

    // Detecção de sessão expirada ou token JWT inválido (PGRST301 no PostgREST, etc.)
    if (
      error.code === 'PGRST301' || 
      error.message?.toLowerCase().includes('jwt') || 
      error.message?.toLowerCase().includes('expired')
    ) {
      console.warn('Sessão expirada ou não autenticada. Forçando logoff.')
      // Redirecionamento e limpeza manual podem ser necessários no contexto do React Router
      supabase.auth.signOut().then(() => {
        window.location.href = '/login'
      })
    }
    throw error
  }

  return data
}
