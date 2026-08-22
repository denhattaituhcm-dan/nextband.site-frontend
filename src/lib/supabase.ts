import { createClient } from "@supabase/supabase-js";

const defaultSupabaseUrl = "https://gzpdlqxjggyxlkeatvvf.supabase.co";
const supabaseUrl = (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) || process.env.VITE_SUPABASE_URL || defaultSupabaseUrl;
const supabaseAnonKey = (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) || process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
