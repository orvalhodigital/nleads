-- ============================================================
-- nLeads Veículos — Script de Dados de Teste
-- ============================================================
-- IMPORTANTE: Substitua 'YOUR_USER_ID' pelo seu user_id do Supabase Auth

-- Variáveis para usar
-- Telefone padrão: 27999236605
-- User ID: será substituído por YOU_USER_ID

-- ============================================================
-- 1. VEÍCULOS (VEHICLES)
-- ============================================================

INSERT INTO vehicles (
    user_id, brand, model, year, model_year, plate, price,
    type, transmission, engine, mileage, color,
    is_single_owner, is_service_history_complete, is_ipva_paid, has_warranty,
    optionals, image_url, gallery_images, status, sale_phase
) VALUES
-- Carro 1: Toyota Corolla Disponível
(
    'YOUR_USER_ID', 'Toyota', 'Corolla', 2022, 2023, 'ABC-1234',
    95000,
    'Sedan', 'Automático', '2.0',
    15000, 'Prata',
    true, true, true, true,
    ARRAY['Ar-condicionado', 'Direção hidráulica', 'Vidros elétricos'],
    'https://via.placeholder.com/400x300?text=Toyota+Corolla',
    ARRAY[]::text[],
    'available',
    'disponivel'
),

-- Carro 2: Honda Civic Reservado
(
    'YOUR_USER_ID', 'Honda', 'Civic', 2021, 2021, 'XYZ-5678',
    110000,
    'Sedan', 'Manual', '1.8',
    25000, 'Branco',
    false, true, false, false,
    ARRAY['Ar-condicionado', 'Vidros elétricos'],
    'https://via.placeholder.com/400x300?text=Honda+Civic',
    ARRAY[]::text[],
    'available',
    'reservado'
),

-- Carro 3: Ford Ranger Vendido
(
    'YOUR_USER_ID', 'Ford', 'Ranger', 2020, 2020, 'DEF-9012',
    140000,
    'Picape', 'Automático', '3.2',
    45000, 'Preto',
    true, true, true, true,
    ARRAY['Ar-condicionado', '4x4', 'Direção hidráulica', 'Vidros elétricos', 'Banco aquecido'],
    'https://via.placeholder.com/400x300?text=Ford+Ranger',
    ARRAY[]::text[],
    'sold',
    'vendido'
),

-- Carro 4: Volkswagen Gol Em Trânsito
(
    'YOUR_USER_ID', 'Volkswagen', 'Gol', 2019, 2019, 'GHI-3456',
    65000,
    'Hatch', 'Manual', '1.6',
    55000, 'Vermelho',
    false, false, true, false,
    ARRAY['Ar-condicionado'],
    'https://via.placeholder.com/400x300?text=Volkswagen+Gol',
    ARRAY[]::text[],
    'available',
    'em_transito'
),

-- Carro 5: Hyundai HB20 Disponível
(
    'YOUR_USER_ID', 'Hyundai', 'HB20', 2023, 2023, 'JKL-7890',
    85000,
    'Hatch', 'Automático', '1.0',
    5000, 'Azul',
    true, true, true, true,
    ARRAY['Ar-condicionado', 'Vidros elétricos', 'Direção hidráulica'],
    'https://via.placeholder.com/400x300?text=Hyundai+HB20',
    ARRAY[]::text[],
    'available',
    'disponivel'
);

-- ============================================================
-- 2. MOTOS (MOTORCYCLES)
-- ============================================================

INSERT INTO motorcycles (
    user_id, brand, model, year, model_year, plate, price,
    category, engine, mileage, color,
    is_single_owner, has_warranty, is_ipva_paid,
    optionals, image_url, status
) VALUES

-- Moto 1: Honda CB 500 Disponível
(
    'YOUR_USER_ID', 'Honda', 'CB 500', 2022, 2023, 'MNO-1111',
    45000,
    'Naked', '500cc', 8000, 'Preto',
    true, true, true,
    ARRAY['ABS', 'Freios a disco'],
    'https://via.placeholder.com/400x300?text=Honda+CB+500',
    'available'
),

-- Moto 2: Yamaha YZF-R3 Disponível
(
    'YOUR_USER_ID', 'Yamaha', 'YZF-R3', 2021, 2021, 'PQR-2222',
    38000,
    'Sport', '320cc', 12000, 'Vermelho',
    false, false, true,
    ARRAY['Freios a disco'],
    'https://via.placeholder.com/400x300?text=Yamaha+YZF-R3',
    'available'
),

