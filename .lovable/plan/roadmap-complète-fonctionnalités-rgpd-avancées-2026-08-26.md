# Roadmap complète : fonctionnalités RGPD avancées

L'application couvre déjà le cœur du cycle d'audit. Le plan ci-dessous ajoute les 15 modules complémentaires proposés, découpés en 4 phases pour rester livrable et testable.

On commence par la Phase 1 ; les phases suivantes feront l'objet de plans détaillés au moment de les démarrer.

## Phase 1 — Conformité légale (prioritaire)

Objectif : donner à l'auditeur les registres obligatoires demandés par la CNIL.

### 1.1 Demandes d'exercice des droits (DRO)

- Table `data_subject_requests` : type, date_reception, date_response_due, status, channel, requester_email, notes, attachments.
- Page `/droits` : liste, filtres, badge "en retard".
- Rappels J-7 avant échéance légale (1 mois).
- Export PDF/Excel.

### 1.2 Registre des violations de données

- Table `data_breaches` : discovery_date, notification_due_date, severity, data_categories, affected_count, notified_cnil, notified_subjects, measures, related_action_id.
- Page `/violations` avec alerte si délai CNIL de 72h proche.
- Bouton "Créer une action corrective" depuis une violation.

### 1.3 Sous-traitants et DPA (Art. 28)

- Table `subcontractors` : name, contact, country, dpa_signed_at, dpa_renewal_date, safeguards, documents.
- Table `company_subcontractors` pour lier une entreprise à ses sous-traitants.
- Page `/sous-traitants` par entreprise.
- Rappel 3 mois avant renouvellement du DPA.

### 1.4 Consentements et preuves

- Table `consents` : purpose, form_version, given_at, withdrawn_at, proof (IP/hash), status.
- Page `/consentements` avec recherche et filtre.
- Export pour preuve en cas de contrôle.

### 1.5 Analyse d'impact (DPIA)

- Table `dpia` liée à un `processing_record` ou un `audit`.
- Formulaire basé sur le modèle CNIL : nécessité, proportionnalité, mesures, risques résiduels.
- Score de risque et rapport PDF.

## Phase 2 — Productivité de l'équipe d'audit

Objectif : accélérer la saisie, le suivi et la relecture.

### 2.1 Multi-auditeurs

- Table `audit_assignees` (many-to-many).
- Affichage des assignés sur la fiche audit.
- RLS adaptée pour permettre la lecture/écriture aux assignés.

### 2.2 Commentaires sur les questions

- Table `audit_comments` : question_id, audit_id, user_id, content, created_at.
- Fil de discussion sous chaque question dans `AuditDetail`.

### 2.3 Import Excel/CSV

- Page `/import` avec téléchargement de modèles.
- Import d'entreprises, de traitements et de contacts.
- Détection des doublons (SIRET, email) et rapport d'erreurs.

### 2.4 Tags et recherche globale

- Colonne `tags` (text[]) sur `companies`, `processing_records`, `action_plans`.
- Composant `CommandDialog` (`Cmd+K`) pour rechercher entreprises, audits, actions, traitements.

### 2.5 Snapshots et comparaison d'audits

- Table `audit_snapshots` : audit_id, snapshot_data (JSONB), created_at.
- Snapshot automatique à la clôture d'un audit.
- Page `/comparaisons` : sélection de deux audits, évolution par domaine.

### 2.6 Scoring personnalisé

- Table `audit_question_weights` : audit_id, question_id, weight, enabled.
- Interface dans `AuditDetail` pour désactiver une question ou changer sa pondération.

## Phase 3 — Livrables et preuves

Objectif : produire des documents professionnels et traçables.

### 3.1 Collecte de preuves par question

- Bucket `audit-evidences`.
- Table `audit_evidence_files` : response_id, file_path, file_name.
- Upload sur chaque question d'audit ; affichage dans le rapport PDF.

### 3.2 Documents dynamiques

- Moteur de fusion de variables (`{{entreprise.nom}}`, `{{dpo.email}}`, `{{date}}`) dans les modèles.
- Génération Word/PDF depuis la bibliothèque.
- Page `/documents/generer`.

### 3.3 Gestion documentaire avancée

- Upload de documents propres à une entreprise.
- Table `document_versions` pour le versionnage.
- Partage de documents avec le portail client.

### 3.4 Formations et sensibilisation

- Table `trainings` : theme, date, attendees, certificates.
- Page `/formations`.
- Rappel annuel de renouvellement.

## Phase 4 — Expérience client

Objectif : donner au client une vue claire et autonome.

### 4.1 Tableau de bord client

- Vue `/portail` avec score global, actions en retard, documents partagés, prochaines échéances.
- Historique des validations/refus.

### 4.2 Centre de notifications in-app

- Table `notifications` : type, title, link, read_at.
- Icône cloche dans l'en-tête avec badge de non lus.
- Génération lors d'une échéance, d'une demande client ou d'un document partagé.

### 4.3 Calendrier partagé enrichi

- Affichage des événements et échéances côté client.
- Possibilité pour le client de proposer une nouvelle date d'échéance (soumise à validation auditeur).

## Découpage technique commun

### Base de données

- Une migration par module (table + GRANT + RLS + trigger `updated_at`).
- Règles d'accès : auditeur/admin propriétaire, client en lecture sur ses propres données.
- Index sur les clés étrangères et dates d'échéance.

### Stockage

- Nouveaux buckets privés : `audit-evidences`, `company-documents`, `dpia-documents`.
- RLS sur `storage.objects` pour restreindre l'accès au propriétaire/auditeur/client concerné.

### Edge Functions

- Extension de `send-deadline-reminders` pour les DRO, violations et renouvellements DPA.
- Fonction `generate-dynamic-document` pour la fusion de documents.

### Exports

- Extension de `src/lib/exports/` pour chaque nouveau module.
- Rapports PDF avec logo Informatique & Web, sommaire et pagination.
- Fichiers Excel multi-onglets pour DRO, violations, sous-traitants, consentements, DPIA.

### Interface

- Ajout d'entrées dans `AppSidebar` pour les nouveaux modules.
- Composants réutilisables : `DataTable`, `DeadlineBadge`, `FileUploader`, `CommentThread`.
- Responsive mobile pour chaque nouvelle page.

## Fichiers impactés (prévision)

- Créés : pages dans `src/pages/`, tables dans `supabase/migrations/`, utilitaires dans `src/lib/exports/`, composants dans `src/components/`.
- Modifiés : `src/App.tsx`, `src/components/AppSidebar.tsx`, `src/pages/AuditDetail.tsx`, `src/pages/CompanyDetail.tsx`, `src/pages/Dashboard.tsx`, `src/lib/exports/*`.

## Première livraison

On démarre la Phase 1 avec les 5 modules de conformité légale.

Ordre d'implémentation recommandé :

1. Sous-traitants et DPA
2. Demandes d'exercice des droits
3. Registre des violations
4. Consentements
5. DPIA

Chaque module comprend : migration SQL, page(s) React, export PDF/Excel, rappels d'échéance le cas échéant, et tests de parcours.
