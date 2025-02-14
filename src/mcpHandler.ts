// MCP protocol handler: registration of commands goes here 
// src/mcpHandler.ts

import { analyzeCode } from './codeAnalyzer';
import { analyzeProject } from './codeAnalyzer/projectAnalyzer';
import { generateDocumentation } from './docGenerator';
import { logger } from './utils/logger';
import Joi from "joi";

// Define schemas for incoming MCP commands using Joi
const analyzeCodeSchema = Joi.object({
  command: Joi.string().valid("analyzeCode").required(),
  code: Joi.string().required(),
  filePath: Joi.string().optional(),
});

const analyzeProjectSchema = Joi.object({
  command: Joi.string().valid("analyzeProject").required(),
  directory: Joi.string().required(),
});

const generateDocsSchema = Joi.object({
  command: Joi.string().valid("generateDocs").required(),
  // Extend this schema if additional properties are required for documentation generation.
});

// Helper function to validate payloads against a given schema
function validatePayload(payload: any, schema: Joi.Schema) {
  const { error } = schema.validate(payload);
  if (error) {
    throw new Error(`Payload validation error: ${error.message}`);
  }
}

export async function handleMCPRequest(request: any): Promise<any> {
  const { command, payload } = request;
  logger.info(`Received command: ${command}`);

  switch (command) {
    case 'analyzeCode':
      validatePayload(payload, analyzeCodeSchema);
      // Payload should include code or path to code
      try {
        const analysisResult = await analyzeCode(payload);
        return { success: true, data: analysisResult };
      } catch (error: unknown) {
        if (error instanceof Error) {
          return { success: false, error: error.message };
        } else {
          return { success: false, error: String(error) };
        }
      }
    case 'analyzeProject':
      validatePayload(payload, analyzeProjectSchema);
      try {
        // Expect payload to have a 'directory' property
        const directory: string = payload.directory;
        const projectAnalysis = await analyzeProject(directory);
        return { success: true, data: projectAnalysis };
      } catch (error: unknown) {
        if (error instanceof Error) {
          return { success: false, error: error.message };
        } else {
          return { success: false, error: String(error) };
        }
      }
    case 'generateDocs':
      validatePayload(payload, generateDocsSchema);
      try {
        const docResult = await generateDocumentation(payload);
        return { success: true, data: docResult };
      } catch (error: unknown) {
        if (error instanceof Error) {
          return { success: false, error: error.message };
        } else {
          return { success: false, error: String(error) };
        }
      }
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}
