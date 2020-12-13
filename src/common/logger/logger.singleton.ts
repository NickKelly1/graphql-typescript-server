import 'winston-daily-rotate-file';
import { Writable } from 'stream';
import path from 'path';
import fs from 'fs';
import { DIR_ROOT } from '../../dir.root';
import { EnvSingleton } from '../../env/env.singleton';
import winston from 'winston';
import { prettyQ } from '../helpers/pretty.helper';

// create log directory if not exist
const logDirectory = path.join(DIR_ROOT, EnvSingleton.LOG_DIR);
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
  if (!fs.existsSync(logDirectory)) {
    throw new Error(`Failed to create logDirectory: ${logDirectory}`);
  }
}

const nocolorFormat = winston.format.combine(
  winston.format.uncolorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.align(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...args } = info;
    return `${timestamp} [${level}]: ${message} ${Object.keys(args).length ? prettyQ(args) : ''}`.trim();
  }),
)

const colorFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.align(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...args } = info;
    const ts = timestamp.slice(0, 19).replace('T', ' ') ;
    return `${timestamp} [${level}]: ${message} ${Object.keys(args).length ? prettyQ(args) : ''}`.trim();
  }),
)

// app logger config
export const logger = winston.createLogger({
  transports: [
    // new winston.transports.File({
    //   level: 'info',
    //   filename: process.env.LOG_FILE_NAME,
    //   dirname: logDirectory,
    //   handleExceptions: true,
    //   json: true,
    //   maxsize: process.env.LOG_MAX_SIZE,
    //   maxFiles: process.env.LOG_MAX_FILE,
    //   colorize: false,
    // }),

    // https://www.npmjs.com/package/winston-daily-rotate-file
    new winston.transports.DailyRotateFile({
      level: 'debug',
      dirname: logDirectory,
      filename: '%DATE%.info.log',
      datePattern: 'YYYY-MM-DD',
      // datePattern: 'YYYY-MM-DD-HH',
      zippedArchive: false,
      format: nocolorFormat,
      maxSize: EnvSingleton.LOG_MAX_SIZE,
      maxFiles: EnvSingleton.LOG_ROTATION_MAX_AGE,
    }),

    new winston.transports.DailyRotateFile({
      level: 'warn',
      dirname: logDirectory,
      filename: '%DATE%.error.log',
      datePattern: 'YYYY-MM-DD',
      // datePattern: 'YYYY-MM-DD-HH',
      zippedArchive: false,
      format: nocolorFormat,
      maxSize: EnvSingleton.LOG_MAX_SIZE,
      maxFiles: EnvSingleton.LOG_ROTATION_MAX_AGE,
    }),

    new winston.transports.Console({
      level: 'debug',
      handleExceptions: true,
      format: colorFormat,
    }),
  ],
  exitOnError: false,
});

function clean(str: string) { return str.trim().replace(/\n+%/, '').trim() }

export const loggerStream = new Writable({
  write(chunk: string | Buffer, encoding, done) {
    if (Buffer.isBuffer(chunk)) {
      // strip off morgan new lines...
      logger.info(clean(chunk.toString('utf-8')));
      return void done();
    }
    else if (typeof chunk === 'string') {
      logger.info(clean(chunk));
      return void done();
    }
    else {
      // ?
      logger.info(chunk)
      return void done();
    }
  },
})
