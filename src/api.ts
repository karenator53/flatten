import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import { analyzeProject } from './codeAnalyzer/projectAnalyzer.js';
import { generateDoc } from './docGenerator/index.js';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ComponentAnalysis } from './mcp/openaiClient';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate OpenAI API key at startup
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OpenAI API key is missing! Please check your .env file');
  process.exit(1);
}

console.log('✅ OpenAI API key found');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({ origin: '*' }));

// Refactored custom CORS middleware as an explicit RequestHandler
const customCorsMiddleware: express.RequestHandler = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
};

app.use(customCorsMiddleware);
app.use(bodyParser.json());

// Serve static files from the public directory
app.use(express.static('public'));

// Debug endpoint to inspect folder resolution details
app.get('/api/debug-folder', (req: Request, res: Response) => {
  const folder = (req.query.folder as string) || "";
  const trimmedFolder = folder.trim();
  
  // Set BASE_DIR to C: drive root
  const BASE_DIR = 'C:\\';
  
  // Assemble debug info
  let debugInfo: any = {};
  debugInfo.incomingFolder = trimmedFolder;
  debugInfo.incomingFolderHex = trimmedFolder.split('').map(c => c.charCodeAt(0).toString(16)).join(' ');
  debugInfo.BASE_DIR = BASE_DIR;
  
  try {
    debugInfo.availableItems = fs.readdirSync(BASE_DIR);
  } catch (e:any) {
    debugInfo.availableItemsError = e.message;
  }
  
  const resolvedPath = path.resolve(BASE_DIR, trimmedFolder);
  debugInfo.resolvedPath = resolvedPath;
  debugInfo.exists = fs.existsSync(resolvedPath);
  if (fs.existsSync(resolvedPath)) {
    try {
      debugInfo.stats = fs.statSync(resolvedPath);
    } catch (err:any) {
      debugInfo.statsError = err.message;
    }
  }
  
  res.json(debugInfo);
});

// Helper to wrap async route handlers with error logging
function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): express.RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(error => {
      console.error(`Unhandled error in ${req.method} ${req.url}:`, error);
      next(error);
    });
  };
}

app.post('/api/analyze', asyncHandler(async (req: Request, res: Response) => {
  const { folder } = req.body;
  console.log('🔍 DEBUG: Received analyze request');
  console.log('📂 DEBUG: Folder path:', folder);
  
  if (!folder) {
    console.error('❌ DEBUG: Folder path is missing in the request body.');
    return res.status(400).json({ error: 'Folder path is required' });
  }

  // Use the provided path directly
  const fullPath = path.resolve(folder);
  console.log(`📍 DEBUG: Resolved path: ${fullPath}`);

  // Verify the path exists
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ DEBUG: Folder does not exist: ${fullPath}`);
    return res.status(400).json({ error: 'Folder does not exist' });
  }

  try {
    console.log('🔄 DEBUG: Starting project analysis...');
    // Analyze the project folder
    const analysisResult = await analyzeProject(fullPath);
    console.log(`✅ DEBUG: Analysis complete. Result keys: ${Object.keys(analysisResult).join(', ')}`);

    // Generate comprehensive OpenAI analysis
    console.log('🤖 DEBUG: Starting comprehensive OpenAI analysis...');
    const { analyzeCodebase } = await import('./mcp/openaiClient.js');
    
    const aiAnalysis = await analyzeCodebase(analysisResult);

    console.log('✨ DEBUG: Successfully received comprehensive OpenAI analysis');

    // Return both the raw code analysis and the structured AI analysis
    return res.status(200).json({
      codeOutput: analysisResult,
      aiAnalysis
    });

  } catch (error) {
    console.error('❌ Error during analysis:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    return res.status(500).json({ 
      error: 'Analysis failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}));

// Error handling middleware for debugging
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error handling middleware caught error:', err);
  res.status(500).json({ error: err.message, stack: err.stack });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});

export default app; 