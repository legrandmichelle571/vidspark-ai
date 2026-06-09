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
  let competition = 'inconnue', topAvgViews = 0, sampled = 0;
  try {
    const top = await searchVideos(query, 6);
    if (top.length) {
      topAvgViews = Math.round(top.reduce((a, b) => a + b.views, 0) / top.length);
      sampled = top.length;
      competition = topAvgViews > 500000 ? 'forte' : topAvgViews > 50000 ? 'moyenne' : 'faible';
    }
  } catch (e) { /* search optionnel */ }

  return { query, suggestions, competition, top_avg_views: topAvgViews, sampled };
}

module.exports = { getVideoStats, searchVideos, getChannelAudit, getKeywordIdeas };
