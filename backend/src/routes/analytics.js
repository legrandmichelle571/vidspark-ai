const express = require("express");
const { getSupabase } = require("../config/supabase");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/event", optionalAuth, async (req, res) => {
  try {
    const { event_name, event_data } = req.body;

    const payload = {
      user_id: req.user?.userId || null,
      event_name,
      event_data: event_data || {},
      timestamp: new Date().toISOString()
    };

    const { error } = await getSupabase()
      .from("analytics_events")
      .insert([payload]);

    if (error) {
      console.warn("[Analytics] Event tracking warning:", error);
    }

    res.json({ success: true });
  } catch (err) {
    res.json({ success: true });
  }
});

module.exports = router;
