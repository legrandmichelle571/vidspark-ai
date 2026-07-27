/**
 * Générateur d'histoires cinématographiques (voir story-generator.html côté site,
 * aiClient.js::generateStory/expandStoryIdea/summarizeStoryText côté logique IA).
 * Reprend les 3 endpoints d'un build Google AI Studio fourni par l'utilisateur
 * ("ToonStory Director AI"), migrés derrière l'auth + quota du site (l'app d'origine
 * exposait sa propre clé Gemini via son propre petit serveur Express).
 *
 * POST /api/story/generate   → découpage complet en scènes (le plus lourd, gros JSON)
 * POST /api/story/expand     → développe une idée courte en histoire complète
 * POST /api/story/summarize  → condense un texte long en récit exploitable
 */
const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { requireAuth, checkQuota } = require('../middleware/auth');
const { generateStory, expandStoryIdea, summarizeStoryText } = require('../utils/aiClient');

/* Génération de scènes = appel IA long/coûteux (jusqu'à 8000 tokens de sortie) :
   limite plus stricte que le rate-limit générique (10/min) des autres routes IA. */
const storyRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Trop de générations, patiente un instant.' }
});

async function bumpQuota(supabase, fn, userId, tag) {
  const { error } = await supabase.rpc(fn, { p_user_id: userId });
  if (error) console.error(`[${tag}] RPC ${fn} a échoué:`, error.message);
}

router.post('/generate', requireAuth, checkQuota, storyRateLimit, async (req, res) => {
  try {
    const { storyInput, config = {}, language = 'fr' } = req.body || {};
    if (!storyInput || String(storyInput).trim().length < 10) {
      return res.status(400).json({ error: 'Histoire trop courte (10 caractères minimum).' });
    }
    /* Compte gratuit : plafond à 10 scènes pour rester sur Cloudflare Workers AI (gratuit,
       fiable à cette taille). Comptes payants : jusqu'à 20, generateStory() bascule alors
       directement sur Gemini (payant mais fiable) au lieu de risquer une troncature Cloudflare. */
    const maxScenes = (req.user.plan === 'free' || !req.user.plan) ? 10 : 20;
    const safeConfig = {
      sceneCount: Math.min(maxScenes, Math.max(1, parseInt(config.sceneCount, 10) || 5)),
      style: String(config.style || 'auto').slice(0, 60),
      customStyle: config.customStyle ? String(config.customStyle).slice(0, 100) : '',
      aspectRatio: String(config.aspectRatio || '16:9').slice(0, 20),
      tone: String(config.tone || 'auto').slice(0, 40),
      ageGroup: String(config.ageGroup || 'all ages').slice(0, 40),
      visualRichness: String(config.visualRichness || 'cinematic').slice(0, 30)
    };
    const result = await generateStory(String(storyInput).trim().slice(0, 20000), safeConfig, language);
    await bumpQuota(req.app.locals.supabase, 'increment_user_quota', req.user.id, 'AI/STORY-GENERATE');
    res.json(result);
  } catch (err) {
    console.error('[STORY/GENERATE]', err.message);
    res.status(500).json({ error: 'Génération indisponible pour le moment.' });
  }
});

router.post('/expand', requireAuth, checkQuota, storyRateLimit, async (req, res) => {
  try {
    const { idea, language = 'fr' } = req.body || {};
    if (!idea || String(idea).trim().length < 3) {
      return res.status(400).json({ error: 'Idée trop courte (3 caractères minimum).' });
    }
    const result = await expandStoryIdea(String(idea).trim().slice(0, 2000), language);
    await bumpQuota(req.app.locals.supabase, 'increment_user_quota', req.user.id, 'AI/STORY-EXPAND');
    res.json(result);
  } catch (err) {
    console.error('[STORY/EXPAND]', err.message);
    res.status(500).json({ error: 'Génération indisponible pour le moment.' });
  }
});

router.post('/summarize', requireAuth, checkQuota, storyRateLimit, async (req, res) => {
  try {
    const { text, language = 'fr' } = req.body || {};
    if (!text || String(text).trim().length < 20) {
      return res.status(400).json({ error: 'Texte trop court (20 caractères minimum).' });
    }
    const result = await summarizeStoryText(String(text).trim(), language);
    await bumpQuota(req.app.locals.supabase, 'increment_user_quota', req.user.id, 'AI/STORY-SUMMARIZE');
    res.json(result);
  } catch (err) {
    console.error('[STORY/SUMMARIZE]', err.message);
    res.status(500).json({ error: 'Génération indisponible pour le moment.' });
  }
});

module.exports = router;
