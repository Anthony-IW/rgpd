import * as XLSX from "xlsx";
import {
  RGPD_REFERENTIAL,
  COMPLIANCE_LEVELS,
  LEGAL_BASIS_LABELS,
  PRIORITY_META,
  ACTION_STATUS_META,
  AUDIT_STATUS_META,
  computeCategoryScore,
  computeGlobalScore,
} from "@/data/rgpdReferential";
import { fileName, fmtDate, fmtBool, joinList } from "./exportHelpers";

function autoWidths(rows: any[][]): { wch: number }[] {
  if (!rows.length) return [];
  const cols = rows[0].length;
  const widths: number[] = new Array(cols).fill(10);
  for (const row of rows) {
    for (let i = 0; i < cols; i++) {
      const v = row[i];
      const len = v == null ? 0 : String(v).length;
      if (len > widths[i]) widths[i] = Math.min(60, len);
    }
  }
  return widths.map((w) => ({ wch: w + 2 }));
}

function aoaSheet(rows: any[][]) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = autoWidths(rows);
  if (rows.length) ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: rows[0].length - 1, r: rows.length - 1 } }) };
  return ws;
}

function save(wb: XLSX.WorkBook, name: string) {
  XLSX.writeFile(wb, name, { bookType: "xlsx" });
}

