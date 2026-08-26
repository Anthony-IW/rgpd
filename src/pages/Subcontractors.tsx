import { Handshake } from "lucide-react";
import { ComplianceModule } from "@/components/ComplianceModule";
import { SAFEGUARDS_OPTIONS } from "@/data/complianceMeta";
import { fmtDate } from "@/lib/exports/exportHelpers";

export default function Subcontractors() {
  return (
    <ComplianceModule
      title="Sous-traitants & DPA"
      description="Registre des sous-traitants et contrats Art. 28"
      icon={Handshake}
      table="subcontractors"
      moduleKey="sous_traitants"
      exportTitle="Registre des sous-traitants et DPA"
      fields={[
        { key: "name", label: "Nom", type: "text", required: true },
        { key: "contact_name", label: "Contact", type: "text" },
        { key: "contact_email", label: "Email", type: "text" },
        { key: "contact_phone", label: "Téléphone", type: "text" },
        { key: "country", label: "Pays", type: "text" },
        { key: "website", label: "Site web", type: "text" },
        { key: "dpa_signed_at", label: "DPA signé le", type: "date" },
        { key: "dpa_renewal_date", label: "Renouvellement DPA", type: "date" },
        { key: "safeguards", label: "Garanties", type: "select", options: SAFEGUARDS_OPTIONS },
        { key: "notes", label: "Notes", type: "textarea", rows: 3 },
      ]}
      listFields={["name", "dpa_signed_at", "dpa_renewal_date", "safeguards", "country", "contact_email"]}
      filterFields={["name", "contact_name", "country", "safeguards"]}
    />
  );
}
