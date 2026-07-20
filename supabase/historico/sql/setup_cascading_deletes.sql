-- Ensure Cascading Deletes for Data Integrity
-- When a Vehicle or Lead is deleted, related child records should be removed automatically.

-- 1. VEHICLE PHOTOS (If you have a separate table for multiple photos)
-- Check if table exists (this is generic safe SQL)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicle_photos') THEN
        ALTER TABLE public.vehicle_photos
        DROP CONSTRAINT IF EXISTS vehicle_photos_vehicle_id_fkey,
        ADD CONSTRAINT vehicle_photos_vehicle_id_fkey
        FOREIGN KEY (vehicle_id)
        REFERENCES public.vehicles(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 2. INTERACTIONS (Leads interactions)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interactions') THEN
        ALTER TABLE public.interactions
        DROP CONSTRAINT IF EXISTS interactions_lead_id_fkey,
        ADD CONSTRAINT interactions_lead_id_fkey
        FOREIGN KEY (lead_id)
        REFERENCES public.leads(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 3. SALES (If a vehicle is deleted, what happens to the sale record?)
-- Usually we keep sales for history, but if user requests "ALL DATA REMOVED", we cascade.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales') THEN
        ALTER TABLE public.sales
        DROP CONSTRAINT IF EXISTS sales_vehicle_id_fkey,
        ADD CONSTRAINT sales_vehicle_id_fkey
        FOREIGN KEY (vehicle_id)
        REFERENCES public.vehicles(id)
        ON DELETE CASCADE;
        
        ALTER TABLE public.sales
        DROP CONSTRAINT IF EXISTS sales_lead_id_fkey,
        ADD CONSTRAINT sales_lead_id_fkey
        FOREIGN KEY (lead_id)
        REFERENCES public.leads(id)
        ON DELETE CASCADE;
    END IF;
END $$;
