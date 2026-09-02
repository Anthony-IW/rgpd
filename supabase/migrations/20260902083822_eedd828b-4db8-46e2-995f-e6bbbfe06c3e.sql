CREATE TABLE public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text not null,
  entity_type text,
  entity_id uuid,
  entity_label text,
  details jsonb,
  created_at timestamptz not null default now()
);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs (created_at DESC);
CREATE INDEX idx_activity_logs_actor ON public.activity_logs (actor_id);

GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read activity logs" ON public.activity_logs
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can log their own session events" ON public.activity_logs
FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid() AND action IN ('login','logout'));

CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action text;
  v_row record;
  v_label text;
  v_email text;
BEGIN
  IF TG_OP = 'DELETE' THEN v_row := OLD; v_action := TG_ARGV[0] || '.deleted';
  ELSIF TG_OP = 'INSERT' THEN v_row := NEW; v_action := TG_ARGV[0] || '.created';
  ELSE v_row := NEW; v_action := TG_ARGV[0] || '.updated';
  END IF;

  BEGIN
    v_label := to_jsonb(v_row) ->> TG_ARGV[1];
  EXCEPTION WHEN OTHERS THEN v_label := NULL;
  END;

  SELECT email INTO v_email FROM public.profiles WHERE id = auth.uid();

  INSERT INTO public.activity_logs (actor_id, actor_email, action, entity_type, entity_id, entity_label)
  VALUES (auth.uid(), v_email, v_action, TG_ARGV[0], (to_jsonb(v_row) ->> 'id')::uuid, v_label);

  RETURN v_row;
END;
$$;

CREATE TRIGGER trg_log_companies AFTER INSERT OR UPDATE OR DELETE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.log_activity('company', 'name');

CREATE TRIGGER trg_log_audits AFTER INSERT OR UPDATE OR DELETE ON public.audits
FOR EACH ROW EXECUTE FUNCTION public.log_activity('audit', 'title');

CREATE TRIGGER trg_log_action_plans AFTER INSERT OR UPDATE OR DELETE ON public.action_plans
FOR EACH ROW EXECUTE FUNCTION public.log_activity('action', 'title');

CREATE TRIGGER trg_log_processing_records AFTER INSERT OR UPDATE OR DELETE ON public.processing_records
FOR EACH ROW EXECUTE FUNCTION public.log_activity('traitement', 'name');

CREATE TRIGGER trg_log_subcontractors AFTER INSERT OR UPDATE OR DELETE ON public.subcontractors
FOR EACH ROW EXECUTE FUNCTION public.log_activity('sous_traitant', 'name');

CREATE TRIGGER trg_log_data_breaches AFTER INSERT OR UPDATE OR DELETE ON public.data_breaches
FOR EACH ROW EXECUTE FUNCTION public.log_activity('violation', 'description');

CREATE TRIGGER trg_log_dsr AFTER INSERT OR UPDATE OR DELETE ON public.data_subject_requests
FOR EACH ROW EXECUTE FUNCTION public.log_activity('demande_droit', 'requester_name');

CREATE TRIGGER trg_log_consents AFTER INSERT OR UPDATE OR DELETE ON public.consents
FOR EACH ROW EXECUTE FUNCTION public.log_activity('consentement', 'purpose');

CREATE TRIGGER trg_log_dpia AFTER INSERT OR UPDATE OR DELETE ON public.dpia
FOR EACH ROW EXECUTE FUNCTION public.log_activity('dpia', 'title');

CREATE TRIGGER trg_log_calendar_events AFTER INSERT OR UPDATE OR DELETE ON public.calendar_events
FOR EACH ROW EXECUTE FUNCTION public.log_activity('evenement', 'title');

CREATE TRIGGER trg_log_documents AFTER INSERT OR UPDATE OR DELETE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.log_activity('document', 'title');

CREATE TRIGGER trg_log_ref_questions AFTER INSERT OR UPDATE OR DELETE ON public.ref_questions
FOR EACH ROW EXECUTE FUNCTION public.log_activity('question', 'code');

CREATE TRIGGER trg_log_company_users AFTER INSERT OR DELETE ON public.company_users
FOR EACH ROW EXECUTE FUNCTION public.log_activity('acces_client', 'user_id');

CREATE TRIGGER trg_log_user_roles AFTER INSERT OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_activity('role_utilisateur', 'role');