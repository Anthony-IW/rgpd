import { supabase } from "@/integrations/supabase/client";

export type Tristate = "oui" | "non" | "inconnu";

export interface Sector { id: string; code: string; label: string; position: number }
export interface Subsector { id: string; sector_id: string; code: string; label: string; position: number }
export interface FunctionalModule { id: string; code: string; label: string; description: string | null; position: number }
export interface ActivationQuestion {
  id: string; module_id: string; step: number; text: string; help: string | null;
  position: number; unknown_keeps_questions: boolean;
}

export interface RefQuestion {
  id: string;
  code: string;
  category_id: string;
  category_name: string | null;
  text: string;
  help: string | null;
  legal_reference: string | null;
  legal_status: "OBLIGATOIRE" | "OBLIGATOIRE_SI_APPLICABLE" | "RECOMMANDE" | "NON_OBLIGATOIRE_EN_TANT_QUE_TEL";
  applicability_condition: string | null;
  risk: "faible" | "moyen" | "eleve" | "critique";
  weight: number;
  is_core: boolean;
  position: number;
}

export interface Referential {
  sectors: Sector[];
  subsectors: Subsector[];
  modules: FunctionalModule[];
  activationQuestions: ActivationQuestion[];
  questions: RefQuestion[];
  questionSectors: Record<string, string[]>;    // questionId -> sectorIds
  questionSubsectors: Record<string, string[]>; // questionId -> subsectorIds
  questionModules: Record<string, string[]>;    // questionId -> moduleIds
}

export interface CompanyProfile {
  primary_sector_id: string | null;
  secondary_sector_ids: string[];
  subsector_ids: string[];
  answers: Record<string, Tristate>; // module code -> answer
}

export interface ScopedQuestion {
  question: RefQuestion;
  included: boolean;
  inclusion_reason: string | null;
  exclusion_reason: string | null;
}

export interface ComputedScope {
  questions: ScopedQuestion[];
  includedModules: { code: string; label: string; reason: string }[];
  excludedModules: { code: string; label: string; reason: string }[];
}

/** Charge l'intégralité du référentiel dynamique publié. */
export async function loadReferential(): Promise<Referential> {
  const [sectors, subsectors, modules, activation, questions, qs, qss, qm] = await Promise.all([
    supabase.from("sectors").select("id, code, label, position").is("archived_at", null).order("position"),
    supabase.from("subsectors").select("id, sector_id, code, label, position").is("archived_at", null).order("position"),
    supabase.from("functional_modules").select("id, code, label, description, position").is("archived_at", null).order("position"),
    supabase.from("module_activation_questions").select("id, module_id, step, text, help, position, unknown_keeps_questions").is("archived_at", null).order("position"),
    supabase.from("ref_questions").select("id, code, category_id, category_name, text, help, legal_reference, legal_status, applicability_condition, risk, weight, is_core, position").is("archived_at", null).order("position"),
    supabase.from("question_sectors").select("question_id, sector_id"),
    supabase.from("question_subsectors").select("question_id, subsector_id"),
    supabase.from("question_modules").select("question_id, module_id"),
  ]);

  const group = <T extends Record<string, any>>(rows: T[] | null, key: string) => {
    const out: Record<string, string[]> = {};
    (rows || []).forEach((r) => {
      (out[r.question_id] ||= []).push(r[key]);
    });
    return out;
  };

  return {
    sectors: (sectors.data as Sector[]) || [],
    subsectors: (subsectors.data as Subsector[]) || [],
    modules: (modules.data as FunctionalModule[]) || [],
    activationQuestions: (activation.data as ActivationQuestion[]) || [],
    questions: (questions.data as RefQuestion[]) || [],
    questionSectors: group(qs.data, "sector_id"),
    questionSubsectors: group(qss.data, "subsector_id"),
    questionModules: group(qm.data, "module_id"),
  };
}

/**
 * Moteur d'éligibilité : détermine quelles questions du référentiel s'appliquent
 * à l'organisation en fonction de son secteur, de ses sous-secteurs et de ses
 * réponses à l'assistant de profilage (modules fonctionnels).
 * Une réponse « inconnu » conserve la question par prudence.
 */
