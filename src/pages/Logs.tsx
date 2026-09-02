import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollText, RefreshCw, LogIn, LogOut, Plus, Pencil, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

type LogRow = {
  id: string;
  actor_email: string | null;
  action: string;
  entity_type: string | null;
  entity_label: string | null;
  created_at: string;
};

const ENTITY_LABELS: Record<string, string> = {
  company: "Entreprise",
  audit: "Audit",
  action: "Action corrective",
  traitement: "Traitement",
  sous_traitant: "Sous-traitant",
  violation: "Violation",
  demande_droit: "Demande de droit",
  consentement: "Consentement",
  dpia: "DPIA",
  evenement: "Événement calendrier",
  document: "Document",
  question: "Question référentiel",
  acces_client: "Accès client",
  role_utilisateur: "Rôle utilisateur",
  session: "Session",
};

const VERB_LABELS: Record<string, string> = {
  created: "créé(e)",
  updated: "modifié(e)",
  deleted: "supprimé(e)",
};

function describe(log: LogRow) {
  if (log.action === "login") return "Connexion à l'application";
  if (log.action === "logout") return "Déconnexion";
  const [entity, verb] = log.action.split(".");
  return `${ENTITY_LABELS[entity] ?? entity} ${VERB_LABELS[verb] ?? verb}`;
}

function actionIcon(action: string) {
  if (action === "login") return <LogIn className="h-4 w-4 text-primary" />;
  if (action === "logout") return <LogOut className="h-4 w-4 text-muted-foreground" />;
  if (action.endsWith(".created")) return <Plus className="h-4 w-4 text-emerald-600" />;
  if (action.endsWith(".updated")) return <Pencil className="h-4 w-4 text-amber-600" />;
  if (action.endsWith(".deleted")) return <Trash2 className="h-4 w-4 text-destructive" />;
  return <ScrollText className="h-4 w-4" />;
}

export default function Logs() {
  const { isAdmin, loading } = useAuth();
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [entity, setEntity] = useState("all");
  const [verb, setVerb] = useState("all");

  useEffect(() => { document.title = "Logs d'activité | Audit RGPD"; }, []);

  const load = async () => {
    setBusy(true);
    const { data, error } = await supabase
      .from("activity_logs")
      .select("id, actor_email, action, entity_type, entity_label, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setLogs((data ?? []) as LogRow[]);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const filtered = useMemo(() => logs.filter((l) => {
    if (entity !== "all") {
      const e = l.action === "login" || l.action === "logout" ? "session" : l.entity_type;
      if (e !== entity) return false;
    }
    if (verb !== "all" && !l.action.endsWith(`.${verb}`)) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [l.actor_email, l.entity_label, describe(l)].some((v) => (v ?? "").toLowerCase().includes(q));
  }), [logs, search, entity, verb]);

  if (loading) return null;

  if (!isAdmin) {
    return (
      <div className="p-4 sm:p-6">
        <Card><CardContent className="flex items-center gap-3 p-6 text-muted-foreground">
          <ShieldAlert className="h-5 w-5" /> Accès réservé aux administrateurs.
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Logs d'activité"
        description="Connexions et actions réalisées dans l'application"
        actions={
          <Button variant="outline" size="sm" onClick={load} disabled={busy}>
            <RefreshCw className={`mr-2 h-4 w-4 ${busy ? "animate-spin" : ""}`} /> Actualiser
          </Button>
        }
      />

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
          <Input placeholder="Rechercher (utilisateur, élément...)" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={entity} onValueChange={setEntity}>
            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {Object.entries(ENTITY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={verb} onValueChange={setVerb}>
            <SelectTrigger><SelectValue placeholder="Action" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les actions</SelectItem>
              <SelectItem value="created">Créations</SelectItem>
              <SelectItem value="updated">Modifications</SelectItem>
              <SelectItem value="deleted">Suppressions</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Aucun événement enregistré.</p>
          ) : (
            <ul className="divide-y">
              {filtered.map((l) => (
                <li key={l.id} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 shrink-0">{actionIcon(l.action)}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{describe(l)}</p>
                      {l.entity_label && <p className="truncate text-xs text-muted-foreground">{l.entity_label}</p>}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 pl-7 sm:pl-0">
                    <Badge variant="secondary" className="max-w-[220px] truncate">{l.actor_email ?? "Système"}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(l.created_at).toLocaleString("fr-FR")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
