export const ENVS = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
} as const;
