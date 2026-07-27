import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest, ApiError, setAccessToken } from "../../api/client";
import { kanbanApi } from "../../api/kanban";

const response = (body: unknown, status = 200) => new Response(
  status === 204 ? null : JSON.stringify(body),
  { status, headers: { "Content-Type": "application/json" } },
);

describe("authenticated API client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setAccessToken(null);
  });

  it("unwraps success envelopes and sends the access token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ status: "success", data: { id: "1" } }));
    vi.stubGlobal("fetch", fetchMock);
    setAccessToken("access-token");
    await expect(apiRequest<{ id: string }>("/test")).resolves.toEqual({ id: "1" });
    expect(new Headers(fetchMock.mock.calls[0][1].headers).get("Authorization")).toBe("Bearer access-token");
  });

  it("normalizes server errors with request metadata", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ status: "error", code: "CONFLICT", message: "Stale update", requestId: "req-1" }, 409)));
    await expect(apiRequest("/test", {}, false)).rejects.toMatchObject({ status: 409, code: "CONFLICT", requestId: "req-1" } satisfies Partial<ApiError>);
  });

  it("maps persisted board documents into the nested UI model", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ status: "success", data: {
      id: "board-1", title: "Platform", version: 2, currentUserAccess: "editor",
      columns: [{ id: "column-1", title: "Todo", position: 0, version: 1 }],
      tasks: [{ id: "task-1", columnId: "column-1", title: "Ship", description: "", position: 0, version: 3, subtasks: [] }],
    } })));
    await expect(kanbanApi.getBoard("board-1")).resolves.toMatchObject({ name: "Platform", access: "editor", columns: [{ name: "Todo", tasks: [{ title: "Ship", status: "Todo" }] }] });
  });
});
