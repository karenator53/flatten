console.log("generateDocumentation module loaded!");

import { logger } from "../utils/logger";
import { compileTemplate } from './templateEngine';

/**
 * Generates documentation based on the payload.
 * For now, it returns dummy documentation.
 *
 * @param payload - Contains parameters needed for documentation generation.
 * @returns Object with generated documentation.
 */
export async function generateDocumentation(payload: any): Promise<{ docs: string }> {
    logger.info("Generating documentation...");
    return { docs: "dummy documentation" };
}

export function generateDoc(analysisData: any): string {
  // For simplicity, we assume that analysisData matches the expected template context.
  return compileTemplate(analysisData);
} 