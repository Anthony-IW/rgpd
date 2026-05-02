
-- Calendar events table
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE,
  all_day BOOLEAN NOT NULL DEFAULT false,
  color TEXT DEFAULT '#3B82F6',
  location TEXT,
  related_action_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own company events"
ON public.calendar_events FOR SELECT TO authenticated
USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clients view their company events"
ON public.calendar_events FOR SELECT TO authenticated
USING (is_company_client(auth.uid(), company_id));

CREATE POLICY "Users insert events"
ON public.calendar_events FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users update own events"
ON public.calendar_events FOR UPDATE TO authenticated
USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users delete own events"
ON public.calendar_events FOR DELETE TO authenticated
USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER calendar_events_updated_at
BEFORE UPDATE ON public.calendar_events
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_calendar_events_company ON public.calendar_events(company_id);
CREATE INDEX idx_calendar_events_start ON public.calendar_events(start_at);

-- Notification log to avoid duplicates
CREATE TABLE public.notification_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_type TEXT NOT NULL, -- 'action' | 'event'
  source_id UUID NOT NULL,
  milestone INTEGER NOT NULL, -- 15, 7, 2
  recipient_email TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (source_type, source_id, milestone, recipient_email)
);

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view notification log"
ON public.notification_log FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
