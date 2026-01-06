import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/memos/route";
import { getUser, ensureUserExists } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/database";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  getUser: vi.fn(),
  ensureUserExists: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({})),
  createServiceClient: vi.fn(() => ({})),
}));
vi.mock("@/lib/database", () => ({
  db: {
    memo: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("API /api/memos", () => {
  const mockUser = {
    id: "test-user-id",
    email: "test@example.com",
  };

  const mockMemos = [
    {
      id: "memo-1",
      userId: "test-user-id",
      content: "Test memo 1",
      type: "text",
      tags: "tag1,tag2",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "memo-2",
      userId: "test-user-id",
      content: "Test memo 2",
      type: "text",
      tags: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/memos", () => {
    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(getUser).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return memos for authenticated user", async () => {
      vi.mocked(getUser).mockResolvedValue(mockUser as any);
      vi.mocked(db.memo.findMany).mockResolvedValue(mockMemos as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(db.memo.findMany).toHaveBeenCalled();
    });

    it("should return 500 on database error", async () => {
      vi.mocked(getUser).mockResolvedValue(mockUser as any);
      vi.mocked(db.memo.findMany).mockRejectedValue(new Error("DB Error"));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });

  describe("POST /api/memos", () => {
    const createRequest = (body: object): NextRequest => {
      return {
        json: vi.fn().mockResolvedValue(body),
      } as unknown as NextRequest;
    };

    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(getUser).mockResolvedValue(null);

      const request = createRequest({ content: "Test content" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 400 when content is empty", async () => {
      vi.mocked(getUser).mockResolvedValue(mockUser as any);
      vi.mocked(ensureUserExists).mockResolvedValue(mockUser as any);

      const request = createRequest({ content: "" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Content is required");
    });

    it("should return 400 when content is whitespace only", async () => {
      vi.mocked(getUser).mockResolvedValue(mockUser as any);
      vi.mocked(ensureUserExists).mockResolvedValue(mockUser as any);

      const request = createRequest({ content: "   " });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Content is required");
    });

    it("should create memo successfully", async () => {
      vi.mocked(getUser).mockResolvedValue(mockUser as any);
      vi.mocked(ensureUserExists).mockResolvedValue(mockUser as any);
      vi.mocked(db.memo.create).mockResolvedValue(mockMemos[0] as any);

      const request = createRequest({
        content: "Test memo 1",
        tags: "tag1,tag2",
        type: "text",
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.content).toBe("Test memo 1");
      expect(db.memo.create).toHaveBeenCalled();
    });

    it("should use default type when not provided", async () => {
      vi.mocked(getUser).mockResolvedValue(mockUser as any);
      vi.mocked(ensureUserExists).mockResolvedValue(mockUser as any);
      vi.mocked(db.memo.create).mockResolvedValue(mockMemos[1] as any);

      const request = createRequest({ content: "Test memo 2" });
      await POST(request);

      expect(db.memo.create).toHaveBeenCalled();
    });

    it("should return 500 on database error", async () => {
      vi.mocked(getUser).mockResolvedValue(mockUser as any);
      vi.mocked(ensureUserExists).mockResolvedValue(mockUser as any);
      vi.mocked(db.memo.create).mockRejectedValue(new Error("DB Error"));

      const request = createRequest({ content: "Test content" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });
});
