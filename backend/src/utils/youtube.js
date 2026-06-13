/**
 * Accès à l'API YouTube Data v3 (clé serveur uniquement).
 * Fournit de VRAIES données : vues, likes, vues/heure, tags réels, stats chaîne.
 */
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
async function getKeywordIdeas(query) {
  let suggestions = [];
  try {
    const r = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`);
    const j = await r.json();
    suggestions = (j[1] || []).slice(0, 12);
  } catch (e) { /* autocomplete optionnel */ }

  // Concurrence : moyenne des vues des meilleures vidéos sur ce mot-clé
  let competition = 'faible', topAvgViews = 0, sampled = 0;
  try {
    const top = await searchVideos(query, 6);
    if (top && top.length > 0) {
      topAvgViews = Math.round(top.reduce((a, b) => a + b.views, 0) / top.length);
      sampled = top.length;
      competition = topAvgViews > 500000 ? 'forte' : topAvgViews > 50000 ? 'moyenne' : 'faible';
    } else {
      // Si pas de résultats, on considère que c'est une faible concurrence (niche)
      competition = 'faible';
    }
  } catch (e) {
    console.error('[KW] Search failed:', e.message);
    // Par défaut faible concurrence si erreur
    competition = 'faible';
  }

  return { query, suggestions, competition, top_avg_views: topAvgViews, sampled };
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

/* Récupère la transcription (sous-titres horodatés) d'une vidéo YouTube.
   Retourne { available, segments:[{start, text}], language } — sans clé API.
   Méthode : on lit la page watch, on extrait captionTracks, on récupère le json3. */
async function getTranscript(videoId) {
  try {
    const r = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'en-US,en' }
    });
    const html = await r.text();
    const m = html.match(/"captionTracks":(\[.*?\])/);
    if (!m) return { available: false, segments: [] };

    let tracks;
    try { tracks = JSON.parse(m[1]); } catch { return { available: false, segments: [] }; }
    if (!tracks.length) return { available: false, segments: [] };

    // Préférer une piste non auto-générée, sinon la première
    const track = tracks.find(t => t.kind !== 'asr') || tracks[0];
    let baseUrl = track.baseUrl.replace(/\\u0026/g, '&');
    if (!/[?&]fmt=/.test(baseUrl)) baseUrl += '&fmt=json3';

    const cr = await fetch(baseUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
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
  } catch (e) {
    console.error('[TRANSCRIPT]', e.message);
    return { available: false, segments: [] };
  }
}

/* Résout un lien / @handle / nom / ID en vrai Channel ID UC (+ titre réel).
   Accepte : "UC...", "youtube.com/channel/UC...", "@handle",
   "youtube.com/@handle", "youtube.com/c/Nom", "youtube.com/user/Nom", ou un nom brut.
   Retourne { id, name } ou null si introuvable. */
async function resolveChannelId(input) {
  const s = (input || '').trim();
  if (!s) return null;

  // 1) ID de chaîne déjà présent (brut ou dans une URL)
  const uc = s.match(/UC[a-zA-Z0-9_-]{22}/);
  if (uc) {
    try {
      const j = await ytFetch(`/channels?part=snippet&id=${uc[0]}`);
      const it = j.items && j.items[0];
      if (it) return { id: it.id, name: it.snippet.title };
    } catch (e) { /* clé absente : on garde l'ID tel quel */ }
    return { id: uc[0], name: uc[0] };
  }

  // 2) Handle @nom (brut ou dans une URL)
  const hm = s.match(/@[a-zA-Z0-9._-]{2,}/);
  let username = null;
  if (hm) {
    try {
      const j = await ytFetch(`/channels?part=snippet&forHandle=${encodeURIComponent(hm[0])}`);
      const it = j.items && j.items[0];
      if (it) return { id: it.id, name: it.snippet.title };
    } catch (e) { /* fallback ci-dessous */ }
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
  } catch (e) { /* continue */ }
  try {
    const sj = await ytFetch(`/search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(username)}`);
    const it = sj.items && sj.items[0];
    if (it) return { id: it.id.channelId, name: it.snippet.title };
  } catch (e) { /* introuvable */ }

  return null;
}

module.exports = { getVideoStats, searchVideos, getChannelAudit, getKeywordIdeas, getTranscript, iso8601ToSeconds, secToTimestamp, getVideoComments, getChannelVideos, getTrendingVideos, resolveChannelId };
