import { PrismaClient } from "@prisma/client";

function day(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date;
}

function dayTime(offset = 0, hour = 9, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function main() {
  const prisma = new PrismaClient();
  const stamp = Date.now();
  const title = `Supabase rehearsal ${stamp}`;

  const created = await prisma.event.create({
    data: {
      title,
      content: "supabase rehearsal",
      latitude: 31.57371,
      longitude: 130.345154,
      start_at: dayTime(1, 10, 0),
      end_at: dayTime(2, 18, 0),
      is_all_day: false,
      event_date: day(1),
      expire_date: day(2),
      event_image: "https://placehold.co/1200x800/16a34a/ffffff?text=Supabase",
    },
  });

  const listed = await prisma.event.findMany({
    where: { id: created.id },
    take: 1,
  });

  const updated = await prisma.event.update({
    where: { id: created.id },
    data: { title: `${title} updated` },
  });

  await prisma.event.delete({ where: { id: created.id } });

  await prisma.$disconnect();

  console.log("Supabase CRUD rehearsal passed");
  console.log(JSON.stringify({ createdId: created.id, listed: listed.length, updatedTitle: updated.title }));
}

main().catch(async (error) => {
  console.error("Supabase CRUD rehearsal failed");
  console.error(error);
  process.exit(1);
});
