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

module.exports = { getVideoStats, searchVideos };
