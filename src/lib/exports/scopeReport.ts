import { downloadHtmlPdf } from "@/lib/exports/pdfDownload";
import { escapeHtml, fmtDate } from "@/lib/exports/exportHelpers";
import {
  LEGAL_STATUS_LABELS,
  computeScopeScores,
  groupByCategory,
  categoryScore,
  type ScopedSnapshotQuestion,
} from "@/lib/auditScoring";

const LEVEL_LABELS: Record<string, string> = {
  conforme: "Conforme",
  partiel: "Partiellement conforme",
  non_conforme: "Non conforme",
  non_applicable: "Non applicable",
  ne_sait_pas: "Ne sait pas",
  a_evaluer: "À évaluer",
};

const LEVEL_COLOR: Record<string, string> = {
  conforme: "#15803d",
  partiel: "#b45309",
  non_conforme: "#b91c1c",
  non_applicable: "#64748b",
  ne_sait_pas: "#7c3aed",
  a_evaluer: "#94a3b8",
};

const RISK_LABELS: Record<string, string> = {
  faible: "Faible",
  moyen: "Moyen",
  eleve: "Élevé",
  critique: "Critique",
};

const RISK_ORDER: Record<string, number> = { critique: 0, eleve: 1, moyen: 2, faible: 3 };

export interface ScopeReportData {
  audit: any;
  company: any;
  responses: Record<string, any>;
  snapshot: ScopedSnapshotQuestion[];
  scopeMeta: any;
  sectorLabels?: string[];
  subsectorLabels?: string[];
}

