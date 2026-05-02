import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ClipboardCheck, ListChecks, FileText, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AUDIT_STATUS_META } from "@/data/rgpdReferential";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ companies: 0, audits: 0, actions: 0, processing: 0, avgScore: 0 });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => { document.title = "Tableau de bord | Audit RGPD"; }, []);

  useEffect(() => {
    (async () => {
      const [c, a, ac, pr] = await Promise.all([
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("audits").select("id, global_score", { count: "exact" }),
        supabase.from("action_plans").select("id", { count: "exact", head: true }).neq("status", "fait"),
        supabase.from("processing_records").select("id", { count: "exact", head: true }),
      ]);
      const scores = (a.data || []).map((x: any) => x.global_score).filter((s: any) => s != null);
      const avg = scores.length ? Math.round(scores.reduce((s: number, v: number) => s + v, 0) / scores.length) : 0;
      setStats({
        companies: c.count ?? 0, audits: a.count ?? 0, actions: ac.count ?? 0, processing: pr.count ?? 0, avgScore: avg,
      });
      const { data } = await supabase
        .from("audits")
        .select("id, title, status, global_score, updated_at, companies(name)")
        .order("updated_at", { ascending: false })
        .limit(5);
      setRecent(data || []);
    })();
  }, []);

  const cards = [
    { label: "Entreprises", value: stats.companies, icon: Building2, color: "from-primary to-primary-glow" },
    { label: "Audits", value: stats.audits, icon: ClipboardCheck, color: "from-secondary to-info" },
    { label: "Traitements", value: stats.processing, icon: FileText, color: "from-accent to-warning" },
    { label: "Actions ouvertes", value: stats.actions, icon: ListChecks, color: "from-destructive to-accent" },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de votre activité d'audit RGPD"
        icon={Sparkles}
        actions={<Button onClick={() => navigate("/entreprises/nouveau")} className="bg-gradient-primary">Nouvelle entreprise</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="overflow-hidden border-2 transition-smooth hover:shadow-elegant">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{c.label}</p>
                  <p className="mt-2 text-3xl font-bold">{c.value}</p>
                </div>
                <div className={`rounded-xl bg-gradient-to-br ${c.color} p-2.5 shadow-glow`}>
                  <c.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-primary" />Audits récents</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucun audit pour l'instant. <Button variant="link" onClick={() => navigate("/audits")} className="px-1">Démarrer un audit</Button>
              </p>
            ) : (
              <div className="divide-y">
                {recent.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => navigate(`/audits/${a.id}`)}
                    className="flex w-full items-center justify-between gap-3 py-3 text-left transition-smooth hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{a.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.companies?.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {a.global_score != null && <span className="text-sm font-bold text-primary">{a.global_score}%</span>}
                      <Badge variant="outline">{AUDIT_STATUS_META[a.status as keyof typeof AUDIT_STATUS_META]?.label}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 bg-gradient-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Score moyen</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="relative">
              <div className="text-6xl font-bold text-phoenix">{stats.avgScore}%</div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Conformité RGPD moyenne</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}