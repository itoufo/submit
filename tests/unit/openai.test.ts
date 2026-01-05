import { describe, it, expect, vi } from "vitest";

vi.mock("openai", () => ({
  default: class MockOpenAI {
    chat = {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: "test response" } }],
        }),
      },
    };
  },
}));

describe("openai", () => {
  it("should export getOpenAI function", async () => {
    const openaiModule = await import("@/lib/openai");
    expect(typeof openaiModule.getOpenAI).toBe("function");
  });

  it("should return an OpenAI instance with chat.completions.create", async () => {
    const { getOpenAI } = await import("@/lib/openai");
    const openai = getOpenAI();

    expect(openai).toBeDefined();
    expect(openai.chat).toBeDefined();
    expect(openai.chat.completions).toBeDefined();
    expect(typeof openai.chat.completions.create).toBe("function");
  });

  it("should be able to make API calls and return expected response", async () => {
    const { getOpenAI } = await import("@/lib/openai");
    const openai = getOpenAI();

    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Hello" }],
    });

    // Verify the mock returns the expected structure
    expect(result).toHaveProperty("choices");
    expect(result.choices).toBeInstanceOf(Array);
    expect(result.choices[0]).toHaveProperty("message");
    expect(result.choices[0].message).toHaveProperty("content");
  });
});
