// Référentiel d'audit RGPD complet — Informatique & Web
// Couvre tous les domaines : gouvernance, droits, sécurité, sous-traitance, transferts, etc.

export type Question = {
  id: string;
  text: string;
  help?: string;
  reference?: string; // article RGPD / CNIL
  weight?: number; // poids pour le scoring (1-3)
  /** Exigence légale explicite (RGPD/CNIL). Si non défini, déduit de la référence / du poids. */
  mandatory?: boolean;
};

import {
  QUESTION_OBLIGATIONS,
  OBLIGATION_LABELS,
  type ObligationStatus,
  type ObligationInfo,
} from "./rgpdObligations";

export type { ObligationStatus, ObligationInfo };

/** Statut d'obligation juridique d'une question (corrigé question par question). */
export function obligationOf(q: Question): ObligationInfo {
  const o = QUESTION_OBLIGATIONS[q.id];
  if (o) return o;
  if (typeof q.mandatory === "boolean") return { status: q.mandatory ? "obligatoire" : "non_obligatoire" };
  return { status: q.reference ? "conditionnel" : "recommande" };
}

/** Vrai uniquement pour une exigence légale directe (hors "si applicable"). */
export function isMandatory(q: Question): boolean {
  return obligationOf(q).status === "obligatoire";
}

export const mandatoryLabel = (q: Question) => OBLIGATION_LABELS[obligationOf(q).status];
export const mandatoryNote = (q: Question) => obligationOf(q).note;




export type Category = {
  id: string;
  name: string;
  icon: string; // nom lucide
  description: string;
  questions: Question[];
};

