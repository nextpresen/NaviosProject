import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventActions } from "@/components/event/EventActions";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    refresh,
  }),
}));

describe("EventActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
  });

  it("has edit link", () => {
    render(<EventActions id="evt-1" />);
    const link = screen.getByRole("link", { name: "この投稿を編集" });
    expect(link).toHaveAttribute("href", "/new?id=evt-1");
  });

  it("deletes and redirects", async () => {
    render(<EventActions id="evt-1" />);
    fireEvent.click(screen.getByRole("button", { name: "この投稿を削除" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/events/evt-1", { method: "DELETE" });
    });

    expect(push).toHaveBeenCalledWith("/");
    expect(refresh).toHaveBeenCalled();
  });
});
