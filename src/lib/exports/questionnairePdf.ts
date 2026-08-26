import { escapeHtml } from "./exportHelpers";
import { downloadHtmlPdf } from "./pdfDownload";

import { COMPLIANCE_LEVELS } from "@/data/rgpdReferential";

export type QuestionnaireQuestion = {
  id: string;
  text: string;
  reference?: string;
  help?: string;
  level?: string | null;
  comment?: string | null;
};

export type QuestionnaireCategory = {
  id: string;
  name: string;
  questions: QuestionnaireQuestion[];
};

const LEVELS = ["conforme", "partiel", "non_conforme", "non_applicable", "a_evaluer"] as const;

const STYLE = `
  *{box-sizing:border-box;}
  body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#222;margin:0;padding:18mm 14mm;font-size:12px;}
  .header{display:flex;align-items:flex-start;justify-content:space-between;border-bottom:3px solid #7a1fa8;padding-bottom:10px;margin-bottom:14px;}
  .brand{color:#7a1fa8;font-weight:800;font-size:19px;}
  h1{font-size:17px;color:#7a1fa8;margin:0 0 4px;}
  h2{font-size:14px;color:#7a1fa8;margin:18px 0 6px;border-bottom:2px solid #e6d7f2;padding-bottom:3px;page-break-after:avoid;}
  .muted{color:#666;font-size:11px;}
  .intro{background:#faf5ff;border:1px solid #ecdcf7;border-radius:8px;padding:10px 12px;margin-bottom:12px;font-size:11px;}
  .q{border:1px solid #e2e2e2;border-radius:8px;padding:8px 10px;margin-bottom:8px;page-break-inside:avoid;}
  .q-text{font-weight:600;margin-bottom:2px;}
  .ref{color:#7a1fa8;font-size:10px;}
  .help{color:#555;font-size:10px;margin-top:3px;font-style:italic;}
  .boxes{display:flex;flex-wrap:wrap;gap:10px;margin-top:6px;font-size:11px;}
  .box{display:flex;align-items:center;gap:4px;}
  .cb{display:inline-block;width:11px;height:11px;border:1.2px solid #666;border-radius:2px;}
  .cb.checked{background:#7a1fa8;border-color:#7a1fa8;position:relative;}
  .cb.checked:after{content:"";position:absolute;left:3px;top:0px;width:3px;height:7px;border:solid #fff;border-width:0 1.6px 1.6px 0;transform:rotate(45deg);}
  .comment{margin-top:7px;}
  .comment .lbl{font-size:10px;color:#666;margin-bottom:3px;}
  .line{border-bottom:1px dotted #bbb;height:15px;}
  .prefill{font-size:11px;white-space:pre-wrap;border-left:3px solid #e6d7f2;padding-left:8px;color:#444;margin-top:4px;}
  .footer{margin-top:16px;border-top:1px solid #ddd;padding-top:6px;color:#777;font-size:10px;}
  @page{size:A4 portrait;margin:0;}
`;

export function printQuestionnairePDF(opts: {
  title: string;
  companyName?: string;
  auditTitle?: string;
  categories: QuestionnaireCategory[];
  includeHelp?: boolean;
  includeAnswers?: boolean;
  commentLines?: number;
  intro?: string;
}) {
  const {
    title, companyName, auditTitle, categories,
    includeHelp = true, includeAnswers = false, commentLines = 3, intro,
  } = opts;

  const count = categories.reduce((n, c) => n + c.questions.length, 0);

  const renderBoxes = (q: QuestionnaireQuestion) =>
    `<div class="boxes">${LEVELS.map((l) => {
      const checked = includeAnswers && q.level === l;
      return `<span class="box"><span class="cb${checked ? " checked" : ""}"></span>${escapeHtml(
        COMPLIANCE_LEVELS[l].label
      )}</span>`;
    }).join("")}</div>`;

  const renderComment = (q: QuestionnaireQuestion) => {
    if (includeAnswers && q.comment) {
      return `<div class="comment"><div class="lbl">Commentaire :</div><div class="prefill">${escapeHtml(q.comment)}</div></div>`;
    }
    return `<div class="comment"><div class="lbl">Commentaire / éléments de preuve :</div>${Array.from(
      { length: Math.max(1, commentLines) }
    ).map(() => `<div class="line"></div>`).join("")}</div>`;
  };

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
    <style>${STYLE}</style></head><body>
    <div class="header">
      <div><div class="brand">Informatique &amp; Web</div><div class="muted">Questionnaire d'audit RGPD</div></div>
      <div style="text-align:right;">
        <h1>${escapeHtml(title)}</h1>
        <div class="muted">${escapeHtml([companyName, auditTitle].filter(Boolean).join(" · "))}</div>
        <div class="muted">${count} question(s) — ${new Date().toLocaleDateString("fr-FR")}</div>
      </div>
    </div>
    ${intro ? `<div class="intro">${escapeHtml(intro).replace(/\n/g, "<br>")}</div>` : ""}
    ${categories.map((cat) => `
      <h2>${escapeHtml(cat.name)}</h2>
      ${cat.questions.map((q) => `
        <div class="q">
          <div class="q-text">${escapeHtml(q.text)}</div>
          ${q.reference ? `<div class="ref">${escapeHtml(q.reference)}</div>` : ""}
          ${includeHelp && q.help ? `<div class="help">${escapeHtml(q.help)}</div>` : ""}
          ${renderBoxes(q)}
          ${renderComment(q)}
        </div>`).join("")}
    `).join("")}
    <div class="footer">Questionnaire généré par la plateforme d'audit RGPD Informatique &amp; Web — ${new Date().toLocaleString("fr-FR")}</div>
    </body></html>`;

  return downloadHtmlPdf({
    html,
    baseName: includeAnswers ? "questionnaire_rgpd" : "questionnaire_rgpd_vierge",
    company: companyName,
    orientation: "portrait",
  });
}
