const express = require("express");
const { getSupabase, getSupabaseAdmin } = require("../config/supabase");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const isAdmin = (req, res, next) => {
  if (req.user.plan !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

router.get("/stats", requireAuth, isAdmin, async (req, res) => {
  try {
    const { data: users, error: usersError } = await getSupabase()
      .from("users")
      .select("plan, created_at")
      .eq("status", "active");

    if (usersError) throw usersError;

    const stats = {
      total_users: users.length,
      free_users: users.filter(u => u.plan === "free").length,
      pro_users: users.filter(u => u.plan === "pro").length,
      business_users: users.filter(u => u.plan === "business").length
    };

    res.json(stats);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/users", requireAuth, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const start = (page - 1) * limit;

    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .range(start, start + limit - 1)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ users, page, limit });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/users/:id/plan", requireAuth, isAdmin, async (req, res) => {
  try {
    const { plan } = req.body;

    const { data: user, error } = await getSupabaseAdmin()
      .from("users")
      .update({ plan })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
