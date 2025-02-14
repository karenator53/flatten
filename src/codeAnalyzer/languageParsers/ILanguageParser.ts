import { FunctionAnalysis, ClassAnalysis } from '../types';

export interface StructureAnalysis {
  type: string;
  name: string;
  value?: any;
  children?: StructureAnalysis[];
  documentation?: string;
  location: {
    file: string;
    startLine: number;
    endLine: number;
  };
}

export interface ILanguageParser {
  /**
   * Parse a file and return its analysis
   * @param filePath Path to the file to parse
   */
  parseFile(filePath: string): Promise<{
    functions?: FunctionAnalysis[];
    classes?: ClassAnalysis[];
    structure?: StructureAnalysis;
  }>;

  /**
   * Check if this parser can handle the given file
   * @param filePath Path to the file to check
   */
  canHandle(filePath: string): boolean;
}

// Language-specific parser implementations
export class TypeScriptParser implements ILanguageParser {
  canHandle(filePath: string): boolean {
    return filePath.endsWith('.ts') || filePath.endsWith('.tsx');
  }

  async parseFile(filePath: string) {
    const { parseTypeScript } = await import('./tsParser');
    return parseTypeScript(filePath);
  }
}

// Import YAML parser
import { YAMLParser } from './yamlParser'; 