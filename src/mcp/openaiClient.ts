import { OpenAI } from "openai";
import { logger } from "../utils/logger";
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Check for API key
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  logger.error("❌ OpenAI API key is missing! Please check your .env file");
  throw new Error("OpenAI API key is required");
}

logger.info("✅ OpenAI API key found");

// Initialize the OpenAI client with the API key from environment
const openai = new OpenAI({
  apiKey
});

export interface ComponentAnalysis {
  type: 'class' | 'function' | 'component';
  name: string;
  description: string;
  implementation: string;
  usage: string;
  bestPractices?: string[];
  parameters?: {
    name: string;
    type: string;
    description: string;
  }[];
  returns?: {
    type: string;
    description: string;
  };
  relationships?: {
    dependencies: {
      name: string;
      type: 'import' | 'function_call' | 'inheritance' | 'composition' | 'event_handler' | 'class' | 'component';
      description: string;
    }[];
    dependents?: {
      name: string;
      type: 'import' | 'function_call' | 'inheritance' | 'composition' | 'event_handler' | 'class' | 'component';
      description: string;
    }[];
    dataFlow?: {
      direction: 'in' | 'out' | 'bidirectional';
      component: string;
      description: string;
    }[];
  };
}

export interface SystemOverview {
  description: string;
  architecture: string;
  mainComponents: string[];
  dataFlow: string;
  technicalStack: string[];
}

