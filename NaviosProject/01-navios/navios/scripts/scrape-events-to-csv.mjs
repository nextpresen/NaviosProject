import fs from "node:fs/promises";
import path from "node:path";
import { toCsv } from "./csv-utils.mjs";

const EVENT_HEADERS = [
  "id",
  "title",
  "content",
  "author_id",
  "author_avatar_url",
  "category",
  "tags_json",
  "latitude",
  "longitude",
  "start_at",
  "end_at",
  "is_all_day",
  "event_date",
  "expire_date",
  "event_image",
  "address",
  "view_count",
  "popularity_score",
  "created_at",
  "updated_at",
];

function parseArgs(argv) {
  const args = {
    urls: [],
    out: "./events_for_supabase.csv",
    category: "event",
    defaultImage: "https://placehold.co/1200x800?text=Event",
    defaultLat: 31.5966,
    defaultLng: 130.5571,
    timeoutMs: 20000,
    kcicMaxPages: 1,
    kcicDetail: true,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === "--url") {
      args.urls.push(argv[i + 1]);
      i += 1;
      continue;
    }
    if (value === "--urls-file") {
      args.urlsFile = argv[i + 1];
      i += 1;
      continue;
    }
    if (value === "--out") {
      args.out = argv[i + 1];
      i += 1;
      continue;
    }
    if (value === "--category") {
      args.category = argv[i + 1];
      i += 1;
      continue;
    }
    if (value === "--default-image") {
      args.defaultImage = argv[i + 1];
      i += 1;
      continue;
    }
    if (value === "--default-lat") {
      args.defaultLat = Number(argv[i + 1]) || args.defaultLat;
      i += 1;
      continue;
    }
    if (value === "--default-lng") {
      args.defaultLng = Number(argv[i + 1]) || args.defaultLng;
      i += 1;
      continue;
    }
    if (value === "--timeout-ms") {
      args.timeoutMs = Number(argv[i + 1]) || 20000;
      i += 1;
      continue;
    }
    if (value === "--kcic-max-pages") {
      args.kcicMaxPages = Number(argv[i + 1]) || 1;
      i += 1;
      continue;
    }
    if (value === "--no-kcic-detail") {
      args.kcicDetail = false;
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
  console.log("  node scripts/scrape-events-to-csv.mjs --url <url> [--url <url> ...]");
  console.log("  node scripts/scrape-events-to-csv.mjs --urls-file ./urls.txt");
  console.log("");
  console.log("Options:");
  console.log("  --out <path>            CSV output path (default: ./events_for_supabase.csv)");
  console.log("  --category <value>      Event.category (default: event)");
  console.log("  --default-image <url>   Fallback image URL");
  console.log("  --default-lat <number>  Fallback latitude when source has no geo");
  console.log("  --default-lng <number>  Fallback longitude when source has no geo");
  console.log("  --timeout-ms <number>   Fetch timeout in ms (default: 20000)");
  console.log("  --kcic-max-pages <n>    Max pages for kcic.jp/event_list (default: 1)");
  console.log("  --no-kcic-detail        Skip KCIC detail fetch");
}

function readDate(raw) {
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function toIso(date) {
  return date ? date.toISOString() : "";
}

function pickType(typeField) {
  if (!typeField) return [];
  if (Array.isArray(typeField)) return typeField;
  return [typeField];
}

function extractEventNodes(node, out = []) {
  if (!node) return out;
  if (Array.isArray(node)) {
    node.forEach((item) => extractEventNodes(item, out));
    return out;
  }
  if (typeof node !== "object") {
    return out;
  }

  const types = pickType(node["@type"]).map((type) => String(type).toLowerCase());
  if (types.includes("event")) {
    out.push(node);
  }

  Object.values(node).forEach((value) => {
    if (typeof value === "object" && value !== null) {
      extractEventNodes(value, out);
    }
  });
  return out;
}

function extractJsonLdBlocks(html) {
  const matches = [];
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

function normalizeAddress(location) {
  if (!location?.address) return "";
  if (typeof location.address === "string") return location.address;
  const keys = [
    "streetAddress",
    "addressLocality",
    "addressRegion",
    "postalCode",
    "addressCountry",
  ];
  return keys
    .map((key) => location.address[key])
    .filter(Boolean)
    .join(" ");
}

function parseImage(raw) {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    const first = raw.find((item) => typeof item === "string");
    return first || "";
  }
  if (typeof raw === "object" && raw.url) return String(raw.url);
  return "";
}

function parseKeywords(raw) {
  if (!raw) return "[]";
  if (Array.isArray(raw)) {
    return JSON.stringify(raw.map((v) => String(v).trim()).filter(Boolean));
  }
  if (typeof raw === "string") {
    const list = raw
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    return JSON.stringify(list);
  }
  return "[]";
}

function decodeHtmlEntities(value) {
  if (!value) return "";
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#039;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCharCode(Number.parseInt(dec, 10)));
}

function stripTags(html) {
  return decodeHtmlEntities(String(html || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, ""))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function firstMatch(regex, text) {
  const match = regex.exec(text);
  return match ? match[1] : "";
}

function collectMatches(regex, text) {
  const out = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    out.push(match[1]);
  }
  return out;
}

function parseDotDate(text) {
  if (!text) return null;
  const m = text.match(/(\d{4})\.(\d{2})\.(\d{2})/);
  if (!m) return null;
  const [_, y, mo, d] = m;
  return new Date(`${y}-${mo}-${d}T00:00:00+09:00`);
}

function parsePeriodDates(periodText) {
  const matches = [...periodText.matchAll(/(\d{4}\.\d{2}\.\d{2})/g)].map((v) => v[1]);
  if (matches.length === 0) {
    return { startAt: null, endAt: null };
  }
  const startAt = parseDotDate(matches[0]);
  const endAt = parseDotDate(matches[matches.length - 1]) || startAt;
  return { startAt, endAt };
}

function absolutizeUrl(baseUrl, maybeRelative) {
  if (!maybeRelative) return "";
  try {
    return new URL(maybeRelative, baseUrl).toString();
  } catch {
    return maybeRelative;
  }
}

function isKcicEventListUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    return /(^|\.)kcic\.jp$/i.test(url.hostname) && url.pathname.startsWith("/event_list");
  } catch {
    return false;
  }
}

