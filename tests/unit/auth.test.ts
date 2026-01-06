import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUser, getUserWithProfile, ensureUserExists } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/database";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
  createServiceClient: vi.fn(),
}));
vi.mock("@/lib/database", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("auth", () => {
  const mockUser = {
    id: "test-user-id",
    email: "test@example.com",
    user_metadata: {
      name: "Test User",
      avatar_url: "https://example.com/avatar.jpg",
    },
  };

  const mockProfile = {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    image: "https://example.com/avatar.jpg",
    role: "user",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUser", () => {
    it("should return user when authenticated", async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      } as any);

      const result = await getUser();

      expect(result).toEqual(mockUser);
      expect(createClient).toHaveBeenCalled();
    });

    it("should return null when not authenticated", async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      } as any);

      const result = await getUser();

      expect(result).toBeNull();
    });
  });

  describe("getUserWithProfile", () => {
    it("should return null when user is not authenticated", async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      } as any);

      const result = await getUserWithProfile();

      expect(result).toBeNull();
    });

    it("should return user with existing profile", async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      } as any);

      vi.mocked(db.user.findUnique).mockResolvedValue(mockProfile as any);

      const result = await getUserWithProfile();

      expect(result).toEqual({ ...mockUser, profile: mockProfile });
      expect(db.user.findUnique).toHaveBeenCalled();
      expect(db.user.create).not.toHaveBeenCalled();
    });

    it("should create profile if not exists", async () => {
      vi.mocked(createClient).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      } as any);

      vi.mocked(db.user.findUnique).mockResolvedValue(null);
      vi.mocked(db.user.create).mockResolvedValue(mockProfile as any);

      const result = await getUserWithProfile();

      expect(result).toEqual({ ...mockUser, profile: mockProfile });
      expect(db.user.create).toHaveBeenCalled();
    });
  });

  describe("ensureUserExists", () => {
    it("should return existing user if found", async () => {
      vi.mocked(createClient).mockResolvedValue({} as any);
      vi.mocked(db.user.findUnique).mockResolvedValue(mockProfile as any);

      const result = await ensureUserExists("test-user-id", "test@example.com");

      expect(result).toEqual(mockProfile);
      expect(db.user.findUnique).toHaveBeenCalled();
      expect(db.user.create).not.toHaveBeenCalled();
    });

    it("should create user if not exists", async () => {
      vi.mocked(createClient).mockResolvedValue({} as any);
      vi.mocked(db.user.findUnique).mockResolvedValue(null);
      vi.mocked(db.user.create).mockResolvedValue(mockProfile as any);

      const result = await ensureUserExists("test-user-id", "test@example.com");

      expect(result).toEqual(mockProfile);
      expect(db.user.create).toHaveBeenCalled();
    });
  });
});
