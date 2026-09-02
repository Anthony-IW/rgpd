import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Library, Plus, Pencil, Archive, GitBranch, Rocket, Search } from "lucide-react";
import { toast } from "sonner";
import { LEGAL_STATUS_LABELS, LEGAL_STATUS_CLASS, type LegalStatus } from "@/lib/auditScoring";

const RISKS = [
  { value: "faible", label: "Faible" },
  { value: "moyen", label: "Moyen" },
  { value: "eleve", label: "Élevé" },
  { value: "critique", label: "Critique" },
];

type Question = {
  id: string;
  code: string;
  category_id: string;
  category_name: string | null;
  text: string;
  help: string | null;
  legal_reference: string | null;
  legal_status: LegalStatus;
  applicability_condition: string | null;
  risk: string;
  weight: number;
  is_core: boolean;
  needs_review: boolean;
  position: number;
};

const emptyQuestion = (): Partial<Question> => ({
  code: "",
  category_id: "",
  category_name: "",
  text: "",
  help: "",
  legal_reference: "",
  legal_status: "RECOMMANDE",
  applicability_condition: "",
  risk: "moyen",
  weight: 1,
  is_core: false,
  needs_review: false,
  position: 999,
});

export default function Referential() {
  const { isAdmin, isAuditor, loading, user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [qSectors, setQSectors] = useState<Record<string, string[]>>({});
  const [qModules, setQModules] = useState<Record<string, string[]>>({});
  const [search, setSearch] = useState("");
  const [fCategory, setFCategory] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [fSector, setFSector] = useState("all");
  const [fModule, setFModule] = useState("all");
  const [onlyReview, setOnlyReview] = useState(false);
  const [editing, setEditing] = useState<Partial<Question> | null>(null);
  const [editSectors, setEditSectors] = useState<string[]>([]);
  const [editModules, setEditModules] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [newVersion, setNewVersion] = useState("");

  useEffect(() => { document.title = "Référentiel | Audit RGPD"; }, []);

  const load = async () => {
    const [q, s, m, v, qs, qm] = await Promise.all([
      supabase.from("ref_questions").select("*").is("archived_at", null).order("position"),
      supabase.from("sectors").select("id,code,label,position").is("archived_at", null).order("position"),
      supabase.from("functional_modules").select("id,code,label,description,position").is("archived_at", null).order("position"),
      supabase.from("questionnaire_versions").select("*").order("number", { ascending: false }),
      supabase.from("question_sectors").select("question_id,sector_id"),
      supabase.from("question_modules").select("question_id,module_id"),
    ]);
    setQuestions((q.data as any) || []);
    setSectors(s.data || []);
    setModules(m.data || []);
    setVersions(v.data || []);
    const gs: Record<string, string[]> = {};
    (qs.data || []).forEach((r: any) => (gs[r.question_id] ||= []).push(r.sector_id));
    const gm: Record<string, string[]> = {};
    (qm.data || []).forEach((r: any) => (gm[r.question_id] ||= []).push(r.module_id));
    setQSectors(gs);
    setQModules(gm);
  };

  useEffect(() => { if (!loading && (isAdmin || isAuditor)) load(); }, [loading, isAdmin, isAuditor]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    questions.forEach((q) => map.set(q.category_id, q.category_name || q.category_id));
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [questions]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return questions.filter((q) => {
      if (term && !`${q.code} ${q.text} ${q.legal_reference ?? ""}`.toLowerCase().includes(term)) return false;
      if (fCategory !== "all" && q.category_id !== fCategory) return false;
      if (fStatus !== "all" && q.legal_status !== fStatus) return false;
      if (fSector !== "all" && !(qSectors[q.id] || []).includes(fSector)) return false;
      if (fModule !== "all" && !(qModules[q.id] || []).includes(fModule)) return false;
      if (onlyReview && !q.needs_review) return false;
      return true;
    });
  }, [questions, search, fCategory, fStatus, fSector, fModule, onlyReview, qSectors, qModules]);

  const openEdit = (q?: Question) => {
    setEditing(q ? { ...q } : emptyQuestion());
    setEditSectors(q ? qSectors[q.id] || [] : []);
    setEditModules(q ? qModules[q.id] || [] : []);
  };

  const toggle = (list: string[], id: string, set: (v: string[]) => void) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const saveQuestion = async () => {
    if (!editing) return;
    if (!editing.code?.trim() || !editing.text?.trim() || !editing.category_id?.trim()) {
      return toast.error("Code, domaine et libellé sont obligatoires");
    }
    setSaving(true);
    try {
      const payload: any = {
        code: editing.code.trim(),
        category_id: editing.category_id.trim(),
        category_name: editing.category_name || editing.category_id,
        text: editing.text.trim(),
        help: editing.help || null,
        legal_reference: editing.legal_reference || null,
        legal_status: editing.legal_status,
        applicability_condition: editing.applicability_condition || null,
        risk: editing.risk,
        weight: Number(editing.weight) || 1,
        is_core: !!editing.is_core,
        needs_review: !!editing.needs_review,
        position: Number(editing.position) || 999,
        updated_by: user?.id ?? null,
      };
      let questionId = editing.id;
      if (questionId) {
        const { error } = await supabase.from("ref_questions").update(payload).eq("id", questionId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("ref_questions")
          .insert({ ...payload, created_by: user?.id ?? null })
          .select("id")
          .single();
        if (error) throw error;
        questionId = data.id;
      }

      await Promise.all([
        supabase.from("question_sectors").delete().eq("question_id", questionId!),
        supabase.from("question_modules").delete().eq("question_id", questionId!),
      ]);
      if (editSectors.length) {
        const { error } = await supabase.from("question_sectors")
          .insert(editSectors.map((sector_id) => ({ question_id: questionId!, sector_id })));
        if (error) throw error;
      }
      if (editModules.length) {
        const { error } = await supabase.from("question_modules")
          .insert(editModules.map((module_id) => ({ question_id: questionId!, module_id })));
        if (error) throw error;
      }
      toast.success("Question enregistrée");
      setEditing(null);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const archiveQuestion = async (q: Question) => {
    const { error } = await supabase.from("ref_questions")
      .update({ archived_at: new Date().toISOString() }).eq("id", q.id);
    if (error) return toast.error(error.message);
    toast.success("Question archivée");
    load();
  };

  const createVersion = async () => {
    const next = (versions[0]?.number ?? 0) + 1;
    const { error } = await supabase.from("questionnaire_versions")
      .insert({ number: next, label: newVersion.trim() || `Version ${next}` });
    if (error) return toast.error(error.message);
    setNewVersion("");
    toast.success(`Version ${next} créée (brouillon)`);
    load();
  };

  const publishVersion = async (v: any) => {
    const { error } = await supabase.from("questionnaire_versions")
      .update({ published_at: new Date().toISOString(), published_by: user?.id ?? null })
      .eq("id", v.id);
    if (error) return toast.error(error.message);
    toast.success(`Version ${v.number} publiée`);
    load();
  };

  if (loading) return null;
  if (!isAdmin && !isAuditor) {
    return <p className="p-6 text-muted-foreground">Accès réservé aux auditeurs.</p>;
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Référentiel dynamique"
        description={`${questions.length} questions actives · ${sectors.length} secteurs · ${modules.length} modules`}
        icon={Library}
        actions={
          isAdmin ? (
            <Button className="bg-gradient-primary" onClick={() => openEdit()}>
              <Plus className="mr-2 h-4 w-4" />Nouvelle question
            </Button>
          ) : undefined
        }
      />

      <Tabs defaultValue="questions" className="mt-4">
        <TabsList className="flex w-full flex-wrap justify-start">
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="scope">Secteurs &amp; modules</TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="mt-4 space-y-4">
          <Card>
            <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={fCategory} onValueChange={setFCategory}>
                <SelectTrigger><SelectValue placeholder="Domaine" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les domaines</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={fStatus} onValueChange={setFStatus}>
                <SelectTrigger><SelectValue placeholder="Statut légal" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {Object.entries(LEGAL_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={fSector} onValueChange={setFSector}>
                <SelectTrigger><SelectValue placeholder="Secteur" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les secteurs</SelectItem>
                  {sectors.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={fModule} onValueChange={setFModule}>
                <SelectTrigger><SelectValue placeholder="Module" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les modules</SelectItem>
                  {modules.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Switch id="review" checked={onlyReview} onCheckedChange={setOnlyReview} />
                <Label htmlFor="review" className="text-sm">À revoir uniquement</Label>
              </div>
            </CardContent>
          </Card>

          <p className="text-sm text-muted-foreground">{filtered.length} question(s)</p>

          <div className="space-y-3">
            {filtered.map((q) => (
              <Card key={q.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[10px]">{q.code}</Badge>
                      <Badge variant="outline" className={LEGAL_STATUS_CLASS[q.legal_status]}>
                        {LEGAL_STATUS_LABELS[q.legal_status]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {q.category_name || q.category_id} · risque {q.risk} · poids {q.weight}
                      </span>
                      {q.is_core && <Badge variant="secondary" className="text-[10px]">Socle</Badge>}
                      {q.needs_review && <Badge className="bg-amber-500/15 text-amber-700 text-[10px]">À revoir</Badge>}
                    </div>
                    <p className="text-sm">{q.text}</p>
                    <p className="text-xs text-muted-foreground">
                      {(qSectors[q.id] || []).length
                        ? `Secteurs : ${(qSectors[q.id] || []).map((id) => sectors.find((s) => s.id === id)?.label).filter(Boolean).join(", ")}`
                        : "Secteurs : tous"}
                      {" · "}
                      {(qModules[q.id] || []).length
                        ? `Modules : ${(qModules[q.id] || []).map((id) => modules.find((m) => m.id === id)?.label).filter(Boolean).join(", ")}`
                        : "Modules : aucun (socle)"}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex shrink-0 gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(q)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                            <Archive className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Archiver cette question ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Elle ne sera plus proposée dans les nouveaux audits. Les audits existants conservent leur périmètre figé.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive" onClick={() => archiveQuestion(q)}>Archiver</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="versions" className="mt-4 space-y-4">
          {isAdmin && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Nouvelle version</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row">
                <Input placeholder={`Libellé (ex. Version ${(versions[0]?.number ?? 0) + 1} — mise à jour CNIL)`}
                  value={newVersion} onChange={(e) => setNewVersion(e.target.value)} />
                <Button onClick={createVersion} className="bg-gradient-primary">
                  <GitBranch className="mr-2 h-4 w-4" />Créer
                </Button>
              </CardContent>
            </Card>
          )}
          <div className="space-y-3">
            {versions.map((v) => (
              <Card key={v.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">Version {v.number} — {v.label || "sans libellé"}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.published_at
                        ? `Publiée le ${new Date(v.published_at).toLocaleDateString("fr-FR")}`
                        : "Brouillon — non utilisée pour figer les périmètres"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={v.published_at ? "default" : "outline"}>
                      {v.published_at ? "Publiée" : "Brouillon"}
                    </Badge>
                    {isAdmin && !v.published_at && (
                      <Button size="sm" variant="outline" onClick={() => publishVersion(v)}>
                        <Rocket className="mr-2 h-4 w-4" />Publier
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {!versions.length && <p className="text-sm text-muted-foreground">Aucune version enregistrée.</p>}
          </div>
        </TabsContent>

        <TabsContent value="scope" className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Secteurs ({sectors.length})</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="h-[420px] pr-3">
                <ul className="space-y-2 text-sm">
                  {sectors.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2 border-b pb-1">
                      <span>{s.label}</span>
                      <Badge variant="outline" className="font-mono text-[10px]">{s.code}</Badge>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Modules fonctionnels ({modules.length})</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="h-[420px] pr-3">
                <ul className="space-y-2 text-sm">
                  {modules.map((m) => (
                    <li key={m.id} className="border-b pb-1">
                      <div className="flex items-center justify-between gap-2">
                        <span>{m.label}</span>
                        <Badge variant="outline" className="font-mono text-[10px]">{m.code}</Badge>
                      </div>
                      {m.description && <p className="text-xs text-muted-foreground">{m.description}</p>}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Modifier la question" : "Nouvelle question"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label>Code</Label>
                  <Input value={editing.code || ""} onChange={(e) => setEditing({ ...editing, code: e.target.value })} />
                </div>
                <div>
                  <Label>Identifiant du domaine</Label>
                  <Input value={editing.category_id || ""} onChange={(e) => setEditing({ ...editing, category_id: e.target.value })} />
                </div>
                <div>
                  <Label>Nom du domaine</Label>
                  <Input value={editing.category_name || ""} onChange={(e) => setEditing({ ...editing, category_name: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Libellé de l'exigence</Label>
                <Textarea rows={2} value={editing.text || ""} onChange={(e) => setEditing({ ...editing, text: e.target.value })} />
              </div>
              <div>
                <Label>Aide contextuelle</Label>
                <Textarea rows={3} value={editing.help || ""} onChange={(e) => setEditing({ ...editing, help: e.target.value })} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Référence légale</Label>
                  <Input value={editing.legal_reference || ""} onChange={(e) => setEditing({ ...editing, legal_reference: e.target.value })} />
                </div>
                <div>
                  <Label>Condition d'applicabilité</Label>
                  <Input value={editing.applicability_condition || ""} onChange={(e) => setEditing({ ...editing, applicability_condition: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="sm:col-span-2">
                  <Label>Statut légal</Label>
                  <Select value={editing.legal_status} onValueChange={(v) => setEditing({ ...editing, legal_status: v as LegalStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(LEGAL_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Risque</Label>
                  <Select value={editing.risk} onValueChange={(v) => setEditing({ ...editing, risk: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RISKS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Poids</Label>
                  <Input type="number" min={1} value={editing.weight ?? 1}
                    onChange={(e) => setEditing({ ...editing, weight: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={!!editing.is_core} onCheckedChange={(v) => setEditing({ ...editing, is_core: v })} />
                  <Label className="text-sm">Question du socle commun</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={!!editing.needs_review} onCheckedChange={(v) => setEditing({ ...editing, needs_review: v })} />
                  <Label className="text-sm">À revoir</Label>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="mb-2 block">Secteurs ciblés <span className="text-xs text-muted-foreground">(aucun = tous)</span></Label>
                  <ScrollArea className="h-48 rounded-md border p-2">
                    {sectors.map((s) => (
                      <label key={s.id} className="flex items-start gap-2 py-1 text-sm">
                        <Checkbox checked={editSectors.includes(s.id)}
                          onCheckedChange={() => toggle(editSectors, s.id, setEditSectors)} />
                        <span>{s.label}</span>
                      </label>
                    ))}
                  </ScrollArea>
                </div>
                <div>
                  <Label className="mb-2 block">Modules déclencheurs <span className="text-xs text-muted-foreground">(aucun = socle)</span></Label>
                  <ScrollArea className="h-48 rounded-md border p-2">
                    {modules.map((m) => (
                      <label key={m.id} className="flex items-start gap-2 py-1 text-sm">
                        <Checkbox checked={editModules.includes(m.id)}
                          onCheckedChange={() => toggle(editModules, m.id, setEditModules)} />
                        <span>{m.label}</span>
                      </label>
                    ))}
                  </ScrollArea>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
            <Button onClick={saveQuestion} disabled={saving} className="bg-gradient-primary">Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