export interface SecurityAnalysis {
  securityRisks: Array<{
    risk: string;
    severity: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
  bestPractices: string[];
  recommendations: string[];
}

export interface DependencyGraph {
  nodes: Array<{
    id: string;
    type: 'function' | 'class' | 'component' | 'module';
    description: string;
  }>;
  edges: Array<{
    from: string;
    to: string;
    type: string;
    description: string;
  }>;
}

export interface PerformanceAnalysis {
  complexityAnalysis: Array<{
    component: string;
    cyclomaticComplexity: number;
    recommendations: string[];
    hotspots: string[];
  }>;
  memoryUsage: Array<{
    component: string;
    concerns: string[];
    optimizations: string[];
  }>;
  asyncPatterns: Array<{
    component: string;
    pattern: string;
    risks: string[];
    improvements: string[];
  }>;
}

export interface TestabilityAnalysis {
  untested: string[];
  testRecommendations: Array<{
    component: string;
    testTypes: string[];
    testCases: string[];
    mocking: string[];
  }>;
  coverage: {
    current: string;
    recommendations: string[];
  };
}

export interface CodeQualityAnalysis {
  maintainability: Array<{
    component: string;
    score: number;
    issues: string[];
    improvements: string[];
  }>;
  duplication: Array<{
    pattern: string;
    locations: string[];
    refactoringStrategy: string;
  }>;
  naming: Array<{
    component: string;
    issues: string[];
    suggestions: string[];
  }>;
}

// Helper to validate response structure
function validateResponseStructure(response: any, responseFormat?: any): boolean {
  if (!response || typeof response !== 'object') {
    logger.error("❌ Response is not an object:", response);
    return false;
  }
  
  // If a specific response format is provided, just verify it's an object
  if (responseFormat) {
    return true;
  }
  
  // Check for either a direct components array or a nested analysis structure
  if (response.components && Array.isArray(response.components)) {
    // Validate each component
    for (const component of response.components) {
      if (!validateComponent(component)) {
        return false;
      }
    }
    return true;
  }
  
  // Check for nested analysis structure
  if (response.analysis && typeof response.analysis === 'object') {
    const { functions, classes, modules } = response.analysis;
    let hasValidContent = false;
    
    // Validate functions array if present
    if (functions) {
      if (!Array.isArray(functions)) {
        logger.error("❌ Functions is not an array:", functions);
        return false;
      }
      for (const func of functions) {
        if (!validateFunction(func)) {
          return false;
        }
      }
      if (functions.length > 0) hasValidContent = true;
    }
    
    // Validate classes array if present
    if (classes) {
      if (!Array.isArray(classes)) {
        logger.error("❌ Classes is not an array:", classes);
        return false;
      }
      for (const cls of classes) {
        if (!validateClass(cls)) {
          return false;
        }
      }
      if (classes.length > 0) hasValidContent = true;
    }
    
    // Validate modules array if present
    if (modules) {
      if (!Array.isArray(modules)) {
        logger.error("❌ Modules is not an array:", modules);
        return false;
      }
      for (const module of modules) {
        if (!validateModule(module)) {
          return false;
        }
      }
      if (modules.length > 0) hasValidContent = true;
    }
    
    // At least one array should be present and have content
    if (hasValidContent) {
      return true;
    }
    
    logger.error("❌ Analysis object has no valid content arrays");
    return false;
  }
  
  logger.error("❌ Response does not contain a valid structure. Expected either components array or analysis object with functions/classes/modules arrays:", response);
  return false;
}

// Update the system prompt in the sendQuery function
const systemPrompt = `You are a highly skilled documentation assistant that analyzes code and provides structured JSON output. Your responses must ALWAYS be valid JSON matching the specified schema exactly, with no extraneous text before or after. Use complete and runnable code snippets when available.

Expected Response Format:
{
  "analysis": {
    "functions": [...],  // Array of function analyses
    "classes": [...],    // Array of class analyses
    "modules": [...]     // Array of module analyses
  }
}

Key Guidelines for All Analyses:
1. Code Integrity: Never split code examples mid-block.
2. Complete Usage: Each usage example should be self-contained and runnable.
3. Contextual Code: Include actual code snippets from the context where relevant.
4. Clarity & Precision: Keep descriptions clear, concise, and actionable.
5. Type-Specific Analysis:
   - Functions: Identify called functions and those that call them.
   - Classes: Document inheritance, composition, and method interactions.
   - Modules: List all imports/exports and their usage patterns.
6. Relationship Mapping:
   - Detail function calls, class inheritance/composition, module dependencies, event handling, and data flow between components.`;

/**
 * Sends a query to the OpenAI API using the ChatCompletion endpoint.
 *
 * @param query An object containing a "prompt" and a "context" that will be fed to the LLM.
 * @returns The assistant's response as a ComponentAnalysis[].
 */
export async function sendQuery(query: { 
  prompt: string; 
  context: any;
  responseFormat?: any;  // Optional JSON schema for the response
}): Promise<any> {
  const { prompt, context, responseFormat } = query;

  logger.info("🚀 Starting OpenAI query...");

  // Prepare the context text (JSON-stringified).
  const contextText = (() => {
    // Deep clone the context to avoid modifying the original
    const optimizedContext = JSON.parse(JSON.stringify(context));
    
    // Helper to optimize code content
    const optimizeCode = (code: string) => {
      if (!code) return '';
      return code
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
        .replace(/\/\/.*/g, '') // Remove single-line comments
        .replace(/console\.(log|warn|error|info|debug)\([^)]*\);?/g, '') // Remove all console statements
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    };

    // Helper to extract essential info from a function/method body
    const extractEssentialCode = (body: string) => {
      const cleanBody = optimizeCode(body);
      // Keep function signature and structure, remove implementation details if too long
      if (cleanBody.length > 500) {
        const lines = cleanBody.split('\n');
        const firstLines = lines.slice(0, 3).join('\n'); // Keep first 3 lines
        const lastLines = lines.slice(-2).join('\n');    // Keep last 2 lines
        return `${firstLines}\n  // ... implementation ...\n${lastLines}`;
      }
      return cleanBody;
    };

    // Optimize functions
    if (optimizedContext.functions) {
      optimizedContext.functions = optimizedContext.functions.map((func: any) => ({
        name: func.name,
        parameters: func.parameters,
        returnType: func.returnType,
        body: extractEssentialCode(func.body || ''),
        documentation: func.documentation,
        location: func.location ? {
          file: path.basename(func.location.file),
          startLine: func.location.startLine,
          endLine: func.location.endLine
        } : undefined
      }));
    }

    // Optimize classes
    if (optimizedContext.classes) {
      optimizedContext.classes = optimizedContext.classes.map((cls: any) => ({
        name: cls.name,
        methods: cls.methods?.map((method: any) => ({
          name: method.name,
          parameters: method.parameters,
          returnType: method.returnType,
          body: extractEssentialCode(method.body || ''),
          documentation: method.documentation
        })),
        properties: cls.properties,
        documentation: cls.documentation,
        location: cls.location ? {
          file: path.basename(cls.location.file),
          startLine: cls.location.startLine,
          endLine: cls.location.endLine
        } : undefined
      }));
    }

    // Add optimization metadata
    optimizedContext._meta = {
      optimized: true,
      timestamp: new Date().toISOString(),
      note: 'Code bodies have been optimized for token efficiency while preserving essential structure'
    };

    return JSON.stringify(optimizedContext, null, 2);
  })();

