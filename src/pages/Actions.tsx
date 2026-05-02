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
import { ListChecks, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ACTION_STATUS_META, PRIORITY_META } from "@/data/rgpdReferential";

export default function Actions() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const preselect = params.get("company");
  const [companies, setCompanies] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState(preselect || "");
  const [actions, setActions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ title: "", description: "", priority: "moyenne", status: "a_faire", responsible: "", due_date: "" });

  useEffect(() => { document.title = "Plan d'actions | RGPD"; supabase.from("companies").select("id, name").order("name").then(({ data }) => setCompanies(data || [])); }, []);
  useEffect(() => {
    if (!companyId) return setActions([]);
    supabase.from("action_plans").select("*").eq("company_id", companyId).order("due_date", { ascending: true, nullsFirst: false }).then(({ data }) => setActions(data || []));
  }, [companyId]);

  const create = async () => {
    if (!companyId || !form.title) { toast.error("Entreprise et titre requis"); return; }
    const { error } = await supabase.from("action_plans").insert({
      company_id: companyId, owner_id: user!.id, ...form, due_date: form.due_date || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Action ajoutée"); setOpen(false); setForm({ title: "", description: "", priority: "moyenne", status: "a_faire", responsible: "", due_date: "" });
    const { data } = await supabase.from("action_plans").select("*").eq("company_id", companyId);
    setActions(data || []);
  };

  const update = async (id: string, patch: any) => {
    await supabase.from("action_plans").update(patch).eq("id", id);
    setActions((a) => a.map((x) => x.id === id ? { ...x, ...patch } : x));
  };
  const remove = async (id: string) => {
    await supabase.from("action_plans").delete().eq("id", id);
    setActions((a) => a.filter((x) => x.id !== id));
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Plan d'actions" description="Suivi des actions correctives" icon={ListChecks} />

      <Card className="mb-4 border-2"><CardContent className="flex flex-wrap items-center gap-3 p-4">
        <Label>Entreprise :</Label>
        <Select value={companyId} onValueChange={setCompanyId}>
          <SelectTrigger className="w-72"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
          <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        <div className="flex-1" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button disabled={!companyId} className="bg-gradient-primary"><Plus className="mr-2 h-4 w-4" />Nouvelle action</Button></DialogTrigger>
          <DialogContent>
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

      {!companyId ? <p className="text-center text-muted-foreground">Sélectionnez une entreprise.</p> :
        actions.length === 0 ? <p className="text-center text-muted-foreground py-8">Aucune action.</p> :
        <div className="space-y-2">
          {actions.map((a) => (
            <Card key={a.id} className="border-2">
              <CardContent className="flex flex-wrap items-start gap-3 p-4">
                <div className="flex-1 min-w-[240px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{a.title}</span>
                    <Badge variant="outline">{PRIORITY_META[a.priority as keyof typeof PRIORITY_META]?.label}</Badge>
                  </div>
                  {a.description && <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>}
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {a.responsible && <span>👤 {a.responsible}</span>}
                    {a.due_date && <span>📅 {new Date(a.due_date).toLocaleDateString("fr-FR")}</span>}
                    {a.category && <span>🏷️ {a.category}</span>}
                  </div>
                </div>
                <Select value={a.status} onValueChange={(v) => update(a.id, { status: v, completed_at: v === "fait" ? new Date().toISOString() : null })}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(ACTION_STATUS_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
                <Button variant="ghost" size="icon" onClick={() => remove(a.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      }
    </div>
  );
}