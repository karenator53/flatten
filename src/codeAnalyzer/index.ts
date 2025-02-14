import { logger } from '../utils/logger';
import { AnalysisResult } from "./types";
import { Project, SyntaxKind, Node, SourceFile } from 'ts-morph';
import { FunctionAnalysis, ClassAnalysis } from "./types";
import path from 'path';

/**
 * Analyzes the provided code using ts-morph to extract functions and classes.
 * Expects payload.code to contain a string of TypeScript code.
 *
 * @param payload - Object containing the code and optionally a filePath.
 * @returns AnalysisResult with arrays of functions and classes.
 */
export async function analyzeCode({ code, filePath }: { code: string; filePath: string }): Promise<AnalysisResult> {
    logger.info("\n🔬 Starting detailed code analysis...");
    logger.info(`📂 File: ${filePath}`);
    logger.info(`📊 Code length: ${code.length} characters`);
    logger.info(`📄 First 200 characters of code:\n${code.substring(0, 200)}...`);

    if (!code || !filePath) {
        logger.warn("⚠️ No code or filePath provided. Returning empty analysis result.");
        return { functions: [], classes: [] };
    }

    // Initialize a new ts-morph project
    logger.info("🚀 Initializing ts-morph project...");
    const project = new Project({
        useInMemoryFileSystem: true,
        skipFileDependencyResolution: true,
    });

    // Add the source file to the project
    logger.info("📝 Creating source file...");
    const sourceFile = project.createSourceFile(filePath, code);
    
    const result: AnalysisResult = {
        functions: [],
        classes: []
    };

    // Analyze functions
    logger.info("\n🔍 Analyzing functions...");
    const functions = sourceFile.getFunctions();
    logger.info(`📊 Found ${functions.length} functions`);
    
    functions.forEach((func, index) => {
        try {
            logger.info(`\n📋 Processing function ${index + 1}/${functions.length}:`);
            const name = func.getName() || '<anonymous>';
            logger.info(`   Name: ${name}`);
            
            const parameters = func.getParameters().map(param => {
                const paramName = param.getName();
                const paramType = param.getType().getText();
                logger.info(`   Parameter: ${paramName}: ${paramType}`);
                return {
                    name: paramName,
                    type: paramType
                };
            });
            
            const returnType = func.getReturnType().getText();
            logger.info(`   Return type: ${returnType}`);
            
            const body = func.getBody()?.getText() || '';
            logger.info(`   Body length: ${body.length} characters`);
            
            const docs = func.getJsDocs().map(doc => doc.getText()).join('\n');
            logger.info(`   Documentation: ${docs ? 'Present' : 'None'}`);
            
            const location = {
                file: path.basename(filePath),
                startLine: func.getStartLineNumber(),
                endLine: func.getEndLineNumber()
            };
            logger.info(`   Location: Lines ${location.startLine}-${location.endLine}`);
            
            result.functions.push({
                name,
                parameters,
                returnType,
                body,
                documentation: docs,
                location
            });
        } catch (error) {
            logger.error(`❌ Error processing function ${func.getName()}: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    // Analyze classes
    logger.info("\n🔍 Analyzing classes...");
    const classes = sourceFile.getClasses();
    logger.info(`📊 Found ${classes.length} classes`);
    
    classes.forEach((cls, index) => {
        try {
            logger.info(`\n📋 Processing class ${index + 1}/${classes.length}:`);
            const name = cls.getName() || '<anonymous>';
            logger.info(`   Name: ${name}`);
            
            logger.info('   Processing methods...');
            const methods = cls.getMethods().map(method => {
                const methodName = method.getName();
                logger.info(`      Method: ${methodName}`);
                return {
                    name: methodName,
                    parameters: method.getParameters().map(param => {
                        const paramName = param.getName();
                        const paramType = param.getType().getText();
                        logger.info(`         Parameter: ${paramName}: ${paramType}`);
                        return {
                            name: paramName,
                            type: paramType
                        };
                    }),
                    returnType: method.getReturnType().getText(),
                    body: method.getBody()?.getText() || '',
                    documentation: method.getJsDocs().map(doc => doc.getText()).join('\n')
                };
            });

            logger.info('   Processing properties...');
            const properties = cls.getProperties().map(prop => {
                const propName = prop.getName();
                const propType = prop.getType().getText();
                logger.info(`      Property: ${propName}: ${propType}`);
                return {
                    name: propName,
                    type: propType,
                    documentation: prop.getJsDocs().map(doc => doc.getText()).join('\n')
                };
            });

            const docs = cls.getJsDocs().map(doc => doc.getText()).join('\n');
            logger.info(`   Documentation: ${docs ? 'Present' : 'None'}`);

            const location = {
                file: path.basename(filePath),
                startLine: cls.getStartLineNumber(),
                endLine: cls.getEndLineNumber()
            };
            logger.info(`   Location: Lines ${location.startLine}-${location.endLine}`);

            result.classes.push({
                name,
                methods,
                properties,
                documentation: docs,
                location
            });
        } catch (error) {
            logger.error(`❌ Error processing class ${cls.getName()}: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    logger.info("\n📊 Analysis Summary:");
    logger.info(`   Functions found: ${result.functions.length}`);
    logger.info(`   Classes found: ${result.classes.length}`);
    logger.info("✅ Analysis complete!");

    return result;
}

/**
 * Analyzes the provided code and returns dummy analysis.
 * @param payload - Contains code and filePath.
 * @returns Dummy analysis result.
 */
export async function analyzeCodeDummy(payload: any) {
    logger.info('Analyzing code...');
    // Dummy data: include startLine and endLine for functions and classes.
    return {
        functions: [
            { 
                name: 'exampleFunction', 
                parameters: ['param1'], 
                returnType: 'void',
                filePath: payload.filePath || '',
                startLine: 1,
                endLine: 2
            }
        ],
        classes: [
            { 
                name: 'ExampleClass', 
                methods: ['method1'],
                filePath: payload.filePath || '',
                startLine: 3,
                endLine: 10
            }
        ],
    };
} 