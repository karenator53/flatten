import fs from 'fs';
import path from 'path';
import { analyzeCode } from './index';
import { readFile } from '../utils/fileUtils';
import { AnalysisResult } from './types';
import { logger } from '../utils/logger';
import { ParserRegistry } from './languageParsers/ParserRegistry';

/**
 * Recursively lists all files in a given directory.
 * @param dirPath - The directory path to search.
 * @returns An array of file paths.
 */
function listFilesRecursively(dirPath: string): string[] {
  let results: string[] = [];
  const IGNORED_DIRS = new Set(["node_modules", ".git", "dist", ".idea", ".vscode"]);
  
  logger.info(`🔍 Scanning directory: ${dirPath}`);
  const list = fs.readdirSync(dirPath);
  
  list.forEach(file => {
    if (IGNORED_DIRS.has(file)) {
      logger.info(`⏭️ Skipping ignored directory: ${file}`);
      return;
    }
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      logger.info(`📁 Found directory: ${file}`);
      results = results.concat(listFilesRecursively(filePath));
    } else {
      logger.info(`📄 Found file: ${file}`);
      results.push(filePath);
    }
  });
  return results;
}

/**
 * Analyzes an entire project by scanning the given directory recursively.
 * It reads all .ts and .js files and aggregates their analysis results.
 * 
 * @param folder - The root directory of the project.
 * @returns Aggregated analysis result including functions and classes.
 */
export async function analyzeProject(folder: string): Promise<AnalysisResult> {
  // Trim any extra whitespace from the folder string
  folder = folder.trim();
  
  logger.info('🚀 Starting project analysis...');
  logger.info('📂 Input folder:', folder);
  logger.info('📂 Folder string hex:', folder.split('').map(c => c.charCodeAt(0).toString(16)).join(' '));

  // Use the provided path directly since it should be absolute
  const resolvedPath = path.normalize(folder);
  logger.info('📂 Resolved path:', resolvedPath);

  // Verify that the folder exists before proceeding
  if (!fs.existsSync(resolvedPath)) {
    logger.error(`❌ Folder does not exist: ${resolvedPath}`);
    throw new Error(`Folder does not exist: ${resolvedPath}`);
  }
  
  // Use the resolved path for scanning files
  const files = listFilesRecursively(resolvedPath);
  logger.info(`📊 Total files found: ${files.length}`);

  const analysisResult: AnalysisResult = { functions: [], classes: [] };

  // Filter for JavaScript and TypeScript files.
  const codeFiles = files.filter(file => file.endsWith('.ts') || file.endsWith('.js'));
  logger.info(`📊 Code files to analyze: ${codeFiles.length}`);
  logger.info('📄 Code files:', codeFiles);

  for (const file of codeFiles) {
    try {
      logger.info(`\n🔍 Analyzing file: ${file}`);
      logger.info(`📂 File extension: ${path.extname(file)}`);
      
      // Get appropriate parser
      const parser = ParserRegistry.getParserForFile(file);
      logger.info(`🔧 Selected parser: ${parser?.constructor.name || 'None'}`);
      
      if (!parser) {
        logger.warn(`⚠️ No parser found for file: ${file}`);
        continue;
      }

      logger.info('📖 Reading file contents...');
      const code = readFile(file);
      logger.info(`📄 File content length: ${code.length} characters`);
      logger.info(`📄 First 500 characters:\n${code.substring(0, 500)}...`);
      
      logger.info('🔄 Starting parser execution...');
      const result = await parser.parseFile(file);
      
      logger.info(`✅ Parser execution complete for ${file}:`);
      logger.info(`📊 Functions found: ${result.functions?.length || 0}`);
      logger.info(`📊 Classes found: ${result.classes?.length || 0}`);
      
      // Log detailed function info
      result.functions?.forEach((func, index) => {
        logger.info(`\n📋 Function ${index + 1}:`);
        logger.info(`   Name: ${func.name}`);
        logger.info(`   Parameters: ${JSON.stringify(func.parameters)}`);
        logger.info(`   Return type: ${func.returnType}`);
        logger.info(`   Location: ${JSON.stringify(func.location)}`);
      });

      // Log detailed class info
      result.classes?.forEach((cls, index) => {
        logger.info(`\n📋 Class ${index + 1}:`);
        logger.info(`   Name: ${cls.name}`);
        logger.info(`   Methods: ${cls.methods.length}`);
        logger.info(`   Properties: ${cls.properties.length}`);
        logger.info(`   Location: ${JSON.stringify(cls.location)}`);
      });

      if (result.functions) analysisResult.functions.push(...result.functions);
      if (result.classes) analysisResult.classes.push(...result.classes);
      
    } catch (err) {
      // Enhanced error logging
      logger.error(`❌ Error analyzing file ${file}:`, err);
      if (err instanceof Error) {
        logger.error('Stack trace:', err.stack);
        logger.error('Error name:', err.name);
        logger.error('Error message:', err.message);
      }
      // Continue with other files
    }
  }

  logger.info('\n📊 Final Analysis Summary:');
  logger.info(`📊 Total functions found: ${analysisResult.functions.length}`);
  logger.info(`📊 Total classes found: ${analysisResult.classes.length}`);
  
  // Log the complete analysis result
  logger.info('\n📋 Complete Analysis Result:');
  logger.info(JSON.stringify(analysisResult, null, 2));

  return analysisResult;
} 