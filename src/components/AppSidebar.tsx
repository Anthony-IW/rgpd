import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, Building2, ClipboardCheck, FileText, ListChecks, BookOpen, LogOut, Shield, ClipboardList, CalendarDays,
  Handshake, FileQuestion, TriangleAlert, CheckCircle, ShieldCheck,
} from "lucide-react";
import { Logo } from "./Logo";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "./ui/button";

const auditorItems = [
  { title: "Tableau de bord", url: "/", icon: LayoutDashboard },
  { title: "Entreprises", url: "/entreprises", icon: Building2 },
  { title: "Audits RGPD", url: "/audits", icon: ClipboardCheck },
  { title: "Registre traitements", url: "/registre", icon: FileText },
  { title: "Sous-traitants & DPA", url: "/sous-traitants", icon: Handshake },
  { title: "Demandes de droits", url: "/droits", icon: FileQuestion },
  { title: "Violations", url: "/violations", icon: TriangleAlert },
  { title: "Consentements", url: "/consentements", icon: CheckCircle },
  { title: "DPIA", url: "/dpia", icon: ShieldCheck },
  { title: "Plan d'actions", url: "/actions", icon: ListChecks },
  { title: "Calendrier", url: "/calendrier", icon: CalendarDays },
  { title: "Bibliothèque", url: "/bibliotheque", icon: BookOpen },
];

const clientItems = [
  { title: "Mon plan d'actions", url: "/portail/actions", icon: ClipboardList },
  { title: "Mon questionnaire", url: "/portail/questionnaire", icon: ClipboardCheck },
  { title: "Calendrier", url: "/portail/calendrier", icon: CalendarDays },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { signOut, user, isClient, isAuditor, isAdmin } = useAuth();
  const items = isClient && !isAuditor && !isAdmin
    ? clientItems
    : isAdmin
      ? [...auditorItems, { title: "Utilisateurs", url: "/utilisateurs", icon: Users }]
      : auditorItems;

  const isActive = (url: string) => url === "/" ? pathname === "/" : pathname.startsWith(url);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-3">
        <div className="flex items-center gap-2">
          <Logo className="h-9 w-9 shrink-0" />
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-sidebar-foreground">Informatique & Web</span>
              <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">Audit RGPD</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink to={item.url} end={item.url === "/"}>
                      <item.icon />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        {!collapsed && user && (
          <div className="px-2 py-1 text-xs text-sidebar-foreground/70 truncate">
            <div className="flex items-center gap-1.5"><Shield className="h-3 w-3" />{user.email}</div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Déconnexion</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}