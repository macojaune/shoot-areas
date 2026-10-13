# Recette R2 — 13 octobre 2026

## Contrat

Un bucket dédié au projet (`shootareas-media`) avec les préfixes `dev/` et
`prod/`. Le serveur choisit exclusivement `R2_ENVIRONMENT=dev|prod`. Les URL
déjà enregistrées restent inchangées ; aucune migration d'objet n'est nécessaire.

## Infrastructure vérifiée

Le bucket existe déjà dans le compte personnel propriétaire de `marvinl.com`.
Son domaine `https://pub-e7433b3fddc842f6a86936e0c66597b5.r2.dev` est activé.
Les dossiers `dev/` et `prod/` ont été initialisés par deux marqueurs de zéro octet.
Un credential S3 a été créé avec permission sur les objets de ce seul bucket.
Les autres projets et buckets n'ont pas été modifiés.

CORS conservé : origines `http://localhost:3000` et
`https://shootareas.marvinl.com`, méthode PUT, en-tête Content-Type, ETag exposé,
durée 3600 secondes. Les paramètres R2 de l'application sont prévus uniquement
au runtime ; aucune clé permanente n'est envoyée au navigateur.

## Vérifications automatisées

`bun run test` : **88 tests / 225 assertions**, zéro échec. TypeScript, build
Nitro et `git diff --check` réussis. Les 33 tests R2 couvrent notamment les refus
invités, les configurations absentes/invalides, les environnements dev/prod et
la signature générée par le vrai SDK AWS, contrôlée par HMAC indépendant.

L'URL expire après 300 secondes et signe le type MIME ainsi que la longueur
annoncée (maximum 10 Mio). Le checksum automatique d'un corps vide est désactivé,
puisque le navigateur fournit le corps après création de l'URL.

## Upload réel depuis le formulaire

Recette sur `http://localhost:3000`, Chromium, instance Clerk de test et base
SQLite locale dédiée. Aucun lieu ni avis de recette n'est écrit dans Turso.

- Connexion réelle d'un membre fictif vers `/nouveau-lieu`.
- Sélection d'une image PNG de recette dans le champ fichier : PUT R2 **200**.
- URL produite sous `dev/spots/<membre>/<UUID>.png`, reprise par le formulaire.
- Relecture publique **200**, contenu binaire identique au fichier envoyé.
- Même URL signée, type MIME modifié : **403**.
- Même URL signée, taille modifiée : **403** ; objet d'origine inchangé.
- Publication du lieu fictif dans la base locale ; image chargée dans la fiche
  et la galerie (`naturalWidth=1` pour cette fixture PNG de 1 × 1 pixel).
- Fiche inspectée en desktop 1440 px et mobile 390 px.

La production n'est pas configurée ni déployée : seul son préfixe est réservé.
Les préfixes organisent les fichiers ; ils ne constituent pas une isolation
d'autorisations entre détenteurs des credentials du bucket. Avant une mise en
production, remplacer le domaine de développement `r2.dev` par un domaine dédié.
