# Ajout des exports PDF et Excel

Actuellement, seul le rapport d'audit possède un export PDF (`src/lib/pdfReport.ts`). On va étendre les capacités d'export à toutes les sections clés de l'application, en PDF **et** en Excel (.xlsx).

## Ce qui sera exportable

| Module | PDF | Excel |
|---|---|---|
| Rapport d'audit complet (par entreprise) | ✅ amélioré | ✅ nouveau |
| Liste des entreprises | ✅ | ✅ |
| Registre des traitements (Art. 30) | ✅ | ✅ |
| Plan d'actions / remédiation | ✅ | ✅ |
| Fiche entreprise (synthèse) | ✅ | ✅ |
| Bibliothèque documentaire (liste) | ✅ | ✅ |

## Détails par export

### 1. Rapport d'audit (PDF amélioré)
Refonte de `src/lib/pdfReport.ts` :
- Page de garde avec logo Informatique & Web, nom entreprise, date, auditeur
- Sommaire
- Synthèse exécutive (score global, score par domaine, jauge visuelle)
- Détail des réponses par domaine (question, réponse, constat, recommandation, criticité)
- Plan d'actions associé
- Pied de page avec pagination

### 2. Rapport d'audit (Excel)
Classeur multi-onglets :
- `Synthèse` : scores par domaine + score global
- `Réponses` : toutes les questions/réponses/constats
- `Plan d'actions` : actions liées à l'audit
- `Registre` : traitements de l'entreprise

### 3. Listes (Entreprises, Registre, Actions)
- **PDF** : tableau paysage avec en-tête, logo, filtres appliqués mentionnés
- **Excel** : tableau brut avec filtres Excel activés, en-têtes en gras, largeurs auto

## Implémentation technique

### Librairies à ajouter
- `jspdf` + `jspdf-autotable` (déjà utilisé pour le rapport actuel — réutilisé)
- `xlsx` (SheetJS) pour la génération Excel — léger, fonctionne 100% côté navigateur

### Architecture
Création d'un module utilitaire `src/lib/exports/` :
- `pdfReport.ts` (refonte de l'existant) — rapport audit complet
- `pdfTable.ts` — helper générique pour exporter une liste en PDF
- `excelExport.ts` — helper générique + exports spécifiques (audit, registre, actions, entreprises)
- `exportHelpers.ts` — formatage commun (dates, scores, criticité)

### UI : boutons d'export
Ajout d'un composant `ExportMenu` (dropdown avec "Exporter en PDF" / "Exporter en Excel") placé dans :
- `PageHeader` (prop optionnelle `actions`) — déjà supporté
- Pages : `Companies`, `Registry`, `Actions`, `CompanyDetail`, `AuditDetail`, `Library`

Sur les listes filtrées (Registre, Actions), l'export reflète les **filtres actifs** (recherche, statut, priorité).

### Nommage des fichiers
Format : `{type}_{entreprise}_{YYYY-MM-DD}.{ext}`
Exemples :
- `audit_acme_2026-05-02.pdf`
- `registre_traitements_acme_2026-05-02.xlsx`
- `plan_actions_2026-05-02.xlsx`

### Branding
Tous les PDF reprennent :
- Le logo Informatique & Web en en-tête
- Les couleurs de la charte (violet/bleu/orange)
- Mention "Audit RGPD réalisé par Informatique & Web" en pied de page

## Fichiers impactés
- **Créés** : `src/lib/exports/excelExport.ts`, `src/lib/exports/pdfTable.ts`, `src/lib/exports/exportHelpers.ts`, `src/components/ExportMenu.tsx`
- **Modifiés** : `src/lib/pdfReport.ts` (déplacé dans `src/lib/exports/` et amélioré), `src/pages/Companies.tsx`, `src/pages/Registry.tsx`, `src/pages/Actions.tsx`, `src/pages/CompanyDetail.tsx`, `src/pages/AuditDetail.tsx`, `src/pages/Library.tsx`
- **Dépendances** : ajout de `xlsx`

Aucune modification de la base de données requise.
