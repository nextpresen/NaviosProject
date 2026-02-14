import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventDetail } from "@/components/event/EventDetail";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: JSX.IntrinsicElements["img"]) => <img {...props} alt={props.alt ?? ""} />,
}));

describe("EventDetail", () => {
  it("renders title/content/date", () => {
    render(
      <EventDetail
        id="evt-1"
        title="春祭り"
        content="本文テキスト"
        imageUrl="https://example.com/a.jpg"
        dateText="2026年2月14日"
        daysText="開催中"
        status="today"
      />,
    );

    expect(screen.getByText("春祭り")).toBeInTheDocument();
    expect(screen.getByText("本文テキスト")).toBeInTheDocument();
    expect(screen.getByText("2026年2月14日")).toBeInTheDocument();
  });
});
