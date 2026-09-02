import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  loadReferential, loadCompanyProfile, saveCompanyProfile, computeScope,
  type Referential, type CompanyProfile as Profile, type Tristate,
} from "@/lib/auditEngine";

const STEPS = ["Répondant", "Secteur d'activité", "Données traitées", "Pratiques & outils", "Périmètre"];

export default function CompanyProfilePage() {
  const { id: companyId } = useParams();
  const navigate = useNavigate();
  const [ref, setRef] = useState<Referential | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [meta, setMeta] = useState({ respondent_name: "", respondent_role: "", headcount: "" });
  const [profile, setProfile] = useState<Profile>({
    primary_sector_id: null, secondary_sector_ids: [], subsector_ids: [], answers: {},
  });

  useEffect(() => {
    document.title = "Assistant de profilage | RGPD";
    (async () => {
      const [r, c, p] = await Promise.all([
        loadReferential(),
        supabase.from("companies").select("id, name, sector, employees_count").eq("id", companyId!).maybeSingle(),
        loadCompanyProfile(companyId!),
      ]);
      setRef(r);
      setCompany(c.data);
      if (p) setProfile(p);
      if (c.data?.employees_count) setMeta((m) => ({ ...m, headcount: String(c.data.employees_count) }));
    })();
  }, [companyId]);

  const subsectors = useMemo(() => {
    if (!ref) return [];
    const ids = new Set([profile.primary_sector_id, ...profile.secondary_sector_ids].filter(Boolean) as string[]);
    return ref.subsectors.filter((s) => ids.has(s.sector_id));
  }, [ref, profile.primary_sector_id, profile.secondary_sector_ids]);

  const scope = useMemo(() => (ref ? computeScope(ref, profile) : null), [ref, profile]);

  const setAnswer = (code: string, value: Tristate) =>
    setProfile((p) => ({ ...p, answers: { ...p.answers, [code]: value } }));

  const questionsOf = (s: number) =>
    (ref?.activationQuestions || [])
      .filter((q) => q.step === s)
      .map((q) => ({ q, module: ref!.modules.find((m) => m.id === q.module_id)! }))
      .filter((x) => x.module);

  const submit = async () => {
    setSaving(true);
    try {
      await saveCompanyProfile(companyId!, profile, {
        respondent_name: meta.respondent_name || undefined,
        respondent_role: meta.respondent_role || undefined,
        headcount: meta.headcount ? Number(meta.headcount) : null,
      });
      toast.success("Profil enregistré — le questionnaire sera adapté à cette organisation");
      navigate(`/entreprises/${companyId}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!ref) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const TristateRow = ({ code, text, help }: { code: string; text: string; help: string | null }) => {
    const value = profile.answers[code] ?? "inconnu";
    return (
      <div className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium">{text}</p>
          {help && <p className="text-xs text-muted-foreground">{help}</p>}
        </div>
        <div className="flex shrink-0 gap-1">
          {(["oui", "non", "inconnu"] as Tristate[]).map((v) => (
            <Button
              key={v}
              type="button"
              size="sm"
              variant={value === v ? "default" : "outline"}
              className={value === v ? "bg-gradient-primary" : ""}
              onClick={() => setAnswer(code, v)}
            >
              {v === "inconnu" ? "Je ne sais pas" : v === "oui" ? "Oui" : "Non"}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Assistant de profilage"
        description={company ? `Adapter le questionnaire RGPD à « ${company.name} »` : "Adapter le questionnaire RGPD"}
        icon={Wand2}
      />

      <div className="mb-6">
        <div className="mb-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
          {STEPS.map((s, i) => (
            <span key={s} className={i === step ? "font-semibold text-foreground" : ""}>
              {i + 1}. {s}
            </span>
          ))}
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">{STEPS[step]}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Nom du répondant</Label><Input value={meta.respondent_name} onChange={(e) => setMeta({ ...meta, respondent_name: e.target.value })} /></div>
              <div><Label>Fonction</Label><Input value={meta.respondent_role} onChange={(e) => setMeta({ ...meta, respondent_role: e.target.value })} /></div>
              <div><Label>Effectif</Label><Input type="number" value={meta.headcount} onChange={(e) => setMeta({ ...meta, headcount: e.target.value })} /></div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <Label>Secteur principal *</Label>
                  <AddSectorDialog
                    mode="sector"
                    sectors={ref.sectors}
                    onCreated={async (id) => {
                      const r = await loadReferential();
                      setRef(r);
                      setProfile((p) => ({ ...p, primary_sector_id: id }));
                    }}
                  />
                </div>
                <Select
                  value={profile.primary_sector_id ?? ""}
                  onValueChange={(v) => setProfile({ ...profile, primary_sector_id: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Choisir un secteur..." /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {ref.sectors.filter((s) => s.code !== "SOCLE_COMMUN").map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">Activités secondaires</Label>
                <div className="grid max-h-64 gap-2 overflow-y-auto rounded-lg border p-3 sm:grid-cols-2">
                  {ref.sectors
                    .filter((s) => s.code !== "SOCLE_COMMUN" && s.id !== profile.primary_sector_id)
                    .map((s) => {
                      const checked = profile.secondary_sector_ids.includes(s.id);
                      return (
                        <label key={s.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) =>
                              setProfile((p) => ({
                                ...p,
                                secondary_sector_ids: c
                                  ? [...p.secondary_sector_ids, s.id]
                                  : p.secondary_sector_ids.filter((x) => x !== s.id),
                              }))
                            }
                          />
                          <span className="truncate">{s.label}</span>
                        </label>
                      );
                    })}
                </div>
              </div>
              {subsectors.length > 0 && (
                <div>
                  <Label className="mb-2 block">Spécialités</Label>
                  <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
                    {subsectors.map((s) => (
                      <label key={s.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={profile.subsector_ids.includes(s.id)}
                          onCheckedChange={(c) =>
                            setProfile((p) => ({
                              ...p,
                              subsector_ids: c ? [...p.subsector_ids, s.id] : p.subsector_ids.filter((x) => x !== s.id),
                            }))
                          }
                        />
                        <span className="truncate">{s.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              {questionsOf(3).map(({ q, module }) => (
                <TristateRow key={q.id} code={module.code} text={q.text} help={q.help} />
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2">
              {questionsOf(4).map(({ q, module }) => (
                <TristateRow key={q.id} code={module.code} text={q.text} help={q.help} />
              ))}
            </div>
          )}

          {step === 4 && scope && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <p className="text-2xl font-bold text-primary">{scope.questions.filter((q) => q.included).length}</p>
                  <p className="text-xs text-muted-foreground">questions applicables</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-2xl font-bold text-muted-foreground">{scope.questions.filter((q) => !q.included).length}</p>
                  <p className="text-xs text-muted-foreground">questions écartées</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-2xl font-bold">{scope.includedModules.length}</p>
                  <p className="text-xs text-muted-foreground">modules retenus</p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Modules retenus</p>
                <div className="flex flex-wrap gap-1.5">
                  {scope.includedModules.map((m) => (
                    <Badge key={m.code} variant="secondary" title={m.reason}>{m.label}</Badge>
                  ))}
                </div>
              </div>
              {scope.excludedModules.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">Modules écartés</p>
                  <div className="flex flex-wrap gap-1.5">
                    {scope.excludedModules.map((m) => (
                      <Badge key={m.code} variant="outline" className="text-muted-foreground" title={m.reason}>{m.label}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 flex justify-between gap-2">
        <Button variant="outline" onClick={() => (step === 0 ? navigate(-1) : setStep(step - 1))}>
          <ArrowLeft className="mr-2 h-4 w-4" />{step === 0 ? "Annuler" : "Précédent"}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            className="bg-gradient-primary"
            onClick={() => {
              if (step === 1 && !profile.primary_sector_id) return toast.error("Sélectionnez le secteur principal");
              setStep(step + 1);
            }}
          >
            Suivant<ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button className="bg-gradient-primary" onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Enregistrer le profil
          </Button>
        )}
      </div>
    </div>
  );
}
