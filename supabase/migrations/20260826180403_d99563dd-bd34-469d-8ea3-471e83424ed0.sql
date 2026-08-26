-- Phase 1 : modules de conformité légale

-- 1. Sous-traitants et DPA
CREATE TABLE public.subcontractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  country TEXT,
  website TEXT,
  dpa_signed_at DATE,
  dpa_renewal_date DATE,
  safeguards TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subcontractors TO authenticated;
GRANT ALL ON public.subcontractors TO service_role;
ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_subcontractors_updated BEFORE UPDATE ON public.subcontractors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Owners/admins manage subcontractors"
  ON public.subcontractors FOR ALL TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients view company subcontractors"
  ON public.subcontractors FOR SELECT TO authenticated
  USING (public.is_company_client(auth.uid(), company_id));
CREATE INDEX idx_subcontractors_company ON public.subcontractors(company_id);
CREATE INDEX idx_subcontractors_renewal ON public.subcontractors(dpa_renewal_date);

-- 2. Demandes d'exercice des droits
CREATE TABLE public.data_subject_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  channel TEXT,
  requester_name TEXT,
  requester_email TEXT,
  received_at DATE NOT NULL,
  response_due_at DATE,
  status TEXT NOT NULL DEFAULT 'en_cours',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.data_subject_requests TO authenticated;
GRANT ALL ON public.data_subject_requests TO service_role;
ALTER TABLE public.data_subject_requests ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_data_subject_requests_updated BEFORE UPDATE ON public.data_subject_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Owners/admins manage DRO"
  ON public.data_subject_requests FOR ALL TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients view company DRO"
  ON public.data_subject_requests FOR SELECT TO authenticated
  USING (public.is_company_client(auth.uid(), company_id));
CREATE INDEX idx_data_subject_requests_company ON public.data_subject_requests(company_id);
CREATE INDEX idx_data_subject_requests_due ON public.data_subject_requests(response_due_at);

-- 3. Violations de données
CREATE TABLE public.data_breaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discovery_at TIMESTAMPTZ NOT NULL,
  notification_due_at TIMESTAMPTZ,
  severity TEXT NOT NULL DEFAULT 'moyen',
  data_categories TEXT[],
  affected_count INTEGER,
  description TEXT,
  measures_taken TEXT,
  notified_cnil BOOLEAN DEFAULT false,
  notified_subjects BOOLEAN DEFAULT false,
  related_action_id UUID REFERENCES public.action_plans(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'ouvert',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.data_breaches TO authenticated;
GRANT ALL ON public.data_breaches TO service_role;
ALTER TABLE public.data_breaches ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_data_breaches_updated BEFORE UPDATE ON public.data_breaches FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Owners/admins manage breaches"
  ON public.data_breaches FOR ALL TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients view company breaches"
  ON public.data_breaches FOR SELECT TO authenticated
  USING (public.is_company_client(auth.uid(), company_id));
CREATE INDEX idx_data_breaches_company ON public.data_breaches(company_id);
CREATE INDEX idx_data_breaches_due ON public.data_breaches(notification_due_at);

-- 4. Consentements
CREATE TABLE public.consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  form_version TEXT,
  given_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  proof TEXT,
  status TEXT NOT NULL DEFAULT 'donne',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consents TO authenticated;
GRANT ALL ON public.consents TO service_role;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_consents_updated BEFORE UPDATE ON public.consents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Owners/admins manage consents"
  ON public.consents FOR ALL TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients view company consents"
  ON public.consents FOR SELECT TO authenticated
  USING (public.is_company_client(auth.uid(), company_id));
CREATE INDEX idx_consents_company ON public.consents(company_id);

-- 5. DPIA
CREATE TABLE public.dpia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  audit_id UUID REFERENCES public.audits(id) ON DELETE SET NULL,
  processing_record_id UUID REFERENCES public.processing_records(id) ON DELETE SET NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  necessity_assessment TEXT,
  proportionality_assessment TEXT,
  risk_assessment TEXT,
  measures TEXT,
  residual_risk_score INTEGER,
  status TEXT NOT NULL DEFAULT 'brouillon',
  validated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dpia TO authenticated;
GRANT ALL ON public.dpia TO service_role;
ALTER TABLE public.dpia ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_dpia_updated BEFORE UPDATE ON public.dpia FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Owners/admins manage DPIA"
  ON public.dpia FOR ALL TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients view company DPIA"
  ON public.dpia FOR SELECT TO authenticated
  USING (public.is_company_client(auth.uid(), company_id));
CREATE INDEX idx_dpia_company ON public.dpia(company_id);
CREATE INDEX idx_dpia_audit ON public.dpia(audit_id);
