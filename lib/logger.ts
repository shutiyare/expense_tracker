/**
 * ════════════════════════════════════════════════════════════════════════════
 * STRUCTURED LOGGING & PERFORMANCE MONITORING MODULE
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Production-grade logging system with:
 *
 * ✅ Structured JSON logging for easy parsing
 * ✅ Performance tracking for API routes and database queries
 * ✅ Error tracking with stack traces and context
 * ✅ Request/Response logging with sanitization
 * ✅ Log levels (debug, info, warn, error)
 * ✅ Environment-aware (verbose in dev, structured in prod)
 * ✅ Ready for integration with Sentry, Logtail, or DataDog
 *
 * Usage:
 * ```typescript
 * import { logger, trackPerformance } from "@/lib/logger";
 *
 * logger.info("User logged in", { userId: "123" });
 *
 * const track = trackPerformance("fetchExpenses");
 * // ... do work ...
 * track.end({ count: 50 });
 * ```
 */

// ────────────────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ────────────────────────────────────────────────────────────────────────────

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  duration?: number;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

interface PerformanceTracker {
  end: (context?: LogContext) => number;
}

// ────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ────────────────────────────────────────────────────────────────────────────

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

// Minimum log level to output
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const CURRENT_LOG_LEVEL: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) || (isDevelopment ? "debug" : "info");

// Performance thresholds (milliseconds)
const PERFORMANCE_THRESHOLDS = {
  database: 200, // Database queries > 200ms are slow
  api: 1000, // API routes > 1s are slow
  external: 3000, // External API calls > 3s are slow
};

// ────────────────────────────────────────────────────────────────────────────
// CORE LOGGING FUNCTIONS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Check if log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[CURRENT_LOG_LEVEL];
}

/**
 * Format log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
  if (isDevelopment) {
    // Pretty format for development
    const emoji = {
      debug: "🔍",
      info: "ℹ️",
      warn: "⚠️",
      error: "❌",
    }[entry.level];

    let output = `${emoji} ${entry.message}`;

    if (entry.duration) {
      output += ` (${entry.duration}ms)`;
    }

    if (entry.context && Object.keys(entry.context).length > 0) {
      output += `\n  ${JSON.stringify(entry.context, null, 2)}`;
    }

    if (entry.error) {
      output += `\n  Error: ${entry.error.message}`;
      if (entry.error.stack) {
        output += `\n${entry.error.stack}`;
      }
    }

    return output;
  } else {
    // Structured JSON for production (easy to parse by log aggregators)
    return JSON.stringify(entry);
  }
}

/**
 * Write log entry
 */
function writeLog(
  level: LogLevel,
  message: string,
  context?: LogContext
): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context && { context: sanitizeContext(context) }),
  };

  const formatted = formatLogEntry(entry);

  switch (level) {
    case "error":
      console.error(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    case "debug":
    case "info":
    default:
      console.log(formatted);
      break;
  }
}

/**
 * Sanitize context to remove sensitive data
 */
