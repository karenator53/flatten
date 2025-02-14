// Entry point for MCP server integration 
// src/index.ts

import { createInterface } from 'readline';
import { v4 as uuidv4 } from 'uuid';
import { handleMCPRequest } from './mcpHandler';
import { logger } from './utils/logger';

// Set up a basic interface to read from stdio for MCP messages
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

logger.info('MCP Server starting...');

rl.on('line', async (line: string) => {
  if (!line.trim()) return;
  const requestId = uuidv4();
  logger.info(`[${requestId}] Received message: ${line}`);
  try {
    const request = JSON.parse(line);
    const response = await handleMCPRequest(request);
    process.stdout.write(JSON.stringify(response) + '\n');
    logger.info(`[${requestId}] Processed successfully`);
  } catch (error) {
    logger.error(`[${requestId}] Failed to process MCP message`, error);
    process.stdout.write(
      JSON.stringify({ error: 'Invalid request format' }) + '\n'
    );
  }
});
