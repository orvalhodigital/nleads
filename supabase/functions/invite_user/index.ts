import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Cliente admin — bypassa RLS, usado para criar/deletar usuários auth
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // Cliente do chamador — verifica identidade via JWT do request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Não autorizado' }, 401)
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user: caller }, error: authError } = await userClient.auth.getUser()
    if (authError || !caller) {
      return json({ error: 'Token inválido ou expirado' }, 401)
    }

    // Verifica o perfil do chamador (sem RLS via adminClient)
    const { data: callerProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, role, plan, plan_status, trial_ends_at, company_name')
      .eq('id', caller.id)
      .single()

    if (profileError || !callerProfile) {
      return json({ error: 'Perfil do chamador não encontrado' }, 403)
    }

    // Apenas empresa (ou admin Otimizza) pode gerenciar vendedores
    const allowedRoles = ['empresa', 'super_admin', 'admin']
    if (!allowedRoles.includes(callerProfile.role)) {
      return json({ error: 'Apenas empresas podem gerenciar vendedores' }, 403)
    }

    const body = await req.json()
    const { action } = body

    // ─────────────────────────────────────────────────────────────────────────
    // AÇÃO: create — cria novo vendedor vinculado à empresa chamadora
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'create') {
      const { email, password, full_name } = body

      if (!email || !password || !full_name) {
        return json({ error: 'Email, senha e nome completo são obrigatórios' }, 400)
      }

      // Cria o usuário no Supabase Auth
      // O trigger handle_new_user() criará o perfil automaticamente com role='vendedor'
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          role: 'vendedor',
        }
      })

      if (createError) {
        const msg = createError.message.includes('already registered')
          ? 'Este email já está cadastrado no sistema'
          : createError.message
        return json({ error: msg }, 400)
      }

      // Garante que o perfil existe e atualiza parent_id
      // (o trigger pode já ter criado, upsert garante idempotência)
      const { error: upsertError } = await adminClient
        .from('profiles')
        .upsert({
          id: newUser.user.id,
          email,
          full_name,
          role: 'vendedor',
          parent_id: callerProfile.id,
          plan: 'trial',
          plan_status: 'active',
          trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }, { onConflict: 'id' })

      if (upsertError) throw upsertError

      return json({ success: true, user_id: newUser.user.id })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AÇÃO: update — atualiza nome, senha e/ou meta do vendedor
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'update') {
      const { target_user_id, full_name, password, monthly_sales_goal } = body

      if (!target_user_id) {
        return json({ error: 'target_user_id é obrigatório' }, 400)
      }

      // Verifica que o vendedor pertence à empresa chamadora
      const { data: target, error: targetError } = await adminClient
        .from('profiles')
        .select('id, parent_id, role')
        .eq('id', target_user_id)
        .single()

      if (targetError || !target) {
        return json({ error: 'Vendedor não encontrado' }, 404)
      }

      if (target.parent_id !== callerProfile.id && !['admin', 'super_admin'].includes(callerProfile.role)) {
        return json({ error: 'Este vendedor não pertence à sua empresa' }, 403)
      }

      // Atualiza os campos do perfil
      const profileUpdates: Record<string, any> = {}
      if (full_name !== undefined) profileUpdates.full_name = full_name
      if (monthly_sales_goal !== undefined) profileUpdates.monthly_sales_goal = monthly_sales_goal

      if (Object.keys(profileUpdates).length > 0) {
        const { error: updateError } = await adminClient
          .from('profiles')
          .update(profileUpdates)
          .eq('id', target_user_id)
        if (updateError) throw updateError
      }

      // Atualiza senha se fornecida
      if (password) {
        const { error: passError } = await adminClient.auth.admin.updateUserById(
          target_user_id,
          { password }
        )
        if (passError) throw passError
      }

      return json({ success: true })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AÇÃO: remove — remove vendedor da empresa
    // Os leads do vendedor ficam com user_id preservado (não são deletados)
    // ─────────────────────────────────────────────────────────────────────────
    if (action === 'remove') {
      const { target_user_id } = body

      if (!target_user_id) {
        return json({ error: 'target_user_id é obrigatório' }, 400)
      }

      // Verifica que o vendedor pertence à empresa chamadora
      const { data: target, error: targetError } = await adminClient
        .from('profiles')
        .select('id, parent_id, role')
        .eq('id', target_user_id)
        .single()

      if (targetError || !target) {
        return json({ error: 'Vendedor não encontrado' }, 404)
      }

      if (target.parent_id !== callerProfile.id && !['admin', 'super_admin'].includes(callerProfile.role)) {
        return json({ error: 'Este vendedor não pertence à sua empresa' }, 403)
      }

      // Remove o perfil (os leads ficam com admin_id preservado, visíveis para a empresa)
      await adminClient.from('profiles').delete().eq('id', target_user_id)

      // Remove o usuário do Supabase Auth
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(target_user_id)
      if (deleteError) throw deleteError

      return json({ success: true })
    }

    return json({ error: `Ação desconhecida: "${action}"` }, 400)

  } catch (e: any) {
    console.error('[invite_user]', e)
    return json({ error: e.message || 'Erro interno no servidor' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
