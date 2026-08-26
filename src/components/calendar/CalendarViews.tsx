import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACTION_STATUS_META } from "@/data/rgpdReferential";
import { cn } from "@/lib/utils";
import { differenceInCalendarDays, eachDayOfInterval, format, isSameDay, isToday, parseISO, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays, Flag, ListChecks, MapPin } from "lucide-react";

export type GanttTask = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  status: string;
  pendingStatus?: string | null;
  priority?: string | null;
};

/** Construit les tâches (début / fin) à partir des actions et des repères du calendrier. */
export function buildTasks(actions: any[], events: any[]): GanttTask[] {
  const startByAction = new Map<string, Date>();
  const endByAction = new Map<string, Date>();
  events.forEach((e) => {
    if (!e.related_action_id) return;
    const d = parseISO(e.start_at);
    if (/^d[ée]but\s*:/i.test(e.title || "")) startByAction.set(e.related_action_id, d);
    if (/^fin\s*:/i.test(e.title || "")) endByAction.set(e.related_action_id, d);
  });
  return actions
    .map((a) => {
      const due = a.due_date ? parseISO(a.due_date) : null;
      const end = endByAction.get(a.id) ?? due;
      const start = startByAction.get(a.id) ?? end;
      if (!start || !end) return null;
      return {
        id: a.id,
        title: a.title,
        start: startOfDay(start <= end ? start : end),
        end: startOfDay(end >= start ? end : start),
        color: a.pending_status
          ? "#9CA3AF"
          : a.status === "conforme" || a.status === "fait" || a.status === "non_applicable"
            ? "#16A34A"
            : "#3B82F6",
        status: a.status,
        pendingStatus: a.pending_status,
        priority: a.priority,
      } as GanttTask;
    })
    .filter(Boolean)
    .sort((a: any, b: any) => a!.start.getTime() - b!.start.getTime()) as GanttTask[];
}

export function GanttView({ tasks }: { tasks: GanttTask[] }) {
  const range = useMemo(() => {
    if (!tasks.length) return [] as Date[];
    const min = tasks.reduce((m, t) => (t.start < m ? t.start : m), tasks[0].start);
    const max = tasks.reduce((m, t) => (t.end > m ? t.end : m), tasks[0].end);
    return eachDayOfInterval({ start: min, end: max });
  }, [tasks]);

  if (!tasks.length) {
    return <p className="p-6 text-sm text-muted-foreground">Aucune action planifiée à afficher.</p>;
  }

  const COL = 34;
  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: 240 + range.length * COL }}>
        <div className="flex border-b bg-muted/30 text-[10px] text-muted-foreground">
          <div className="w-[240px] shrink-0 border-r px-3 py-2 text-xs font-medium uppercase tracking-wide">Action</div>
          {range.map((d) => (
            <div
              key={d.toISOString()}
              className={cn("shrink-0 py-2 text-center", isToday(d) && "bg-primary/10 font-semibold text-primary")}
              style={{ width: COL }}
            >
              <div className="capitalize">{format(d, "EEEEE", { locale: fr })}</div>
              <div>{format(d, "d")}</div>
            </div>
          ))}
        </div>
        {tasks.map((t) => {
          const offset = differenceInCalendarDays(t.start, range[0]);
          const span = differenceInCalendarDays(t.end, t.start) + 1;
          return (
            <div key={t.id} className="flex items-center border-b hover:bg-accent/30">
              <div className="w-[240px] shrink-0 border-r px-3 py-2">
                <p className="truncate text-xs font-medium" title={t.title}>{t.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {format(t.start, "d MMM", { locale: fr })} → {format(t.end, "d MMM", { locale: fr })}
                </p>
              </div>
              <div className="relative h-10 flex-1" style={{ width: range.length * COL }}>
                <div
                  className="absolute top-2 flex h-6 items-center rounded-md px-2 text-[10px] font-medium text-white shadow-sm"
                  style={{ left: offset * COL + 2, width: Math.max(span * COL - 4, 18), backgroundColor: t.color }}
                  title={`${t.title} — ${format(t.start, "dd/MM")} au ${format(t.end, "dd/MM")}`}
                >
                  <span className="truncate">{t.title}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TimelineView({ items }: { items: any[] }) {
  const groups = useMemo(() => {
    const map = new Map<string, any[]>();
    items.forEach((it) => {
      const key = format(it.date, "yyyy-MM-dd");
      map.set(key, [...(map.get(key) || []), it]);
    });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  if (!groups.length) return <p className="p-6 text-sm text-muted-foreground">Aucun élément à afficher.</p>;

  return (
    <div className="max-h-[70vh] overflow-y-auto p-4">
      <div className="relative border-l-2 border-dashed pl-6">
        {groups.map(([key, list]) => {
          const d = parseISO(key);
          return (
            <div key={key} className="relative mb-6">
              <span
                className={cn(
                  "absolute -left-[31px] mt-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background",
                  isToday(d) ? "bg-primary" : "bg-muted-foreground",
                )}
              />
              <p className={cn("mb-2 text-sm font-semibold capitalize", isToday(d) && "text-primary")}>
                {format(d, "EEEE d MMMM yyyy", { locale: fr })}
                {isToday(d) && <span className="ml-2 text-xs font-normal">(aujourd'hui)</span>}
              </p>
              <ul className="space-y-2">
                {list.map((it) => (
                  <li key={it.id} className="flex items-start gap-3 rounded-md border p-3">
                    <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: it.color }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{it.title}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {it.source === "action" ? <><ListChecks className="mr-1 h-3 w-3" />Action</> : <><CalendarDays className="mr-1 h-3 w-3" />Événement</>}
                        </Badge>
                      </div>
                      {it.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{it.description}</p>}
                      {it.location && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />{it.location}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const KANBAN_COLUMNS = ["a_faire", "en_cours", "fait", "conforme", "reporte", "non_applicable"] as const;

export function KanbanView({
  actions,
  canEdit,
  onStatusChange,
}: {
  actions: any[];
  canEdit: boolean;
  onStatusChange: (id: string, status: string) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto p-3">
      {KANBAN_COLUMNS.map((col) => {
        const list = actions.filter((a) => a.status === col);
        return (
          <div key={col} className="w-64 shrink-0">
            <div className="mb-2 flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-wide">
                {ACTION_STATUS_META[col].label}
              </span>
              <Badge variant="secondary" className="text-[10px]">{list.length}</Badge>
            </div>
            <div className="space-y-2">
              {list.map((a) => (
                <Card key={a.id} className="border">
                  <CardContent className="space-y-2 p-3">
                    <p className="text-xs font-medium">{a.title}</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {a.priority && (
                        <Badge variant="outline" className="text-[10px] capitalize">
                          <Flag className="mr-1 h-3 w-3" />{a.priority}
                        </Badge>
                      )}
                      {a.due_date && (
                        <Badge variant="outline" className="text-[10px]">
                          <CalendarDays className="mr-1 h-3 w-3" />{format(parseISO(a.due_date), "dd/MM/yy")}
                        </Badge>
                      )}
                      {a.pending_status && (
                        <Badge className="bg-warning text-[10px] text-warning-foreground">Validation demandée</Badge>
                      )}
                    </div>
                    {canEdit && (
                      <Select value={a.status} onValueChange={(v) => onStatusChange(a.id, v)}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {KANBAN_COLUMNS.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">{ACTION_STATUS_META[s].label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </CardContent>
                </Card>
              ))}
              {!list.length && (
                <p className="rounded-md border border-dashed p-3 text-center text-[10px] text-muted-foreground">Vide</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { isSameDay };
