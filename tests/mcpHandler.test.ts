import { handleMCPRequest } from "../src/mcpHandler";

// Mock the dependent modules
jest.mock("../src/codeAnalyzer", () => ({
  analyzeCode: jest.fn(async (payload) => ({ functions: [], classes: [] })),
}));

jest.mock("../src/codeAnalyzer/projectAnalyzer", () => ({
  analyzeProject: jest.fn(async (directory) => ({ project: "dummy project analysis" })),
}));

jest.mock("../src/docGenerator", () => ({
  generateDocumentation: jest.fn(async (payload) => ({ docs: "dummy documentation" })),
}));

describe("MCP Handler", () => {
  test("analyzeCode valid payload", async () => {
    const request = {
      command: "analyzeCode",
      payload: { command: "analyzeCode", code: "const x = 1;", filePath: "dummy.ts" }
    };
    const response = await handleMCPRequest(request);
    expect(response.success).toBe(true);
    expect(response.data).toEqual({ functions: [], classes: [] });
  });

  test("analyzeCode invalid payload missing code should throw validation error", async () => {
    const request = {
      command: "analyzeCode",
      payload: { command: "analyzeCode", filePath: "dummy.ts" }
    };
    await expect(handleMCPRequest(request)).rejects.toThrow(/Payload validation error/);
  });

  test("analyzeProject valid payload", async () => {
    const request = {
      command: "analyzeProject",
      payload: { command: "analyzeProject", directory: "src" }
    };
    const response = await handleMCPRequest(request);
    expect(response.success).toBe(true);
    expect(response.data).toEqual({ project: "dummy project analysis" });
  });

  test("analyzeProject invalid payload missing directory should throw validation error", async () => {
    const request = {
      command: "analyzeProject",
      payload: { command: "analyzeProject" }
    };
    await expect(handleMCPRequest(request)).rejects.toThrow(/Payload validation error/);
  });

  test("generateDocs valid payload", async () => {
    const request = {
      command: "generateDocs",
      payload: { command: "generateDocs" }
    };
    const response = await handleMCPRequest(request);
    expect(response.success).toBe(true);
    expect(response.data).toEqual({ docs: "dummy documentation" });
  });

  test("unknown command should throw an error", async () => {
    const request = {
      command: "unknownCommand",
      payload: {}
    };
    await expect(handleMCPRequest(request)).rejects.toThrow(/Unknown command/);
  });
}); 