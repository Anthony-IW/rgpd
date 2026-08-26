import { escapeHtml } from "./exportHelpers";
import { downloadHtmlPdf } from "./pdfDownload";


const STYLE = `
  body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#222;margin:24px;}
  .header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #7a1fa8;padding-bottom:10px;margin-bottom:16px;}
  .brand{color:#7a1fa8;font-weight:800;font-size:20px;}
  h1{font-size:18px;color:#7a1fa8;margin:0 0 6px;}
  .muted{color:#666;font-size:11px;}
  table{width:100%;border-collapse:collapse;margin-top:8px;font-size:11px;table-layout:fixed;}
  th,td{border:1px solid #ddd;padding:5px 7px;text-align:left;vertical-align:top;word-wrap:break-word;}
  th{background:#f4eaf9;color:#7a1fa8;}
  tr:nth-child(even) td{background:#fafafa;}
  .footer{margin-top:18px;border-top:1px solid #ddd;padding-top:6px;color:#777;font-size:10px;}
  @page{size:A4 landscape;margin:14mm;}
`;

export function openPrintHtml(html: string) {
  const w = window.open("", "_blank");
  if (!w) {
    alert("Veuillez autoriser les pop-ups pour générer le PDF.");
    return;
  }
  w.document.write(html);
  w.document.close();
}

export function printTablePDF(opts: {
  title: string;
  subtitle?: string;
  columns: string[];
  rows: (string | number | null | undefined)[][];
  filters?: string;
}) {
  const { title, subtitle, columns, rows, filters } = opts;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
    <style>${STYLE}</style></head><body>
    <div class="header">
      <div><div class="brand">Informatique &amp; Web</div><div class="muted">Audit RGPD</div></div>
      <div style="text-align:right;"><h1>${escapeHtml(title)}</h1>${subtitle ? `<div class="muted">${escapeHtml(subtitle)}</div>` : ""}</div>
    </div>
    ${filters ? `<div class="muted">Filtres : ${escapeHtml(filters)}</div>` : ""}
    <div class="muted">${rows.length} ligne(s) — généré le ${new Date().toLocaleString("fr-FR")}</div>
    <table>
      <thead><tr>${columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr></thead>
      <tbody>
        ${rows.map((r) => `<tr>${r.map((v) => `<td>${escapeHtml(v ?? "").replace(/\n/g, "<br>")}</td>`).join("")}</tr>`).join("")}
      </tbody>
    </table>
    <div class="footer">Rapport généré par la plateforme d'audit RGPD Informatique &amp; Web</div>
    </body></html>`;
  return downloadHtmlPdf({ html, baseName: title, company: subtitle, orientation: "landscape" });
}
