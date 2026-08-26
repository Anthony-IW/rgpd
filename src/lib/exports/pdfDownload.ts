import { fileName } from "./exportHelpers";

/**
 * Génère et télécharge un PDF à partir d'un document HTML complet.
 * Le rendu est fait hors écran puis converti en PDF (pas d'impression navigateur).
 */
export async function downloadHtmlPdf(opts: {
  html: string;
  baseName: string;
  company?: string;
  orientation?: "portrait" | "landscape";
  margin?: number | [number, number, number, number];
}) {
  const { html, baseName, company, orientation = "portrait", margin = 10 } = opts;
  const name = fileName(baseName, "pdf", company);

  // Extraction du <style> et du <body> du document HTML fourni
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script").forEach((s) => s.remove());
  const styles = Array.from(doc.querySelectorAll("style"))
    .map((s) => s.textContent || "")
    .join("\n");

  const widthPx = orientation === "landscape" ? 1122 : 794;

  const container = document.createElement("div");
  container.style.cssText = `position:fixed;left:-10000px;top:0;width:${widthPx}px;background:#fff;z-index:-1;`;
  const styleEl = document.createElement("style");
  styleEl.textContent = styles + `\n.__pdfroot{width:100%;background:#fff;}`;
  const content = document.createElement("div");
  content.className = "__pdfroot";
  content.innerHTML = doc.body.innerHTML;
  container.appendChild(styleEl);
  container.appendChild(content);
  document.body.appendChild(container);

  try {
    const html2pdf = (await import("html2pdf.js")).default as any;
    await html2pdf()
      .set({
        margin,
        filename: name,
        image: { type: "jpeg", quality: 0.96 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff", windowWidth: widthPx },
        jsPDF: { unit: "mm", format: "a4", orientation },
        pagebreak: { mode: ["css", "avoid-all"] },
      })
      .from(content)
      .save();
  } finally {
    container.remove();
  }
}