export const RGPD_REFERENTIAL: Category[] = [
  {
    id: "gouvernance",
    name: "Gouvernance & Pilotage",
    icon: "Building2",
    description: "Organisation, responsabilités et pilotage de la conformité RGPD",
    questions: [
      { id: "gov-01", text: "Un Délégué à la Protection des Données (DPO) a-t-il été désigné ?", reference: "Art. 37", weight: 3 },
      { id: "gov-02", text: "Si DPO désigné, ses coordonnées ont-elles été communiquées à la CNIL ?", reference: "Art. 37.7" },
      { id: "gov-03", text: "Les coordonnées du DPO sont-elles publiées (site web, mentions légales) ?", reference: "Art. 37.7" },
      { id: "gov-04", text: "Le DPO dispose-t-il des ressources nécessaires (temps, budget, formation) ?", reference: "Art. 38", weight: 2 },
      { id: "gov-05", text: "Le DPO est-il associé à toutes les questions relatives à la protection des données ?", reference: "Art. 38.1" },
      { id: "gov-06", text: "Une politique interne de protection des données est-elle formalisée ?", weight: 2 },
      { id: "gov-07", text: "Cette politique est-elle communiquée à l'ensemble du personnel ?" },
      { id: "gov-08", text: "Un comité ou référent RGPD est-il en place dans chaque service métier ?" },
      { id: "gov-09", text: "Un budget annuel est-il alloué à la conformité RGPD ?" },
      { id: "gov-10", text: "La direction est-elle régulièrement informée du niveau de conformité ?", weight: 2 },
      { id: "gov-11", text: "Une cartographie des traitements est-elle tenue à jour ?", reference: "Art. 30", weight: 3 },
      { id: "gov-12", text: "Un plan d'audit interne RGPD est-il défini et exécuté ?" },
      { id: "gov-13", text: "Existe-t-il un représentant en UE si l'organisme est hors UE ?", reference: "Art. 27" },
    ],
  },
  {
    id: "registre",
    name: "Registre des traitements (Art. 30)",
    icon: "FileText",
    description: "Tenue et exhaustivité du registre des activités de traitement",
    questions: [
      { id: "reg-01", text: "Un registre des traitements responsable est-il tenu ?", reference: "Art. 30.1", weight: 3 },
      { id: "reg-02", text: "Un registre des traitements sous-traitant est-il tenu (le cas échéant) ?", reference: "Art. 30.2" },
      { id: "reg-03", text: "Le registre identifie-t-il le responsable de traitement et son DPO ?" },
      { id: "reg-04", text: "La finalité de chaque traitement est-elle clairement définie ?", weight: 2 },
      { id: "reg-05", text: "Les catégories de personnes concernées sont-elles identifiées ?" },
      { id: "reg-06", text: "Les catégories de données traitées sont-elles listées ?" },
      { id: "reg-07", text: "La base légale est-elle précisée pour chaque traitement ?", reference: "Art. 6", weight: 3 },
      { id: "reg-08", text: "Les destinataires (internes/externes) sont-ils listés ?" },
      { id: "reg-09", text: "Les durées de conservation sont-elles définies et justifiées ?", weight: 2 },
      { id: "reg-10", text: "Les transferts hors UE sont-ils documentés avec garanties associées ?" },
      { id: "reg-11", text: "Une description générale des mesures de sécurité est-elle présente ?" },
      { id: "reg-12", text: "Le registre est-il revu et mis à jour au moins annuellement ?", weight: 2 },
      { id: "reg-13", text: "Le registre traite-t-il aussi les données RH (paie, recrutement, formation) ?" },
      { id: "reg-14", text: "Le registre traite-t-il les données clients/prospects ?" },
      { id: "reg-15", text: "Le registre traite-t-il la vidéosurveillance / contrôle d'accès ?" },
    ],
  },
  {
    id: "bases-legales",
    name: "Bases légales & Consentement",
    icon: "Scale",
    description: "Licéité des traitements et gestion du consentement",
    questions: [
      { id: "leg-01", text: "Chaque traitement repose-t-il sur une base légale identifiée ?", reference: "Art. 6", weight: 3 },
      { id: "leg-02", text: "Quand le consentement est utilisé, est-il libre, spécifique, éclairé et univoque ?", reference: "Art. 7", weight: 3 },
      { id: "leg-03", text: "Le consentement est-il recueilli par un acte positif clair (case non pré-cochée) ?", weight: 2 },
      { id: "leg-04", text: "Existe-t-il une preuve traçable du consentement (date, version, IP) ?", weight: 2 },
      { id: "leg-05", text: "Le retrait du consentement est-il aussi simple que son recueil ?", reference: "Art. 7.3" },
      { id: "leg-06", text: "Pour les mineurs <15 ans, le consentement parental est-il vérifié ?", reference: "Art. 8" },
      { id: "leg-07", text: "L'intérêt légitime fait-il l'objet d'un test de mise en balance documenté ?" },
      { id: "leg-08", text: "Les conditions générales sont-elles distinctes du consentement marketing ?" },
      { id: "leg-09", text: "Le consentement est-il granulaire (par finalité) ?", weight: 2 },
    ],
  },
  {
    id: "information",
    name: "Information des personnes",
    icon: "Megaphone",
    description: "Transparence et information des personnes concernées",
    questions: [
      { id: "info-01", text: "Une politique de confidentialité accessible est-elle publiée ?", reference: "Art. 12-13", weight: 3 },
      { id: "info-02", text: "L'identité du responsable de traitement est-elle mentionnée ?" },
      { id: "info-03", text: "Les coordonnées du DPO sont-elles indiquées ?" },
      { id: "info-04", text: "Les finalités et bases légales sont-elles précisées ?", weight: 2 },
      { id: "info-05", text: "Les destinataires des données sont-ils mentionnés ?" },
      { id: "info-06", text: "Les durées de conservation sont-elles indiquées ?", weight: 2 },
      { id: "info-07", text: "Les droits des personnes sont-ils détaillés (accès, rectification, etc.) ?", weight: 2 },
      { id: "info-08", text: "Les modalités d'exercice des droits sont-elles expliquées ?" },
      { id: "info-09", text: "Le droit d'introduire une réclamation auprès de la CNIL est-il mentionné ?" },
      { id: "info-10", text: "Les transferts hors UE et garanties associées sont-ils mentionnés ?" },
      { id: "info-11", text: "L'existence d'une décision automatisée/profilage est-elle mentionnée ?", reference: "Art. 22" },
      { id: "info-12", text: "L'information est-elle fournie au moment de la collecte ?" },
      { id: "info-13", text: "Les formulaires comportent-ils une mention d'information concise ?" },
      { id: "info-14", text: "L'information est-elle adaptée si données collectées indirectement ?", reference: "Art. 14" },
    ],
  },
  {
    id: "droits",
    name: "Droits des personnes",
    icon: "UserCheck",
    description: "Exercice des droits : accès, rectification, effacement, etc.",
    questions: [
      { id: "dr-01", text: "Une procédure de gestion des demandes d'exercice de droits existe-t-elle ?", weight: 3 },
      { id: "dr-02", text: "Les délais de réponse (1 mois) sont-ils respectés ?", reference: "Art. 12.3", weight: 3 },
      { id: "dr-03", text: "L'identité du demandeur est-elle vérifiée de façon proportionnée ?" },
      { id: "dr-04", text: "Le droit d'accès est-il opérationnel ?", reference: "Art. 15", weight: 2 },
      { id: "dr-05", text: "Le droit de rectification est-il opérationnel ?", reference: "Art. 16" },
      { id: "dr-06", text: "Le droit à l'effacement est-il opérationnel ?", reference: "Art. 17", weight: 2 },
      { id: "dr-07", text: "Le droit à la limitation est-il opérationnel ?", reference: "Art. 18" },
      { id: "dr-08", text: "Le droit à la portabilité est-il opérationnel (format structuré) ?", reference: "Art. 20" },
      { id: "dr-09", text: "Le droit d'opposition est-il opérationnel ?", reference: "Art. 21", weight: 2 },
      { id: "dr-10", text: "Le droit de ne pas faire l'objet d'une décision automatisée est-il garanti ?", reference: "Art. 22" },
      { id: "dr-11", text: "Un registre des demandes d'exercice de droits est-il tenu ?" },
      { id: "dr-12", text: "Le personnel d'accueil/support est-il formé à orienter les demandes ?" },
      { id: "dr-13", text: "Les modifications/effacements sont-ils répercutés chez les destinataires ?", reference: "Art. 19" },
      { id: "dr-14", text: "Des directives post-mortem peuvent-elles être prises en compte ?" },
    ],
  },
  {
    id: "securite",
    name: "Sécurité des données",
    icon: "ShieldCheck",
    description: "Mesures techniques et organisationnelles de sécurité",
    questions: [
      { id: "sec-01", text: "Une politique de sécurité des SI (PSSI) est-elle formalisée ?", weight: 3 },
      { id: "sec-02", text: "Les accès aux données sont-ils gérés selon le principe du moindre privilège ?", weight: 3 },
      { id: "sec-03", text: "Les comptes sont-ils nominatifs (pas de comptes partagés) ?", weight: 2 },
      { id: "sec-04", text: "Une politique de mots de passe robuste est-elle appliquée ?", weight: 2 },
      { id: "sec-05", text: "L'authentification multi-facteurs (MFA) est-elle déployée sur les accès sensibles ?", weight: 3 },
      { id: "sec-06", text: "Les sessions sont-elles automatiquement fermées après inactivité ?" },
      { id: "sec-07", text: "Les habilitations sont-elles revues régulièrement (au moins annuellement) ?", weight: 2 },
      { id: "sec-08", text: "Les départs/mobilités déclenchent-ils immédiatement la révocation des accès ?", weight: 2 },
      { id: "sec-09", text: "Les données sensibles sont-elles chiffrées au repos ?", weight: 3 },
      { id: "sec-10", text: "Les flux contenant des données personnelles sont-ils chiffrés (TLS 1.2+) ?", weight: 3 },
      { id: "sec-11", text: "Les sauvegardes sont-elles régulières, chiffrées et testées ?", weight: 3 },
      { id: "sec-12", text: "Existe-t-il un plan de reprise/continuité d'activité (PRA/PCA) ?", weight: 2 },
      { id: "sec-13", text: "Les postes de travail sont-ils protégés (antivirus, EDR, MAJ, chiffrement disque) ?", weight: 2 },
      { id: "sec-14", text: "Un pare-feu et une segmentation réseau sont-ils en place ?" },
      { id: "sec-15", text: "Un système de détection d'intrusion (IDS/IPS/SIEM) est-il déployé ?" },
      { id: "sec-16", text: "Les logs d'accès et d'événements sécurité sont-ils centralisés et conservés ?", weight: 2 },
      { id: "sec-17", text: "Les vulnérabilités sont-elles supervisées (scan, veille CERT, patch management) ?", weight: 2 },
      { id: "sec-18", text: "Des tests d'intrusion sont-ils réalisés périodiquement ?" },
      { id: "sec-19", text: "Les supports amovibles sont-ils contrôlés / chiffrés ?" },
      { id: "sec-20", text: "Une procédure de destruction sécurisée des supports est-elle définie ?", weight: 2 },
      { id: "sec-21", text: "Les locaux abritant les données sont-ils sécurisés (badges, vidéo, alarme) ?" },
      { id: "sec-22", text: "Le télétravail est-il encadré (VPN, MDM, charte) ?" },
      { id: "sec-23", text: "Le BYOD est-il encadré ou interdit ?" },
      { id: "sec-24", text: "Le développement applicatif suit-il une démarche secure-by-design ?", reference: "Art. 25", weight: 2 },
      { id: "sec-25", text: "Les environnements de dev/recette sont-ils cloisonnés (pas de prod réelle) ?", weight: 2 },
      { id: "sec-26", text: "Une revue de code / SAST / DAST est-elle effectuée ?" },
      { id: "sec-27", text: "L'API et les services exposés sont-ils protégés (WAF, rate-limit) ?" },
      { id: "sec-28", text: "La pseudonymisation est-elle utilisée quand pertinent ?", reference: "Art. 32" },
      { id: "sec-29", text: "Une procédure de gestion des incidents de sécurité est-elle formalisée ?", weight: 2 },
      { id: "sec-30", text: "Les utilisateurs sont-ils sensibilisés au phishing (campagnes simulées) ?" },
    ],
  },
  {
    id: "violations",
    name: "Violations de données",
    icon: "AlertTriangle",
    description: "Détection, notification et gestion des data breaches",
    questions: [
      { id: "vio-01", text: "Une procédure de notification des violations est-elle formalisée ?", reference: "Art. 33", weight: 3 },
      { id: "vio-02", text: "Les délais de notification CNIL (72h) sont-ils respectables ?", weight: 3 },
      { id: "vio-03", text: "Un registre des violations est-il tenu ?", reference: "Art. 33.5", weight: 2 },
      { id: "vio-04", text: "L'évaluation du risque pour les personnes est-elle documentée ?" },
      { id: "vio-05", text: "L'information des personnes est-elle prévue en cas de risque élevé ?", reference: "Art. 34" },
      { id: "vio-06", text: "Le personnel sait-il identifier et remonter une violation ?", weight: 2 },
      { id: "vio-07", text: "Les sous-traitants sont-ils tenus de notifier sans délai ?" },
      { id: "vio-08", text: "Des exercices de simulation de violation sont-ils effectués ?" },
    ],
  },
  {
    id: "sous-traitance",
    name: "Sous-traitance",
    icon: "Network",
    description: "Encadrement contractuel et suivi des sous-traitants",
    questions: [
      { id: "st-01", text: "Une cartographie des sous-traitants est-elle tenue ?", weight: 2 },
      { id: "st-02", text: "Un contrat de sous-traitance (DPA) Art. 28 est-il signé avec chacun ?", reference: "Art. 28", weight: 3 },
      { id: "st-03", text: "Le DPA prévoit-il les 8 mentions obligatoires ?", weight: 2 },
      { id: "st-04", text: "Les sous-traitants ultérieurs sont-ils encadrés (autorisation, mêmes obligations) ?" },
      { id: "st-05", text: "Les garanties suffisantes des sous-traitants sont-elles évaluées avant contractualisation ?", weight: 2 },
      { id: "st-06", text: "Des audits/certifications des sous-traitants sont-ils exigés ?" },
      { id: "st-07", text: "Le sort des données en fin de contrat est-il prévu (restitution/destruction) ?", weight: 2 },
      { id: "st-08", text: "Les sous-traitants hors UE sont-ils encadrés par CCT/BCR/autre ?" },
      { id: "st-09", text: "Un suivi annuel de conformité des sous-traitants est-il effectué ?" },
    ],
  },
  {
    id: "transferts",
    name: "Transferts internationaux",
    icon: "Globe",
    description: "Transferts de données hors UE/EEE",
    questions: [
      { id: "tr-01", text: "Les transferts hors UE sont-ils identifiés et cartographiés ?", reference: "Chap. V", weight: 3 },
      { id: "tr-02", text: "Les pays destinataires bénéficient-ils d'une décision d'adéquation ?", reference: "Art. 45" },
      { id: "tr-03", text: "À défaut, des Clauses Contractuelles Types (CCT 2021) sont-elles signées ?", reference: "Art. 46", weight: 3 },
      { id: "tr-04", text: "Un Transfer Impact Assessment (TIA) est-il réalisé après l'arrêt Schrems II ?", weight: 2 },
      { id: "tr-05", text: "Des mesures supplémentaires (chiffrement, pseudonymisation) sont-elles mises en place si nécessaire ?", weight: 2 },
      { id: "tr-06", text: "Les BCR sont-ils en place pour les groupes multinationaux le cas échéant ?", reference: "Art. 47" },
      { id: "tr-07", text: "Les utilisateurs sont-ils informés des transferts ?" },
      { id: "tr-08", text: "L'usage d'outils US (Google, Microsoft, AWS) fait-il l'objet d'un encadrement spécifique ?" },
    ],
  },
  {
    id: "aipd",
    name: "AIPD / DPIA",
    icon: "ClipboardCheck",
    description: "Analyse d'impact relative à la protection des données",
    questions: [
      { id: "aipd-01", text: "Une procédure d'évaluation préalable du besoin d'AIPD est-elle en place ?", reference: "Art. 35", weight: 2 },
      { id: "aipd-02", text: "Les traitements à risque élevé sont-ils identifiés ?", weight: 3 },
      { id: "aipd-03", text: "Une AIPD est-elle réalisée pour les traitements concernés ?", weight: 3 },
      { id: "aipd-04", text: "L'AIPD couvre-t-elle description, proportionnalité, risques, mesures ?" },
      { id: "aipd-05", text: "Le DPO est-il consulté pour chaque AIPD ?", reference: "Art. 35.2" },
      { id: "aipd-06", text: "Les personnes concernées sont-elles consultées si pertinent ?" },
      { id: "aipd-07", text: "Les AIPD sont-elles revues en cas d'évolution du traitement ?" },
      { id: "aipd-08", text: "La CNIL est-elle consultée si risque résiduel élevé ?", reference: "Art. 36" },
    ],
  },
  {
    id: "minimisation",
    name: "Principes & Minimisation",
    icon: "Filter",
    description: "Respect des principes fondamentaux du RGPD",
    questions: [
      { id: "min-01", text: "Le principe de minimisation est-il appliqué (collecte limitée au nécessaire) ?", reference: "Art. 5.1.c", weight: 3 },
      { id: "min-02", text: "Le principe de limitation des finalités est-il respecté ?", reference: "Art. 5.1.b", weight: 2 },
      { id: "min-03", text: "L'exactitude des données est-elle garantie (mise à jour) ?", reference: "Art. 5.1.d" },
      { id: "min-04", text: "Les données sont-elles supprimées/anonymisées à l'échéance ?", reference: "Art. 5.1.e", weight: 3 },
      { id: "min-05", text: "Le principe d'intégrité et de confidentialité est-il respecté ?", reference: "Art. 5.1.f", weight: 2 },
      { id: "min-06", text: "Le responsable peut-il démontrer sa conformité (accountability) ?", reference: "Art. 5.2", weight: 3 },
      { id: "min-07", text: "Les formulaires limitent-ils les champs obligatoires au strict nécessaire ?" },
      { id: "min-08", text: "Les exports/extractions sont-ils filtrés au strict besoin ?" },
    ],
  },
  {
    id: "privacy-by-design",
    name: "Privacy by Design & by Default",
    icon: "PencilRuler",
    description: "Protection dès la conception et par défaut",
    questions: [
      { id: "pbd-01", text: "La protection des données est-elle intégrée dès la conception des projets ?", reference: "Art. 25", weight: 3 },
      { id: "pbd-02", text: "Un check-list RGPD est-il intégré au processus projet ?", weight: 2 },
      { id: "pbd-03", text: "Les paramètres par défaut sont-ils les plus protecteurs (privacy by default) ?", weight: 2 },
      { id: "pbd-04", text: "Le DPO est-il consulté en phase de cadrage ?" },
      { id: "pbd-05", text: "Les besoins de pseudonymisation/anonymisation sont-ils étudiés en amont ?" },
      { id: "pbd-06", text: "Les jeux de tests utilisent-ils des données anonymisées/synthétiques ?", weight: 2 },
    ],
  },
  {
    id: "site-web",
    name: "Site Web & Cookies",
    icon: "Globe2",
    description: "Conformité du site web, cookies et traceurs",
    questions: [
      { id: "web-01", text: "Une bannière de consentement aux cookies conforme est-elle présente ?", weight: 3 },
      { id: "web-02", text: "L'utilisateur peut-il refuser aussi facilement qu'accepter ?", weight: 3 },
      { id: "web-03", text: "Les cookies non essentiels sont-ils bloqués avant consentement ?", weight: 3 },
      { id: "web-04", text: "Une page « Gestion des cookies » détaille-t-elle chaque traceur (finalité, durée, éditeur) ?", weight: 2 },
      { id: "web-05", text: "Le choix du visiteur est-il conservé max 6 mois ?" },
      { id: "web-06", text: "Une politique de confidentialité est-elle accessible depuis chaque page ?", weight: 2 },
      { id: "web-07", text: "Les mentions légales sont-elles complètes et à jour ?" },
      { id: "web-08", text: "Les formulaires comportent-ils une mention RGPD claire ?" },
      { id: "web-09", text: "Les outils analytics sont-ils configurés en mode exempté ou avec consentement ?" },
      { id: "web-10", text: "Les pixels publicitaires (Meta, TikTok, etc.) sont-ils conditionnés au consentement ?", weight: 2 },
      { id: "web-11", text: "Le site est-il en HTTPS sur toutes les pages ?", weight: 2 },
      { id: "web-12", text: "Les en-têtes de sécurité (CSP, HSTS, X-Frame-Options) sont-ils configurés ?" },
    ],
  },
  {
    id: "marketing",
    name: "Marketing & Prospection",
    icon: "Mail",
    description: "Acquisition de contacts et prospection commerciale",
    questions: [
      { id: "mk-01", text: "La prospection B2C par email/SMS repose-t-elle sur consentement ?", weight: 3 },
      { id: "mk-02", text: "La prospection B2B respecte-t-elle l'objet du destinataire ?", weight: 2 },
      { id: "mk-03", text: "Tout email marketing comporte-t-il un lien de désinscription opérationnel ?", weight: 3 },
      { id: "mk-04", text: "Les listes de désinscription (suppression list) sont-elles gérées ?", weight: 2 },
      { id: "mk-05", text: "Les bases prospects achetées/louées sont-elles conformes (preuve d'opt-in) ?", weight: 2 },
      { id: "mk-06", text: "La conservation des prospects est-elle limitée (3 ans après dernier contact CNIL) ?", weight: 2 },
      { id: "mk-07", text: "Les enrichissements (LinkedIn, scraping) sont-ils encadrés ?" },
      { id: "mk-08", text: "Le profilage marketing fait-il l'objet d'une information spécifique ?" },
      { id: "mk-09", text: "Les jeux-concours respectent-ils les règles RGPD (consentement marketing distinct) ?" },
      { id: "mk-10", text: "Le scoring/segmentation est-il documenté ?" },
    ],
  },
  {
    id: "rh",
    name: "Ressources Humaines",
    icon: "Users",
    description: "Données salariés, candidats, instances représentatives",
    questions: [
      { id: "rh-01", text: "Les candidats sont-ils informés du traitement de leur CV ?", weight: 2 },
      { id: "rh-02", text: "Les CV sont-ils conservés max 2 ans après dernier contact ?" },
      { id: "rh-03", text: "Les salariés ont-ils reçu une note d'information RGPD ?", weight: 2 },
      { id: "rh-04", text: "Le CSE/IRP a-t-il été consulté sur les outils de surveillance ?" },
      { id: "rh-05", text: "Les outils de géolocalisation sont-ils proportionnés et encadrés ?" },
      { id: "rh-06", text: "Les outils de surveillance des messageries respectent-ils la vie privée ?" },
      { id: "rh-07", text: "Les évaluations professionnelles sont-elles communicables au salarié ?" },
      { id: "rh-08", text: "La conservation des données paie respecte-t-elle les durées légales ?", weight: 2 },
      { id: "rh-09", text: "Les variables de paie sensibles (santé) sont-elles protégées spécifiquement ?" },
      { id: "rh-10", text: "Les données des anciens salariés sont-elles archivées séparément ?", weight: 2 },
      { id: "rh-11", text: "Le télétravail prévoit-il une charte data ?" },
      { id: "rh-12", text: "Une charte informatique annexée au règlement intérieur est-elle en place ?" },
    ],
  },
  {
    id: "videosurveillance",
    name: "Vidéosurveillance & Biométrie",
    icon: "Camera",
    description: "Vidéoprotection, contrôle d'accès, données biométriques",
    questions: [
      { id: "vid-01", text: "Les caméras filment-elles uniquement les zones nécessaires (pas les postes de travail individuels) ?", weight: 2 },
      { id: "vid-02", text: "Une autorisation préfectorale est-elle obtenue si voie publique ?" },
      { id: "vid-03", text: "Les personnes filmées sont-elles informées (panneaux) ?", weight: 2 },
      { id: "vid-04", text: "La durée de conservation des images est-elle ≤ 1 mois ?", weight: 2 },
      { id: "vid-05", text: "Les accès aux images sont-ils restreints et tracés ?" },
      { id: "vid-06", text: "Les dispositifs biométriques font-ils l'objet d'une AIPD ?", weight: 3 },
      { id: "vid-07", text: "Le contrôle d'accès biométrique est-il justifié vs alternatives (badge) ?" },
    ],
  },
  {
    id: "donnees-sensibles",
    name: "Données sensibles",
    icon: "HeartPulse",
    description: "Catégories particulières (santé, religion, opinions, etc.)",
    questions: [
      { id: "ds-01", text: "Les traitements de données sensibles sont-ils identifiés ?", reference: "Art. 9", weight: 3 },
      { id: "ds-02", text: "Reposent-ils sur une exception explicite Art. 9.2 ?", weight: 3 },
      { id: "ds-03", text: "Les données de santé sont-elles hébergées chez un HDS si applicable ?", weight: 3 },
      { id: "ds-04", text: "Les données pénales respectent-elles l'Art. 10 ?" },
      { id: "ds-05", text: "Les accès aux données sensibles sont-ils strictement restreints et tracés ?", weight: 2 },
      { id: "ds-06", text: "Le chiffrement renforcé est-il appliqué aux données sensibles ?", weight: 2 },
    ],
  },
  {
    id: "formation",
    name: "Formation & Sensibilisation",
    icon: "GraduationCap",
    description: "Acculturation du personnel à la protection des données",
    questions: [
      { id: "fo-01", text: "Un plan de formation RGPD annuel est-il en place ?", weight: 2 },
      { id: "fo-02", text: "Tous les nouveaux arrivants reçoivent-ils une formation initiale ?", weight: 2 },
      { id: "fo-03", text: "Les profils à risque (RH, IT, Marketing) bénéficient-ils de formations renforcées ?" },
      { id: "fo-04", text: "Des actions de sensibilisation régulières sont-elles menées ?" },
      { id: "fo-05", text: "Le suivi des formations est-il documenté (émargements, attestations) ?" },
      { id: "fo-06", text: "Une évaluation des connaissances est-elle effectuée ?" },
    ],
  },
  {
    id: "ia",
    name: "Intelligence Artificielle",
    icon: "BrainCircuit",
    description: "Conformité des usages IA et décisions automatisées",
    questions: [
      { id: "ia-01", text: "Les usages d'IA traitant des données personnelles sont-ils recensés ?", weight: 2 },
      { id: "ia-02", text: "Les décisions automatisées font-elles l'objet d'une information spécifique ?", reference: "Art. 22", weight: 2 },
      { id: "ia-03", text: "Une intervention humaine est-elle prévue pour contester une décision automatisée ?", weight: 2 },
      { id: "ia-04", text: "Les biais des modèles sont-ils évalués ?" },
      { id: "ia-05", text: "L'usage d'IA générative (ChatGPT, etc.) fait-il l'objet d'une charte ?", weight: 2 },
      { id: "ia-06", text: "Les données personnelles sont-elles exclues des prompts envoyés aux IA externes ?", weight: 2 },
      { id: "ia-07", text: "L'AI Act est-il anticipé pour les systèmes à risque ?" },
    ],
  },
];

