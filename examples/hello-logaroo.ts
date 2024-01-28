import * as readline from 'readline';
import {Logger, LogLevel} from "../lib/logaroo/logger";
import {
  ConsoleHandler,
  FileHandler, Handler,
  JsonThreadSafeBatchWriterStrategy,
  JsonWriterStrategy,
  XMLWriterStrategy
} from "../lib/logaroo/handlers";
import {JsonFormatter, XMLFormatter} from "../lib/logaroo/formatters";

function waitForEnter(): Promise<void> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('Press "Enter" to continue...');

    rl.on('line', () => {
      rl.close();
      resolve();
    });
  });
}

async function main() {
  const logger = new Logger(LogLevel.Verbose, new Map<string, Handler>(
    [
      ['console', new ConsoleHandler(LogLevel.Verbose)],
      ['simpleJsonFile', new FileHandler(LogLevel.Information, './logs', new JsonWriterStrategy(), new JsonFormatter())]
    ]
  ));

  console.log("Logger created with log level set to 'Verbose'.")
  console.log("The console handler will log all messages.")
  console.log("The file handler will log all messages with a level of 'Information' or higher.")
  await waitForEnter();
  logger.verbose('verbose logging only to console')
  logger.info('info logging to console and file')
  logger.warning('warning logging to console and file')
  await waitForEnter()
  console.log('Adding a XML file handler that will log all messages with a level of "Warning" or higher.')
  logger.addHandler('xmlHandler', new FileHandler(LogLevel.Warning, './logs', new XMLWriterStrategy(), new XMLFormatter()))
  logger.info('info logging to console and json file')
  logger.warning('warning logging to console, json and xml file')
  await waitForEnter()
  console.log('Changing the root loggers level to "Warning"')
  logger.setMinLevel(LogLevel.Warning)
  console.log('All handlers will now only log messages with a level of "Warning" or higher.')
  logger.info('info log won\'t be logged')
  logger.warning('warning logging to console, json and xml file')
  await waitForEnter()
  console.log('Resetting level to verbose for root logger...')
  logger.setMinLevel(LogLevel.Verbose)
  console.log('A details object, could be an exception/error object, can be passed as the second argument to the log methods.')
  logger.info('info log with details', {foo: 'bar'})
  logger.error('error log with details', new Error('some error'))
  await waitForEnter()
  console.log('Let\s replace the current json file handler with a more sophisticated one\n implementing a buffer and logging in batches.')
  logger.removeHandler('simpleJsonFile')
  logger.addHandler('complexJsonHandler', new FileHandler(LogLevel.Information, './logs/newLogs', new JsonThreadSafeBatchWriterStrategy(3), new JsonFormatter()))
  console.log('The file handler will log all messages with a level of "Information" or higher and has a Buffer size of 3.')
  logger.info('info log 1')
  logger.info('info log 2')
  console.log('The buffer is now almost full and will be flushed to the file after pressing enter.')
  await waitForEnter()
  logger.info('info log 3')
}

main().then(() => console.log('Program execution finished.'));
