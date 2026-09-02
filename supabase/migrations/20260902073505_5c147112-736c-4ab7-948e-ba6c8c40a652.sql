-- Enums
CREATE TYPE public.legal_status AS ENUM ('OBLIGATOIRE','OBLIGATOIRE_SI_APPLICABLE','RECOMMANDE','NON_OBLIGATOIRE_EN_TANT_QUE_TEL');
CREATE TYPE public.risk_level AS ENUM ('faible','moyen','eleve','critique');
CREATE TYPE public.rule_operator AS ENUM ('ALL','ANY','NOT');
CREATE TYPE public.tristate AS ENUM ('oui','non','inconnu');

-- Sectors
CREATE TABLE public.sectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sectors TO authenticated;
GRANT ALL ON public.sectors TO service_role;
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sectors_read" ON public.sectors FOR SELECT TO authenticated USING (true);
CREATE POLICY "sectors_admin" ON public.sectors FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.subsectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id uuid NOT NULL REFERENCES public.sectors(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  label text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);
CREATE INDEX idx_subsectors_sector ON public.subsectors(sector_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subsectors TO authenticated;
GRANT ALL ON public.subsectors TO service_role;
ALTER TABLE public.subsectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subsectors_read" ON public.subsectors FOR SELECT TO authenticated USING (true);
CREATE POLICY "subsectors_admin" ON public.subsectors FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.functional_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.functional_modules TO authenticated;
GRANT ALL ON public.functional_modules TO service_role;
ALTER TABLE public.functional_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modules_read" ON public.functional_modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "modules_admin" ON public.functional_modules FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.module_activation_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.functional_modules(id) ON DELETE CASCADE,
  step integer NOT NULL DEFAULT 4,
  text text NOT NULL,
  help text,
  position integer NOT NULL DEFAULT 0,
  unknown_keeps_questions boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);
