-- Add new vehicle fields: fuel_type, doors, has_spare_key, has_owner_manual
-- Also adds fipe_price which was missing from the type definitions

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS fipe_price numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fuel_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS doors integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS has_spare_key boolean DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS has_owner_manual boolean DEFAULT NULL;

ALTER TABLE vehicles
  ADD CONSTRAINT IF NOT EXISTS vehicles_fuel_type_check
    CHECK (fuel_type IS NULL OR fuel_type IN ('Gasolina', 'Álcool', 'Flex', 'Diesel', 'GNV'));

ALTER TABLE vehicles
  ADD CONSTRAINT IF NOT EXISTS vehicles_doors_check
    CHECK (doors IS NULL OR doors IN (2, 4));
