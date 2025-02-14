import { parse } from '@babel/parser';
import * as t from '@babel/types';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { FunctionAnalysis, ClassAnalysis, ILanguageParser } from '../types';
import { logger } from '../../utils/logger';

// Create a require function that works in ESM
const require = createRequire(import.meta.url);
// Import traverse using the CommonJS-compatible require
const traverse = require('@babel/traverse').default;

export class BabelParser implements ILanguageParser {
  canHandle(filePath: string): boolean {
    const canHandle = filePath.endsWith('.js') || filePath.endsWith('.jsx');
    logger.info(`🔍 BabelParser.canHandle check for ${filePath}: ${canHandle}`);
    return canHandle;
  }

  async parseFile(filePath: string): Promise<{
    functions: FunctionAnalysis[];
    classes: ClassAnalysis[];
  }> {
    logger.info('🏁 Starting Babel-based JavaScript analysis...');
    logger.info(`📂 Analyzing file: ${filePath}`);

    try {
      // Read the source file
      logger.info('📖 Reading file contents...');
      const code = fs.readFileSync(filePath, 'utf-8');
      logger.info(`📄 File content length: ${code.length} characters`);
      logger.info(`📄 First 500 characters:\n${code.substring(0, 500)}...`);
      
      // Parse the code using @babel/parser with enhanced configuration
      logger.info('🔄 Parsing code with Babel...');
      const ast = parse(code, {
        sourceType: 'unambiguous', // Automatically detect module vs. script
        plugins: [
          'jsx',
          'typescript',
          'classProperties',
          'classPrivateProperties',
          'classPrivateMethods',
          'decorators-legacy'
        ],
        errorRecovery: true,
      });
      logger.info('✅ AST generated successfully');
      logger.info('AST structure:', JSON.stringify(ast.program.body[0], null, 2));

      const functions: FunctionAnalysis[] = [];
      const classes: ClassAnalysis[] = [];

      logger.info('🔄 Starting AST traversal...');
      // Traverse the AST to extract functions and classes
      traverse(ast, {
        FunctionDeclaration(path) {
          logger.info(`📋 Found function declaration: ${path.node.id?.name || 'anonymous'}`);
          const node = path.node;
          if (!node.id) {
            logger.info('⏭️ Skipping anonymous function');
            return;
          }

          const loc = node.loc;
          if (!loc) {
            logger.info('⏭️ Skipping function without location info');
            return;
          }

          logger.info('📝 Processing function parameters...');
          const parameters = node.params.map(param => {
            const paramName = t.isIdentifier(param) ? param.name : 'unknown';
            logger.info(`   Parameter: ${paramName}`);
            return {
              name: paramName,
              type: 'any'
            };
          });

          const functionAnalysis = {
            name: node.id.name,
            type: 'function',
            parameters,
            returnType: 'any',
            location: {
              file: filePath,
              startLine: loc.start.line,
              endLine: loc.end.line
            },
            documentation: extractDocumentation(path),
            codeSnippet: code.slice(loc.start.index, loc.end.index)
          };
          logger.info(`✅ Added function: ${functionAnalysis.name}`);
          functions.push(functionAnalysis);
        },

        ArrowFunctionExpression(path) {
          const node = path.node;
          const parent = path.parent;
          
          logger.info('📋 Found arrow function expression');
          // Only process arrow functions assigned to variables
          if (t.isVariableDeclarator(parent) && t.isIdentifier(parent.id)) {
            logger.info(`   Name: ${parent.id.name}`);
            const loc = node.loc;
            if (!loc) {
              logger.info('⏭️ Skipping arrow function without location info');
              return;
            }

            logger.info('📝 Processing arrow function parameters...');
            const parameters = node.params.map(param => {
              const paramName = t.isIdentifier(param) ? param.name : 'unknown';
              logger.info(`   Parameter: ${paramName}`);
              return {
                name: paramName,
                type: 'any'
              };
            });

            const functionAnalysis = {
              name: parent.id.name,
              type: 'arrow-function',
              parameters,
              returnType: 'any',
              location: {
                file: filePath,
                startLine: loc.start.line,
                endLine: loc.end.line
              },
              documentation: extractDocumentation(path),
              codeSnippet: code.slice(loc.start.index, loc.end.index)
            };
            logger.info(`✅ Added arrow function: ${functionAnalysis.name}`);
            functions.push(functionAnalysis);
          } else {
            logger.info('⏭️ Skipping non-variable-assigned arrow function');
          }
        },

        ClassDeclaration(path) {
          logger.info('📋 Found class declaration');
          const node = path.node;
          if (!node.id) {
            logger.info('⏭️ Skipping anonymous class');
            return;
          }

          const loc = node.loc;
          if (!loc) {
            logger.info('⏭️ Skipping class without location info');
            return;
          }

          logger.info(`   Class name: ${node.id.name}`);
          logger.info('📝 Processing class methods...');
          // Extract class methods
          const methods = node.body.body
            .filter(member => t.isClassMethod(member))
            .map(member => {
              const method = member as t.ClassMethod;
              const methodLoc = method.loc;
              if (!methodLoc) return null;

              const methodName = t.isIdentifier(method.key) ? method.key.name : 'unknown';
              logger.info(`   Method: ${methodName}`);
              return {
                name: methodName,
                type: method.kind === 'constructor' ? 'constructor' : 'method',
                parameters: method.params.map(param => {
                  const paramName = t.isIdentifier(param) ? param.name : 'unknown';
                  logger.info(`      Parameter: ${paramName}`);
                  return {
                    name: paramName,
                    type: 'any'
                  };
                }),
                returnType: 'any',
                location: {
                  file: filePath,
                  startLine: methodLoc.start.line,
                  endLine: methodLoc.end.line
                },
                documentation: extractDocumentation(path),
                codeSnippet: code.slice(methodLoc.start.index, methodLoc.end.index)
              };
            })
            .filter(method => method !== null) as any[];

          logger.info('📝 Processing class properties...');
          // Extract class properties
          const properties = node.body.body
            .filter(member => t.isClassProperty(member))
            .map(member => {
              const prop = member as t.ClassProperty;
              const propName = t.isIdentifier(prop.key) ? prop.key.name : 'unknown';
              logger.info(`   Property: ${propName}`);
              return {
                name: propName,
                type: prop.typeAnnotation 
                  ? (prop.typeAnnotation as any).typeAnnotation.type.replace('TSType', '') 
                  : 'any',
                documentation: extractDocumentation({ node: prop })
              };
            });

          const classAnalysis = {
            name: node.id.name,
            type: 'class',
            methods,
            properties,
            location: {
              file: filePath,
              startLine: loc.start.line,
              endLine: loc.end.line
            },
            documentation: extractDocumentation(path),
            codeSnippet: code.slice(loc.start.index, loc.end.index)
          };
          logger.info(`✅ Added class: ${classAnalysis.name}`);
          classes.push(classAnalysis);
        }
      });

      logger.info(`✅ Successfully analyzed JavaScript file: ${path.basename(filePath)}`);
      logger.info(`📊 Found ${functions.length} functions and ${classes.length} classes`);

      return { functions, classes };
    } catch (error) {
      logger.error('❌ Error analyzing JavaScript file:', error);
      if (error instanceof Error) {
        logger.error('Stack trace:', error.stack);
        logger.error('Error name:', error.name);
        logger.error('Error message:', error.message);
      }
      throw error;
    }
  }
}

function extractDocumentation(path: any): string {
  const comments = path.node.leadingComments;
  if (!comments || comments.length === 0) {
    logger.info('   No documentation found');
    return '';
  }

  // Get the closest comment block
  const docBlock = comments[comments.length - 1];
  if (docBlock.type !== 'CommentBlock') {
    logger.info('   Documentation is not a block comment');
    return '';
  }

  logger.info('   Found documentation block');
  return docBlock.value.trim();
} 