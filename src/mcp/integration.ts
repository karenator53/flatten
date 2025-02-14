import { analyzeCode } from '../codeAnalyzer';
import { generateDocumentation } from '../docGenerator';
import { logger } from '../utils/logger';
import { sendQuery } from './openaiClient';

/**
 * Aggregates context from internal modules and sends it to an LLM via OpenAI.
 * @param payload - Input payload from the MCP command.
 * @returns Response from OpenAI as a standardized MCP output.
 */
export async function assist(payload: any): Promise<any> {
  logger.info("Aggregating context for 'assist' command");

  // Aggregate data from internal modules.
  let analysisResult;
  let documentationResult;
  
  // Use existing analysis if present, otherwise attempt to analyze the code.
  try {
    if (payload && (payload.functions || payload.classes)) {
      analysisResult = payload; // Payload already has analysis data.
      logger.info("Using existing analysis data from payload.");
    } else if (payload && payload.code) {
      analysisResult = await analyzeCode(payload);
    } else {
      logger.info("Payload lacks expected analysis data; defaulting to empty analysis result.");
      analysisResult = { functions: [], classes: [] };
    }
  } catch (err) {
    logger.error("Error in analyzeCode:", err);
    analysisResult = { error: "analysis failed" };
  }
  
  try {
    documentationResult = await generateDocumentation(payload);
  } catch (err) {
    logger.error("Error in generateDocumentation:", err);
    documentationResult = { error: "documentation generation failed" };
  }

  // Build a unified context object.
  const context = {
    analysis: analysisResult,
    documentation: documentationResult,
    // Extend with additional context as needed (e.g., project metadata)
  };

  // Prepare a query for the LLM using our OpenAI integration.
  try {
    const langChainResponse = await sendQuery({
      prompt: "Convert the following technical analysis and generated documentation into a human-friendly summary. Please explain in clear, plain language what the project does, detail the purpose of each primary module, and highlight key insights relevant to developers.",
      context: context,
    });
    return { assistantResponse: langChainResponse };
  } catch (error) {
    logger.error("Error during OpenAI integration", error);
    throw new Error("OpenAI API call failed");
  }
} 