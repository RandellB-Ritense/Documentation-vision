# Debug System Usage

## Overview
The debug system provides conditional logging that only fires when the `--debug` flag is added to the CLI.

## CLI Usage

### Without Debug Mode
```bash
doc-vision -i video.mp4 -o ./output -n my-doc
```

### With Debug Mode
```bash
doc-vision -i video.mp4 -o ./output -n my-doc --debug
# or
doc-vision -i video.mp4 -o ./output -n my-doc -d
```

## Available Debug Functions

### `debug(...args: any[])`
Basic debug logging - only outputs when debug mode is enabled.

```typescript
import { debug } from './utils/debug.js';

debug('Processing started');
debug('User options:', options);
debug('Frame count:', frameCount, 'Audio path:', audioPath);
```

### `debugError(...args: any[])`
Debug error logging with console.error.

```typescript
import { debugError } from './utils/debug.js';

debugError('Failed to process batch:', error);
```

### `debugWarn(...args: any[])`
Debug warning logging with console.warn.

```typescript
import { debugWarn } from './utils/debug.js';

debugWarn('Using fallback option');
```

### `debugTime(label: string)` & `debugTimeEnd(label: string)`
Performance timing - only measures when debug mode is enabled.

```typescript
import { debugTime, debugTimeEnd } from './utils/debug.js';

debugTime('Frame Processing');
// ... processing code ...
debugTimeEnd('Frame Processing');
```

### `setDebugMode(enabled: boolean)`
Enable or disable debug mode programmatically.

```typescript
import { setDebugMode } from './utils/debug.js';

setDebugMode(true);  // Enable debug mode
setDebugMode(false); // Disable debug mode
```

### `isDebugEnabled()`
Check if debug mode is currently enabled.

```typescript
import { isDebugEnabled } from './utils/debug.js';

if (isDebugEnabled()) {
    // Perform expensive debug operations only when needed
    const detailedInfo = computeExpensiveDebugInfo();
    debug('Detailed info:', detailedInfo);
}
```

## Example Usage in Services

```typescript
import { debug, debugTime, debugTimeEnd } from '../utils/debug.js';

export async function myService(data: any[]) {
    debug('Starting service with', data.length, 'items');
    debugTime('Service execution');
    
    for (let i = 0; i < data.length; i++) {
        debug(`Processing item ${i + 1}/${data.length}`);
        // ... processing logic ...
    }
    
    debugTimeEnd('Service execution');
    debug('Service completed successfully');
}
```

## Benefits

1. **Zero Performance Impact**: When debug mode is off, debug calls are cheap conditional checks
2. **Easy to Add**: Just import the debug functions and use them anywhere
3. **No Code Changes Required**: Debug statements stay in production code without affecting users
4. **Flexible**: Multiple debug functions for different logging needs
5. **Performance Monitoring**: Built-in timing functions for profiling
