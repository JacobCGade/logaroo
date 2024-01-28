import {LogLevel, LogRecord} from "./logger";
import {DefaultFormatter, Formatter} from "./formatters";

import * as fsPromise from 'fs/promises';
import * as path from 'path';
import * as properLockfile from 'proper-lockfile';
import {ensureFileExists, ensureIsDirectory, yyyymmdd, yyyymmdd_hh} from "./helpers";

export interface Handler {
  minLevel: LogLevel
  formatter: Formatter
  log(logRecord: LogRecord): void
}

export class FileHandler implements Handler {
  basePath: string
  minLevel: LogLevel
  formatter: Formatter
  writerStrategy: FileWriterStrategy

  constructor(minLevel: LogLevel, basePath: string, writerStrategy: FileWriterStrategy, formatter: Formatter = new DefaultFormatter()) {
    ensureIsDirectory(basePath)

    this.minLevel = minLevel
    this.basePath = basePath
    this.writerStrategy = writerStrategy
    this.formatter = formatter
  }

  async log(logRecord: LogRecord): Promise<void> {
    if (logRecord.level < this.minLevel) return

    const formattedMessage = this.formatter.format(logRecord)

    await this.writerStrategy.appendFile(this.basePath, formattedMessage)
  }
}

export class ConsoleHandler implements Handler {
  public readonly minLevel: LogLevel
  public readonly formatter: Formatter

  constructor(minLevel: LogLevel, formatter: Formatter = new DefaultFormatter()) {
    this.minLevel = minLevel
    this.formatter = formatter
  }

  log(logRecord: LogRecord): void {
    if (logRecord.level < this.minLevel) return

    const formattedMessage = this.formatter.format(logRecord)

    console.log(formattedMessage)
  }
}

export interface FileWriterStrategy {
  appendFile(basePath: string, formattedMessage: string): Promise<void>
}

export class XMLWriterStrategy implements FileWriterStrategy {
  async appendFile(basePath: string, formattedMessage: string): Promise<void> {
    const today = yyyymmdd_hh()
    const dirPath = path.join(basePath, 'xml')
    const filePath = path.join(dirPath, `${today}.xml`)

    try {
      await fsPromise.mkdir(dirPath, { recursive: true })
      await fsPromise.appendFile(filePath, formattedMessage + '\n', 'utf8')
    } catch (e) {
      console.error("Failed to append to file:", e)
      throw e
    }
  }
}

export class JsonWriterStrategy implements FileWriterStrategy {
  async appendFile(basePath: string, formattedMessage: string): Promise<void> {
    const today = yyyymmdd()
    const dirPath = path.join(basePath, 'json')
    const filePath = path.join(dirPath, `${today}.json`)

    try {
      await fsPromise.mkdir(dirPath, { recursive: true })
      await fsPromise.appendFile(filePath, formattedMessage + '\n', 'utf8')
    } catch (error) {
      console.error("Failed to append to file:", error)
      throw error
    }
  }
}

export class JsonThreadSafeBatchWriterStrategy implements FileWriterStrategy {
  private buffer: string[] = []
  private readonly bufferLimit: number
  private isFlushing: boolean = false

  constructor(bufferLimit: number = 100) {
    this.bufferLimit = bufferLimit
  }

  async appendFile(basePath: string, formattedMessage: string): Promise<void> {
    this.buffer.push(formattedMessage)
    console.log("Buffer length:", this.buffer.length)
    if (this.buffer.length >= this.bufferLimit) {
      console.log("Flushing...")
      await this.flush(basePath)
    }
  }

  async flush(basePath: string): Promise<void> {
    if (this.isFlushing) return

    this.isFlushing = true

    const today = yyyymmdd()
    const dirPath = path.join(basePath, 'json')
    const filePath = path.join(dirPath, `${today}.json`)
    let release

    try {
      await fsPromise.mkdir(dirPath, { recursive: true })
      await ensureFileExists(filePath)
      release = await properLockfile.lock(filePath, { retries: { retries: 10, maxTimeout: 1000 } })

      const data = this.buffer.join('\n') + '\n'
      await fsPromise.appendFile(filePath, data, 'utf8')
    } catch (error) {
      console.error("Failed to append to file:", error)
      throw error
    } finally {
      if (release) {
        await release()
      }
      this.buffer = []
      this.isFlushing = false
    }
  }
}