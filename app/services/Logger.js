const moment = require('moment');
const winston = require('winston');
const { jsonStringify } = require('../helpers/utilities');
const DailyRotateFile = require('winston-daily-rotate-file');

let LOGGERS = {};

/**
 * A helper for generating logFileOptions object for daily rotating log files
 *
 * @param {string} label Log file label
 * @param {string} level Log level e.g error, info, warn
 */
const dailyLogFileHelper = (label, level) => {

	const { timestamp, splat, simple, printf, prettyPrint, combine } = winston.format;

	// Construct log options
	const logFileOptions = {
		dirname: `logs/${label}`,
		filename: `%DATE%-${label}.log`,
		datePattern: 'YYYY-MM-DD',
		zippedArchive: true,
		format: combine(
			splat(), timestamp(), // simple(), prettyPrint()
			printf(({ level, timestamp, label, message, ...meta }) => {
				const time = moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
				const json = jsonStringify(meta, 2);
				return `${time} ${level}: ${message}\r\n${json}\r\n`;
			})
		)
	}

	// Include log level in options if given
	// Return the logFileOptions object
	return level
		? { ...logFileOptions, level }
		: logFileOptions;

}

/**
 * Setup logger for the application.
 */
module.exports = {

	instance = (name = 'default') => {

		if (LOGGERS[name]) return LOGGERS[name];

		// App environment flag
		const dev = process.env.NODE_ENV !== 'production';

		// Create Winston logger with the required transports
		// DailyRotateFile transport is used
		const logger = winston.createLogger({
			level: 'info',
			transports: [
				// new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
				// new winston.transports.File({ filename: 'logs/combined.log' })
				new winston.transports.DailyRotateFile(dailyLogFileHelper('errors', 'error')),
				new winston.transports.DailyRotateFile(dailyLogFileHelper('combined', 'info'))
			],
			exceptionHandlers: [
				new winston.transports.DailyRotateFile(dailyLogFileHelper('exceptions'))
			]
		});

		// Include Console transport for development environment
		(dev) && logger.add(new winston.transports.Console({
			level: 'error',
			format: winston.format.simple()
		}));

		LOGGERS[name] = logger;

		return logger;

	}

};
