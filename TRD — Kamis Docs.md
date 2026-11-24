# TRD — Kamis Docs

**Statut :** proposition technique à valider  
**Version :** 0.1  
**Langue :** français  
**Document produit associé :** [PRD.md](./PRD.md)

## 1. But et portée

Ce document décrit une architecture technique proposée pour le MVP de Kamis Docs : application web responsive, inscription ouverte avec accès individuel, téléversement et gestion de fichiers dans un espace privé. Il ne constitue pas encore une décision de déploiement ni une promesse de niveau de service. Les choix dépendant du fournisseur, du budget ou de la juridiction sont marqués **À confirmer**.

## 2. Principes d’architecture

1. **Privé par défaut :** chaque document est rattaché à un propriétaire et aucune opération de fichier ne fait confiance à un identifiant envoyé par le navigateur.
2. **Séparation des métadonnées et des octets :** base de données pour les comptes et informations descriptives; stockage d’objets privé pour le contenu des fichiers.
3. **Accès contrôlé par le serveur :** le client web ne reçoit jamais de clés d’administration ni de secrets de stockage.
4. **Conception pour reprise :** les états de téléversement, suppressions et opérations de stockage doivent pouvoir être réconciliés après une interruption.
5. **Évolutivité raisonnable :** commencer par un monolithe modulaire; n’introduire ni microservices ni synchronisation multi-appareils en arrière-plan au MVP.

## 3. Architecture logique proposée

```text
Navigateur (React / TypeScript)
        │ HTTPS — session authentifiée
        ▼
API applicative (Node.js / TypeScript)
   ├── Authentification et sessions
   ├── Autorisation par propriétaire
   ├── Métadonnées et quotas ───────► Base SQL gérée
   ├── Téléversement / téléchargement ─► Stockage d’objets privé
   ├── E-mail de vérification / récupération ─► Fournisseur transactionnel
   └── Journaux, métriques et alertes
```

**Stack de référence proposée :** React et TypeScript côté navigateur; Node.js/Express et TypeScript côté serveur; API tRPC ou REST typée; Drizzle ORM; MySQL relationnel géré; stockage d’objets durable privé derrière une interface applicative; service d’e-mail transactionnel. Cette proposition est cohérente avec le starter Web géré disponible dans l’environnement cible, mais les fournisseurs et versions doivent être confirmés au moment de l’initialisation et du déploiement.

## 4. Modules logiciels

| Module | Responsabilités |
| --- | --- |
| `web` | Pages publiques, inscription, connexion, espace fichiers, formulaires, progression de transfert et accessibilité. |
| `api/auth` | Inscription, vérification e-mail, connexion, sessions, déconnexion et réinitialisation. |
| `api/files` | Autorisation, validation des entrées, opérations de métadonnées, quota, téléversement, téléchargement et suppression. |
| `api/storage` | Interface fournisseur de stockage, clés d’objets générées côté serveur, URL de transfert privées/temporaires si supportées. |
| `api/mail` | Envoi des messages de vérification et de récupération, modèles et gestion des erreurs. |
| `api/audit` | Événements de sécurité et d’exploitation minimisés, sans contenu ni secrets. |
| `db` | Schéma, migrations, contraintes d’intégrité et accès aux données. |
| `shared` | Schémas de validation, types communs et constantes non sensibles. |

## 5. Modèle de données proposé

### `users`

- `id` : UUID/identifiant opaque, clé primaire.
- `email_normalized` : adresse normalisée, unique.
- `password_hash` : hachage adaptatif; jamais le mot de passe en clair.
- `email_verified_at` : nullable avant vérification.
- `status` : état du compte (actif, suspendu, suppression demandée).
- `created_at`, `updated_at`.

### `sessions` (ou sessions gérées par le fournisseur d’authentification)

- Identifiant de session opaque ou empreinte du jeton, `user_id`, date de création, expiration et révocation.
- Les jetons de session ne sont ni exposés dans le stockage local JavaScript ni journalisés.

