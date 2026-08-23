import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
console.log("SUPABASE URL:", process.env.SUPABASE_URL);
console.log("SUPABASE KEY EXISTS:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
