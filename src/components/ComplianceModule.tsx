import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Search, Plus, Trash2, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ExportMenu } from "@/components/ExportMenu";
import { printTablePDF } from "@/lib/exports/pdfTable";
import { exportGenericXLSX } from "@/lib/exports/excelExport";
import { fmtDate } from "@/lib/exports/exportHelpers";
import type { LucideIcon } from "lucide-react";

type FieldType = "text" | "textarea" | "select" | "date" | "datetime" | "number" | "boolean" | "array" | "status" | "relation";

interface RelationConfig {
  table: string;
  labelField: string;
  valueField?: string;
  filterByCompany?: boolean;
}

export interface ComplianceField {
  key: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  relation?: RelationConfig;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  format?: (value: any, item?: any) => string;
  badge?: (value: any, item?: any) => { label: string; className?: string } | null;
}

interface ComplianceModuleProps {
  title: string;
  description: string;
  icon: LucideIcon;
  table: string;
  moduleKey: string;
  fields: ComplianceField[];
  listFields: string[];
  statusField?: string;
  filterFields?: string[];
  exportTitle: string;
}

function toInputDate(d?: string | null) {
  if (!d) return "";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  } catch { return ""; }
}

function toInputDatetime(d?: string | null) {
  if (!d) return "";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 16);
  } catch { return ""; }
}

