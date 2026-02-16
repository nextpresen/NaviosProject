import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { parseCsv } from "./csv-utils.mjs";

const REQUIRED_FIELDS = ["title", "content", "latitude", "longitude", "event_date", "expire_date", "event_image"];

function parseArgs(argv) {
  const args = {
    file: "./events_for_supabase.csv",
    chunk: 200,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === "--file") {
      args.file = argv[i + 1];
      i += 1;
      continue;
    }
    if (value === "--chunk") {
      args.chunk = Number(argv[i + 1]) || 200;
      i += 1;
      continue;
    }
    if (value === "--help") {
      args.help = true;
    }
  }
  return args;
}

function usage() {
  console.log("Usage:");
  console.log("  node scripts/import-events-csv-to-supabase.mjs --file ./events_for_supabase.csv");
  console.log("");
  console.log("Options:");
  console.log("  --chunk <number>  createMany chunk size (default: 200)");
}

function asDate(value, fallback = null) {
  if (!value) return fallback;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  return d;
}

function asOptional(value) {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function asNumber(value, fallback = null) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return num;
}

function asBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === undefined || value === null) return fallback;
  const text = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(text)) return true;
  if (["false", "0", "no", "n"].includes(text)) return false;
  return fallback;
}

function validateRow(row, rowIndex) {
  const missing = REQUIRED_FIELDS.filter((field) => !asOptional(row[field]));
  if (missing.length > 0) {
    throw new Error(`Row ${rowIndex}: missing required fields: ${missing.join(", ")}`);
  }

  if (asNumber(row.latitude, null) === null || asNumber(row.longitude, null) === null) {
    throw new Error(`Row ${rowIndex}: latitude/longitude is invalid`);
  }

  if (!asDate(row.event_date) || !asDate(row.expire_date)) {
    throw new Error(`Row ${rowIndex}: event_date/expire_date is invalid`);
  }
}

function toPrismaData(row) {
  const eventDate = asDate(row.event_date);
  const expireDate = asDate(row.expire_date);
  return {
    ...(asOptional(row.id) ? { id: row.id } : {}),
    title: row.title,
    content: row.content,
    author_id: asOptional(row.author_id),
    author_avatar_url: asOptional(row.author_avatar_url),
    category: asOptional(row.category) || "event",
    tags_json: asOptional(row.tags_json) || "[]",
    latitude: asNumber(row.latitude, 0),
    longitude: asNumber(row.longitude, 0),
    start_at: asDate(row.start_at, null),
    end_at: asDate(row.end_at, null),
    is_all_day: asBoolean(row.is_all_day, false),
    event_date: eventDate,
    expire_date: expireDate,
    event_image: row.event_image,
    address: asOptional(row.address),
    view_count: asNumber(row.view_count, 0),
    popularity_score: asNumber(row.popularity_score, 0),
    created_at: asDate(row.created_at, new Date()),
    updated_at: asDate(row.updated_at, new Date()),
  };
}

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }

  if (process.env.SUPABASE_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.SUPABASE_DATABASE_URL;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL (or SUPABASE_DATABASE_URL) is required");
  }

  const targetPath = path.resolve(process.cwd(), args.file);
  const text = await fs.readFile(targetPath, "utf8");
  const rows = parseCsv(text);
  if (rows.length === 0) {
    throw new Error(`CSV has no records: ${targetPath}`);
  }

  rows.forEach((row, idx) => validateRow(row, idx + 2));
  const payload = rows.map(toPrismaData);
  const chunks = chunkArray(payload, args.chunk);

  const prisma = new PrismaClient();
  let totalInserted = 0;
  try {
    for (let i = 0; i < chunks.length; i += 1) {
      const batch = chunks[i];
      const result = await prisma.event.createMany({
        data: batch,
        skipDuplicates: true,
      });
      totalInserted += result.count;
      console.log(`chunk ${i + 1}/${chunks.length}: inserted ${result.count}`);
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log(`done: inserted ${totalInserted}/${rows.length} rows from ${targetPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
