import { TriangleAlert } from "lucide-react";
import { ComplianceModule } from "@/components/ComplianceModule";
import { BREACH_SEVERITY, BREACH_STATUS } from "@/data/complianceMeta";
import { fmtDate } from "@/lib/exports/exportHelpers";

export default function DataBreaches() {
  return (
    <ComplianceModule
      title="Violations de données"
      description="Registre des data breaches et notification CNIL"
      icon={TriangleAlert}
      table="data_breaches"
      moduleKey="violations_donnees"
      exportTitle="Registre des violations de données"
      fields={[
        { key: "discovery_at", label: "Découverte le", type: "datetime", required: true },
        { key: "notification_due_at", label: "Notification due avant", type: "datetime" },
        { key: "severity", label: "Gravité", type: "select", options: Object.entries(BREACH_SEVERITY).map(([value, { label }]) => ({ value, label })) },
        { key: "data_categories", label: "Catégories de données", type: "array", placeholder: "Données clients, données de santé..." },
        { key: "affected_count", label: "Personnes concernées", type: "number" },
        { key: "description", label: "Description", type: "textarea", rows: 3 },
        { key: "measures_taken", label: "Mesures prises", type: "textarea", rows: 3 },
        { key: "notified_cnil", label: "CNIL notifiée", type: "boolean" },
        { key: "notified_subjects", label: "Personnes notifiées", type: "boolean" },
        { key: "status", label: "Statut", type: "select", options: Object.entries(BREACH_STATUS).map(([value, label]) => ({ value, label })) },
        { key: "notes", label: "Notes", type: "textarea", rows: 2 },
      ]}
      listFields={["discovery_at", "severity", "affected_count", "notified_cnil", "notified_subjects", "status"]}
      statusField="status"
      filterFields={["description", "measures_taken", "status"]}
    />
  );
}
