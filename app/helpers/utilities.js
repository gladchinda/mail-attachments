const fs = require('fs');
const _ = require('lodash');
const path = require('path');

/**
 * Returns a function that gets the value from an environment variable.
 * A default value or null is returned if the variable does not exist.
 *
 * @param {string} config The environment variable
 * @param {any} defaultValue The default value to be used if no value was found
 */
const env = (config, defaultValue = null) => {
	defaultValue = defaultValue || null;

	// Return default if config is not a string
	if (!_.isString(config)) return defaultValue;

	const value = process.env[config];

	// Return config value or defaultValue
	return value || defaultValue;
};

/**
 * Returns a function for creating file descriptors for the given file
 * with the flag passed in as arguments.
 *
 * @param {string} file File path
 */
const getFilePointer = file => flag => {
	const dir = path.dirname(file);

	// create directory if it doesn't exist
	!fs.existsSync(dir) && fs.mkdirSync(dir);

	// return file pointer to the file
	return fs.openSync(file, flag);
}

/**
 * Extract data from an object based on an extraction schema.
 * Returns a function that takes the schema as argument and does
 * the extraction.
 *
 * @param {object} data The object to extract from
 */
const extractFromData = data => schema => {
	return _.keys(schema).reduce((extract, key) => {

		const mapping = schema[key];

		if (_.isString(mapping)) {
			return { ...extract, [key]: data[mapping] || null }
		}

		if (_.isArray(mapping)) {
			if (mapping.filter(_.isString).length === mapping.length) {
				const extracted = mapping.map(key => data[key] || null);
				const withoutNull = extracted.filter(_.isNull).length === 0;

				return { ...extract, [key]: withoutNull ? extracted : null }
			}
		}

		return extracted;

	}, {});
}

/**
 * A generic promise rejection handler suitable for controllers.
 *
 * @param {Http.Request} req
 * @param {Http.Response} res
 */
const catchPromiseError = (req, res) => err => {

	const logger = getLogger(req.app);

	if (err instanceof Error) {
		const data = { message: err.message, stack: err.stack };

		logger.error('An unexpected error or exception occurred on the server.', data);

		return Promise.reject(res.status(500).json({
			status: 'failed',
			error: 'SERVICE_ERROR',
			message: 'An unexpected error occurred while attempting to process the request.'
		}));
	}

	return Promise.reject(err);

}

// Based on: https://gist.github.com/zmmbreeze/9408172
// Also see: http://stackoverflow.com/questions/11616630/json-stringify-avoid-typeerror-converting-circular-structure-to-json/11616993#11616993
const jsonStringify = (object, space) => {

	let cache = [];

	const json = JSON.stringify(object, function (key, value) {
		if (typeof value === 'object' && value !== null) {
			if (cache.indexOf(value) !== -1) {
				// Circular reference found, discard key
				return;
			}
			// Store value in our collection
			cache.push(value);
		}
		return value;
	}, space);

	cache = null;

	return json;

}

module.exports = {
	env,
	jsonStringify,
	getFilePointer,
	extractFromData,
	catchPromiseError
};
