// src/codeAnalyzer/types.ts

// Define interfaces for code analysis results

export interface FunctionInfo {
    name: string;
    parameters: string[];
    returnType: string;
}

export interface ClassInfo {
    name: string;
    methods: string[];
}

export interface Parameter {
    name: string;
    type: string;
}

export interface Location {
    file: string;
    startLine: number;
    endLine: number;
}

export interface FunctionAnalysis {
    name: string;
    type?: string;  // Added for Babel parser
    parameters: Parameter[];
    returnType: string;
    body?: string;  // Made optional since we use codeSnippet
    codeSnippet?: string;  // Added for Babel parser
    documentation: string;
    location: Location;
}

export interface ClassProperty {
    name: string;
    type: string;
    documentation: string;
}

export interface ClassMethod {
    name: string;
    type?: string;  // Added for Babel parser
    parameters: Parameter[];
    returnType: string;
    body?: string;  // Made optional since we use codeSnippet
    codeSnippet?: string;  // Added for Babel parser
    documentation: string;
    location?: Location;  // Added for Babel parser
}

export interface ClassAnalysis {
    name: string;
    type?: string;  // Added for Babel parser
    methods: ClassMethod[];
    properties: ClassProperty[];
    documentation: string;
    location: Location;
    codeSnippet?: string;  // Added for Babel parser
}

export interface AnalysisResult {
    functions: FunctionAnalysis[];
    classes: ClassAnalysis[];
}

// Language Parser Interface
export interface ILanguageParser {
    /**
     * Parse a file and return its analysis.
     * @param filePath Path to the file to parse.
     */
    parseFile(filePath: string): Promise<{
        functions?: FunctionAnalysis[];
        classes?: ClassAnalysis[];
    }>;

    /**
     * Check if this parser can handle the given file.
     * @param filePath Path to the file to check.
     */
    canHandle(filePath: string): boolean;
} 