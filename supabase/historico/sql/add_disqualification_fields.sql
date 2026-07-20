-- Add columns for disqualification details to the leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS disqualification_reasons text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS disqualification_notes text DEFAULT '';
