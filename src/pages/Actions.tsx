import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ListChecks, Plus, Trash2, Hourglass, Check, X, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { ACTION_STATUS_META, PRIORITY_META } from "@/data/rgpdReferential";
import { ExportMenu } from "@/components/ExportMenu";
import { exportActionsXLSX } from "@/lib/exports/excelExport";
import { printTablePDF } from "@/lib/exports/pdfTable";
import { fmtDate } from "@/lib/exports/exportHelpers";
import { ActionAttachments } from "@/components/ActionAttachments";
import { Checkbox } from "@/components/ui/checkbox";
import { addWorkingDays, nextOpenDay, toISODate } from "@/lib/workingDays";
import { addDays } from "date-fns";

export default function Actions() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const preselectCompany = params.get("company");
  const preselectAudit = params.get("audit");
  const [companies, setCompanies] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState(preselectCompany || "");
  const [audits, setAudits] = useState<any[]>([]);
  const [auditId, setAuditId] = useState(preselectAudit || "");
  const [actions, setActions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ title: "", description: "", priority: "moyenne", status: "a_faire", responsible: "", due_date: "" });

  const [selected, setSelected] = useState<string[]>([]);
  const [planOpen, setPlanOpen] = useState(false);
  const [plan, setPlan] = useState<{ start: string; days: string; chain: boolean }>({
    start: toISODate(new Date()), days: "5", chain: false,
  });

  useEffect(() => { document.title = "Plan d'actions | RGPD"; supabase.from("companies").select("id, name, closed_weekdays, closed_dates").order("name").then(({ data }) => setCompanies(data || [])); }, []);


  useEffect(() => {
    if (!companyId) { setAudits([]); setAuditId(""); return; }
    supabase.from("audits").select("id, title, start_date").eq("company_id", companyId).order("created_at", { ascending: false }).then(({ data }) => {
      const list = data || [];
      setAudits(list);
      // Conserve l'audit pré-sélectionné s'il appartient bien à cette entreprise
      const stillValid = list.some((a: any) => a.id === auditId);
      if (!stillValid) setAuditId(list[0]?.id || "");
    });
  }, [companyId]);

  useEffect(() => {
    if (!companyId || !auditId) return setActions([]);
    setSelected([]);
    supabase.from("action_plans").select("*").eq("company_id", companyId).eq("audit_id", auditId).order("due_date", { ascending: true, nullsFirst: false }).then(({ data }) => setActions(data || []));
  }, [companyId, auditId]);

  const company = companies.find((c) => c.id === companyId);

  const toggleSelect = (id: string) =>
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  const openPlanner = (ids: string[]) => {
    setSelected(ids);
    setPlan((p) => ({ ...p, start: toISODate(nextOpenDay(new Date(), company)) }));
    setPlanOpen(true);
  };

  const schedule = async () => {
    const days = Math.max(1, Number(plan.days) || 1);
    const list = actions.filter((a) => selected.includes(a.id));
    if (!list.length) return toast.error("Aucune action sélectionnée");
    let cursor = nextOpenDay(new Date(`${plan.start}T00:00:00`), company);

    const events: any[] = [];
    const updates: { id: string; due: string }[] = [];
    for (const a of list) {
      const start = nextOpenDay(cursor, company);
      const end = addWorkingDays(start, days, company);
      events.push(
        { company_id: companyId, owner_id: user!.id, title: `Début : ${a.title}`, all_day: true, start_at: new Date(`${toISODate(start)}T08:00:00`).toISOString(), color: "#3B82F6", related_action_id: a.id },
        { company_id: companyId, owner_id: user!.id, title: `Fin : ${a.title}`, all_day: true, start_at: new Date(`${toISODate(end)}T17:00:00`).toISOString(), color: "#EF4444", related_action_id: a.id },
      );
      updates.push({ id: a.id, due: toISODate(end) });
      if (plan.chain) cursor = nextOpenDay(addDays(end, 1), company);
    }

    // Nettoyer les anciens jalons de ces actions
    await supabase.from("calendar_events").delete().in("related_action_id", list.map((a) => a.id));
    const { error } = await supabase.from("calendar_events").insert(events);
    if (error) return toast.error(error.message);
    await Promise.all(updates.map((u) => supabase.from("action_plans").update({ due_date: u.due }).eq("id", u.id)));
    setActions((prev) => prev.map((a) => {
      const u = updates.find((x) => x.id === a.id);
      return u ? { ...a, due_date: u.due } : a;
    }));
    toast.success(`${list.length} action(s) planifiée(s) dans le calendrier`);
    setPlanOpen(false); setSelected([]);
  };


  const onChangeCompany = (id: string) => {
    setCompanyId(id);
    const next = new URLSearchParams(params);
    if (id) next.set("company", id); else next.delete("company");
    next.delete("audit");
    setParams(next, { replace: true });
  };

  const onChangeAudit = (id: string) => {
    setAuditId(id);
    const next = new URLSearchParams(params);
    if (id) next.set("audit", id); else next.delete("audit");
    setParams(next, { replace: true });
  };

  const create = async () => {
    if (!companyId || !auditId || !form.title) { toast.error("Entreprise, audit et titre requis"); return; }
    const { error } = await supabase.from("action_plans").insert({
      company_id: companyId, audit_id: auditId, owner_id: user!.id, ...form, due_date: form.due_date || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Action ajoutée"); setOpen(false); setForm({ title: "", description: "", priority: "moyenne", status: "a_faire", responsible: "", due_date: "" });
    const { data } = await supabase.from("action_plans").select("*").eq("company_id", companyId).eq("audit_id", auditId);
    setActions(data || []);
  };

  const update = async (id: string, patch: any) => {
    await supabase.from("action_plans").update(patch).eq("id", id);
    setActions((a) => a.map((x) => x.id === id ? { ...x, ...patch } : x));
  };

  const approve = async (a: any) => {
    await supabase.from("action_plans").update({
      status: a.pending_status,
      pending_status: null, pending_comment: null, pending_submitted_by: null, pending_submitted_at: null,
      validated_by: user!.id, validated_at: new Date().toISOString(), validation_note: null,
      completed_at: a.pending_status === "conforme" ? new Date().toISOString() : null,
    }).eq("id", a.id);
    toast.success("Validation acceptée");
    const { data } = await supabase.from("action_plans").select("*").eq("company_id", companyId).eq("audit_id", auditId);
    setActions(data || []);
  };
  const reject = async (a: any) => {
    const note = prompt("Motif du refus (optionnel) :") ?? "";
    await supabase.from("action_plans").update({
      pending_status: null, pending_comment: null, pending_submitted_by: null, pending_submitted_at: null,
      validated_by: user!.id, validated_at: new Date().toISOString(), validation_note: note || "Refusée",
    }).eq("id", a.id);
    toast.info("Demande refusée");
    const { data } = await supabase.from("action_plans").select("*").eq("company_id", companyId).eq("audit_id", auditId);
    setActions(data || []);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("action_plans").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setActions((a) => a.filter((x) => x.id !== id));
    toast.success("Action supprimée");
  };

  const selectedCompany = companies.find((x) => x.id === companyId);
  const selectedAudit = audits.find((x) => x.id === auditId);
  const exportSubtitle = [selectedCompany?.name, selectedAudit?.title].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Plan d'actions"
        description="Suivi des actions correctives par audit"
        icon={ListChecks}
        actions={
          <ExportMenu
            disabled={actions.length === 0}
            onPdf={() => {
              printTablePDF({
                title: "Plan d'actions RGPD",
                subtitle: exportSubtitle,
                columns: ["Titre", "Description", "Priorité", "Statut", "Responsable", "Échéance"],
                rows: actions.map((a) => [
                  a.title, a.description,
                  PRIORITY_META[a.priority as keyof typeof PRIORITY_META]?.label,
                  ACTION_STATUS_META[a.status as keyof typeof ACTION_STATUS_META]?.label,
                  a.responsible, fmtDate(a.due_date),
                ]),
              });
            }}
            onExcel={() => exportActionsXLSX(actions, exportSubtitle)}
          />
        }
      />

      <Card className="mb-4 border-2"><CardContent className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 p-4">
        <div className="flex flex-col gap-1.5 w-full sm:w-auto sm:flex-1 min-w-[240px]">
          <Label>Entreprise :</Label>
          <Select value={companyId} onValueChange={onChangeCompany}>
            <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
            <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5 w-full sm:w-auto sm:flex-1 min-w-[240px]">
          <Label>Audit :</Label>
          <Select value={auditId} onValueChange={onChangeAudit} disabled={!companyId || audits.length === 0}>
            <SelectTrigger><SelectValue placeholder={companyId ? (audits.length ? "Sélectionner..." : "Aucun audit") : "Choisir une entreprise"} /></SelectTrigger>
            <SelectContent>{audits.map((a) => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="hidden sm:block sm:flex-1" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button disabled={!companyId || !auditId} className="bg-gradient-primary w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" />Nouvelle action</Button></DialogTrigger>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-lg">
            <DialogHeader><DialogTitle>Nouvelle action</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div><Label>Titre *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
              <div className="grid gap-3 md:grid-cols-2">
                <div><Label>Priorité</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(PRIORITY_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Échéance</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
                <div><Label>Responsable</Label><Input value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button onClick={create} className="bg-gradient-primary">Ajouter</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent></Card>

      {actions.length > 0 && (
        <Card className="mb-4 border-2 border-dashed">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selected.length === actions.length && actions.length > 0}
                onCheckedChange={(v) => setSelected(v ? actions.map((a) => a.id) : [])}
              />
              Tout sélectionner
            </label>
            <span className="text-sm text-muted-foreground">{selected.length} action(s) sélectionnée(s)</span>
            <div className="sm:ml-auto">
              <Button disabled={selected.length === 0} onClick={() => openPlanner(selected)} className="w-full bg-gradient-primary sm:w-auto">
                <CalendarPlus className="mr-2 h-4 w-4" />Planifier dans le calendrier
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={planOpen} onOpenChange={setPlanOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg">
          <DialogHeader><DialogTitle>Planifier {selected.length} action(s)</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>Date de début</Label><Input type="date" value={plan.start} onChange={(e) => setPlan({ ...plan, start: e.target.value })} /></div>
              <div><Label>Jours ouvrés par action</Label><Input type="number" min={1} value={plan.days} onChange={(e) => setPlan({ ...plan, days: e.target.value })} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={plan.chain} onCheckedChange={(v) => setPlan({ ...plan, chain: !!v })} />
              Enchaîner les actions (sinon toutes démarrent le même jour, en parallèle)
            </label>
            <p className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
              Par défaut, toutes les actions sélectionnées démarrent à la date choisie et durent le même nombre de jours ouvrés.
              Seuls les jours d'ouverture de l'entreprise sont comptés (fiche entreprise).
              Deux repères sont créés : « Début : … » et « Fin : … ».
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanOpen(false)}>Annuler</Button>
            <Button onClick={schedule} className="bg-gradient-primary">Planifier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {!companyId ? <p className="text-center text-muted-foreground">Sélectionnez une entreprise.</p> :
        audits.length === 0 ? <p className="text-center text-muted-foreground py-8">Aucun audit pour cette entreprise.</p> :
        !auditId ? <p className="text-center text-muted-foreground py-8">Sélectionnez un audit.</p> :
        actions.length === 0 ? <p className="text-center text-muted-foreground py-8">Aucune action.</p> :
        <div className="space-y-2">
          {actions.map((a) => (
            <Card key={a.id} className="border-2">
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <Checkbox className="mt-1" checked={selected.includes(a.id)} onCheckedChange={() => toggleSelect(a.id)} aria-label="Sélectionner l'action" />
                  <div className="flex-1 min-w-[240px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{a.title}</span>
                      <Button size="sm" variant="ghost" className="h-6 px-1.5 text-xs" onClick={() => openPlanner([a.id])} title="Planifier cette action">
                        <CalendarPlus className="h-3.5 w-3.5" />
                      </Button>
                      <Badge variant="outline">{PRIORITY_META[a.priority as keyof typeof PRIORITY_META]?.label}</Badge>
                      {a.pending_status && (
                        <Badge className="bg-warning text-warning-foreground"><Hourglass className="mr-1 h-3 w-3" />Validation demandée : {ACTION_STATUS_META[a.pending_status as keyof typeof ACTION_STATUS_META]?.label}</Badge>
                      )}
                    </div>
                    {a.description && <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>}
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {a.responsible && <span>👤 {a.responsible}</span>}
                      {a.due_date && <span>📅 {new Date(a.due_date).toLocaleDateString("fr-FR")}</span>}
                      {a.category && <span>🏷️ {a.category}</span>}
                    </div>
                    {a.pending_comment && (
                      <p className="mt-2 rounded border-l-2 border-warning bg-warning/5 p-2 text-xs italic">Commentaire client : « {a.pending_comment} »</p>
                    )}
                  </div>
                  {a.pending_status ? (
                    <div className="flex gap-1.5">
                      <Button size="sm" onClick={() => approve(a)} className="bg-success text-success-foreground hover:bg-success/90"><Check className="mr-1 h-4 w-4" />Valider</Button>
                      <Button size="sm" variant="outline" onClick={() => reject(a)} className="text-destructive"><X className="mr-1 h-4 w-4" />Refuser</Button>
                    </div>
                  ) : (
                    <Select value={a.status} onValueChange={(v) => update(a.id, { status: v, completed_at: (v === "fait" || v === "conforme") ? new Date().toISOString() : null })}>
                      <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(ACTION_STATUS_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive" aria-label="Supprimer l'action"><Trash2 className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette action ?</AlertDialogTitle>
                        <AlertDialogDescription>« {a.title} » sera définitivement supprimée du plan d'actions, ainsi que ses pièces jointes.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(a.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <ActionAttachments actionId={a.id} companyId={a.company_id} />
              </CardContent>
            </Card>
          ))}
        </div>
      }
    </div>
  );
}
