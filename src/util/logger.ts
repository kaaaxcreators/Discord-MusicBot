import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'fs';
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
  if (!existsSync(logFileName) && logFileName.split('.')[1] == 'json') {
    appendFileSync(logFileName, '[');
  }
  appendFileSync(logFileName, formatLog(logObject) + ',\n');
}
/**
 * Modifies json on exit
 */
function exit(): void {
  try {
    if (!existsSync(logFileName)) {
      throw 'File does not exist';
    }
    // Remove Last 2 Characters from string
    if (logFileName.split('.')[1] == 'json') {
      let text = readFileSync(logFileName);
      text = text.slice(0, text.length - 2);
      writeFileSync(logFileName, text);
      appendFileSync(logFileName, ']\n');
    }
  } finally {
    process.exit();
  }
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
export { exit, logFileName };
