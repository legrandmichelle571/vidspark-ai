# EchoRank AI — Guide Sécurité

## Architecture de sécurité v2.0

```
Extension Chrome          Cloudflare Worker          Anthropic API
─────────────────         ─────────────────          ─────────────
content.js          →     worker.js                  claude-haiku
  (aucune clé)            (clé en secret CF)    →    (protégé)
     │                          │
background.js                   ├── KV Cache (24h)
  (token user)                  ├── Rate limiting
  (cache local)                 └── Validation token
```

## Clés API — JAMAIS dans le code

Les clés sont stockées UNIQUEMENT dans les secrets Cloudflare.
Elles ne sont JAMAIS dans :
- content.js ✗
- background.js ✗
- manifest.json ✗
- Aucun fichier commité dans Git ✗

## Déploiement du proxy Cloudflare Worker

### 1. Installer Wrangler
```bash
npm install -g wrangler
wrangler login
```

### 2. Créer le KV namespace (cache)
```bash
wrangler kv:namespace create "ECHORANK_CACHE"
# Copier l'ID retourné dans proxy/wrangler.toml
```

### 3. Configurer les secrets (JAMAIS dans wrangler.toml)
```bash
cd proxy/
wrangler secret put ANTHROPIC_API_KEY
# Entrer la clé quand demandé — elle ne sera jamais visible

wrangler secret put ECHORANK_SECRET
# Entrer un UUID aléatoire (ex: openssl rand -hex 32)
```

### 4. Déployer
```bash
wrangler deploy
# Retourne : https://echorank-proxy.TON_SUBDOMAIN.workers.dev
```

### 5. Mettre à jour background.js
Remplacer dans background.js :
```js
const PROXY_URL = "https://echorank-proxy.VOTRE_SUBDOMAIN.workers.dev";
```
par l'URL réelle retournée par wrangler deploy.

### 6. Mettre à jour worker.js
Remplacer dans proxy/worker.js :
```js
"chrome-extension://VOTRE_EXTENSION_ID_ICI"
```
par l'ID de ton extension Chrome (visible dans chrome://extensions en mode développeur).

## Variables d'environnement requises

| Variable | Où | Valeur |
|---|---|---|
| ANTHROPIC_API_KEY | Cloudflare Secret | sk-ant-... |
| ECHORANK_SECRET | Cloudflare Secret | uuid aléatoire |
| ECHORANK_CACHE | KV Namespace | binding CF |

## Rate limiting (par plan)

| Plan | Quotas/jour | Quotas/heure |
|---|---|---|
| free | 5 | 3 |
| starter | 50 | 20 |
| pro | 500 | 100 |
| business | 9999 | 999 |

## .gitignore — à créer absolument

```
.env
.env.local
*.pem
*.key
node_modules/
.wrangler/
```

## Checklist sécurité avant publication

- [ ] Proxy déployé sur Cloudflare Workers
- [ ] ANTHROPIC_API_KEY en secret CF (jamais en clair)
- [ ] Extension ID ajouté dans ALLOWED_ORIGINS du worker
- [ ] PROXY_URL mis à jour dans background.js
- [ ] .gitignore créé
- [ ] Testé en mode développeur Chrome
