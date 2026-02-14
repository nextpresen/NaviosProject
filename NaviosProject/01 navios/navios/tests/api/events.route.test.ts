import { beforeEach, describe, expect, it, vi } from "vitest";

const eventFindMany = vi.fn();
const eventCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    event: {
      findMany: eventFindMany,
      create: eventCreate,
    },
  },
}));

import { GET, POST } from "@/app/api/events/route";

describe("/api/events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns events from prisma", async () => {
    eventFindMany.mockResolvedValue([
      {
        id: "evt-1",
        title: "title",
        content: "content",
        latitude: 31.5,
        longitude: 130.3,
        event_date: new Date("2026-02-14"),
        expire_date: new Date("2026-02-15"),
        event_image: "https://example.com/a.jpg",
      },
    ]);

    const response = await GET(new Request("http://localhost/api/events"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.events).toHaveLength(1);
    expect(payload.events).toHaveLength(1);
  });

  it("POST validates payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "" }),
      }),
    );

    const payload = await response.json();
    expect(response.status).toBe(400);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("VALIDATION_ERROR");
    expect(eventCreate).not.toHaveBeenCalled();
  });
});
