
-- 1. Add client role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';

-- 2. company_users table
CREATE TABLE public.company_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id)
);
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

-- helper: is current user a client of given company?
CREATE OR REPLACE FUNCTION public.is_company_client(_user_id uuid, _company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.company_users WHERE user_id = _user_id AND company_id = _company_id);
$$;

-- helper: list of company ids accessible to user as client
CREATE OR REPLACE FUNCTION public.user_client_companies(_user_id uuid)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.company_users WHERE user_id = _user_id;
$$;

-- RLS company_users
CREATE POLICY "Owners and admins manage company_users"
  ON public.company_users FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_users.company_id AND c.owner_id = auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_users.company_id AND c.owner_id = auth.uid())
  );

CREATE POLICY "Clients view own membership"
  ON public.company_users FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 3. action_plans : champs validation
ALTER TABLE public.action_plans
  ADD COLUMN IF NOT EXISTS pending_status public.action_status,
  ADD COLUMN IF NOT EXISTS pending_comment text,
  ADD COLUMN IF NOT EXISTS pending_submitted_by uuid,
  ADD COLUMN IF NOT EXISTS pending_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS validation_note text,
  ADD COLUMN IF NOT EXISTS validated_by uuid,
  ADD COLUMN IF NOT EXISTS validated_at timestamptz;

-- Étendre RLS action_plans pour les clients
CREATE POLICY "Clients view actions of their company"
  ON public.action_plans FOR SELECT TO authenticated
  USING (public.is_company_client(auth.uid(), company_id));

CREATE POLICY "Clients update status of their actions"
  ON public.action_plans FOR UPDATE TO authenticated
  USING (public.is_company_client(auth.uid(), company_id))
  WITH CHECK (public.is_company_client(auth.uid(), company_id));

-- Étendre RLS companies
CREATE POLICY "Clients view their company"
  ON public.companies FOR SELECT TO authenticated
  USING (public.is_company_client(auth.uid(), id));

-- Étendre RLS audits
CREATE POLICY "Clients view their company audits"
  ON public.audits FOR SELECT TO authenticated
  USING (public.is_company_client(auth.uid(), company_id));

-- Étendre RLS processing_records
CREATE POLICY "Clients view their company processing"
  ON public.processing_records FOR SELECT TO authenticated
  USING (public.is_company_client(auth.uid(), company_id));

-- Étendre RLS audit_responses
CREATE POLICY "Clients view audit responses of their company"
  ON public.audit_responses FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.audits a
    WHERE a.id = audit_responses.audit_id
      AND public.is_company_client(auth.uid(), a.company_id)
  ));

-- 4. action_attachments
CREATE TABLE public.action_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id uuid NOT NULL REFERENCES public.action_plans(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  uploaded_by uuid NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.action_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View attachments (owner/admin/client)"
  ON public.action_attachments FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.action_plans ap WHERE ap.id = action_attachments.action_id AND ap.owner_id = auth.uid())
    OR public.is_company_client(auth.uid(), company_id)
  );

CREATE POLICY "Insert attachments (owner/admin/client)"
  ON public.action_attachments FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR EXISTS (SELECT 1 FROM public.action_plans ap WHERE ap.id = action_attachments.action_id AND ap.owner_id = auth.uid())
      OR public.is_company_client(auth.uid(), company_id)
    )
  );

CREATE POLICY "Delete attachments (uploader/owner/admin)"
  ON public.action_attachments FOR DELETE TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.action_plans ap WHERE ap.id = action_attachments.action_id AND ap.owner_id = auth.uid())
  );

-- 5. Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('action-attachments', 'action-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Read action attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'action-attachments' AND EXISTS (
      SELECT 1 FROM public.action_attachments aa
      WHERE aa.file_path = storage.objects.name
        AND (
          has_role(auth.uid(), 'admin'::app_role)
          OR EXISTS (SELECT 1 FROM public.action_plans ap WHERE ap.id = aa.action_id AND ap.owner_id = auth.uid())
          OR public.is_company_client(auth.uid(), aa.company_id)
        )
    )
  );

CREATE POLICY "Upload action attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'action-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Delete own action attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'action-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
