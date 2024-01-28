import {Logger, LogLevel} from "../../lib/logaroo/logger";
import {Handler} from "../../lib/logaroo/handlers";
import {Formatter} from "../../lib/logaroo/formatters";

describe('Logger', () => {
  describe('Specifying log level', () => {
    // Define test cases as [minLevel, expectedCallCount]
    const testCases: [LogLevel, number][] = [
      [LogLevel.Fatal, 1],
      [LogLevel.Error, 2],
      [LogLevel.Warning, 3],
      [LogLevel.Information, 4],
      [LogLevel.Debug, 5],
      [LogLevel.Verbose, 6]
    ];

    it.each(testCases)('should log messages with a level greater than or equal to the min level', (minLevel, expectedCallCount) => {
      const mockFormatter: Formatter = {
        format: jest.fn()
      }
      const mockHandler: Handler = {
        minLevel: LogLevel.Information,
        formatter: mockFormatter,
        log: jest.fn()
      }

      const logger = new Logger(minLevel, new Map<string, Handler>([['mockHandler', mockHandler]]))

      logger.verbose('verbose')
      logger.debug('debug')
      logger.info('info')
      logger.warning('warning')
      logger.error('error')
      logger.fatal('fatal')

      expect(mockHandler.log).toHaveBeenCalledTimes(expectedCallCount)
      for (let i = 0; i < expectedCallCount; i++) {
        expect(mockHandler.log).toHaveBeenNthCalledWith(i + 1, expect.objectContaining({level: minLevel + i, message: expect.any(String)}))
      }
    })

    it('should be able to optional to pass a details object like an error', () => {
      const mockFormatter: Formatter = {
        format: jest.fn()
      }
      const mockHandler: Handler = {
        minLevel: LogLevel.Information,
        formatter: mockFormatter,
        log: jest.fn()
      }

      const logger = new Logger(LogLevel.Information, new Map<string, Handler>([['mockHandler', mockHandler]]))

      logger.info('info', {foo: 'bar'})
      logger.info('info', new Error('some error'))
      logger.info('no details')

      expect(mockHandler.log).toHaveBeenCalledTimes(3)
      expect(mockHandler.log).toHaveBeenNthCalledWith(1, expect.objectContaining({ details: {foo: 'bar'}}))
      expect(mockHandler.log).toHaveBeenNthCalledWith(2, expect.objectContaining({ details: expect.any(Error)}))
      expect(mockHandler.log).toHaveBeenNthCalledWith(3, expect.objectContaining({ details: undefined}))
    })
  })
  describe('Multiple handlers', () => {
    const mockFormatter: Formatter = {
      format: jest.fn()
    }
    const mockHandler1: Handler = {
      minLevel: LogLevel.Information,
      formatter: mockFormatter,
      log: jest.fn()
    }
    const mockHandler2: Handler = {
      minLevel: LogLevel.Information,
      formatter: mockFormatter,
      log: jest.fn()
    }

    const logger = new Logger(LogLevel.Information, new Map<string, Handler>([['mockHandler1', mockHandler1], ['mockHandler2', mockHandler2]]))

    it('should call log on all handlers', () => {
      logger.info('info')

      expect(mockHandler1.log).toHaveBeenCalledTimes(1)
      expect(mockHandler1.log).toHaveBeenNthCalledWith(1, expect.objectContaining({level: LogLevel.Information, message: 'info'}))
      expect(mockHandler2.log).toHaveBeenCalledTimes(1)
      expect(mockHandler2.log).toHaveBeenNthCalledWith(1, expect.objectContaining({level: LogLevel.Information, message: 'info'}))
    })
  })
})