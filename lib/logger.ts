/**
 * Structured logger — replaces scattered console.log/error calls.
 * Outputs JSON in production for easy log aggregation.
 */

const isProduction = process.env.NODE_ENV === 'production';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function formatLog(level: LogLevel, message: string, meta: Record<string, unknown> = {}): string {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  if (isProduction) {
    return JSON.stringify(entry);
  }

  const prefix: Record<LogLevel, string> = {
    info: '\x1b[36mINFO\x1b[0m',
    warn: '\x1b[33mWARN\x1b[0m',
    error: '\x1b[31mERROR\x1b[0m',
    debug: '\x1b[90mDEBUG\x1b[0m',
  };

  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `[${prefix[level]}] ${message}${metaStr}`;
}

const logger = {
  info: (message: string, meta?: Record<string, unknown>) => console.log(formatLog('info', message, meta ?? {})),
  warn: (message: string, meta?: Record<string, unknown>) => console.warn(formatLog('warn', message, meta ?? {})),
  error: (message: string, meta?: Record<string, unknown>) => console.error(formatLog('error', message, meta ?? {})),
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (!isProduction) console.log(formatLog('debug', message, meta ?? {}));
  },
};

export default logger;