-- Moto 3: Kawasaki Ninja Vendida
(
    'YOUR_USER_ID', 'Kawasaki', 'Ninja 400', 2020, 2020, 'STU-3333',
    50000,
    'Sport', '400cc', 20000, 'Verde',
    true, true, false,
    ARRAY['ABS', 'Freios a disco'],
    'https://via.placeholder.com/400x300?text=Kawasaki+Ninja',
    'sold'
);

-- ============================================================
-- 3. LEADS
-- ============================================================

INSERT INTO leads (
    user_id, name, phone, email, phase, temperature,
    tipos_veiculo, valor_minimo, valor_maximo, marcas, modelos,
    transmissao, motorizacao, observacoes_adicionais,
    possui_entrada, valor_entrada, possui_troca, veiculo_troca,
    presented_vehicles, source, notes,
    visit_date, visit_status, tags,
    scheduling_data, simulation_data, follow_up_data
) VALUES

-- Lead 1: João Silva - Novo Lead
(
    'YOUR_USER_ID', 'João Silva', '27999236605', 'joao@email.com',
    'Novo Lead', 'Morna',
    ARRAY['Sedan', 'Hatch'], 60000, 150000, ARRAY['Toyota', 'Honda'], ARRAY['Corolla', 'Civic'],
    ARRAY['Automático'], ARRAY['1.8', '2.0'], 'Procura carro automático com ar-condicionado',
    true, 20000, false, '',
    ARRAY[]::uuid[], 'Site', 'Primeiro contato realizado',
    '2024-04-25', 'pending', ARRAY['prioritário'],
    '{"date": "2024-04-25", "time": "14:00", "vehicleOfInterest": "", "notes": "Reagendado para sexta", "appointments": []}'::jsonb,
    '{"cpf": "123.456.789-00", "cnh": "9876543210", "downPayment": 20000, "installments": 60, "notes": ""}'::jsonb,
    '{"nextContactDate": "2024-04-26", "notes": "Cliente manifestou interesse no Corolla", "is_buyer": false}'::jsonb
),

-- Lead 2: Maria Santos - Follow-up
(
    'YOUR_USER_ID', 'Maria Santos', '27999236605', 'maria@email.com',
    'Follow-up', 'Quente',
    ARRAY['Picape'], 120000, 180000, ARRAY['Ford', 'Chevrolet'], ARRAY['Ranger', 'S10'],
    ARRAY['Automático', 'Manual'], ARRAY['3.2', '2.8'], 'Quer picape 4x4 para trabalho',
    true, 40000, true, 'Chevrolet D20 2010',
    ARRAY[]::uuid[], 'Indicação', 'Recomendado por cliente anterior',
    '2024-04-20', 'show', ARRAY['trabalho', 'urgent'],
    '{"date": "2024-04-20", "time": "10:00", "vehicleOfInterest": "", "notes": "Visitou e gostou da Ranger", "appointments": []}'::jsonb,
    '{"cpf": "987.654.321-00", "cnh": "1234567890", "downPayment": 40000, "installments": 48, "notes": ""}'::jsonb,
    '{"nextContactDate": "2024-04-27", "notes": "Aguardando aprovação de crédito", "is_buyer": false}'::jsonb
),

-- Lead 3: Carlos Oliveira - Simulação
(
    'YOUR_USER_ID', 'Carlos Oliveira', '27999236605', 'carlos@email.com',
    'Simulação', 'Morna',
    ARRAY['Sedan'], 80000, 120000, ARRAY['Honda', 'Hyundai'], ARRAY['Civic', 'HB20'],
    ARRAY['Automático'], ARRAY['1.8', '2.0'], 'Procura carro novo, automático',
    false, 15000, false, '',
    ARRAY[]::uuid[], 'Facebook', 'Clique no anúncio do HB20',
    '2024-04-22', 'pending', ARRAY[]::text[],
    '{"date": "2024-04-22", "time": "15:30", "vehicleOfInterest": "", "notes": "", "appointments": []}'::jsonb,
    '{"cpf": "111.222.333-44", "cnh": "5555555555", "downPayment": 15000, "installments": 72, "notes": "Primeira vez comprando"}'::jsonb,
    '{"nextContactDate": "2024-04-28", "notes": "Aguardando simulação de crédito", "is_buyer": false}'::jsonb
),

