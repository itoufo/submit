import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MemosPage from "@/app/(app)/memos/page";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.confirm
global.confirm = vi.fn(() => true);

describe("MemosPage", () => {
  const mockMemos = [
    {
      id: "memo-1",
      content: "テストメモ1",
      tags: "tag1,tag2",
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "memo-2",
      content: "テストメモ2",
      tags: null,
      createdAt: "2024-01-02T00:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMemos),
    });
  });

  it("should render page title and description", async () => {
    render(<MemosPage />);

    expect(screen.getByText("観測ログ")).toBeInTheDocument();
    expect(
      screen.getByText("違和感や気づきを1行メモするだけ。思考の断片を記録しよう。")
    ).toBeInTheDocument();
  });

  it("should show loading state initially", () => {
    render(<MemosPage />);

    expect(screen.getByText("読み込み中...")).toBeInTheDocument();
  });

  it("should fetch and display memos", async () => {
    render(<MemosPage />);

    await waitFor(() => {
      expect(screen.getByText("テストメモ1")).toBeInTheDocument();
      expect(screen.getByText("テストメモ2")).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/memos");
  });

  it("should display tags as badges", async () => {
    render(<MemosPage />);

    await waitFor(() => {
      expect(screen.getByText("tag1")).toBeInTheDocument();
      expect(screen.getByText("tag2")).toBeInTheDocument();
    });
  });

  it("should show empty state when no memos", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    render(<MemosPage />);

    await waitFor(() => {
      expect(screen.getByText("まだ観測ログがありません")).toBeInTheDocument();
    });
  });

  it("should filter memos by search query", async () => {
    const user = userEvent.setup();
    render(<MemosPage />);

    await waitFor(() => {
      expect(screen.getByText("テストメモ1")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("メモを検索...");
    await user.type(searchInput, "メモ1");

    expect(screen.getByText("テストメモ1")).toBeInTheDocument();
    expect(screen.queryByText("テストメモ2")).not.toBeInTheDocument();
  });

  it("should filter memos by tag", async () => {
    const user = userEvent.setup();
    render(<MemosPage />);

    await waitFor(() => {
      expect(screen.getByText("テストメモ1")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("メモを検索...");
    await user.type(searchInput, "tag1");

    expect(screen.getByText("テストメモ1")).toBeInTheDocument();
    expect(screen.queryByText("テストメモ2")).not.toBeInTheDocument();
  });

  it("should show no results message when search has no matches", async () => {
    const user = userEvent.setup();
    render(<MemosPage />);

    await waitFor(() => {
      expect(screen.getByText("テストメモ1")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("メモを検索...");
    await user.type(searchInput, "存在しないメモ");

    expect(screen.getByText("検索結果がありません")).toBeInTheDocument();
  });

  it("should create new memo on form submit", async () => {
    const user = userEvent.setup();
    const newMemo = {
      id: "memo-3",
      content: "新しいメモ",
      tags: "新タグ",
      createdAt: "2024-01-03T00:00:00Z",
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMemos),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(newMemo),
      });

    render(<MemosPage />);

    await waitFor(() => {
      expect(screen.getByText("テストメモ1")).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(
      "ふと思ったこと、違和感、気づき... 何でもメモしよう"
    );
    const tagInput = screen.getByPlaceholderText("仕事, アイデア, 疑問");
    const submitButton = screen.getByRole("button", { name: "記録する" });

    await user.type(textarea, "新しいメモ");
    await user.type(tagInput, "新タグ");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/memos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "新しいメモ",
          tags: "新タグ",
        }),
      });
    });
  });

  it("should disable submit button when textarea is empty", async () => {
    render(<MemosPage />);

    await waitFor(() => {
      expect(screen.getByText("テストメモ1")).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: "記録する" });
    expect(submitButton).toBeDisabled();
  });

  it("should enable submit button when textarea has content", async () => {
    const user = userEvent.setup();
    render(<MemosPage />);

    await waitFor(() => {
      expect(screen.getByText("テストメモ1")).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(
      "ふと思ったこと、違和感、気づき... 何でもメモしよう"
    );
    await user.type(textarea, "テスト");

    const submitButton = screen.getByRole("button", { name: "記録する" });
    expect(submitButton).not.toBeDisabled();
  });

  it("should delete memo when confirmed", async () => {
    const user = userEvent.setup();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMemos),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

    render(<MemosPage />);

    await waitFor(() => {
      expect(screen.getByText("テストメモ1")).toBeInTheDocument();
    });

    // Find and click delete button (it's hidden by default, visible on hover)
    const deleteButtons = screen.getAllByRole("button");
    const deleteButton = deleteButtons.find((btn) =>
      btn.querySelector("svg.text-destructive")
    );

    if (deleteButton) {
      await user.click(deleteButton);

      expect(global.confirm).toHaveBeenCalledWith("このメモを削除しますか？");
      expect(mockFetch).toHaveBeenCalledWith("/api/memos/memo-1", {
        method: "DELETE",
      });
    }
  });

  it("should not delete memo when cancelled", async () => {
    const user = userEvent.setup();
    (global.confirm as jest.Mock).mockReturnValue(false);

    render(<MemosPage />);

    await waitFor(() => {
      expect(screen.getByText("テストメモ1")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole("button");
    const deleteButton = deleteButtons.find((btn) =>
      btn.querySelector("svg.text-destructive")
    );

    if (deleteButton) {
      await user.click(deleteButton);

      // Should only have the initial GET call, no DELETE call
      expect(mockFetch).toHaveBeenCalledTimes(1);
    }
  });

  it("should clear form after successful submit", async () => {
    const user = userEvent.setup();
    const newMemo = {
      id: "memo-3",
      content: "新しいメモ",
      tags: "新タグ",
      createdAt: "2024-01-03T00:00:00Z",
    };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMemos),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(newMemo),
      });

    render(<MemosPage />);

    await waitFor(() => {
      expect(screen.getByText("テストメモ1")).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(
      "ふと思ったこと、違和感、気づき... 何でもメモしよう"
    ) as HTMLTextAreaElement;
    const tagInput = screen.getByPlaceholderText(
      "仕事, アイデア, 疑問"
    ) as HTMLInputElement;
    const submitButton = screen.getByRole("button", { name: "記録する" });

    await user.type(textarea, "新しいメモ");
    await user.type(tagInput, "新タグ");
    await user.click(submitButton);

    await waitFor(() => {
      expect(textarea.value).toBe("");
      expect(tagInput.value).toBe("");
    });
  });
});