function parseDetailAttrs(html) {
  const attrs = {};
  const regex = /<dt class="post-attr-title">([\s\S]*?)<\/dt>\s*<dd class="post-attr-content">([\s\S]*?)<\/dd>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const key = stripTags(match[1]);
    const value = stripTags(match[2]);
    if (key) attrs[key] = value;
  }
  return attrs;
}

async function enrichKcicItemFromDetail(item, options) {
  if (!options.kcicDetail || !item.detailUrl) {
    return item;
  }
  try {
    const html = await fetchHtml(item.detailUrl, options.timeoutMs);
    const attrs = parseDetailAttrs(html);
    const venue = attrs["会場"] || attrs["場所"] || "";
    const when = attrs["開催日"] || "";
    const time = attrs["時間"] || "";
    const descriptionMeta = firstMatch(/<meta name="description" content="([\s\S]*?)"\s*\/?>/i, html);
    const imageMeta = firstMatch(/<meta property="og:image" content="([\s\S]*?)"\s*\/?>/i, html);
    const periodCandidate = parsePeriodDates(`${when}`);
    return {
      ...item,
      content: stripTags(descriptionMeta) || item.content,
      event_image: item.event_image || imageMeta || options.defaultImage,
      address: venue || item.address,
      start_at: item.start_at || toIso(periodCandidate.startAt),
      end_at: item.end_at || toIso(periodCandidate.endAt),
      event_date: item.event_date || toIso(periodCandidate.startAt),
      expire_date: item.expire_date || toIso(periodCandidate.endAt),
      is_all_day: !time,
    };
  } catch {
    return item;
  }
}

function parseKcicListItems(html, sourceUrl, options) {
  const listHtml = firstMatch(/<ul class="event_list">([\s\S]*?)<\/ul>/i, html);
  if (!listHtml) return [];

  const liBlocks = collectMatches(/<li class="cf">([\s\S]*?)<\/li>/gi, listHtml);
  const now = new Date();
  const rows = [];

  liBlocks.forEach((block) => {
    const titleHtml = firstMatch(/<p class="list_title"><a[^>]*>([\s\S]*?)<\/a><\/p>/i, block);
    const title = stripTags(titleHtml);
    if (!title) return;

    const detailUrlRaw = firstMatch(/<p class="list_title"><a href="([^"]+)"/i, block);
    const detailUrl = absolutizeUrl(sourceUrl, detailUrlRaw);
    if (detailUrl.includes("/event_report/")) return;

    const imageSrc = firstMatch(/<img[^>]*src="([^"]+)"/i, block);
    const descriptionHtml = firstMatch(/<p class="list_text">([\s\S]*?)<\/p>/i, block);
    const periodHtml = firstMatch(/<p class="list_period">([\s\S]*?)<\/p>/i, block);
    const genreList = collectMatches(/event_list_genre_icon"[^>]*alt="([^"]+)"/gi, block).map((v) => stripTags(v));
    const fieldList = collectMatches(/<span class="event_list_field_item">([\s\S]*?)<\/span>/gi, block).map((v) =>
      stripTags(v),
    );
    const tags = [...new Set([...genreList, ...fieldList].filter(Boolean))];
    const periodText = stripTags(periodHtml);
    const period = parsePeriodDates(periodText);

    rows.push({
      id: "",
      title,
      content: `${stripTags(descriptionHtml)}\n\nsource: ${detailUrl}`.trim(),
      author_id: "",
      author_avatar_url: "",
      category: options.category,
      tags_json: JSON.stringify(tags),
      latitude: options.defaultLat,
      longitude: options.defaultLng,
      start_at: toIso(period.startAt),
      end_at: toIso(period.endAt),
      is_all_day: true,
      event_date: toIso(period.startAt),
      expire_date: toIso(period.endAt),
      event_image: absolutizeUrl(sourceUrl, imageSrc) || options.defaultImage,
      address: "",
      view_count: 0,
      popularity_score: 0,
      created_at: toIso(now),
      updated_at: toIso(now),
      _source: detailUrl || sourceUrl,
      detailUrl,
    });
  });

  return rows;
}