### `files`

- `id` : UUID/identifiant non prédictible.
- `owner_user_id` : clé étrangère vers `users.id`, indexée.
- `original_name` : nom d’affichage validé, échappé lors du rendu.
- `object_key` : clé interne générée aléatoirement; unique, jamais dérivée du nom utilisateur.
- `content_type_claimed` : type annoncé par le client, non fiable.
- `size_bytes`, `checksum` (si calculé et adapté), `created_at`.
- `state` : `pending`, `ready`, `deleting`, `failed`.

### `user_storage_usage` ou agrégation calculée

- `user_id`, `used_bytes`, `quota_bytes`, `updated_at`.
- Si usage matérialisé, mise à jour transactionnelle ou réconciliation périodique; éviter les compteurs concurrents erronés.

**Règles d’intégrité :** supprimer ou anonymiser selon la politique de compte; clés étrangères et index couvrant les consultations `owner_user_id + created_at`; aucune requête client ne peut choisir un `owner_user_id` arbitraire.

## 6. Contrats d’API envisagés

Routes indicatives, à adapter à l’API choisie :

| Opération | Route indicative | Règles essentielles |
| --- | --- | --- |
| Inscription | `POST /api/auth/register` | Validation, limitation de débit, réponse neutre, envoi du lien de confirmation. |
| Vérification | `POST /api/auth/verify-email` | Jeton aléatoire à usage unique et durée limitée. |
| Connexion | `POST /api/auth/login` | Réponse générique en cas d’échec; création de session sécurisée. |
| Déconnexion | `POST /api/auth/logout` | Révocation de la session. |
| Demande de récupération | `POST /api/auth/password-reset/request` | Même réponse qu’un compte existant ou non. |
| Changement de mot de passe | `POST /api/auth/password-reset/confirm` | Jeton à usage unique, changement du secret, révocation des sessions selon politique. |
| Liste | `GET /api/files` | Renvoie uniquement les enregistrements du compte courant; pagination. |
| Préparer transfert | `POST /api/files/upload-intents` | Vérifie quota, taille, nom et limite de débit; crée un enregistrement temporaire. |
| Finaliser transfert | `POST /api/files/{id}/complete` | Vérifie propriétaire, existence et taille de l’objet; passe à `ready`. |
| Télécharger | `GET /api/files/{id}/download` | Vérifie propriétaire avant émission d’un flux ou URL signée de courte durée. |
| Supprimer | `DELETE /api/files/{id}` | Vérifie propriétaire, marque la suppression, supprime l’objet et termine l’enregistrement de façon cohérente. |

Chaque route privée doit obtenir l’identité depuis le contexte serveur authentifié. Les décisions d’accès utilisent `file.id AND file.owner_user_id = current_user.id`; masquer une ligne non autorisée en retournant une réponse 404 uniforme est recommandé. Toute entrée est validée côté serveur. Les contrôles de sécurité ne reposent pas sur le seul masquage d’éléments dans l’interface.

## 7. Flux de stockage

### Téléversement

1. Le client demande une intention de téléversement avec nom, taille et type déclaré.
2. Le serveur authentifie l’utilisateur, vérifie les limites et réserve provisoirement la capacité nécessaire.
3. Le serveur crée une ligne `pending` et une clé d’objet aléatoire non interprétable.
4. Le fichier est transféré soit au serveur, soit directement au stockage au moyen d’une URL pré-signée privée, très limitée en durée, taille et objet. **Choix de transfert à confirmer selon les capacités du fournisseur.**
5. Le serveur valide l’objet final (présence, taille et, si nécessaire, type détecté), puis passe la ligne à `ready`.
6. Les transferts interrompus ou orphelins sont expirés/nettoyés par une tâche contrôlée; un traitement périodique réconcilie le stockage et les métadonnées.

Aucun objet partiellement téléversé ne doit apparaître comme prêt. Les clés d’objets ne sont pas dérivées du nom de fichier ni d’une donnée fournie par l’utilisateur.

