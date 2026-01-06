/**
 * Debug utility for conditional logging based on --debug flag
 */

let debugEnabled = false;
let logCallback: ((...args: any[]) => void) | null = null;

export function setDebugMode(enabled: boolean): void {
    debugEnabled = enabled;
}

export function setLogCallback(callback: ((...args: any[]) => void) | null): void {
    logCallback = callback;
}

export function isDebugEnabled(): boolean {
    return debugEnabled;
}

export function debug(...args: any[]): void {
    if (debugEnabled) {
        console.log('[DEBUG]', ...args);
        if (logCallback) {
            logCallback('[DEBUG]', ...args);
        }
    }
}

export function debugError(...args: any[]): void {
    if (debugEnabled) {
        console.error('[DEBUG ERROR]', ...args);
        if (logCallback) {
            logCallback('[DEBUG ERROR]', ...args);
        }
    }
}

export function debugWarn(...args: any[]): void {
    if (debugEnabled) {
        console.warn('[DEBUG WARN]', ...args);
        if (logCallback) {
            logCallback('[DEBUG WARN]', ...args);
        }
    }
}

export function debugTime(label: string): void {
    if (debugEnabled) {
        console.time(`[DEBUG] ${label}`);
    }
}

export function debugTimeEnd(label: string): void {
    if (debugEnabled) {
        console.timeEnd(`[DEBUG] ${label}`);
    }
}