export const COMPLIANCE_LEVELS = {
  conforme: { label: "Conforme", color: "success", score: 100 },
  partiel: { label: "Partiellement conforme", color: "warning", score: 50 },
  non_conforme: { label: "Non conforme", color: "destructive", score: 0 },
  non_applicable: { label: "Non applicable", color: "muted", score: null },
  ne_sait_pas: { label: "Ne sait pas", color: "muted", score: null },
  a_evaluer: { label: "À évaluer", color: "muted", score: null },

} as const;

export const PRIORITY_META = {
  critique: { label: "Critique", color: "destructive" },
  haute: { label: "Haute", color: "warning" },
  moyenne: { label: "Moyenne", color: "info" },
  basse: { label: "Basse", color: "muted" },
} as const;

export const ACTION_STATUS_META = {
  a_faire: { label: "À faire", color: "muted" },
  en_cours: { label: "En cours", color: "info" },
  fait: { label: "Fait", color: "success" },
  conforme: { label: "Conforme", color: "success" },
  non_applicable: { label: "Non applicable", color: "muted" },
  reporte: { label: "Reporté", color: "warning" },
} as const;

export const AUDIT_STATUS_META = {
  draft: { label: "Brouillon", color: "muted" },
  in_progress: { label: "En cours", color: "info" },
  completed: { label: "Terminé", color: "success" },
  archived: { label: "Archivé", color: "muted" },
} as const;

