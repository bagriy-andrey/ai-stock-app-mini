type LogLevel = "debug" | "info" | "warn" | "error";

type LogPayload = Record<string, unknown>;

const levels: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const configuredLevel = (process.env.LOG_LEVEL ?? "info") as LogLevel;

function shouldLog(level: LogLevel): boolean {
  return levels[level] >= levels[configuredLevel];
}

function redact(payload: LogPayload = {}): LogPayload {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [
      key,
      key.toLowerCase().includes("key") ||
      key.toLowerCase().includes("secret") ||
      key.toLowerCase().includes("token")
        ? "[redacted]"
        : value,
    ]),
  );
}

function write(level: LogLevel, message: string, payload?: LogPayload): void {
  if (!shouldLog(level)) {
    return;
  }

  const record = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(payload ? { payload: redact(payload) } : {}),
  };

  const serialized = JSON.stringify(record);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
}

export const logger = {
  debug: (message: string, payload?: LogPayload) =>
    write("debug", message, payload),
  info: (message: string, payload?: LogPayload) => write("info", message, payload),
  warn: (message: string, payload?: LogPayload) => write("warn", message, payload),
  error: (message: string, payload?: LogPayload) =>
    write("error", message, payload),
};
