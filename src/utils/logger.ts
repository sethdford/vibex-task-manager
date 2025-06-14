import chalk from 'chalk';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

export interface Logger {
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  success: (message: string, ...args: any[]) => void;
}

/**
 * Simple console logger with colored output
 */
export const createLogger = (prefix?: string): Logger => {
  const formatMessage = (level: LogLevel, message: string): string => {
    const timestamp = new Date().toISOString();
    const prefixStr = prefix ? `[${prefix}]` : '';
    
    switch (level) {
      case 'debug':
        return chalk.gray(`[${timestamp}] ${prefixStr} DEBUG: ${message}`);
      case 'info':
        return chalk.blue(`[${timestamp}] ${prefixStr} INFO: ${message}`);
      case 'warn':
        return chalk.yellow(`[${timestamp}] ${prefixStr} WARN: ${message}`);
      case 'error':
        return chalk.red(`[${timestamp}] ${prefixStr} ERROR: ${message}`);
      case 'success':
        return chalk.green(`[${timestamp}] ${prefixStr} SUCCESS: ${message}`);
      default:
        return `[${timestamp}] ${prefixStr} ${message}`;
    }
  };

  return {
    debug: (message: string, ...args: any[]) => {
      if (process.env.DEBUG === 'true') {
        console.log(formatMessage('debug', message), ...args);
      }
    },
    info: (message: string, ...args: any[]) => {
      console.log(formatMessage('info', message), ...args);
    },
    warn: (message: string, ...args: any[]) => {
      console.warn(formatMessage('warn', message), ...args);
    },
    error: (message: string, ...args: any[]) => {
      console.error(formatMessage('error', message), ...args);
    },
    success: (message: string, ...args: any[]) => {
      console.log(formatMessage('success', message), ...args);
    }
  };
};

export const defaultLogger = createLogger();