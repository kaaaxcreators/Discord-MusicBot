import { appendFileSync } from 'fs';
import moment from 'moment';
import { ILogObject, Logger } from 'tslog';

// Create Logger
const log: Logger = new Logger({ displayFunctionName: false, dateTimeTimezone: 'UTC' });

const logFileName = process.env.LOG || 'logs.log';

/**
 * Save Log to File
 * @param  {ILogObject} logObject
 */
function logToTransport(logObject: ILogObject): void {
  appendFileSync(logFileName, formatLog(logObject) + ',\n');
}

/**
 * Formats Log as JSON
 * @param  {ILogObject} logObject
 */
function formatLog(logObject: ILogObject): string {
  const format = {
    date: moment(logObject.date.toISOString()).format('YYYY-MM-DD HH:MM:SS'),
    logLevel: logObject.logLevel,
    filePath: logObject.filePath + ':' + logObject.lineNumber + ':' + logObject.columnNumber,
    content: logObject.argumentsArray.join(', ')
  };
  return (
    '[' +
    format.date +
    ']' +
    ' ' +
    format.logLevel +
    ' "' +
    format.filePath +
    '" "' +
    format.content +
    '"'
  );
}

// Creates the Transport
log.attachTransport(
  {
    silly: logToTransport,
    debug: logToTransport,
    trace: logToTransport,
    info: logToTransport,
    warn: logToTransport,
    error: logToTransport,
    fatal: logToTransport
  },
  'debug'
);

export default log;
