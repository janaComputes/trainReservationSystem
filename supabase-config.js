// supabase-config.js
// Loaded after the Supabase UMD script tag; exposes a single shared client.

const SUPABASE_URL = "https://exmkyoponeziiunsllsq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4bWt5b3BvbmV6aWl1bnNsbHNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzMzczMjksImV4cCI6MjEwNTkxMzMyOX0.byS4lYDR6-1Cd3lkB85Wjg4UMmCtMXQsI71H--xVXdE";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
