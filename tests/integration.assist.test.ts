import { assist } from '../src/mcp/integration';

describe('Integration Layer - assist command', () => {
  it('should return a valid assistant response for a valid payload', async () => {
    const payload = {
      code: `function test() { return 42; }`,
      filePath: 'dummyFile.ts'
    };
    const result = await assist(payload);
    expect(result).toHaveProperty('assistantResponse');
    expect(typeof result.assistantResponse).toBe('string');
    expect(result.assistantResponse).toContain('Dummy LangChain response');
  });
}); 