export function computeScope(ref: Referential, profile: CompanyProfile): ComputedScope {
  const moduleByCode = new Map(ref.modules.map((m) => [m.code, m]));
  const moduleById = new Map(ref.modules.map((m) => [m.id, m]));

  const includedModules: ComputedScope["includedModules"] = [];
  const excludedModules: ComputedScope["excludedModules"] = [];
  const activeModuleIds = new Set<string>();

  ref.modules.forEach((m) => {
    const answer = profile.answers[m.code] ?? "inconnu";
    if (answer === "oui") {
      activeModuleIds.add(m.id);
      includedModules.push({ code: m.code, label: m.label, reason: "Activité déclarée lors du profilage" });
    } else if (answer === "inconnu") {
      activeModuleIds.add(m.id);
      includedModules.push({ code: m.code, label: m.label, reason: "Information non connue — conservé par prudence" });
    } else {
      excludedModules.push({ code: m.code, label: m.label, reason: "Activité déclarée non concernée" });
    }
  });

  const sectorIds = new Set(
    [profile.primary_sector_id, ...(profile.secondary_sector_ids || [])].filter(Boolean) as string[],
  );
  const socle = ref.sectors.find((s) => s.code === "SOCLE_COMMUN");
  if (socle) sectorIds.add(socle.id);
  const subsectorIds = new Set(profile.subsector_ids || []);

  const questions: ScopedQuestion[] = ref.questions.map((q) => {
    const qModules = ref.questionModules[q.id] || [];
    const qSectors = ref.questionSectors[q.id] || [];
    const qSubsectors = ref.questionSubsectors[q.id] || [];

    // 1. Question liée à des modules : incluse si au moins un module est actif
    if (qModules.length > 0) {
      const active = qModules.find((id) => activeModuleIds.has(id));
      if (active) {
        const m = moduleById.get(active);
        return {
          question: q,
          included: true,
          inclusion_reason: `Module « ${m?.label ?? "?"} » activé`,
          exclusion_reason: null,
        };
      }
      const labels = qModules.map((id) => moduleById.get(id)?.label).filter(Boolean).join(", ");
      return {
        question: q,
        included: false,
        inclusion_reason: null,
        exclusion_reason: `Aucun module concerné (${labels})`,
      };
    }

    // 2. Question sectorielle
    if (qSubsectors.length > 0 || (qSectors.length > 0 && !q.is_core)) {
      const matchSub = qSubsectors.some((id) => subsectorIds.has(id));
      const matchSector = qSectors.some((id) => sectorIds.has(id));
      if (matchSub || matchSector) {
        return { question: q, included: true, inclusion_reason: "Spécificité sectorielle applicable", exclusion_reason: null };
      }
      return { question: q, included: false, inclusion_reason: null, exclusion_reason: "Hors du secteur d'activité déclaré" };
    }

    // 3. Socle commun : toujours inclus
    return { question: q, included: true, inclusion_reason: "Socle RGPD commun", exclusion_reason: null };
  });

  // Modules non référencés par aucune question conservée : information seule
  void moduleByCode;

  return { questions, includedModules, excludedModules };
}

/** Charge le profil enregistré d'une entreprise. */
export async function loadCompanyProfile(companyId: string): Promise<CompanyProfile | null> {
  const [{ data: profile }, { data: answers }] = await Promise.all([
    supabase.from("company_profiles").select("*").eq("company_id", companyId).maybeSingle(),
    supabase.from("company_profile_answers").select("module_code, answer").eq("company_id", companyId),
  ]);
  if (!profile) return null;
  return {
    primary_sector_id: profile.primary_sector_id,
    secondary_sector_ids: profile.secondary_sector_ids || [],
    subsector_ids: profile.subsector_ids || [],
    answers: Object.fromEntries((answers || []).map((a) => [a.module_code, a.answer as Tristate])),
  };
}

/** Enregistre le profil et les réponses de l'assistant. */
export async function saveCompanyProfile(
  companyId: string,
  profile: CompanyProfile,
  meta: { respondent_name?: string; respondent_role?: string; headcount?: number | null } = {},
) {
  const { error } = await supabase.from("company_profiles").upsert(
    {
      company_id: companyId,
      primary_sector_id: profile.primary_sector_id,
      secondary_sector_ids: profile.secondary_sector_ids,
      subsector_ids: profile.subsector_ids,
      respondent_name: meta.respondent_name ?? null,
      respondent_role: meta.respondent_role ?? null,
      headcount: meta.headcount ?? null,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "company_id" },
  );
  if (error) throw error;

  const rows = Object.entries(profile.answers).map(([module_code, answer]) => ({
    company_id: companyId,
    module_code,
    answer,
  }));
  if (rows.length) {
    const { error: e2 } = await supabase
      .from("company_profile_answers")
      .upsert(rows, { onConflict: "company_id,module_code" });
    if (e2) throw e2;
  }
}

/**
 * Fige le périmètre d'un audit : enregistre le profil utilisé, les modules
 * retenus/écartés et la liste complète des questions avec leur motif.
 */
export async function generateAuditScope(auditId: string, companyId: string) {
  const ref = await loadReferential();
  const profile = await loadCompanyProfile(companyId);
  if (!profile) throw new Error("Profil d'organisation manquant : lancez d'abord l'assistant de profilage.");

  const scope = computeScope(ref, profile);
  const versionId = (
    await supabase.from("questionnaire_versions").select("id").order("number", { ascending: false }).limit(1).maybeSingle()
  ).data?.id ?? null;

  const { error: e1 } = await supabase.from("audit_scope_snapshot").upsert(
    {
      audit_id: auditId,
      profile: profile as any,
      included_modules: scope.includedModules as any,
      excluded_modules: scope.excludedModules as any,
      version_id: versionId,
    },
    { onConflict: "audit_id" },
  );
  if (e1) throw e1;

  await supabase.from("audit_questions_snapshot").delete().eq("audit_id", auditId);
  const rows = scope.questions.map((sq, i) => ({
    audit_id: auditId,
    question_code: sq.question.code,
    category_id: sq.question.category_id,
    category_name: sq.question.category_name,
    text: sq.question.text,
    help: sq.question.help,
    legal_reference: sq.question.legal_reference,
    legal_status: sq.question.legal_status,
    applicability_condition: sq.question.applicability_condition,
    risk: sq.question.risk,
    weight: sq.question.weight,
    included: sq.included,
    inclusion_reason: sq.inclusion_reason,
    exclusion_reason: sq.exclusion_reason,
    position: i,
  }));
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await supabase.from("audit_questions_snapshot").insert(rows.slice(i, i + 200));
    if (error) throw error;
  }

  await supabase
    .from("audits")
    .update({ engine_version: "dynamic-v1", questionnaire_version_id: versionId })
    .eq("id", auditId);

  return scope;
}