export function computeCategoryScore(
  category: Category,
  responses: Record<string, { level: keyof typeof COMPLIANCE_LEVELS }>
): { score: number; total: number; answered: number } {
  let score = 0;
  let total = 0;
  let answered = 0;
  for (const q of category.questions) {
    const r = responses[q.id];
    const w = q.weight ?? 1;
    if (!r || r.level === "a_evaluer") continue;
    // Tout choix autre que "À évaluer" compte comme évalué (y compris "Non applicable")
    answered++;
    if (r.level === "non_applicable" || r.level === "ne_sait_pas") continue; // exclu du scoring
    total += w * 100;
    score += w * (COMPLIANCE_LEVELS[r.level].score ?? 0);
  }

  return { score, total, answered };
}

export function computeGlobalScore(
  responses: Record<string, { level: keyof typeof COMPLIANCE_LEVELS }>
): number {
  let score = 0;
  let total = 0;
  for (const cat of RGPD_REFERENTIAL) {
    const c = computeCategoryScore(cat, responses);
    score += c.score;
    total += c.total;
  }
  return total === 0 ? 0 : Math.round((score / total) * 100);
}

export function totalQuestions(): number {
  return RGPD_REFERENTIAL.reduce((sum, c) => sum + c.questions.length, 0);
}

