import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClipboardList, Hourglass, Check, X } from "lucide-react";
import { toast } from "sonner";
import { ACTION_STATUS_META, PRIORITY_META } from "@/data/rgpdReferential";
import { ExportMenu } from "@/components/ExportMenu";
import { exportActionsXLSX } from "@/lib/exports/excelExport";
import { printTablePDF } from "@/lib/exports/pdfTable";
import { fmtDate } from "@/lib/exports/exportHelpers";
import { ActionAttachments } from "@/components/ActionAttachments";

const NEEDS_VALIDATION = ["conforme", "non_applicable"];

export default function ClientActions() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [actions, setActions] = useState<any[]>([]);
  const [pendingDialog, setPendingDialog] = useState<{ action: any; status: string } | null>(null);
  const [comment, setComment] = useState("");

  useEffect(() => {
    document.title = "Mon plan d'actions | RGPD";
    (async () => {
      const { data } = await supabase.from("companies").select("id, name").order("name");
      setCompanies(data || []);
      if (data && data.length === 1) setCompanyId(data[0].id);
    })();
  }, []);

  const load = async () => {
    if (!companyId) return setActions([]);
    const { data } = await supabase.from("action_plans").select("*").eq("company_id", companyId).order("due_date", { ascending: true, nullsFirst: false });
    setActions(data || []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [companyId]);

  const onChangeStatus = async (action: any, newStatus: string) => {
    if (NEEDS_VALIDATION.includes(newStatus)) {
      setPendingDialog({ action, status: newStatus });
      setComment("");
      return;
    }
    const { error } = await supabase.from("action_plans").update({
      status: newStatus as any, pending_status: null, pending_comment: null, pending_submitted_by: null, pending_submitted_at: null,
    }).eq("id", action.id);
    if (error) return toast.error(error.message);
    toast.success("Statut mis à jour");
    load();
  };

  const submitValidation = async () => {
    if (!pendingDialog || !user) return;
    const { error } = await supabase.from("action_plans").update({
      pending_status: pendingDialog.status as any,
      pending_comment: comment,
      pending_submitted_by: user.id,
      pending_submitted_at: new Date().toISOString(),
    }).eq("id", pendingDialog.action.id);
    if (error) return toast.error(error.message);
    toast.success("Demande envoyée à l'auditeur pour validation");
    setPendingDialog(null);
    load();
  };

  const company = companies.find((c) => c.id === companyId);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Mon plan d'actions"
        description="Suivez et mettez à jour vos actions de mise en conformité"
        icon={ClipboardList}
        actions={
          <ExportMenu
            disabled={actions.length === 0}
            onPdf={() => printTablePDF({
              title: "Plan d'actions RGPD",
              subtitle: company?.name,
              columns: ["Titre", "Description", "Priorité", "Statut", "Échéance"],
              rows: actions.map((a) => [
                a.title, a.description,
                PRIORITY_META[a.priority as keyof typeof PRIORITY_META]?.label,
                ACTION_STATUS_META[a.status as keyof typeof ACTION_STATUS_META]?.label,
                fmtDate(a.due_date),
              ]),
            })}
            onExcel={() => exportActionsXLSX(actions, company?.name)}
          />
        }
      />

      {companies.length > 1 && (
        <Card className="mb-4 border-2"><CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
          <Label>Entreprise :</Label>
          <Select value={companyId} onValueChange={setCompanyId}>
            <SelectTrigger className="w-full sm:w-72"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
            <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </CardContent></Card>
      )}

      {!companyId ? <p className="text-center text-muted-foreground">Aucune entreprise rattachée à votre compte.</p> :
        actions.length === 0 ? <p className="text-center text-muted-foreground py-8">Aucune action.</p> :
        <div className="space-y-2">
          {actions.map((a) => (
            <Card key={a.id} className="border-2">
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex-1 min-w-[240px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{a.title}</span>
                      <Badge variant="outline">{PRIORITY_META[a.priority as keyof typeof PRIORITY_META]?.label}</Badge>
                      {a.pending_status && (
                        <Badge className="bg-warning text-warning-foreground"><Hourglass className="mr-1 h-3 w-3" />En attente : {ACTION_STATUS_META[a.pending_status as keyof typeof ACTION_STATUS_META]?.label}</Badge>
                      )}
                    </div>
                    {a.description && <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>}
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {a.due_date && <span>📅 Échéance : {new Date(a.due_date).toLocaleDateString("fr-FR")}</span>}
                      {a.responsible && <span>👤 {a.responsible}</span>}
                    </div>
                    {a.pending_comment && (
                      <p className="mt-2 rounded border-l-2 border-warning bg-warning/5 p-2 text-xs italic">« {a.pending_comment} »</p>
                    )}
                    {a.validation_note && (
                      <p className="mt-2 rounded border-l-2 border-destructive bg-destructive/5 p-2 text-xs"><X className="mr-1 inline h-3 w-3" />Refus : {a.validation_note}</p>
                    )}
                  </div>
                  <Select value={a.status} onValueChange={(v) => onChangeStatus(a, v)} disabled={!!a.pending_status}>
                    <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(ACTION_STATUS_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <ActionAttachments actionId={a.id} companyId={a.company_id} />
              </CardContent>
            </Card>
          ))}
        </div>
      }

      <Dialog open={!!pendingDialog} onOpenChange={(o) => !o && setPendingDialog(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
          <DialogHeader>
            <DialogTitle>Demande de validation</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <p>Vous demandez à passer cette action en <b>{pendingDialog && ACTION_STATUS_META[pendingDialog.status as keyof typeof ACTION_STATUS_META]?.label}</b>. Votre auditeur devra valider la modification.</p>
            <div>
              <Label>Commentaire (preuves, justification…)</Label>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} placeholder="Décrivez ce qui a été mis en place" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDialog(null)}>Annuler</Button>
            <Button onClick={submitValidation} className="bg-gradient-primary"><Check className="mr-1.5 h-4 w-4" />Soumettre</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}