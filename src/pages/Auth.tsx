import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().trim().email("Email invalide").max(255);
const passwordSchema = z.string().min(8, "8 caractères minimum").max(72);

export default function Auth() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => { document.title = "Connexion | Audit RGPD - Informatique & Web"; }, []);

  if (user) return <Navigate to="/" replace />;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email); passwordSchema.parse(password);
    } catch (err: any) { toast.error(err.errors?.[0]?.message ?? "Champs invalides"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Bienvenue !"); navigate("/"); }
  };




  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error("Connexion Google impossible"); setLoading(false); return; }
    if (result.redirected) return;
    navigate("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-subtle p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo className="h-20 w-20 drop-shadow-lg" />
          <h1 className="mt-4 text-2xl font-bold text-phoenix">Informatique & Web</h1>
          <p className="text-sm text-muted-foreground">Plateforme d'audit RGPD professionnelle</p>
        </div>
        <Card className="shadow-elegant border-2">
          <CardHeader>
            <CardTitle>Accès auditeur</CardTitle>
            <CardDescription>Connectez-vous pour piloter vos audits</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Créer un compte</TabsTrigger>
              </TabsList>
              <TabsContent value="signin" className="space-y-3 pt-4">
                <form onSubmit={handleSignIn} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="email-in">Email</Label>
                    <Input id="email-in" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pwd-in">Mot de passe</Label>
                    <Input id="pwd-in" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-primary" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Se connecter
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup" className="space-y-3 pt-4">
                <form onSubmit={handleSignUp} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name-up">Nom complet</Label>
                    <Input id="name-up" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email-up">Email</Label>
                    <Input id="email-up" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pwd-up">Mot de passe (min 8)</Label>
                    <Input id="pwd-up" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-primary" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Créer mon compte
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase text-muted-foreground">ou</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
              Continuer avec Google
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}