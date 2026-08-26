import { jsPDF } from "jspdf";
import { fileName } from "./exportHelpers";
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

const PURPLE: [number, number, number] = [122, 31, 168];
const GREY: [number, number, number] = [110, 110, 110];
const DARK: [number, number, number] = [34, 34, 34];

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

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const M = 14;
  const W = PW - M * 2;
  let y = M;

  const count = categories.reduce((n, c) => n + c.questions.length, 0);

  const footer = () => {
    const page = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(...GREY);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Questionnaire d'audit RGPD - Informatique & Web",
      M,
      PH - 8
    );
    doc.text(`Page ${page}`, PW - M, PH - 8, { align: "right" });
  };

  const newPage = () => {
    footer();
    doc.addPage();
    y = M;
  };

  const need = (h: number) => {
    if (y + h > PH - 16) newPage();
  };

  // En-tête
  doc.setFillColor(...PURPLE);
  doc.rect(0, 0, PW, 2.5, "F");
  y = M + 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...PURPLE);
  doc.text("Informatique & Web", M, y);
  doc.setFontSize(13);
  doc.setTextColor(...DARK);
  y += 7;
  doc.text(title, M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  y += 5;
  const sub = [companyName, auditTitle].filter(Boolean).join(" - ");
  if (sub) { doc.text(sub, M, y); y += 4; }
  doc.text(`${count} question(s) - ${new Date().toLocaleDateString("fr-FR")}`, M, y);
  y += 4;
  doc.setDrawColor(...PURPLE);
  doc.setLineWidth(0.6);
  doc.line(M, y, PW - M, y);
  y += 6;

  if (intro) {
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(intro, W - 6);
    const h = lines.length * 4 + 6;
    doc.setFillColor(250, 245, 255);
    doc.setDrawColor(236, 220, 247);
    doc.setLineWidth(0.2);
    doc.roundedRect(M, y, W, h, 2, 2, "FD");
    doc.text(lines, M + 3, y + 5);
    y += h + 6;
  }

  for (const cat of categories) {
    need(16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(...PURPLE);
    doc.text(cat.name, M, y);
    y += 2;
    doc.setDrawColor(230, 215, 242);
    doc.setLineWidth(0.5);
    doc.line(M, y, PW - M, y);
    y += 5;

    for (const q of cat.questions) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      const qLines = doc.splitTextToSize(q.text, W - 8);
      const refLines = q.reference ? doc.splitTextToSize(q.reference, W - 8) : [];
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      const helpLines = includeHelp && q.help ? doc.splitTextToSize(q.help, W - 8) : [];

      const answerText = includeAnswers && q.comment ? doc.splitTextToSize(q.comment, W - 12) : [];
      const commentH = answerText.length
        ? answerText.length * 3.8 + 6
        : Math.max(1, commentLines) * 6 + 4;

      const blockH =
        6 + qLines.length * 4.2 + refLines.length * 3.4 + helpLines.length * 3.4 + 10 + commentH + 4;

      need(blockH);

      const top = y;
      // Question
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...DARK);
      let cy = top + 5;
      doc.text(qLines, M + 4, cy);
      cy += qLines.length * 4.2;

      if (refLines.length) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...PURPLE);
        doc.text(refLines, M + 4, cy);
        cy += refLines.length * 3.4;
      }
      if (helpLines.length) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.5);
        doc.setTextColor(...GREY);
        doc.text(helpLines, M + 4, cy);
        cy += helpLines.length * 3.4;
      }

      // Cases à cocher
      cy += 3;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      let bx = M + 4;
      for (const l of LEVELS) {
        const label = COMPLIANCE_LEVELS[l].label;
        const lw = doc.getTextWidth(label);
        if (bx + lw + 8 > PW - M - 4) {
          bx = M + 4;
          cy += 5.5;
        }
        const checked = includeAnswers && q.level === l;
        doc.setDrawColor(90, 90, 90);
        doc.setLineWidth(0.3);
        if (checked) {
          doc.setFillColor(...PURPLE);
          doc.rect(bx, cy - 3, 3.2, 3.2, "FD");
          doc.setDrawColor(255, 255, 255);
          doc.setLineWidth(0.5);
          doc.line(bx + 0.7, cy - 1.5, bx + 1.4, cy - 0.6);
          doc.line(bx + 1.4, cy - 0.6, bx + 2.6, cy - 2.4);
        } else {
          doc.rect(bx, cy - 3, 3.2, 3.2, "S");
        }
        doc.setTextColor(...DARK);
        doc.text(label, bx + 4.6, cy);
        bx += lw + 10;
      }
      cy += 5;

      // Commentaire
      doc.setFontSize(7.5);
      doc.setTextColor(...GREY);
      doc.text(
        answerText.length ? "Commentaire :" : "Commentaire / éléments de preuve :",
        M + 4,
        cy
      );
      cy += 3;
      if (answerText.length) {
        doc.setFontSize(8.5);
        doc.setTextColor(...DARK);
        doc.text(answerText, M + 8, cy + 3);
        cy += answerText.length * 3.8 + 3;
      } else {
        doc.setDrawColor(190, 190, 190);
        doc.setLineWidth(0.2);
        for (let i = 0; i < Math.max(1, commentLines); i++) {
          cy += 6;
          doc.line(M + 4, cy, PW - M - 4, cy);
        }
        cy += 2;
      }

      // Cadre de la question
      doc.setDrawColor(215, 215, 215);
      doc.setLineWidth(0.25);
      doc.roundedRect(M, top, W, cy - top + 2, 2, 2, "S");
      y = cy + 6;
    }
    y += 2;
  }

  footer();
  doc.save(
    fileName(includeAnswers ? "questionnaire_rgpd" : "questionnaire_rgpd_vierge", "pdf", companyName)
  );
}
