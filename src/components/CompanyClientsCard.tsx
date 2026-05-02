import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, UserPlus, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

export function CompanyClientsCard({ companyId }: { companyId: string }) {
  const [clients, setClients] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ email: "", full_name: "", password: "" });
  const [createdInfo, setCreatedInfo] = useState<{ email: string; password: string } | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("company_users")
      .select("id, user_id, created_at, profiles:profiles!inner(email, full_name)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    setClients(data || []);
  };
  useEffect(() => { load(); }, [companyId]);

  const generatePwd = () => Math.random().toString(36).slice(-4) + Math.random().toString(36).slice(-4) + "!A1";

  const create = async () => {
    if (!form.email) return toast.error("Email requis");
    const pwd = form.password || generatePwd();
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("create-client-account", {
      body: { company_id: companyId, email: form.email, password: pwd, full_name: form.full_name },
    });
    setSubmitting(false);
    if (error || (data as any)?.error) {
      return toast.error((data as any)?.error || error?.message || "Erreur");
    }
    toast.success("Accès client créé");
    setCreatedInfo({ email: form.email, password: pwd });
    setForm({ email: "", full_name: "", password: "" });
    load();
  };

  const revoke = async (id: string) => {
    const { error } = await supabase.from("company_users").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Accès révoqué");
    load();
  };

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copié"); };

  return (
    <Card className="border-2">
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4 text-primary" />
          Accès clients ({clients.length})
        </CardTitle>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setCreatedInfo(null); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-primary"><UserPlus className="mr-1.5 h-4 w-4" />Inviter</Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
            <DialogHeader>
              <DialogTitle>Créer un accès client</DialogTitle>
            </DialogHeader>
            {createdInfo ? (
              <div className="space-y-3 py-2">
                <p className="text-sm">Compte créé. Communiquez ces identifiants au client :</p>
                <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-2">
                  <div className="flex items-center justify-between gap-2"><span><b>Email :</b> {createdInfo.email}</span>
                    <Button size="icon" variant="ghost" onClick={() => copy(createdInfo.email)}><Copy className="h-3.5 w-3.5" /></Button></div>
                  <div className="flex items-center justify-between gap-2"><span><b>Mot de passe :</b> <code>{createdInfo.password}</code></span>
                    <Button size="icon" variant="ghost" onClick={() => copy(createdInfo.password)}><Copy className="h-3.5 w-3.5" /></Button></div>
                </div>
                <p className="text-xs text-muted-foreground">⚠️ Ce mot de passe ne sera plus affiché. Pensez à le copier maintenant.</p>
                <DialogFooter><Button onClick={() => { setOpen(false); setCreatedInfo(null); }}>Fermer</Button></DialogFooter>
              </div>
            ) : (
              <div className="space-y-3 py-2">
                <div><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div><Label>Nom complet</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
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
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun accès client. Cliquez sur « Inviter » pour créer un compte.</p>
        ) : (
          <ul className="space-y-1.5">
            {clients.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{c.profiles?.full_name || c.profiles?.email || c.user_id}</div>
                  {c.profiles?.email && <div className="truncate text-xs text-muted-foreground">{c.profiles.email}</div>}
                </div>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => revoke(c.id)}><Trash2 className="h-4 w-4" /></Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}