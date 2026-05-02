
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'auditor');
CREATE TYPE public.audit_status AS ENUM ('draft', 'in_progress', 'completed', 'archived');
CREATE TYPE public.compliance_level AS ENUM ('conforme', 'partiel', 'non_conforme', 'non_applicable', 'a_evaluer');
CREATE TYPE public.action_priority AS ENUM ('critique', 'haute', 'moyenne', 'basse');
CREATE TYPE public.action_status AS ENUM ('a_faire', 'en_cours', 'fait', 'reporte');
CREATE TYPE public.legal_basis AS ENUM ('consentement', 'contrat', 'obligation_legale', 'interets_vitaux', 'mission_interet_public', 'interets_legitimes');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  job_title TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

-- ============ COMPANIES ============
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  siret TEXT,
  legal_form TEXT,
  sector TEXT,
  size TEXT, -- TPE, PME, ETI, GE
  employees_count INTEGER,
  address TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'France',
  website TEXT,
  -- Contact principal
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_role TEXT,
  -- DPO
  has_dpo BOOLEAN DEFAULT false,
  dpo_name TEXT,
  dpo_email TEXT,
  dpo_phone TEXT,
  dpo_external BOOLEAN DEFAULT false,
  -- Représentant
  has_representative BOOLEAN DEFAULT false,
  representative_name TEXT,
  -- Notes
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- ============ AUDITS ============
CREATE TABLE public.audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status public.audit_status NOT NULL DEFAULT 'draft',
  scope TEXT, -- périmètre de l'audit
  start_date DATE,
  end_date DATE,
  completed_at TIMESTAMPTZ,
  global_score INTEGER, -- 0-100
  conformity_summary JSONB DEFAULT '{}'::jsonb,
  executive_summary TEXT,
  recommendations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

-- ============ AUDIT RESPONSES ============
CREATE TABLE public.audit_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL, -- ID de la question dans le référentiel
  category TEXT NOT NULL,
  level public.compliance_level NOT NULL DEFAULT 'a_evaluer',
  comment TEXT,
  evidence TEXT, -- preuves / éléments justificatifs
  recommendation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(audit_id, question_id)
);
ALTER TABLE public.audit_responses ENABLE ROW LEVEL SECURITY;

-- ============ PROCESSING RECORDS (Art. 30) ============
CREATE TABLE public.processing_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  purpose TEXT NOT NULL, -- finalité
  legal_basis public.legal_basis,
  legal_basis_details TEXT,
  data_categories TEXT[], -- catégories de données
  sensitive_data BOOLEAN DEFAULT false,
  sensitive_data_details TEXT,
  data_subjects TEXT[], -- catégories de personnes concernées
  recipients TEXT[], -- destinataires
  subcontractors TEXT[], -- sous-traitants
  retention_period TEXT, -- durée de conservation
  retention_justification TEXT,
  international_transfer BOOLEAN DEFAULT false,
  transfer_countries TEXT[],
  transfer_safeguards TEXT,
  security_measures TEXT,
  dpia_required BOOLEAN DEFAULT false,
  dpia_completed BOOLEAN DEFAULT false,
  dpia_url TEXT,
  source TEXT, -- origine des données
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.processing_records ENABLE ROW LEVEL SECURITY;

-- ============ ACTION PLANS ============
CREATE TABLE public.action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES public.audits(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority public.action_priority NOT NULL DEFAULT 'moyenne',
  status public.action_status NOT NULL DEFAULT 'a_faire',
  responsible TEXT,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  related_question_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;

-- ============ DOCUMENTS LIBRARY ============
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  content TEXT, -- contenu markdown du modèle
  file_url TEXT,
  is_template BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- ============ TRIGGERS UPDATED_AT ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_audits_updated BEFORE UPDATE ON public.audits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_audit_responses_updated BEFORE UPDATE ON public.audit_responses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_processing_records_updated BEFORE UPDATE ON public.processing_records FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_action_plans_updated BEFORE UPDATE ON public.action_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ NEW USER TRIGGER ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  -- Premier utilisateur = admin, sinon auditor
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'auditor');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ RLS POLICIES ============

-- profiles
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- user_roles
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- companies
CREATE POLICY "Users view own companies" ON public.companies FOR SELECT TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert companies" ON public.companies FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users update own companies" ON public.companies FOR UPDATE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users delete own companies" ON public.companies FOR DELETE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

-- audits
CREATE POLICY "Users view own audits" ON public.audits FOR SELECT TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert audits" ON public.audits FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users update own audits" ON public.audits FOR UPDATE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users delete own audits" ON public.audits FOR DELETE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

-- audit_responses
CREATE POLICY "Users view audit responses via audit" ON public.audit_responses FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.audits a WHERE a.id = audit_id AND (a.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Users insert audit responses" ON public.audit_responses FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.audits a WHERE a.id = audit_id AND a.owner_id = auth.uid())
);
CREATE POLICY "Users update audit responses" ON public.audit_responses FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.audits a WHERE a.id = audit_id AND (a.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Users delete audit responses" ON public.audit_responses FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.audits a WHERE a.id = audit_id AND (a.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);

-- processing_records
CREATE POLICY "Users view own processing" ON public.processing_records FOR SELECT TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert processing" ON public.processing_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users update own processing" ON public.processing_records FOR UPDATE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users delete own processing" ON public.processing_records FOR DELETE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

-- action_plans
CREATE POLICY "Users view own actions" ON public.action_plans FOR SELECT TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert actions" ON public.action_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users update own actions" ON public.action_plans FOR UPDATE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users delete own actions" ON public.action_plans FOR DELETE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

-- documents (lecture pour tous, gestion par admin)
CREATE POLICY "Authenticated read documents" ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage documents" ON public.documents FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- INDEXES
CREATE INDEX idx_companies_owner ON public.companies(owner_id);
CREATE INDEX idx_audits_company ON public.audits(company_id);
CREATE INDEX idx_audits_owner ON public.audits(owner_id);
CREATE INDEX idx_responses_audit ON public.audit_responses(audit_id);
CREATE INDEX idx_processing_company ON public.processing_records(company_id);
CREATE INDEX idx_actions_company ON public.action_plans(company_id);
CREATE INDEX idx_actions_audit ON public.action_plans(audit_id);
