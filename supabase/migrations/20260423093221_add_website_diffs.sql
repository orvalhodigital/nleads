-- Execute este código SQL no editor SQL do Supabase para adicionar as novas colunas à tabela profiles

ALTER TABLE profiles
ADD COLUMN website_diff1_active boolean DEFAULT true,
ADD COLUMN website_diff1_title text,
ADD COLUMN website_diff1_sub text,
ADD COLUMN website_diff2_active boolean DEFAULT true,
ADD COLUMN website_diff2_title text,
ADD COLUMN website_diff2_sub text,
ADD COLUMN website_diff3_active boolean DEFAULT true,
ADD COLUMN website_diff3_title text,
ADD COLUMN website_diff3_sub text,
ADD COLUMN website_diff4_active boolean DEFAULT true,
ADD COLUMN website_diff4_title text,
ADD COLUMN website_diff4_sub text;