import {Handler} from "./handlers";

export enum LogLevel {
  Verbose,
  Debug,
  Information,
  Warning,
  Error,
  Fatal
}

export class LogRecord {
  public readonly timestamp: string
  public readonly level: LogLevel
  public readonly message: string
  public readonly details?: object

  constructor(level: LogLevel, message: string, details?: object) {
    this.timestamp = new Date().toISOString()
    this.level = level
    this.message = message
    this.details = details
  }
}

export class Logger {
  private minLevel: LogLevel
  private readonly handlers: Map<string, Handler>

  /**
   * Create a new Logger.
   * @param minLevel - The minimum log level to log.
   * @param handlers - A map of handlers to use for logging.
   */
  constructor(minLevel: LogLevel = LogLevel.Information, handlers: Map<string, Handler> = new Map<string, Handler>()) {
    this.minLevel = minLevel
    this.handlers = handlers
  }

  /**
   * Add a handler to the logger.
   * @param name - The name of the handler. Must be unique.
   * @param handler - The handler to add.
   * @throws Error if a handler with the same name already exists.
   */
  addHandler(name: string, handler: Handler): void {
    // check if handler with name already exists
    if (this.handlers.has(name)) {
      throw new Error(`Handler with name '${name}' already exists.`)
    }

    this.handlers.set(name, handler)
  }

  /**
   * Remove a handler from the logger.
   * @param name - The name of the handler to remove.
   * @throws Error if a handler with the name does not exist.
   */
  removeHandler(name: string): void {
    // check if handler with name exists
    if (!this.handlers.has(name)) {
      throw new Error(`Handler with name '${name}' does not exist.`)
    }

    this.handlers.delete(name)
  }

  /**
   * Set the minimum log level for the logger.
   * @param level - The minimum log level.
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level
  }

  /**
   * Get the minimum log level for the logger.
   * @returns The minimum log level.
   */
  getMinLevel(): LogLevel {
    return this.minLevel
  }

  /**
   * Log a message with a log level of Verbose.
   * @param message - The message to log.
   * @param details - Optional details object e.g. Error or context object.
   */
  verbose(message: string, details?: object): void {
    this.log(LogLevel.Verbose, message, details)
  }

  /**
   * Log a message with a log level of Debug.
   * @param message - The message to log.
   * @param details - Optional details object e.g. Error or context object.
   */
  debug(message: string, details?: object): void {
    this.log(LogLevel.Debug, message, details)
  }

  /**
   * Log a message with a log level of Information.
   * @param message - The message to log.
   * @param details - Optional details object e.g. Error or context object.
   */
  info(message: string, details?: object): void {
    this.log(LogLevel.Information, message, details)
  }

  /**
   * Log a message with a log level of Warning.
   * @param message - The message to log.
   * @param details - Optional details object e.g. Error or context object.
   */
  warning(message: string, details?: object): void {
    this.log(LogLevel.Warning, message, details)
  }

  /**
   * Log a message with a log level of Error.
   * @param message - The message to log.
   * @param details - Optional details object e.g. Error or context object.
   */
  error(message: string, details?: object): void {
    this.log(LogLevel.Error, message, details)
  }

  /**
   * Log a message with a log level of Fatal.
   * @param message - The message to log.
   * @param details - Optional details object e.g. Error or context object.
   */
  fatal(message: string, details?: object): void {
    this.log(LogLevel.Fatal, message, details)
  }

  private log(level: LogLevel, message: string, details?: object): void {
    if (level < this.minLevel) return

    const logRecord = new LogRecord(level, message, details)

    // pass message to logging handlers
    for (const handler of this.handlers) {
      handler[1].log(logRecord)
    }
  }
}