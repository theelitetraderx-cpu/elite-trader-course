/**
 * Seed script - Run after applying supabase/schema.sql and supabase/app-data.sql
 *
 * Usage: node scripts/seed-admin.js
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local
 */

const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");

const INITIAL_PROGRAMS = [
  {
    id: "course-foundation",
    slug: "foundation",
    title: "Foundation",
    description:
      "Crypto basics, Binance setup, spot trading, and core discipline skills.",
    price: 99,
    member_price: 49,
    modules: [],
  },
  {
    id: "course-pro",
    slug: "pro",
    title: "PRO",
    description:
      "Futures trading, advanced analysis, strategy sessions, and live signals.",
    price: 349,
    member_price: 249,
    modules: [],
  },
  {
    id: "course-elite",
    slug: "elite",
    title: "ELITE",
    description:
      "Elite entry models, A+ setups, private community, and priority support.",
    price: 599,
    member_price: 499,
    modules: [],
  },
];

async function seed() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Missing Supabase environment variables");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || "Haree@200716";
  const adminEmail = process.env.ADMIN_SEED_EMAIL || "theelitetraderx@gmail.com";
  const adminHash = await bcrypt.hash(adminPassword, 12);

  const { error: adminError } = await supabase
    .from("users")
    .upsert(
      {
        username: "admin",
        password_hash: adminHash,
        full_name: "Elite Admin",
        email: adminEmail,
        role: "admin",
        status: "active",
      },
      { onConflict: "username" }
    )
    .select("id")
    .single();

  if (adminError) console.error("Admin seed error:", adminError);
  else console.log(`✓ Admin user seeded (${adminEmail})`);

  // Remove legacy demo students if present
  const { error: cleanupError } = await supabase
    .from("users")
    .delete()
    .in("username", ["student", "sarah_w"]);
  if (cleanupError) console.error("Demo student cleanup error:", cleanupError);
  else console.log("✓ Demo students removed (if any)");

  const { error: programsError } = await supabase.from("app_course_programs").upsert(
    {
      id: "programs",
      programs: INITIAL_PROGRAMS,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (programsError) console.error("Programs seed error:", programsError);
  else console.log("✓ Course programs seeded");

  console.log("\nSeed complete!");
  console.log("Run supabase/app-data.sql first if tables are missing.");
}

seed();
