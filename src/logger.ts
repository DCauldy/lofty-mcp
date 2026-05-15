import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";

// Augment Express Request with instrumentation fields
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
    }
  }
}

type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  requestId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  authType?: string;
  clientId?: string;
  error?: string;
  [key: string]: unknown;
}

class Logger {
  constructor(private service: string) {}

  info(message: string, extra?: Partial<LogEntry>) {
    this.log("info", message, extra);
  }

  warn(message: string, extra?: Partial<LogEntry>) {
    this.log("warn", message, extra);
  }

  error(message: string, extra?: Partial<LogEntry>) {
    this.log("error", message, extra);
  }

  fromReq(req: Request): Partial<LogEntry> {
    return {
      requestId: req.requestId,
      path: req.path,
      method: req.method,
    };
  }

  private log(level: LogLevel, message: string, extra?: Partial<LogEntry>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      ...extra,
    };
    process.stderr.write(JSON.stringify(entry) + "\n");
  }
}

export function createLogger(service: string): Logger {
  return new Logger(service);
}

export function requestInstrumentation() {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.requestId = randomUUID();
    req.startTime = Date.now();
    next();
  };
}
