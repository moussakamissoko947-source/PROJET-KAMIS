# Kamis Docs — Coffre-fort de Documents & Fichiers Privé

Application web sécurisée de sauvegarde et de gestion de documents personnels et professionnels, conçue selon les spécifications strictes du [PRD](./PRD%20—%20Kamis%20Docs.md) et du [TRD](./TRD%20—%20Kamis%20Docs.md).

---

## 🎯 Fonctionnalités Clés

### 1. Comptes & Authentification Sécurisée
- **Inscription avec validation e-mail (PR-ACC-01)** : Jeton cryptographique à usage unique (32 octets hex) avec expiration 24h.
- **Authentification par session (PR-ACC-02)** : Cookie HTTP-Only `SameSite=Lax`, révocation de session en base de données.
- **Réinitialisation de mot de passe (PR-ACC-03)** : Réponse non révélatrice pour prévenir l'énumération de comptes, révocation immédiate de toutes les anciennes sessions après réinitialisation.
- **Cloisonnement strict (PR-ACC-05)** : Isolation stricte inter-comptes côté serveur (`file.owner_user_id = current_user.id`). Toute tentative d'accès non autorisé est journalisée et masquée.
- **Droit à l'effacement (PR-DAT-02)** : Suppression définitive du compte avec destruction de tous les fichiers du stockage et de la base de données.

### 2. Gestion des Fichiers & Quota
- **Téléversement multi-fichiers avec progression (PR-FIL-01)** : Glisser-déposer (Drag & Drop), sélection multiple, barres de progression individuelles.
- **Contrôle strict des quotas côté serveur (PR-FIL-06)** : Quota par défaut de 5 Go par compte, vérification avant écriture et refus immédiat sans résidu en cas de dépassement.
- **Limitation de taille (PR-FIL-02)** : 100 Mo max par fichier.
- **Noms de fichiers sécurisés (PR-FIL-07)** : Nettoyage contre les attaques de traversée de répertoire (`../../`). Le chemin physique utilise des clés UUID opaques indépendantes du nom fourni par le client.
- **Téléchargement sécurisé (PR-FIL-04)** : En-têtes `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff`.
- **Aperçu multimédia intégré** : Images (zoom), vidéos et fichiers audio (lecteurs HTML5), texte/code brut et documents PDF.
- **Recherche & Filtres** : Recherche instantanée par nom, filtrage par catégorie (Documents, Images, Vidéos, Audio, Archives), tri par date, nom ou taille.

### 3. Observabilité & Audit de Sécurité
- Journalisation structurée en base de données (`audit_logs`) sans fuite de mots de passe ou de contenus de fichiers.
- Boîte de réception Dev (`/api/dev/mailbox`) permettant de tester les liens d'activation et de réinitialisation sans configuration SMTP externe.

---

## 🏗️ Architecture Technique

```
projet-kamis/
├── server/                   # Backend Node.js / Express / TypeScript
│   ├── config.ts             # Configuration centralisée & variables d'environnement
│   ├── app.ts                # Application Express, middlewares de sécurité (Helmet, CORS)
│   ├── index.ts              # Point d'entrée serveur (port 5000)
│   ├── db/
│   │   ├── database.ts       # Connexion SQLite (better-sqlite3), WAL, foreign keys
│   │   └── repositories/     # Repositories (User, Session, File, Token, Audit)
│   ├── services/
│   │   ├── authService.ts    # Inscription, connexion, validation, réinitialisation
│   │   ├── fileService.ts    # Gestion fichiers, assainissement, calcul de quota
│   │   ├── storageService.ts # Fournisseur de stockage privé (LocalStorageProvider)
│   │   ├── mailService.ts    # Service de messagerie (SMTP & boîte dev)
│   │   └── auditService.ts   # Journal d'audit de sécurité
│   ├── middleware/
│   │   ├── authMiddleware.ts # Vérification de session et contrôle d'accès
│   │   ├── rateLimiter.ts    # Limitation de débit (brute-force protection)
│   │   └── errorHandler.ts  # Formatage unifié des erreurs
│   ├── routes/               # Routes REST (/api/auth, /api/files, /api/account, etc.)
│   └── tests/
│       ├── runAllTests.ts    # 24 tests unitaires et d'isolation inter-comptes
│       └── e2eHttpTest.ts    # Test d'intégration bout-en-bout HTTP
├── client/                   # Frontend React 19 + Vite 8 + Tailwind CSS v4
│   ├── src/
│   │   ├── api/client.ts     # Client d'API typé
│   │   ├── context/          # AuthContext et NotificationContext (Toaster)
│   │   ├── components/       # QuotaGauge, Navbar, Sidebar, Dropzone, Modales, Tables
│   │   ├── pages/            # Dashboard, Connexion, Inscription, Vérification, Paramètres
│   │   └── utils/            # Formatage d'octets, dates en français, catégories
│   └── dist/                 # Application web compilée servie par le backend
└── data/                     # Base SQLite et stockage privé des objets
```

---

## 🚀 Démarrage Rapide

### 1. Lancer les tests automatisés

```bash
npm test
```
*Exécute la suite complète de 24 tests unitaires et de sécurité multi-tenant, suivie du test end-to-end HTTP.*

### 2. Démarrer le serveur complet (Backend + Frontend intégré)

```bash
npm run server
```
*Le serveur démarre sur le port configuré et sert à la fois les API REST `/api/*` et l'interface web React officielle.*

### 3. Mode développement (avec rechargement à chaud Vite)

- Terminal 1 : `npm run dev:server` (serveur backend avec `tsx watch`)
- Terminal 2 : `npm run client` (serveur Vite frontend sur `http://localhost:5173`)

---

## 🔒 Modèle de Sécurité Implémenté

| Menace | Mitigation Kamis Docs |
| --- | --- |
| **Accès inter-comptes (IDOR)** | Vérification stricte systématique `owner_user_id = current_user.id`. Les identifiants forgés renvoient une erreur uniforme 404/403 et déclenchent un événement d'audit `SECURITY_CROSS_TENANT_DENIED`. |
| **Attaque par force brute** | Rate-limiter en mémoire sur `/api/auth/login`, `/api/auth/register` et `/api/auth/password-reset/*`. |
| **Vol de session** | Cookie de session `HttpOnly`, `SameSite=Lax`, `Secure` en HTTPS, avec révocation immédiate en base de données lors de la déconnexion ou de la réinitialisation de mot de passe. |
| **Traversée de répertoires** | Nom d'origine assaini (`sanitizeFilename`) ; le fichier sur disque utilise une clé UUID v4 aléatoire hors de la racine web (`LocalStorageProvider.resolveSafePath`). |
| **Dépassement de quota** | Contrôle pré-écriture transactionnel ; tout dépassement de quota (5 Go) est rejeté immédiatement avec code d'erreur explicite sans laisser de résidu corrompu. |
| **Exécution de script côté client** | En-têtes `X-Content-Type-Options: nosniff`, téléchargements forcés en `attachment` pour les formats non sûrs. |
