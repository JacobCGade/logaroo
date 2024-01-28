import { Formatter, DefaultFormatter, XMLFormatter, JsonFormatter } from "../../lib/logaroo/formatters";
import { LogLevel, LogRecord } from "../../lib/logaroo/logger";
import {describe} from "node:test";
import {create} from "xmlbuilder2";


describe('Formatter', () => {
  describe('DefaultFormatter', () => {

    const formatter: Formatter = new DefaultFormatter()

    const testCases: LogRecord[] = [
      {timestamp: new Date().toISOString(), level: LogLevel.Information, message: 'some message'},
      {timestamp: new Date().toISOString(), level: LogLevel.Verbose, message: ''},
      {timestamp: new Date().toISOString(), level: LogLevel.Debug, message: 'some message', details: {foo: 'bar'}},
      {timestamp: new Date().toISOString(), level: LogLevel.Error, message: 'some message', details: new Error('some error')}
    ]

    it.each(testCases)('formatted message should contain a ISO 8601 timestamp', (logRecord) => {
      const formattedMessage = formatter.format(logRecord);

      // Pattern to match ISO 8601 timestamp within the string
      const timeStampPattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/;

      expect(formattedMessage).toMatch(timeStampPattern);
    })

    it.each(testCases)('formatted message should contain the log level', (logRecord) => {
      const formattedMessage = formatter.format(logRecord);

      const logLevelPattern = new RegExp(`\\[${LogLevel[logRecord.level].toUpperCase()}\\]`);

      expect(formattedMessage).toMatch(logLevelPattern);
    })

    it.each(testCases)('formatted message should contain the log message', (logRecord) => {
      const formattedMessage = formatter.format(logRecord);

      const logMessagePattern = new RegExp(`${logRecord.message}`);

      expect(formattedMessage).toMatch(logMessagePattern);
    })

    it.each(testCases)('formatted message should contain the details', (logRecord) => {
      const formattedMessage = formatter.format(logRecord);

      let detailsPattern = '';

      if (logRecord.details instanceof Error) {
        detailsPattern = `\\s+ERROR: \\{[\\s\\S]*"message": "${logRecord.details.message}"[\\s\\S]*\\}`;
      } else if (logRecord.details) {
        detailsPattern = `\\s+Details: \\{[\\s\\S]*\\}`;
      }

      const detailsRegex = new RegExp(detailsPattern);

      expect(formattedMessage).toMatch(detailsRegex);
    })
  })

  describe('JsonFormatter', () => {
    const formatter: Formatter = new JsonFormatter()

    it('should format the log record as a json string', () => {
      const logRecord: LogRecord = {timestamp: new Date().toISOString(), level: LogLevel.Information, message: 'some message', details: {foo: 'bar'}}

      const formattedMessage = formatter.format(logRecord)

      expect(formattedMessage).toBe(
        `{"timestamp":"${logRecord.timestamp}","level":"${LogLevel[logRecord.level].toUpperCase()}","message":"${logRecord.message}","details":{"foo":"bar"}}`
      )
    })
  })

  describe('XMLFormatter', () => {
    const formatter: Formatter = new XMLFormatter()

    it('should format the log record as a xml string', () => {
      const logRecord: LogRecord = {
        timestamp: new Date().toISOString(),
        level: LogLevel.Information,
        message: 'some message',
        details: {foo: 'bar'}
      }

      const formattedMessage = formatter.format(logRecord)

      const expectedXML = create({version: '1.0'})
        .ele('log')
        .ele('timestamp').txt(logRecord.timestamp).up()
        .ele('level').txt(LogLevel[logRecord.level].toUpperCase()).up()
        .ele('message').txt(logRecord.message).up()
        .ele('details').txt(JSON.stringify(logRecord.details, null, 2)).up().end({prettyPrint: true})

      expect(formattedMessage).toBe(expectedXML)
    })
  })
});