/**
 * Accès à l'API YouTube Data v3 (clé serveur uniquement).
 * Fournit de VRAIES données : vues, likes, vues/heure, tags réels, stats chaîne.
 */
const { execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const YT = 'https://www.googleapis.com/youtube/v3';

async function ytFetch(path) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error('YOUTUBE_API_KEY manquante');
  const sep = path.includes('?') ? '&' : '?';
  const r = await fetch(`${YT}${path}${sep}key=${key}`);
  const j = await r.json();
  if (!r.ok) throw new Error(j.error?.message || `YouTube API ${r.status}`);
  return j;
}

/* Données réelles d'une vidéo + stats de sa chaîne */
async function getVideoStats(videoId) {
  const vj = await ytFetch(`/videos?part=snippet,statistics,contentDetails&id=${videoId}`);
  const v = vj.items && vj.items[0];
  if (!v) return null;

  let channel = {};
  try {
    const cj = await ytFetch(`/channels?part=statistics&id=${v.snippet.channelId}`);
    channel = (cj.items && cj.items[0] && cj.items[0].statistics) || {};
  } catch (e) { /* stats chaîne optionnelles */ }

  const views    = +v.statistics.viewCount    || 0;
  const likes    = +v.statistics.likeCount    || 0;
  const comments = +v.statistics.commentCount || 0;
  const hours    = Math.max(1, (Date.now() - new Date(v.snippet.publishedAt)) / 3.6e6);
  const vph      = Math.round(views / hours);
  const engage   = views ? Math.round(((likes + comments) / views) * 1000) / 10 : 0;

  return {
    title:        v.snippet.title,
    description:  v.snippet.description || '',
    channel:      v.snippet.channelTitle,
    channel_id:   v.snippet.channelId,
    published_at: v.snippet.publishedAt,
    duration:     v.contentDetails.duration,
    views, likes, comments,
    tags:             v.snippet.tags || [],
    views_per_hour:   vph,
    engagement_rate:  engage,                 // % (likes+commentaires)/vues
    channel_subs:     +channel.subscriberCount || 0,
    channel_videos:   +channel.videoCount      || 0,
    channel_views:    +channel.viewCount       || 0
  };
}

/* Recherche : vidéos concurrentes sur un mot-clé (vraies données) */
async function searchVideos(query, max = 8) {
  const sj = await ytFetch(`/search?part=snippet&type=video&order=relevance&maxResults=${max}&q=${encodeURIComponent(query)}`);
  const ids = (sj.items || []).map(i => i.id.videoId).filter(Boolean);
  if (!ids.length) return [];
  const vj = await ytFetch(`/videos?part=snippet,statistics&id=${ids.join(',')}`);
  return (vj.items || []).map(v => {
    const views = +v.statistics.viewCount || 0;
    const hours = Math.max(1, (Date.now() - new Date(v.snippet.publishedAt)) / 3.6e6);
    return {
      videoId:        v.id,
      title:          v.snippet.title,
      channel:        v.snippet.channelTitle,
      views,
      likes:          +v.statistics.likeCount || 0,
      published_at:   v.snippet.publishedAt,
      views_per_hour: Math.round(views / hours)
    };
  }).sort((a, b) => b.views_per_hour - a.views_per_hour);
}

