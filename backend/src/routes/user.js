const express = require("express");
const { getSupabase } = require("../config/supabase");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/profile", requireAuth, async (req, res) => {
  try {
    const { data: user, error } = await getSupabase()
      .from("users")
      .select("*")
      .eq("id", req.user.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/profile", requireAuth, async (req, res) => {
  try {
    const { name, avatar_url } = req.body;

    const { data: user, error } = await getSupabase()
      .from("users")
      .update({
        name: name || undefined,
        avatar_url: avatar_url || undefined,
        updated_at: new Date().toISOString()
      })
      .eq("id", req.user.userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/plan", requireAuth, async (req, res) => {
  try {
    const { data: user, error } = await getSupabase()
      .from("users")
      .select("plan, monthly_usage, monthly_limit, subscription_status, plan_expiration")
      .eq("id", req.user.userId)
      .single();

    if (error) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/usage", requireAuth, async (req, res) => {
  try {
    const { data: user, error } = await getSupabase()
      .from("users")
      .select("monthly_usage, monthly_limit, plan")
      .eq("id", req.user.userId)
      .single();

    if (error) {
      return res.status(404).json({ error: "User not found" });
    }

    const percentUsed = (user.monthly_usage / user.monthly_limit) * 100;

    res.json({
      plan: user.plan,
      monthly_usage: user.monthly_usage,
      monthly_limit: user.monthly_limit,
      percent_used: Math.round(percentUsed),
      remaining: Math.max(0, user.monthly_limit - user.monthly_usage)
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
