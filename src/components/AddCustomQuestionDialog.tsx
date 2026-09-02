import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LEGAL_STATUS_LABELS, type LegalStatus } from "@/lib/auditScoring";

const RISKS = [
  { value: "faible", label: "Faible" },
  { value: "moyen", label: "Moyen" },
  { value: "eleve", label: "Élevé" },
  { value: "critique", label: "Critique" },
];

const slug = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40);

interface Props {
  auditId: string;
  categories: { id: string; name: string }[];
  onAdded: () => void | Promise<void>;
}

export function AddCustomQuestionDialog({ auditId, categories, onAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newSection, setNewSection] = useState(false);
  const [form, setForm] = useState({
    category_id: categories[0]?.id ?? "",
    category_name: "",
    text: "",
    help: "",
    legal_reference: "",
    legal_status: "OBLIGATOIRE" as LegalStatus,
    risk: "moyen",
    weight: "3",
    keepInReferential: true,
  });

  const submit = async () => {
    const catName = newSection ? form.category_name.trim() : categories.find((c) => c.id === form.category_id)?.name ?? "";
    const catId = newSection ? slug(form.category_name) : form.category_id;
    if (!form.text.trim()) return toast.error("Le texte de la question est requis");
    if (!catId) return toast.error("Choisissez ou créez une section");

    setSaving(true);
    try {
      const code = `CUSTOM_${Date.now().toString(36).toUpperCase()}`;
      const base = {
        question_code: code,
        category_id: catId,
        category_name: catName || catId,
        text: form.text.trim(),
        help: form.help.trim() || null,
        legal_reference: form.legal_reference.trim() || null,
        legal_status: form.legal_status,
        applicability_condition: null as string | null,
        risk: form.risk as any,
        weight: Number(form.weight) || 1,
      };

      const { data: last } = await supabase
        .from("audit_questions_snapshot").select("position").eq("audit_id", auditId)
        .order("position", { ascending: false }).limit(1).maybeSingle();

      const { error } = await supabase.from("audit_questions_snapshot").insert({
        ...base,
        audit_id: auditId,
        included: true,
        inclusion_reason: "Question ajoutée manuellement par l'auditeur",
        exclusion_reason: null,
        position: (last?.position ?? 0) + 1,
      });
      if (error) throw error;

      if (form.keepInReferential) {
        const { data: lastQ } = await supabase
          .from("ref_questions").select("position").order("position", { ascending: false }).limit(1).maybeSingle();
        const { error: e2 } = await supabase.from("ref_questions").insert({
          code,
          category_id: base.category_id,
          category_name: base.category_name,
          text: base.text,
          help: base.help,
          legal_reference: base.legal_reference,
          legal_status: base.legal_status,
          applicability_condition: null,
          risk: base.risk,
          weight: base.weight,
          is_core: true,
          needs_review: false,
          recommendations: [],
          position: (lastQ?.position ?? 0) + 1,
        });
        if (e2) toast.warning(`Question ajoutée à l'audit, mais pas au référentiel : ${e2.message}`);
      }

      toast.success("Question ajoutée");
      setForm({ ...form, text: "", help: "", legal_reference: "" });
      setOpen(false);
      await onAdded();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Plus className="mr-2 h-4 w-4" />Ajouter une question</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter une question personnalisée</DialogTitle>
          <DialogDescription>Elle sera ajoutée à la section choisie de cet audit.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="flex items-center gap-2">
            <Checkbox id="newsec" checked={newSection} onCheckedChange={(c) => setNewSection(!!c)} />
            <Label htmlFor="newsec" className="text-sm font-normal">Créer une nouvelle section</Label>
          </div>
          {newSection ? (
            <div><Label>Nom de la section *</Label>
              <Input value={form.category_name} onChange={(e) => setForm({ ...form, category_name: e.target.value })} placeholder="Ex: Spécificités métier" />
            </div>
          ) : (
            <div><Label>Section *</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div><Label>Question *</Label>
            <Textarea rows={2} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
          </div>
          <div><Label>Aide / explication</Label>
            <Textarea rows={2} value={form.help} onChange={(e) => setForm({ ...form, help: e.target.value })} />
          </div>
          <div><Label>Référence légale</Label>
            <Input value={form.legal_reference} onChange={(e) => setForm({ ...form, legal_reference: e.target.value })} placeholder="Ex: Art. 32 RGPD" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div><Label>Statut</Label>
              <Select value={form.legal_status} onValueChange={(v) => setForm({ ...form, legal_status: v as LegalStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(LEGAL_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Risque</Label>
              <Select value={form.risk} onValueChange={(v) => setForm({ ...form, risk: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RISKS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Poids</Label>
              <Input type="number" min={1} max={10} value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="keepref" checked={form.keepInReferential} onCheckedChange={(c) => setForm({ ...form, keepInReferential: !!c })} />
            <Label htmlFor="keepref" className="text-sm font-normal">Conserver dans le référentiel (audits futurs)</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={submit} disabled={saving} className="bg-gradient-primary">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
