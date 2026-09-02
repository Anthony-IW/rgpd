# Moteur dynamique d'audit RGPD multisectoriel

Objectif : n'afficher que les questions pertinentes pour l'organisation auditée, selon la formule
`socle commun + secteur + sous-secteur + modules fonctionnels conditionnels`, sans rien perdre de l'existant.

Le moteur est générique : il s'applique aux 44 secteurs de la liste (BTP, immobilier, e-commerce,
restauration, IT, associations, collectivités…), pas seulement à la santé. La santé et le cabinet
dentaire ne sont qu'un exemple de mise en œuvre du même mécanisme. Le questionnaire final d'une
organisation résulte toujours de la combinaison de son secteur **et** des réponses données dans
l'assistant sur son fonctionnement réel (site internet, cookies, sous-traitants, salariés, cloud,
caméras, prospection, IA, paiements, etc.).


## Architecture actuelle (constat)

- Référentiel figé dans le code : `src/data/rgpdReferential.ts` (202 questions, 19 catégories) et
  `src/data/rgpdObligations.ts` (statut juridique + note par question).
- Réponses en base : `audit_responses` (audit_id, question_id, category, level, comment, evidence, recommendation).
- Audits : `audits` (company_id, status, global_score, conformity_summary…).
- Scoring calculé côté client à partir du référentiel figé.

## Schéma de migration proposé

Nouvelles tables (toutes avec `created_at`, `updated_at`, `archived_at`, GRANT + RLS) :

- `sectors` (code, label, ordre) — les 44 secteurs de la liste.
- `subsectors` (sector_id, code, label) — dont `CABINET_DENTAIRE`.
- `functional_modules` (code, label, description) — les 35 modules.
- `module_activation_questions` (module_id, texte, étape de l'assistant, auto_activation).
- `questionnaire_versions` (numéro, publiée_le, publiée_par).
- `ref_questions` (code stable, texte, aide, référence juridique, statut juridique enum,
  condition d'application, niveau de risque, recommandations, poids, catégorie, version).
- `question_sectors`, `question_subsectors`, `question_modules` (liaisons multiples).
- `question_rules` (question_id, opérateur ALL/ANY/NOT, conditions JSONB).
- `company_profiles` + `company_profile_answers` (réponses de l'assistant, secteur principal,
  secteurs secondaires, sous-secteur, modules activés).
- `audit_scope_snapshot` (profil figé + modules inclus/exclus + raisons).
- `audit_questions_snapshot` (questions retenues, `inclusion_reason`, statut juridique figé).
- Colonnes ajoutées à `audit_responses` : `justification`, `owner`, `due_date`, `cost_estimate`,
  `priority`, `remediation_state`.
- Colonnes ajoutées à `audits` : `engine_version` (`legacy` | `dynamic`), `questionnaire_version_id`,
  `regulatory_score`, `maturity_score`, `coverage_score`.

Enums : `legal_status` (`OBLIGATOIRE`, `OBLIGATOIRE_SI_APPLICABLE`, `RECOMMANDE`,
`NON_OBLIGATOIRE_EN_TANT_QUE_TEL`), `risk_level` (faible/moyen/élevé/critique),
extension du niveau de réponse avec `PARTIEL` et `NE_SAIT_PAS` si absent.

Migration des 202 questions : import depuis `rgpdReferential.ts` + `rgpdObligations.ts` vers
`ref_questions` (version 1), rattachement au `SOCLE_COMMUN`, conversion des statuts uniquement
lorsque la correspondance est certaine, les cas ambigus étant marqués `needs_review = true`.
Aucun audit existant n'est modifié : ils restent en `engine_version = legacy`.

## Phases de livraison

### Phase 1 — Fondations base de données
Tables, enums, RLS, GRANT, seed des 44 secteurs, 35 modules et questions d'activation,
import des 202 questions en version 1.

### Phase 2 — Moteur d'éligibilité
`src/lib/audit-engine/` : évaluation des règles ALL/ANY/NOT, calcul du périmètre,
`inclusion_reason` / `exclusion_reason`, génération du snapshot d'audit. Tests unitaires
couvrant les 10 scénarios d'acceptation.

### Phase 3 — Assistant de profilage
Parcours en 5 étapes (Organisation, Activité, Données traitées, Pratiques et outils,
Périmètre généré) avec sauvegarde automatique, réponses Oui/Non/Je ne sais pas, activation
automatique des modules liés et affichage de la raison d'inclusion.

### Phase 4 — Questionnaire dynamique et scoring
`AuditDetail` alimenté par le snapshot, badges Obligatoire/Conditionnel/Recommandé/Hors périmètre,
progression sur les seules questions applicables, réponses `CONFORME`/`NON_CONFORME`/`PARTIEL`/
`NON_APPLICABLE` (justification obligatoire)/`NE_SAIT_PAS`, trois scores séparés
(conformité réglementaire, maturité, couverture) avec barème configurable et mention
« Indicateur d'aide à l'évaluation — ne constitue pas une certification de conformité RGPD ».

### Phase 5 — Administration du référentiel
Espace admin : secteurs, sous-secteurs, modules, questions (création, édition, archivage,
duplication, versionnement), constructeur visuel de règles, aperçu pour un profil donné,
contrôles de cohérence, import/export JSON/CSV, publication de version.

### Phase 6 — Rapports, contenus sectoriels, tests
Rapports distinguant hors périmètre / contrôlé / conforme. Les 44 secteurs disposent d'un bloc
sectoriel administrable (vide au départ, alimentable sans code) ; la santé/cabinet dentaire sert de
premier exemple complet avec les identifiants stables `sante-01`…`sante-30` et `sec-31`
(test de restauration des sauvegardes). Tests d'intégration et vérification de non-régression.


## Points d'attention

- Les formulations juridiques du module dentaire ne seront pas inventées : la structure et l'import
  sont préparés, les libellés définitifs restent à fournir.
- Les audits déjà finalisés conservent leurs questions et leurs scores d'origine.
- Les audits en brouillon ne basculent sur le nouveau moteur qu'après confirmation explicite.

On démarre par la Phase 1.
