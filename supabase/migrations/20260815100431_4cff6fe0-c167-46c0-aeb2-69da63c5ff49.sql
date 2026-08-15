CREATE POLICY "own template files select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'user-templates' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own template files insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user-templates' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own template files update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'user-templates' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'user-templates' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own template files delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'user-templates' AND (storage.foldername(name))[1] = auth.uid()::text);