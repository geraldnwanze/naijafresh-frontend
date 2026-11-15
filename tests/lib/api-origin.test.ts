import { describe, expect, it } from "vitest";

import { normalizeApiOrigin } from "@/lib/api-origin";

describe("normalizeApiOrigin", () => {
  it("trims whitespace and trailing slashes", () => {
    expect(normalizeApiOrigin("  https://api.example.com/// ")).toBe("https://api.example.com");
  });

  it("drops a pasted /api or /api/v1 suffix", () => {
    expect(normalizeApiOrigin("https://api.example.com/api/v1")).toBe("https://api.example.com");
    expect(normalizeApiOrigin("https://api.example.com/api/")).toBe("https://api.example.com");
    expect(normalizeApiOrigin("https://api.example.com/API/V1")).toBe("https://api.example.com");
  });

  it("falls back when empty or missing", () => {
    expect(normalizeApiOrigin(undefined)).toBe("http://localhost:8000");
    expect(normalizeApiOrigin("   ")).toBe("http://localhost:8000");
    expect(normalizeApiOrigin("", "http://x.test")).toBe("http://x.test");
  });
});
