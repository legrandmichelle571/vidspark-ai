/**
 * Routes analyse
 * GET /api/analysis/history
 * POST /api/analysis/save
 */
const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');

router.get('/history', requireAuth, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase
    .from('analysis_history')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ analyses: data });
});

module.exports = router;
