import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, ClipboardCheck, FileDown, Save, Plus, HelpCircle, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  RGPD_REFERENTIAL, COMPLIANCE_LEVELS, AUDIT_STATUS_META,
  computeCategoryScore, computeGlobalScore, totalQuestions, obligationOf, mandatoryLabel, mandatoryNote,
} from "@/data/rgpdReferential";
import { OBLIGATION_BADGE_CLASS } from "@/data/rgpdObligations";
import { QUESTION_HELP } from "@/data/rgpdHelp";
import { generateAuditPDF } from "@/lib/pdfReport";
import { ExportMenu } from "@/components/ExportMenu";
import { exportAuditXLSX } from "@/lib/exports/excelExport";
import { QuestionnaireExportDialog } from "@/components/QuestionnaireExportDialog";
import { DynamicQuestionnaire } from "@/components/DynamicQuestionnaire";
import { computeScopeScores, type ScopedSnapshotQuestion } from "@/lib/auditScoring";
import { generateAuditScope } from "@/lib/auditEngine";

export default function AuditDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [audit, setAudit] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [actionQids, setActionQids] = useState<Set<string>>(new Set());
  const [actionMap, setActionMap] = useState<Record<string, string>>({});
  const [snapshot, setSnapshot] = useState<ScopedSnapshotQuestion[]>([]);
  const [scopeMeta, setScopeMeta] = useState<any>(null);
  const [regenerating, setRegenerating] = useState(false);

  const loadSnapshot = async (auditId: string) => {
    const [{ data: snap }, { data: meta }] = await Promise.all([
      supabase.from("audit_questions_snapshot").select("*").eq("audit_id", auditId).order("position"),
      supabase.from("audit_scope_snapshot").select("*").eq("audit_id", auditId).maybeSingle(),
    ]);
    setSnapshot((snap as any) || []);
    setScopeMeta(meta);
  };

  useEffect(() => {
    if (!id) return;
    document.title = "Audit | RGPD";
    (async () => {
      const { data: a } = await supabase.from("audits").select("*, companies(*)").eq("id", id).single();
      setAudit(a); setCompany(a?.companies);
      const { data: r } = await supabase.from("audit_responses").select("*").eq("audit_id", id);
      const map: Record<string, any> = {};
      (r || []).forEach((x) => (map[x.question_id] = x));
      setResponses(map);
      const { data: acts } = await supabase.from("action_plans").select("id,related_question_id").eq("audit_id", id).not("related_question_id", "is", null);
      const qids = new Set<string>();
      const amap: Record<string, string> = {};
      (acts || []).forEach((x: any) => {
        qids.add(x.related_question_id);
        amap[x.related_question_id] = x.id;
      });
      setActionQids(qids);
      setActionMap(amap);
      await loadSnapshot(id);
    })();
  }, [id]);

  const isDynamic = snapshot.length > 0;
  const scopeScores = useMemo(() => computeScopeScores(snapshot, responses), [snapshot, responses]);
  const staticScore = useMemo(() => computeGlobalScore(responses), [responses]);
  const globalScore = isDynamic ? scopeScores.global : staticScore;
  const totalQ = isDynamic ? scopeScores.total : totalQuestions();
  const answeredCount = isDynamic
    ? scopeScores.answered
    : Object.values(responses).filter((r: any) => r.level && r.level !== "a_evaluer").length;

  const regenerateScope = async () => {
    if (!company) return;
    setRegenerating(true);
    try {
      await generateAuditScope(id!, company.id);
      await loadSnapshot(id!);
      toast.success("Périmètre recalculé");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRegenerating(false);
    }
  };


  const updateResponse = async (q: any, category: string, patch: any) => {
    const existing = responses[q.id];
    const next = { ...(existing || { question_id: q.id, category, level: "a_evaluer" }), ...patch };
    setResponses((s) => ({ ...s, [q.id]: next }));
    const { error } = await supabase.from("audit_responses").upsert({
      audit_id: id, question_id: q.id, category, level: next.level,
      comment: next.comment ?? null, evidence: next.evidence ?? null, recommendation: next.recommendation ?? null,
    }, { onConflict: "audit_id,question_id" });
    if (error) toast.error(error.message);
  };

  const updateSnapshotResponse = (q: ScopedSnapshotQuestion, patch: any) =>
    updateResponse({ id: q.question_code, text: q.text }, q.category_id, patch);

  const saveAudit = async (extra: any = {}) => {
    setSaving(true);
    const { error } = await supabase.from("audits").update({
      global_score: globalScore,
      ...(isDynamic
        ? {
            regulatory_score: scopeScores.regulatory,
            maturity_score: scopeScores.maturity,
            coverage_score: scopeScores.coverage,
          }
        : {}),
      executive_summary: audit.executive_summary,
      recommendations: audit.recommendations,
      ...extra,
    }).eq("id", id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Audit enregistré");
  };


  const setStatus = async (status: string) => {
    setAudit({ ...audit, status });
    const upd: any = { status };
    if (status === "completed") upd.completed_at = new Date().toISOString();
    upd.global_score = globalScore;
    await supabase.from("audits").update(upd).eq("id", id);
    toast.success("Statut mis à jour");
  };

  const createActionFromQuestion = async (q: any, category: string) => {
    if (actionQids.has(q.id)) return toast.error("Une action corrective existe déjà pour cette question");
    const r = responses[q.id];
    const { data, error } = await supabase.from("action_plans").insert({
      audit_id: id, company_id: company.id, owner_id: user!.id,
      title: q.text.slice(0, 200),
      description: r?.recommendation || "",
      category, related_question_id: q.id,
      priority: r?.level === "non_conforme" ? "haute" : "moyenne",
      status: "a_faire",
    }).select("id").single();
    if (error) return toast.error(error.code === "23505" ? "Une action corrective existe déjà pour cette question" : error.message);
    setActionQids((s) => new Set(s).add(q.id));
    setActionMap((m) => ({ ...m, [q.id]: data.id }));
    toast.success("Action ajoutée au plan");
  };

  const deleteActionFromQuestion = async (qid: string) => {
    const actionId = actionMap[qid];
    if (!actionId) return;
    const { error } = await supabase.from("action_plans").delete().eq("id", actionId);
    if (error) return toast.error(error.message);
    setActionQids((s) => {
      const next = new Set(s);
      next.delete(qid);
      return next;
    });
    setActionMap((m) => {
      const next = { ...m };
      delete next[qid];
      return next;
    });
    toast.success("Action corrective supprimée");
  };

  const exportPdf = async () => {
    if (!audit || !company) return;
    await generateAuditPDF({ audit, company, responses, globalScore });
  };

  const exportExcel = async () => {
    if (!audit || !company) return;
    const [{ data: actions }, { data: processing }] = await Promise.all([
      supabase.from("action_plans").select("*").eq("company_id", company.id),
      supabase.from("processing_records").select("*").eq("company_id", company.id),
    ]);
    exportAuditXLSX({ audit, company, responses, actions: actions || [], processing: processing || [] });
  };

  if (!audit) return null;

  async function deleteAudit() {
    const { error } = await supabase.from("audits").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Audit supprimé");
    navigate("/audits");
  }


  return (
    <div className="mx-auto max-w-6xl">
      <Button variant="ghost" onClick={() => navigate("/audits")} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" />Audits</Button>
      <PageHeader
        title={audit.title}
        description={`${company?.name} · ${answeredCount}/${totalQ} questions évaluées`}
        icon={ClipboardCheck}
        actions={
          <>
            <QuestionnaireExportDialog auditTitle={audit.title} companyName={company?.name} responses={responses} />
            <ExportMenu label="Rapport" onPdf={exportPdf} onExcel={exportExcel} />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer cet audit ?</AlertDialogTitle>
                  <AlertDialogDescription>Cette action est irréversible. Toutes les réponses de cet audit seront supprimées.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteAudit} className="bg-destructive">Supprimer</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={() => saveAudit()} disabled={saving} className="bg-gradient-primary"><Save className="mr-2 h-4 w-4" />Enregistrer</Button>
          </>
        }
      />


      <Card className="mb-6 border-2 bg-gradient-card">
        <CardContent className="grid gap-4 p-5 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Score global</p>
            <p className="text-4xl font-bold text-phoenix">{globalScore}%</p>
            <Progress value={globalScore} className="mt-2 h-2" />
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Avancement</p>
            <p className="text-2xl font-semibold">{answeredCount}/{totalQ}</p>
            <Progress value={(answeredCount / totalQ) * 100} className="mt-2 h-2" />
          </div>
          <div>
            <p className="mb-2 text-xs uppercase text-muted-foreground">Statut</p>
            <Select value={audit.status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(AUDIT_STATUS_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isDynamic ? (
        <>
          <Card className="mb-6 border-2">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-3">
              <CardTitle className="text-base">Périmètre dynamique</CardTitle>
              <Button size="sm" variant="outline" onClick={regenerateScope} disabled={regenerating}>
                {regenerating ? "Recalcul…" : "Recalculer le périmètre"}
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Score réglementaire</p>
                <p className="text-2xl font-bold">{scopeScores.regulatory}%</p>
                <Progress value={scopeScores.regulatory} className="mt-2 h-2" />
                <p className="mt-1 text-[11px] text-muted-foreground">Questions obligatoires applicables</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Score de maturité</p>
                <p className="text-2xl font-bold">{scopeScores.maturity}%</p>
                <Progress value={scopeScores.maturity} className="mt-2 h-2" />
                <p className="mt-1 text-[11px] text-muted-foreground">Bonnes pratiques recommandées</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Couverture</p>
                <p className="text-2xl font-bold">{scopeScores.coverage}%</p>
                <Progress value={scopeScores.coverage} className="mt-2 h-2" />
                <p className="mt-1 text-[11px] text-muted-foreground">{scopeScores.answered}/{scopeScores.total} questions évaluées</p>
              </div>
              {scopeMeta && (
                <div className="md:col-span-3 flex flex-wrap gap-1.5 border-t pt-3">
                  {(scopeMeta.included_modules || []).map((m: any) => (
                    <Badge key={m.code} variant="outline" className="border-primary/30 bg-primary/5 text-xs" title={m.reason}>
                      {m.label}
                    </Badge>
                  ))}
                  {(scopeMeta.excluded_modules || []).map((m: any) => (
                    <Badge key={m.code} variant="outline" className="text-xs text-muted-foreground line-through" title={m.reason}>
                      {m.label}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <DynamicQuestionnaire
            questions={snapshot}
            responses={responses}
            actionQids={actionQids}
            onUpdate={updateSnapshotResponse}
            onCreateAction={(q) => createActionFromQuestion({ id: q.question_code, text: q.text }, q.category_id)}
            onDeleteAction={deleteActionFromQuestion}
          />
        </>
      ) : (
      <Accordion type="multiple" className="space-y-3">

        {RGPD_REFERENTIAL.map((cat) => {
          const s = computeCategoryScore(cat, responses);
          const pct = s.total === 0 ? 0 : Math.round((s.score / s.total) * 100);
          return (
            <AccordionItem key={cat.id} value={cat.id} className="rounded-xl border-2 bg-card px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex w-full items-center gap-3 pr-2 text-left">
                  <div className="flex-1">
                    <div className="font-semibold">{cat.name}</div>
                    <div className="text-xs text-muted-foreground">{cat.questions.length} questions · {s.answered} évaluées</div>
                  </div>
                  <div className="hidden w-32 sm:block">
                    <Progress value={pct} className="h-1.5" />
                  </div>
                  <Badge variant="outline" className="font-bold">{pct}%</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {cat.questions.map((q) => {
                    const r = responses[q.id] || { level: "a_evaluer" };
                    return (
                      <div key={q.id} className="rounded-lg border bg-background p-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex-1 min-w-[240px]">
                            <div className="flex flex-wrap items-start gap-1.5">
                              <p className="text-sm font-medium">{q.text}</p>
                              <Badge
                                variant="outline"
                                className={OBLIGATION_BADGE_CLASS[obligationOf(q).status]}
                                title={mandatoryNote(q)}
                              >
                                {mandatoryLabel(q)}
                              </Badge>

                              {(q.help || QUESTION_HELP[q.id]) && (
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
                                    <p className="text-muted-foreground">{q.help || QUESTION_HELP[q.id]}</p>
                                    {q.reference && <p className="mt-2 text-[11px] text-muted-foreground/80">Référence : {q.reference}</p>}
                                  </PopoverContent>
                                </Popover>
                              )}
                            </div>
                            {q.reference && <p className="mt-0.5 text-xs text-muted-foreground">{q.reference}{q.weight && q.weight > 1 ? ` · poids ${q.weight}` : ""}</p>}
                          </div>

                          <Select value={r.level} onValueChange={(v) => updateResponse(q, cat.id, { level: v })}>
                            <SelectTrigger className="w-full sm:w-52"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(COMPLIANCE_LEVELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        {(r.level === "non_conforme" || r.level === "partiel" || r.comment || r.recommendation) && (
                          <div className="mt-3 grid gap-2 md:grid-cols-2">
                            <Textarea placeholder="Constat / commentaire" value={r.comment || ""} onChange={(e) => updateResponse(q, cat.id, { comment: e.target.value })} rows={2} className="text-xs" />
                            <Textarea placeholder="Recommandation" value={r.recommendation || ""} onChange={(e) => updateResponse(q, cat.id, { recommendation: e.target.value })} rows={2} className="text-xs" />
                            <Textarea placeholder="Preuves / éléments justificatifs" value={r.evidence || ""} onChange={(e) => updateResponse(q, cat.id, { evidence: e.target.value })} rows={2} className="text-xs md:col-span-2" />
                          </div>
                        )}
                        {(r.level === "non_conforme" || r.level === "partiel") && (
                          actionQids.has(q.id) ? (
                            <Button size="sm" variant="outline" onClick={() => deleteActionFromQuestion(q.id)} className="mt-2 text-destructive hover:bg-destructive/10 border-destructive/30">
                              <Trash2 className="mr-1 h-3 w-3" />Supprimer l'action corrective
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => createActionFromQuestion(q, cat.id)} className="mt-2">
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

      <Card className="mt-6 border-2">
        <CardHeader><CardTitle>Synthèse exécutive</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Textarea placeholder="Synthèse pour la direction" value={audit.executive_summary || ""} onChange={(e) => setAudit({ ...audit, executive_summary: e.target.value })} rows={4} />
          <Textarea placeholder="Recommandations globales" value={audit.recommendations || ""} onChange={(e) => setAudit({ ...audit, recommendations: e.target.value })} rows={4} />
          <Button onClick={() => saveAudit()} disabled={saving} className="bg-gradient-primary"><Save className="mr-2 h-4 w-4" />Enregistrer la synthèse</Button>
        </CardContent>
      </Card>
    </div>
  );
}