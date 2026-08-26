import { FileQuestion } from "lucide-react";
import { ComplianceModule } from "@/components/ComplianceModule";
import { DRO_TYPES, DRO_STATUS } from "@/data/complianceMeta";
import { fmtDate } from "@/lib/exports/exportHelpers";

export default function DataSubjectRequests() {
  return (
    <ComplianceModule
      title="Demandes d'exercice des droits"
      description="Suivi des demandes DPO : accès, rectification, effacement, etc."
      icon={FileQuestion}
      table="data_subject_requests"
      moduleKey="demandes_droits"
      exportTitle="Registre des demandes d'exercice des droits"
      fields={[
        { key: "type", label: "Type de droit", type: "select", options: Object.entries(DRO_TYPES).map(([value, label]) => ({ value, label })), required: true },
        { key: "requester_name", label: "Demandeur", type: "text" },
        { key: "requester_email", label: "Email du demandeur", type: "text" },
        { key: "channel", label: "Canal", type: "text", placeholder: "Email, courrier, téléphone..." },
        { key: "received_at", label: "Reçue le", type: "date", required: true },
        { key: "response_due_at", label: "Réponse due le", type: "date" },
        { key: "status", label: "Statut", type: "select", options: Object.entries(DRO_STATUS).map(([value, label]) => ({ value, label })) },
        { key: "notes", label: "Notes", type: "textarea", rows: 3 },
      ]}
      listFields={["type", "requester_name", "received_at", "response_due_at", "status"]}
      statusField="status"
      filterFields={["type", "requester_name", "requester_email", "status"]}
    />
  );
}