export function ComplianceModule({
  title, description, icon, table, moduleKey, fields, listFields, statusField, filterFields = [], exportTitle,
}: ComplianceModuleProps) {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [companies, setCompanies] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [relationOptions, setRelationOptions] = useState<Record<string, any[]>>({});

  useEffect(() => {
    document.title = `${title} | RGPD`;
    (supabase.from("companies" as any).select("id, name").order("name") as any).then((res: any) => {
      const list = res.data || [];
      setCompanies(list);
      if (list.length === 1) setCompanyId(list[0].id);
    });
  }, [title]);

  useEffect(() => {
    if (!companyId) { setItems([]); return; }
    setLoading(true);
    (supabase.from(table as any).select("*").eq("company_id", companyId).order("created_at", { ascending: false }) as any).then((res: any) => {
      setLoading(false);
      if (res.error) toast.error(res.error.message);
      else setItems(res.data || []);
    });
  }, [companyId, table]);

  useEffect(() => {
    if (!companyId) { setRelationOptions({}); return; }
    const relFields = fields.filter((f) => f.type === "relation" && f.relation);
    Promise.all(relFields.map(async (f) => {
      const rel = f.relation!;
      const query = supabase.from(rel.table as any).select(`${rel.valueField || "id"}, ${rel.labelField}`);
      if (rel.filterByCompany) (query as any).eq("company_id", companyId);
      const res: any = await query;
      return { key: f.key, options: res.data || [] };
    })).then((results) => {
      const map: Record<string, any[]> = {};
      results.forEach((r) => (map[r.key] = r.options));
      setRelationOptions(map);
    });
  }, [companyId, fields]);

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const term = q.toLowerCase();
    return items.filter((item) =>
      filterFields.some((key) => {
        const v = item[key];
        if (v == null) return false;
        return String(v).toLowerCase().includes(term);
      })
    );
  }, [items, q, filterFields]);

  const selectedCompany = companies.find((c) => c.id === companyId);

  const openCreate = () => {
    setEditing(null);
    const defaults: Record<string, any> = {};
    fields.forEach((f) => {
      if (f.type === "boolean") defaults[f.key] = false;
      else if (f.type === "array") defaults[f.key] = [];
      else defaults[f.key] = "";
    });
    setForm(defaults);
    setOpen(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    const next: Record<string, any> = {};
    fields.forEach((f) => {
      const v = item[f.key];
      if (f.type === "date") next[f.key] = toInputDate(v);
      else if (f.type === "datetime") next[f.key] = toInputDatetime(v);
      else if (f.type === "array") next[f.key] = Array.isArray(v) ? v.join(", ") : v || "";
      else if (f.type === "boolean") next[f.key] = !!v;
      else next[f.key] = v ?? "";
    });
    setForm(next);
    setOpen(true);
  };

  const close = () => { setOpen(false); setEditing(null); };

  const preparePayload = () => {
    const payload: Record<string, any> = { company_id: companyId, owner_id: user!.id };
    for (const f of fields) {
      let v = form[f.key];
      if (f.type === "date") v = v ? new Date(v).toISOString().slice(0, 10) : null;
      else if (f.type === "datetime") v = v ? new Date(v).toISOString() : null;
      else if (f.type === "number") v = v ? Number(v) : null;
      else if (f.type === "boolean") v = !!v;
      else if (f.type === "array") v = v ? String(v).split(",").map((s: string) => s.trim()).filter(Boolean) : [];
      else if (typeof v === "string") v = v.trim() || null;
      if (v === "") v = null;
      payload[f.key] = v;
    }
    return payload;
  };

  const save = async () => {
    const missing = fields.filter((f) => f.required && !form[f.key]);
    if (missing.length) { toast.error(`Champs requis : ${missing.map((f) => f.label).join(", ")}`); return; }
    const payload = preparePayload();
    let error: any = null;
    if (editing) {
      const { error: e } = await supabase.from(table as any).update(payload).eq("id", editing.id);
      error = e;
    } else {
      const { error: e } = await supabase.from(table as any).insert(payload);
      error = e;
    }
    if (error) return toast.error(error.message);
    toast.success(editing ? "Modifications enregistrées" : "Élément créé");
    close();
    reload();
  };

  const reload = async () => {
    if (!companyId) return;
    setLoading(true);
    const res: any = await supabase.from(table as any).select("*").eq("company_id", companyId).order("created_at", { ascending: false });
    setItems(res.data || []);
    setLoading(false);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from(table as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Supprimé");
    setItems((s) => s.filter((x) => x.id !== id));
  };

  const exportPdf = () => {
    const columns = listFields.map((key) => fields.find((f) => f.key === key)?.label || key);
    const rows = filtered.map((item) =>
      listFields.map((key) => {
        const field = fields.find((f) => f.key === key);
        const v = item[key];
        if (field?.format) return field.format(v, item);
        if (Array.isArray(v)) return v.join(", ");
        if (typeof v === "boolean") return v ? "Oui" : "Non";
        return v ?? "";
      })
    );
    printTablePDF({ title: exportTitle, subtitle: selectedCompany?.name, columns, rows });
  };

  const exportExcel = () => {
    const columns = listFields.map((key) => fields.find((f) => f.key === key)?.label || key);
    const rows = filtered.map((item) =>
      listFields.map((key) => {
        const field = fields.find((f) => f.key === key);
        const v = item[key];
        if (field?.format) return field.format(v, item);
        if (Array.isArray(v)) return v.join(", ");
        if (typeof v === "boolean") return v ? "Oui" : "Non";
        return v ?? "";
      })
    );
    exportGenericXLSX({ title: exportTitle, columns, rows, sheetName: title, baseName: moduleKey, companyName: selectedCompany?.name });
  };

  const renderFormField = (f: ComplianceField) => {
    const value = form[f.key];
    const set = (v: any) => setForm((s) => ({ ...s, [f.key]: v }));
    if (f.type === "textarea") {
      return <Textarea value={value || ""} onChange={(e) => set(e.target.value)} placeholder={f.placeholder} rows={f.rows || 3} />;
    }
    if (f.type === "select" || f.type === "status") {
      return (
        <Select value={value || ""} onValueChange={set}>
          <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
          <SelectContent>{f.options?.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      );
    }
    if (f.type === "relation") {
      const opts = relationOptions[f.key] || [];
      return (
        <Select value={value || ""} onValueChange={set}>
          <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Aucun</SelectItem>
            {opts.map((o: any) => <SelectItem key={o.id || o[f.relation!.valueField || "id"]} value={o[f.relation!.valueField || "id"]}>{o[f.relation!.labelField]}</SelectItem>)}
          </SelectContent>
        </Select>
      );
    }
    if (f.type === "boolean") {
      return <Switch checked={!!value} onCheckedChange={set} />;
    }
    if (f.type === "date") {
      return <Input type="date" value={value || ""} onChange={(e) => set(e.target.value)} />;
    }
    if (f.type === "datetime") {
      return <Input type="datetime-local" value={value || ""} onChange={(e) => set(e.target.value)} />;
    }
    if (f.type === "number") {
      return <Input type="number" value={value ?? ""} onChange={(e) => set(e.target.value)} />;
    }
    if (f.type === "array") {
      return <Input value={Array.isArray(value) ? value.join(", ") : value || ""} onChange={(e) => set(e.target.value)} placeholder={f.placeholder || "Séparés par des virgules"} />;
    }
    return <Input value={value || ""} onChange={(e) => set(e.target.value)} placeholder={f.placeholder} />;
  };

  const renderListValue = (item: any, key: string) => {
    const field = fields.find((f) => f.key === key);
    const v = item[key];
    if (field?.badge) {
      const b = field.badge(v, item);
      if (b) return <Badge className={b.className}>{b.label}</Badge>;
    }
    if (field?.format) return field.format(v, item);
    if (field?.type === "relation" && v && relationOptions[key]) {
      const rel = field.relation!;
      const opt = relationOptions[key].find((o: any) => (o[rel.valueField || "id"] || o.id) === v);
      if (opt) return opt[rel.labelField];
    }
    if (Array.isArray(v)) return v.join(", ");
    if (typeof v === "boolean") return v ? "Oui" : "Non";
    return v ?? "—";
  };

  const isOverdue = (item: any) => {
    if (!statusField) return false;
    const s = item[statusField];
    const due = item.response_due_at || item.notification_due_at || item.dpa_renewal_date;
    if (!due) return false;
    if (s === "traite" || s === "clos" || s === "fait") return false;
    return new Date(due) < new Date();
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={title}
        description={description}
        icon={icon}
        actions={
          <ExportMenu disabled={filtered.length === 0} onPdf={exportPdf} onExcel={exportExcel} />
        }
      />

      <Card className="mb-4 border-2"><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1.5 w-full sm:w-auto sm:flex-1 min-w-[240px]">
          <Label>Entreprise :</Label>
          <Select value={companyId} onValueChange={setCompanyId}>
            <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
            <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="relative w-full sm:w-auto sm:flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={!companyId} className="bg-gradient-primary w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" />Ajouter</Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Modifier" : "Ajouter"} {title.toLowerCase()}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.key} className={`space-y-1.5 ${f.type === "textarea" ? "sm:col-span-2" : ""}`}>
                  <Label>{f.label}{f.required && <span className="text-destructive"> *</span>}</Label>
                  {renderFormField(f)}
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={close}>Annuler</Button>
              <Button onClick={save} className="bg-gradient-primary">{editing ? "Enregistrer" : "Créer"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent></Card>

      {!companyId ? (
        <p className="text-center text-muted-foreground">Sélectionnez une entreprise.</p>
      ) : loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Aucun élément.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <Card key={item.id} className={`border-2 ${isOverdue(item) ? "border-destructive/50 bg-destructive/5" : ""}`}>
              <CardContent className="space-y-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-[240px]">
                    <div className="flex flex-wrap items-center gap-2">
                      {listFields.slice(0, 2).map((key) => {
                        const field = fields.find((f) => f.key === key);
                        const v = item[key];
                        if (key === statusField && field?.badge) {
                          const b = field.badge!(v, item);
                          return b ? <Badge key={key} className={b.className}>{b.label}</Badge> : null;
                        }
                        return <span key={key} className="font-medium">{renderListValue(item, key)}</span>;
                      })}
                      {isOverdue(item) && <Badge variant="destructive">En retard</Badge>}
                    </div>
                    <div className="mt-1 grid gap-x-4 gap-y-1 text-sm text-muted-foreground sm:grid-cols-2">
                      {listFields.slice(2).map((key) => (
                        <div key={key}>
                          <span className="text-xs uppercase text-muted-foreground/70">{fields.find((f) => f.key === key)?.label || key} :</span>{" "}
                          {renderListValue(item, key)}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer cet élément ?</AlertDialogTitle>
                          <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove(item.id)} className="bg-destructive">Supprimer</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
