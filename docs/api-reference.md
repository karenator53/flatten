## AI-Powered Code Documentation Generator

### Overview

This is an AI-powered tool for automatically generating documentation for your codebase. It analyzes code and extracts relevant information. It produces structured documentation to improve code maintainability and readability. It integrates with Cursor IDE.

### Quick Start

1.  **Installation**:
    *   Ensure you have Node.js and npm installed.
    *   Clone the repository.
    *   Run `npm install` in the repository root to install dependencies.
    *   Run `cd frontend && npm install` to install frontend dependencies.

2.  **Running the Application**:
    *   Start the backend server by running `npm run start` in the repository root.
    *   Start the frontend development server by running `cd frontend && npm run dev`.
    *   Open your browser and navigate to `http://localhost:5173` to access the application.

3.  **Using with Cursor IDE**:
    *   Refer to the `.cursorrules` file for available `cursor-tools` commands.
    *   Ensure `cursor-tools` is installed and configured in your Cursor IDE.
    *   Use commands like `cursor-tools doc [options]` to generate documentation.

### Configuration

#### Environment Variables

*   Create a `.env` file in the repository root.
*   Set `OPENAI_API_KEY` to your OpenAI API key in `.env`. This is required for AI-powered analysis.

#### Configuration Files

*   `cursor-tools.config.json` and `~/.cursor-tools/config.json`:  For `cursor-tools` configuration (if using Cursor integration).
*   `.cursor-tools.env` and `~/.cursor-tools/.env`: For API keys used by `cursor-tools`.
*   `config.json` (or `.env`):  For application settings such as supported languages and default template paths (future feature).

#### Templates

*   Documentation templates are located in the `templates/` directory.
*   `default.hbs` is the default Handlebars template used for documentation generation.
*   You can customize or add new templates in this directory.

### Core Features and API

#### Code Analysis

*   **`src/codeAnalyzer/index.ts`**:  Provides functions to analyze code.
    *   `analyzeCode({ code, filePath })`: Analyzes code string to extract functions and classes.
    *   `analyzeCodeDummy(payload)`:  Returns dummy analysis data for testing.
*   **`src/codeAnalyzer/projectAnalyzer.ts`**:  Provides project-level analysis.
    *   `analyzeProject(folder)`: Recursively analyzes all code files in a directory.

#### Language Parsers

*   **`src/codeAnalyzer/languageParsers/`**: Contains language-specific parsers.
    *   `babelParser.ts`: Parser for JavaScript and JSX files using Babel.
    *   `tsParser.ts`: Parser for TypeScript and TSX files using `ts-morph`.
    *   `yamlParser.ts`: Parser for YAML files using `js-yaml`.
    *   `ParserRegistry.ts`:  Manages and registers available language parsers.
    *   `ILanguageParser.ts`:  Defines the interface for language parsers.

#### Documentation Generation

*   **`src/docGenerator/index.ts`**:  Handles documentation generation.
    *   `generateDocumentation(payload)`: Generates documentation based on analysis data (currently returns dummy documentation).
    *   `generateDoc(analysisData)`: Compiles documentation using the default template and analysis data.
*   **`src/docGenerator/templateEngine.ts`**:  Template engine functionality using Handlebars.
    *   `templateEngine(payload)`:  Renders documentation using the default Handlebars template.
    *   `compileTemplate(context)`: Compiles the default template with provided context.
    *   `renderTemplate(template, data)`: Renders a given template string with data.
*   **`src/docGenerator/helpers.ts`**:  Registers custom Handlebars helpers (currently empty).

#### MCP Integration

*   **`src/index.ts`**:  Entry point for the MCP server. Listens for MCP messages via standard input.
*   **`src/mcpHandler.ts`**:  Handles routing and validation of MCP commands.
    *   `handleMCPRequest(request)`: Processes incoming MCP requests and routes them to appropriate handlers. Supports commands: `analyzeCode`, `analyzeProject`, `generateDocs`.
