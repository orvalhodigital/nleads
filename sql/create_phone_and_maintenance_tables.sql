-- Create Phones table
CREATE TABLE IF NOT EXISTS phones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    capacity TEXT, -- e.g. 128GB
    color TEXT,
    condition TEXT DEFAULT 'novo', -- novo, usado, vitrine
    battery_health INTEGER, -- percentage
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'available', -- available, reserved, sold
    image_url TEXT,
    imei TEXT,
    sale_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Phones
ALTER TABLE phones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own phones" 
ON phones FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Create Maintenances table
CREATE TABLE IF NOT EXISTS maintenances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    device_model TEXT NOT NULL,
    device_imei TEXT,
    problem_description TEXT,
    estimated_price DECIMAL(12,2),
    status TEXT DEFAULT 'aguardando_orcamento', -- aguardando_orcamento, em_manutencao, pronto, entregue, aguardando_peca
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Maintenances
ALTER TABLE maintenances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own maintenances" 
ON maintenances FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);
