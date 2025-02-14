import fs from 'fs';
import path from 'path';

export interface Config {
    supportedLanguages: string[];
    defaultTemplatePath: string;
    mcpPort: number; // For future use if integrating a network-based server.
}

// Default configuration values.
const defaultConfig: Config = {
    supportedLanguages: ['typescript', 'javascript'],
    defaultTemplatePath: path.join(__dirname, '..', 'templates', 'default.hbs'),
    mcpPort: 3000,
};

/**
 * Retrieves the configuration.
 * In the future, this could be extended to read from a JSON file or environment variables.
 *
 * @returns Config object.
 */
export function getConfig(): Config {
    // For now, simply return the default configuration.
    // Optionally, check if a config file exists and merge with defaultConfig.
    return defaultConfig;
} 