export const LEGAL_BASIS_LABELS: Record<string, string> = {
  consentement: "Consentement",
  contrat: "Exécution d'un contrat",
  obligation_legale: "Obligation légale",
  interets_vitaux: "Sauvegarde des intérêts vitaux",
  mission_interet_public: "Mission d'intérêt public",
  interets_legitimes: "Intérêts légitimes",
};

// Modèles documentaires fournis dans la bibliothèque
export const DEFAULT_DOCUMENTS = [
  {
    title: "Politique de confidentialité (modèle)",
    category: "Information",
    description: "Modèle de politique de confidentialité conforme RGPD à adapter.",
  },
  {
    title: "Mentions d'information formulaire (modèle court)",
    category: "Information",
    description: "Mention concise à intégrer aux formulaires de collecte.",
  },
  {
    title: "Contrat de sous-traitance (DPA Art. 28)",
    category: "Sous-traitance",
    description: "Modèle de contrat de sous-traitance conforme à l'Art. 28.",
  },
  {
    title: "Registre des traitements (modèle)",
    category: "Registre",
    description: "Modèle de registre Art. 30.",
  },
  {
    title: "Procédure d'exercice des droits",
    category: "Droits",
    description: "Procédure interne de gestion des demandes d'exercice de droits.",
  },
  {
    title: "Procédure de gestion des violations",
    category: "Sécurité",
    description: "Procédure de notification CNIL sous 72h.",
  },
  {
    title: "Charte informatique salariés",
    category: "RH",
    description: "Charte d'usage des outils numériques à annexer au règlement intérieur.",
  },
  {
    title: "AIPD - Modèle CNIL",
    category: "AIPD",
    description: "Trame d'analyse d'impact relative à la protection des données.",
  },
  {
    title: "Clauses Contractuelles Types (CCT 2021)",
    category: "Transferts",
    description: "Modèle officiel UE pour transferts hors UE.",
  },
  {
    title: "Charte usage de l'IA générative",
    category: "IA",
    description: "Encadrement de l'usage des outils d'IA générative en entreprise.",
  },
];