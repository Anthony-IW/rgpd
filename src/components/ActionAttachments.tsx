import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Paperclip, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export function ActionAttachments({ actionId, companyId }: { actionId: string; companyId: string }) {
  const { user } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("action_attachments").select("*").eq("action_id", actionId).order("created_at", { ascending: false });
    setFiles(data || []);
  };
  useEffect(() => { load(); }, [actionId]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const path = `${user.id}/${actionId}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage.from("action-attachments").upload(path, file);
    if (upErr) { setUploading(false); return toast.error(upErr.message); }
    const { error: insErr } = await supabase.from("action_attachments").insert({
      action_id: actionId, company_id: companyId, uploaded_by: user.id,
      file_path: path, file_name: file.name, file_size: file.size, mime_type: file.type,
    });
    setUploading(false);
    if (insErr) return toast.error(insErr.message);
    toast.success("Pièce jointe ajoutée");
    e.target.value = ""; load();
  };

  const onDownload = async (f: any) => {
    const { data, error } = await supabase.storage.from("action-attachments").createSignedUrl(f.file_path, 60);
    if (error || !data) return toast.error(error?.message || "Erreur");
    window.open(data.signedUrl, "_blank");
  };

  const onDelete = async (f: any) => {
    await supabase.storage.from("action-attachments").remove([f.file_path]);
    await supabase.from("action_attachments").delete().eq("id", f.id);
    load();
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <label className="inline-flex">
          <input type="file" className="hidden" onChange={onUpload} disabled={uploading} />
          <Button asChild size="sm" variant="outline" disabled={uploading}>
            <span className="cursor-pointer"><Paperclip className="mr-1.5 h-3.5 w-3.5" />{uploading ? "Envoi…" : "Ajouter une preuve"}</span>
          </Button>
        </label>
        <span className="text-xs text-muted-foreground">{files.length} pièce(s) jointe(s)</span>
      </div>
      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-2 rounded border p-1.5 text-xs">
              <span className="flex-1 truncate">{f.file_name}</span>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDownload(f)}><Download className="h-3.5 w-3.5" /></Button>
              {f.uploaded_by === user?.id && (
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onDelete(f)}><Trash2 className="h-3.5 w-3.5" /></Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}