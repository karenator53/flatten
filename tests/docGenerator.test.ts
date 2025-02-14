import { generateDocumentation } from "../src/docGenerator";

beforeEach(() => {
  jest.resetModules();
});

describe("Documentation Generation", () => {
  test("should generate dummy documentation", async () => {
    const payload = {}; // Dummy payload; current implementation doesn't depend on it.
    const result = await generateDocumentation(payload);
    expect(result).toHaveProperty("docs");
    expect(result.docs).toBe("dummy documentation");
  });
}); 