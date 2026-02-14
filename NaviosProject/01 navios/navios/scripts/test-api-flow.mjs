import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

function day(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

async function main() {
  const loginRoutePath = path.resolve(".next/server/app/api/auth/login/route.js");
  const eventsRoutePath = path.resolve(".next/server/app/api/events/route.js");
  const eventIdRoutePath = path.resolve(".next/server/app/api/events/[id]/route.js");

  await access(loginRoutePath, fsConstants.R_OK);
  await access(eventsRoutePath, fsConstants.R_OK);
  await access(eventIdRoutePath, fsConstants.R_OK);

  const loginRoute = await import(pathToFileURL(loginRoutePath).href);
  const eventsRoute = await import(pathToFileURL(eventsRoutePath).href);
  const eventByIdRoute = await import(pathToFileURL(eventIdRoutePath).href);

  const loginUserland = loginRoute.default?.routeModule?.userland ?? {};
  const eventsUserland = eventsRoute.default?.routeModule?.userland ?? {};
  const eventByIdUserland = eventByIdRoute.default?.routeModule?.userland ?? {};

  const postLogin = loginUserland.POST;
  const getEvents = eventsUserland.GET;
  const postEvents = eventsUserland.POST;
  const getEventById = eventByIdUserland.GET;
  const putEventById = eventByIdUserland.PUT;
  const deleteEventById = eventByIdUserland.DELETE;

  assert.equal(typeof postLogin, "function", "POST /api/auth/login handler should exist");
  assert.equal(typeof getEvents, "function", "GET /api/events handler should exist");
  assert.equal(typeof postEvents, "function", "POST /api/events handler should exist");
  assert.equal(typeof getEventById, "function", "GET /api/events/:id handler should exist");
  assert.equal(typeof putEventById, "function", "PUT /api/events/:id handler should exist");
  assert.equal(typeof deleteEventById, "function", "DELETE /api/events/:id handler should exist");

  const listRes = await getEvents(new Request("http://localhost/api/events"));
  assert.equal(listRes.status, 200, "GET /api/events should be 200");

  const loginRes = await postLogin(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user@navios.local", password: "user1234" }),
    }),
  );
  assert.equal(loginRes.status, 200, "user login should be 200");
  const userCookie = loginRes.headers.get("set-cookie");
  assert.ok(userCookie, "user login should set cookie");

  const adminLoginRes = await postLogin(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@navios.local", password: "admin1234" }),
    }),
  );
  assert.equal(adminLoginRes.status, 200, "admin login should be 200");
  const adminCookie = adminLoginRes.headers.get("set-cookie");
  assert.ok(adminCookie, "admin login should set cookie");

  const user2LoginRes = await postLogin(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "user2@navios.local", password: "user2234" }),
    }),
  );
  assert.equal(user2LoginRes.status, 200, "second user login should be 200");
  const user2Cookie = user2LoginRes.headers.get("set-cookie");
  assert.ok(user2Cookie, "second user login should set cookie");

  const stamp = Date.now();
  const createPayload = {
    title: `Flow Test ${stamp}`,
    content: "api flow test",
    latitude: 31.57371,
    longitude: 130.345154,
    event_date: day(1),
    expire_date: day(2),
    event_image: "https://placehold.co/1200x800/2a91ff/ffffff?text=Flow",
  };

  const createdRes = await postEvents(
    new Request("http://localhost/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: userCookie },
      body: JSON.stringify(createPayload),
    }),
  );
  assert.equal(createdRes.status, 201, "POST /api/events should be 201");
  const createdPayload = await createdRes.json();
  const eventId = createdPayload.event?.id ?? createdPayload.data?.event?.id;
  assert.ok(eventId, "created event id should exist");

  const invalidEditRes = await putEventById(
    new Request(`http://localhost/api/events/${eventId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", cookie: userCookie },
      body: JSON.stringify({ ...createPayload, expire_date: day(-1) }),
    }),
    { params: Promise.resolve({ id: eventId }) },
  );
  assert.equal(invalidEditRes.status, 400, "invalid edit payload should return 400");

  const forbiddenUpdateRes = await putEventById(
    new Request(`http://localhost/api/events/${eventId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", cookie: user2Cookie },
      body: JSON.stringify({ ...createPayload, title: `Forbidden ${stamp}` }),
    }),
    { params: Promise.resolve({ id: eventId }) },
  );
  assert.equal(forbiddenUpdateRes.status, 403, "non-owner should return 403");

  const adminUpdateRes = await putEventById(
    new Request(`http://localhost/api/events/${eventId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ ...createPayload, title: `Admin Updated ${stamp}` }),
    }),
    { params: Promise.resolve({ id: eventId }) },
  );
  assert.equal(adminUpdateRes.status, 200, "admin should be able to update");

  const updatedTitle = `Flow Updated ${stamp}`;
  const updatedRes = await putEventById(
    new Request(`http://localhost/api/events/${eventId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", cookie: userCookie },
      body: JSON.stringify({ ...createPayload, title: updatedTitle }),
    }),
    { params: Promise.resolve({ id: eventId }) },
  );
  assert.equal(updatedRes.status, 200, "PUT /api/events/:id should be 200");
  const updatedPayload = await updatedRes.json();
  const updated = updatedPayload.event ?? updatedPayload.data?.event;
  assert.equal(updated?.title, updatedTitle, "updated title should match");

  const detailRes = await getEventById(
    new Request(`http://localhost/api/events/${eventId}`),
    { params: Promise.resolve({ id: eventId }) },
  );
  assert.equal(detailRes.status, 200, "GET /api/events/:id should be 200");
  const detailPayload = await detailRes.json();
  const detail = detailPayload.event ?? detailPayload.data?.event;
  assert.equal(detail?.title, updatedTitle, "detail should reflect updated title");

  const deletedRes = await deleteEventById(
    new Request(`http://localhost/api/events/${eventId}`, {
      method: "DELETE",
      headers: { cookie: userCookie },
    }),
    { params: Promise.resolve({ id: eventId }) },
  );
  assert.equal(deletedRes.status, 200, "DELETE /api/events/:id should be 200");

  const afterDeleteRes = await getEventById(
    new Request(`http://localhost/api/events/${eventId}`),
    { params: Promise.resolve({ id: eventId }) },
  );
  assert.equal(afterDeleteRes.status, 404, "deleted event should return 404");

  console.log("API flow test passed: list/create/validate-update/update/detail/delete");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