### Téléchargement

Après authentification et autorisation, le serveur sert le fichier ou émet une URL signée de courte durée. Réponses recommandées : `Content-Disposition: attachment`, type de contenu prudent (`application/octet-stream` par défaut), en-têtes anti-cache et nosniff. Ne pas intégrer le contenu fourni comme HTML actif dans l’origine applicative.

### Suppression

Utiliser une suppression idempotente. Marquer l’enregistrement `deleting`, supprimer l’objet, puis effacer ou conserver le tombstone minimal selon la politique de rétention. Si l’un des systèmes échoue, conserver un état réconciliable et réessayer sans rendre le fichier accessible. La durée de corbeille et l’effacement final des copies de sauvegarde sont **à confirmer**.

## 8. Authentification et sécurité

- Préférer un mécanisme de session géré côté serveur dans un cookie `HttpOnly`, `Secure` en HTTPS, `SameSite` adapté à l’architecture; protection CSRF pour les opérations modifiantes lorsque pertinente.
- Stocker les mots de passe avec Argon2id ou bcrypt correctement paramétré; définir les paramètres selon le runtime et les recommandations courantes au moment du développement.
- Vérifier l’adresse e-mail avant l’accès complet ou selon une politique de produit décidée; jetons aléatoires à usage unique, stockés sous forme d’empreinte et expirant rapidement.
- Limiter les tentatives d’inscription, connexion et récupération par IP et/ou compte; réponse de récupération non révélatrice.
- Révoquer ou renouveler les sessions sur événements sensibles; définir expiration inactive et absolue.
- Appliquer TLS pour l’ensemble des connexions; gérer les secrets par le gestionnaire de secrets de la plateforme.
- Mettre à jour les dépendances, sécuriser les en-têtes HTTP, appliquer une politique CSP compatible, limiter la taille des corps de requête et vérifier l’origine des requêtes selon le modèle retenu.
- Ne jamais journaliser les mots de passe, cookies, jetons, liens complets de récupération, contenus ou URL signées.
- Définir un processus de signalement, suspension de compte et réponse aux incidents avant ouverture au public.

### Chiffrement des fichiers au repos — décision requise

Le minimum attendu est le chiffrement au repos offert et documenté par le fournisseur de stockage, avec contrôle des permissions d’accès. Le chiffrement côté client avec clé contrôlée par l’utilisateur renforcerait la confidentialité, mais complique la récupération de compte, la prévisualisation, la recherche et l’assistance. Ne pas annoncer le chiffrement de bout en bout avant une conception et une validation explicites.

## 9. Confidentialité, rétention et conformité

Avant lancement, préciser les pays ciblés, région d’hébergement, identité de l’opérateur, politique de confidentialité, conditions d’utilisation, traitement des demandes de suppression/export, conservation des logs et mécanismes de réponse aux demandes légales. Aucune affirmation de conformité réglementaire ne doit être faite sans examen approprié. Collecter le minimum d’informations personnelles. Les journaux d’audit doivent avoir une durée définie et des accès limités.

## 10. Fiabilité, sauvegarde et reprise

- Les données persistantes doivent être dans les services durables prévus, et non dans le disque temporaire du conteneur.
- Les sauvegardes de métadonnées et la durabilité du stockage de fichiers doivent être configurées séparément et documentées.
- Définir les objectifs de point de reprise (RPO) et de délai de reprise (RTO) selon le budget et les fournisseurs; valeurs **à confirmer** avant promesse client.
- Réaliser des exercices de restauration dans un environnement contrôlé et consigner les résultats.
- Alerter sur les erreurs d’écriture, incohérences d’état, échecs de courriel, hausse anormale de volume et espace disponible.
- Définir une procédure d’incident incluant suspension temporaire des transferts, rotation de secrets et communication aux utilisateurs selon les obligations applicables.

## 11. Déploiement et configuration

