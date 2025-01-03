const { createClient } = require("@supabase/supabase-js");

require("dotenv").config();
//const { Pool } = require("pg");

if (!process.env.SUPABASE_URL) {
  throw new Error("SUPABASE_URL is required");
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = pool;
