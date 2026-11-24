# PRD — Kamis Docs

**Statut :** brouillon de cadrage, à valider  
**Version :** 0.1  
**Langue :** français  
**Produit :** Kamis Docs

## 1. Résumé

Kamis Docs est une application web de sauvegarde et de gestion de fichiers et documents. Toute personne doit pouvoir créer un compte, se connecter et accéder à son propre espace depuis un navigateur connecté à Internet. Les fichiers d’un utilisateur doivent rester privés et ne pas être visibles par les autres comptes.

Le MVP se concentre sur l’inscription, l’authentification, l’envoi de fichiers vers un espace cloud privé, la consultation, le téléchargement et la suppression. La synchronisation automatique de dossiers d’ordinateur ou de téléphone n’est pas incluse au MVP.

## 2. Problème et opportunité

Les utilisateurs ont besoin d’un endroit accessible pour conserver une copie de leurs documents et les retrouver depuis plusieurs appareils. Le produit doit rendre l’accès simple tout en protégeant les fichiers contre les accès non autorisés et les erreurs d’isolation entre comptes.

## 3. Objectifs

- Permettre à toute personne disposant d’une adresse e-mail valide de s’inscrire, sous réserve des règles anti-abus.
- Permettre à un utilisateur de se connecter et d’accéder à son compte depuis un navigateur moderne sur ordinateur, tablette ou téléphone.
- Permettre l’ajout, la liste, le téléchargement et la suppression de documents dans l’espace privé de l’utilisateur.
- Afficher clairement l’usage et la capacité de stockage disponible.
- Protéger les données par contrôle d’accès, chiffrement en transit et pratiques de sécurité adaptées.

## 4. Non-objectifs du MVP

- Synchronisation automatique et continue d’un dossier local.
- Application native Windows, macOS, Linux, iOS ou Android.
- Partage public de liens, collaboration, commentaires ou coédition.
- Prévisualisation ou édition avancée de tous les formats de fichiers.
- Sauvegarde de systèmes complets, disques, bases de données ou serveurs.
- Garantie de conservation à long terme sans politique de sauvegarde et de restauration opérationnelle validée.

## 5. Utilisateurs et besoins

### Utilisateur inscrit

Une personne qui souhaite sauvegarder et retrouver ses documents personnels ou professionnels.

**Besoins principaux :** créer un compte facilement, se connecter de façon sûre, envoyer un document, retrouver ses fichiers et les télécharger ou les supprimer.

### Administrateur de service

Personne autorisée à exploiter le service, répondre aux incidents et limiter les abus. L’accès au contenu des fichiers doit être évité par défaut; tout accès exceptionnel doit être restreint, justifié et auditable selon la politique de confidentialité à définir.

## 6. Parcours principaux

1. Le visiteur ouvre Kamis Docs et choisit « Créer un compte ».
2. Il saisit son adresse e-mail et un mot de passe, accepte les conditions applicables et confirme son adresse par e-mail.
3. Il se connecte et arrive dans son espace de fichiers.
4. Il sélectionne un ou plusieurs fichiers, voit la progression et reçoit un résultat de réussite ou une erreur explicite.
5. Il consulte ses fichiers, les télécharge ou les supprime après confirmation.
6. Il peut fermer sa session et demander une réinitialisation de mot de passe.

## 7. Exigences fonctionnelles

### Comptes et accès

- **PR-ACC-01 — Inscription ouverte :** tout visiteur peut demander la création d’un compte. Les règles anti-abus et la vérification d’adresse e-mail s’appliquent.
- **PR-ACC-02 — Connexion :** un utilisateur vérifié peut s’authentifier avec son adresse e-mail et son mot de passe.
- **PR-ACC-03 — Réinitialisation :** un utilisateur peut demander un lien de réinitialisation à durée limitée sans révéler si une adresse est inscrite.
- **PR-ACC-04 — Déconnexion :** l’utilisateur peut terminer sa session.
- **PR-ACC-05 — Isolation :** un compte ne peut lister, lire, télécharger, modifier ou supprimer les fichiers appartenant à un autre compte.

### Fichiers

- **PR-FIL-01 — Téléversement :** l’utilisateur peut téléverser un ou plusieurs fichiers via une interface web; la progression et l’état de chaque téléversement sont visibles.
- **PR-FIL-02 — Validation :** le système refuse les fichiers dépassant les limites configurées et signale clairement les erreurs.
- **PR-FIL-03 — Liste :** l’utilisateur peut voir le nom, le type, la taille et la date de téléversement de ses fichiers.
- **PR-FIL-04 — Téléchargement :** l’utilisateur peut récupérer une copie de son fichier après vérification de ses droits.
- **PR-FIL-05 — Suppression :** l’utilisateur peut supprimer un fichier et reçoit une confirmation du résultat.
- **PR-FIL-06 — Quota :** le produit indique l’espace utilisé et la limite autorisée; un téléversement qui dépasserait le quota est refusé sans laisser de fichier incomplet inaccessible.
- **PR-FIL-07 — Noms sûrs :** le nom fourni par le client est traité comme une donnée non fiable et ne détermine jamais le chemin physique de stockage.

### Interface et accessibilité

- **PR-UX-01 :** l’application est responsive et utilisable sur ordinateur, tablette et téléphone.
- **PR-UX-02 :** l’interface est disponible en français au lancement; l’architecture doit permettre d’ajouter d’autres langues ultérieurement.
- **PR-UX-03 :** les états de chargement, succès, erreur, espace vide et quota atteint sont compréhensibles.
- **PR-UX-04 :** les formulaires ont des libellés et messages d’erreur accessibles au clavier et aux technologies d’assistance.

