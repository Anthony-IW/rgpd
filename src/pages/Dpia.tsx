import { ShieldCheck } from "lucide-react";
import { ComplianceModule } from "@/components/ComplianceModule";
import { DPIA_STATUS } from "@/data/complianceMeta";

export default function Dpia() {
  return (
    <ComplianceModule
      title="Analyses d'impact (DPIA)"
      description="Analyses d'impact relatives aux traitements à haut risque"
      icon={ShieldCheck}
      table="dpia"
      moduleKey="dpia"
      exportTitle="Registre des analyses d'impact"
      fields={[
        { key: "title", label: "Titre", type: "text", required: true },
        { key: "audit_id", label: "Audit lié", type: "relation", relation: { table: "audits", labelField: "title", filterByCompany: true } },
        { key: "processing_record_id", label: "Traitement lié", type: "relation", relation: { table: "processing_records", labelField: "name", filterByCompany: true } },
        { key: "necessity_assessment", label: "Évaluation de la nécessité", type: "textarea", rows: 3 },
        { key: "proportionality_assessment", label: "Évaluation de la proportionnalité", type: "textarea", rows: 3 },
        { key: "risk_assessment", label: "Évaluation des risques", type: "textarea", rows: 3 },
        { key: "measures", label: "Mesures envisagées", type: "textarea", rows: 3 },
        { key: "residual_risk_score", label: "Risque résiduel (1-5)", type: "number" },
        { key: "status", label: "Statut", type: "select", options: Object.entries(DPIA_STATUS).map(([value, label]) => ({ value, label })) },
      ]}
      listFields={["title", "audit_id", "processing_record_id", "residual_risk_score", "status"]}
      statusField="status"
      filterFields={["title", "status"]}
    />
  );
}
