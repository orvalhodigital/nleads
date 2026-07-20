-- Enable system_assets bucket for logo uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('system_assets', 'system_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public viewing of assets
CREATE POLICY "Public Access System Assets"
ON storage.objects FOR SELECT
USING ( bucket_id = 'system_assets' );

-- Policy to allow authenticated uploads (Admin Settings)
CREATE POLICY "Auth Upload System Assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'system_assets' );

-- Policy to allow updates
CREATE POLICY "Auth Update System Assets"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'system_assets' );
