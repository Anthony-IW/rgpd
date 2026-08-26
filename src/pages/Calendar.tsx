import { useEffect, useMemo, useState } from "react";
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
import { CalendarDays, Plus, ChevronLeft, ChevronRight, Trash2, ListChecks, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  addDays, addMonths, addWeeks, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth,
  isToday, parseISO, startOfMonth, startOfWeek, subMonths, subWeeks,
} from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CalItem = {
  id: string;
  source: "action" | "event";
  title: string;
  date: Date;
  color: string;
  description?: string;
  location?: string;
  status?: string;
  raw: any;
};

export default function CalendarPage() {
  const { user, isClient, isAdmin, isAuditor } = useAuth();
  const canEdit = isAdmin || isAuditor;
  const [companies, setCompanies] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [cursor, setCursor] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [actions, setActions] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [openNew, setOpenNew] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [form, setForm] = useState<any>({
    title: "", description: "", start_at: "", end_at: "", color: "#3B82F6", location: "",
  });

  useEffect(() => {
    document.title = "Calendrier | RGPD";
    (async () => {
      if (isClient && !canEdit) {
        // Client: charger uniquement ses entreprises
        const { data: cu } = await supabase.from("company_users").select("company_id").eq("user_id", user!.id);
        const ids = (cu || []).map((x) => x.company_id);
        if (!ids.length) return;
        const { data } = await supabase.from("companies").select("id, name").in("id", ids).order("name");
        setCompanies(data || []);
        if (data && data.length) setCompanyId(data[0].id);
      } else {
        const { data } = await supabase.from("companies").select("id, name").order("name");
        setCompanies(data || []);
        if (data && data.length) setCompanyId(data[0].id);
      }
    })();
  }, [user, isClient, canEdit]);

  const reload = async () => {
    if (!companyId) { setActions([]); setEvents([]); return; }
    const [a, e] = await Promise.all([
      supabase.from("action_plans").select("id, title, description, due_date, status, priority, company_id")
        .eq("company_id", companyId).not("due_date", "is", null),
      supabase.from("calendar_events").select("*").eq("company_id", companyId),
    ]);
    setActions(a.data || []);
    setEvents(e.data || []);
  };
  useEffect(() => { reload(); }, [companyId]);

  const items: CalItem[] = useMemo(() => {
    const a: CalItem[] = actions.map((x) => ({
      id: `a-${x.id}`, source: "action", title: x.title, date: parseISO(x.due_date),
      color: x.priority === "haute" ? "#EF4444" : x.priority === "basse" ? "#10B981" : "#F59E0B",
      description: x.description, status: x.status, raw: x,
    }));
    const e: CalItem[] = events.map((x) => ({
      id: `e-${x.id}`, source: "event", title: x.title, date: parseISO(x.start_at),
      color: x.color || "#3B82F6", description: x.description, location: x.location, raw: x,
    }));
    return [...a, ...e].sort((x, y) => x.date.getTime() - y.date.getTime());
  }, [actions, events]);

  const monthStart = startOfMonth(cursor);
  const days = useMemo(() => {
    if (view === "day") return [cursor];
    if (view === "week") {
      return eachDayOfInterval({
        start: startOfWeek(cursor, { weekStartsOn: 1 }),
        end: endOfWeek(cursor, { weekStartsOn: 1 }),
      });
    }
    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }),
    });
  }, [cursor, view]);

  const goPrev = () => setCursor(view === "month" ? subMonths(cursor, 1) : view === "week" ? subWeeks(cursor, 1) : addDays(cursor, -1));
  const goNext = () => setCursor(view === "month" ? addMonths(cursor, 1) : view === "week" ? addWeeks(cursor, 1) : addDays(cursor, 1));
  const periodLabel = view === "month"
    ? format(cursor, "MMMM yyyy", { locale: fr })
    : view === "week"
      ? `Semaine du ${format(startOfWeek(cursor, { weekStartsOn: 1 }), "d MMM", { locale: fr })} au ${format(endOfWeek(cursor, { weekStartsOn: 1 }), "d MMM yyyy", { locale: fr })}`
      : format(cursor, "EEEE d MMMM yyyy", { locale: fr });

  const itemsFor = (d: Date) => items.filter((it) => isSameDay(it.date, d));
  const dayItems = selectedDay ? itemsFor(selectedDay) : [];

  const openCreate = (d?: Date) => {
    if (!canEdit) return;
    const base = d ?? new Date();
    const iso = format(base, "yyyy-MM-dd'T'HH:mm");
    setEditingEvent(null);
    setForm({ title: "", description: "", start_at: iso, end_at: "", color: "#3B82F6", location: "" });
    setOpenNew(true);
  };

  const openEdit = (ev: any) => {
    if (!canEdit) return;
    setEditingEvent(ev);
    setForm({
      title: ev.title, description: ev.description || "",
      start_at: format(parseISO(ev.start_at), "yyyy-MM-dd'T'HH:mm"),
      end_at: ev.end_at ? format(parseISO(ev.end_at), "yyyy-MM-dd'T'HH:mm") : "",
      color: ev.color || "#3B82F6", location: ev.location || "",
    });
    setOpenNew(true);
  };

  const saveEvent = async () => {
    if (!companyId || !form.title || !form.start_at) return toast.error("Entreprise, titre et date requis");
    const payload = {
      company_id: companyId, owner_id: user!.id, title: form.title, description: form.description || null,
      start_at: new Date(form.start_at).toISOString(),
      end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
      color: form.color, location: form.location || null,
    };
    const { error } = editingEvent
      ? await supabase.from("calendar_events").update(payload).eq("id", editingEvent.id)
      : await supabase.from("calendar_events").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editingEvent ? "Événement modifié" : "Événement créé");
    setOpenNew(false); setEditingEvent(null);
    reload();
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Supprimer cet événement ?")) return;
    await supabase.from("calendar_events").delete().eq("id", id);
    toast.success("Supprimé"); reload();
  };

  const updateActionDueDate = async (actionId: string, newDate: string) => {
    const { error } = await supabase.from("action_plans").update({ due_date: newDate }).eq("id", actionId);
    if (error) return toast.error(error.message);
    toast.success("Échéance modifiée"); reload();
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Calendrier"
        description="Échéances du plan d'actions et événements"
        icon={CalendarDays}
        actions={canEdit ? (
          <Button onClick={() => openCreate()} disabled={!companyId} className="bg-gradient-primary">
            <Plus className="mr-2 h-4 w-4" />Nouvel événement
          </Button>
        ) : undefined}
      />

      {canEdit && (
        <Card className="mb-4 border-2"><CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
          <Label>Entreprise :</Label>
          <Select value={companyId} onValueChange={setCompanyId}>
            <SelectTrigger className="w-full sm:w-72"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
            <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </CardContent></Card>
      )}

      <Card className="border-2 overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between gap-1 sm:justify-start">
              <Button variant="ghost" size="icon" onClick={goPrev}><ChevronLeft className="h-4 w-4" /></Button>
              <h2 className="text-sm sm:text-lg font-semibold capitalize">{periodLabel}</h2>
              <Button variant="ghost" size="icon" onClick={goNext}><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <div className="flex items-center gap-2">
              <Tabs value={view} onValueChange={(v) => setView(v as any)}>
                <TabsList className="h-8">
                  <TabsTrigger value="month" className="text-xs">Mois</TabsTrigger>
                  <TabsTrigger value="week" className="text-xs">Semaine</TabsTrigger>
                  <TabsTrigger value="day" className="text-xs">Jour</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>Aujourd'hui</Button>
            </div>
          </div>

          {view !== "day" && (
            <div className="grid grid-cols-7 border-b bg-muted/30 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
                <div key={d} className="py-2">{d}</div>
              ))}
            </div>
          )}

          <div className={view === "day" ? "grid grid-cols-1" : "grid grid-cols-7"}>
            {days.map((day) => {
              const dayList = itemsFor(day);
              const inMonth = isSameMonth(day, cursor);
              const today = isToday(day);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => { setSelectedDay(day); }}
                  onDoubleClick={() => openCreate(day)}
                  className={cn(
                    "group relative min-h-[84px] sm:min-h-[110px] border-b border-r p-1.5 text-left transition-colors hover:bg-accent/40",
                    !inMonth && "bg-muted/20 text-muted-foreground/60",
                    selectedDay && isSameDay(day, selectedDay) && "ring-2 ring-primary ring-inset",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                      today && "bg-primary text-primary-foreground",
                    )}>{format(day, "d")}</span>
                    {dayList.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">{dayList.length}</span>
                    )}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {dayList.slice(0, 3).map((it) => (
                      <div key={it.id}
                        className="truncate rounded px-1 py-0.5 text-[10px] sm:text-xs font-medium text-white"
                        style={{ backgroundColor: it.color }}
                        title={it.title}
                      >{it.title}</div>
                    ))}
                    {dayList.length > 3 && (
                      <div className="text-[10px] text-muted-foreground">+{dayList.length - 3}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedDay && (
        <Card className="mt-4 border-2">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold capitalize">
                {format(selectedDay, "EEEE d MMMM yyyy", { locale: fr })}
              </h3>
              {canEdit && (
                <Button size="sm" variant="outline" onClick={() => openCreate(selectedDay)}>
                  <Plus className="mr-1 h-4 w-4" />Ajouter
                </Button>
              )}
            </div>
            {dayItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun élément ce jour.</p>
            ) : (
              <ul className="space-y-2">
                {dayItems.map((it) => (
                  <li key={it.id} className="flex items-start gap-3 rounded-md border p-3">
                    <div className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: it.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{it.title}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {it.source === "action" ? <><ListChecks className="mr-1 h-3 w-3" />Action</> : "Événement"}
                        </Badge>
                      </div>
                      {it.description && <p className="mt-1 text-xs text-muted-foreground">{it.description}</p>}
                      {it.location && <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{it.location}</p>}
                      {canEdit && it.source === "action" && (
                        <div className="mt-2 flex items-center gap-2">
                          <Label className="text-xs">Modifier l'échéance :</Label>
                          <Input type="date" className="h-7 w-40 text-xs"
                            defaultValue={format(it.date, "yyyy-MM-dd")}
                            onChange={(e) => e.target.value && updateActionDueDate(it.raw.id, e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                    {canEdit && it.source === "event" && (
                      <div className="flex flex-col gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(it.raw)}>Modifier</Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteEvent(it.raw.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg">
          <DialogHeader><DialogTitle>{editingEvent ? "Modifier l'événement" : "Nouvel événement"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Titre *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid gap-3 md:grid-cols-2">
              <div><Label>Début *</Label><Input type="datetime-local" value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} /></div>
              <div><Label>Fin</Label><Input type="datetime-local" value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} /></div>
              <div><Label>Lieu</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              <div><Label>Couleur</Label><Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10 p-1" /></div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editingEvent && (
              <Button variant="outline" className="text-destructive mr-auto" onClick={() => { deleteEvent(editingEvent.id); setOpenNew(false); }}>
                <Trash2 className="mr-1 h-4 w-4" />Supprimer
              </Button>
            )}
            <Button variant="outline" onClick={() => setOpenNew(false)}>Annuler</Button>
            <Button onClick={saveEvent} className="bg-gradient-primary">{editingEvent ? "Enregistrer" : "Créer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}