export async function generateScopeAuditPDF(data: ScopeReportData) {
  const { audit, company, responses, snapshot, scopeMeta } = data;
  const scores = computeScopeScores(snapshot, responses);
  const included = snapshot.filter((q) => q.included);
  const excluded = snapshot.filter((q) => !q.included);
  const categories = groupByCategory(included);

  const includedModules: any[] = Array.isArray(scopeMeta?.included_modules) ? scopeMeta.included_modules : [];
  const excludedModules: any[] = Array.isArray(scopeMeta?.excluded_modules) ? scopeMeta.excluded_modules : [];

  const gaps = included
    .filter((q) => {
      const l = responses[q.question_code]?.level;
      return l === "non_conforme" || l === "partiel";
    })
    .sort(
      (a, b) =>
        (RISK_ORDER[a.risk] ?? 9) - (RISK_ORDER[b.risk] ?? 9) ||
        (b.weight || 1) - (a.weight || 1),
    );

  const scoreCard = (label: string, value: number, hint: string) => `
    <div class="kpi"><div class="kpi-label">${label}</div>
      <div class="kpi-value">${value}%</div><div class="kpi-hint">${hint}</div></div>`;

  const html = `<!doctype html><html><head><meta charset="utf-8">
  <title>Rapport d'audit RGPD sectoriel - ${escapeHtml(company?.name)}</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#1f2937;max-width:880px;margin:auto;padding:24px;font-size:12px;}
    h1{color:#7a1fa8;margin:0 0 4px;font-size:24px;}
    h2{color:#7a1fa8;margin-top:26px;border-bottom:2px solid #e6d7f2;padding-bottom:4px;font-size:16px;}
    h3{margin:16px 0 6px;color:#374151;font-size:13px;}
    .muted{color:#6b7280;font-size:11px;}
    .kpis{display:flex;gap:10px;margin-top:12px;}
    .kpi{flex:1;border:1px solid #e6d7f2;border-radius:8px;padding:10px;background:#faf5ff;}
    .kpi-label{font-size:10px;text-transform:uppercase;color:#7a1fa8;letter-spacing:.04em;}
    .kpi-value{font-size:22px;font-weight:700;color:#4c1d95;}
    .kpi-hint{font-size:10px;color:#6b7280;}
    table{width:100%;border-collapse:collapse;margin-top:8px;}
    th,td{border:1px solid #e5e7eb;padding:5px 6px;text-align:left;vertical-align:top;}
    th{background:#f5f3ff;color:#4c1d95;font-size:11px;}
    ul{margin:4px 0 0 16px;padding:0;}
    li{margin-bottom:2px;}
    .tag{display:inline-block;border-radius:9999px;padding:1px 7px;font-size:10px;border:1px solid #d1d5db;color:#374151;}
    .box{border:1px solid #e5e7eb;border-radius:8px;padding:10px;background:#fafafa;margin-top:8px;}
    .pagebreak{page-break-before:always;}
    tr,li,.box{page-break-inside:avoid;}
  </style></head><body>

  <h1>Rapport d'audit RGPD</h1>
  <div class="muted">${escapeHtml(company?.name)} · ${escapeHtml(audit?.title)} · Généré le ${new Date().toLocaleDateString("fr-FR")}</div>
  <div class="muted">Périmètre calculé par le moteur d'audit dynamique${scopeMeta?.version_id ? " (référentiel versionné)" : ""} — ${included.length} questions retenues sur ${snapshot.length}.</div>

  <div class="kpis">
    ${scoreCard("Score réglementaire", scores.regulatory, "Obligations légales")}
    ${scoreCard("Score de maturité", scores.maturity, "Bonnes pratiques")}
    ${scoreCard("Couverture", scores.coverage, `${scores.answered}/${scores.total} questions traitées`)}
    ${scoreCard("Score global", scores.global, "70% réglementaire / 30% maturité")}
  </div>

  <h2>1. Contexte et périmètre</h2>
  <table>
    <tr><th style="width:32%">Organisation</th><td>${escapeHtml(company?.name)}</td></tr>
    ${company?.sector ? `<tr><th>Secteur déclaré</th><td>${escapeHtml(company.sector)}</td></tr>` : ""}
    ${data.sectorLabels?.length ? `<tr><th>Secteurs du référentiel</th><td>${escapeHtml(data.sectorLabels.join(", "))}</td></tr>` : ""}
    ${data.subsectorLabels?.length ? `<tr><th>Sous-secteurs</th><td>${escapeHtml(data.subsectorLabels.join(", "))}</td></tr>` : ""}
    ${company?.dpo_name ? `<tr><th>DPO / Référent</th><td>${escapeHtml(company.dpo_name)}</td></tr>` : ""}
    <tr><th>Date d'audit</th><td>${escapeHtml(fmtDate(audit?.audit_date) || fmtDate(audit?.created_at))}</td></tr>
    <tr><th>Auditeur</th><td>${escapeHtml(audit?.auditor_name || "Informatique &amp; Web")}</td></tr>
  </table>

  <h3>Modules fonctionnels retenus (${includedModules.length})</h3>
  ${includedModules.length
      ? `<ul>${includedModules
          .map((m) => `<li><strong>${escapeHtml(m.label)}</strong> <span class="muted">— ${escapeHtml(m.reason)}</span></li>`)
          .join("")}</ul>`
      : `<p class="muted">Aucun module renseigné.</p>`}

  <h3>Modules écartés (${excludedModules.length})</h3>
  ${excludedModules.length
      ? `<ul>${excludedModules
          .map((m) => `<li>${escapeHtml(m.label)} <span class="muted">— ${escapeHtml(m.reason)}</span></li>`)
          .join("")}</ul>`
      : `<p class="muted">Aucun module écarté.</p>`}

  <h2>2. Synthèse par domaine</h2>
  <table>
    <thead><tr><th>Domaine</th><th style="width:70px">Traitées</th><th style="width:70px">Score</th><th>Points d'attention</th></tr></thead>
    <tbody>
    ${categories
      .map((cat) => {
        const cs = categoryScore(cat, responses);
        const nc = cat.questions.filter((q) => {
          const l = responses[q.question_code]?.level;
          return l === "non_conforme" || l === "partiel";
        }).length;
        return `<tr><td>${escapeHtml(cat.name)}</td><td>${cs.answered}/${cs.total}</td><td>${cs.pct}%</td><td>${nc ? `${nc} écart(s) identifié(s)` : "—"}</td></tr>`;
      })
      .join("")}
    </tbody>
  </table>

  ${audit?.executive_summary
      ? `<h2>3. Synthèse de l'auditeur</h2><div class="box">${escapeHtml(audit.executive_summary).replace(/\n/g, "<br>")}</div>`
      : ""}

  <div class="pagebreak"></div>
  <h2>4. Écarts prioritaires (${gaps.length})</h2>
  ${gaps.length
      ? `<table><thead><tr><th style="width:60px">Réf.</th><th>Exigence</th><th style="width:90px">Statut légal</th><th style="width:60px">Risque</th><th style="width:80px">Évaluation</th></tr></thead><tbody>
      ${gaps
        .map(
          (q) => `<tr>
        <td>${escapeHtml(q.question_code)}</td>
        <td>${escapeHtml(q.text)}${q.legal_reference ? `<div class="muted">${escapeHtml(q.legal_reference)}</div>` : ""}
        ${responses[q.question_code]?.recommendation ? `<div style="color:#7a1fa8;"><em>→ ${escapeHtml(responses[q.question_code].recommendation)}</em></div>` : ""}</td>
        <td>${escapeHtml(LEGAL_STATUS_LABELS[q.legal_status] || q.legal_status)}</td>
        <td>${escapeHtml(RISK_LABELS[q.risk] || q.risk)}</td>
        <td style="color:${LEVEL_COLOR[responses[q.question_code]?.level] || "#374151"}">${escapeHtml(LEVEL_LABELS[responses[q.question_code]?.level] || "")}</td>
      </tr>`,
        )
        .join("")}
    </tbody></table>`
      : `<p class="muted">Aucun écart de conformité identifié sur le périmètre évalué.</p>`}

  <div class="pagebreak"></div>
  <h2>5. Détail des exigences évaluées</h2>
  ${categories
    .map(
      (cat) => `
    <h3>${escapeHtml(cat.name)}</h3>
    <table><thead><tr><th style="width:55px">Réf.</th><th>Exigence</th><th style="width:85px">Statut légal</th><th style="width:80px">Évaluation</th><th style="width:26%">Constats</th></tr></thead><tbody>
    ${cat.questions
      .map((q) => {
        const r = responses[q.question_code] || {};
        return `<tr>
        <td>${escapeHtml(q.question_code)}</td>
        <td>${escapeHtml(q.text)}${q.legal_reference ? `<div class="muted">${escapeHtml(q.legal_reference)}</div>` : ""}
          ${q.inclusion_reason ? `<div class="muted">Inclus : ${escapeHtml(q.inclusion_reason)}</div>` : ""}</td>
        <td>${escapeHtml(LEGAL_STATUS_LABELS[q.legal_status] || q.legal_status)}</td>
        <td style="color:${LEVEL_COLOR[r.level] || "#94a3b8"}">${escapeHtml(LEVEL_LABELS[r.level] || "À évaluer")}</td>
        <td>${r.comment ? escapeHtml(r.comment).replace(/\n/g, "<br>") : ""}
          ${r.justification ? `<div class="muted">Justification : ${escapeHtml(r.justification)}</div>` : ""}
          ${r.evidence ? `<div class="muted">Preuve : ${escapeHtml(r.evidence)}</div>` : ""}</td>
      </tr>`;
      })
      .join("")}
    </tbody></table>`,
    )
    .join("")}

  ${excluded.length
      ? `<div class="pagebreak"></div><h2>Annexe — Exigences hors périmètre (${excluded.length})</h2>
    <table><thead><tr><th style="width:55px">Réf.</th><th>Exigence</th><th style="width:40%">Motif d'exclusion</th></tr></thead><tbody>
    ${excluded
      .map(
        (q) => `<tr><td>${escapeHtml(q.question_code)}</td><td>${escapeHtml(q.text)}</td><td>${escapeHtml(q.exclusion_reason || "Hors périmètre déclaré")}</td></tr>`,
      )
      .join("")}
    </tbody></table>`
      : ""}

  ${audit?.recommendations
      ? `<h2>Recommandations globales</h2><div class="box">${escapeHtml(audit.recommendations).replace(/\n/g, "<br>")}</div>`
      : ""}

  <p class="muted" style="margin-top:28px;border-top:1px solid #ddd;padding-top:8px;">
    Ce rapport est une aide à l'évaluation de la conformité au RGPD sur la base des éléments déclarés et constatés à la date de l'audit.
    Il ne constitue ni une certification ni un avis juridique. Rapport généré par la plateforme d'audit RGPD Informatique &amp; Web —
    ${new Date().toLocaleString("fr-FR")}.
  </p>
  </body></html>`;

  await downloadHtmlPdf({
    html,
    baseName: `rapport_audit_sectoriel_${audit?.title || "rgpd"}`,
    company: company?.name,
    orientation: "portrait",
  });
}
