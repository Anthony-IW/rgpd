console.log("start gen");
import fs from "fs";
import { jsPDF } from "jspdf";
(jsPDF as any).prototype.save = function (n: string) {
  fs.writeFileSync("/tmp/qpdf/out.pdf", Buffer.from(this.output("arraybuffer")));
  console.log("saved", n);
};
const { printQuestionnairePDF } = await import("/dev-server/src/lib/exports/questionnairePdf");
const { RGPD_REFERENTIAL } = await import("/dev-server/src/data/rgpdReferential");
const { QUESTION_HELP } = await import("/dev-server/src/data/rgpdHelp");
const cats = (RGPD_REFERENTIAL as any).slice(0,3).map((c:any)=>({id:c.id,name:c.name,questions:c.questions.map((q:any)=>({id:q.id,text:q.text,reference:q.reference,help:(QUESTION_HELP as any)[q.id]}))}));
console.log("cats",cats.length);
printQuestionnairePDF({title:"Questionnaire d'audit RGPD (vierge)",companyName:"ACME",auditTitle:"Audit 2026",categories:cats,includeHelp:true,includeAnswers:false,commentLines:3,intro:"Questionnaire vierge : cochez pour chaque point l'état de conformité et complétez la zone de commentaire."});
