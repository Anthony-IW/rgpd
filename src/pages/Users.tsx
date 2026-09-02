import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, UserPlus, Trash2, Copy, Pencil } from "lucide-react";
import { toast } from "sonner";

type ManagedUser = { user_id: string; email: string | null; full_name: string | null; roles: string[] };

export default function Users() {
  const { isAdmin, loading, user } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ email: "", full_name: "", password: "", role: "admin" });
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  useEffect(() => { document.title = "Utilisateurs | Audit RGPD"; }, []);

  const call = async (body: any) => {
    const { data, error } = await supabase.functions.invoke("manage-users", { body });
    if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message || "Erreur");
    return data as any;
  };

  const load = async () => {
    try {
      const d = await call({ action: "list" });
      setUsers(d.users || []);
    } catch (e: any) { toast.error(e.message); }
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const genPwd = () => Math.random().toString(36).slice(-5) + Math.random().toString(36).slice(-5) + "!A1";

  const create = async () => {
    if (!form.email) return toast.error("Email requis");
    const pwd = form.password || genPwd();
    setSubmitting(true);
    try {
      await call({ action: "create", email: form.email, password: pwd, full_name: form.full_name, role: form.role });
      toast.success("Compte créé");
      setCreated({ email: form.email, password: pwd });
      setForm({ email: "", full_name: "", password: "", role: "admin" });
      load();
    } catch (e: any) { toast.error(e.message); }
    setSubmitting(false);
  };

  const setRole = async (user_id: string, role: string) => {
    try { await call({ action: "set_role", user_id, role }); toast.success("Rôle mis à jour"); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  const remove = async (user_id: string) => {
    try { await call({ action: "delete", user_id }); toast.success("Compte supprimé"); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  const copy = (t: string) => { navigator.clipboard.writeText(t); toast.success("Copié"); };

  if (loading) return null;
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center text-muted-foreground">
        Cette page est réservée aux administrateurs.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Utilisateurs"
        description="Créez et gérez les comptes administrateurs et auditeurs"
        icon={ShieldCheck}
        actions={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setCreated(null); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary"><UserPlus className="mr-1.5 h-4 w-4" />Nouveau compte</Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
              <DialogHeader><DialogTitle>Créer un compte</DialogTitle></DialogHeader>
              {created ? (
                <div className="space-y-3 py-2">
                  <p className="text-sm">Compte créé. Communiquez ces identifiants :</p>
                  <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span><b>Email :</b> {created.email}</span>
                      <Button size="icon" variant="ghost" onClick={() => copy(created.email)}><Copy className="h-3.5 w-3.5" /></Button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span><b>Mot de passe :</b> <code>{created.password}</code></span>
                      <Button size="icon" variant="ghost" onClick={() => copy(created.password)}><Copy className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">⚠️ Ce mot de passe ne sera plus affiché.</p>
                  <DialogFooter><Button onClick={() => { setOpen(false); setCreated(null); }}>Fermer</Button></DialogFooter>
                </div>
              ) : (
                <div className="space-y-3 py-2">
                  <div><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                  <div><Label>Nom complet</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
                  <div>
                    <Label>Rôle</Label>
                    <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrateur</SelectItem>
                        <SelectItem value="auditor">Auditeur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Mot de passe (laisser vide = généré)</Label>
                    <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Auto-généré si vide" />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                    <Button onClick={create} disabled={submitting} className="bg-gradient-primary">{submitting ? "Création…" : "Créer"}</Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="border-2">
        <CardContent className="p-0">
          {users.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Aucun compte administrateur ou auditeur.</p>
          ) : (
            <ul className="divide-y">
              {users.map((usr) => (
                <li key={usr.user_id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{usr.full_name || usr.email || usr.user_id}</div>
                    {usr.email && <div className="truncate text-xs text-muted-foreground">{usr.email}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    {usr.user_id === user?.id ? (
                      <Badge variant="outline">{usr.roles.includes("admin") ? "Administrateur" : "Auditeur"} (vous)</Badge>
                    ) : (
                      <>
                        <Select value={usr.roles.includes("admin") ? "admin" : "auditor"} onValueChange={(v) => setRole(usr.user_id, v)}>
                          <SelectTrigger className="h-8 w-[150px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrateur</SelectItem>
                            <SelectItem value="auditor">Auditeur</SelectItem>
                          </SelectContent>
                        </Select>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer ce compte ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Le compte {usr.email} sera définitivement supprimé.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => remove(usr.user_id)}>Supprimer</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
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
