import {LogLevel, LogRecord} from "./logger";
import { create } from 'xmlbuilder2'


export interface Formatter {
  format(logRecord: LogRecord): string
}

export class DefaultFormatter implements Formatter {
  format(logRecord: LogRecord): string {
    let formattedMsg = `[${logRecord.timestamp}] [${LogLevel[logRecord.level].toUpperCase()}] ${logRecord.message}`

    if (logRecord.details instanceof Error) {
      const errorDetails = {
        message: logRecord.details.message,
        stackTrace: logRecord.details.stack
      };
      formattedMsg += `\nERROR: ${JSON.stringify(errorDetails, null, 2)}`;
    } else if (logRecord.details) {
      formattedMsg += `\nDetails: ${JSON.stringify(logRecord.details, null, 2)}`;
    }

    return formattedMsg
  }
}

export class JsonFormatter implements Formatter {
  format(logRecord: LogRecord): string {
    const logMessage = {
      timestamp: logRecord.timestamp,
      level: LogLevel[logRecord.level].toUpperCase(),
      message: logRecord.message,
      details: logRecord.details
    }

    return JSON.stringify(logMessage)
  }
}

export class XMLFormatter implements Formatter {
  format(logRecord: LogRecord): string {
    return create({version: '1.0'})
      .ele('log')
        .ele('timestamp').txt(logRecord.timestamp).up()
        .ele('level').txt(LogLevel[logRecord.level].toUpperCase()).up()
        .ele('message').txt(logRecord.message).up()
        .ele('details').txt(JSON.stringify(logRecord.details, null, 2)).up()
      .end({prettyPrint: true})
  }
}