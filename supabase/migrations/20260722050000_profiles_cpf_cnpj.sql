-- ============================================================================
-- A48 — Coluna cpf_cnpj em profiles (exigida pelo Asaas para cobrança)
-- ============================================================================
-- O Asaas EXIGE cpfCnpj para criar um cliente que será cobrado. O upgrade
-- falhava em "Failed to create customer in Asaas" porque o perfil não guardava
-- CPF/CNPJ e o endpoint não o enviava. Agora o checkout coleta o CPF/CNPJ e o
-- endpoint o persiste aqui para os próximos pagamentos.
--
-- Não é coluna privilegiada (fora do trigger protect_profile_privileged_columns),
-- então o próprio lojista pode salvar o seu; o endpoint grava via service_role.
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cpf_cnpj text;
