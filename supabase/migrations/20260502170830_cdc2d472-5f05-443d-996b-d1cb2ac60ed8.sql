
CREATE POLICY "Owners view linked client profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      JOIN public.companies c ON c.id = cu.company_id
      WHERE cu.user_id = profiles.id AND c.owner_id = auth.uid()
    )
  );
