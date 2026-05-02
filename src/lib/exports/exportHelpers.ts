export const today = () => new Date().toISOString().slice(0, 10);

export const slug = (s: string) =>
  (s || "export")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 60);

export const fileName = (base: string, ext: "pdf" | "xlsx", company?: string) =>
  [slug(base), company ? slug(company) : null, today()].filter(Boolean).join("_") + "." + ext;

export const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-FR") : "";

export const fmtBool = (b: any) => (b ? "Oui" : "Non");

export const joinList = (a: any) => (Array.isArray(a) ? a.join(", ") : a ?? "");

export function escapeHtml(s: any): string {
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}