function parseKcicNextPage(html, baseUrl) {
  const next = firstMatch(/<a href="([^"]+)">次へ\s*&rsaquo;<\/a>/i, html);
  return next ? absolutizeUrl(baseUrl, next) : "";
}

async function scrapeKcicEvents(startUrl, options) {
  const allRows = [];
  const visited = new Set();
  let nextUrl = startUrl;
  let page = 0;

  while (nextUrl && !visited.has(nextUrl) && page < options.kcicMaxPages) {
    visited.add(nextUrl);
    page += 1;
    const html = await fetchHtml(nextUrl, options.timeoutMs);
    const pageRows = parseKcicListItems(html, nextUrl, options);
    for (const row of pageRows) {
      const enriched = await enrichKcicItemFromDetail(row, options);
      allRows.push(enriched);
    }
    nextUrl = parseKcicNextPage(html, nextUrl);
    console.log(`kcic page ${page}: ${pageRows.length} rows`);
  }

  return allRows;
}

function isAllDay(rawStart) {
  if (!rawStart || typeof rawStart !== "string") return false;
  return !rawStart.includes("T");
}

function parseLatLng(item) {
  const location = item.location || {};
  const geo = location.geo || item.geo || {};
  const lat = Number(geo.latitude);
  const lng = Number(geo.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  return { lat, lng, location };
}

function normalizeEvent(item, sourceUrl, options) {
  const title = (item.name || item.headline || "").toString().trim();
  if (!title) return null;

  const geo = parseLatLng(item);
  if (!geo) return null;

  const startAt = readDate(item.startDate);
  const endAt = readDate(item.endDate) || startAt;
  if (!startAt) return null;

  const now = new Date();
  const eventImage = parseImage(item.image) || options.defaultImage;

  return {
    id: "",
    title,
    content: String(item.description || title),
    author_id: "",
    author_avatar_url: "",
    category: options.category,
    tags_json: parseKeywords(item.keywords),
    latitude: geo.lat,
    longitude: geo.lng,
    start_at: toIso(startAt),
    end_at: toIso(endAt),
    is_all_day: isAllDay(item.startDate),
    event_date: toIso(startAt),
    expire_date: toIso(endAt),
    event_image: eventImage,
    address: normalizeAddress(geo.location),
    view_count: 0,
    popularity_score: 0,
    created_at: toIso(now),
    updated_at: toIso(now),
    _source: sourceUrl,
  };
}

async function fetchHtml(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

function uniqueByKey(items) {
  const map = new Map();
  items.forEach((item) => {
    const key = [item.title, item.event_date, item.latitude, item.longitude].join("|");
    if (!map.has(key)) {
      map.set(key, item);
    }
  });
  return [...map.values()];
}

async function resolveUrls(args) {
  const urls = [...args.urls];
  if (args.urlsFile) {
    const content = await fs.readFile(args.urlsFile, "utf8");
    const fromFile = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));
    urls.push(...fromFile);
  }
  return [...new Set(urls)];
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }

  const urls = await resolveUrls(args);
  if (urls.length === 0) {
    usage();
    throw new Error("No URLs provided. Use --url or --urls-file.");
  }

  const rows = [];
  for (const url of urls) {
    try {
      const html = await fetchHtml(url, args.timeoutMs);
      const blocks = extractJsonLdBlocks(html);
      for (const block of blocks) {
        try {
          const json = JSON.parse(block.trim());
          const events = extractEventNodes(json);
          events.forEach((eventNode) => {
            const normalized = normalizeEvent(eventNode, url, args);
            if (normalized) rows.push(normalized);
          });
        } catch {
          continue;
        }
      }
      if (isKcicEventListUrl(url) && rows.filter((row) => row._source === url).length === 0) {
        const kcicRows = await scrapeKcicEvents(url, args);
        rows.push(...kcicRows);
      }
      console.log(`scraped: ${url}`);
    } catch (error) {
      console.error(`failed: ${url} (${error.message})`);
    }
  }

  const uniqueRows = uniqueByKey(rows);
  const csvRows = uniqueRows.map((row) => {
    const out = {};
    EVENT_HEADERS.forEach((header) => {
      out[header] = row[header] ?? "";
    });
    return out;
  });

  const output = toCsv(EVENT_HEADERS, csvRows);
  const outPath = path.resolve(process.cwd(), args.out);
  await fs.writeFile(outPath, output, "utf8");

  console.log(`done: ${csvRows.length} rows -> ${outPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
