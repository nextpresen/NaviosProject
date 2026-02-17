const { execSync } = require("node:child_process");

const explicit = process.env.PRISMA_SCHEMA;
const isVercel = process.env.VERCEL === "1";

const schema = explicit ?? (isVercel ? "prisma/schema.supabase.prisma" : "prisma/schema.prisma");

console.log(`[prisma-generate] schema=${schema}`);
execSync(`npx prisma generate --schema ${schema}`, { stdio: "inherit" });

