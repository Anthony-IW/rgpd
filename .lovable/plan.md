# Déploiement de l'app RGPD sur rgpd.informatique-web.pro (o2switch)

## D'abord : quel dossier utiliser ? (ta question)

Tu as maintenant **deux dossiers** côté o2switch. Voici ce qu'ils sont et lequel choisir :

1. **Le dossier « Setup Node.js App » (créé automatiquement quand tu as activé Node.js)** — c'est un environnement pour faire tourner une **application Node serveur** (Express, etc.) via Passenger. **Ne l'utilise pas pour ce site.** Une app Vite/React est un site **statique** : ce sont des fichiers HTML/CSS/JS à servir par Apache, pas un programme Node à exécuter. Ce dossier contient des fichiers modèles (`app.js`…) qui ne sont pas les tiens.
   → Action : **supprime cette application Node** dans cPanel → *Setup Node.js App* → (l'icône corbeille sur l'app). Cela retire aussi les règles Passenger/`.htaccess` qu'elle a ajoutées et qui viendraient parasiter le sous-domaine.

2. **Le dossier où tu as importé les fichiers GitHub** — c'est le **code source** du projet (les `.tsx`, `.ts`, `package.json`…). Important : le code source **ne s'affiche pas tel quel** dans un navigateur. Il faut d'abord le **compiler** (`npm install` + `npm run build`) pour obtenir un dossier `dist/` contenant les fichiers prêts à servir. On ne sert donc **pas** ce dossier directement.

3. **Le dossier à servir = la racine du sous-domaine** (le *Document Root*). C'est ce dossier qui s'affiche à l'URL `rgpd.informatique-web.pro`.
   - Dans cPanel → **Sous-domaines** → clique sur le sous-domaine `rgpd` → note le **Document Root** indiqué (en général `public_html/rgpd`).
   - C'est **dans ce dossier** que doivent atterrir les fichiers compilés (`dist/*` + `.htaccess`).

Résumé de la décision :
```text
Dossier Node.js App        → supprimer (inutile, conflit)
Dossier source GitHub       → sert seulement à compiler (pas servi)
Document Root du sous-domaine (public_html/rgpd)  → cible du déploiement (servi)
```

## Principe général
L'application est un **SPA React/Vite** (frontend statique) publié sur Lovable à `rgpd.lovable.app`. Le backend (base, auth, edge functions) reste sur **Lovable Cloud** — rien à installer côté o2switch : le frontend interrogera toujours le backend Lovable via HTTPS. On ne met sur o2switch que les fichiers statiques issus du build (`dist/`).

Choix par défaut : **CI/CD GitHub Actions** qui compile puis envoie `dist/` sur o2switch par FTP. À chaque `git push` sur `main`, le site se met à jour tout seul.

## Ce que j'ajoute au dépôt (fichiers de configuration)

1. **`public/.htaccess`** — routing SPA sous Apache (o2switch = Apache/cPanel).
   - `RewriteEngine On` : toute URL qui n'est pas un fichier/répertoire existant est renvoyée vers `index.html` (pour que `/audit/123`, `/portail/actions`, refresh de page… fonctionnent sans 404).
   - Mise en cache des assets `assets/*` + `favicon`, en-têtes de sécurité de base.
   - Vite copie automatiquement `public/.htaccess` à la racine de `dist/` lors du build.

2. **`.github/workflows/deploy-o2switch.yml`** — pipeline GitHub Actions.
   - Déclenché sur `push` vers `main`.
   - Étapes : `actions/checkout` → `setup-node` (20) → `npm ci` → `npm run build` → déploiement FTP du dossier `dist/` vers le Document Root o2switch via une action type `SamKirkland/FTP-Deploy-Action`.
   - Identifiants FTP depuis des **secrets GitHub** (`O2SWITCH_FTP_SERVER`, `O2SWITCH_FTP_USERNAME`, `O2SWITCH_FTP_PASSWORD`, `O2SWITCH_FTP_PORT`), jamais en clair.

Aucune modification du code applicatif, aucune modification du backend.

## Étapes à réaliser de ton côté (cPanel o2switch)

### A. Nettoyer + identifier la cible
1. cPanel → **Setup Node.js App** → supprime l'application Node créée automatiquement (inutile pour un site statique).
2. cPanel → **Sous-domaines** → ouvre `rgpd.informatique-web.pro` → note le **Document Root** (souvent `public_html/rgpd`). C'est la cible du déploiement.

### B. Créer un compte FTP dédié (recommandé)
1. cPanel → **Comptes FTP** → Ajouter.
   - Répertoire de connexion : le **Document Root** du sous-domaine (`public_html/rgpd/`), pour limiter l'accès à ce sous-domaine.
   - Note : **hôte FTP** (`ftp.informatique-web.pro` ou l'IP du serveur), **utilisateur**, **mot de passe**, **port** (21 FTP / 22 SFTP).

### C. Configurer les secrets dans GitHub
Dépôt GitHub → **Settings → Secrets and variables → Actions → New repository secret** :
- `O2SWITCH_FTP_SERVER` — hôte FTP
- `O2SWITCH_FTP_USERNAME` — utilisateur FTP créé
- `O2SWITCH_FTP_PASSWORD` — mot de passe FTP
- `O2SWITCH_FTP_PORT` — `21` (ou `990`/`22` selon ta config o2switch)

### D. Pousser sur `main` → déploiement auto
Une fois le workflow poussé sur `main`, GitHub Actions compile et transfère. Vérifier l'onglet **Actions** du dépôt GitHub ; un run vert = site en ligne sur `https://rgpd.informatique-web.pro`.

## Points techniques / sécurité
- **Certificat SSL** : o2switch fournit un Let's Encrypt gratuit. cPanel → **SSL/TLS** (ou *AutoSSL*) : activer le cert pour `rgpd.informatique-web.pro` et forcer la redirection HTTPS.
- **Backend Lovable Cloud** : inchangé. Le frontend o2switch appelle l'API Lovable Cloud via HTTPS (CORS déjà ouvert côté Supabase). Les identifiants Supabase (URL + clé publishable) sont intégrés au build — ce sont des clés publiables, c'est normal et sûr.
- **Base path** : servi à la racine du sous-domaine, pas de `base` personnalisé.
- **Bouton « Publier » Lovable** : non concerné. Le backend reste sur Lovable ; `rgpd.lovable.app` reste actif en parallèle.

## Alternative : compiler directement sur o2switch (sans CI/CD)
Si tu préfères te passer de GitHub Actions et que tu as un accès **SSH** (cPanel → *Terminal* ou SSH) :
1. Se placer dans le dossier où tu as importé les sources GitHub.
2. `npm install` puis `npm run build` (surveille la mémoire ; un build peut échouer sur un hébergement mutualisé trop juste — d'où l'intérêt du CI/CD).
3. Copier le contenu de `dist/` (`.htaccess` inclus) dans le **Document Root** du sous-domaine.
4. Refaire à chaque mise à jour.
Si le build plante sur o2switch (mémoire/timeout), reviens à la méthode CI/CD ci-dessus — c'est exactement ce qu'elle évite.

## Plan de validation
1. Le run GitHub Actions passe au vert (ou le build local aboutit).
2. `https://rgpd.informatique-web.pro` affiche la page de connexion.
3. Refresh sur une route interne (`/portail/actions`) → pas de 404 (validateur du `.htaccess`).
4. Connexion d'un compte → l'auth Lovable Cloud répond → page dashboard.
