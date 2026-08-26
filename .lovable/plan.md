# Idées de fonctionnalités à ajouter

L'application couvre déjà une large partie du cycle d'audit RGPD : entreprises, audits multi-domaines, registre des traitements, plan d'actions, portail client, calendrier, exports PDF/Excel et notifications d'échéance.

Voici des fonctionnalités complémentaires classées par valeur métier et effort, pour rendre l'outil encore plus complet et professionnel.

## 1. Gestion des demandes d'exercice des droits (DRO)

**Valeur :** obligation légale (Art. 12-22 RGPD), traçabilité indispensable.

- Table `data_subject_requests` : type (accès, rectification, effacement, portabilité, opposition, limitation), date de réception, date de réponse, canal, statut, pièces jointes.
- Page `/droits` avec filtres (en retard, type, statut).
- Rappels automatiques J-7 avant échéance légale (1 mois).
- Export PDF/Excel du registre.

## 2. Registre des violations de données (data breaches)

**Valeur :** obligation CNIL (Art. 33-34), délai critique de 72h.

- Table `data_breaches` : date de découverte, nature, catégories de données, personnes concernées, risque, notification CNIL, notification personnes, mesures prises.
- Page `/violations` avec alerte si délai de 72h approche.
- Lien automatique avec le plan d'actions (création d'une action corrective).

## 3. Sous-traitants et contrats Art. 28 (DPA)

**Valeur :** un des points de contrôle majeurs de l'audit.

- Table `subcontractors` : nom, contact, pays, garanties (CCT/BCR/adéquation), date de signature DPA, date de renouvellement, documents joints.
- Table de liaison `company_subcontractors`.
- Page `/sous-traitants` par entreprise.
- Rappel 3 mois avant échéance du DPA.

## 4. Registre des consentements et preuves

**Valeur :** démontrer le consentement valide (Art. 7).

- Table `consents` : finalité, version du formulaire, date, preuve (IP, hash, capture), statut (donné / retiré).
- Page `/consentements` avec recherche et filtre.
- Export pour preuve en cas de contrôle.

## 5. Analyse d'impact (PIA / DPIA)

**Valeur :** obligatoire pour les traitements à haut risque (Art. 35).

- Table `dpia` liée à un traitement ou un audit.
- Formulaire basé sur le modèle CNIL : nécessité, proportionnalité, mesures, risques résiduels.
- Score de risque et génération d'un rapport PDF.

## 6. Gestion documentaire avancée

**Valeur :** centraliser les modèles et documents clients.

- Upload de documents propres à chaque entreprise (politique de confidentialité, DPA, etc.).
- Versionnage (table `document_versions`).
- Partage de documents avec le portail client.
- Modèles dynamiques : fusion de variables (`{{entreprise.nom}}`, `{{dpo.email}}`) pour générer un document Word/PDF pré-rempli.

## 7. Centre de notifications in-app

**Valeur :** remplacer les alertes mail par une zone centralisée.

- Table `notifications` : type (échéance, validation client, nouvelle action), lu/non lu, lien.
- Icône cloche dans l'en-tête avec badge de non lus.
- Marquage "lu" et archivage.

## 8. Multi-auditeurs et collaboration

**Valeur :** permettre à plusieurs auditeurs de travailler sur le même audit.

- Table `audit_assignees` (many-to-many).
- Mention / commentaires sur les questions (`audit_comments`).
- Historique des modifications (qui a répondu quand).

## 9. Import de données par Excel/CSV

**Valeur :** gagner du temps à l'entrée en relation.

- Import d'entreprises, de traitements ou de contacts via fichier modèle.
- Vérification des doublons (SIRET, email).
- Rapport d'import avec lignes en erreur.

## 10. Snapshots et comparaison d'audits

**Valeur :** montrer l'évolution de la conformité dans le temps.

- Sauvegarde d'un "snapshot" à la clôture d'un audit.
- Page de comparaison entre deux audits : gains/pertes par domaine, actions restantes.
- Graphiques d'évolution dans le tableau de bord.

## 11. Personnalisation du scoring

**Valeur :** adapter l'audit au contexte de l'entreprise.

- Pondération des questions par audit.
- Questions optionnelles / masquées selon le secteur ou la taille.
- Seuils de conformité configurables.

## 12. Tags et recherche globale

**Valeur :** navigation plus rapide dans des volumes importants.

- Tags sur entreprises, traitements, actions.
- Barre de recherche globale (`Cmd+K`) pour accéder rapidement à une entreprise, un audit, une action.

## 13. Tableau de bord client enrichi

**Valeur :** meilleure expérience client et moins de sollicitations.

- Vue synthétique du score global, des actions en retard, des documents partagés et du calendrier.
- Possibilité pour le client de consulter l'historique des validations/refus.

## 14. Collecte de preuves par question d'audit

**Valeur :** justifier chaque réponse et faciliter la relecture.

- Upload de fichiers sur chaque question d'audit (captures, politiques, extraits de registre).
- Stockage dans un bucket dédié `audit-evidences`.
- Affichage des preuves dans le rapport PDF.

## 15. Formations et sensibilisation

**Valeur :** la sensibilisation est une mesure de sécurité (Art. 32) et un axe d'audit.

- Table `trainings` : thème, date, participants, preuves (attestations).
- Rappel annuel de renouvellement.

## Comment choisir

| Si tu veux renforcer... | Commence par... |
|---|---|
| La conformité légale au quotidien | DRO + Violations + Sous-traitants |
| La qualité des livrables | Documents dynamiques + Preuves par question |
| L'efficacité de l'équipe d'audit | Multi-auditeurs + Import + Recherche globale |
| L'expérience client | Dashboard client + Notifications + DPIA |
| Le piloting sur le long terme | Snapshots + Scoring personnalisé |

## Prochaine étape

Indique-moi les 2 ou 3 fonctionnalités que tu veux implémenter en priorité, dans l'ordre. Je rédigerai alors un plan d'implémentation détaillé pour chacune.
