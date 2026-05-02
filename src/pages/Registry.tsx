import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { LEGAL_BASIS_LABELS } from "@/data/rgpdReferential";
import { ExportMenu } from "@/components/ExportMenu";
import { exportRegistryXLSX } from "@/lib/exports/excelExport";
import { printTablePDF } from "@/lib/exports/pdfTable";
import { fmtBool, joinList } from "@/lib/exports/exportHelpers";

const empty = {
  name: "", purpose: "", legal_basis: "", legal_basis_details: "",
  data_categories: "", sensitive_data: false, sensitive_data_details: "",
  data_subjects: "", recipients: "", subcontractors: "",
  retention_period: "", retention_justification: "",
  international_transfer: false, transfer_countries: "", transfer_safeguards: "",
  security_measures: "", dpia_required: false, dpia_completed: false, source: "", notes: "",
};

export default function Registry() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const preselect = params.get("company");
  const [companies, setCompanies] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState<string>(preselect || "");
  const [records, setRecords] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(empty);

  useEffect(() => { document.title = "Registre | RGPD"; supabase.from("companies").select("id, name").order("name").then(({ data }) => setCompanies(data || [])); }, []);

  useEffect(() => {
    if (!companyId) { setRecords([]); return; }
    supabase.from("processing_records").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).then(({ data }) => setRecords(data || []));
  }, [companyId]);

  const splitCsv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

  const create = async () => {
    if (!companyId || !form.name || !form.purpose) { toast.error("Entreprise, nom et finalité requis"); return; }
    const { error } = await supabase.from("processing_records").insert({
      company_id: companyId, owner_id: user!.id,
      name: form.name, purpose: form.purpose,
      legal_basis: form.legal_basis || null,
      legal_basis_details: form.legal_basis_details,
      data_categories: splitCsv(form.data_categories),
      sensitive_data: form.sensitive_data,
      sensitive_data_details: form.sensitive_data_details,
      data_subjects: splitCsv(form.data_subjects),
      recipients: splitCsv(form.recipients),
      subcontractors: splitCsv(form.subcontractors),
      retention_period: form.retention_period,
      retention_justification: form.retention_justification,
      international_transfer: form.international_transfer,
      transfer_countries: splitCsv(form.transfer_countries),
      transfer_safeguards: form.transfer_safeguards,
      security_measures: form.security_measures,
      dpia_required: form.dpia_required,
      dpia_completed: form.dpia_completed,
      source: form.source, notes: form.notes,
    });
    if (error) return toast.error(error.message);
    toast.success("Traitement ajouté"); setOpen(false); setForm(empty);
    const { data } = await supabase.from("processing_records").select("*").eq("company_id", companyId).order("created_at", { ascending: false });
    setRecords(data || []);
  };

  const remove = async (id: string) => {
    await supabase.from("processing_records").delete().eq("id", id);
    setRecords((r) => r.filter((x) => x.id !== id));
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Registre des traitements"
        description="Article 30 du RGPD"
        icon={FileText}
        actions={
          <ExportMenu
            disabled={records.length === 0}
            onPdf={() => {
              const c = companies.find((x) => x.id === companyId);
              printTablePDF({
                title: "Registre des traitements (Art. 30)",
                subtitle: c?.name,
                columns: ["Nom", "Finalité", "Base légale", "Données", "Personnes", "Conservation", "Sensibles", "Hors UE", "AIPD"],
                rows: records.map((r) => [
                  r.name, r.purpose,
                  r.legal_basis ? LEGAL_BASIS_LABELS[r.legal_basis] : "",
                  joinList(r.data_categories), joinList(r.data_subjects),
                  r.retention_period, fmtBool(r.sensitive_data), fmtBool(r.international_transfer), fmtBool(r.dpia_required),
                ]),
              });
            }}
            onExcel={() => exportRegistryXLSX(records, companies.find((x) => x.id === companyId)?.name)}
          />
        }
      />

      <Card className="mb-4 border-2"><CardContent className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 p-4">
        <Label className="shrink-0">Entreprise :</Label>
        <Select value={companyId} onValueChange={setCompanyId}>
          <SelectTrigger className="w-full sm:w-72"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
          <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        <div className="hidden sm:block sm:flex-1" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button disabled={!companyId} className="bg-gradient-primary w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" />Nouveau traitement</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-3xl overflow-y-auto">
            <DialogHeader><DialogTitle>Nouveau traitement</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2 md:grid-cols-2">
              <div className="md:col-span-2"><Label>Nom *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Finalité *</Label><Textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} rows={2} /></div>
              <div><Label>Base légale</Label>
                <Select value={form.legal_basis} onValueChange={(v) => setForm({ ...form, legal_basis: v })}>
                  <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                  <SelectContent>{Object.entries(LEGAL_BASIS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Justificatif base légale</Label><Input value={form.legal_basis_details} onChange={(e) => setForm({ ...form, legal_basis_details: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Catégories de données (séparées par virgules)</Label><Input value={form.data_categories} onChange={(e) => setForm({ ...form, data_categories: e.target.value })} placeholder="Identité, contact, paiement..." /></div>
              <div className="md:col-span-2"><Label>Personnes concernées</Label><Input value={form.data_subjects} onChange={(e) => setForm({ ...form, data_subjects: e.target.value })} placeholder="Clients, prospects, salariés..." /></div>
              <div><Label>Destinataires</Label><Input value={form.recipients} onChange={(e) => setForm({ ...form, recipients: e.target.value })} /></div>
              <div><Label>Sous-traitants</Label><Input value={form.subcontractors} onChange={(e) => setForm({ ...form, subcontractors: e.target.value })} /></div>
              <div><Label>Durée de conservation</Label><Input value={form.retention_period} onChange={(e) => setForm({ ...form, retention_period: e.target.value })} placeholder="3 ans" /></div>
              <div><Label>Justification durée</Label><Input value={form.retention_justification} onChange={(e) => setForm({ ...form, retention_justification: e.target.value })} /></div>
              <div className="flex items-center gap-2"><Switch checked={form.sensitive_data} onCheckedChange={(v) => setForm({ ...form, sensitive_data: v })} /><Label>Données sensibles (Art. 9)</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.international_transfer} onCheckedChange={(v) => setForm({ ...form, international_transfer: v })} /><Label>Transfert hors UE</Label></div>
              {form.international_transfer && (
                <>
                  <div><Label>Pays destinataires</Label><Input value={form.transfer_countries} onChange={(e) => setForm({ ...form, transfer_countries: e.target.value })} /></div>
                  <div><Label>Garanties (CCT, BCR...)</Label><Input value={form.transfer_safeguards} onChange={(e) => setForm({ ...form, transfer_safeguards: e.target.value })} /></div>
                </>
              )}
              <div className="md:col-span-2"><Label>Mesures de sécurité</Label><Textarea value={form.security_measures} onChange={(e) => setForm({ ...form, security_measures: e.target.value })} rows={2} /></div>
              <div className="flex items-center gap-2"><Switch checked={form.dpia_required} onCheckedChange={(v) => setForm({ ...form, dpia_required: v })} /><Label>AIPD requise</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.dpia_completed} onCheckedChange={(v) => setForm({ ...form, dpia_completed: v })} /><Label>AIPD réalisée</Label></div>
              <div className="md:col-span-2"><Label>Source des données</Label><Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button onClick={create} className="bg-gradient-primary">Ajouter</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent></Card>

      {!companyId ? <p className="text-center text-muted-foreground">Sélectionnez une entreprise.</p> :
        records.length === 0 ? <p className="text-center text-muted-foreground py-8">Aucun traitement.</p> :
        <div className="space-y-3">
          {records.map((r) => (
            <Card key={r.id} className="border-2">
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{r.name}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{r.purpose}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(r.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm md:grid-cols-2">
                {r.legal_basis && <Field label="Base légale" value={LEGAL_BASIS_LABELS[r.legal_basis]} />}
                {r.retention_period && <Field label="Conservation" value={r.retention_period} />}
                {r.data_categories?.length > 0 && <Field label="Données" value={r.data_categories.join(", ")} />}
                {r.data_subjects?.length > 0 && <Field label="Personnes" value={r.data_subjects.join(", ")} />}
                {r.recipients?.length > 0 && <Field label="Destinataires" value={r.recipients.join(", ")} />}
                {r.subcontractors?.length > 0 && <Field label="Sous-traitants" value={r.subcontractors.join(", ")} />}
                <div className="flex flex-wrap gap-1 md:col-span-2">
                  {r.sensitive_data && <Badge variant="destructive">Données sensibles</Badge>}
                  {r.international_transfer && <Badge variant="secondary">Transfert hors UE</Badge>}
                  {r.dpia_required && <Badge variant={r.dpia_completed ? "default" : "outline"}>AIPD {r.dpia_completed ? "faite" : "requise"}</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      }
    </div>
  );
}

const Field = ({ label, value }: { label: string; value: any }) => (
  <div><span className="text-muted-foreground">{label} :</span> <span className="font-medium">{value}</span></div>
);