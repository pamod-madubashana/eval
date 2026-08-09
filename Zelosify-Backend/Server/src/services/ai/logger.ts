export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: Record<string, unknown>;
  error?: string;
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: string,
  data?: Record<string, unknown>,
  error?: unknown
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };
  if (context) entry.context = context;
  if (data) entry.data = data;
  if (error instanceof Error) entry.error = error.message;
  else if (error) entry.error = String(error);
  return entry;
}

function formatLog(entry: LogEntry): string {
  return JSON.stringify(entry);
}

export const logger = {
  debug(message: string, context?: string, data?: Record<string, unknown>) {
    console.debug(formatLog(createLogEntry("debug", message, context, data)));
  },
  info(message: string, context?: string, data?: Record<string, unknown>) {
    console.info(formatLog(createLogEntry("info", message, context, data)));
  },
  warn(message: string, context?: string, data?: Record<string, unknown>) {
    console.warn(formatLog(createLogEntry("warn", message, context, data)));
  },
  error(message: string, context?: string, error?: unknown, data?: Record<string, unknown>) {
    console.error(formatLog(createLogEntry("error", message, context, data, error)));
  },
};

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "")
    .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|FETCH|DECLARE|TRUNCATE)\b)/gi, "")
    .substring(0, 10000);
}
