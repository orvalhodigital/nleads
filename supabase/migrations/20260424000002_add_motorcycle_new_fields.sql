-- Add new motorcycle fields: gallery_images, start_type, brake_type, fuel_system, cooling, has_spare_key, has_owner_manual

ALTER TABLE motorcycles
  ADD COLUMN IF NOT EXISTS gallery_images text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS start_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS brake_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fuel_system text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cooling text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS has_spare_key boolean DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS has_owner_manual boolean DEFAULT NULL;

ALTER TABLE motorcycles
  ADD CONSTRAINT IF NOT EXISTS motorcycles_start_type_check
    CHECK (start_type IS NULL OR start_type IN ('Elétrica', 'Pedal', 'Ambos'));

ALTER TABLE motorcycles
  ADD CONSTRAINT IF NOT EXISTS motorcycles_fuel_system_check
    CHECK (fuel_system IS NULL OR fuel_system IN ('Carburador', 'Injeção Eletrônica'));

ALTER TABLE motorcycles
  ADD CONSTRAINT IF NOT EXISTS motorcycles_cooling_check
    CHECK (cooling IS NULL OR cooling IN ('Ar', 'Líquida'));
