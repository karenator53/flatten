// Basic logging utility 
// src/utils/logger.ts

export const logger = {
    info: (msg: string, ...args: any[]) => {
        console.log(`[INFO] ${msg}`, ...args);
    },
    warn: (msg: string, ...args: any[]) => {
        console.warn(`[WARN] ${msg}`, ...args);
    },
    error: (msg: string, ...args: any[]) => {
        console.error(`[ERROR] ${msg}`, ...args);
    },
};
  