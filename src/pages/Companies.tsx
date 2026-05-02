import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Search, Mail, MapPin, Shield } from "lucide-react";

export default function Companies() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<any[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => { document.title = "Entreprises | Audit RGPD"; load(); }, []);

  async function load() {
    const { data } = await supabase.from("companies").select("*").order("created_at", { ascending: false });
    setCompanies(data || []);
  }

  const filtered = companies.filter((c) =>
    [c.name, c.city, c.sector, c.siret].filter(Boolean).join(" ").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Entreprises"
        description="Vos clients audités"
        icon={Building2}
        actions={<Button onClick={() => navigate("/entreprises/nouveau")} className="bg-gradient-primary"><Plus className="mr-2 h-4 w-4" />Nouvelle entreprise</Button>}
      />

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Rechercher par nom, ville, secteur, SIRET..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-3 text-muted-foreground">Aucune entreprise enregistrée</p>
            <Button onClick={() => navigate("/entreprises/nouveau")} className="mt-4 bg-gradient-primary">Ajouter ma première entreprise</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Link key={c.id} to={`/entreprises/${c.id}`}>
              <Card className="h-full border-2 transition-smooth hover:shadow-elegant hover:-translate-y-0.5">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-tight">{c.name}</h3>
                    {c.has_dpo && <Badge variant="secondary" className="shrink-0"><Shield className="mr-1 h-3 w-3" />DPO</Badge>}
                  </div>
                  {c.sector && <p className="mt-1 text-xs text-muted-foreground">{c.sector}{c.size ? ` · ${c.size}` : ""}</p>}
                  <div className="mt-3 space-y-1 text-sm">
                    {c.city && <div className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{c.city}</div>}
                    {c.contact_email && <div className="flex items-center gap-1.5 text-muted-foreground truncate"><Mail className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{c.contact_email}</span></div>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}