import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Sector } from "@/lib/auditEngine";

const slug = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40);

interface Props {
  mode: "sector" | "subsector";
  sectors: Sector[];
  defaultSectorId?: string | null;
  onCreated: (id: string) => void | Promise<void>;
}

export function AddSectorDialog({ mode, sectors, defaultSectorId, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState("");
  const [sectorId, setSectorId] = useState(defaultSectorId ?? "");

  const isSub = mode === "subsector";

  const submit = async () => {
    if (!label.trim()) return toast.error("Le libellé est requis");
    if (isSub && !sectorId) return toast.error("Choisissez le secteur de rattachement");
    setSaving(true);
    try {
      const table = isSub ? "subsectors" : "sectors";
      const { data: last } = await supabase.from(table).select("position").order("position", { ascending: false }).limit(1).maybeSingle();
      const payload: any = {
        code: `${slug(label)}_${Date.now().toString(36).toUpperCase().slice(-4)}`,
        label: label.trim(),
        position: (last?.position ?? 0) + 1,
      };
      if (isSub) payload.sector_id = sectorId;
      const { data, error } = await supabase.from(table).insert(payload).select("id").single();
      if (error) throw error;
      toast.success(isSub ? "Spécialité ajoutée" : "Secteur ajouté");
      setLabel("");
      setOpen(false);
      await onCreated(data.id);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <Plus className="mr-1 h-3.5 w-3.5" />{isSub ? "Nouvelle spécialité" : "Nouveau secteur"}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
        <DialogHeader>
          <DialogTitle>{isSub ? "Ajouter une spécialité" : "Ajouter un secteur"}</DialogTitle>
          <DialogDescription>Cet élément est enregistré et réutilisable pour les prochains profilages.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          {isSub && (
            <div><Label>Secteur de rattachement *</Label>
              <Select value={sectorId} onValueChange={setSectorId}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {sectors.filter((s) => s.code !== "SOCLE_COMMUN").map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div><Label>Libellé *</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={isSub ? "Ex: Cabinet dentaire" : "Ex: Coworking"} />
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
