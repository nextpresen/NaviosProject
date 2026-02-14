import { beforeEach, describe, expect, it, vi } from "vitest";

const eventFindUnique = vi.fn();
const eventUpdate = vi.fn();
const eventDelete = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    event: {
      findUnique: eventFindUnique,
      update: eventUpdate,
      delete: eventDelete,
    },
  },
}));

import { DELETE, GET, PUT } from "@/app/api/events/[id]/route";

describe("/api/events/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns single event", async () => {
    eventFindUnique.mockResolvedValue({
      id: "evt-1",
      title: "title",
      content: "content",
      latitude: 31.5,
      longitude: 130.3,
      event_date: new Date("2026-02-14"),
      expire_date: new Date("2026-02-14"),
      event_image: "https://example.com/a.jpg",
    });

    const response = await GET(new Request("http://localhost/api/events/evt-1"), {
      params: Promise.resolve({ id: "evt-1" }),
    });

    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.event.id).toBe("evt-1");
  });

  it("PUT validates date range", async () => {
    const response = await PUT(
      new Request("http://localhost/api/events/evt-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "title",
          content: "content",
          latitude: 31.5,
          longitude: 130.3,
          event_date: "2026-03-01",
          expire_date: "2026-02-01",
          event_image: "https://example.com/a.jpg",
        }),
      }),
      { params: Promise.resolve({ id: "evt-1" }) },
    );

    const payload = await response.json();
    expect(response.status).toBe(400);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("VALIDATION_ERROR");
    expect(eventUpdate).not.toHaveBeenCalled();
  });

  it("DELETE removes event", async () => {
    eventDelete.mockResolvedValue({ id: "evt-1" });

    const response = await DELETE(new Request("http://localhost/api/events/evt-1"), {
      params: Promise.resolve({ id: "evt-1" }),
    });

    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.id).toBe("evt-1");
  });
});
