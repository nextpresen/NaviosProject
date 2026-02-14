import assert from "node:assert/strict";

const baseUrl = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3100";

async function request(path, init) {
  const res = await fetch(`${baseUrl}${path}`, init);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // non-json response (page html)
  }
  return { res, json, text };
}

function day(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

async function main() {
  const suffix = Date.now();

  const list = await request("/api/events");
  assert.equal(list.res.status, 200, "GET /api/events should return 200");

  const createPayload = {
    title: `E2E Event ${suffix}`,
    content: "Created by e2e-like test",
    latitude: 31.57371,
    longitude: 130.345154,
    event_date: day(1),
    expire_date: day(2),
    event_image: "https://placehold.co/1200x800/2a91ff/ffffff?text=E2E",
  };

  const created = await request("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(createPayload),
  });

  assert.equal(created.res.status, 201, "POST /api/events should return 201");
  const eventId = created.json?.event?.id ?? created.json?.data?.event?.id;
  assert.ok(eventId, "created event id should exist");

  const newPage = await request(`/new?id=${eventId}`);
  assert.equal(newPage.res.status, 200, "GET /new?id=... should return 200");

  const updatedTitle = `E2E Event Updated ${suffix}`;
  const updated = await request(`/api/events/${eventId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...createPayload, title: updatedTitle }),
  });

  assert.equal(updated.res.status, 200, "PUT /api/events/:id should return 200");
  const updatedEvent = updated.json?.event ?? updated.json?.data?.event;
  assert.equal(updatedEvent?.title, updatedTitle, "updated title should be reflected");

  const detailApi = await request(`/api/events/${eventId}`);
  assert.equal(detailApi.res.status, 200, "GET /api/events/:id should return 200");
  const fetched = detailApi.json?.event ?? detailApi.json?.data?.event;
  assert.equal(fetched?.title, updatedTitle, "GET /api/events/:id should return updated title");

  const detailPage = await request(`/event/${eventId}`);
  assert.equal(detailPage.res.status, 200, "GET /event/:id should return 200");
  assert.ok(detailPage.text.includes(updatedTitle), "event detail page should include updated title");

  const removed = await request(`/api/events/${eventId}`, { method: "DELETE" });
  assert.equal(removed.res.status, 200, "DELETE /api/events/:id should return 200");

  const afterDelete = await request(`/api/events/${eventId}`);
  assert.equal(afterDelete.res.status, 404, "GET deleted event should return 404");

  console.log("E2E-like flow passed:");
  console.log("- list/create/update/detail/delete");
  console.log("- /new?id=... and /event/:id routing checks");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
