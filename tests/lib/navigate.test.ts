import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { goto } from "@/lib/navigate";

let location: { pathname: string; search: string; assign: ReturnType<typeof vi.fn> };
const router = { push: vi.fn() } as unknown as Parameters<typeof goto>[0];

beforeEach(() => {
  vi.useFakeTimers();
  location = { pathname: "/signup", search: "", assign: vi.fn() };
  vi.stubGlobal("location", location);
  vi.mocked(router.push).mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("goto", () => {
  it("pushes the route and leaves it alone once the URL changes", () => {
    vi.mocked(router.push).mockImplementation(() => {
      location.pathname = "/checkout";
    });

    goto(router, "/checkout");
    vi.advanceTimersByTime(1000);

    expect(router.push).toHaveBeenCalledWith("/checkout");
    expect(location.assign).not.toHaveBeenCalled();
  });

  it("falls back to a full navigation when the transition never happens", () => {
    goto(router, "/checkout");
    vi.advanceTimersByTime(1000);

    expect(location.assign).toHaveBeenCalledWith("/checkout");
  });

  it("does not drag the user back if they have already moved somewhere else", () => {
    goto(router, "/checkout");
    location.pathname = "/orders/7"; // e.g. they placed an order within the safety-net window
    vi.advanceTimersByTime(1000);

    expect(location.assign).not.toHaveBeenCalled();
  });

  it("treats a change of query string as having moved", () => {
    vi.mocked(router.push).mockImplementation(() => {
      location.pathname = "/orders/7";
    });

    goto(router, "/orders/7?placed=1");
    vi.advanceTimersByTime(1000);

    // The push landed (path changed) but the search part never matched: no hard navigation either way.
    expect(location.assign).not.toHaveBeenCalled();
  });

  it("turns anything that is not an absolute path into the home page", () => {
    goto(router, "https://evil.example");
    expect(router.push).toHaveBeenCalledWith("/");
  });
});