*   **`src/mcp/integration.ts`**:  Integration layer for MCP commands.
    *   `assist(payload)`: Aggregates context from analysis and documentation modules and interacts with OpenAI.
*   **`src/mcp/openaiClient.ts`**:  Client for interacting with the OpenAI API.
    *   `sendQuery(query)`: Sends a query to the OpenAI API and returns the response.
    *   `analyzeCodebase(context)`: Analyzes a codebase using OpenAI in chunks to handle large projects.

#### API Endpoints

*   **`src/api.ts`**:  Defines REST API endpoints using Express.js.
    *   `/api/analyze` (POST):  Analyzes a project folder provided in the request body and returns code analysis and AI analysis results.
    *   `/api/debug-folder` (GET): Debug endpoint to inspect folder path resolution.

#### Frontend

*   **`frontend/src/components/`**:  React components for the user interface.
    *   `CodeAnalyzer.tsx`:  Component for initiating code analysis and displaying results.
    *   `Documentation.tsx`:  Component for displaying generated documentation.
    *   `MermaidDiagram.tsx`:  Component to render Mermaid diagrams for visualizations.
    *   `Navbar.tsx`:  Navigation bar component.
    *   `RelationshipVisualizer.tsx`: Component to visualize component relationships.

### Dependencies and Requirements

#### Backend Dependencies

*   `express`: Web framework for creating the API.
*   `body-parser`:  Middleware for parsing request bodies.
*   `cors`: Middleware for enabling Cross-Origin Resource Sharing.
*   `ts-morph`:  TypeScript compiler API for code analysis.
*   `js-yaml`: YAML parser.
*   `handlebars`: Template engine for documentation generation.
*   `openai`: OpenAI Node.js SDK for interacting with OpenAI API.
*   `dotenv`: For loading environment variables from `.env` files.
*   `uuid`: For generating unique request IDs.
*   `joi`: For payload validation.
*   `ts-node`: To run TypeScript directly for development.

#### Frontend Dependencies

*   `react`, `react-dom`:  Core React libraries.
*   `react-router-dom`:  For frontend routing.
*   `@chakra-ui/react`, `@emotion/*`, `framer-motion`:  UI component library.
*   `react-syntax-highlighter`: For syntax highlighting in code blocks.
*   `react-markdown`: For rendering Markdown content.
*   `mermaid`: For generating diagrams.
*   `axios`:  For making HTTP requests to the backend API.
*   `js-yaml`:  For YAML parsing in frontend.
*   `react-icons`: For icons.

#### General Requirements

*   Node.js (>= 18 recommended)
*   npm or yarn or pnpm
*   OpenAI API key (for AI analysis features)
*   Playwright (if using browser automation features via `cursor-tools`, mentioned in `.cursorrules`)

### Advanced Usage Examples

#### Using `cursor-tools` for Documentation Generation (Cursor IDE Integration)

*   **Generate documentation for the entire repository**:
    ```bash
    cursor-tools doc --output docs.md
    ```

*   **Generate documentation for a remote GitHub repository**:
    ```bash
    cursor-tools doc --from-github=<GitHub username>/<repository name>@<branch> --output remote-docs.md
    ```

#### Customizing Documentation Templates

*   Modify the `default.hbs` file in the `templates/` directory to customize the documentation output format.
*   Future enhancements might include options to select different templates via configuration or command-line arguments.

#### Extending Language Support

*   Add new language parsers in the `src/codeAnalyzer/languageParsers/` directory, implementing the `ILanguageParser` interface.
*   Register the new parser in `src/codeAnalyzer/languageParsers/ParserRegistry.ts`.

#### Integrating with OpenAI for Enhanced Analysis

*   The tool uses OpenAI's `chatgpt-4o-latest` model for code analysis and summarization.
*   Prompts are defined in `src/mcp/openaiClient.ts` and can be adjusted for different analysis focuses.
*   The system supports chunking large codebases to handle token limits when using the OpenAI API.

This documentation provides a comprehensive overview of the AI-Powered Code Documentation Generator, covering its features, setup, and usage.