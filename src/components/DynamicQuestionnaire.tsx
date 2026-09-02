import { useMemo } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HelpCircle, Plus, Trash2, EyeOff, Info } from "lucide-react";
import { COMPLIANCE_LEVELS } from "@/data/rgpdReferential";
import { QUESTION_HELP } from "@/data/rgpdHelp";
import {
  LEGAL_STATUS_CLASS, LEGAL_STATUS_LABELS, categoryScore, groupByCategory,
  type ScopedSnapshotQuestion,
} from "@/lib/auditScoring";

interface Props {
  questions: ScopedSnapshotQuestion[]; // snapshot complet (incluses + écartées)
  responses: Record<string, any>;
  readOnly?: boolean;
  actionQids?: Set<string>;
  onUpdate?: (q: ScopedSnapshotQuestion, patch: any) => void;
  onCreateAction?: (q: ScopedSnapshotQuestion) => void;
  onDeleteAction?: (questionCode: string) => void;
}

export function DynamicQuestionnaire({
  questions, responses, readOnly, actionQids, onUpdate, onCreateAction, onDeleteAction,
}: Props) {
  const included = useMemo(() => questions.filter((q) => q.included), [questions]);
  const excluded = useMemo(() => questions.filter((q) => !q.included), [questions]);
  const categories = useMemo(() => groupByCategory(included), [included]);
  const excludedCategories = useMemo(() => groupByCategory(excluded), [excluded]);

  return (
    <>
      <Accordion type="multiple" className="space-y-3">
        {categories.map((cat) => {
          const s = categoryScore(cat, responses);
          return (
            <AccordionItem key={cat.id} value={cat.id} className="rounded-xl border-2 bg-card px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex w-full items-center gap-3 pr-2 text-left">
                  <div className="flex-1">
                    <div className="font-semibold">{cat.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.total} questions applicables · {s.answered} évaluées
                    </div>
                  </div>
                  <div className="hidden w-32 sm:block"><Progress value={s.pct} className="h-1.5" /></div>
                  <Badge variant="outline" className="font-bold">{s.pct}%</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {cat.questions.map((q) => {
                    const r = responses[q.question_code] || { level: "a_evaluer" };
                    const help = q.help || QUESTION_HELP[q.question_code];
                    return (
                      <div key={q.id} className="rounded-lg border bg-background p-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-[240px] flex-1">
                            <div className="flex flex-wrap items-start gap-1.5">
                              <p className="text-sm font-medium">{q.text}</p>
                              <Badge
                                variant="outline"
                                className={LEGAL_STATUS_CLASS[q.legal_status]}
                                title={q.applicability_condition || undefined}
                              >
                                {LEGAL_STATUS_LABELS[q.legal_status]}
                              </Badge>
                              {help && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button
                                      type="button"
                                      aria-label="Aide sur cette question"
                                      className="mt-0.5 shrink-0 rounded-full text-muted-foreground transition-smooth hover:text-primary"
                                    >
                                      <HelpCircle className="h-4 w-4" />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent align="start" className="w-[min(22rem,calc(100vw-2rem))] text-xs leading-relaxed">
                                    <p className="mb-1 font-semibold text-primary">Ce qui est attendu</p>
                                    <p className="text-muted-foreground">{help}</p>
                                    {q.legal_reference && (
                                      <p className="mt-2 text-[11px] text-muted-foreground/80">Référence : {q.legal_reference}</p>
                                    )}
                                  </PopoverContent>
                                </Popover>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {q.legal_reference}
                              {q.weight > 1 ? ` · poids ${q.weight}` : ""}
                            </p>
                            {q.inclusion_reason && (
                              <p className="mt-1 flex items-center gap-1 text-[11px] text-primary/80">
                                <Info className="h-3 w-3" />{q.inclusion_reason}
                              </p>
                            )}
                          </div>

                          {readOnly ? (
                            <Badge variant="outline">
                              {COMPLIANCE_LEVELS[r.level as keyof typeof COMPLIANCE_LEVELS]?.label || "À évaluer"}
                            </Badge>
                          ) : (
                            <Select value={r.level} onValueChange={(v) => onUpdate?.(q, { level: v })}>
                              <SelectTrigger className="w-full sm:w-52"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Object.entries(COMPLIANCE_LEVELS).map(([k, v]) => (
                                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>

                        {!readOnly && (r.level === "non_conforme" || r.level === "partiel" || r.comment || r.recommendation) && (
                          <div className="mt-3 grid gap-2 md:grid-cols-2">
                            <Textarea placeholder="Constat / commentaire" value={r.comment || ""} rows={2} className="text-xs"
                              onChange={(e) => onUpdate?.(q, { comment: e.target.value })} />
                            <Textarea placeholder="Recommandation" value={r.recommendation || ""} rows={2} className="text-xs"
                              onChange={(e) => onUpdate?.(q, { recommendation: e.target.value })} />
                            <Textarea placeholder="Preuves / éléments justificatifs" value={r.evidence || ""} rows={2}
                              className="text-xs md:col-span-2"
                              onChange={(e) => onUpdate?.(q, { evidence: e.target.value })} />
                          </div>
                        )}
                        {readOnly && r.comment && (
                          <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{r.comment}</p>
                        )}

                        {!readOnly && (r.level === "non_conforme" || r.level === "partiel") && (
                          actionQids?.has(q.question_code) ? (
                            <Button size="sm" variant="outline" onClick={() => onDeleteAction?.(q.question_code)}
                              className="mt-2 border-destructive/30 text-destructive hover:bg-destructive/10">
                              <Trash2 className="mr-1 h-3 w-3" />Supprimer l'action corrective
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => onCreateAction?.(q)} className="mt-2">
                              <Plus className="mr-1 h-3 w-3" />Créer une action corrective
                            </Button>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {excluded.length > 0 && (
        <Accordion type="single" collapsible className="mt-4">
          <AccordionItem value="excluded" className="rounded-xl border-2 border-dashed bg-muted/30 px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2 text-left text-sm font-semibold text-muted-foreground">
                <EyeOff className="h-4 w-4" />
                {excluded.length} questions écartées du périmètre
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                {excludedCategories.map((cat) => (
                  <div key={cat.id}>
                    <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{cat.name}</p>
                    <ul className="space-y-1">
                      {cat.questions.map((q) => (
                        <li key={q.id} className="rounded-md border bg-background/60 p-2 text-xs">
                          <span className="text-muted-foreground">{q.text}</span>
                          <span className="ml-1 italic text-muted-foreground/70">— {q.exclusion_reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </>
  );
}
