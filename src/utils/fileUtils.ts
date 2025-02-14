import fs from 'fs';

/**
 * Synchronously reads a file with the specified encoding (default: 'utf8') 
 * and returns its contents as a string.
 *
 * @param filePath - The path to the file.
 * @param encoding - The file encoding (default is 'utf8').
 * @returns The file contents as string.
 */
export function readFile(filePath: string, encoding: BufferEncoding = 'utf8'): string {
    return fs.readFileSync(filePath, encoding);
}

/**
 * Synchronously writes data to a file with the specified encoding (default: 'utf8').
 *
 * @param filePath - The path to the file.
 * @param data - The data to write to the file.
 * @param encoding - The file encoding (default is 'utf8').
 */
export function writeFile(filePath: string, data: string, encoding: BufferEncoding = 'utf8'): void {
    fs.writeFileSync(filePath, data, { encoding });
}

/**
 * Checks whether a file exists at the given path.
 *
 * @param filePath - The path to the file.
 * @returns True if the file exists, otherwise false.
 */
export function fileExists(filePath: string): boolean {
    try {
        fs.accessSync(filePath, fs.constants.F_OK);
        return true;
    } catch {
        return false;
    }
} 