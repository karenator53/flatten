// Module to generate documentation from parsed data 
// src/docGenerator.ts

import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import { logger } from './utils/logger';

export async function generateDocumentation(payload: any): Promise<string> {
  // Payload may include analysis result and template choice
  logger.info('Generating documentation...');
  
  // Load the template (using default.hbs in the templates directory)
  const templatePath = path.join(__dirname, '..', 'templates', 'default.hbs');
  const templateContent = fs.readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(templateContent);
  
  // Render the documentation using the analysis data provided in payload
  const documentation = template(payload);
  return documentation;
}
