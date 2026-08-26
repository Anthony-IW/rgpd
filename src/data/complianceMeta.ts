export const DRO_TYPES: Record<string, string> = {
  acces: "Accès",
  rectification: "Rectification",
  effacement: "Effacement",
  portabilite: "Portabilité",
  opposition: "Opposition",
  limitation: "Limitation",
};

export const DRO_STATUS: Record<string, string> = {
  en_cours: "En cours",
  traite: "Traité",
  rejete: "Rejeté",
};

export const BREACH_SEVERITY: Record<string, { label: string; color: string }> = {
  faible: { label: "Faible", color: "bg-secondary" },
  moyen: { label: "Moyen", color: "bg-warning" },
  eleve: { label: "Élevé", color: "bg-orange-500" },
  critique: { label: "Critique", color: "bg-destructive" },
};

export const BREACH_STATUS: Record<string, string> = {
  ouvert: "Ouvert",
  clos: "Clos",
};

export const CONSENT_STATUS: Record<string, string> = {
  donne: "Donné",
  retire: "Retiré",
};

export const DPIA_STATUS: Record<string, string> = {
  brouillon: "Brouillon",
  valide: "Validé",
  refuse: "Refusé",
};

export const SAFEGUARDS_OPTIONS = [
  { value: "cct", label: "Clauses contractuelles types (CCT)" },
  { value: "bcr", label: "Binding Corporate Rules (BCR)" },
  { value: "pays_adequat", label: "Pays adéquat" },
  { value: "certification", label: "Certification / code de conduite" },
  { value: "autre", label: "Autre" },
];
