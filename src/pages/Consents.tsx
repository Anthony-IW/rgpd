import { CheckCircle } from "lucide-react";
import { ComplianceModule } from "@/components/ComplianceModule";
import { CONSENT_STATUS } from "@/data/complianceMeta";
import { fmtDate } from "@/lib/exports/exportHelpers";

export default function Consents() {
  return (
    <ComplianceModule
      title="Consentements"
      description="Registre des consentements et preuves de recueil"
      icon={CheckCircle}
      table="consents"
      moduleKey="consentements"
      exportTitle="Registre des consentements"
      fields={[
        { key: "purpose", label: "Finalité", type: "text", required: true },
        { key: "form_version", label: "Version du formulaire", type: "text" },
        { key: "given_at", label: "Donné le", type: "datetime" },
        { key: "withdrawn_at", label: "Retiré le", type: "datetime" },
        { key: "proof", label: "Preuve (IP / hash)", type: "text" },
        { key: "status", label: "Statut", type: "select", options: Object.entries(CONSENT_STATUS).map(([value, label]) => ({ value, label })) },
        { key: "notes", label: "Notes", type: "textarea", rows: 3 },
      ]}
      listFields={["purpose", "form_version", "given_at", "withdrawn_at", "status"]}
      statusField="status"
      filterFields={["purpose", "form_version", "status"]}
    />
  );
}