- Environnements séparés pour développement, préproduction et production; comptes et clés distincts.
- Migrations versionnées, revues, répétables et compatibles avec un déploiement contrôlé.
- Déploiement reproductible depuis le dépôt et le fichier de verrouillage des dépendances.
- Vérification de santé non authentifiée ne révélant aucun secret ni renseignement utilisateur.
- Gestion des configurations et secrets par variables protégées/gestionnaire de secrets; aucune clé sensible côté client.
- Prévoir une sauvegarde avant les opérations de schéma à risque et un plan de retour arrière du code; les migrations destructives requièrent une stratégie dédiée.

## 12. Observabilité

Métriques recommandées : taux et durée des téléversements, échecs de téléchargement, erreurs API, latence de base de données, occupation par utilisateur et globale, dépassements de quota, état des objets `pending`/`deleting`, erreurs de messagerie et taux de restauration. Les tableaux de bord agrègent les usages; les accès aux journaux contenant des données d’utilisateur sont limités et audités. Les seuils et destinataires d’alertes sont **à confirmer**.

## 13. Tests techniques requis

- Tests unitaires des validations, règles de quota et transitions d’état.
- Tests d’intégration des flux inscription, vérification, récupération, téléversement, téléchargement et suppression.
- Tests négatifs d’autorisation avec deux comptes distincts, identifiants devinés et session absente/expirée.
- Tests de concurrence sur quota et téléversements simultanés.
- Tests de fichiers vides, très grands, noms inhabituels, encodage, types incohérents et transfert interrompu.
- Tests de réconciliation après échec entre stockage et base de données.
- Tests de migration sur copie représentative et tests réguliers de restauration.
- Vérifications automatisées de dépendances et analyse statique/intégration continue.

## 14. Dépendances et risques techniques

| Dépendance ou risque | Conséquence | Mitigation proposée |
| --- | --- | --- |
| Stockage objet et tarifs | Coût, région, limites de fichiers et disponibilité varient. | Comparer coûts, règles de durabilité, quotas, transfert direct et exportabilité avant choix. |
| Authentification et courriels | Inscription impossible si messages bloqués ou en retard. | Vérifier domaine d’envoi, délivrabilité, expiration et parcours de renvoi. |
| Opérations multi-systèmes | Base et stockage ne partagent pas une transaction atomique. | États explicites, idempotence, nettoyage et réconciliation. |
| Inscription publique | Spam, comptes abusifs, consommation de stockage. | Vérification, quotas, rate limit, alertes et procédure de suspension. |
| Suppression/rétention | Les copies de sauvegarde peuvent persister après la suppression applicative. | Politique transparente et cycle d’expiration documenté. |
| Chiffrement côté client | Perte de clé peut rendre les fichiers irrécupérables. | Garder hors MVP sauf décision produit accompagnée d’un parcours de récupération explicite. |

## 15. Décisions techniques à prendre avant implémentation

1. Confirmer application web uniquement pour le MVP et absence de synchronisation automatique.
2. Choisir fournisseur, région, classe et politique de durabilité du stockage de fichiers.
3. Choisir fournisseur de base de données, région, sauvegardes et durée de rétention.
4. Définir fournisseur d’authentification ou confirmer implémentation e-mail/mot de passe; préciser vérification obligatoire et règles de session.
5. Définir fournisseur d’e-mail transactionnel.
6. Confirmer quota, taille maximale, formats interdits et politique de suppression.
7. Décider chiffrement au repos seul ou exploration d’un chiffrement côté client.
8. Définir RPO/RTO, politique de sauvegarde et programme de tests de restauration.
9. Confirmer juridictions, domaine, conditions, confidentialité et contact d’assistance.

## Annexe A — Références de conception

- Le PRD associé définit les besoins et les limites fonctionnelles du MVP.
- Les choix finaux de fournisseur et de versions doivent être consignés dans le dépôt et revus avant production.
- Ce TRD est une base de discussion; les paramètres indiqués comme « à confirmer » ne sont pas des décisions approuvées.
