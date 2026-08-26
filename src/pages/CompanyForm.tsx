import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ArrowLeft, Save, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { WEEKDAYS } from "@/lib/workingDays";
import { toast } from "sonner";

const empty = {
  name: "", siret: "", legal_form: "", sector: "", size: "", employees_count: "",
  address: "", postal_code: "", city: "", country: "France", website: "",
  contact_name: "", contact_email: "", contact_phone: "", contact_role: "",
  has_dpo: false, dpo_name: "", dpo_email: "", dpo_phone: "", dpo_external: false,
  has_representative: false, representative_name: "", notes: "",
  closed_weekdays: [0, 6] as number[], closed_dates: [] as string[],
};

export default function CompanyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const editing = id && id !== "nouveau";
  const [form, setForm] = useState<any>(empty);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = editing ? "Modifier entreprise | Audit RGPD" : "Nouvelle entreprise | Audit RGPD";
    if (editing) {
      supabase.from("companies").select("*").eq("id", id).single().then(({ data }) => {
        if (data) setForm({
          ...data,
          employees_count: data.employees_count ?? "",
          closed_weekdays: data.closed_weekdays ?? [0, 6],
          closed_dates: data.closed_dates ?? [],
        });
      });
    }
  }, [id, editing]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Le nom est requis"); return; }
    setLoading(true);
    const payload = {
      ...form,
      employees_count: form.employees_count ? Number(form.employees_count) : null,
      owner_id: user!.id,
    };
    if (editing) {
      const { error } = await supabase.from("companies").update(payload).eq("id", id);
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Entreprise mise à jour");
      navigate(`/entreprises/${id}`);
    } else {
      const { data, error } = await supabase.from("companies").insert(payload).select().single();
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Entreprise créée");
      navigate(`/entreprises/${data.id}`);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" />Retour</Button>
      <PageHeader title={editing ? "Modifier l'entreprise" : "Nouvelle entreprise"} icon={Building2} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="border-2">
          <CardHeader><CardTitle>Identification</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2"><Label>Raison sociale *</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} required maxLength={200} /></div>
            <div className="space-y-1.5"><Label>SIRET</Label><Input value={form.siret} onChange={(e) => set("siret", e.target.value)} maxLength={14} /></div>
            <div className="space-y-1.5"><Label>Forme juridique</Label><Input value={form.legal_form} onChange={(e) => set("legal_form", e.target.value)} placeholder="SAS, SARL, ..." /></div>
            <div className="space-y-1.5"><Label>Secteur d'activité</Label><Input value={form.sector} onChange={(e) => set("sector", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Taille</Label><Input value={form.size} onChange={(e) => set("size", e.target.value)} placeholder="TPE / PME / ETI / GE" /></div>
            <div className="space-y-1.5"><Label>Effectif</Label><Input type="number" value={form.employees_count} onChange={(e) => set("employees_count", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Site web</Label><Input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://..." /></div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader><CardTitle>Adresse</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2"><Label>Adresse</Label><Input value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Code postal</Label><Input value={form.postal_code} onChange={(e) => set("postal_code", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Ville</Label><Input value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Pays</Label><Input value={form.country} onChange={(e) => set("country", e.target.value)} /></div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader><CardTitle>Contact principal</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5"><Label>Nom du contact</Label><Input value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Fonction</Label><Input value={form.contact_role} onChange={(e) => set("contact_role", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Téléphone</Label><Input value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} /></div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader><CardTitle>Délégué à la Protection des Données (DPO)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3"><Switch checked={form.has_dpo} onCheckedChange={(v) => set("has_dpo", v)} /><Label>L'entreprise a désigné un DPO</Label></div>
            {form.has_dpo && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5"><Label>Nom du DPO</Label><Input value={form.dpo_name} onChange={(e) => set("dpo_name", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Email DPO</Label><Input type="email" value={form.dpo_email} onChange={(e) => set("dpo_email", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Téléphone DPO</Label><Input value={form.dpo_phone} onChange={(e) => set("dpo_phone", e.target.value)} /></div>
                <div className="flex items-center gap-3"><Switch checked={form.dpo_external} onCheckedChange={(v) => set("dpo_external", v)} /><Label>DPO externe / mutualisé</Label></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader><CardTitle>Jours de fermeture</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Jours de fermeture hebdomadaires</Label>
              <div className="mt-2 flex flex-wrap gap-3">
                {WEEKDAYS.map((d) => (
                  <label key={d.value} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={(form.closed_weekdays || []).includes(d.value)}
                      onCheckedChange={(v) => set("closed_weekdays",
                        v ? [...(form.closed_weekdays || []), d.value] : (form.closed_weekdays || []).filter((x: number) => x !== d.value))}
                    />
                    {d.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Fermetures exceptionnelles (congés, jours fériés)</Label>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Input type="date" value={newClosedDate} onChange={(e) => setNewClosedDate(e.target.value)} className="w-44" />
                <Button type="button" variant="outline" onClick={() => {
                  if (!newClosedDate) return;
                  if (!(form.closed_dates || []).includes(newClosedDate)) set("closed_dates", [...(form.closed_dates || []), newClosedDate].sort());
                  setNewClosedDate("");
                }}>Ajouter</Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(form.closed_dates || []).map((d: string) => (
                  <Badge key={d} variant="secondary" className="gap-1">
                    {new Date(d).toLocaleDateString("fr-FR")}
                    <button type="button" aria-label="Retirer" onClick={() => set("closed_dates", (form.closed_dates || []).filter((x: string) => x !== d))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Ces jours sont exclus du calcul des délais lors de la planification des actions correctives.</p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent><Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={4} /></CardContent>
        </Card>


        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Annuler</Button>
          <Button type="submit" disabled={loading} className="bg-gradient-primary"><Save className="mr-2 h-4 w-4" />Enregistrer</Button>
        </div>
      </form>
    </div>
  );
}