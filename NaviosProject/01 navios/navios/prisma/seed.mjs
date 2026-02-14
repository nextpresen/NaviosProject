import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function isoDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

const events = [
  {
    id: "evt-001",
    title: "日置市 春の花まつり 2026",
    content:
      "日置市最大級の春祭り。地元の屋台が50店舗以上出店し、ステージでは郷土芸能やライブ演奏が楽しめます。家族連れにもおすすめ。",
    latitude: 31.5745,
    longitude: 130.3418,
    event_date: isoDate(0),
    expire_date: isoDate(0),
    event_image: "https://placehold.co/800x480/f59e0b/ffffff?text=Spring+Festival",
  },
  {
    id: "evt-002",
    title: "吉利の丘 夕焼けフォトウォーク",
    content:
      "写真愛好家のための撮影イベント。プロカメラマンが同行し、夕焼けの撮影テクニックを教わりながら絶景スポットを巡ります。",
    latitude: 31.57371,
    longitude: 130.345154,
    event_date: isoDate(0),
    expire_date: isoDate(0),
    event_image: "https://placehold.co/800x480/ef4444/ffffff?text=Photo+Walk",
  },
  {
    id: "evt-003",
    title: "隠れ家カフェ 木漏れ日 特別ランチ会",
    content:
      "地元農家から直送の旬の野菜を使った特別コースランチ。限定20名の予約制イベントです。テラス席から日置の山々を一望。",
    latitude: 31.5751,
    longitude: 130.348,
    event_date: isoDate(2),
    expire_date: isoDate(2),
    event_image: "https://placehold.co/800x480/22c55e/ffffff?text=Special+Lunch",
  },
  {
    id: "evt-004",
    title: "日吉古道ナイトハイク",
    content:
      "満月の夜に開催される特別なハイキングイベント。ガイド付きで歴史ある石畳の古道を月明かりの下で歩きます。ヘッドランプ貸出あり。",
    latitude: 31.5718,
    longitude: 130.343,
    event_date: isoDate(5),
    expire_date: isoDate(5),
    event_image: "https://placehold.co/800x480/6366f1/ffffff?text=Night+Hike",
  },
  {
    id: "evt-005",
    title: "吉利川 桜ライトアップ",
    content:
      "川沿いの桜並木を幻想的にライトアップ。屋台の出店や地元ミュージシャンの演奏もあり。期間中毎日18:00〜21:00開催。",
    latitude: 31.5722,
    longitude: 130.3465,
    event_date: isoDate(-3),
    expire_date: isoDate(-1),
    event_image: "https://placehold.co/800x480/ec4899/ffffff?text=Sakura+Light",
  },
  {
    id: "evt-006",
    title: "漁港朝市 海鮮BBQフェス",
    content:
      "毎月恒例の朝市に加え、今回は海鮮BBQ特別企画。朝獲れの新鮮な魚介を自分で焼いて楽しめます。朝6:00スタート。",
    latitude: 31.576,
    longitude: 130.3502,
    event_date: isoDate(-10),
    expire_date: isoDate(-10),
    event_image: "https://placehold.co/800x480/f97316/ffffff?text=Seafood+BBQ",
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
        latitude: event.latitude,
        longitude: event.longitude,
        event_date: new Date(event.event_date),
        expire_date: new Date(event.expire_date),
        event_image: event.event_image,
      },
      create: {
        id: event.id,
        title: event.title,
        content: event.content,
        author_id: "seed-user",
        latitude: event.latitude,
        longitude: event.longitude,
        event_date: new Date(event.event_date),
        expire_date: new Date(event.expire_date),
        event_image: event.event_image,
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
