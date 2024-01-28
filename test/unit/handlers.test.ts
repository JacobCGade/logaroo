import {LogLevel} from "../../lib/logaroo";
import {ConsoleHandler, FileHandler, JsonWriterStrategy, XMLWriterStrategy} from "../../lib/logaroo/handlers";
import {Formatter} from "../../lib/logaroo/formatters";
import {LogRecord} from "../../lib/logaroo/logger";
import * as fsPromises from 'fs/promises';

jest.mock('fs/promises')

const mockFormatter: Formatter = {
  format: jest.fn().mockImplementation((logRecord: LogRecord) => {
    return JSON.stringify(logRecord)
  })
}

const WriterStrategyMock = {
  appendFile: jest.fn().mockImplementation((basePath: string, message: string) => {
    return Promise.resolve()
  })
}

describe('handlers', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2024, 8, 5, 8).getTime())
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.runOnlyPendingTimersAsync()
    jest.useRealTimers()
  })

  describe('ConsoleHandler', () => {
    describe('ctor', () => {
      it('should set minLevel to arg and default to DefaultFormatter if not provided', () => {
        const handler = new ConsoleHandler(LogLevel.Warning)

        expect(handler.minLevel).toBe(LogLevel.Warning)
        expect(handler.formatter.constructor.name).toBe("DefaultFormatter")
      })

      it('should set minLevel and formatter to args', () => {
        const handler = new ConsoleHandler(LogLevel.Information, mockFormatter)

        expect(handler.minLevel).toBe(LogLevel.Information)
        expect(handler.formatter).toBe(mockFormatter)
      })
    })
    describe('log', () => {
      const handler = new ConsoleHandler(LogLevel.Information, mockFormatter)

      const logRecord = {
        timestamp: new Date().toISOString(),
        level: LogLevel.Information,
        message: "Hello, world!",
        details: { foo: "bar"}
      }

      it('should call the formatter with the logRecord', () => {
        handler.log(logRecord)

        expect(mockFormatter.format).toHaveBeenCalledWith(logRecord)
      })
      it('should log to console', () => {
        const spy = jest.spyOn(console, 'log')

        handler.log(logRecord)

        expect(spy).toBeCalledWith(JSON.stringify(logRecord))
      })
    })
  })
  describe('FileHandler', () => {
    describe('ctor', () => {
      // @ts-ignore
      jest.spyOn(fsPromises, 'stat').mockResolvedValue({ isDirectory: () => true })

      it('should set minLevel, basePath and writerStrategy to args and default to DefaultFormatter if not provided', () => {
        const handler = new FileHandler(LogLevel.Warning, "./logs", WriterStrategyMock)

        expect(handler.minLevel).toBe(LogLevel.Warning)
        expect(handler.basePath).toBe("./logs")
        expect(handler.writerStrategy).toBe(WriterStrategyMock)
        expect(handler.formatter.constructor.name).toBe("DefaultFormatter")
      })
      it('should set minLevel, basePath, writerStrategy and formatter to args', () => {
        const handler = new FileHandler(LogLevel.Information, "./logs", WriterStrategyMock, mockFormatter)

        expect(handler.minLevel).toBe(LogLevel.Information)
        expect(handler.basePath).toBe("./logs")
        expect(handler.writerStrategy).toBe(WriterStrategyMock)
        expect(handler.formatter).toBe(mockFormatter)
      })
    })

    describe('log', () => {
      const handler = new FileHandler(LogLevel.Information, "./logs", WriterStrategyMock, mockFormatter)

      const logRecord = {
        timestamp: new Date().toISOString(),
        level: LogLevel.Information,
        message: "Hello, world!",
        details: { foo: "bar"}
      }

      it('should call the formatter with the logRecord', () => {
        handler.log(logRecord)

        expect(mockFormatter.format).toHaveBeenCalledWith(logRecord)
      })
      it('should call the writerStrategy with the basePath and formatted message', () => {
        handler.log(logRecord)

        expect(WriterStrategyMock.appendFile).toHaveBeenCalledWith("./logs", JSON.stringify(logRecord))
      })
      it('should return if the logRecord level is less than the handler minLevel', () => {
        handler.minLevel = LogLevel.Warning

        handler.log(logRecord)

        expect(mockFormatter.format).not.toHaveBeenCalled()
        expect(WriterStrategyMock.appendFile).not.toHaveBeenCalled()
      });
    });
  })
});

describe('writer strategies', () => {
  let consoleErrorMock: jest.SpyInstance

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2024, 8, 5, 8).getTime())
    consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.runOnlyPendingTimersAsync()
    jest.useRealTimers()
    consoleErrorMock.mockRestore()
  })

  describe('XMLWriterStrategy', () => {
    const xmlWriterStrategy = new XMLWriterStrategy()

    describe('appendFile', () => {
      it('should call fsPromises.appendFile with the basePath and formatted message', async () => {
        await xmlWriterStrategy.appendFile("./logs", "<log>message</log>")

        expect(fsPromises.appendFile).toHaveBeenCalledWith("logs/xml/20240905_08.xml", "<log>message</log>" + "\n", 'utf8')
      })
      it('should console log the error and rethrow it if fsPromises.appendFile throws an error', async () => {
        const error = new Error("Something went wrong")
        jest.spyOn(fsPromises, 'appendFile').mockRejectedValue(error)
        const spy = jest.spyOn(console, 'error')

        await expect(xmlWriterStrategy.appendFile("./logs", "<log>message</log>")).rejects.toThrow(error);

        expect(spy).toHaveBeenCalledWith("Failed to append to file:", error)
      })
      it('should write to the right log file if the hour changes', async () => {
        jest.setSystemTime(new Date(2024, 8, 5, 11).getTime())
        jest.spyOn(fsPromises, 'appendFile').mockResolvedValue()

        await xmlWriterStrategy.appendFile("./logs", "<log>message</log>")

        expect(fsPromises.appendFile).toHaveBeenCalledWith("logs/xml/20240905_11.xml", "<log>message</log>" + "\n", 'utf8')
      })
    })
  })

  describe('JSONWriterStrategy', () => {
    const jsonWriterStrategy = new JsonWriterStrategy()

    describe('appendFile', () => {
      it('should call fsPromises.appendFile with the right filepath and formatted message', async () => {
        await jsonWriterStrategy.appendFile("./logs", "{\"foo\":\"bar\"}")

        expect(fsPromises.appendFile).toHaveBeenCalledWith("logs/json/20240905.json", "{\"foo\":\"bar\"}" + "\n", 'utf8')
      })
      it('should console log the error and rethrow it if fsPromises.appendFile throws an error', async () => {
        const error = new Error("Something went wrong")
        jest.spyOn(fsPromises, 'appendFile').mockRejectedValue(error)
        const spy = jest.spyOn(console, 'error')

        await expect(jsonWriterStrategy.appendFile("./logs", "{\"foo\":\"bar\"}")).rejects.toThrow(error);

        expect(spy).toHaveBeenCalledWith("Failed to append to file:", error)
      })
      it('should write to the right log file if the date changes', async () => {
        jest.setSystemTime(new Date(2024, 8, 6, 8).getTime())
        jest.spyOn(fsPromises, 'appendFile').mockResolvedValue()

        await jsonWriterStrategy.appendFile("./logs", "{\"foo\":\"bar\"}")

        expect(fsPromises.appendFile).toHaveBeenCalledWith("logs/json/20240906.json", "{\"foo\":\"bar\"}" + "\n", 'utf8')
      })
    })
  })
});