  if (!contextText.trim()) {
    logger.error("❌ No code provided in payload.");
    throw new Error("No code provided in payload");
  }

  logger.info(`📦 Context size: ${contextText.length} characters`);
  logger.info(`📝 Prompt: ${prompt}`);

  // Compose the full user message.
  const fullUserContent = `${prompt}\n\nContext:\n${contextText}\n\n${systemPrompt}`;

  try {
    logger.info("📡 Making OpenAI API call...");
    const completion = await openai.chat.completions.create({
      model: "chatgpt-4o-latest",
      messages: [
        { 
          role: "system", 
          content: systemPrompt
        },
        { role: "user", content: fullUserContent }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
      seed: 123,
      max_tokens: 16000
    });

    const response = completion.choices[0].message?.content;
    if (!response) {
      logger.error("❌ No response content received from OpenAI");
      throw new Error("No response received from OpenAI");
    }

    logger.info("✅ Received response from OpenAI");
    logger.info("📝 Raw response:", response);

    try {
      // Remove any potential non-JSON text before the first {
      const jsonStart = response.indexOf('{');
      const jsonEnd = response.lastIndexOf('}') + 1;
      const jsonStr = response.slice(jsonStart, jsonEnd);

      logger.info("🔄 Attempting to parse response as JSON...");
      const parsedResponse = JSON.parse(jsonStr);
      logger.info("✅ Successfully parsed JSON. Structure:", JSON.stringify(parsedResponse, null, 2));
      
      logger.info("🔍 Validating response structure...");
      if (!validateResponseStructure(parsedResponse, responseFormat)) {
        throw new Error("Invalid response structure");
      }

      // If using responseFormat, return the whole response
      if (responseFormat) {
        return parsedResponse;
      }

      // Return either analysis or components array
      return parsedResponse.analysis || parsedResponse.components;
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error("❌ Parse error details:", error.message);
      } else {
        logger.error("❌ Unknown parse error:", error);
      }
      logger.error("❌ Failed response content:", response);
      throw new Error(`Failed to parse OpenAI response as JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } catch (error) {
    logger.error("❌ OpenAI API error details:", error);
    throw error;
  }
}

// Helper to chunk large codebases
function chunkCodebase(context: any, maxChunkSize: number = 32000): any[] {
  logger.info("🔄 Starting codebase chunking...");
  logger.info(`📊 Max chunk size: ${maxChunkSize} tokens (approx)`);
  
  const chunks: any[] = [];
  
  // Helper to estimate tokens (rough approximation: 1 token ≈ 4 chars)
  const estimateTokens = (str: string): number => Math.ceil(str.length / 4);
  
  // If context has functions array, chunk it
  if (context.functions && Array.isArray(context.functions)) {
    const functionChunks: any[][] = [];
    let currentChunk: any[] = [];
    let currentSize = 0;
    
    for (const func of context.functions) {
      const funcStr = JSON.stringify(func);
      const funcTokens = estimateTokens(funcStr);
      logger.info(`📏 Function "${func.name}" estimated tokens: ${funcTokens}`);
      
      // If a single function is too large, we need to handle it specially
      if (funcTokens > maxChunkSize) {
        logger.warn(`⚠️ Large function detected: "${func.name}" (${funcTokens} tokens)`);
        // Try to break it down by removing the body if it's too large
        const funcWithoutBody = { ...func, body: "/* Body too large, truncated */" };
        const reducedTokens = estimateTokens(JSON.stringify(funcWithoutBody));
        logger.info(`📉 Reduced to ${reducedTokens} tokens`);
        currentChunk.push(funcWithoutBody);
        continue;
      }
      
      if (currentSize + funcTokens > maxChunkSize && currentChunk.length > 0) {
        logger.info(`📦 Creating new chunk with ${currentChunk.length} functions (${currentSize} tokens)`);
        functionChunks.push([...currentChunk]);
        currentChunk = [];
        currentSize = 0;
      }
      currentChunk.push(func);
      currentSize += funcTokens;
    }
    if (currentChunk.length > 0) {
      logger.info(`📦 Adding final function chunk with ${currentChunk.length} functions (${currentSize} tokens)`);
      functionChunks.push(currentChunk);
    }
    
    chunks.push(...functionChunks.map(funcs => ({ ...context, functions: funcs })));
  }
  
  // Similarly chunk classes if present
  if (context.classes && Array.isArray(context.classes)) {
    const classChunks: any[][] = [];
    let currentChunk: any[] = [];
    let currentSize = 0;
    
    for (const cls of context.classes) {
      const clsStr = JSON.stringify(cls);
      const clsTokens = estimateTokens(clsStr);
      logger.info(`📏 Class "${cls.name}" estimated tokens: ${clsTokens}`);
      
      // Handle large classes
      if (clsTokens > maxChunkSize) {
        logger.warn(`⚠️ Large class detected: "${cls.name}" (${clsTokens} tokens)`);
        // Try to break it down by methods if possible
        const methodChunks: any[] = [];
        let currentMethods: any[] = [];
        let methodSize = 0;
        
        for (const method of cls.methods || []) {
          const methodTokens = estimateTokens(JSON.stringify(method));
          if (methodSize + methodTokens > maxChunkSize) {
            methodChunks.push([...currentMethods]);
            currentMethods = [];
            methodSize = 0;
          }
          currentMethods.push(method);
          methodSize += methodTokens;
        }
        if (currentMethods.length > 0) {
          methodChunks.push(currentMethods);
        }
        
        // Create separate chunks for each method group
        methodChunks.forEach((methods, idx) => {
          const partialClass = {
            ...cls,
            methods,
            note: `Part ${idx + 1}/${methodChunks.length} of large class`
          };
          currentChunk.push(partialClass);
        });
        continue;
      }
      
      if (currentSize + clsTokens > maxChunkSize && currentChunk.length > 0) {
        logger.info(`📦 Creating new chunk with ${currentChunk.length} classes (${currentSize} tokens)`);
        classChunks.push([...currentChunk]);
        currentChunk = [];
        currentSize = 0;
      }
      currentChunk.push(cls);
      currentSize += clsTokens;
    }
    if (currentChunk.length > 0) {
      logger.info(`📦 Adding final class chunk with ${currentChunk.length} classes (${currentSize} tokens)`);
      classChunks.push(currentChunk);
    }
    
    chunks.push(...classChunks.map(classes => ({ ...context, classes })));
  }
  
  logger.info(`✅ Chunking complete. Created ${chunks.length} chunks`);
  chunks.forEach((chunk, i) => {
    const size = estimateTokens(JSON.stringify(chunk));
    logger.info(`   Chunk ${i + 1}: ~${size} tokens`);
  });
  
  return chunks.length > 0 ? chunks : [context];
}

/**
 * Analyzes a large codebase by breaking it into chunks and making multiple API calls.
 */
export async function analyzeChunkedCodebase(context: any): Promise<{
  overview: SystemOverview;
  components: ComponentAnalysis[];
  dependencies: DependencyGraph;
}> {
  logger.info("🚀 Starting chunked codebase analysis...");
  
  // First get the overview since it needs the full context
  logger.info("📊 Getting system overview...");
  const overview = await sendQuery({ 
    prompt: "Analyze the entire codebase and deliver a concise yet comprehensive system overview. Focus on the overall architecture, primary components, data flow patterns, and the technical stack in use. Your analysis should provide high-level insights along with concrete details from the code.",
    context,
    responseFormat: {
      type: "object",
      properties: {
        description: { 
          type: "string",
          description: "Brief summary of the system's functionality and purpose"
        },
        architecture: { 
          type: "string",
          description: "Description of the architectural style and design patterns (e.g., microservices, MVC)"
        },
        mainComponents: { 
          type: "array", 
          items: { type: "string" },
          description: "List of key modules or components"
        },
        dataFlow: { 
          type: "string",
          description: "Explanation of how data moves between the components"
        },
        technicalStack: { 
          type: "array", 
          items: { type: "string" },
          description: "List of languages, frameworks, libraries, and tools used"
        }
      }
    }
  });

  // Chunk the codebase for detailed analysis
  const chunks = chunkCodebase(context);
  logger.info(`🔄 Split codebase into ${chunks.length} chunks for analysis`);

  // Analyze each chunk
  const componentAnalyses: ComponentAnalysis[][] = [];
  for (let i = 0; i < chunks.length; i++) {
    logger.info(`📝 Analyzing chunk ${i + 1}/${chunks.length}...`);
    const chunkAnalysis = await sendQuery({ 
      prompt: "Perform an in-depth, component-level analysis of the provided code. For each function, class, or module, include detailed explanations, actual code snippets, usage examples, and best practices. Highlight parameters, return types, and explicit relationships with other components.", 
      context: chunks[i] 
    });
    componentAnalyses.push(chunkAnalysis);
  }

  // Flatten component analyses
  const components = componentAnalyses.flat();

  // Get dependency graph (can use full context as it's relationship-focused)
  logger.info("🕸️ Generating dependency graph...");
  const dependencies = await sendQuery({ 
    prompt: "Generate a complete dependency graph of the codebase. Map every relationship between functions, classes, components, and modules. Include details on imports, function calls, inheritance, composition, event handling, and data flow interactions.", 
    context,
    responseFormat: {
      type: "object",
      properties: {
        nodes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { 
                type: "string",
                description: "UniqueIdentifier"
              },
              type: { 
                type: "string", 
                enum: ["function", "class", "component", "module"],
                description: "Type of the component"
              },
              description: { 
                type: "string",
                description: "Brief description of the component"
              }
            }
          }
        },
        edges: {
          type: "array",
          items: {
            type: "object",
            properties: {
              from: { 
                type: "string",
                description: "SourceComponentIdentifier"
              },
              to: { 
                type: "string",
                description: "TargetComponentIdentifier"
              },
              type: { 
                type: "string",
                description: "RelationshipType (e.g., function_call, inheritance)"
              },
              description: { 
                type: "string",
                description: "Explanation of how the two components interact"
              }
            }
          }
        }
      }
    }
  });

  return {
    overview,
    components,
    dependencies
  };
}

// Replace the existing analyzeCodebase function with analyzeChunkedCodebase
export const analyzeCodebase = analyzeChunkedCodebase;

// Helper to validate a component object
function validateComponent(component: any): boolean {
  if (!component || typeof component !== 'object') {
    logger.error("❌ Invalid component:", component);
    return false;
  }
  
  const requiredFields = ['type', 'name', 'description'];
  for (const field of requiredFields) {
    if (!component[field]) {
      logger.error(`❌ Component missing required field: ${field}`, component);
      return false;
    }
  }
  
  return true;
}

// Helper to validate a function object
function validateFunction(func: any): boolean {
  if (!func || typeof func !== 'object') {
    logger.error("❌ Invalid function:", func);
    return false;
  }
  
  const requiredFields = ['name', 'description', 'parameters', 'returnType'];
  for (const field of requiredFields) {
    if (!(field in func)) {
      logger.error(`❌ Function missing required field: ${field}`, func);
      return false;
    }
  }
  
  // Validate parameters array
  if (!Array.isArray(func.parameters)) {
    logger.error("❌ Function parameters is not an array:", func.parameters);
    return false;
  }
  
  return true;
}

// Helper to validate a class object
function validateClass(cls: any): boolean {
  if (!cls || typeof cls !== 'object') {
    logger.error("❌ Invalid class:", cls);
    return false;
  }
  
  const requiredFields = ['name', 'methods', 'properties'];
  for (const field of requiredFields) {
    if (!(field in cls)) {
      logger.error(`❌ Class missing required field: ${field}`, cls);
      return false;
    }
  }
  
  // Validate methods array
  if (!Array.isArray(cls.methods)) {
    logger.error("❌ Class methods is not an array:", cls.methods);
    return false;
  }
  
  // Validate properties array
  if (!Array.isArray(cls.properties)) {
    logger.error("❌ Class properties is not an array:", cls.properties);
    return false;
  }
  
  return true;
}

// Helper to validate a module object
function validateModule(module: any): boolean {
  if (!module || typeof module !== 'object') {
    logger.error("❌ Invalid module:", module);
    return false;
  }
  
  const requiredFields = ['name', 'description'];
  for (const field of requiredFields) {
    if (!module[field]) {
      logger.error(`❌ Module missing required field: ${field}`, module);
      return false;
    }
  }
  
  // Optional arrays should be arrays if present
  if (module.imports && !Array.isArray(module.imports)) {
    logger.error("❌ Module imports is not an array:", module.imports);
    return false;
  }
  
  if (module.exports && !Array.isArray(module.exports)) {
    logger.error("❌ Module exports is not an array:", module.exports);
    return false;
  }
  
  if (module.dependencies && !Array.isArray(module.dependencies)) {
    logger.error("❌ Module dependencies is not an array:", module.dependencies);
    return false;
  }
  
  return true;
} 