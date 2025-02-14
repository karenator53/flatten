// src/codeAnalyzer/languageParsers/tsParser.ts

import { Project, SourceFile, Node, SyntaxKind, ts } from 'ts-morph';
import { FunctionAnalysis, ClassAnalysis, Parameter, Location, ILanguageParser } from '../types';
import { logger } from '../../utils/logger';

export class TypeScriptParser implements ILanguageParser {
  canHandle(filePath: string): boolean {
    return filePath.endsWith('.ts') || filePath.endsWith('.tsx');
  }

  async parseFile(filePath: string): Promise<{
    functions: FunctionAnalysis[];
    classes: ClassAnalysis[];
  }> {
    logger.info('🏁 Starting TypeScript analysis...');
    logger.info(`📂 Analyzing file: ${filePath}`);

    try {
      // Initialize ts-morph project
      const project = new Project({
        tsConfigFilePath: 'tsconfig.json',
      });

      // Add the source file to the project
      const sourceFile = project.addSourceFileAtPath(filePath);
      
      const result = {
        functions: getFunctions(sourceFile),
        classes: getClasses(sourceFile),
      };

      logger.info(`✅ Successfully analyzed TypeScript file: ${filePath}`);
      logger.info(`📊 Found ${result.functions.length} functions and ${result.classes.length} classes`);

      return result;
    } catch (error) {
      logger.error('❌ Error analyzing TypeScript file:', error);
      throw error;
    }
  }
}

function getFunctions(sourceFile: SourceFile): FunctionAnalysis[] {
  const functions: FunctionAnalysis[] = [];

  // Get all function declarations
  sourceFile.getFunctions().forEach(func => {
    const parameters = func.getParameters().map(param => ({
      name: param.getName(),
      type: param.getType().getText(),
    }));

    const returnType = func.getReturnType().getText();
    const body = func.getBody()?.getText() || '';
    const docs = func.getJsDocs().map(doc => doc.getText()).join('\n');
    
    const location = {
      file: sourceFile.getFilePath(),
      startLine: func.getStartLineNumber(),
      endLine: func.getEndLineNumber(),
    };

    functions.push({
      name: func.getName() || 'anonymous',
      parameters,
      returnType,
      body,
      documentation: docs,
      location,
    });
  });

  // Get all arrow functions
  sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction).forEach(arrow => {
    const parameters = arrow.getParameters().map(param => ({
      name: param.getName(),
      type: param.getType().getText(),
    }));

    const returnType = arrow.getReturnType().getText();
    const body = arrow.getBody().getText();
    const docs = arrow.getJsDocs().map(doc => doc.getText()).join('\n');
    
    const location = {
      file: sourceFile.getFilePath(),
      startLine: arrow.getStartLineNumber(),
      endLine: arrow.getEndLineNumber(),
    };

    // Only include named arrow functions
    const parent = arrow.getParent();
    if (Node.isVariableDeclaration(parent)) {
      functions.push({
        name: parent.getName(),
        parameters,
        returnType,
        body,
        documentation: docs,
        location,
      });
    }
  });

  return functions;
}

function getClasses(sourceFile: SourceFile): ClassAnalysis[] {
  const classes: ClassAnalysis[] = [];

  sourceFile.getClasses().forEach(cls => {
    const methods = cls.getMethods().map(method => ({
      name: method.getName(),
      parameters: method.getParameters().map(param => ({
        name: param.getName(),
        type: param.getType().getText(),
      })),
      returnType: method.getReturnType().getText(),
      body: method.getBody()?.getText() || '',
      documentation: method.getJsDocs().map(doc => doc.getText()).join('\n'),
    }));

    const properties = cls.getProperties().map(prop => ({
      name: prop.getName(),
      type: prop.getType().getText(),
      documentation: prop.getJsDocs().map(doc => doc.getText()).join('\n'),
    }));

    const docs = cls.getJsDocs().map(doc => doc.getText()).join('\n');
    
    const location = {
      file: sourceFile.getFilePath(),
      startLine: cls.getStartLineNumber(),
      endLine: cls.getEndLineNumber(),
    };

    const className = cls.getName();
    if (className) {
      classes.push({
        name: className,
        methods,
        properties,
        documentation: docs,
        location,
      });
    }
  });

  return classes;
} 