import { analyzeCode } from "../src/codeAnalyzer";

describe("Code Analyzer", () => {
  test("analyzes a simple function", async () => {
    const code = "function foo(a, b) {\n  return a + b;\n}\n";
    const result = await analyzeCode({ code, filePath: "dummy.ts" });
    
    // Validate the analysis result structure
    expect(result).toHaveProperty("functions");
    expect(Array.isArray(result.functions)).toBe(true);
    expect(result.functions.length).toBe(1);
    
    const fn = result.functions[0];
    expect(fn.name).toBe("foo");
    expect(fn.parameters).toEqual(["a", "b"]);
    expect(typeof fn.startLine).toBe("number");
    expect(typeof fn.endLine).toBe("number");
    expect(fn.filePath).toBe("dummy.ts");
  });
}); 