### Compte et données

- **PR-DAT-01 :** l’utilisateur peut consulter les paramètres essentiels de son compte.
- **PR-DAT-02 :** l’utilisateur peut demander la suppression de son compte et de ses fichiers, selon une politique de suppression et de rétention affichée.
- **PR-DAT-03 :** les règles de conservation des fichiers supprimés, des journaux et des sauvegardes techniques doivent être documentées avant la mise en production.

## 8. Exigences non fonctionnelles

- **Sécurité :** chiffrement HTTPS en transit; contrôle d’accès côté serveur pour toute opération; mots de passe stockés sous forme de hachage adaptatif avec sel; limitation des tentatives; protection contre les attaques web usuelles; secrets hors du code source.
- **Confidentialité :** aucun accès public par défaut aux objets stockés; URLs de téléchargement privées et temporaires si nécessaires; minimisation des données collectées.
- **Disponibilité :** objectif initial proposé de 99,5 % mensuel pour le service applicatif, à confirmer selon l’infrastructure et le budget; les sauvegardes ne sont pas considérées comme garanties avant validation des restaurations.
- **Performance :** les listes et métadonnées doivent rester réactives pour un compte dans les limites de l’offre; le transfert des fichiers doit utiliser une stratégie adaptée aux fichiers volumineux.
- **Compatibilité :** dernières versions majeures de Chrome, Firefox, Safari et Edge; interface adaptée aux navigateurs mobiles modernes.
- **Traçabilité :** journaliser les événements de sécurité nécessaires sans enregistrer le contenu des fichiers, mots de passe ou jetons sensibles.

## 9. Proposition de limites initiales — à valider

Ces valeurs sont des hypothèses de cadrage, pas des engagements commerciaux :

| Paramètre | Proposition MVP |
| --- | --- |
| Taille maximale d’un fichier | 100 MiB |
| Quota de stockage par compte | 5 GiB |
| Téléversements simultanés par utilisateur | 3 |
| Types de fichiers | Tous types, sans exécution ni interprétation côté serveur; liste de restrictions anti-abus à définir |
| Vider définitivement la corbeille | Immédiat au MVP, ou période de rétention à décider |

Les coûts de stockage, de bande passante, de courriels et d’exploitation doivent être chiffrés avant de fixer l’offre gratuite ou payante.

## 10. Indicateurs de réussite

- Taux de création de compte terminée après démarrage de l’inscription.
- Taux de réussite des téléversements et téléchargements.
- Nombre d’erreurs d’accès inter-comptes; cible : zéro.
- Temps de réponse des opérations de liste et de métadonnées.
- Nombre de restaurations de fichiers réussies lors des exercices opérationnels.
- Taux de demandes de support liées à la perte ou l’inaccessibilité des fichiers.

## 11. Critères d’acceptation du MVP

- Un nouvel utilisateur peut créer un compte, vérifier son adresse et se connecter.
- Un utilisateur peut demander la réinitialisation de son mot de passe sans révélation de l’existence du compte.
- Un utilisateur peut téléverser des fichiers respectant les limites, voir leur progression, les retrouver dans sa liste, les télécharger puis les supprimer.
- Le quota est affiché et imposé côté serveur.
- Les tentatives d’accès aux fichiers d’un autre compte sont refusées, y compris en modifiant manuellement les identifiants de requête.
- Un utilisateur non authentifié ne peut accéder aux pages ou opérations privées.
- Les fichiers ne sont pas accessibles par une URL publique permanente.
- Les politiques de rétention, suppression de compte, capacité et limites sont présentées avant lancement.

## 12. Risques et mesures

- **Compte compromis :** vérification e-mail, protections de connexion, réinitialisation sûre; envisager MFA après MVP.
- **Mauvaise isolation des fichiers :** autorisation vérifiée côté serveur à chaque requête et tests dédiés.
- **Perte ou corruption :** sauvegardes du stockage et métadonnées, procédures de restauration testées, suivi des échecs.
- **Abus de stockage ou contenu malveillant :** limites, quotas, limitation de débit, politique d’usage acceptable; analyse antivirus à évaluer selon le coût et le risque.
- **Coûts inattendus :** quotas, alertes d’usage et métriques de stockage/transfert.
- **Attentes erronées de sauvegarde :** expliquer que le MVP est un coffre de fichiers web et non un agent de synchronisation ou une solution de reprise complète.

## 13. Décisions à confirmer avec le propriétaire

1. Lancement web uniquement ou application de bureau/mobile plus tard?
2. Quels pays et quelles régions de stockage sont visés?
3. Quota initial, taille maximale et offre gratuite/payant?
4. Les fichiers supprimés doivent-ils rester récupérables (corbeille et durée)?
5. Faut-il chiffrer les fichiers côté client avec une clé que le fournisseur ne peut pas récupérer, ou privilégier une récupération de compte plus simple?
6. Faut-il partager des fichiers ou dossiers dans une version ultérieure?
7. Quel nom de domaine, adresse d’assistance et politique de confidentialité/conditions d’utilisation?
8. Quel fournisseur d’e-mail transactionnel et quel budget d’exploitation?

---

## Glossaire

- **MVP :** première version limitée aux fonctions essentielles.
- **Quota :** capacité maximale de stockage allouée à un compte.
- **Objet :** fichier stocké dans le service de stockage binaire.
- **Métadonnées :** informations descriptives d’un fichier, par exemple son nom, sa taille et sa date d’ajout.
