import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PartnerPage from "@/app/(app)/partner/page";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock clipboard
const mockClipboard = {
  writeText: vi.fn(),
};
Object.assign(navigator, { clipboard: mockClipboard });

describe("PartnerPage", () => {
  const mockSupporters = [
    {
      id: "supporter-1",
      status: "active",
      inviteToken: null,
      createdAt: "2024-01-01T00:00:00Z",
      supporter: {
        id: "user-2",
        name: "パートナー太郎",
        email: "partner@example.com",
      },
    },
  ];

  const mockCheers = [
    {
      id: "cheer-1",
      message: "頑張ってね！",
      createdAt: "2024-01-01T00:00:00Z",
      supporter: {
        name: "応援者",
        email: "cheerer@example.com",
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/partner/supporters") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSupporters),
        });
      }
      if (url === "/api/partner/cheers") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCheers),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  it("should render page title and description", async () => {
    render(<PartnerPage />);

    expect(screen.getByText("パートナー連携")).toBeInTheDocument();
    expect(
      screen.getByText("大切な人にあなたの進捗を共有して、応援してもらおう")
    ).toBeInTheDocument();
  });

  it("should show loading state initially", () => {
    render(<PartnerPage />);

    expect(screen.getAllByText("読み込み中...")).toHaveLength(2);
  });

  it("should fetch and display supporters", async () => {
    render(<PartnerPage />);

    await waitFor(() => {
      expect(screen.getByText("パートナー太郎")).toBeInTheDocument();
      expect(screen.getByText("partner@example.com")).toBeInTheDocument();
    });
  });

  it("should fetch and display cheers", async () => {
    render(<PartnerPage />);

    await waitFor(() => {
      expect(screen.getByText("頑張ってね！")).toBeInTheDocument();
      expect(screen.getByText("応援者")).toBeInTheDocument();
    });
  });

  it("should show empty state when no supporters", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/partner/supporters") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      if (url === "/api/partner/cheers") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCheers),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<PartnerPage />);

    await waitFor(() => {
      expect(screen.getByText("まだパートナーがいません")).toBeInTheDocument();
    });
  });

  it("should show empty state when no cheers", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/partner/supporters") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSupporters),
        });
      }
      if (url === "/api/partner/cheers") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<PartnerPage />);

    await waitFor(() => {
      expect(
        screen.getByText("まだ応援メッセージがありません")
      ).toBeInTheDocument();
    });
  });

  it("should generate invite URL when button clicked", async () => {
    const user = userEvent.setup();
    const mockToken = "test-invite-token";

    mockFetch.mockImplementation((url: string, options?: RequestInit) => {
      if (url === "/api/partner/invite" && options?.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: mockToken }),
        });
      }
      if (url === "/api/partner/supporters") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSupporters),
        });
      }
      if (url === "/api/partner/cheers") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCheers),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<PartnerPage />);

    const inviteButton = await screen.findByRole("button", {
      name: "招待URLを発行",
    });
    await user.click(inviteButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/partner/invite", {
        method: "POST",
      });
    });
  });

  it("should display supporter count badge", async () => {
    render(<PartnerPage />);

    await waitFor(() => {
      // Should show badge with count 1
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });

  it("should show settings link", async () => {
    render(<PartnerPage />);

    const settingsLink = await screen.findByRole("link", { name: "設定を開く" });
    expect(settingsLink).toHaveAttribute("href", "/settings");
  });

  it("should filter out pending supporters", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/partner/supporters") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              ...mockSupporters,
              {
                id: "supporter-2",
                status: "pending",
                inviteToken: "token",
                createdAt: "2024-01-02T00:00:00Z",
                supporter: {
                  id: "user-3",
                  name: "Pending User",
                  email: "pending@example.com",
                },
              },
            ]),
        });
      }
      if (url === "/api/partner/cheers") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCheers),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<PartnerPage />);

    await waitFor(() => {
      expect(screen.getByText("パートナー太郎")).toBeInTheDocument();
      expect(screen.queryByText("Pending User")).not.toBeInTheDocument();
    });
  });
});
