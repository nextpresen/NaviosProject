import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function isoDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function isoDateTime(offsetDays, hour, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

const events = [
  {
    id: "evt-001",
    title: "日置市 春の花まつり 2026",
    content:
      "日置市最大級の春祭り。地元の屋台が50店舗以上出店し、ステージでは郷土芸能やライブ演奏が楽しめます。家族連れにもおすすめ。",
    author_avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=hanako",
    category: "event",
    tags: ["go_now"],
    latitude: 31.5745,
    longitude: 130.3418,
    address: "鹿児島県日置市伊集院町郡付近",
    start_at: isoDateTime(0, 10, 0),
    end_at: isoDateTime(0, 17, 0),
    is_all_day: false,
    event_date: isoDate(0),
    expire_date: isoDate(0),
    event_image: "https://placehold.co/800x480/f59e0b/ffffff?text=Spring+Festival",
    view_count: 120,
    popularity_score: 88,
  },
  {
    id: "evt-002",
    title: "吉利の丘 夕焼けフォトウォーク",
    content:
      "写真愛好家のための撮影イベント。プロカメラマンが同行し、夕焼けの撮影テクニックを教わりながら絶景スポットを巡ります。",
    author_avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=takuya",
    category: "local_news",
    tags: ["go_now"],
    latitude: 31.57371,
    longitude: 130.345154,
    address: "鹿児島県日置市伊集院町麦生田付近",
    start_at: isoDateTime(0, 16, 0),
    end_at: isoDateTime(0, 19, 0),
    is_all_day: false,
    event_date: isoDate(0),
    expire_date: isoDate(0),
    event_image: "https://placehold.co/800x480/ef4444/ffffff?text=Photo+Walk",
    view_count: 84,
    popularity_score: 73,
  },
  {
    id: "evt-003",
    title: "隠れ家カフェ 木漏れ日 特別ランチ会",
    content:
      "地元農家から直送の旬の野菜を使った特別コースランチ。限定20名の予約制イベントです。テラス席から日置の山々を一望。",
    author_avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=yui",
    category: "gourmet",
    tags: ["under_1000"],
    latitude: 31.5751,
    longitude: 130.348,
    address: "鹿児島県日置市伊集院町妙円寺付近",
    start_at: isoDateTime(2, 11, 30),
    end_at: isoDateTime(2, 14, 0),
    is_all_day: false,
    event_date: isoDate(2),
    expire_date: isoDate(2),
    event_image: "https://placehold.co/800x480/22c55e/ffffff?text=Special+Lunch",
    view_count: 56,
    popularity_score: 61,
  },
  {
    id: "evt-004",
    title: "日吉古道ナイトハイク",
    content:
      "満月の夜に開催される特別なハイキングイベント。ガイド付きで歴史ある石畳の古道を月明かりの下で歩きます。ヘッドランプ貸出あり。",
    author_avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=kentaro",
    category: "event",
    tags: [],
    latitude: 31.5718,
    longitude: 130.343,
    address: "鹿児島県日置市伊集院町下谷口付近",
    start_at: isoDateTime(5, 19, 0),
    end_at: isoDateTime(5, 21, 30),
    is_all_day: false,
    event_date: isoDate(5),
    expire_date: isoDate(5),
    event_image: "https://placehold.co/800x480/6366f1/ffffff?text=Night+Hike",
    view_count: 42,
    popularity_score: 54,
  },
  {
    id: "evt-005",
    title: "吉利川 桜ライトアップ",
    content:
      "川沿いの桜並木を幻想的にライトアップ。屋台の出店や地元ミュージシャンの演奏もあり。期間中毎日18:00〜21:00開催。",
    author_avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=akari",
    category: "sale",
    tags: ["free"],
    latitude: 31.5722,
    longitude: 130.3465,
    address: "鹿児島県日置市伊集院町猪鹿倉付近",
    start_at: isoDateTime(-3, 0, 0),
    end_at: isoDateTime(-1, 23, 59),
    is_all_day: true,
    event_date: isoDate(-3),
    expire_date: isoDate(-1),
    event_image: "https://placehold.co/800x480/ec4899/ffffff?text=Sakura+Light",
    view_count: 220,
    popularity_score: 97,
  },
  {
    id: "evt-006",
    title: "漁港朝市 海鮮BBQフェス",
    content:
      "毎月恒例の朝市に加え、今回は海鮮BBQ特別企画。朝獲れの新鮮な魚介を自分で焼いて楽しめます。朝6:00スタート。",
    author_avatar_url: "https://api.dicebear.com/9.x/initials/svg?seed=daichi",
    category: "gourmet",
    tags: ["under_1000", "go_now"],
    latitude: 31.576,
    longitude: 130.3502,
    address: "鹿児島県日置市伊集院町徳重付近",
    start_at: isoDateTime(-10, 6, 0),
    end_at: isoDateTime(-10, 10, 0),
    is_all_day: false,
    event_date: isoDate(-10),
    expire_date: isoDate(-10),
    event_image: "https://placehold.co/800x480/f97316/ffffff?text=Seafood+BBQ",
    view_count: 191,
    popularity_score: 91,
  },
];

async function main() {
  for (const event of events) {
    await prisma.event.upsert({
      where: { id: event.id },
      update: {
        title: event.title,
        content: event.content,
        author_id: "seed-user",
        author_avatar_url: event.author_avatar_url,
        category: event.category,
        tags_json: JSON.stringify(event.tags ?? []),
        latitude: event.latitude,
        longitude: event.longitude,
        address: event.address ?? null,
        start_at: new Date(event.start_at),
        end_at: new Date(event.end_at),
        is_all_day: event.is_all_day,
        event_date: new Date(event.event_date),
        expire_date: new Date(event.expire_date),
        event_image: event.event_image,
        view_count: event.view_count ?? 0,
        popularity_score: event.popularity_score ?? 0,
      },
      create: {
        id: event.id,
        title: event.title,
        content: event.content,
        author_id: "seed-user",
        author_avatar_url: event.author_avatar_url,
        category: event.category,
        tags_json: JSON.stringify(event.tags ?? []),
        latitude: event.latitude,
        longitude: event.longitude,
        address: event.address ?? null,
        start_at: new Date(event.start_at),
        end_at: new Date(event.end_at),
        is_all_day: event.is_all_day,
        event_date: new Date(event.event_date),
        expire_date: new Date(event.expire_date),
        event_image: event.event_image,
        view_count: event.view_count ?? 0,
        popularity_score: event.popularity_score ?? 0,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
