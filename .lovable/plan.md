# Déploiement de l'app RGPD sur rgpd.informatique-web.pro (o2switch)

## Contexte
L'application est un **SPA React/Vite** (frontend statique) publié sur Lovable à `rgpd.lovable.app`. Le backend (base de données, auth, edge functions) reste hébergé sur **Lovable Cloud** — il n'y a rien à installer côté o2switch : le frontend interrogera toujours le backend Lovable via HTTPS. On ne déploie sur o2switch que les fichiers statiques du build (`dist/`).

Choix par défaut (questions ignorées) : **CI/CD GitHub Actions** + transfert **FTP/FTPS** vers o2switch. C'est la solution la plus robuste : à chaque `git push` sur `main`, le site est recompilé et poussé automatiquement sur le sous-domaine.

## Ce que je vais ajouter au dépôt (fichiers de configuration)

1. **`public/.htaccess`** — routing SPA sous Apache (o2switch = Apache/cPanel).
   - `RewriteEngine On` : toute URL qui n'est pas un fichier/répertoire existant est renvoyée vers `index.html` (pour que `/audit/123`, `/portail/actions`, refresh de page, etc. fonctionnent sans 404).
   - Mise en cache des assets `assets/*` + `favicon`, et en-têtes de sécurité de base.
   - Vite copie automatiquement `public/.htaccess` à la racine de `dist/` lors du build.

2. **`.github/workflows/deploy-o2switch.yml`** — pipeline GitHub Actions.
   - Déclenché sur `push` vers `main`.
   - Étapes : `actions/checkout` → `setup-node` (20) → `npm ci` → `npm run build` → déploiement FTP du dossier `dist/` vers le sous-domaine o2switch via une action type `SamKirkland/FTP-Deploy-Action`.
   - Les identifiants FTP proviennent de **secrets GitHub** (`FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`, `FTP_PORT`), jamais en clair dans le code.

Aucune modification du code applicatif, aucune modification du backend.

## Étapes à réaliser de ton côté (cPanel o2switch)

### A. Créer le sous-domaine
1. cPanel o2switch → **Sous-domaines** → Créer : `rgpd.informatique-web.pro`.
2. Le dossier racine généré est généralement `public_html/rgpd` (note-le).

### B. Créer un compte FTP dédié (recommandé pour la sécurité)
1. cPanel → **Comptes FTP** → Ajouter un compte.
   - Répertoire de connexion : `public_html/rgpd/` (limité à ce sous-domaine).
   - Note l'**hôte FTP** (souvent `ftp.informatique-web.pro` ou l'IP du serveur), le **nom d'utilisateur**, le **mot de passe**, et le **port** (21 FTP / 22 SFTP).

### C. Configurer les secrets dans GitHub
Dans le dépôt GitHub → **Settings → Secrets and variables → Actions → New repository secret**, ajouter :
- `O2SWITCH_FTP_SERVER` — hôte FTP (ex. `ftp.informatique-web.pro`)
- `O2SWITCH_FTP_USERNAME` — utilisateur FTP créé
- `O2SWITCH_FTP_PASSWORD` — mot de passe FTP
- `O2SWITCH_FTP_PORT` — `21` (FTPS) ou `990` (FTP implicite) ; ajuster selon o2switch

### D. Pousser sur `main` → déploiement auto
Une fois les fichiers du workflow poussés sur `main`, GitHub Actions compile et transfère. Vérifier l'onglet **Actions** du dépôt GitHub ; un run vert = site en ligne sur `https://rgpd.informatique-web.pro`.

## Points techniques / sécurité
- **Certificat SSL** : o2switch fournit un Let's Encrypt gratuit. Dans cPanel → **SSL/TLS** (ou *AutoSSL*), activer le certificat pour `rgpd.informatique-web.pro`, et forcer la redirection HTTPS dans cPanel (ou le `.htaccess`).
- **Backend Lovable Cloud** : aucun changement. Le frontend o2switch continue d'appeler l'API Lovable Cloud via HTTPS (CORS déjà ouvert côté Supabase). Les identifiants Supabase (URL + clé publishable) sont intégrés au build, c'est normal et sûr — ce sont des clés publiables.
- **Base path** : le site est servi à la racine du sous-domaine, donc pas de `base` personnalisé à configurer.
- **Bouton « Publier » Lovable** : non concerné. On déploie le build statique ailleurs ; le backend reste sur Lovable. `rgpd.lovable.app` reste actif en parallèle.

## Alternative manuelle (si tu ne veux pas de CI/CD)
Local : `npm run build` → ouvrir `dist/` → tout uploader dans `public_html/rgpd/` via le Gestionnaire de fichiers cPanel ou FileZilla. À refaire à chaque mise à jour. Le `.htaccess` reste nécessaire.

## Plan de validation
1. Après push, le run GitHub Actions passe au vert.
2. `https://rgpd.informatique-web.pro` affiche la page de connexion.
3. Test refresh sur une route interne (`/portail/actions`) → pas de 404 (validateur du `.htaccess`).
4. Connexion d'un compte → l'auth Lovable Cloud répond → page dashboard.
