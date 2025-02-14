import { ILanguageParser } from '../types';
import { TypeScriptParser } from './tsParser';
import { BabelParser } from './babelParser';
import { YAMLParser } from './yamlParser';

export class ParserRegistry {
  private static parsers: ILanguageParser[] = [
    new TypeScriptParser(),
    new BabelParser(),  // Use Babel parser for JavaScript files
    new YAMLParser()
  ];

  static getParserForFile(filePath: string): ILanguageParser | undefined {
    return this.parsers.find(parser => parser.canHandle(filePath));
  }

  static registerParser(parser: ILanguageParser) {
    this.parsers.push(parser);
  }
} 