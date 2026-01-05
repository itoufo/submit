import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/ai/generate/route";
import { getUser, ensureUserExists } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/database";
import { getOpenAI } from "@/lib/openai";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  getUser: vi.fn(),
  ensureUserExists: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    schema: vi.fn(() => ({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    })),
  })),
}));
vi.mock("@/lib/database", () => ({
  db: {
    aiCandidate: {
      create: vi.fn(),
    },
  },
}));
vi.mock("@/lib/openai", () => ({
  getOpenAI: vi.fn(),
}));

describe("API /api/ai/generate", () => {
  const mockUser = {
    id: "test-user-id",
    email: "test@example.com",
  };

  const mockMemos = [
    {
      id: "memo-1",
      userId: "test-user-id",
      content: "思考メモ１：AIについての考察",
      type: "text",
      tags: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "memo-2",
      userId: "test-user-id",
      content: "思考メモ２：プログラミングの楽しさ",
      type: "text",
      tags: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const mockCandidate = {
    id: "candidate-1",
    userId: "test-user-id",
    content: "Generated tweet content",
    format: "tweet",
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockOpenAI = {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: "Generated tweet content",
              },
            },
          ],
        }),
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOpenAI).mockReturnValue(mockOpenAI as any);

    // Mock Supabase to return memos
    vi.mocked(createClient).mockResolvedValue({
      schema: vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          in: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            data: mockMemos,
            error: null,
          }),
        })),
      })),
    } as any);
  });

  const createRequest = (body: object): NextRequest => {
    return {
      json: vi.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
  };

  it("should return 401 when user is not authenticated", async () => {
    vi.mocked(getUser).mockResolvedValue(null);

    const request = createRequest({ memoIds: ["memo-1"] });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 400 when memoIds is empty", async () => {
    vi.mocked(getUser).mockResolvedValue(mockUser as any);
    vi.mocked(ensureUserExists).mockResolvedValue(mockUser as any);

    const request = createRequest({ memoIds: [] });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("No memos selected");
  });

  it("should return 400 when memoIds is not provided", async () => {
    vi.mocked(getUser).mockResolvedValue(mockUser as any);
    vi.mocked(ensureUserExists).mockResolvedValue(mockUser as any);

    const request = createRequest({});
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("No memos selected");
  });

  it("should return 400 when no valid memos found", async () => {
    vi.mocked(getUser).mockResolvedValue(mockUser as any);
    vi.mocked(ensureUserExists).mockResolvedValue(mockUser as any);

    vi.mocked(createClient).mockResolvedValue({
      schema: vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({ data: [], error: null }),
        })),
      })),
    } as any);

    const request = createRequest({ memoIds: ["non-existent"] });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("No valid memos found");
  });

  it("should generate content with tweet format by default", async () => {
    vi.mocked(getUser).mockResolvedValue(mockUser as any);
    vi.mocked(ensureUserExists).mockResolvedValue(mockUser as any);
    vi.mocked(db.aiCandidate.create).mockResolvedValue(mockCandidate as any);

    const request = createRequest({ memoIds: ["memo-1", "memo-2"] });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.content).toBe("Generated tweet content");
    expect(data.format).toBe("tweet");
    expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
    expect(db.aiCandidate.create).toHaveBeenCalled();
  });

  it("should generate content with blog format", async () => {
    vi.mocked(getUser).mockResolvedValue(mockUser as any);
    vi.mocked(ensureUserExists).mockResolvedValue(mockUser as any);
    vi.mocked(db.aiCandidate.create).mockResolvedValue({
      ...mockCandidate,
      format: "blog",
    } as any);

    const request = createRequest({ memoIds: ["memo-1"], format: "blog" });
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(db.aiCandidate.create).toHaveBeenCalled();
  });

  it("should generate content with note format", async () => {
    vi.mocked(getUser).mockResolvedValue(mockUser as any);
    vi.mocked(ensureUserExists).mockResolvedValue(mockUser as any);
    vi.mocked(db.aiCandidate.create).mockResolvedValue({
      ...mockCandidate,
      format: "note",
    } as any);

    const request = createRequest({ memoIds: ["memo-1"], format: "note" });
    await POST(request);

    expect(db.aiCandidate.create).toHaveBeenCalled();
  });

  it("should return 500 on OpenAI error", async () => {
    vi.mocked(getUser).mockResolvedValue(mockUser as any);
    vi.mocked(ensureUserExists).mockResolvedValue(mockUser as any);
    mockOpenAI.chat.completions.create.mockRejectedValue(new Error("OpenAI Error"));

    const request = createRequest({ memoIds: ["memo-1"] });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });
});