/* -------- Companies -------- */
export function exportCompaniesXLSX(companies: any[]) {
  const header = ["Nom", "SIRET", "Forme", "Secteur", "Taille", "Effectif", "Adresse", "CP", "Ville", "Pays", "Site", "Contact", "Fonction", "Email", "Téléphone", "DPO désigné", "Nom DPO", "Email DPO", "Téléphone DPO", "DPO externe", "Notes", "Créé le"];
  const rows = companies.map((c) => [
    c.name, c.siret, c.legal_form, c.sector, c.size, c.employees_count,
    c.address, c.postal_code, c.city, c.country, c.website,
    c.contact_name, c.contact_role, c.contact_email, c.contact_phone,
    fmtBool(c.has_dpo), c.dpo_name, c.dpo_email, c.dpo_phone, fmtBool(c.dpo_external),
    c.notes, fmtDate(c.created_at),
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, aoaSheet([header, ...rows]), "Entreprises");
  save(wb, fileName("entreprises", "xlsx"));
}

/* -------- Processing register -------- */
export function exportRegistryXLSX(records: any[], companyName?: string) {
  const header = ["Nom", "Finalité", "Base légale", "Justification", "Catégories de données", "Données sensibles", "Personnes concernées", "Destinataires", "Sous-traitants", "Durée de conservation", "Justification durée", "Transfert hors UE", "Pays", "Garanties", "Mesures de sécurité", "AIPD requise", "AIPD réalisée", "Source", "Notes", "Créé le"];
  const rows = records.map((r) => [
    r.name, r.purpose,
    r.legal_basis ? LEGAL_BASIS_LABELS[r.legal_basis] : "",
    r.legal_basis_details,
    joinList(r.data_categories),
    fmtBool(r.sensitive_data),
    joinList(r.data_subjects),
    joinList(r.recipients),
    joinList(r.subcontractors),
    r.retention_period, r.retention_justification,
    fmtBool(r.international_transfer),
    joinList(r.transfer_countries), r.transfer_safeguards,
    r.security_measures,
    fmtBool(r.dpia_required), fmtBool(r.dpia_completed),
    r.source, r.notes, fmtDate(r.created_at),
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, aoaSheet([header, ...rows]), "Registre Art. 30");
  save(wb, fileName("registre_traitements", "xlsx", companyName));
}

/* -------- Action plan -------- */
export function exportActionsXLSX(actions: any[], companyName?: string) {
  const header = ["Titre", "Description", "Catégorie", "Priorité", "Statut", "Responsable", "Échéance", "Terminée le", "Créée le"];
  const rows = actions.map((a) => [
    a.title, a.description, a.category,
    PRIORITY_META[a.priority as keyof typeof PRIORITY_META]?.label ?? a.priority,
    ACTION_STATUS_META[a.status as keyof typeof ACTION_STATUS_META]?.label ?? a.status,
    a.responsible, fmtDate(a.due_date), fmtDate(a.completed_at), fmtDate(a.created_at),
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, aoaSheet([header, ...rows]), "Plan d'actions");
  save(wb, fileName("plan_actions", "xlsx", companyName));
}

/* -------- Audit complete (multi-sheet) -------- */
export function exportAuditXLSX(data: {
  audit: any; company: any; responses: Record<string, any>;
  actions?: any[]; processing?: any[];
}) {
  const { audit, company, responses, actions = [], processing = [] } = data;
  const wb = XLSX.utils.book_new();
  const globalScore = computeGlobalScore(responses);

  // Synthèse
  const synth: any[][] = [
    ["Rapport d'audit RGPD"],
    ["Entreprise", company.name],
    ["SIRET", company.siret || ""],
    ["Audit", audit.title],
    ["Statut", AUDIT_STATUS_META[audit.status as keyof typeof AUDIT_STATUS_META]?.label || audit.status],
    ["Date", fmtDate(audit.start_date) || fmtDate(new Date().toISOString())],
    ["Score global", `${globalScore}%`],
    [],
    ["Domaine", "Questions", "Évaluées", "Score"],
    ...RGPD_REFERENTIAL.map((cat) => {
      const s = computeCategoryScore(cat, responses);
      const pct = s.total === 0 ? 0 : Math.round((s.score / s.total) * 100);
      return [cat.name, cat.questions.length, s.answered, `${pct}%`];
    }),
  ];
  XLSX.utils.book_append_sheet(wb, aoaSheet(synth), "Synthèse");

  // Réponses
  const respHeader = ["Domaine", "Question", "Référence", "Niveau", "Constat", "Recommandation", "Preuves"];
  const respRows: any[][] = [];
  for (const cat of RGPD_REFERENTIAL) {
    for (const q of cat.questions) {
      const r = responses[q.id] || {};
      respRows.push([
        cat.name, q.text, q.reference || "",
        COMPLIANCE_LEVELS[(r.level || "a_evaluer") as keyof typeof COMPLIANCE_LEVELS]?.label,
        r.comment || "", r.recommendation || "", r.evidence || "",
      ]);
    }
  }
  XLSX.utils.book_append_sheet(wb, aoaSheet([respHeader, ...respRows]), "Réponses");

  // Actions
  const aHeader = ["Titre", "Description", "Catégorie", "Priorité", "Statut", "Responsable", "Échéance"];
  const aRows = actions.map((a) => [
    a.title, a.description, a.category,
    PRIORITY_META[a.priority as keyof typeof PRIORITY_META]?.label ?? a.priority,
    ACTION_STATUS_META[a.status as keyof typeof ACTION_STATUS_META]?.label ?? a.status,
    a.responsible, fmtDate(a.due_date),
  ]);
  XLSX.utils.book_append_sheet(wb, aoaSheet([aHeader, ...aRows]), "Plan d'actions");

  // Registre
  const pHeader = ["Nom", "Finalité", "Base légale", "Données", "Personnes", "Destinataires", "Conservation", "Sensibles", "Transfert hors UE", "AIPD requise"];
  const pRows = processing.map((r) => [
    r.name, r.purpose,
    r.legal_basis ? LEGAL_BASIS_LABELS[r.legal_basis] : "",
    joinList(r.data_categories), joinList(r.data_subjects), joinList(r.recipients),
    r.retention_period, fmtBool(r.sensitive_data), fmtBool(r.international_transfer), fmtBool(r.dpia_required),
  ]);
  XLSX.utils.book_append_sheet(wb, aoaSheet([pHeader, ...pRows]), "Registre");

  save(wb, fileName(`audit_${audit.title}`, "xlsx", company.name));
}

/* -------- Library -------- */
export function exportLibraryXLSX(docs: any[]) {
  const header = ["Titre", "Catégorie", "Description"];
  const rows = docs.map((d) => [d.title, d.category, d.description]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, aoaSheet([header, ...rows]), "Bibliothèque");
  save(wb, fileName("bibliotheque_rgpd", "xlsx"));
}

/* -------- Company sheet -------- */
export function exportCompanySheetXLSX(company: any, audits: any[], processing: any[], actions: any[]) {
  const wb = XLSX.utils.book_new();
  const info: any[][] = [
    ["Fiche entreprise"],
    ["Nom", company.name],
    ["SIRET", company.siret || ""],
    ["Forme juridique", company.legal_form || ""],
    ["Secteur", company.sector || ""],
    ["Taille", company.size || ""],
    ["Effectif", company.employees_count || ""],
    ["Adresse", [company.address, company.postal_code, company.city, company.country].filter(Boolean).join(", ")],
    ["Site web", company.website || ""],
    ["Contact", company.contact_name || ""],
    ["Fonction", company.contact_role || ""],
    ["Email", company.contact_email || ""],
    ["Téléphone", company.contact_phone || ""],
    ["DPO désigné", fmtBool(company.has_dpo)],
    ["Nom DPO", company.dpo_name || ""],
    ["Email DPO", company.dpo_email || ""],
    ["DPO externe", fmtBool(company.dpo_external)],
    ["Notes", company.notes || ""],
  ];
  XLSX.utils.book_append_sheet(wb, aoaSheet(info), "Identité");

  const aHeader = ["Titre", "Statut", "Score", "Début", "Fin"];
  XLSX.utils.book_append_sheet(wb, aoaSheet([aHeader, ...audits.map((a) => [
    a.title,
    AUDIT_STATUS_META[a.status as keyof typeof AUDIT_STATUS_META]?.label || a.status,
    a.global_score ?? "", fmtDate(a.start_date), fmtDate(a.completed_at),
  ])]), "Audits");

  XLSX.utils.book_append_sheet(wb, aoaSheet([
    ["Nom", "Finalité", "Base légale", "Conservation"],
    ...processing.map((p) => [p.name, p.purpose, p.legal_basis ? LEGAL_BASIS_LABELS[p.legal_basis] : "", p.retention_period]),
  ]), "Traitements");

  XLSX.utils.book_append_sheet(wb, aoaSheet([
    ["Titre", "Priorité", "Statut", "Échéance"],
    ...actions.map((a) => [
      a.title,
      PRIORITY_META[a.priority as keyof typeof PRIORITY_META]?.label ?? a.priority,
      ACTION_STATUS_META[a.status as keyof typeof ACTION_STATUS_META]?.label ?? a.status,
      fmtDate(a.due_date),
    ]),
  ]), "Actions");

  save(wb, fileName("fiche_entreprise", "xlsx", company.name));
}