-- Lead 4: Ana Costa - Aguardando Pagamento (vai ser comprador)
(
    'YOUR_USER_ID', 'Ana Costa', '27999236605', 'ana@email.com',
    'Aguardando Pagamento', 'Quente',
    ARRAY['Picape'], 130000, 160000, ARRAY['Ford'], ARRAY['Ranger'],
    ARRAY['Automático'], ARRAY['3.2'], 'Comprou a Ranger preta',
    true, 35000, false, '',
    ARRAY[]::uuid[], 'WhatsApp', 'Vendida com sucesso',
    '2024-04-15', 'show', ARRAY['venda_concluida'],
    '{"date": "2024-04-15", "time": "11:00", "vehicleOfInterest": "", "notes": "Visitou e comprou", "appointments": []}'::jsonb,
    '{"cpf": "555.666.777-88", "cnh": "9999999999", "downPayment": 35000, "installments": 48, "notes": ""}'::jsonb,
    '{"nextContactDate": "2024-05-01", "notes": "Aguardando transferência", "is_buyer": true}'::jsonb
),

-- Lead 5: Pedro Lima - Desqualificado
(
    'YOUR_USER_ID', 'Pedro Lima', '27999236605', 'pedro@email.com',
    'Desqualificados', 'Fria',
    ARRAY['SUV'], 200000, 300000, ARRAY[]::text[], ARRAY[]::text[],
    ARRAY[]::text[], ARRAY[]::text[], 'Procurava Range Rover, fora do orçamento',
    false, 0, false, '',
    ARRAY[]::uuid[], 'Telefone', 'Ligou procurando Range Rover',
    NULL, 'pending', ARRAY['sem_interesse'],
    '{}'::jsonb,
    '{}'::jsonb,
    '{"nextContactDate": null, "notes": "Sem orçamento para a faixa de preço desejada", "is_buyer": false}'::jsonb
);

-- ============================================================
-- 4. ATUALIZAR VEÍCULOS COM SALE_DETAILS (vendidos)
-- ============================================================

-- Ford Ranger com venda completa
UPDATE vehicles
SET sale_details = jsonb_build_object(
    'salePrice', 140000,
    'saleDate', '2024-04-15',
    'buyerLeadId', (SELECT id FROM leads WHERE name = 'Ana Costa' LIMIT 1),
    'buyerName', 'Ana Costa',
    'isFollowUpSale', true
)
WHERE brand = 'Ford' AND model = 'Ranger' AND status = 'sold';

-- Kawasaki Ninja com venda completa
UPDATE motorcycles
SET sale_details = jsonb_build_object(
    'salePrice', 50000,
    'saleDate', '2024-04-10',
    'buyerLeadId', NULL,
    'buyerName', 'Cliente Walk-in',
    'isFollowUpSale', false
)
WHERE brand = 'Kawasaki' AND status = 'sold';

-- ============================================================
-- 5. ÍNDICES (já devem existir, mas por segurança)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_sale_phase ON vehicles(sale_phase);
CREATE INDEX IF NOT EXISTS idx_motorcycles_user_id ON motorcycles(user_id);
CREATE INDEX IF NOT EXISTS idx_motorcycles_status ON motorcycles(status);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_phase ON leads(phase);
CREATE INDEX IF NOT EXISTS idx_leads_temperature ON leads(temperature);

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================

-- Verificar dados inseridos
SELECT 'Veículos' as tipo, COUNT(*) as total FROM vehicles WHERE user_id = 'YOUR_USER_ID'
UNION ALL
SELECT 'Motos', COUNT(*) FROM motorcycles WHERE user_id = 'YOUR_USER_ID'
UNION ALL
SELECT 'Leads', COUNT(*) FROM leads WHERE user_id = 'YOUR_USER_ID';

-- Listar leads com telefone de teste
SELECT name, phone, phase, temperature FROM leads WHERE phone = '27999236605' ORDER BY created_at DESC;

-- Listar veículos disponíveis
SELECT brand, model, year, price, sale_phase FROM vehicles WHERE user_id = 'YOUR_USER_ID' AND status = 'available' ORDER BY created_at DESC;