CREATE INDEX idx_maq_module ON public.module_activation_questions(module_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.module_activation_questions TO authenticated;
GRANT ALL ON public.module_activation_questions TO service_role;
ALTER TABLE public.module_activation_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "maq_read" ON public.module_activation_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "maq_admin" ON public.module_activation_questions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.questionnaire_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number integer NOT NULL UNIQUE,
  label text,
  published_at timestamptz,
  published_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questionnaire_versions TO authenticated;
GRANT ALL ON public.questionnaire_versions TO service_role;
ALTER TABLE public.questionnaire_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qv_read" ON public.questionnaire_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "qv_admin" ON public.questionnaire_versions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.ref_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  version_id uuid REFERENCES public.questionnaire_versions(id) ON DELETE SET NULL,
  category_id text NOT NULL,
  category_name text,
  text text NOT NULL,
  help text,
  legal_reference text,
  legal_status public.legal_status NOT NULL DEFAULT 'RECOMMANDE',
  applicability_condition text,
  explanation text,
  risk public.risk_level NOT NULL DEFAULT 'moyen',
  recommendations text[] NOT NULL DEFAULT '{}',
  weight integer NOT NULL DEFAULT 1,
  is_core boolean NOT NULL DEFAULT false,
  needs_review boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  UNIQUE (code, version_id)
);
CREATE INDEX idx_ref_questions_version ON public.ref_questions(version_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ref_questions TO authenticated;
GRANT ALL ON public.ref_questions TO service_role;
ALTER TABLE public.ref_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "refq_read" ON public.ref_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "refq_admin" ON public.ref_questions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.question_sectors (
  question_id uuid NOT NULL REFERENCES public.ref_questions(id) ON DELETE CASCADE,
  sector_id uuid NOT NULL REFERENCES public.sectors(id) ON DELETE CASCADE,
  PRIMARY KEY (question_id, sector_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_sectors TO authenticated;
GRANT ALL ON public.question_sectors TO service_role;
ALTER TABLE public.question_sectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qs_read" ON public.question_sectors FOR SELECT TO authenticated USING (true);
CREATE POLICY "qs_admin" ON public.question_sectors FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.question_subsectors (
  question_id uuid NOT NULL REFERENCES public.ref_questions(id) ON DELETE CASCADE,
  subsector_id uuid NOT NULL REFERENCES public.subsectors(id) ON DELETE CASCADE,
  PRIMARY KEY (question_id, subsector_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_subsectors TO authenticated;
GRANT ALL ON public.question_subsectors TO service_role;
ALTER TABLE public.question_subsectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qss_read" ON public.question_subsectors FOR SELECT TO authenticated USING (true);
CREATE POLICY "qss_admin" ON public.question_subsectors FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.question_modules (
  question_id uuid NOT NULL REFERENCES public.ref_questions(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.functional_modules(id) ON DELETE CASCADE,
  exclusive boolean NOT NULL DEFAULT true,
  PRIMARY KEY (question_id, module_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_modules TO authenticated;
GRANT ALL ON public.question_modules TO service_role;
ALTER TABLE public.question_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qm_read" ON public.question_modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "qm_admin" ON public.question_modules FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.question_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.ref_questions(id) ON DELETE CASCADE,
  operator public.rule_operator NOT NULL DEFAULT 'ALL',
  conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_question_rules_question ON public.question_rules(question_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_rules TO authenticated;
GRANT ALL ON public.question_rules TO service_role;
ALTER TABLE public.question_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qr_read" ON public.question_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "qr_admin" ON public.question_rules FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Profil d'organisation
CREATE TABLE public.company_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  primary_sector_id uuid REFERENCES public.sectors(id) ON DELETE SET NULL,
  secondary_sector_ids uuid[] NOT NULL DEFAULT '{}',
  subsector_ids uuid[] NOT NULL DEFAULT '{}',
  respondent_name text,
  respondent_role text,
  headcount integer,
  size text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_profiles TO authenticated;
GRANT ALL ON public.company_profiles TO service_role;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cp_owner" ON public.company_profiles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND (c.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND (c.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "cp_client_read" ON public.company_profiles FOR SELECT TO authenticated
  USING (public.is_company_client(auth.uid(), company_id));

CREATE TABLE public.company_profile_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  module_code text NOT NULL,
  answer public.tristate NOT NULL DEFAULT 'inconnu',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, module_code)
);
CREATE INDEX idx_cpa_company ON public.company_profile_answers(company_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_profile_answers TO authenticated;
GRANT ALL ON public.company_profile_answers TO service_role;
ALTER TABLE public.company_profile_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cpa_owner" ON public.company_profile_answers FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND (c.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = company_id AND (c.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "cpa_client_read" ON public.company_profile_answers FOR SELECT TO authenticated
  USING (public.is_company_client(auth.uid(), company_id));

-- Périmètre figé par audit
CREATE TABLE public.audit_scope_snapshot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  included_modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  excluded_modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  version_id uuid REFERENCES public.questionnaire_versions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (audit_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_scope_snapshot TO authenticated;
GRANT ALL ON public.audit_scope_snapshot TO service_role;
ALTER TABLE public.audit_scope_snapshot ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ass_owner" ON public.audit_scope_snapshot FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.audits a WHERE a.id = audit_id AND (a.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.audits a WHERE a.id = audit_id AND (a.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "ass_client_read" ON public.audit_scope_snapshot FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.audits a WHERE a.id = audit_id AND public.is_company_client(auth.uid(), a.company_id)));

CREATE TABLE public.audit_questions_snapshot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  question_code text NOT NULL,
  category_id text NOT NULL,
  category_name text,
  text text NOT NULL,
  help text,
  legal_reference text,
  legal_status public.legal_status NOT NULL DEFAULT 'RECOMMANDE',
  applicability_condition text,
  risk public.risk_level NOT NULL DEFAULT 'moyen',
  weight integer NOT NULL DEFAULT 1,
  included boolean NOT NULL DEFAULT true,
  inclusion_reason text,
  exclusion_reason text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (audit_id, question_code)
);
CREATE INDEX idx_aqs_audit ON public.audit_questions_snapshot(audit_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_questions_snapshot TO authenticated;
GRANT ALL ON public.audit_questions_snapshot TO service_role;
ALTER TABLE public.audit_questions_snapshot ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aqs_owner" ON public.audit_questions_snapshot FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.audits a WHERE a.id = audit_id AND (a.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.audits a WHERE a.id = audit_id AND (a.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "aqs_client_read" ON public.audit_questions_snapshot FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.audits a WHERE a.id = audit_id AND public.is_company_client(auth.uid(), a.company_id)));

-- Extensions des tables existantes
ALTER TABLE public.audit_responses
  ADD COLUMN IF NOT EXISTS justification text,
  ADD COLUMN IF NOT EXISTS responsible text,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS cost_estimate numeric,
  ADD COLUMN IF NOT EXISTS priority text,
  ADD COLUMN IF NOT EXISTS remediation_state text;

ALTER TABLE public.audits
  ADD COLUMN IF NOT EXISTS engine_version text NOT NULL DEFAULT 'legacy',
  ADD COLUMN IF NOT EXISTS questionnaire_version_id uuid REFERENCES public.questionnaire_versions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS regulatory_score integer,
  ADD COLUMN IF NOT EXISTS maturity_score integer,
  ADD COLUMN IF NOT EXISTS coverage_score integer;

-- Triggers updated_at
CREATE TRIGGER trg_sectors_updated BEFORE UPDATE ON public.sectors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_subsectors_updated BEFORE UPDATE ON public.subsectors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_modules_updated BEFORE UPDATE ON public.functional_modules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_maq_updated BEFORE UPDATE ON public.module_activation_questions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_qv_updated BEFORE UPDATE ON public.questionnaire_versions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_refq_updated BEFORE UPDATE ON public.ref_questions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_qr_updated BEFORE UPDATE ON public.question_rules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_cp_updated BEFORE UPDATE ON public.company_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_cpa_updated BEFORE UPDATE ON public.company_profile_answers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_ass_updated BEFORE UPDATE ON public.audit_scope_snapshot FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed secteurs
INSERT INTO public.sectors (code, label, position) VALUES
('SOCLE_COMMUN','Socle RGPD commun',0),
('SANTE','Santé et médical',1),
('PHARMA','Pharmacie et industrie pharmaceutique',2),
('MEDSOC','Médico-social et social',3),
('PSY','Psychologie, thérapies et bien-être',4),
('BTP','BTP et construction',5),
('IMMO','Immobilier',6),
('JUR','Professions juridiques',7),
('COMPTA','Comptabilité et expertise comptable',8),
('FIN','Banque, finance et gestion de patrimoine',9),
('ASSUR','Assurance et courtage',10),
('RH','Ressources humaines, intérim et recrutement',11),
('FORM','Formation et enseignement',12),
('ENFANCE','Enfance et jeunesse',13),
('PUBLIC','Collectivités et secteur public',14),
('ASSO','Associations et ONG',15),
('SPORT','Sport et fitness',16),
('COMMERCE','Commerce de détail',17),
('ECOM','E-commerce et marketplaces marchandes',18),
('RESTO','Restauration et métiers de bouche',19),
('HOTEL','Hôtellerie et tourisme',20),
('EVEN','Événementiel et billetterie',21),
('BEAUTE','Beauté, esthétique, coiffure et tatouage',22),
('AUTO','Automobile',23),
('TRANSPORT','Transport et logistique',24),
('INDUSTRIE','Industrie et fabrication',25),
('AGRI','Agriculture et agroalimentaire',26),
('ENERGIE','Énergie, eau, déchets et environnement',27),
('IT','Informatique et services numériques',28),
('SAAS','Logiciels, SaaS, plateformes et cloud',29),
('CYBER','Cybersécurité',30),
('TELECOM','Télécommunications',31),
('WEB','Web, développement, SEO et agences digitales',32),
('MARKETING','Marketing, publicité et communication',33),
('MEDIA','Médias, presse et édition',34),
('PHOTO','Photographie et audiovisuel',35),
('SECURITE','Sécurité privée et télésurveillance',36),
('SAP','Services à la personne',37),
('ARTISAN','Artisanat et TPE généralistes',38),
('CONSEIL','Conseil et services professionnels',39),
('RECHERCHE','Recherche scientifique et études',40),
('POLITIQUE','Politique et campagnes électorales',41),
('RELIGIEUX','Organisations cultuelles',42),
('SYNDICAT','Syndicats, ordres et organisations professionnelles',43),
('AUTRE','Autres activités',44);

INSERT INTO public.subsectors (sector_id, code, label, position)
SELECT id, 'CABINET_DENTAIRE', 'Cabinet dentaire', 1 FROM public.sectors WHERE code = 'SANTE';

-- Seed modules
INSERT INTO public.functional_modules (code, label, position) VALUES
('SALARIES','Salariés',1),
('RECRUTEMENT','Recrutement',2),
('SOUS_TRAITANTS','Sous-traitants',3),
('SITE_WEB','Site web',4),
('COOKIES','Cookies et traceurs',5),
('ECOMMERCE','E-commerce',6),
('PROSPECTION','Prospection commerciale',7),
('NEWSLETTER','Newsletter',8),
('SMS','SMS',9),
('VIDEOSURVEILLANCE','Vidéosurveillance',10),
('BIOMETRIE','Biométrie',11),
('GEOLOCALISATION','Géolocalisation',12),
('TELETRAVAIL','Télétravail',13),
('BYOD','BYOD',14),
('CLOUD','Cloud',15),
('HORS_UE','Transferts hors UE',16),
('DONNEES_SANTE','Données de santé',17),
('DONNEES_MINEURS','Données de mineurs',18),
('DONNEES_SENSIBLES','Données sensibles',19),
('DONNEES_PENALES','Données pénales',20),
('PAIEMENT','Paiements',21),
('IA','Intelligence artificielle',22),
('PROFILAGE','Profilage',23),
('DECISION_AUTOMATISEE','Décision automatisée',24),
('APPELS_ENREGISTRES','Appels enregistrés',25),
('CONTROLE_ACCES','Contrôle d''accès',26),
('APPLICATION','Application mobile',27),
('FOURNISSEUR_SAAS','Fournisseurs SaaS',28),
('HEBERGEMENT_TIERS','Hébergement tiers',29),
('DOSSIERS_PAPIER','Dossiers papier',30),
('MARKETPLACE','Marketplace',31),
('FIDELITE','Programme de fidélité',32),
('JEUX_CONCOURS','Jeux et concours',33),
('PHOTOS_IDENTIFIANTES','Photos identifiantes',34),
('RECHERCHE_STATISTIQUES','Recherche et statistiques',35);

-- Questions d'activation (étape 3 = données, étape 4 = pratiques/outils)
INSERT INTO public.module_activation_questions (module_id, step, text, position)
SELECT m.id, v.step, v.text, v.position FROM public.functional_modules m
JOIN (VALUES
('SALARIES',4,'Employez-vous des salariés ?',1),
('RECRUTEMENT',4,'Réalisez-vous des recrutements (candidatures, CV) ?',2),
('SOUS_TRAITANTS',4,'Faites-vous appel à des prestataires qui traitent des données pour vous ?',3),
('SITE_WEB',4,'Disposez-vous d''un site internet ?',4),
('COOKIES',4,'Votre site utilise-t-il des cookies ou traceurs (mesure d''audience, publicité) ?',5),
('ECOMMERCE',4,'Vendez-vous en ligne ?',6),
('PROSPECTION',4,'Faites-vous de la prospection commerciale ?',7),
('NEWSLETTER',4,'Envoyez-vous une newsletter ?',8),
('SMS',4,'Envoyez-vous des SMS à vos clients ou patients ?',9),
('VIDEOSURVEILLANCE',4,'Utilisez-vous des caméras dans vos locaux ?',10),
('BIOMETRIE',4,'Utilisez-vous un dispositif biométrique (empreinte, reconnaissance faciale) ?',11),
('GEOLOCALISATION',4,'Géolocalisez-vous des véhicules ou des personnes ?',12),
('TELETRAVAIL',4,'Pratiquez-vous le télétravail ?',13),
('BYOD',4,'Vos collaborateurs utilisent-ils leurs équipements personnels (BYOD) ?',14),
('CLOUD',4,'Utilisez-vous des services cloud ?',15),
('HORS_UE',4,'Des données sont-elles transférées hors Union européenne ?',16),
('PAIEMENT',4,'Traitez-vous des paiements ou des données bancaires ?',17),
('IA',4,'Utilisez-vous des outils d''intelligence artificielle ?',18),
('PROFILAGE',4,'Réalisez-vous du profilage (scoring, segmentation) ?',19),
('DECISION_AUTOMATISEE',4,'Prenez-vous des décisions entièrement automatisées ?',20),
('APPELS_ENREGISTRES',4,'Enregistrez-vous les appels téléphoniques ?',21),
('CONTROLE_ACCES',4,'Disposez-vous d''un contrôle d''accès aux locaux (badges) ?',22),
('APPLICATION',4,'Proposez-vous une application mobile ?',23),
('FOURNISSEUR_SAAS',4,'Utilisez-vous des logiciels SaaS pour gérer vos données ?',24),
('HEBERGEMENT_TIERS',4,'Vos données sont-elles hébergées chez un tiers ?',25),
('MARKETPLACE',4,'Vendez-vous via une marketplace ?',26),
('FIDELITE',4,'Gérez-vous un programme de fidélité ?',27),
('JEUX_CONCOURS',4,'Organisez-vous des jeux ou concours ?',28),
('RECHERCHE_STATISTIQUES',4,'Réutilisez-vous des données à des fins de recherche ou de statistiques ?',29),
('DONNEES_SANTE',3,'Traitez-vous des données de santé ?',1),
('DONNEES_MINEURS',3,'Traitez-vous des données concernant des mineurs ?',2),
('DONNEES_SENSIBLES',3,'Traitez-vous des données sensibles (origine, opinions, religion, orientation sexuelle, biométrie) ?',3),
('DONNEES_PENALES',3,'Traitez-vous des données relatives à des condamnations ou infractions ?',4),
('PHOTOS_IDENTIFIANTES',3,'Traitez-vous des photographies permettant d''identifier des personnes ?',5),
('DOSSIERS_PAPIER',3,'Conservez-vous des dossiers papier contenant des données personnelles ?',6)
) AS v(code, step, text, position) ON v.code = m.code;

-- Version initiale du référentiel
INSERT INTO public.questionnaire_versions (number, label, published_at) VALUES (1,'Référentiel initial (202 questions)', now());