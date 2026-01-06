const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
// You need to set these env variables in Vercel
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Role for admin tasks (checking licenses)

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials missing. Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

module.exports = supabase;