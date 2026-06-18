-- Create the uploads bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to the uploads bucket
CREATE POLICY "authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- Allow authenticated users to update their own uploaded files
CREATE POLICY "authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'uploads');

-- Allow authenticated users to delete their own uploaded files
CREATE POLICY "authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'uploads');

-- Allow public read access to all files in uploads bucket
CREATE POLICY "public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'uploads');
