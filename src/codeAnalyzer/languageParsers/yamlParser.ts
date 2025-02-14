import yaml from 'js-yaml';
import * as fs from 'fs';
import { ILanguageParser, FunctionAnalysis, ClassAnalysis } from '../types';

export class YAMLParser implements ILanguageParser {
  canHandle(filePath: string): boolean {
    return filePath.endsWith('.yml') || filePath.endsWith('.yaml');
  }

  async parseFile(filePath: string): Promise<{
    functions?: FunctionAnalysis[];
    classes?: ClassAnalysis[];
  }> {
    const content = fs.readFileSync(filePath, 'utf8');
    const document = yaml.load(content) as any;

    // YAML files don't contain functions or classes in the traditional sense
    // Return empty arrays to match the interface
    return {
      functions: [],
      classes: []
    };
  }
} 