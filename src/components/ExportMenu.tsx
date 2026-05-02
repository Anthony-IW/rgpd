import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet } from "lucide-react";

export function ExportMenu({
  onPdf,
  onExcel,
  disabled,
  label = "Exporter",
}: {
  onPdf?: () => void;
  onExcel?: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <Download className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onPdf && (
          <DropdownMenuItem onClick={onPdf}>
            <FileText className="mr-2 h-4 w-4 text-primary" /> Exporter en PDF
          </DropdownMenuItem>
        )}
        {onExcel && (
          <DropdownMenuItem onClick={onExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4 text-accent" /> Exporter en Excel
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}