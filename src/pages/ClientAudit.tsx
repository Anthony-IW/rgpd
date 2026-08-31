import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ClipboardCheck, HelpCircle } from "lucide-react";
import {
  RGPD_REFERENTIAL, COMPLIANCE_LEVELS, AUDIT_STATUS_META,
  computeCategoryScore, computeGlobalScore, totalQuestions, isMandatory, mandatoryLabel,
} from "@/data/rgpdReferential";
import { QUESTION_HELP } from "@/data/rgpdHelp";

export default function ClientAudit() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [audit, setAudit] = useState<any>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Mon questionnaire RGPD | RGPD";
    (async () => {
      const { data } = await supabase.from("companies").select("id, name").order("name");
      setCompanies(data || []);
      if (data && data.length === 1) setCompanyId(data[0].id);
    })();
  }, []);

  useEffect(() => {
    if (!companyId) { setAudit(null); setResponses({}); return; }
    setLoading(true);
    (async () => {
      const { data: audits } = await supabase
        .from("audits").select("*, companies(name)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false }).limit(1);
      const a = audits?.[0] || null;
      setAudit(a);
      if (a) {
        const { data: r } = await supabase.from("audit_responses").select("*").eq("audit_id", a.id);
        const map: Record<string, any> = {};
        (r || []).forEach((x) => (map[x.question_id] = x));
        setResponses(map);
      } else {
        setResponses({});
      }
      setLoading(false);
    })();
  }, [companyId]);

  const totalQ = totalQuestions();
  const answeredCount = Object.values(responses).filter((r: any) => r.level && r.level !== "a_evaluer").length;
  const globalScore = computeGlobalScore(responses);
  const levelMeta = (level: string) => COMPLIANCE_LEVELS[level as keyof typeof COMPLIANCE_LEVELS];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Mon questionnaire RGPD"
        description="Consultez les réponses de votre audit et la signification de chaque point de contrôle (lecture seule)"
        icon={ClipboardCheck}
      />

      {companies.length > 1 && (
        <Card className="mb-4 border-2"><CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
          <Label>Entreprise :</Label>
          <Select value={companyId} onValueChange={setCompanyId}>
            <SelectTrigger className="w-full sm:w-72"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
            <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </CardContent></Card>
      )}

      {!companyId ? (
        <p className="text-center text-muted-foreground">Aucune entreprise rattachée à votre compte.</p>
      ) : loading ? (
        <p className="text-center text-muted-foreground py-8">Chargement…</p>
      ) : !audit ? (
        <p className="text-center text-muted-foreground py-8">Aucun audit n'a encore été réalisé pour votre entreprise.</p>
      ) : (
        <>
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
                <p className="text-xs uppercase text-muted-foreground">Statut de l'audit</p>
                <p className="mt-1 text-lg font-semibold">{AUDIT_STATUS_META[audit.status as keyof typeof AUDIT_STATUS_META]?.label}</p>
              </div>
            </CardContent>
          </Card>

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
                        const help = q.help || QUESTION_HELP[q.id];
                        return (
                          <div key={q.id} className="rounded-lg border bg-background p-3">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="flex-1 min-w-[240px]">
                                <div className="flex items-start gap-1.5">
                                  <p className="text-sm font-medium">{q.text}</p>
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
                                        {q.reference && <p className="mt-2 text-[11px] text-muted-foreground/80">Référence : {q.reference}</p>}
                                      </PopoverContent>
                                    </Popover>
                                  )}
                                </div>
                                {q.reference && <p className="mt-0.5 text-xs text-muted-foreground">{q.reference}</p>}
                              </div>
                              <Badge variant="outline">{levelMeta(r.level)?.label || r.level}</Badge>
                            </div>
                            {(r.comment || r.recommendation || r.evidence) && (
                              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                                {r.comment && <p><span className="font-medium text-foreground">Constat :</span> {r.comment}</p>}
                                {r.recommendation && <p><span className="font-medium text-foreground">Recommandation :</span> {r.recommendation}</p>}
                                {r.evidence && <p><span className="font-medium text-foreground">Preuves :</span> {r.evidence}</p>}
                              </div>
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
        </>
      )}
    </div>
  );
}
