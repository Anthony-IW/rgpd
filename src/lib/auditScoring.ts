export type LegalStatus =
  | "OBLIGATOIRE"
  | "OBLIGATOIRE_SI_APPLICABLE"
  | "RECOMMANDE"
  | "NON_OBLIGATOIRE_EN_TANT_QUE_TEL";

export interface ScopedSnapshotQuestion {
  id: string;
  question_code: string;
  category_id: string;
  category_name: string | null;
  text: string;
  help: string | null;
  legal_reference: string | null;
  legal_status: LegalStatus;
  applicability_condition: string | null;
  risk: "faible" | "moyen" | "eleve" | "critique";
  weight: number;
  included: boolean;
  inclusion_reason: string | null;
  exclusion_reason: string | null;
  position: number;
}

export const LEGAL_STATUS_LABELS: Record<LegalStatus, string> = {
  OBLIGATOIRE: "Obligatoire",
  OBLIGATOIRE_SI_APPLICABLE: "Obligatoire si applicable",
  RECOMMANDE: "Recommandé",
  NON_OBLIGATOIRE_EN_TANT_QUE_TEL: "Non obligatoire",
};

export const LEGAL_STATUS_CLASS: Record<LegalStatus, string> = {
  OBLIGATOIRE: "border-destructive/40 bg-destructive/10 text-destructive",
  OBLIGATOIRE_SI_APPLICABLE: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  RECOMMANDE: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  NON_OBLIGATOIRE_EN_TANT_QUE_TEL: "border-muted-foreground/30 bg-muted text-muted-foreground",
};

const VALUE: Record<string, number | null> = {
  conforme: 1,
  partiel: 0.5,
  non_conforme: 0,
  non_applicable: null,
  ne_sait_pas: null,
  a_evaluer: null,
};


const isRegulatory = (s: LegalStatus) =>
  s === "OBLIGATOIRE" || s === "OBLIGATOIRE_SI_APPLICABLE";

export interface ScopeScores {
  regulatory: number;
  maturity: number;
  coverage: number;
  global: number;
  answered: number;
  total: number;
}

function scoreOf(
  questions: ScopedSnapshotQuestion[],
  responses: Record<string, any>,
): number {
  let score = 0;
  let max = 0;
  questions.forEach((q) => {
    const v = VALUE[responses[q.question_code]?.level ?? "a_evaluer"];
    if (v === null || v === undefined) return;
    score += v * (q.weight || 1);
    max += q.weight || 1;
  });
  return max === 0 ? 0 : Math.round((score / max) * 100);
}

export function computeScopeScores(
  snapshot: ScopedSnapshotQuestion[],
  responses: Record<string, any>,
): ScopeScores {
  const included = snapshot.filter((q) => q.included);
  const regulatoryQs = included.filter((q) => isRegulatory(q.legal_status));
  const maturityQs = included.filter((q) => !isRegulatory(q.legal_status));

  const answered = included.filter((q) => {
    const l = responses[q.question_code]?.level;
    return l && l !== "a_evaluer";
  }).length;

  const regulatory = scoreOf(regulatoryQs, responses);
  const maturity = scoreOf(maturityQs, responses);
  const coverage = included.length === 0 ? 0 : Math.round((answered / included.length) * 100);
  const global = Math.round(regulatory * 0.7 + maturity * 0.3);

  return { regulatory, maturity, coverage, global, answered, total: included.length };
}

export interface SnapshotCategory {
  id: string;
  name: string;
  questions: ScopedSnapshotQuestion[];
}

export function groupByCategory(questions: ScopedSnapshotQuestion[]): SnapshotCategory[] {
  const out: SnapshotCategory[] = [];
  const index = new Map<string, SnapshotCategory>();
  [...questions]
    .sort((a, b) => a.position - b.position)
    .forEach((q) => {
      let cat = index.get(q.category_id);
      if (!cat) {
        cat = { id: q.category_id, name: q.category_name || q.category_id, questions: [] };
        index.set(q.category_id, cat);
        out.push(cat);
      }
      cat.questions.push(q);
    });
  return out;
}

export function categoryScore(
  cat: SnapshotCategory,
  responses: Record<string, any>,
): { pct: number; answered: number; total: number } {
  const total = cat.questions.length;
  const answered = cat.questions.filter((q) => {
    const l = responses[q.question_code]?.level;
    return l && l !== "a_evaluer";
  }).length;
  return { pct: scoreOf(cat.questions, responses), answered, total };
}
