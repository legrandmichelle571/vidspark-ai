/**
 * connectionLog.js — Statistiques de connexion (site + extension) AVEC IP.
 *
 * Écritures SÉPARÉES et non bloquantes → résilient : si une colonne/table
 * manque encore côté Supabase (cf. migration 019), les autres écritures passent
 * quand même et une réponse utilisateur n'est jamais cassée par le monitoring.
 *
 * Effets (throttlés en mémoire, par worker) :
 *   1) users.last_active / last_active_src / last_ip  → dernière connexion (60s)
 *   2) connection_logs (INSERT)                       → historique détaillé (10 min)
 */

const _touch = new Map();   // dernier UPDATE users        (clé = userId:source)
const _log   = new Map();   // dernier INSERT connection_logs
const TOUCH_MS = 60 * 1000;
const LOG_MS   = 10 * 60 * 1000;

/** Extrait l'IP client réelle (Railway/Cloudflare = derrière proxy). */
function getClientIp(req) {
  if (!req) return null;
  const xff = req.headers?.['x-forwarded-for'];
  let ip = '';
  if (xff) ip = String(xff).split(',')[0].trim();          // 1ère = client d'origine
  if (!ip) ip = req.headers?.['cf-connecting-ip'] || '';
  if (!ip) ip = req.ip || req.socket?.remoteAddress || '';
  return String(ip).replace(/^::ffff:/, '').trim() || null; // dé-mappe IPv4-in-IPv6
}

/**
 * Enregistre une connexion.
 * @param {*} supabase client service-role
 * @param {string} userId
 * @param {'site'|'ext'} source
 * @param {import('express').Request} req
 */
function logConnection(supabase, userId, source, req) {
  try {
    if (!supabase || !userId) return;
    const now = Date.now();
    const key = `${userId}:${source}`;
    const ip  = getClientIp(req);

    // 1) Heartbeat "dernière connexion" (throttle 60s) — updates séparés = résilients
    if (now - (_touch.get(key) || 0) > TOUCH_MS) {
      _touch.set(key, now);
      const ts = new Date(now).toISOString();
      supabase.from('users').update({ last_active: ts }).eq('id', userId).then(() => {}, () => {});
      supabase.from('users').update({ last_active_src: source }).eq('id', userId).then(() => {}, () => {});
      if (ip) supabase.from('users').update({ last_ip: ip }).eq('id', userId).then(() => {}, () => {});
    }

    // 2) Historique détaillé (throttle 10 min pour ne pas exploser la table)
    if (now - (_log.get(key) || 0) > LOG_MS) {
      _log.set(key, now);
      const country = req.headers?.['cf-ipcountry'] || null; // fourni par Cloudflare si dispo
      const ua = String(req.headers?.['user-agent'] || '').slice(0, 300);
      supabase.from('connection_logs')
        .insert({ user_id: userId, ip, source, user_agent: ua, country })
        .then(() => {}, () => {});
    }
  } catch (_) { /* jamais bloquer la requête */ }
}

module.exports = { getClientIp, logConnection };
