/**
 * Debug utility for conditional logging based on --debug flag
 */

let debugEnabled = false;

export function setDebugMode(enabled: boolean): void {
    debugEnabled = enabled;
}

export function isDebugEnabled(): boolean {
    return debugEnabled;
}

export function debug(...args: any[]): void {
    if (debugEnabled) {
        console.log('[DEBUG]', ...args);
    }
}

export function debugError(...args: any[]): void {
    if (debugEnabled) {
        console.error('[DEBUG ERROR]', ...args);
    }
}

export function debugWarn(...args: any[]): void {
    if (debugEnabled) {
        console.warn('[DEBUG WARN]', ...args);
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
