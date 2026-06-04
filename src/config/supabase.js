const { createClient } = require("@supabase/supabase-js");

let supabase = null;
let supabaseAdmin = null;

function initSupabase() {
  if (supabase && supabaseAdmin) {
    return { supabase, supabaseAdmin };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL environment variable is required");
  }
  if (!supabaseAnonKey) {
    throw new Error("SUPABASE_ANON_KEY environment variable is required");
  }
  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_KEY environment variable is required");
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey);
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false
    }
  });

  return { supabase, supabaseAdmin };
}

// Lazy initialization - only initialize when first accessed
const getSupabase = () => {
  if (!supabase) initSupabase();
  return supabase;
};

const getSupabaseAdmin = () => {
  if (!supabaseAdmin) initSupabase();
  return supabaseAdmin;
};

module.exports = {
  getSupabase,
  getSupabaseAdmin,
  initSupabase
};
