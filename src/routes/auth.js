const express = require("express");
const { getSupabase, getSupabaseAdmin } = require("../config/supabase");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../utils/jwt");
const { verifyGoogleToken } = require("../utils/google");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/google", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Google token required" });
    }

    const googleData = await verifyGoogleToken(token);
    const { googleId, email, name, picture } = googleData;

    let { data: user, error: fetchError } = await getSupabase()
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (fetchError && fetchError.code === "PGRST116") {
      const { data: newUser, error: createError } = await getSupabaseAdmin()
        .from("users")
        .insert([
          {
            email,
            name,
            avatar_url: picture,
            google_id: googleId,
            plan: "free",
            status: "active",
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (createError) {
        console.error("[Auth] User creation error:", createError);
        return res.status(400).json({ error: "Failed to create user" });
      }

      user = newUser;
    } else if (fetchError) {
      console.error("[Auth] User fetch error:", fetchError);
      return res.status(400).json({ error: "Database error" });
    }

    const accessToken = generateAccessToken(user.id, user.email, user.plan);
    const refreshToken = generateRefreshToken(user.id);

    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        plan: user.plan
      }
    });
  } catch (err) {
    console.error("[Auth] Google login error:", err);
    res.status(400).json({ error: err.message });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const { data: user, error } = await getSupabase()
      .from("users")
      .select("id, email, name, avatar_url, plan, status, created_at")
      .eq("id", req.user.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("[Auth] Get profile error:", err);
    res.status(400).json({ error: err.message });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: "Refresh token required" });
    }

    const decoded = verifyRefreshToken(refresh_token);

    const { data: user, error } = await getSupabase()
      .from("users")
      .select("id, email, plan")
      .eq("id", decoded.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    const accessToken = generateAccessToken(user.id, user.email, user.plan);

    res.json({ access_token: accessToken });
  } catch (err) {
    console.error("[Auth] Refresh token error:", err);
    res.status(401).json({ error: err.message });
  }
});

router.post("/logout", requireAuth, (req, res) => {
  res.json({ success: true });
});

module.exports = router;
