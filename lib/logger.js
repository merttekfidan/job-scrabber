/**
 * Structured logger — replaces scattered console.log/error calls.
 * Outputs JSON in production for easy log aggregation.
 */

const isProduction = process.env.NODE_ENV === 'production';

function formatLog(level, message, meta = {}) {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...meta,
    };

    if (isProduction) {
        return JSON.stringify(entry);
    }

    // Dev: human-readable
    const prefix = {
        info: '\x1b[36mINFO\x1b[0m',
        warn: '\x1b[33mWARN\x1b[0m',
        error: '\x1b[31mERROR\x1b[0m',
        debug: '\x1b[90mDEBUG\x1b[0m',
    }[level] || level;

    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${prefix}] ${message}${metaStr}`;
}

const logger = {
    info: (message, meta) => console.log(formatLog('info', message, meta)),
    warn: (message, meta) => console.warn(formatLog('warn', message, meta)),
    error: (message, meta) => console.error(formatLog('error', message, meta)),
    debug: (message, meta) => {
        if (!isProduction) console.log(formatLog('debug', message, meta));
    },
};

export default logger;
