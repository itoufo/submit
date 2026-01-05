import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/ai/suggest-project/route";
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
  createClient: vi.fn(),
}));
vi.mock("@/lib/database", () => ({
  db: {
    projectSuggestion: {
      create: vi.fn(),
    },
  },
}));
vi.mock("@/lib/openai", () => ({
  getOpenAI: vi.fn(),
}));

describe("API /api/ai/suggest-project", () => {
  const mockUser = {
    id: "test-user-id",
    email: "test@example.com",
  };

  const mockMemos = Array.from({ length: 5 }, (_, i) => ({
    id: `memo-${i + 1}`,
    userId: "test-user-id",
    content: `思考メモ ${i + 1}`,
    type: "text",
    tags: null,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - i * 86400000).toISOString(),
  }));

  const mockSuggestion = {
    id: "suggestion-1",
    userId: "test-user-id",
    title: "AI技術ブログ",
    description: "AIについての考察をまとめたブログプロジェクト",
    reasoning: "メモから一貫したAI関連の関心が見られます",
    memoIds: JSON.stringify(mockMemos.map((m) => m.id)),
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
                content: JSON.stringify({
                  title: "AI技術ブログ",
                  description: "AIについての考察をまとめたブログプロジェクト",
                  reasoning: "メモから一貫したAI関連の関心が見られます",
                }),
              },
            },
          ],
        }),
      },
    },
  };

  const createMockSupabase = (memos: any[]) => ({
    schema: vi.fn(() => ({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnValue({ data: memos, error: null }),
      })),
    })),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOpenAI).mockReturnValue(mockOpenAI as any);
    vi.mocked(createClient).mockResolvedValue(createMockSupabase(mockMemos) as any);
  });

  const createRequest = (): NextRequest => {
    return {} as unknown as NextRequest;
  };

  it("should return 401 when user is not authenticated", async () => {
    vi.mocked(getUser).mockResolvedValue(null);

    const request = createRequest();
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return 400 when user has less than 3 memos", async () => {
    vi.mocked(getUser).mockResolvedValue(mockUser as any);
    vi.mocked(ensureUserExists).mockResolvedValue(mockUser as any);
    vi.mocked(createClient).mockResolvedValue(createMockSupabase(mockMemos.slice(0, 2)) as any);

    const request = createRequest();
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("プロジェクト提案には3つ以上のメモが必要です");
  });

  it("should suggest project successfully with 3+ memos", async () => {
    vi.mocked(getUser).mockResolvedValue(mockUser as any);
    vi.mocked(ensureUserExists).mockResolvedValue(mockUser as any);
    vi.mocked(db.projectSuggestion.create).mockResolvedValue(mockSuggestion as any);

    const request = createRequest();
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe("AI技術ブログ");
    expect(data.description).toBe("AIについての考察をまとめたブログプロジェクト");
    expect(data.reasoning).toBe("メモから一貫したAI関連の関心が見られます");
  });

  it("should use JSON response format for OpenAI", async () => {
    vi.mocked(getUser).mockResolvedValue(mockUser as any);
    vi.mocked(ensureUserExists).mockResolvedValue(mockUser as any);
    vi.mocked(db.projectSuggestion.create).mockResolvedValue(mockSuggestion as any);

    const request = createRequest();
    await POST(request);

    expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        response_format: { type: "json_object" },
      })
    );
  });

  it("should return 500 when AI response is invalid", async () => {
    vi.mocked(getUser).mockResolvedValue(mockUser as any);
    vi.mocked(ensureUserExists).mockResolvedValue(mockUser as any);
    mockOpenAI.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              title: "Only title provided",
              // missing description and reasoning
            }),
          },
        },
      ],
    } as any);

    const request = createRequest();
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });

  it("should return 500 on OpenAI error", async () => {
    vi.mocked(getUser).mockResolvedValue(mockUser as any);
    vi.mocked(ensureUserExists).mockResolvedValue(mockUser as any);
    mockOpenAI.chat.completions.create.mockRejectedValue(new Error("OpenAI Error"));

    const request = createRequest();
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });
});
