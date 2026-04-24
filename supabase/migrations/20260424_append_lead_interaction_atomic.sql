create or replace function public.append_lead_interaction(
  p_lead_id uuid,
  p_interaction jsonb
)
returns public.leads
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_updated public.leads;
begin
  update public.leads
  set
    interaction_history = coalesce(interaction_history, '[]'::jsonb) || jsonb_build_array(p_interaction),
    last_update = now()
  where id = p_lead_id
  returning * into v_updated;

  if v_updated.id is null then
    raise exception 'Lead não encontrado para adicionar interação.';
  end if;

  return v_updated;
end;
$$;
