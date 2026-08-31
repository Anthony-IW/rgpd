// Statut d'obligation juridique par question (corrigé au regard du RGPD / doctrine CNIL)
// obligatoire        : exigence légale directe
// conditionnel       : "Obligatoire si applicable" (dépend du contexte du traitement)
// recommande         : bonne pratique / accountability, non imposé en tant que tel
// non_obligatoire    : aucune exigence juridique correspondante

export type ObligationStatus = "obligatoire" | "conditionnel" | "recommande" | "non_obligatoire";

export const OBLIGATION_LABELS: Record<ObligationStatus, string> = {
  obligatoire: "Obligatoire",
  conditionnel: "Obligatoire si applicable",
  recommande: "Recommandé",
  non_obligatoire: "Non obligatoire",
};

export type ObligationInfo = { status: ObligationStatus; note?: string };

export const QUESTION_OBLIGATIONS: Record<string, ObligationInfo> = {
  // 1. Gouvernance & Pilotage
  "gov-01": { status: "conditionnel", note: "DPO obligatoire notamment en cas de traitement à grande échelle de données de santé. Un professionnel de santé exerçant individuellement n'a pas automatiquement l'obligation d'en désigner un." },
  "gov-02": { status: "conditionnel", note: "Obligatoire si un DPO est désigné, même volontairement." },
  "gov-03": { status: "conditionnel", note: "Si DPO désigné, ses coordonnées de contact doivent être publiées. Son nom n'a pas nécessairement à l'être." },
  "gov-04": { status: "conditionnel", note: "Si DPO désigné." },
  "gov-05": { status: "conditionnel", note: "Si DPO désigné." },
  "gov-06": { status: "recommande", note: "Le RGPD exige des mesures organisationnelles et l'accountability, mais pas nécessairement un document intitulé « politique RGPD »." },
  "gov-07": { status: "recommande", note: "Dépend de l'organisation retenue." },
  "gov-08": { status: "non_obligatoire", note: "Aucun comité RGPD par service n'est exigé." },
  "gov-09": { status: "non_obligatoire", note: "Aucun montant ou budget RGPD spécifique n'est imposé." },
  "gov-10": { status: "recommande", note: "Participe à l'accountability." },
  "gov-11": { status: "recommande", note: "C'est le registre Art. 30 qui est juridiquement obligatoire ; une « cartographie » distincte ne l'est pas." },
  "gov-12": { status: "recommande", note: "Les vérifications périodiques sont utiles, mais aucun programme formel d'audit RGPD n'est systématiquement imposé." },
  "gov-13": { status: "conditionnel", note: "Organisme hors UE soumis à l'art. 3§2 et ne bénéficiant pas d'une exception de l'art. 27§2." },

  // 2. Registre des traitements
  "reg-01": { status: "obligatoire", note: "Données de santé et traitements non occasionnels : registre requis." },
  "reg-02": { status: "conditionnel", note: "Seulement si l'organisme agit lui-même comme sous-traitant pour le compte d'un autre responsable de traitement." },
  "reg-03": { status: "obligatoire", note: "Identité et coordonnées du responsable ; coordonnées du DPO seulement s'il existe." },
  "reg-04": { status: "obligatoire", note: "Finalités : mention Art. 30." },
  "reg-05": { status: "obligatoire", note: "Catégories de personnes concernées." },
  "reg-06": { status: "obligatoire", note: "Catégories de données." },
  "reg-07": { status: "recommande", note: "La base légale doit être déterminée, mais l'Art. 30 ne l'impose pas comme champ du registre. La CNIL recommande de l'y intégrer." },
  "reg-08": { status: "obligatoire", note: "Catégories de destinataires." },
  "reg-09": { status: "obligatoire", note: "Délais prévus pour l'effacement, lorsque possible." },
  "reg-10": { status: "conditionnel", note: "Si transferts hors UE/EEE." },
  "reg-11": { status: "obligatoire", note: "Description générale des mesures de sécurité, lorsque possible." },
  "reg-12": { status: "recommande", note: "Le registre doit être maintenu à jour ; aucune périodicité annuelle précise n'est imposée." },
  "reg-13": { status: "conditionnel", note: "Si l'organisme emploie du personnel et traite des données RH." },
  "reg-14": { status: "conditionnel", note: "Si traitements clients/prospects distincts. Les patients doivent évidemment être couverts dans le registre." },
  "reg-15": { status: "conditionnel", note: "Si vidéosurveillance ou contrôle d'accès comportant des données personnelles." },

  // 3. Bases légales & Consentement
  "leg-01": { status: "obligatoire", note: "Chaque traitement doit avoir une base juridique." },
  "leg-02": { status: "conditionnel", note: "Si le consentement constitue la base juridique." },
  "leg-03": { status: "conditionnel", note: "Si consentement utilisé : manifestation positive, pas de case précochée." },
  "leg-04": { status: "conditionnel", note: "Le responsable doit pouvoir démontrer le consentement. Date/version généralement nécessaires ; l'IP n'est pas systématiquement obligatoire." },
  "leg-05": { status: "conditionnel", note: "Si consentement utilisé." },
  "leg-06": { status: "conditionnel", note: "Uniquement pour une offre directe de services de la société de l'information fondée sur le consentement (Art. 8) ; pas pour le dossier médical classique d'un mineur." },
  "leg-07": { status: "conditionnel", note: "Si intérêt légitime utilisé : analyse nécessité/intérêts/droits. Formalisation écrite fortement nécessaire au titre de l'accountability." },
  "leg-08": { status: "conditionnel", note: "Si consentement marketing demandé en parallèle de CG/contrat." },
  "leg-09": { status: "conditionnel", note: "Si plusieurs finalités distinctes reposent sur le consentement." },

  // 4. Information des personnes
  "info-01": { status: "obligatoire", note: "L'information RGPD est obligatoire ; publier une « politique de confidentialité » en ligne n'est pas le seul moyen possible." },
  "info-02": { status: "obligatoire", note: "Identité et coordonnées du responsable." },
  "info-03": { status: "conditionnel", note: "Coordonnées du DPO si DPO désigné ; sinon point de contact possible." },
  "info-04": { status: "obligatoire", note: "Finalités et bases légales." },
  "info-05": { status: "obligatoire", note: "Destinataires / catégories de destinataires." },
  "info-06": { status: "obligatoire", note: "Durée de conservation ou critères de détermination." },
  "info-07": { status: "obligatoire", note: "Droits applicables." },
  "info-08": { status: "obligatoire", note: "Modalités permettant d'exercer les droits." },
  "info-09": { status: "obligatoire", note: "Droit de saisir la CNIL." },
  "info-10": { status: "conditionnel", note: "Si transfert hors UE/EEE." },
  "info-11": { status: "conditionnel", note: "Si décision automatisée / profilage répondant aux conditions du RGPD." },
  "info-12": { status: "obligatoire", note: "En collecte directe (Art. 13)." },
  "info-13": { status: "obligatoire", note: "L'information doit être fournie lors de la collecte ; elle peut être organisée en plusieurs niveaux et ne doit pas nécessairement être intégralement imprimée dans le formulaire." },
  "info-14": { status: "conditionnel", note: "Si données obtenues indirectement, sous réserve des exceptions de l'Art. 14." },

  // 5. Droits des personnes
  "dr-01": { status: "recommande", note: "Les droits doivent être facilités et gérés ; un document formel intitulé « procédure » n'est pas explicitement imposé." },
  "dr-02": { status: "obligatoire", note: "Délai de principe : 1 mois." },
  "dr-03": { status: "conditionnel", note: "Vérification d'identité uniquement en cas de doute raisonnable et de façon proportionnée." },
  "dr-04": { status: "obligatoire", note: "Droit d'accès." },
  "dr-05": { status: "obligatoire", note: "Droit de rectification." },
  "dr-06": { status: "obligatoire", note: "Le droit existe mais connaît de nombreuses exceptions, notamment les obligations de conservation." },
  "dr-07": { status: "obligatoire", note: "Lorsque les conditions de l'Art. 18 sont réunies." },
  "dr-08": { status: "conditionnel", note: "Portabilité conditionnelle : données fournies par la personne + traitement automatisé + base consentement ou contrat." },
  "dr-09": { status: "conditionnel", note: "Selon la base juridique ; droit absolu pour la prospection." },
  "dr-10": { status: "conditionnel", note: "S'il existe une décision exclusivement automatisée ayant un effet juridique ou significatif." },
  "dr-11": { status: "recommande", note: "Pas de registre autonome imposé." },
  "dr-12": { status: "recommande", note: "Les personnes recevant les demandes doivent néanmoins savoir les identifier et les transmettre." },
  "dr-13": { status: "conditionnel", note: "Rectification, effacement ou limitation communiqués aux destinataires, sauf impossibilité ou effort disproportionné." },
  "dr-14": { status: "conditionnel", note: "En France, les droits post-mortem relèvent aussi de la loi Informatique et Libertés ; à traiter lorsqu'une demande valide existe." },

  // 6. Sécurité des données
  "sec-01": { status: "recommande", note: "PSSI formalisée non explicitement imposée." },
  "sec-02": { status: "obligatoire", note: "Contrôle des accès adapté aux fonctions (Art. 32)." },
  "sec-03": { status: "recommande", note: "Fortement recommandé / quasi indispensable en santé : comptes nominatifs pour la traçabilité." },
  "sec-04": { status: "obligatoire", note: "Obligatoire dans son principe : si authentification par mot de passe, mécanisme suffisamment robuste." },
  "sec-05": { status: "recommande", note: "MFA non systématiquement imposée ; recommandée par la CNIL en particulier pour les données sensibles." },
  "sec-06": { status: "recommande", note: "Verrouillage automatique fortement recommandé, selon les risques." },
  "sec-07": { status: "recommande", note: "Revue périodique oui ; « au moins annuelle » n'est pas une exigence RGPD générale." },
  "sec-08": { status: "obligatoire", note: "Obligatoire dans son principe : les droits doivent être retirés lorsqu'ils ne sont plus justifiés." },
  "sec-09": { status: "conditionnel", note: "Le chiffrement au repos n'est pas universellement imposé par l'Art. 32 ; très fortement recommandé pour les données de santé." },
  "sec-10": { status: "conditionnel", note: "Transmission Internet de données sensibles : chiffrement robuste attendu ; « TLS 1.2+ » est une modalité technique, pas un texte du RGPD." },
  "sec-11": { status: "obligatoire", note: "Art. 32 : capacité à rétablir disponibilité et accès. Sauvegarde/restauration essentielles ; chiffrement des sauvegardes selon le risque." },
  "sec-12": { status: "recommande", note: "PRA/PCA formalisé non systématiquement imposé, mais capacité de restauration exigée par l'Art. 32." },
  "sec-13": { status: "obligatoire", note: "Obligatoire dans son principe : protection adaptée des postes ; antivirus/EDR/chiffrement sont des moyens possibles." },
  "sec-14": { status: "recommande", note: "Pare-feu attendu ; segmentation selon l'architecture et les risques." },
  "sec-15": { status: "non_obligatoire", note: "IDS/IPS/SIEM dépend de la taille et du risque." },
  "sec-16": { status: "recommande", note: "Journalisation importante, notamment pour les accès aux données sensibles ; centralisation pas systématique." },
  "sec-17": { status: "obligatoire", note: "Obligatoire dans son principe : gestion des correctifs et vulnérabilités ; outil de scan précis non imposé." },
  "sec-18": { status: "recommande", note: "Test d'intrusion non systématiquement obligatoire." },
  "sec-19": { status: "recommande", note: "Recommandé selon les risques, particulièrement important pour les données de santé." },
  "sec-20": { status: "obligatoire", note: "Obligatoire dans son principe : les données doivent réellement devenir inaccessibles lorsqu'elles doivent être détruites ; procédure formelle recommandée." },
  "sec-21": { status: "obligatoire", note: "Sécurité physique adaptée aux risques ; badges/vidéo/alarme ne sont pas chacun obligatoires." },
  "sec-22": { status: "conditionnel", note: "Si télétravail : mesures de sécurité appropriées. VPN/MDM/charte selon le risque." },
  "sec-23": { status: "conditionnel", note: "Si BYOD autorisé, il doit être sécurisé ; aucune obligation d'autoriser ou d'interdire le BYOD." },
  "sec-24": { status: "conditionnel", note: "Si l'organisme développe ou conçoit un traitement ou une application (Art. 25)." },
  "sec-25": { status: "recommande", note: "Recommandé si développement/recette." },
  "sec-26": { status: "recommande", note: "Recommandé si développement applicatif." },
  "sec-27": { status: "recommande", note: "Recommandé si API/services exposés sur Internet." },
  "sec-28": { status: "conditionnel", note: "L'Art. 32 cite la pseudonymisation comme mesure possible, pas comme obligation universelle : obligatoire si appropriée." },
  "sec-29": { status: "recommande", note: "Gestion des incidents nécessaire ; procédure écrite non explicitement exigée." },
  "sec-30": { status: "recommande", note: "Sensibilisation nécessaire ; campagnes de phishing simulé non imposées." },

  // 7. Violations de données
  "vio-01": { status: "recommande", note: "Les obligations de l'Art. 33 sont impératives ; une procédure formalisée est le meilleur moyen de les respecter, sans être exigée comme document." },
  "vio-02": { status: "conditionnel", note: "Notification sous 72 h uniquement lorsque la violation est susceptible d'entraîner un risque." },
  "vio-03": { status: "obligatoire", note: "Toute violation doit être documentée." },
  "vio-04": { status: "obligatoire", note: "Évaluation du risque nécessaire pour décider de la notification CNIL/personnes, et documentation de la décision." },
  "vio-05": { status: "conditionnel", note: "Si risque élevé, sauf exceptions de l'Art. 34." },
  "vio-06": { status: "obligatoire", note: "Obligatoire dans son principe : le personnel doit pouvoir faire remonter les incidents pour permettre le respect de l'Art. 33." },
  "vio-07": { status: "conditionnel", note: "Si sous-traitant : notification au responsable sans retard injustifié." },
  "vio-08": { status: "recommande", note: "Exercice de simulation non imposé." },

  // 8. Sous-traitance
  "st-01": { status: "recommande", note: "Si sous-traitants : inventaire fortement utile." },
  "st-02": { status: "conditionnel", note: "Pour chaque véritable sous-traitant au sens de l'Art. 28." },
  "st-03": { status: "conditionnel", note: "Le contrat doit contenir les exigences de l'Art. 28§3." },
  "st-04": { status: "conditionnel", note: "Sous-traitance ultérieure." },
  "st-05": { status: "conditionnel", note: "Le responsable ne doit recourir qu'à des sous-traitants présentant des garanties suffisantes." },
  "st-06": { status: "recommande", note: "Audits/certifications non systématiquement exigés." },
  "st-07": { status: "conditionnel", note: "Restitution ou suppression en fin de prestation, selon la décision du responsable et les obligations légales." },
  "st-08": { status: "conditionnel", note: "Si transfert hors EEE nécessitant CCT/BCR ou autre mécanisme." },
  "st-09": { status: "recommande", note: "Contrôle continu pertinent ; aucune fréquence annuelle générale imposée." },

  // 9. Transferts internationaux
  "tr-01": { status: "conditionnel", note: "Si transferts hors EEE." },
  "tr-02": { status: "conditionnel", note: "Vérifier d'abord l'existence d'une décision d'adéquation ; il n'est pas obligatoire que le pays en bénéficie." },
  "tr-03": { status: "conditionnel", note: "En l'absence d'adéquation, un mécanisme valide est requis ; les CCT en sont une possibilité parmi d'autres." },
  "tr-04": { status: "conditionnel", note: "Analyse du droit et des pratiques du pays, notamment en cas de recours aux garanties de l'Art. 46 (CCT)." },
  "tr-05": { status: "conditionnel", note: "Obligatoire si nécessaire : lorsque les garanties contractuelles seules ne suffisent pas." },
  "tr-06": { status: "non_obligatoire", note: "Les BCR sont une option, jamais une obligation générale pour un groupe multinational." },
  "tr-07": { status: "conditionnel", note: "L'information Art. 13/14 doit couvrir les transferts et garanties." },
  "tr-08": { status: "conditionnel", note: "Si un outil implique réellement un transfert hors EEE ; la nationalité du fournisseur ne suffit pas à elle seule." },

  // 10. AIPD / DPIA
  "aipd-01": { status: "recommande", note: "Procédure écrite non expressément imposée ; il faut néanmoins déterminer si une AIPD est nécessaire." },
  "aipd-02": { status: "obligatoire", note: "Le responsable doit identifier les traitements susceptibles d'engendrer un risque élevé." },
  "aipd-03": { status: "conditionnel", note: "Si traitement susceptible d'engendrer un risque élevé. Traiter des données de santé ne rend pas automatiquement l'AIPD obligatoire (grande échelle et autres critères)." },
  "aipd-04": { status: "conditionnel", note: "Si AIPD réalisée : contenu minimal de l'Art. 35§7." },
  "aipd-05": { status: "conditionnel", note: "Si DPO désigné et AIPD réalisée." },
  "aipd-06": { status: "conditionnel", note: "Art. 35§9 : avis des personnes ou de leurs représentants le cas échéant, sauf justification contraire." },
  "aipd-07": { status: "conditionnel", note: "Réexamen lorsque nécessaire, notamment en cas d'évolution du risque." },
  "aipd-08": { status: "conditionnel", note: "Si risque élevé résiduel malgré les mesures prévues." },

  // 11. Principes & Minimisation
  "min-01": { status: "obligatoire", note: "Minimisation des données." },
  "min-02": { status: "obligatoire", note: "Limitation des finalités." },
  "min-03": { status: "obligatoire", note: "Exactitude des données." },
  "min-04": { status: "obligatoire", note: "Limitation de la conservation ; attention aux obligations d'archivage médical/légal." },
  "min-05": { status: "obligatoire", note: "Intégrité et confidentialité." },
  "min-06": { status: "obligatoire", note: "Accountability." },
  "min-07": { status: "obligatoire", note: "Obligatoire dans son principe : les champs réellement obligatoires doivent être limités aux données nécessaires." },
  "min-08": { status: "obligatoire", note: "Obligatoire dans son principe : les exports doivent respecter la minimisation et les habilitations." },

  // 12. Privacy by Design & Default
  "pbd-01": { status: "obligatoire", note: "Art. 25." },
  "pbd-02": { status: "recommande", note: "Checklist comme outil, pas comme exigence." },
  "pbd-03": { status: "obligatoire", note: "Privacy by default expressément prévue à l'Art. 25§2." },
  "pbd-04": { status: "conditionnel", note: "Si DPO désigné et projet impliquant la protection des données." },
  "pbd-05": { status: "obligatoire", note: "Obligatoire dans l'analyse des mesures appropriées : la pseudonymisation doit être envisagée lorsqu'elle est pertinente, sans être systématiquement mise en œuvre." },
  "pbd-06": { status: "recommande", note: "Recommandé si environnements de test." },

  // 13. Site Web & Cookies
  "web-01": { status: "conditionnel", note: "Seulement si le site utilise des cookies/traceurs nécessitant consentement (pas pour les traceurs strictement exemptés)." },
  "web-02": { status: "conditionnel", note: "Si consentement cookies requis : refuser doit être aussi simple qu'accepter." },
  "web-03": { status: "conditionnel", note: "Traceurs soumis au consentement." },
  "web-04": { status: "obligatoire", note: "Obligatoire dans son contenu, pas dans sa forme : aucune obligation d'avoir une page intitulée « Gestion des cookies »." },
  "web-05": { status: "recommande", note: "6 mois n'est pas un maximum légal général : durée considérée comme appropriée par la CNIL pour conserver le choix." },
  "web-06": { status: "recommande", note: "L'information doit être facilement accessible ; « depuis chaque page » n'est pas une formulation RGPD stricte." },
  "web-07": { status: "conditionnel", note: "Mentions légales obligatoires si site concerné, mais relevant principalement d'autres textes que le RGPD." },
  "web-08": { status: "conditionnel", note: "Si formulaire collectant des données personnelles : information au moment de la collecte." },
  "web-09": { status: "conditionnel", note: "Si analytics : soit exemption respectant toutes les conditions, soit consentement." },
  "web-10": { status: "conditionnel", note: "Si pixels publicitaires / traceurs soumis au consentement." },
  "web-11": { status: "obligatoire", note: "Art. 32 : HTTPS est le standard attendu pour un site échangeant des données personnelles." },
  "web-12": { status: "recommande", note: "CSP/HSTS/X-Frame-Options ne sont pas individuellement prescrits par le RGPD." },

  // 14. Marketing & Prospection
  "mk-01": { status: "conditionnel", note: "B2C email/SMS : consentement préalable en principe, avec l'exception du client existant pour des produits/services similaires." },
  "mk-02": { status: "conditionnel", note: "En B2B sans consentement préalable : objet en rapport avec l'activité professionnelle + information et droit d'opposition." },
  "mk-03": { status: "conditionnel", note: "Chaque sollicitation doit permettre une opposition simple." },
  "mk-04": { status: "obligatoire", note: "Obligatoire dans son résultat : une personne opposée ne doit plus être prospectée. La liste repoussoir est un moyen recommandé, pas le seul." },
  "mk-05": { status: "conditionnel", note: "Si achat/location de bases : vérifier licéité, information et consentement lorsque requis." },
  "mk-06": { status: "recommande", note: "3 ans est la durée de référence CNIL pour les prospects, pas une durée écrite dans le RGPD." },
  "mk-07": { status: "conditionnel", note: "Scraping/enrichissement impliquant des données personnelles : finalité, base légale, information, minimisation." },
  "mk-08": { status: "conditionnel", note: "Si profilage : information adaptée, exigences supplémentaires selon les conséquences." },
  "mk-09": { status: "conditionnel", note: "Si jeu-concours avec marketing : consentement distinct si le marketing n'est pas nécessaire à la participation." },
  "mk-10": { status: "recommande", note: "Le scoring doit respecter le RGPD ; un document intitulé « documentation scoring » n'est pas toujours imposé." },

  // 15. Ressources Humaines
  "rh-01": { status: "conditionnel", note: "Si recrutement : les candidats doivent être informés." },
  "rh-02": { status: "recommande", note: "Deux ans après le dernier contact est une durée de référence CNIL, pas une obligation RGPD universelle." },
  "rh-03": { status: "obligatoire", note: "Obligatoire dans son principe : les salariés doivent être informés des traitements les concernant ; une « note » est un moyen possible." },
  "rh-04": { status: "conditionnel", note: "Si dispositif concerné par une obligation d'information/consultation du CSE (droit du travail)." },
  "rh-05": { status: "conditionnel", note: "Si géolocalisation : nécessité, proportionnalité, information." },
  "rh-06": { status: "conditionnel", note: "Si surveillance des messageries." },
  "rh-07": { status: "conditionnel", note: "Données d'évaluation accessibles au titre du droit d'accès, sous réserve des droits des tiers." },
  "rh-08": { status: "obligatoire", note: "Durées légales et principe de limitation de conservation à respecter." },
  "rh-09": { status: "conditionnel", note: "Données de santé / sensibles RH : protection adaptée." },
  "rh-10": { status: "recommande", note: "L'archivage séparé est une bonne mesure, pas une obligation universelle sous cette forme." },
  "rh-11": { status: "recommande", note: "Une charte spécifique « data télétravail » n'est pas imposée par le RGPD." },
  "rh-12": { status: "recommande", note: "La charte informatique n'est pas imposée par le RGPD en tant que telle (parfois requise par le droit du travail)." },

  // 16. Vidéosurveillance & Biométrie
  "vid-01": { status: "conditionnel", note: "Si caméras : nécessité et proportionnalité ; la surveillance permanente d'un poste individuel est généralement disproportionnée." },
  "vid-02": { status: "conditionnel", note: "Autorisation préfectorale notamment pour un dispositif de vidéoprotection dans un lieu ouvert au public ou relevant du CSI, pas simplement « si voie publique »." },
  "vid-03": { status: "conditionnel", note: "Toute personne filmée doit être informée." },
  "vid-04": { status: "conditionnel", note: "La durée doit être justifiée : un mois constitue souvent un maximum pertinent, quelques jours suffisent fréquemment." },
  "vid-05": { status: "obligatoire", note: "Obligatoire dans son principe : accès limité aux personnes habilitées, traçabilité selon les risques." },
  "vid-06": { status: "conditionnel", note: "Une AIPD n'est pas automatique pour tout dispositif biométrique, mais souvent requise au regard des critères de risque et référentiels applicables." },
  "vid-07": { status: "conditionnel", note: "Si biométrie : nécessité et proportionnalité, notamment face à des moyens moins intrusifs." },

  // 17. Données sensibles
  "ds-01": { status: "obligatoire", note: "Identification indispensable des données sensibles (dont données de santé)." },
  "ds-02": { status: "obligatoire", note: "Une condition de l'Art. 9§2 doit permettre le traitement, en plus de la base de l'Art. 6." },
  "ds-03": { status: "conditionnel", note: "Si des données de santé sont hébergées/conservées par un tiers entrant dans le champ de la certification HDS." },
  "ds-04": { status: "conditionnel", note: "Si données relatives aux condamnations et infractions." },
  "ds-05": { status: "obligatoire", note: "Obligatoire dans son principe : accès aux données de santé limité aux personnes habilitées, traçabilité adaptée." },
  "ds-06": { status: "conditionnel", note: "Protection renforcée nécessaire selon les risques ; le chiffrement est un moyen particulièrement pertinent, sans être une obligation universelle." },

  // 18. Formation & Sensibilisation
  "fo-01": { status: "recommande", note: "Aucun plan annuel obligatoire en tant que tel." },
  "fo-02": { status: "recommande", note: "Fortement recommandé, particulièrement pour les personnels accédant aux données de santé." },
  "fo-03": { status: "recommande", note: "Renforcement proportionné aux risques et aux fonctions." },
  "fo-04": { status: "recommande", note: "L'Art. 32 suppose des mesures organisationnelles adaptées ; sensibilisation fortement attendue." },
  "fo-05": { status: "recommande", note: "Très utile pour l'accountability." },
  "fo-06": { status: "non_obligatoire", note: "Aucun examen RGPD obligatoire." },

  // 19. Intelligence artificielle
  "ia-01": { status: "conditionnel", note: "Si une IA traite des données personnelles, elle doit apparaître dans la gouvernance/cartographie/registre." },
  "ia-02": { status: "conditionnel", note: "Si décision exclusivement automatisée répondant à l'Art. 22." },
  "ia-03": { status: "conditionnel", note: "Dans les cas de l'Art. 22§2 a/c : intervention humaine, expression du point de vue et contestation." },
  "ia-04": { status: "conditionnel", note: "Évaluer les risques et la loyauté est nécessaire ; un « audit de biais » formalisé n'est pas imposé par le RGPD (voir AI Act)." },
  "ia-05": { status: "recommande", note: "Charte IA générative non imposée en tant que document." },
  "ia-06": { status: "conditionnel", note: "Aucune interdiction générale des données personnelles dans les prompts, mais base légale, finalité, minimisation, sécurité, information et encadrement des transferts requis. Données de santé dans un service grand public : à proscrire sauf cadre validé." },
  "ia-07": { status: "conditionnel", note: "Si l'organisme est fournisseur/déployeur d'un système soumis à l'AI Act." },
};
