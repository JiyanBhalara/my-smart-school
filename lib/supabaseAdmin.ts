// lib/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,          // already in your .env
  process.env.SUPABASE_SERVICE_ROLE_KEY!,         // the new service-role key
  {
    auth: { persistSession: false },               // backend only
  }
);
