import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiFetch, unwrap } from "@/lib/api";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function failure(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    return error as ApiError;
  }
  throw new Error("Expected the request to fail");
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiFetch", () => {
  it("calls the same-origin API path with JSON headers and a bearer token", async () => {
    fetchMock.mockResolvedValue(json({ data: 1 }));

    await apiFetch("/orders", { method: "POST", token: "abc", body: { a: 1 } });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/_api/v1/orders");
    expect(init.headers).toMatchObject({
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: "Bearer abc",
    });
    expect(init.body).toBe('{"a":1}');
    expect(init.cache).toBe("no-store");
  });

  it("returns undefined for 204", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(apiFetch("/x", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("throws ApiError with validation messages", async () => {
    fetchMock.mockResolvedValue(json({ message: "Invalid", errors: { email: ["Taken"] } }, 422));

    const error = await failure(apiFetch("/auth/register", { method: "POST", body: {} }));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(422);
    expect(error.firstError).toBe("Taken");
  });

  it("recovers JSON that has PHP notice noise in front of it", async () => {
    fetchMock.mockResolvedValue(new Response('<b>Notice</b>: Broken pipe\n{"data":{"id":7}}', { status: 200 }));
    await expect(apiFetch("/x")).resolves.toEqual({ data: { id: 7 } });
  });

  it("retries a safe request once after a network failure", async () => {
    fetchMock.mockRejectedValueOnce(new Error("down")).mockResolvedValueOnce(json({ ok: true }));
    await expect(apiFetch("/products")).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry a POST after a network failure", async () => {
    fetchMock.mockRejectedValue(new Error("down"));

    const error = await failure(apiFetch("/orders", { method: "POST", body: {} }));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries an unparseable safe response once, then reports it", async () => {
    fetchMock.mockImplementation(async () => new Response("<html>bad gateway</html>", { status: 502 }));

    const error = await failure(apiFetch("/products"));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("unwraps data envelopes", () => {
    expect(unwrap({ data: [1, 2] })).toEqual([1, 2]);
  });
});
