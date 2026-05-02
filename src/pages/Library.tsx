import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BookOpen, FileText, Search } from "lucide-react";
import { DEFAULT_DOCUMENTS } from "@/data/rgpdReferential";
import { ExportMenu } from "@/components/ExportMenu";
import { exportLibraryXLSX } from "@/lib/exports/excelExport";
import { printTablePDF } from "@/lib/exports/pdfTable";

export default function Library() {
  const [q, setQ] = useState("");
  useEffect(() => { document.title = "Bibliothèque | RGPD"; }, []);
  const filtered = DEFAULT_DOCUMENTS.filter((d) => (d.title + d.category + d.description).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Bibliothèque documentaire"
        description="Modèles RGPD à fournir aux entreprises auditées"
        icon={BookOpen}
        actions={
          <ExportMenu
            disabled={filtered.length === 0}
            onPdf={() => printTablePDF({
              title: "Bibliothèque documentaire RGPD",
              columns: ["Titre", "Catégorie", "Description"],
              rows: filtered.map((d) => [d.title, d.category, d.description]),
            })}
            onExcel={() => exportLibraryXLSX(filtered)}
          />
        }
      />
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Rechercher un modèle..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((d) => (
          <Card key={d.title} className="border-2 transition-smooth hover:shadow-elegant">
            <CardContent className="p-5">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="rounded-lg bg-gradient-primary p-2"><FileText className="h-5 w-5 text-primary-foreground" /></div>
                <Badge variant="outline">{d.category}</Badge>
              </div>
              <h3 className="font-semibold leading-tight">{d.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}