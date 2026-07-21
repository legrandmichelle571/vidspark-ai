# Connectors — architecture Provider / Plugin

> **État (Phase 1) :** socle uniquement. Aucun Provider réel n'existe encore dans ce
> dossier (`youtube/`, `tiktok/`… arriveront en Phase 2 et 3). Le seul Provider
> complet est le **Mock Provider**, situé sous `__fixtures__/` — utilisé exclusivement
> par les tests, jamais découvert en production. Aucune route de l'application
> n'importe `registry.js` pour l'instant : ce dossier est inerte.

## Principe

Une plateforme = un dossier sous `connectors/`, qui exporte `{ manifest, auth?, fetchProfile?, tasks?, getHealth? }`.
Le cœur applicatif ne connaît jamais un nom de plateforme en dur — il lit uniquement
ce que `manifest` déclare (voir `base/contract.js` pour la forme exacte, documentée
en JSDoc).

```
connectors/
├── registry.js       ← scanne ce dossier et charge chaque sous-dossier comme Provider
│                         (loadRegistry = un scan frais ; getRegistry = mémoïsé, à
│                         utiliser par les futures routes pour ne scanner qu'une fois)
├── base/              ← primitives neutres (PKCE, HTTP, contrat, codes d'erreur) — ne
│                         JAMAIS y mettre de logique propre à une plateforme
│   ├── contract.js     ← validation du contrat Provider
│   ├── pkce.js          ← code_verifier/code_challenge (RFC 7636)
│   ├── http.js          ← wrapper fetch pour l'échange de tokens OAuth
│   └── errorCodes.js    ← SOURCE UNIQUE des codes d'erreur reconnus + leur mapping vers
│                           un état de santé (consommée par withProviderCall.js ET health.js)
└── __fixtures__/       ← Mock Provider + cas d'erreur, POUR LES TESTS UNIQUEMENT
```

## Ajouter une plateforme (Phase 2+)

1. Créer `connectors/<plateforme>/manifest.js` (voir `base/contract.js` pour le schéma).
2. Créer `connectors/<plateforme>/index.js` qui exporte `{ manifest, auth, fetchProfile, tasks }`.
3. Rien d'autre à modifier — `registry.js` la découvre automatiquement au prochain
   chargement. Si le Provider viole le contrat, `loadRegistry()` lève une erreur
   explicite au démarrage plutôt que de tourner en mode dégradé silencieux.

Voir le guide développeur complet (tutoriel pas-à-pas, conventions, checklist de
revue) fourni avec la note d'architecture validée pour ce chantier.

## Tests

```bash
npm test                 # suite complète
npm run test:coverage    # avec rapport de couverture (scope: connectors/ + les
                          # utils du socle Providers — tokenCrypto/health/
                          # withProviderCall/capabilities)
```

Les fixtures sous `__fixtures__/scenario-*/` couvrent : chargement valide (Provider
`oauth2` + Provider `auth.type:'none'`), clé manquante, implémentation `auth`
manquante, clé dupliquée entre deux dossiers.

## Sécurité

- `utils/tokenCrypto.js` : AES-256-GCM, clé `CONNECTIONS_ENCRYPTION_KEY` (32 octets,
  base64), AAD optionnel (3ᵉ argument) pour lier le ciphertext à son compte — à utiliser
  en Phase 3 (ex: `` `${userId}:${platform}:${externalId}` ``) pour empêcher qu'un
  ciphertext copié vers une autre ligne soit déchiffrable. Aucun token en clair ne doit
  jamais atteindre `connected_accounts`.
- `utils/withProviderCall.js` : point de passage unique pour tout appel Provider — un
  Provider ne journalise jamais lui-même, il attache un `err.code` reconnu (voir
  `base/errorCodes.js` pour la liste à jour) à ses erreurs. La journalisation elle-même
  est best-effort : un échec de `logEvent`/`recordError` ne masque jamais le résultat ou
  l'erreur métier réels (couvert par des tests de régression dédiés).
- `utils/health.js` : calcul de l'état de santé (`connected`, `expired_token`,
  `missing_scope`…) — générique, ne devine jamais ce qu'un Provider n'a pas rapporté.
  Partage sa table de mapping avec `withProviderCall.js` via `base/errorCodes.js` pour
  qu'un code d'erreur ne puisse jamais être reconnu d'un côté et ignoré de l'autre.

## Base de données

`database/migrations/020_connected_accounts.sql` (additive, RLS activée sans policy
publique — accès uniquement via la `service_role` du backend, comme
`connection_logs`). Ne modifie et ne lit **aucune** table existante
(`users`, `activation_codes`, `activation_channels`).