function sanitizeContext(context: LogContext): LogContext {
  const sensitiveKeys = [
    "password",
    "passwordHash",
    "token",
    "accessToken",
    "refreshToken",
    "secret",
    "apiKey",
    "authorization",
  ];

  const sanitized: LogContext = {};

  for (const [key, value] of Object.entries(context)) {
    if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
      sanitized[key] = "***REDACTED***";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeContext(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// ────────────────────────────────────────────────────────────────────────────
// LOGGER OBJECT
// ────────────────────────────────────────────────────────────────────────────

export const logger = {
  /**
   * Debug log (development only, detailed information)
   */
  debug(message: string, context?: LogContext): void {
    writeLog("debug", message, context);
  },

  /**
   * Info log (general information)
   */
  info(message: string, context?: LogContext): void {
    writeLog("info", message, context);
  },

  /**
   * Warning log (something unexpected but not critical)
   */
  warn(message: string, context?: LogContext): void {
    writeLog("warn", message, context);
  },

  /**
   * Error log (something went wrong)
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "error",
      message,
      ...(context && { context: sanitizeContext(context) }),
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
          code: (error as any).code,
        },
      }),
    };

    console.error(formatLogEntry(entry));

    // TODO: Send to error tracking service (Sentry, etc.)
    // if (isProduction && error) {
    //   Sentry.captureException(error, { contexts: { custom: context } });
    // }
  },

  /**
   * HTTP request log
   */
  request(method: string, path: string, context?: LogContext): void {
    writeLog("info", `${method} ${path}`, {
      type: "http_request",
      ...context,
    });
  },

  /**
   * HTTP response log
   */
  response(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    const level =
      statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";

    writeLog(level, `${method} ${path} ${statusCode}`, {
      type: "http_response",
      duration,
      statusCode,
      ...context,
    });
  },

  /**
   * Database query log
   */
  query(
    operation: string,
    model: string,
    duration: number,
    context?: LogContext
  ): void {
    const level = duration > PERFORMANCE_THRESHOLDS.database ? "warn" : "debug";

    writeLog(level, `DB ${operation} on ${model}`, {
      type: "database_query",
      operation,
      model,
      duration,
      slow: duration > PERFORMANCE_THRESHOLDS.database,
      ...context,
    });
  },
};

// ────────────────────────────────────────────────────────────────────────────
// PERFORMANCE TRACKING
// ────────────────────────────────────────────────────────────────────────────

/**
 * Track performance of an operation
 *
 * @param operation Name of the operation
 * @param type Type of operation (database, api, external)
 * @returns Tracker object with end() method
 *
 * @example
 * const track = trackPerformance("fetchExpenses", "database");
 * const expenses = await Expense.find({ userId });
 * track.end({ count: expenses.length });
 */
export function trackPerformance(
  operation: string,
  type: "database" | "api" | "external" = "api"
): PerformanceTracker {
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;

  return {
    end(context?: LogContext): number {
      const duration = Date.now() - startTime;
      const endMemory = process.memoryUsage().heapUsed;
      const memoryDelta = endMemory - startMemory;

      const threshold = PERFORMANCE_THRESHOLDS[type];
      const isSlow = duration > threshold;

      if (isSlow || isDevelopment) {
        logger.info(`${operation} completed`, {
          type: `${type}_performance`,
          operation,
          duration,
          memoryDelta: Math.round((memoryDelta / 1024 / 1024) * 100) / 100, // MB
          slow: isSlow,
          ...context,
        });
      }

      return duration;
    },
  };
}

/**
 * Create a wrapper for async functions to automatically track performance
 */
export function withPerformanceTracking<
  T extends (...args: any[]) => Promise<any>
>(
  fn: T,
  operationName: string,
  type: "database" | "api" | "external" = "api"
): T {
  return (async (...args: any[]) => {
    const track = trackPerformance(operationName, type);
    try {
      const result = await fn(...args);
      track.end();
      return result;
    } catch (error) {
      track.end({ error: true });
      throw error;
    }
  }) as T;
}

// ────────────────────────────────────────────────────────────────────────────
// REQUEST/RESPONSE HELPERS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Get request context for logging
 */
export function getRequestContext(req: any): LogContext {
  return {
    method: req.method,
    url: req.url,
    userAgent: req.headers?.["user-agent"],
    ip: req.headers?.["x-forwarded-for"] || req.headers?.["x-real-ip"],
  };
}

/**
 * Middleware to track API route performance
 * Wrap your API handler with this function
 */
export function withAPILogging<T>(
  handler: (req: any, context: any) => Promise<T>,
  routeName: string
) {
  return async (req: any, context?: any): Promise<T> => {
    const startTime = Date.now();
    const requestContext = getRequestContext(req);

    logger.request(req.method, routeName, requestContext);

    try {
      const result = await handler(req, context);
      const duration = Date.now() - startTime;

      logger.response(
        req.method,
        routeName,
        (result as any)?.status || 200,
        duration,
        requestContext
      );

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      logger.response(
        req.method,
        routeName,
        error.status || 500,
        duration,
        requestContext
      );

      logger.error(`Error in ${routeName}`, error, requestContext);
      throw error;
    }
  };
}

// ────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ────────────────────────────────────────────────────────────────────────────

export default logger;