/* Audit complet d'une chaîne (vraies stats sur les dernières vidéos) */
async function getChannelAudit(channelId) {
  const cj = await ytFetch(`/channels?part=snippet,statistics,contentDetails&id=${channelId}`);
  const c = cj.items && cj.items[0];
  if (!c) return null;
  const uploads = c.contentDetails.relatedPlaylists.uploads;

  const pj = await ytFetch(`/playlistItems?part=contentDetails&maxResults=25&playlistId=${uploads}`);
  const ids = (pj.items || []).map(i => i.contentDetails.videoId).filter(Boolean);
  let videos = [];
  if (ids.length) {
    const vj = await ytFetch(`/videos?part=snippet,statistics&id=${ids.join(',')}`);
    videos = (vj.items || []).map(v => ({
      videoId: v.id, title: v.snippet.title, published: v.snippet.publishedAt,
      views: +v.statistics.viewCount || 0, likes: +v.statistics.likeCount || 0,
      comments: +v.statistics.commentCount || 0, tags: (v.snippet.tags || []).length, titleLen: v.snippet.title.length
    }));
  }

  const n = videos.length || 1;
  const totalViews = videos.reduce((a, b) => a + b.views, 0);
  const avgViews = Math.round(totalViews / n);
  const sorted = [...videos].sort((a, b) => b.views - a.views);
  const best = sorted[0], worst = sorted[sorted.length - 1];
  const avgEngage = videos.length ? Math.round((videos.reduce((a, b) => a + (b.views ? (b.likes + b.comments) / b.views : 0), 0) / n) * 1000) / 10 : 0;
  const withTags = videos.filter(v => v.tags > 0).length;
  const avgTitleLen = Math.round(videos.reduce((a, b) => a + b.titleLen, 0) / n);
  // Fréquence d'upload (jours entre vidéos)
  const dates = videos.map(v => new Date(v.published)).sort((a, b) => b - a);
  let freqDays = null;
  if (dates.length > 1) {
    const span = (dates[0] - dates[dates.length - 1]) / 86400000;
    freqDays = Math.round((span / (dates.length - 1)) * 10) / 10;
  }

  return {
    channel: c.snippet.title,
    subs: +c.statistics.subscriberCount || 0,
    total_views: +c.statistics.viewCount || 0,
    total_videos: +c.statistics.videoCount || 0,
    analyzed: videos.length,
    avg_views: avgViews,
    avg_engagement: avgEngage,
    upload_freq_days: freqDays,
    tags_usage_pct: Math.round((withTags / n) * 100),
    avg_title_length: avgTitleLen,
    best_video: best ? { title: best.title, views: best.views, videoId: best.videoId } : null,
    worst_video: worst ? { title: worst.title, views: worst.views, videoId: worst.videoId } : null
  };
}

/* Idées de mots-clés (autocomplétion YouTube) + estimation de concurrence */
/* Cache mémoire des analyses de mot-clé (limite la consommation de quota YouTube). */
const _kwCache = new Map();
const _KW_TTL = 24 * 60 * 60 * 1000; // 24 h (économise le quota YouTube)

/* Analyse un mot-clé : concurrence, difficulté, vues moyennes du top. (1 recherche YouTube) */
async function analyzeKeyword(kw) {
  const key = kw.trim().toLowerCase();
  const hit = _kwCache.get(key);
  if (hit && Date.now() - hit.at < _KW_TTL) return hit.data;

  let topAvgViews = 0, topVph = 0, sampled = 0, competition = 'faible';
  try {
    const top = await searchVideos(kw, 6);
    if (top && top.length > 0) {
      topAvgViews = Math.round(top.reduce((a, b) => a + b.views, 0) / top.length);
      topVph = Math.round(top.reduce((a, b) => a + (b.views_per_hour || 0), 0) / top.length);
      sampled = top.length;
      competition = topAvgViews > 500000 ? 'forte' : topAvgViews > 50000 ? 'moyenne' : 'faible';
    }
  } catch (e) { console.error('[KW] Search failed:', e.message); }

  const data = { keyword: kw, competition, difficulty: keywordDifficulty(topAvgViews, topVph), top_avg_views: topAvgViews, top_vph: topVph, sampled };
  _kwCache.set(key, { at: Date.now(), data });
  return data;
}

