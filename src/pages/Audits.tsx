import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ClipboardCheck, Plus, Calendar, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AUDIT_STATUS_META } from "@/data/rgpdReferential";

export default function Audits() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [audits, setAudits] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ company_id: "", title: "", description: "", scope: "" });

  useEffect(() => { document.title = "Audits | RGPD"; load(); }, []);

  async function load() {
    const [a, c] = await Promise.all([
      supabase.from("audits").select("*, companies(name)").order("updated_at", { ascending: false }),
      supabase.from("companies").select("id, name").order("name"),
    ]);
    setAudits(a.data || []); setCompanies(c.data || []);
  }

  const create = async () => {
    if (!form.company_id || !form.title) { toast.error("Entreprise et titre requis"); return; }
    const { data, error } = await supabase.from("audits").insert({
      ...form, owner_id: user!.id, status: "draft",
      start_date: new Date().toISOString().slice(0, 10),
    }).select().single();
    if (error) return toast.error(error.message);
    const { data: prof } = await supabase
      .from("company_profiles").select("completed_at").eq("company_id", form.company_id).maybeSingle();
    if (prof?.completed_at) {
      try {
        const scope = await generateAuditScope(data.id, form.company_id);
        toast.success(`Audit créé — ${scope.questions.filter((q) => q.included).length} questions applicables`);
      } catch (e: any) {
        toast.error(`Périmètre non généré : ${e.message}`);
      }
    } else {
      toast.info("Astuce : lancez l'assistant de profilage de l'entreprise pour adapter le questionnaire");
    }
    setOpen(false);
    navigate(`/audits/${data.id}`);
  };

  const removeAudit = async (auditId: string) => {
    const { error } = await supabase.from("audits").delete().eq("id", auditId);
    if (error) return toast.error(error.message);
    toast.success("Audit supprimé");
    setAudits((s) => s.filter((a) => a.id !== auditId));
  };


  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Audits RGPD"
        description="Suivez tous vos audits du brouillon au rapport final"
        icon={ClipboardCheck}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-gradient-primary"><Plus className="mr-2 h-4 w-4" />Nouvel audit</Button></DialogTrigger>
            <DialogContent className="w-[calc(100vw-2rem)] max-w-lg">
              <DialogHeader>
                <DialogTitle>Démarrer un nouvel audit</DialogTitle>
                <DialogDescription>Sélectionnez l'entreprise concernée</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div><Label>Entreprise *</Label>
                  <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                    <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Titre *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Audit RGPD initial 2026" /></div>
                <div><Label>Périmètre</Label><Input value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} placeholder="Ex: Tout l'organisme" /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                <Button onClick={create} className="bg-gradient-primary">Créer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {audits.length === 0 ? (
        <Card className="border-2 border-dashed"><CardContent className="flex flex-col items-center justify-center py-12">
          <ClipboardCheck className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-3 text-muted-foreground">Aucun audit démarré</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {audits.map((a) => (
            <div key={a.id} className="relative">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="absolute right-2 top-2 z-10 h-8 w-8 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer cet audit ?</AlertDialogTitle>
                    <AlertDialogDescription>« {a.title} » et toutes ses réponses seront définitivement supprimés.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={() => removeAudit(a.id)} className="bg-destructive">Supprimer</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Link to={`/audits/${a.id}`}>
                <Card className="h-full border-2 transition-smooth hover:shadow-elegant hover:-translate-y-0.5">
                  <CardContent className="p-5">
                    <div className="mb-2 flex items-start justify-between gap-2 pr-8">
                      <Badge variant="outline">{AUDIT_STATUS_META[a.status as keyof typeof AUDIT_STATUS_META]?.label}</Badge>
                      {a.global_score != null && <span className="text-xl font-bold text-phoenix">{a.global_score}%</span>}
                    </div>
                    <h3 className="font-semibold leading-tight">{a.title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.companies?.name}</p>
                    {a.global_score != null && <Progress value={a.global_score} className="mt-3 h-1.5" />}
                    {a.start_date && <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" />Débuté le {new Date(a.start_date).toLocaleDateString("fr-FR")}</div>}
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>

      )}
    </div>
  );
}