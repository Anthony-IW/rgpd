import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2, ArrowLeft, Edit, Plus, ClipboardCheck, FileText, ListChecks, Trash2,
  Handshake, FileQuestion, TriangleAlert, CheckCircle, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { AUDIT_STATUS_META } from "@/data/rgpdReferential";
import { ExportMenu } from "@/components/ExportMenu";
import { CompanyClientsCard } from "@/components/CompanyClientsCard";
import { exportCompanySheetXLSX } from "@/lib/exports/excelExport";
import { printTablePDF } from "@/lib/exports/pdfTable";
import { fmtDate } from "@/lib/exports/exportHelpers";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [company, setCompany] = useState<any>(null);
  const [audits, setAudits] = useState<any[]>([]);
  const [processing, setProcessing] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    document.title = "Entreprise | Audit RGPD";
    (async () => {
      const { data } = await supabase.from("companies").select("*").eq("id", id).single();
      setCompany(data);
      const [a, p, ac] = await Promise.all([
        supabase.from("audits").select("*").eq("company_id", id).order("created_at", { ascending: false }),
        supabase.from("processing_records").select("*").eq("company_id", id),
        supabase.from("action_plans").select("*").eq("company_id", id),
      ]);
      setAudits(a.data || []); setProcessing(p.data || []); setActions(ac.data || []);
    })();
  }, [id]);

  const createAudit = async () => {
    const { data, error } = await supabase.from("audits").insert({
      company_id: id, owner_id: user!.id,
      title: `Audit RGPD ${new Date().toLocaleDateString("fr-FR")}`,
      status: "draft", start_date: new Date().toISOString().slice(0, 10),
    }).select().single();
    if (error) return toast.error(error.message);
    toast.success("Audit créé");
    navigate(`/audits/${data.id}`);
  };

  const deleteCompany = async () => {
    const { error } = await supabase.from("companies").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Entreprise supprimée");
    navigate("/entreprises");
  };

  const exportPdf = () => {
    if (!company) return;
    printTablePDF({
      title: `Fiche entreprise - ${company.name}`,
      subtitle: [company.sector, company.city].filter(Boolean).join(" · "),
      columns: ["Audit", "Statut", "Score", "Début", "Fin"],
      rows: audits.map((a) => [
        a.title,
        AUDIT_STATUS_META[a.status as keyof typeof AUDIT_STATUS_META]?.label,
        a.global_score != null ? `${a.global_score}%` : "",
        fmtDate(a.start_date), fmtDate(a.completed_at),
      ]),
    });
  };

  if (!company) return null;

  return (
    <div className="mx-auto max-w-6xl">
      <Button variant="ghost" onClick={() => navigate("/entreprises")} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" />Entreprises</Button>
      <PageHeader
        title={company.name}
        description={[company.sector, company.size, company.city].filter(Boolean).join(" · ")}
        icon={Building2}
        actions={
          <>
            <ExportMenu onPdf={exportPdf} onExcel={() => exportCompanySheetXLSX(company, audits, processing, actions)} />
            <Button variant="outline" onClick={() => navigate(`/entreprises/${id}/edit`)}><Edit className="mr-2 h-4 w-4" />Modifier</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer cette entreprise ?</AlertDialogTitle>
                  <AlertDialogDescription>Cette action est irréversible. Tous les audits, traitements et actions associés seront supprimés.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteCompany} className="bg-destructive">Supprimer</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={createAudit} className="bg-gradient-primary"><Plus className="mr-2 h-4 w-4" />Nouvel audit</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-2">
          <CardHeader><CardTitle className="text-base">Identification</CardTitle></CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {company.siret && <Row label="SIRET" value={company.siret} />}
            {company.legal_form && <Row label="Forme" value={company.legal_form} />}
            {company.employees_count && <Row label="Effectif" value={company.employees_count} />}
            {company.website && <Row label="Site" value={company.website} />}
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardHeader><CardTitle className="text-base">Contact</CardTitle></CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {company.contact_name && <Row label="Nom" value={company.contact_name} />}
            {company.contact_role && <Row label="Fonction" value={company.contact_role} />}
            {company.contact_email && <Row label="Email" value={company.contact_email} />}
            {company.contact_phone && <Row label="Tél." value={company.contact_phone} />}
            {(company.address || company.city) && <Row label="Adresse" value={[company.address, company.postal_code, company.city, company.country].filter(Boolean).join(", ")} />}
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardHeader><CardTitle className="text-base">DPO</CardTitle></CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {!company.has_dpo ? <p className="text-muted-foreground">Aucun DPO désigné</p> : (<>
              {company.dpo_name && <Row label="Nom" value={company.dpo_name} />}
              {company.dpo_email && <Row label="Email" value={company.dpo_email} />}
              {company.dpo_phone && <Row label="Tél." value={company.dpo_phone} />}
              {company.dpo_external && <Badge variant="secondary">DPO externe</Badge>}
            </>)}
          </CardContent>
        </Card>
      </div>

      {company.notes && (
        <Card className="mt-4 border-2"><CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader><CardContent className="whitespace-pre-wrap text-sm">{company.notes}</CardContent></Card>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="h-4 w-4 text-primary" />Audits ({audits.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {audits.length === 0 ? <p className="text-sm text-muted-foreground">Aucun audit</p> : (
              <div className="space-y-1.5">
                {audits.map((a) => (
                  <Link key={a.id} to={`/audits/${a.id}`} className="block rounded-md border p-2.5 text-sm transition-smooth hover:bg-muted/50">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{a.title}</span>
                      {a.global_score != null && <span className="font-bold text-primary">{a.global_score}%</span>}
                    </div>
                    <Badge variant="outline" className="mt-1 text-[10px]">{AUDIT_STATUS_META[a.status as keyof typeof AUDIT_STATUS_META]?.label}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4 text-primary" />Traitements ({processing.length})</CardTitle></CardHeader>
          <CardContent>
            {processing.length === 0 ? <p className="text-sm text-muted-foreground">Aucun traitement</p> :
              <ul className="space-y-1 text-sm">{processing.slice(0, 5).map((p) => <li key={p.id} className="truncate">• {p.name}</li>)}</ul>
            }
            <Button variant="link" size="sm" onClick={() => navigate(`/registre?company=${id}`)} className="px-0">Gérer →</Button>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ListChecks className="h-4 w-4 text-primary" />Actions ({actions.length})</CardTitle></CardHeader>
          <CardContent>
            {actions.length === 0 ? <p className="text-sm text-muted-foreground">Aucune action</p> :
              <ul className="space-y-1 text-sm">{actions.slice(0, 5).map((a) => <li key={a.id} className="truncate">• {a.title}</li>)}</ul>
            }
            <Button variant="link" size="sm" onClick={() => navigate(`/actions?company=${id}`)} className="px-0">Gérer →</Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-2">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Handshake className="h-4 w-4 text-primary" />Sous-traitants</CardTitle></CardHeader>
          <CardContent><Button variant="link" size="sm" onClick={() => navigate(`/sous-traitants?company=${id}`)} className="px-0">Gérer →</Button></CardContent>
        </Card>
        <Card className="border-2">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileQuestion className="h-4 w-4 text-primary" />Demandes de droits</CardTitle></CardHeader>
          <CardContent><Button variant="link" size="sm" onClick={() => navigate(`/droits?company=${id}`)} className="px-0">Gérer →</Button></CardContent>
        </Card>
        <Card className="border-2">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><TriangleAlert className="h-4 w-4 text-primary" />Violations</CardTitle></CardHeader>
          <CardContent><Button variant="link" size="sm" onClick={() => navigate(`/violations?company=${id}`)} className="px-0">Gérer →</Button></CardContent>
        </Card>
        <Card className="border-2">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CheckCircle className="h-4 w-4 text-primary" />Consentements</CardTitle></CardHeader>
          <CardContent><Button variant="link" size="sm" onClick={() => navigate(`/consentements?company=${id}`)} className="px-0">Gérer →</Button></CardContent>
        </Card>
        <Card className="border-2">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4 text-primary" />DPIA</CardTitle></CardHeader>
          <CardContent><Button variant="link" size="sm" onClick={() => navigate(`/dpia?company=${id}`)} className="px-0">Gérer →</Button></CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <CompanyClientsCard companyId={id!} />
      </div>
    </div>
  );
}

const Row = ({ label, value }: { label: string; value: any }) => (
  <div className="flex justify-between gap-3"><span className="text-muted-foreground">{label}</span><span className="text-right font-medium">{value}</span></div>
);