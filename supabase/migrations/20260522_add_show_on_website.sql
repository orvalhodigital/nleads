-- Adiciona coluna show_on_website nas tabelas vehicles e motorcycles
-- Por padrão true (visível no site público)

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS show_on_website boolean NOT NULL DEFAULT true;

ALTER TABLE motorcycles
  ADD COLUMN IF NOT EXISTS show_on_website boolean NOT NULL DEFAULT true;
