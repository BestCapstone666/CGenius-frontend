import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = "https://fbhskyalsyeopiydyjhz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiaHNreWFsc3llb3BpeWR5amh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2NDI0ODAsImV4cCI6MjA2NjIxODQ4MH0.HmW6geKvj2rPSeaw-Bm2zLaHjgwkE6FwO2DVq3rbYOE";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const userId = localStorage.getItem("user_id");
const userEmail = localStorage.getItem("user_email");

async function fetchCGData() {
  try {
    const { data: adminRows } = await supabase
      .from("admin_table")
      .select("*")
      .eq("admins", userId);

    const isAdmin = adminRows && adminRows.length > 0;

    let query = supabase.from("cg_data").select("*");
    if (!isAdmin) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    console.log("📊 Loaded data:", data);
    initDashboard(data); // pass to chart logic in javascript.js

  } catch (err) {
    console.error("❌ Failed to fetch data:", err);
    alert("Error loading dashboard data.");
  }
}

document.addEventListener("DOMContentLoaded", fetchCGData);
