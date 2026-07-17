-- Campos necessários para assinatura recorrente de verdade no Asaas (em vez de
-- cobrança avulsa). asaas_customer_id/asaas_subscription_id identificam a
-- assinatura do usuário no Asaas; last_asaas_payment_id evita reprocessar o
-- mesmo evento de pagamento duas vezes (idempotência por pagamento, não mais
-- por "já está pro/ativo" — isso bloqueava a renovação mensal).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS last_asaas_payment_id TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_asaas_subscription_id ON profiles(asaas_subscription_id);
