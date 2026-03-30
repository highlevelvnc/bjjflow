import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Introspect from Supabase — only manage public schema
  schemaFilter: ["public"],
  // Don't overwrite our hand-crafted migrations
  migrations: {
    table: "_drizzle_migrations",
    schema: "public",
  },
})
