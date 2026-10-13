# Recette MVP — 13 octobre 2026

## Périmètre et environnement

Branche `feat/linear-mvp`, créée depuis `origin/develop` à `ee16dc2`.
Recette sur `http://localhost:3000`, avec SQLite dédiée, données explicitement
fictives et deux comptes de l'instance **Clerk de test**. Aucune publication dans
la base Turso distante, aucun changement de configuration ou déploiement Coolify.
Les deux comptes de test créés pour cette recette et leurs fichiers de session
ont été supprimés après validation. Les données fictives restent uniquement
dans la base SQLite locale de recette.

Chromium, vues desktop 1440 px et mobile 390 px. Le navigateur intégré T3 a
échoué deux fois par timeout sur la même étape ; le navigateur Codex n'était pas
disponible. La recette a donc utilisé Playwright local. Les formulaires de
connexion et d'inscription réels ont été exercés, avec les adresses réservées
`+clerk_test` et le mécanisme officiel de test Clerk, sans contournement ajouté
au produit. La validation mobile ne couvre pas Safari/iOS sur appareil physique.

## Contrôles automatisés

- `bun run test` : **55 tests, 164 assertions, zéro échec** ; exécution isolée
  pour éviter la contamination des mocks entre fichiers.
- `bun run typecheck` : réussi.
- `bun run build` : réussi, listener Nitro `.output/server/index.mjs` généré.
- `git diff --check` : réussi.

Les tests métier utilisent les migrations, contraintes et transactions réelles
sur SQLite temporaire ; Clerk et PostHog sont simulés dans ces seuls tests.
Ils couvrent notamment les refus invités, deux membres indépendants, les
rollback après erreur d'image, les contributions dupliquées, la découverte
d'un ancien spot après 24 plus récents, les pannes analytics après commit et
le cache officiel des communes. La migration `0004` préserve les lieux et sa
réexécution via le migrateur est vérifiée.

## Parcours réellement exercés

- **Authentification** : connexion puis retour vers l'ajout de lieu ; inscription
  puis retour au profil ; mot de passe incorrect affiché, reprise de connexion
  et retour à la fiche depuis le bouton de contribution ; déconnexion et refus
  d'accès au profil privé. Les liens de favoris et de contribution transmettent
  maintenant la destination locale.
- **Communes et carte** : suggestions Les Abymes et Fort-de-France, sélection
  clavier, changement de territoire, saisie manuelle pour « Autre ». Le centre
  communal ne remplit ni n'écrase les coordonnées du spot. Clic carte et saisie
  des coordonnées vérifiés. Un repère existant ouvre son aperçu et expose le
  lien vers sa fiche sans déplacer le point du brouillon. Les huit territoires
  pris en charge ont aussi été interrogés directement auprès du service officiel.
- **Publication** : création réelle d'un spot fictif et navigation vers sa fiche,
  avec coordonnées, catégorie, observation terrain et image externe créditée.
- **Contributions** : texte trop court refusé, publication d'un retour avec note,
  accès, lumière, période, affluence et image externe ; contenu retrouvé sur la
  fiche, note agrégée et deux images dans la galerie, persistance vérifiée en base.
- **Profils et favoris** : bio enregistrée et retrouvée sur le profil public sans
  email ; second membre distinct ; ajout/retrait/rechargement/reconnexion d'un
  favori ; le retrait par A ne retire pas le favori de B et la modification du
  profil de B ne change pas celui de A.
- **Découverte** : recherche sans résultat, message explicite, remise à zéro des
  filtres et retour du spot. La couverture au-delà de 24 lieux est automatisée.
- **Interface** : menu de compte lisible et utilisable à 390 px ; profil, fiche
  et ajout inspectés en mobile ; fiche inspectée en desktop ; galerie modale,
  touche Échap et restitution du focus vérifiées. Pas de débordement horizontal
  observé sur le profil et la fiche à 390 px.

## Runtime construit

Le listener Nitro a été démarré sur `127.0.0.1:3100` avec la base locale : accueil,
découverte, fiche et profil public répondent 200 ; profil inexistant 404 ;
`/nouveau-lieu` et `/profil` répondent 307 vers la connexion avec destination.

Même contrôle sur `127.0.0.1:3101` sans les variables Clerk du **processus serveur** :
les pages publiques répondent, les profils inconnus restent en 404, les routes
privées redirigent et la connexion affiche « Connexion indisponible ». Ce contrôle
réutilise le bundle construit avec une clé publique de test ; il ne prétend pas
être un second build sans clé. Les helpers sans configuration sont aussi testés.

## Limites et décisions restantes

- **R2** : l'erreur d'upload non configuré est visible et conserve le formulaire ;
  l'ajout d'une URL externe permet ensuite de publier. Aucun upload réussi R2
  n'est revendiqué. Lecture CLI Coolify du 13 octobre : aucune des cinq variables
  R2 attendues dans `vps2 / shootareas-web`, ni dans les variables partagées
  inspectées. L'environnement du processus distant n'a pas été inspecté.
- **Instagram** : pas de recette réelle d'aperçu avec `META_APP_ACCESS_TOKEN`.
- **MAR-19** : droit et processus de modification d'un lieu encore à décider.
- **Livraison** : validation locale agent uniquement ; pas de fusion, de
  déploiement démo ou de QA humaine. Aucun build Docker local exécuté.
- Le workflow MAR ne possède pas d'état « À valider ». Les tickets repris sont
  conservés « En cours », avec preuves et limites, sans passage en « À tester »
  ni « Done ».

Les anciens doublons MAR-17/MAR-18 et le ticket de menu devenu sans objet MAR-32
ont été supprimés avec l'autorisation de Marvin et une sauvegarde locale. Les
profils/favoris et les médias enrichis sont suivis par MAR-433 et MAR-434.
