import { RGPD_REFERENTIAL } from "@/data/rgpdReferential";
import { printQuestionnairePDF } from "@/lib/exports/questionnairePdf";
const cats = RGPD_REFERENTIAL.slice(0,2).map(c=>({id:c.id,name:c.name,questions:c.questions.slice(0,4).map(q=>({id:q.id,text:q.text,reference:q.reference}))}));
const fs = require("fs");
(globalThis as any).__out = null;
const doc:any=printQuestionnairePDF({ title:"Questionnaire d'audit RGPD (vierge)", companyName:"Test SA", categories: cats, includeHelp:false, includeAnswers:false, commentLines:3, fillable:true });
