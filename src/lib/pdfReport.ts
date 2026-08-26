import { RGPD_REFERENTIAL, COMPLIANCE_LEVELS, computeCategoryScore } from "@/data/rgpdReferential";
import { downloadHtmlPdf } from "@/lib/exports/pdfDownload";

export async function generateAuditPDF(data: {
  audit: any; company: any; responses: Record<string, any>; globalScore: number;
}) {
  const { audit, company, responses, globalScore } = data;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Rapport d'audit RGPD - ${escapeHtml(company.name)}</title>
    <style>
      body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#222;max-width:880px;margin:auto;padding:24px;}
      h1{color:#7a1fa8;margin-bottom:4px;} h2{color:#7a1fa8;margin-top:28px;border-bottom:2px solid #e6d7f2;padding-bottom:4px;}
      h3{margin-top:18px;color:#444;} .muted{color:#666;font-size:12px;}
      .score-big{font-size:64px;font-weight:800;background:linear-gradient(135deg,#7a1fa8,#2d6cdf,#ff7a1f);-webkit-background-clip:text;background-clip:text;color:transparent;}
      .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px 24px;font-size:13px;}
      table{width:100%;border-collapse:collapse;margin-top:8px;font-size:12px;}
      th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top;}
      th{background:#f4eaf9;color:#7a1fa8;}
      .badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;}
      .b-ok{background:#d8f5e3;color:#0a6b32;} .b-no{background:#fbdcdc;color:#9b1c1c;}
      .b-warn{background:#fff0d6;color:#8a5b00;} .b-na{background:#eee;color:#666;}
      .header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #7a1fa8;padding-bottom:12px;}
      .summary-box{background:linear-gradient(135deg,#fbf6ff,#fff7f0);padding:16px;border-radius:12px;margin:16px 0;}
      @media print { .pagebreak { page-break-before: always; } }
    </style></head><body>
    <div class="header">
      <div><div style="color:#7a1fa8;font-weight:800;font-size:22px;">Informatique &amp; Web</div>
      <div class="muted">Rapport d'audit RGPD</div></div>
      <div style="text-align:right;"><div class="score-big">${globalScore}%</div><div class="muted">Score de conformité</div></div>
    </div>

    <h1>${escapeHtml(audit.title)}</h1>
    <p class="muted">Émis le ${new Date().toLocaleDateString("fr-FR")}</p>

    <h2>Entité auditée</h2>
    <div class="grid">
      <div><strong>Raison sociale :</strong> ${escapeHtml(company.name)}</div>
      ${company.siret ? `<div><strong>SIRET :</strong> ${escapeHtml(company.siret)}</div>` : ""}
      ${company.legal_form ? `<div><strong>Forme :</strong> ${escapeHtml(company.legal_form)}</div>` : ""}
      ${company.sector ? `<div><strong>Secteur :</strong> ${escapeHtml(company.sector)}</div>` : ""}
      ${company.size ? `<div><strong>Taille :</strong> ${escapeHtml(company.size)}</div>` : ""}
      ${company.employees_count ? `<div><strong>Effectif :</strong> ${company.employees_count}</div>` : ""}
      ${company.address ? `<div><strong>Adresse :</strong> ${escapeHtml([company.address, company.postal_code, company.city, company.country].filter(Boolean).join(", "))}</div>` : ""}
      ${company.contact_name ? `<div><strong>Contact :</strong> ${escapeHtml(company.contact_name)}${company.contact_email ? " - " + escapeHtml(company.contact_email) : ""}</div>` : ""}
      ${company.has_dpo ? `<div><strong>DPO :</strong> ${escapeHtml(company.dpo_name || "Désigné")}${company.dpo_email ? " - " + escapeHtml(company.dpo_email) : ""}</div>` : `<div><strong>DPO :</strong> Non désigné</div>`}
    </div>

    ${audit.executive_summary ? `<h2>Synthèse exécutive</h2><div class="summary-box">${escapeHtml(audit.executive_summary).replace(/\n/g, "<br>")}</div>` : ""}

    <h2>Synthèse par domaine</h2>
    <table><thead><tr><th>Domaine</th><th>Évaluées</th><th>Total</th><th>Score</th></tr></thead><tbody>
      ${RGPD_REFERENTIAL.map((cat) => {
        const s = computeCategoryScore(cat, responses);
        const pct = s.total === 0 ? 0 : Math.round((s.score / s.total) * 100);
        return `<tr><td>${escapeHtml(cat.name)}</td><td>${s.answered}</td><td>${cat.questions.length}</td><td><strong>${pct}%</strong></td></tr>`;
      }).join("")}
    </tbody></table>

    <div class="pagebreak"></div>
    <h2>Détail des constats</h2>
    ${RGPD_REFERENTIAL.map((cat) => `
      <h3>${escapeHtml(cat.name)}</h3>
      <table><thead><tr><th style="width:55%">Question</th><th>Niveau</th><th>Constat / Recommandation</th></tr></thead><tbody>
        ${cat.questions.map((q) => {
          const r = responses[q.id];
          const lvl = r?.level || "a_evaluer";
          const meta = COMPLIANCE_LEVELS[lvl as keyof typeof COMPLIANCE_LEVELS];
          const cls = lvl === "conforme" ? "b-ok" : lvl === "non_conforme" ? "b-no" : lvl === "partiel" ? "b-warn" : "b-na";
          return `<tr><td>${escapeHtml(q.text)}${q.reference ? `<br><span class="muted">${escapeHtml(q.reference)}</span>` : ""}</td>
            <td><span class="badge ${cls}">${escapeHtml(meta.label)}</span></td>
            <td>${r?.comment ? `<div>${escapeHtml(r.comment).replace(/\n/g, "<br>")}</div>` : ""}${r?.recommendation ? `<div style="color:#7a1fa8;margin-top:4px;"><em>→ ${escapeHtml(r.recommendation).replace(/\n/g, "<br>")}</em></div>` : ""}</td></tr>`;
        }).join("")}
      </tbody></table>
    `).join("")}

    ${audit.recommendations ? `<div class="pagebreak"></div><h2>Recommandations globales</h2><div class="summary-box">${escapeHtml(audit.recommendations).replace(/\n/g, "<br>")}</div>` : ""}

    <p class="muted" style="margin-top:32px;border-top:1px solid #ddd;padding-top:8px;">
      Rapport généré par la plateforme d'audit RGPD Informatique &amp; Web - ${new Date().toLocaleString("fr-FR")}
    </p>
    </body></html>`;

  await downloadHtmlPdf({
    html,
    baseName: `rapport_audit_${audit.title || "rgpd"}`,
    company: company?.name,
    orientation: "portrait",
  });
}

function escapeHtml(s: string): string {
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}