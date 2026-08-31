import { useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { RGPD_REFERENTIAL, isMandatory } from "@/data/rgpdReferential";
import { QUESTION_HELP } from "@/data/rgpdHelp";
import { printQuestionnairePDF } from "@/lib/exports/questionnairePdf";

export function QuestionnaireExportDialog({
  auditTitle,
  companyName,
  responses = {},
}: {
  auditTitle?: string;
  companyName?: string;
  responses?: Record<string, any>;
}) {
  const allIds = useMemo(
    () => RGPD_REFERENTIAL.flatMap((c) => c.questions.map((q) => q.id)),
    []
  );
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(allIds));
  const [includeHelp, setIncludeHelp] = useState(true);
  const [includeAnswers, setIncludeAnswers] = useState(false);
  const [commentLines, setCommentLines] = useState(3);
  const [fillable, setFillable] = useState(true);

  const toggleQuestion = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const toggleCategory = (catId: string, checked: boolean) =>
    setSelected((s) => {
      const n = new Set(s);
      const cat = RGPD_REFERENTIAL.find((c) => c.id === catId);
      cat?.questions.forEach((q) => (checked ? n.add(q.id) : n.delete(q.id)));
      return n;
    });

  const buildCategories = (onlySelected: boolean, withAnswers: boolean) =>
    RGPD_REFERENTIAL.map((cat) => ({
      id: cat.id,
      name: cat.name,
      questions: cat.questions
        .filter((q) => (onlySelected ? selected.has(q.id) : true))
        .map((q) => ({
          id: q.id,
          text: q.text,
          reference: q.reference,
          help: QUESTION_HELP[q.id],
          mandatory: isMandatory(q),
          level: withAnswers ? responses[q.id]?.level ?? null : null,
          comment: withAnswers ? responses[q.id]?.comment ?? null : null,
        })),
    })).filter((c) => c.questions.length > 0);

  const handleExport = () => {
    const categories = buildCategories(true, includeAnswers);
    if (categories.length === 0) return toast.error("Sélectionnez au moins une question");

    toast.info("Génération du PDF en cours…");
    printQuestionnairePDF({
      title: "Questionnaire d'audit RGPD",
      companyName,
      auditTitle,
      categories,
      includeHelp,
      includeAnswers,
      commentLines,
      fillable: fillable && !includeAnswers,
      intro:
        "Merci de cocher pour chaque point l'état de conformité et de préciser vos commentaires ou éléments de preuve dans l'espace prévu.",
    });
    setOpen(false);
  };

  const handleBlankExport = () => {
    toast.info("Génération du questionnaire vierge…");
    printQuestionnairePDF({
      title: "Questionnaire d'audit RGPD (vierge)",
      companyName,
      auditTitle,
      categories: buildCategories(selected.size > 0 && selected.size < allIds.length, false),
      includeHelp,
      includeAnswers: false,
      commentLines: Math.max(commentLines, 3),
      fillable,
      intro:
        (fillable
          ? "Questionnaire vierge remplissable : ce PDF contient des champs de formulaire (cases à cocher et zones de commentaire) que vous pouvez compléter directement dans un navigateur ou un logiciel PDF, puis enregistrer. "
          : "") +
        "Questionnaire vierge : cochez pour chaque point l'état de conformité (À faire, Conforme, Partiel, Non conforme, Non applicable) et complétez la zone de commentaire sous chaque question.",
    });
    setOpen(false);
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileDown className="mr-2 h-4 w-4" />
          Questionnaire
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-3xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Exporter le questionnaire en PDF</DialogTitle>
          <DialogDescription>
            Sélectionnez les questions à inclure. Le PDF contient des cases à cocher et un espace de
            commentaire après chaque question.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-4 rounded-lg border p-3 text-sm">
          <div className="flex items-center gap-2">
            <Switch id="help" checked={includeHelp} onCheckedChange={setIncludeHelp} />
            <Label htmlFor="help">Inclure l'aide</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="answers" checked={includeAnswers} onCheckedChange={setIncludeAnswers} />
            <Label htmlFor="answers">Pré-remplir les réponses</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="fillable" checked={fillable} onCheckedChange={setFillable} disabled={includeAnswers} />
            <Label htmlFor="fillable">PDF remplissable</Label>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="lines">Lignes de commentaire</Label>
            <Input
              id="lines" type="number" min={1} max={10} className="h-8 w-16"
              value={commentLines}
              onChange={(e) => setCommentLines(Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
              disabled={includeAnswers}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{selected.size} question(s) sélectionnée(s)</span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set(allIds))}>Tout</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Aucun</Button>
          </div>
        </div>

        <ScrollArea className="h-[45vh] rounded-md border p-2">
          <Accordion type="multiple" className="space-y-1">
            {RGPD_REFERENTIAL.map((cat) => {
              const sel = cat.questions.filter((q) => selected.has(q.id)).length;
              return (
                <AccordionItem key={cat.id} value={cat.id} className="rounded-lg border px-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={sel === cat.questions.length ? true : sel > 0 ? "indeterminate" : false}
                      onCheckedChange={(c) => toggleCategory(cat.id, c === true)}
                    />
                    <AccordionTrigger className="flex-1 py-2 text-left hover:no-underline">
                      <span className="text-sm font-medium">
                        {cat.name}{" "}
                        <span className="text-xs text-muted-foreground">
                          ({sel}/{cat.questions.length})
                        </span>
                      </span>
                    </AccordionTrigger>
                  </div>
                  <AccordionContent className="space-y-1.5 pb-3">
                    {cat.questions.map((q) => (
                      <label key={q.id} className="flex cursor-pointer items-start gap-2 text-xs">
                        <Checkbox
                          className="mt-0.5"
                          checked={selected.has(q.id)}
                          onCheckedChange={() => toggleQuestion(q.id)}
                        />
                        <span>{q.text}</span>
                      </label>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </ScrollArea>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button variant="outline" onClick={handleBlankExport}>
            <FileDown className="mr-2 h-4 w-4" />Questionnaire vierge
          </Button>
          <Button className="bg-gradient-primary" onClick={handleExport}>
            <FileDown className="mr-2 h-4 w-4" />Télécharger le PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