async function getKeywordIdeas(query) {
  let suggestions = [];
  try {
    const r = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`);
    const j = await r.json();
    suggestions = (j[1] || []).slice(0, 12);
  } catch (e) { /* autocomplete optionnel */ }

  // Analyse du mot-clé principal
  const main = await analyzeKeyword(query);

  // Enrichit les 6 meilleures suggestions (hors doublon du mot principal) avec leur propre difficulté
  const toAnalyze = suggestions.filter(s => s.trim().toLowerCase() !== query.trim().toLowerCase()).slice(0, 4);
  const analyzed = await Promise.all(toAnalyze.map(s => analyzeKeyword(s).catch(() => null)));
  const related = analyzed.filter(Boolean);

  return {
    query,
    competition: main.competition,
    difficulty: main.difficulty,
    top_avg_views: main.top_avg_views,
    top_vph: main.top_vph,
    sampled: main.sampled,
    suggestions,            // liste brute (rétro-compat)
    related                 // liste enrichie : [{keyword, difficulty, competition, top_avg_views}]
  };
}

/* Score de difficulté SEO d'un mot-clé : 0–100 (+ label Facile/Moyen/Difficile/Très difficile)
   Basé sur les vues moyennes du top (échelle log) ajustées par la fraîcheur (vues/heure). */
function keywordDifficulty(topAvgViews, topVph) {
  // Base : log des vues moyennes du top — 1k≈39, 10k≈52, 100k≈65, 1M≈78, 10M≈91
  let score = topAvgViews > 0 ? Math.round(Math.log10(topAvgViews + 1) * 13) : 8;
  // Ajustement fraîcheur : un top très actif = concurrence plus dure
  if (topVph > 2000) score += 8;
  else if (topVph < 100) score -= 8;
  score = Math.max(1, Math.min(100, score));

  let label, color, advice;
  if (score < 35)      { label = 'Facile';          color = '#22c55e'; advice = 'Bonne opportunité — tu peux ranker rapidement.'; }
  else if (score < 55) { label = 'Moyen';           color = '#f5b301'; advice = 'Faisable avec un bon titre, une bonne miniature et du SEO.'; }
  else if (score < 75) { label = 'Difficile';       color = '#f7941d'; advice = 'Concurrence forte — vise un angle plus précis (longue traîne).'; }
  else                 { label = 'Très difficile';  color = '#ef4444'; advice = 'Dominé par de grosses chaînes — cherche un mot-clé de niche.'; }

  return { score, label, color, advice };
}

/* Vidéos qui "tendent" : publiées récemment (<14j) et fortes vues/heure dans la niche */
async function getTrendingVideos(query, max = 12) {
  const after = new Date(Date.now() - 14 * 86400000).toISOString();
  const sj = await ytFetch(`/search?part=snippet&type=video&order=viewCount&publishedAfter=${after}&maxResults=${max}&q=${encodeURIComponent(query)}`);
  const ids = (sj.items || []).map(i => i.id.videoId).filter(Boolean);
  if (!ids.length) return [];
  const vj = await ytFetch(`/videos?part=snippet,statistics&id=${ids.join(',')}`);
  return (vj.items || []).map(v => {
    const views = +v.statistics.viewCount || 0;
    const hours = Math.max(1, (Date.now() - new Date(v.snippet.publishedAt)) / 3.6e6);
    return {
      videoId: v.id,
      title: v.snippet.title,
      channel: v.snippet.channelTitle,
      views,
      published_at: v.snippet.publishedAt,
      views_per_hour: Math.round(views / hours)
    };
  }).sort((a, b) => b.views_per_hour - a.views_per_hour);
}

/* Récupère les vidéos récentes d'une chaîne (titre + vues) pour l'optimiseur de playlists */
async function getChannelVideos(channelId, max = 25) {
  const cj = await ytFetch(`/channels?part=contentDetails&id=${channelId}`);
  const uploads = cj.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) return [];
  const pj = await ytFetch(`/playlistItems?part=contentDetails&maxResults=${Math.min(50, max)}&playlistId=${uploads}`);
  const ids = (pj.items || []).map(i => i.contentDetails.videoId).filter(Boolean);
  if (!ids.length) return [];
  const vj = await ytFetch(`/videos?part=snippet,statistics&id=${ids.join(',')}`);
  return (vj.items || []).map(v => ({
    videoId: v.id,
    title: v.snippet.title,
    views: +v.statistics.viewCount || 0
  }));
}

/* Récupère les commentaires les plus pertinents d'une vidéo (lecture seule, clé API) */
async function getVideoComments(videoId, max = 40) {
  const j = await ytFetch(`/commentThreads?part=snippet&videoId=${videoId}&maxResults=${Math.min(100, max)}&order=relevance&textFormat=plainText`);
  return (j.items || []).map(it => {
    const c = it.snippet?.topLevelComment?.snippet || {};
    return {
      author: c.authorDisplayName || '',
      text: (c.textDisplay || '').slice(0, 300),
      likes: +c.likeCount || 0,
      replies: +it.snippet?.totalReplyCount || 0
    };
  });
}

/* Convertit une durée ISO 8601 (PT#M#S) en secondes */
function iso8601ToSeconds(iso) {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0);
}

/* Formate des secondes en M:SS (ou H:MM:SS) */
function secToTimestamp(s) {
  s = Math.max(0, Math.round(s));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return (h ? `${h}:` : '') + `${mm}:${String(sec).padStart(2, '0')}`;
}

/* Tentative rapide : lire la page watch, extraire captionTracks, récupérer le json3.
   Vérifié début 2026 : la LISTE des pistes reste publique dans le HTML, mais le
   CONTENU (baseUrl) revient systématiquement vide (200, 0 octet) depuis une IP
   serveur — YouTube exige un jeton anti-bot qu'un simple fetch ne peut produire.
   Gardée comme premier essai (rapide, sans sous-processus) : gratuite si jamais
   ce blocage se relâche pour certaines vidéos/IP, sinon on tombe sur le repli. */
async function getTranscriptViaFetch(videoId) {
  const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+410'
  };
  const r = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
    headers: BROWSER_HEADERS
  });
  const html = await r.text();
  const m = html.match(/"captionTracks":(\[.*?\])/);
  if (!m) return { available: false, segments: [] };

  let tracks;
  try { tracks = JSON.parse(m[1]); } catch { return { available: false, segments: [] }; }
  if (!tracks.length) return { available: false, segments: [] };

  const track = tracks.find(t => t.kind !== 'asr') || tracks[0];
  let baseUrl = track.baseUrl.replace(/\\u0026/g, '&');
  if (!/[?&]fmt=/.test(baseUrl)) baseUrl += '&fmt=json3';

  const cr = await fetch(baseUrl, { headers: BROWSER_HEADERS });
  const cj = await cr.json().catch(() => null);
  if (!cj || !cj.events) return { available: false, segments: [] };

  const segments = cj.events
    .filter(e => e.segs)
    .map(e => ({
      start: Math.round((e.tStartMs || 0) / 1000),
      text: e.segs.map(s => s.utf8).join('').replace(/\n/g, ' ').trim()
    }))
    .filter(s => s.text);

  return { available: segments.length > 0, segments, language: track.languageCode || 'en' };
}

function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    execFile('yt-dlp', args, { timeout: 25000, maxBuffer: 20 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) return reject(new Error((stderr || '').slice(0, 300) || err.message));
      resolve(stdout);
    });
  });
}

/* Repli quand getTranscriptViaFetch échoue : yt-dlp gère lui-même les jetons
   anti-bot de YouTube (mis à jour en continu par sa communauté, contrairement à
   un simple fetch qui ne peut pas les produire). Nécessite le binaire `yt-dlp`
   sur le serveur (voir backend/nixpacks.toml). Écrit le sous-titre dans un
   dossier temporaire, le lit, puis le supprime — aucun stockage persistant.

   --sub-langs "en" et PAS "all" : testé en conditions réelles, "all" fait
   télécharger à yt-dlp des CENTAINES de paires de traduction (ex: "ab-en",
   "aa-de-DE"…) et déclenche un 429 "Too Many Requests" de YouTube après
   quelques langues seulement. Une seule langue cible suffit : YouTube traduit
   automatiquement en anglais dès qu'une piste ASR existe dans N'IMPORTE quelle
   langue d'origine, et le prompt IA ignore déjà explicitement la langue de la
   transcription (voir tiktokRepurposeTimed/instagramRepurposeTimed) — la
   langue d'affichage demandée par l'utilisateur reste respectée dans tous
   les cas. */
async function getTranscriptViaYtDlp(videoId) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ytsub-'));
  try {
    await runYtDlp([
      '--skip-download',
      '--write-auto-sub', '--write-sub',
      '--sub-format', 'json3',
      '--sub-langs', 'en',
      '-o', path.join(tmpDir, '%(id)s.%(ext)s'),
      `https://www.youtube.com/watch?v=${videoId}`
    ]);
    const files = fs.readdirSync(tmpDir).filter(f => f.endsWith('.json3'));
    if (!files.length) return { available: false, segments: [] };

    const chosen = files[0];
    const langMatch = chosen.match(/\.([a-zA-Z0-9-]+)\.json3$/);
    const cj = JSON.parse(fs.readFileSync(path.join(tmpDir, chosen), 'utf8'));

    const segments = (cj.events || [])
      .filter(e => e.segs)
      .map(e => ({
        start: Math.round((e.tStartMs || 0) / 1000),
        text: e.segs.map(s => s.utf8).join('').replace(/\n/g, ' ').trim()
      }))
      .filter(s => s.text);

    return { available: segments.length > 0, segments, language: langMatch ? langMatch[1] : 'en' };
  } catch (e) {
    console.error('[TRANSCRIPT/yt-dlp]', e.message);
    return { available: false, segments: [] };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

/* Récupère la transcription (sous-titres horodatés) d'une vidéo YouTube.
   Retourne { available, segments:[{start, text}], language }.
   Essaie d'abord le fetch direct (rapide, gratuit), puis yt-dlp (fiable mais
   plus lent — lance un sous-processus) si le premier ne renvoie rien. */
async function getTranscript(videoId) {
  try {
    const viaFetch = await getTranscriptViaFetch(videoId);
    if (viaFetch.available) return viaFetch;
  } catch (e) {
    console.error('[TRANSCRIPT/fetch]', e.message);
  }
  return getTranscriptViaYtDlp(videoId);
}

/* Résout un lien / @handle / nom / ID en vrai Channel ID UC (+ titre réel).
   Accepte : "UC...", "youtube.com/channel/UC...", "@handle",
   "youtube.com/@handle", "youtube.com/c/Nom", "youtube.com/user/Nom", ou un nom brut.
   Retourne { id, name } ou null si introuvable. */
async function resolveChannelId(input) {
  let s = (input || '').trim();
  if (!s) return null;

  // Préfixe "handle:Nom" (envoyé par l'extension) → on le ramène à "@Nom"
  const hp = s.match(/^handle:(.+)$/i);
  if (hp) s = '@' + hp[1].replace(/^@/, '');

  // 0) Lien d'une VIDÉO (video:ID, watch?v=, youtu.be/, /shorts/, /live/) → chaîne de la vidéo
  const vm = s.match(/^video:([a-zA-Z0-9_-]{11})$/)
          || s.match(/(?:[?&]v=|youtu\.be\/|\/shorts\/|\/live\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (vm) {
    try {
      const j = await ytFetch(`/videos?part=snippet&id=${vm[1]}`);
      const it = j.items && j.items[0];
      if (it) return { id: it.snippet.channelId, name: it.snippet.channelTitle };
    } catch (e) {
      console.error('[resolveChannelId] Erreur vidéo:', e.message);
      return null;
    }
  }

  // 1) ID de chaîne déjà présent (brut ou dans une URL)
  const uc = s.match(/UC[a-zA-Z0-9_-]{22}/);
  if (uc) {
    try {
      const j = await ytFetch(`/channels?part=snippet&id=${uc[0]}`);
      const it = j.items && j.items[0];
      if (it) return { id: it.id, name: it.snippet.title };
    } catch (e) {
      console.warn('[resolveChannelId] Clé API manquante pour UC${uc[0]}, on renvoie tel quel');
      return { id: uc[0], name: uc[0] };
    }
  }

  // 2) Handle @nom (brut ou dans une URL)
  const hm = s.match(/@[a-zA-Z0-9._-]{2,}/);
  let username = null;
  if (hm) {
    try {
      const j = await ytFetch(`/channels?part=snippet&forHandle=${encodeURIComponent(hm[0])}`);
      const it = j.items && j.items[0];
      if (it) return { id: it.id, name: it.snippet.title };
    } catch (e) {
      console.warn(`[resolveChannelId] @handle ${hm[0]} non trouvé via forHandle, essai fallback:`, e.message);
    }
    username = hm[0].slice(1);
  } else {
    // 3) URL personnalisée /c/Nom ou /user/Nom, sinon nom brut
    const cm = s.match(/\/(?:c|user)\/([a-zA-Z0-9._-]+)/);
    username = cm ? cm[1] : s;
  }

  // 4) forUsername (anciennes chaînes) puis recherche en dernier recours
  try {
    const j = await ytFetch(`/channels?part=snippet&forUsername=${encodeURIComponent(username)}`);
    const it = j.items && j.items[0];
    if (it) return { id: it.id, name: it.snippet.title };
  } catch (e) {
    console.warn(`[resolveChannelId] forUsername ${username} échoué:`, e.message);
  }
  try {
    const sj = await ytFetch(`/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(username)}`);
    const it = sj.items && sj.items[0];
    if (it) return { id: it.id.channelId, name: it.snippet.title };
  } catch (e) {
    console.error(`[resolveChannelId] Pas trouvé: ${username}`, e.message);
  }

  return null;
}

/* Extrait l'ID vidéo (11 car.) d'un lien YouTube (watch, youtu.be, shorts, embed) ou d'un ID brut */
function extractVideoId(url = '') {
  const s = String(url).trim();
  const m = s.match(/(?:v=|\/shorts\/|youtu\.be\/|\/embed\/)([\w-]{11})/);
  if (m) return m[1];
  if (/^[\w-]{11}$/.test(s)) return s;
  return null;
}

/* Construit une transcription horodatée compacte "[m:ss] texte …" (downsample si trop longue) */
function buildTimedTranscript(segments = [], maxChars = 6000) {
  const lines = segments.map(s => `[${secToTimestamp(s.start)}] ${s.text}`);
  let joined = lines.join(' ');
  if (joined.length <= maxChars) return joined;
  const step = Math.ceil(joined.length / maxChars);
  return lines.filter((_, i) => i % step === 0).join(' ').slice(0, maxChars);
}

module.exports = { getVideoStats, searchVideos, getChannelAudit, getKeywordIdeas, getTranscript, iso8601ToSeconds, secToTimestamp, getVideoComments, getChannelVideos, getTrendingVideos, resolveChannelId, extractVideoId, buildTimedTranscript };
